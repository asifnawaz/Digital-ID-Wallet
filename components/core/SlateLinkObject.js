import * as React from "react";
import * as Constants from "~/common/constants";
import * as Validations from "~/common/validations";
import * as Events from "~/common/custom-events";
import * as Strings from "~/common/strings";
import * as Actions from "~/common/actions";
import * as Styles from "~/common/styles";
import * as SVG from "~/common/SVG";

import UnityFrame from "~/components/core/UnityFrame";
import FontFrame from "~/components/core/FontFrame/index.js";
import MarkdownFrame from "~/components/core/MarkdownFrame";
import LinkLoading from "~/components/core/Link/LinkLoading";

import { css } from "@emotion/react";
import { LoaderSpinner } from "~/components/system/components/Loaders";

const STYLES_FAILURE = css`
  color: ${Constants.system.white};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0;
  padding: 24px 36px;
  height: 100px;
  border-radius: 4px;
  width: 100%;
  min-height: 10%;
  height: 100%;
  text-decoration: none;
  background-color: rgba(20, 20, 20, 0.8);
`;

const STYLES_OBJECT = css`
  display: block;
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 10%;
  height: 100%;
  user-select: none;
`;

const STYLES_ASSET = css`
  user-select: none;
  width: 100%;
  margin: 0;
  padding: 0;
  min-height: 10%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const STYLES_IMAGE = css`
  user-select: none;
  display: block;
  max-width: 100%;
  max-height: 100%;
`;

const STYLES_IFRAME = (theme) => css`
  display: block;
  width: 100%;
  height: 100%;
  // NOTE(Amine): lightbackground as fallback when html file doesn't have any
  background-color: ${theme.system.wallLight};
`;

const typeMap = {
  "video/quicktime": "video/mp4",
};

export default class SlateLinkObject extends React.Component {
  state = {
    loaded: false,
  };

  render() {
    const link = this.props.file.data.link;
    const { url, html, iFrameAllowed } = link;
    if (html) {
      return (
        <div
          style={{ width: "100%", maxHeight: "100vh" }}
          dangerouslySetInnerHTML={{
            __html: html,
          }}
        />
      );
    } else if (iFrameAllowed) {
      return (
        <div
          style={{ position: "relative", display: "block", width: "100%", height: "100%" }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <iframe
            src={url}
            css={STYLES_IFRAME}
            style={{ display: this.state.loaded ? "block" : "none" }}
            onLoad={() => this.setState({ loaded: true })}
          />
          <LinkLoading
            file={this.props.file}
            style={{ display: this.state.loaded ? "none" : "block" }}
          />
        </div>
      );
    } else {
      return <div>iframe blocked. work in progress</div>;
    }
  }
}
