//NOTE(martina): this file is deprecated. To add things to a slate, use save-copy and pass in a slate. That will duplicate the file if needed (or skip that if it already is owned)

import * as Constants from "~/node_common/constants";
import * as Utilities from "~/node_common/utilities";
import * as Data from "~/node_common/data";
import * as Strings from "~/common/strings";
import * as ViewerManager from "~/node_common/managers/viewer";
import * as SearchManager from "~/node_common/managers/search";

/**
 * SLATEID: id of the slate you are adding the files to
 * FILES: to pass in an array of files
 * FILE: to pass in a single file
 */
export default async (req, res) => {
  const id = Utilities.getIdFromCookie(req);
  if (!id) {
    return res.status(401).send({ decorator: "SERVER_NOT_AUTHENTICATED", error: true });
  }

  const user = await Data.getUserById({
    id,
  });

  if (!user) {
    return res.status(404).send({
      decorator: "SERVER_USER_NOT_FOUND",
      error: true,
    });
  }

  if (user.error) {
    return res.status(500).send({
      decorator: "SERVER_USER_NOT_FOUND",
      error: true,
    });
  }

  const slateId = req.body.data.slate?.id;

  if (!slateId) {
    return res.status(400).send({
      decorator: "SERVER_ADD_TO_SLATE_NO_SLATE",
      error: true,
    });
  }

  const slate = await Data.getSlateById({ id: slateId });

  if (!slate) {
    return res.status(404).send({
      decorator: "SERVER_ADD_TO_SLATE_SLATE_NOT_FOUND",
      error: true,
    });
  }

  if (slate.error) {
    return res.status(500).send({
      decorator: "SERVER_ADD_TO_SLATE_SLATE_NOT_FOUND",
      error: true,
    });
  }

  let files;
  if (req.body.data.files) {
    files = req.body.data.files;
  } else if (req.body.data.file) {
    files = [req.body.data.file];
  } else {
    return res.status(400).send({
      decorator: "SERVER_ADD_TO_SLATE_NO_FILES",
      error: true,
    });
  }

  let duplicateCids = await Data.getSlateFilesByCids({
    slateId: slateId,
    cids: files.map((file) => file.cid),
  });

  if (duplicateCids?.length) {
    duplicateCids = duplicateCids.map((file) => file.cid);
    files = files.filter((file) => {
      if (duplicateCids.includes(file.cid)) return false;
      return true;
    });
  }

  if (!files.length) {
    return res.status(200).send({
      decorator: "SERVER_SLATE_ADD_TO_SLATE",
      added: 0,
      skipped: req.body.data.files.length,
      slate,
    });
  }

  let response = await Data.createSlateFiles({ owner: user, slate, files });
  if (!response || response.error) {
    return res.status(500).send({
      decorator: "SERVER_ADD_TO_SLATE_FAILED",
      error: true,
    });
  }

  await Data.updateSlateById({ id: slateId, updatedAt: new Date() });

  if (slate.isPublic) {
    const privacyUpdate = await Data.updateFilesPublic({
      ids: files.map((file) => file.id),
      ownerId: user.id,
    });

    if (privacyUpdate.length) {
      SearchManager.updateFile(privacyUpdate, "ADD");
    }
  }

  ViewerManager.hydratePartial(id, { slates: true });

  return res.status(200).send({
    decorator: "SERVER_SLATE_ADD_TO_SLATE",
    added: files.length,
    skipped: req.body.data.files.length - files.length,
    slate,
  });
};
