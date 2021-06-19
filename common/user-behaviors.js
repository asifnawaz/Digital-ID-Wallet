import * as Websockets from "~/common/browser-websockets";
import * as Credentials from "~/common/credentials";
import * as Actions from "~/common/actions";
import * as Window from "~/common/window";
import * as Validations from "~/common/validations";
import * as Strings from "~/common/strings";
import * as Store from "~/common/store";
import * as FileUtilities from "~/common/file-utilities";
import * as Events from "~/common/custom-events";

import Cookies from "universal-cookie";
import JSZip from "jszip";

import { v4 as uuid } from "uuid";
import { saveAs } from "file-saver";

//NOTE(martina): this file is for utility *API-calling* functions
//For non API related utility functions, see common/utilities.js
//And for uploading related utility functions, see common/file-utilities.js

const cookies = new Cookies();

export const authenticate = async (state) => {
  // NOTE(jim): Kills existing session cookie if there is one.
  const jwt = cookies.get(Credentials.session.key);

  if (jwt) {
    cookies.remove(Credentials.session.key, {
      path: "/",
      maxAge: 3600 * 24 * 7,
      sameSite: "strict",
    });
  }

  let response = await Actions.signIn(state);
  if (!response || response.error) {
    return response;
  }

  if (response.token) {
    // NOTE(jim):
    // + One week.
    // + Only requests to the same site.
    // + Not using sessionStorage so the cookie doesn't leave when the browser dies.
    cookies.set(Credentials.session.key, response.token, {
      path: "/",
      maxAge: 3600 * 24 * 7,
      sameSite: "strict",
    });
  }

  return response;
};

export const authenticateViaTwitter = (response) => {
  // NOTE(jim): Kills existing session cookie if there is one.
  const jwt = cookies.get(Credentials.session.key);

  if (jwt) {
    cookies.remove(Credentials.session.key, {
      path: "/",
      maxAge: 3600 * 24 * 7,
      sameSite: "strict",
    });
  }

  if (Events.hasError(response)) {
    return false;
  }

  if (response.token) {
    // NOTE(jim):
    // + One week.
    // + Only requests to the same site.
    // + Not using sessionStorage so the cookie doesn't leave when the browser dies.
    cookies.set(Credentials.session.key, response.token, {
      path: "/",
      maxAge: 3600 * 24 * 7,
      sameSite: "strict",
    });
  }

  return response;
};

// NOTE(jim): Signs a user out and redirects to the sign in screen.
export const signOut = async ({ viewer }) => {
  let wsclient = Websockets.getClient();
  if (wsclient) {
    wsclient.send(JSON.stringify({ type: "UNSUBSCRIBE_VIEWER", data: viewer }));

    await Websockets.deleteClient();
    wsclient = null;
  }

  const jwt = cookies.get(Credentials.session.key);
  if (jwt) {
    cookies.remove(Credentials.session.key, {
      path: "/",
      maxAge: 3600 * 24 * 7,
      sameSite: "strict",
    });
  }

  window.location.replace("/_/auth");
  return;
};

// NOTE(jim): Permanently deletes you, forever.
export const deleteMe = async ({ viewer }) => {
  await Actions.updateSearch("delete-user");

  let response = await Actions.deleteViewer();

  if (Events.hasError(response)) {
    return response;
  }

  await signOut({ viewer });

  // let wsclient = Websockets.getClient();
  // if (wsclient) {
  //   await Websockets.deleteClient();
  //   wsclient = null;
  // }

  return response;
};

export const hydrate = async () => {
  const response = await Actions.hydrateAuthenticatedUser();

  if (Events.hasError(response)) {
    return null;
  }

  return JSON.parse(JSON.stringify(response.data));
};

export const uploadImage = async (file, resources) => {
  if (!file) {
    Events.dispatchMessage({ message: "Something went wrong with the upload. Please try again" });
    return;
  }

  if (!Validations.isPreviewableImage(file.type)) {
    Events.dispatchMessage({ message: "Upload failed. Only images and gifs are allowed" });
    return;
  }

  const response = await FileUtilities.upload({ file, routes: resources });

  if (Events.hasError(response)) {
    return false;
  }

  return response;
};

export const deleteFiles = async (fileIds = [], noAlert) => {
  let ids = Array.isArray(fileIds) ? fileIds : [fileIds];

  const response = await Actions.deleteFiles({ ids });

  if (!noAlert) {
    if (Events.hasError(response)) {
      return false;
    }

    Events.dispatchMessage({ message: "Files successfully deleted!", status: "INFO" });

    return response;
  }
};

export const removeFromSlate = async ({ slate, ids }) => {
  const response = await Actions.removeFileFromSlate({
    slateId: slate.id,
    ids,
  });

  if (Events.hasError(response)) {
    return false;
  }

  return response;
};

// export const addToSlate = async ({ slate, files }) => {
//   const addResponse = await Actions.addFileToSlate({ slate, files });

