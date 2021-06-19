import CID from "cids";
import multihashing from "multihashing-async";

import * as Actions from "~/common/actions";
import * as Store from "~/common/store";
import * as Constants from "~/common/constants";
import * as Credentials from "~/common/credentials";
import * as Strings from "~/common/strings";
import * as Validations from "~/common/validations";
import * as Events from "~/common/custom-events";
import * as Logging from "~/common/logging";
import * as UserBehaviors from "~/common/user-behaviors";
import * as Window from "~/common/window";

import { encode } from "blurhash";

const STAGING_DEAL_BUCKET = "stage-deal";

export const fileKey = ({ lastModified, name }) => `${lastModified}-${name}`;

const loadImage = async (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = (...args) => reject(args);
    img.src = src;
  });

const getImageData = (image) => {
  let ratio = Math.min(100 / image.height, 100 / image.width);
  image.height = image.height * ratio;
  image.width = image.width * ratio;
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  context.scale(ratio, ratio);
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, image.width, image.height);
};

const encodeImageToBlurhash = async (imageUrl) => {
  const image = await loadImage(imageUrl);
  const imageData = getImageData(image);
  return encode(imageData.data, imageData.width, imageData.height, 4, 4);
};

// NOTE(jim): We're speaking to a different server now.
const getCookie = (name) => {
  var match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return match[2];
};

export const uploadLink = async ({ url, slate, resources }) => {
  const mql = await Actions.mql(url);
  if (!mql) return;
  if (mql.status !== "success") {
    Events.dispatchMessage({ message: "Invalid link" });
    return;
  }
  const { data } = mql;
  const bytes = new TextEncoder().encode(url);
  const hash = await multihashing(bytes, "sha2-256");
  const cid = new CID(1, "dag-pb", hash);
  const filename = Strings.createSlug(data.title);

  const file = {
    filename,
    cid: cid.toString(),
    data: {
      type: "link",
      size: 0,
      name: data.title,
      author: data.author,
      source: data.publisher,
      body: data.description,
      coverImage: {
        data: {
          type: "image/png",
          size: data.screenshot.size,
          url: data.screenshot.url,
        },
      },
      link: {
        url: data.url,
        image: data.image.url,
        logo: data.logo.url,
      },
    },
  };
  console.log(file);
  let createResponse = await Actions.createFile({ file, slate });
  console.log(createResponse);
  if (Events.hasError(createResponse)) {
    return;
  }

  const { added, skipped, files } = createResponse.data;
  if (added) {
    Events.dispatchMessage({ message: "Link added", status: "INFO" });
  } else if (skipped) {
    Events.dispatchMessage({
      message: "You've already saved this link",
    });
    return;
  }
  const fileId = files && files.length ? files[0].id : null;
  console.log(fileId);
  if (!fileId) return;

  const REQUEST_HEADERS = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: getCookie(Credentials.session.key),
  };

  try {
    const response = await fetch(`${resources.upload}/api/data/url`, {
      method: "POST",
      headers: REQUEST_HEADERS,
      credentials: "omit",
      body: JSON.stringify({
        data: {
          url: data.screenshot.url,
          targetId: fileId,
          updateType: "COVER_IMAGE_URL",
        },
      }),
    });
    const json = await response.json();

    return json;
  } catch (e) {
    console.log(e);
  }

  // Actions.uploadFromUrl({
  //   url: data.screenshot.url,
  //   targetId: createResponse.id,
  //   updateType: "COVER_IMAGE_URL",
  //   resourceURI: resources.upload,
  // });
};

