import * as Environment from "~/node_common/environment";
import * as Validations from "~/common/validations";
import * as Data from "~/node_common/data";
import * as Utilities from "~/node_common/utilities";

import * as ViewerManager from "~/node_common/managers/viewer";
import * as AnalyticsManager from "~/node_common/managers/analytics";

import express from "express";
import next from "next";
import compression from "compression";
import cors from "cors";

const app = next({
  dev: !Environment.IS_PRODUCTION,
  dir: __dirname,
  quiet: false,
});

const handler = app.getRequestHandler();

app.prepare().then(async () => {
  const server = express();

  server.use(cors());

  if (Environment.IS_PRODUCTION) {
    server.use(compression());
  }

  server.use("/public", express.static("public"));

  server.get("/system", async (req, res) => {
    res.redirect("/_/system");
  });

  server.get("/experiences", async (req, res) => {
    res.redirect("/_/system");
  });

  server.get("/system/:component", async (req, res) => {
    res.redirect(`/_/system/${req.params.component}`);
  });

  server.get("/experiences/:module", async (req, res) => {
    res.redirect(`/_/experiences/${req.params.module}`);
  });

  server.get("/_", async (req, res) => {
    const isBucketsAvailable = await Utilities.checkTextile();

    // TODO(jim): Do something more robust here.
    if (!isBucketsAvailable) {
      return res.redirect("/maintenance");
    }

    const id = Utilities.getIdFromCookie(req);

    let viewer = null;
    if (id) {
      viewer = await ViewerManager.getById({
        id,
      });
    }

    let analytics = await AnalyticsManager.get();
    return app.render(req, res, "/_", {
      viewer,
      analytics,
    });
  });

  server.get("/_/integration-page", async (req, res) => {
    const id = Utilities.getIdFromCookie(req);

    let viewer = null;
    if (id) {
      viewer = await ViewerManager.getById({
        id,
      });
    }

    return app.render(req, res, "/_/integration-page", {
      viewer,
    });
  });

  server.get("/:username", async (req, res) => {
    // TODO(jim): Temporary workaround
    if (!Validations.userRoute(req.params.username)) {
      return handler(req, res, req.url);
    }

    const id = Utilities.getIdFromCookie(req);

    let viewer = null;
    if (id) {
      viewer = await ViewerManager.getById({
        id,
      });
    }

    const creator = await Data.getUserByUsername({
      username: req.params.username,
    });

    if (!creator) {
      return res.redirect("/404");
    }

    if (creator.error) {
      return res.redirect("/404");
    }

    const slates = await Data.getSlatesByUserId({
      userId: creator.id,
      publicOnly: true,
    });

    return app.render(req, res, "/_/profile", {
      viewer,
      creator: {
        username: creator.username,
        slates,
        data: {
          photo: creator.data.photo,
          name: creator.data.name ? creator.data.name : creator.username,
          body: creator.data.body ? creator.data.body : "A user on Slate.",
        },
      },
    });
  });

  server.get("/:username/:slatename", async (req, res) => {
    // TODO(jim): Temporary workaround
    if (!Validations.userRoute(req.params.username)) {
      return handler(req, res, req.url);
    }

    const slate = await Data.getSlateByName({
      slatename: req.params.slatename,
    });

    if (!slate) {
      return res.redirect("/404");
    }

    if (!slate.data.public) {
      return res.redirect("/403");
    }

    const creator = await Data.getUserById({ id: slate.data.ownerId });

    if (!creator) {
      return res.redirect("/404");
    }

    if (creator.error) {
      return res.redirect("/404");
    }

    if (req.params.username !== creator.username) {
      return res.redirect("/403");
    }

    const id = Utilities.getIdFromCookie(req);

    let viewer = null;
    if (id) {
      viewer = await ViewerManager.getById({
        id,
      });
    }

    return app.render(req, res, "/_/slate", {
      viewer,
      creator: {
        username: creator.username,
        data: {
          photo: creator.data.photo,
          name: creator.data.name ? creator.data.name : creator.username,
          body: creator.data.body ? creator.data.body : "A user on Slate.",
        },
      },
      slate,
    });
  });

  server.all("*", async (req, res) => {
    return handler(req, res, req.url);
  });

  server.listen(Environment.PORT, async (e) => {
    if (e) throw e;

    console.log(`[ slate ] client: http://localhost:${Environment.PORT}`);
  });
});