//   if (Events.hasError(addResponse)) {
//     return false;
//   }

//   const { added, skipped } = addResponse;
//   let message = Strings.formatAsUploadMessage(added, skipped, true);
//   Events.dispatchMessage({ message, status: !added ? null : "INFO" });
//   return true;
// };

//NOTE(martina): save copy includes add to slate now. If it's already in the user's files but not in that slate, it'll skip the adding to files and just add to slate
export const saveCopy = async ({ files, slate }) => {
  let response = await Actions.saveCopy({ files, slate });
  console.log("after this");
  if (Events.hasError(response)) {
    console.log("returning false");
    return false;
  }
  let message = Strings.formatAsUploadMessage(response.data.added, response.data.skipped, slate);
  Events.dispatchMessage({ message, status: !response.data.added ? null : "INFO" });
  return response;
};

export const download = async (file) => {
  Actions.createDownloadActivity({ file });
  if (Validations.isLinkType(file.data.type)) return;
  if (Validations.isUnityType(file.data.type)) {
    return await downloadZip(file);
  }
  let uri = Strings.getURLfromCID(file.cid);
  Window.saveAs(uri, file.filename);
  return { data: true };
};

export const downloadZip = async (file) => {
  try {
    const { data } = await Actions.getZipFilePaths(file);
    const filesPaths = data.filesPaths.map((item) => item.replace(`/${file.id}/`, ""));
    const baseUrl = Strings.getURLfromCID(file.cid);
    const zipFileName = file.filename;

    let zip = new JSZip();

    await Promise.all(
      filesPaths.map(async (filePath) => {
        let url = `${baseUrl}/${filePath}`;
        const blob = await Window.getBlobFromUrl(url);

        zip.file(filePath, blob);
      })
    );

    zip.generateAsync({ type: "blob" }).then((blob) => {
      saveAs(blob, zipFileName);
    });

    return {
      decorator: "UNITY_ZIP_DOWNLOAD_SUCCESS",
      error: false,
    };
  } catch (e) {
    return {
      decorator: "UNITY_ZIP_DOWNLOAD_FAILED",
      error: true,
    };
  }
};

const _nativeDownload = ({ url, onError }) => {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = url;

  const ERROR_MESSAGE = "SLATE_DOWNLOAD_ERROR";
  const handleIframeErrors = (e) => {
    if (e.data === ERROR_MESSAGE && onError) {
      onError(e.data);
    }
  };
  window.addEventListener("message", handleIframeErrors);
  iframe.onload = (e) => window.removeEventListener("message", handleIframeErrors);

  document.body.appendChild(iframe);
};

export const compressAndDownloadFiles = async ({ files, name = "slate.zip", resourceURI }) => {
  const errorMessage = "Something went wrong with the download. Please try again";
  try {
    if (!files || files.length == 0) {
      Events.dispatchMessage({ message: "No files in collection to download" });
      return;
    }
    Events.dispatchMessage({ message: "We're preparing your files to download", status: "INFO" });
    let downloadFiles = [];
    for (const file of files) {
      if (Validations.isLinkType(file.data.type)) continue;
      if (Validations.isUnityType(file.data.type)) {
        const { data } = await Actions.getZipFilePaths(file);
        const unityFiles = data.filesPaths.map((item) => ({
          url: item.replace(`/${file.id}/`, `${Strings.getURLfromCID(file.cid)}/`),
          name: item.replace(`/${file.id}/`, `/${file.filename}/`),
        }));

        downloadFiles = downloadFiles.concat(unityFiles);
        continue;
      }

      downloadFiles.push({
        name: file.filename,
        url: Strings.getURLfromCID(file.cid),
      });
    }
    if (downloadFiles.length == 0) {
      Events.dispatchMessage({
        message: "Links cannot be downloaded",
      });
      return;
    }

    Actions.createDownloadActivity({ files });
    const res = await Actions.createZipToken({ files: downloadFiles, resourceURI });
    const downloadLink = Actions.downloadZip({ token: res.data.token, name, resourceURI });
    await _nativeDownload({
      url: downloadLink,
      onError: (err) =>
        Events.dispatchMessage({
          message: errorMessage,
        }),
    });
  } catch (e) {
    console.error(e);
    Events.dispatchMessage({ message: errorMessage });
  }
};

// export const createSlate = async (data) => {
//   let response = await Actions.createSlate({
//     name: data.name,
//     isPublic: data.isPublic,
//     body: data.body,
//   });
//   return response;
// }

// export const createWalletAddress = async (data) => {
//   let response = await Actions.updateViewer({
//     type: "CREATE_FILECOIN_ADDRESS",
//     address: {
//       name: data.name,
//       type: data.wallet_type,
//       makeDefault: data.makeDefault,
//     },
//   });
//   return response;
// }

// export const sendWalletAddressFilecoin = (data) => {
//   let response = await Actions.sendFilecoin({
//     source: data.source,
//     target: data.target,
//     amount: data.amount,
//   });
//   return response;
// }