export const uploadFiles = async ({ context, files, slate, keys, numFailed = 0 }) => {
  if (!files || !files.length) {
    context._handleRegisterLoadingFinished({ keys });
    return;
  }

  const resolvedFiles = [];
  for (let i = 0; i < files.length; i++) {
    const currentFileKey = fileKey(files[i]);
    if (Store.checkCancelled(currentFileKey)) {
      continue;
    }

    // NOTE(jim): With so many failures, probably good to wait a few seconds.
    await Window.delay(3000);

    // NOTE(jim): Sends XHR request.
    let response;
    try {
      response = await upload({
        file: files[i],
        context,
      });
    } catch (e) {
      Logging.error(e);
    }

    if (!response || response.error) {
      continue;
    }
    resolvedFiles.push(response);
  }

  if (!resolvedFiles.length) {
    context._handleRegisterLoadingFinished({ keys });
    return;
  }
  //NOTE(martina): this commented out portion is only for if parallel uploading
  // let responses = await Promise.allSettled(resolvedFiles);
  // let succeeded = responses
  //   .filter((res) => {
  //     return res.status === "fulfilled" && res.value && !res.value.error;
  //   })
  //   .map((res) => res.value);

  let createResponse = await Actions.createFile({ files: resolvedFiles, slate });

  if (Events.hasError(createResponse)) {
    context._handleRegisterLoadingFinished({ keys });
    return;
  }

  const { added, skipped } = createResponse.data;

  let message = Strings.formatAsUploadMessage(added, skipped + numFailed, slate);
  Events.dispatchMessage({ message, status: !added ? null : "INFO" });

  context._handleRegisterLoadingFinished({ keys });
};

export const upload = async ({ file, context, bucketName }) => {
  const currentFileKey = fileKey(file);
  let formData = new FormData();
  const HEIC2ANY = require("heic2any");

  // NOTE(jim): You must provide a file from an type="file" input field.
  if (!file) {
    return null;
  }

  const isZipFile =
    file.type.startsWith("application/zip") || file.type.startsWith("application/x-zip-compressed");
  const isUnityFile = await Validations.isUnityFile(file);

  // TODO(jim): Put this somewhere else to handle conversion cases.
  if (file.type.startsWith("image/heic")) {
    const converted = await HEIC2ANY({
      blob: file,
      toType: "image/png",
      quality: 1,
    }); //TODO(martina): figure out how to cancel an await if upload has been cancelled

    formData.append("data", converted);
  } else {
    formData.append("data", file);
  }

  if (Store.checkCancelled(currentFileKey)) {
    return;
  }

  const _privateUploadMethod = (path, file) =>
    new Promise((resolve, reject) => {
      const XHR = new XMLHttpRequest();

      window.addEventListener(`cancel-${currentFileKey}`, () => {
        XHR.abort();
      });

      XHR.open("post", path, true);
      XHR.setRequestHeader("authorization", getCookie(Credentials.session.key));
      XHR.onerror = (event) => {
        Logging.error(event);
        XHR.abort();
      };

      // NOTE(jim): UPLOADS ONLY.
      XHR.upload.addEventListener(
        "progress",
        (event) => {
          if (!context) {
            return;
          }

          if (event.lengthComputable) {
            Logging.log("FILE UPLOAD PROGRESS", event);
            context.setState({
              fileLoading: {
                ...context.state.fileLoading,
                [currentFileKey]: {
                  name: file.name,
                  loaded: event.loaded,
                  total: event.total,
                },
              },
            });
          }
        },
        false
      );

      window.removeEventListener(`cancel-${currentFileKey}`, () => XHR.abort());

      XHR.onloadend = (event) => {
        Logging.log("FILE UPLOAD END", event);
        try {
          return resolve(JSON.parse(event.target.response));
        } catch (e) {
          return resolve({
            error: "SERVER_UPLOAD_ERROR",
          });
        }
      };
      XHR.send(formData);
    });
  const resources = context.props.resources;
  const storageDealRoute = resources?.storageDealUpload
    ? `${resources.storageDealUpload}/api/deal/`
    : null;
  const generalRoute = resources?.upload ? `${resources.upload}/api/data/` : null;
  const zipUploadRoute = resources?.uploadZip ? `${resources.uploadZip}/api/data/zip/` : null;

  if (!storageDealRoute || !generalRoute || !zipUploadRoute) {
    Events.dispatchMessage({ message: "We could not find our upload server." });

    return {
      decorator: "NO_UPLOAD_RESOURCE_URI_ATTACHED",
      error: true,
    };
  }

  let res;
  if (isZipFile && isUnityFile) {
    res = await _privateUploadMethod(`${zipUploadRoute}${file.name}`, file);
  } else if (bucketName && bucketName === STAGING_DEAL_BUCKET) {
    res = await _privateUploadMethod(`${storageDealRoute}${file.name}`, file);
  } else {
    res = await _privateUploadMethod(`${generalRoute}${file.name}`, file);
  }

  if (!res?.data || res.error) {
    if (context) {
      await context.setState({
        fileLoading: {
          ...context.state.fileLoading,
          [`${file.lastModified}-${file.name}`]: {
            name: file.name,
            failed: true,
          },
        },
      });
    }
    Events.dispatchMessage({ message: "Some of your files could not be uploaded" });

    return !res ? { decorator: "NO_RESPONSE_FROM_SERVER", error: true } : res;
  }

  let item = res.data.data;
  if (item.data.type.startsWith("image/")) {
    let url = Strings.getURLfromCID(item.cid);
    try {
      let blurhash = await encodeImageToBlurhash(url);
      item.data.blurhash = blurhash;
    } catch (e) {
      Logging.error(e);
    }
  }

  return item;
};

