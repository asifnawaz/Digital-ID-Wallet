import * as Environment from "~/node_common/environment";
import * as Data from "~/node_common/data";
import * as Strings from "~/common/strings";

import { createOAuthProvider } from "~/node_common/managers/twitter";

export default async (req, res) => {
  if (!Strings.isEmpty(Environment.ALLOWED_HOST) && req.headers.host !== Environment.ALLOWED_HOST) {
    return res.status(403).send({ decorator: "SERVER_TWITTER_OAUTH_NOT_ALLOWED", error: true });
  }

  try {
    const { getOAuthRequestToken } = createOAuthProvider();
    const { authToken, authSecretToken } = await getOAuthRequestToken();

    // NOTE(amine): additional security check
    res.cookie("oauth_token", authToken, {
      maxAge: 15 * 60 * 1000, // 15 minutes
      secure: true,
      httpOnly: true,
      sameSite: true,
    });
    await Data.createTwitterToken({ token: authToken, tokenSecret: authSecretToken });
    res.json({ authToken });
  } catch (e) {
    console.log("error", e);
    res.status(500).send({ decorator: "SERVER_TWITTER_REQUEST_TOKEN_FAILED", error: true });
  }
};
