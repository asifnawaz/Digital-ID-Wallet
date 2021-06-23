import * as Utilities from "~/node_common/utilities";
import * as Data from "~/node_common/data";
import * as Strings from "~/common/strings";
import * as ViewerManager from "~/node_common/managers/viewer";
import * as SearchManager from "~/node_common/managers/search";
import * as ArrayUtilities from "~/node_common/array-utilities";
import * as Monitor from "~/node_common/monitor";
import * as Environment from "~/node_common/environment";

import "isomorphic-fetch";

import microlink from "@microlink/mql";
import CID from "cids";
import multihashing from "multihashing-async";

export default async (req, res) => {
  const id = Utilities.getIdFromCookie(req);
  if (!id) {
    return res.status(401).send({ decorator: "SERVER_NOT_AUTHENTICATED", error: true });
  }

  const user = await Data.getUserById({
    id,
  });

  if (!user) {
    return res.status(404).send({ decorator: "SERVER_USER_NOT_FOUND", error: true });
  }

  if (user.error) {
    return res.status(500).send({ decorator: "SERVER_USER_NOT_FOUND", error: true });
  }

  let decorator = "SERVER_CREATE_LINK";
  const slateId = req.body.data.slate?.id;
  let slate;
  if (slateId) {
    slate = await Data.getSlateById({ id: slateId });

    if (!slate || slate.error) {
      slate = null;
      decorator = "SERVER_CREATE_LINK_SLATE_NOT_FOUND";
    }
  }

  let urls;
  if (req.body.data.url) {
    urls = [req.body.data.url];
  } else if (req.body.data.urls) {
    urls = req.body.data.urls;
  } else {
    return res.status(400).send({ decorator: "SERVER_CREATE_LINK_NO_LINK_PROVIDED", error: true });
  }

  let files = [];
  for (let url of urls) {
    const cid = await getCIDFromURL(url);
    files.push({ cid, data: { link: { url } } });
  }

  let { duplicateFiles, filteredFiles } = await ArrayUtilities.removeDuplicateUserFiles({
    files,
    user,
  });

  if (!filteredFiles?.length) {
    return res.status(400).send({ decorator: "SERVER_CREATE_LINK_DUPLICATE", error: true });
  }

  files = [];

  for (let file of filteredFiles) {
    const url = file.data.link.url;
    const data = await fetchLinkData(url);
    if (!data) {
      continue;
    }
    const filename = Strings.createSlug(data.title);
    const domain = getDomainFromURL(url);
    console.log({ domain });
    const html = await fetchEmbed(url);
    console.log({ html });
    const iFrameAllowed = await testIframe(url);
    console.log({ iFrameAllowed });

    const newFile = {
      filename,
      cid: file.cid,
      data: {
        type: "link",
        size: 0,
        name: data.title || "",
        author: data.author || "",
        source: data.publisher || "",
        body: data.description || "",
        coverImage: data.screenshot
          ? {
              data: {
                type: "image/png",
                size: data.screenshot.size,
                url: data.screenshot.url,
              },
            }
          : null,
        link: {
          url: file.data.link.url,
          image: data.image?.url,
          logo: data.logo?.url,
          domain,
          html,
          iFrameAllowed,
        },
      },
    };

    files.push(newFile);
  }

  if (!files?.length) {
    return res.status(400).send({ decorator: "SERVER_CREATE_LINK_INVALID_LINK", error: true });
  }

  if (slate?.isPublic) {
    files = files.map((file) => {
      return { ...file, isPublic: true };
    });
  }

  let createdFiles = [];
  if (files?.length) {
    createdFiles = (await Data.createFile({ owner: user, files })) || [];

    if (!createdFiles?.length) {
      return res.status(404).send({ decorator: "SERVER_CREATE_LINK_FAILED", error: true });
    }

    if (createdFiles.error) {
      return res.status(500).send({ decorator: createdFiles.decorator, error: createdFiles.error });
    }
  }

  let added = createdFiles?.length || 0;

  let filesToAddToSlate = createdFiles.concat(duplicateFiles); //NOTE(martina): files that are already owned by the user are included in case they aren't yet in that specific slate
  if (slate && filesToAddToSlate.length) {
    const { decorator: returnedDecorator, added: addedToSlate } = await Utilities.addToSlate({
      slate,
      files: filesToAddToSlate,
      user,
    });
    if (returnedDecorator) {
      decorator = returnedDecorator;
    }
    added = addedToSlate;
  }

  if (slate?.isPublic) {
    SearchManager.updateFile(createdFiles, "ADD");
  }
  ViewerManager.hydratePartial(id, { library: true, slates: slate ? true : false });

  if (!slate) {
    Monitor.upload({ user, files });
  }

  return res.status(200).send({
    decorator,
    data: { added, skipped: files.length - added },
  });
};

const fetchLinkData = async (url) => {
  let mql;
  try {
    mql = await microlink(url, { screenshot: true });
  } catch (e) {
    console.log(e);
  }
  if (!mql || mql.status !== "success") {
    return;
  }
  return mql?.data;
};

export const getDomainFromURL = (url = "") => {
  let parsedURL;
  try {
    parsedURL = new URL(url);
  } catch (e) {
    console.log(e);
    return;
  }
  const domain = parsedURL.hostname.replace("www.", ""); //NOTE(martina): returns example.com
  return domain;
};

export const getCIDFromURL = async (url = "") => {
  const bytes = new TextEncoder().encode(url);
  const hash = await multihashing(bytes, "sha2-256");
  const cid = new CID(1, "dag-pb", hash);
  return cid.toString();
};

const fetchEmbed = async (url) => {
  try {
    const request = await fetch(
      `https://iframe.ly/api/oembed?url=${encodeURIComponent(url)}&api_key=${
        Environment.IFRAMELY_API_KEY
      }&iframe=1&omit_script=1`,
      {
        method: "GET",
      }
    );
    const data = await request.json();
    return data?.html;
  } catch (e) {
    console.log(e);
  }
};

const testIframe = async (url) => {
  try {
    const request = await fetch(url, {
      method: "GET",
    });
    if (request?.headers && request?.headers.get("x-frame-options")) {
      return false;
    }
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};