export const formatPastedImages = ({ clipboardItems }) => {
  let files = [];
  let fileLoading = {};
  for (let i = 0; i < clipboardItems.length; i++) {
    // Note(Amine): skip content if it's not an image
    if (clipboardItems[i].type.indexOf("image") === -1) continue;
    const file = clipboardItems[i].getAsFile();
    files.push(file);
    fileLoading[`${file.lastModified}-${file.name}`] = {
      name: file.name,
      loaded: 0,
      total: file.size,
    };
  }
  return { fileLoading, toUpload: files };
};

export const formatDroppedFiles = async ({ dataTransfer }) => {
  // NOTE(jim): If this is true, then drag and drop came from a slate object.
  const data = dataTransfer.getData("slate-object-drag-data");
  if (data) {
    return;
  }

  const files = [];
  let fileLoading = {};
  if (dataTransfer.items && dataTransfer.items.length) {
    for (var i = 0; i < dataTransfer.items.length; i++) {
      const data = dataTransfer.items[i];

      let file = null;
      if (data.kind === "file") {
        file = data.getAsFile();
      } else if (data.kind == "string" && data.type == "text/uri-list") {
        try {
          const dataAsString = new Promise((resolve, reject) =>
            data.getAsString((d) => resolve(d))
          );
          const resp = await fetch(await dataAsString);
          const blob = resp.blob();

          file = new File(blob, `data-${uuid()}`);
          file.name = `data-${uuid()}`;
        } catch (e) {
          Events.dispatchMessage({
            message: "File type not supported. Please try a different file",
          });

          return { error: true };
        }
      }

      files.push(file);
      fileLoading[`${file.lastModified}-${file.name}`] = {
        name: file.name,
        loaded: 0,
        total: file.size,
      };
    }
  }

  if (!files.length) {
    Events.dispatchMessage({ message: "File type not supported. Please try a different file" });
  }

  return { fileLoading, files, numFailed: dataTransfer.items.length - files.length };
};

export const formatUploadedFiles = ({ files }) => {
  let toUpload = [];
  let fileLoading = {};
  for (let i = 0; i < files.length; i++) {
    let file = files[i];

    if (!file) {
      continue;
    }

    toUpload.push(file);
    fileLoading[fileKey(file)] = {
      name: file.name,
      loaded: 0,
      total: file.size,
    };
  }

  if (!toUpload.length) {
    Events.dispatchMessage({ message: "We could not find any files to upload." });
    return false;
  }

  return { toUpload, fileLoading, numFailed: files.length - toUpload.length };
};
