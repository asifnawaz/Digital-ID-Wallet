import * as React from "react";
import * as Constants from "~/common/constants";
import * as Validations from "~/common/validations";
import * as Events from "~/common/custom-events";
import * as Strings from "~/common/strings";
import * as Actions from "~/common/actions";

import UnityFrame from "~/components/core/UnityFrame";
import FontFrame from "~/components/core/FontFrame/index.js";
import MarkdownFrame from "~/components/core/MarkdownFrame";

import { endsWithAny } from "~/common/utilities";
import { css } from "@emotion/react";

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

export default class SlateMediaObject extends React.Component {
  openLink = (url) => {
    window.open(url, "_blank");
  };

  componentDidMount() {
    const file = this.props.file;
    if (this.props.isMobile) {
      if (file.data.type && file.data.type.startsWith("application/pdf")) {
        const url = Strings.getURLfromCID(file.cid);
        this.openLink(url);
      }
    }
    // if (Validations.isLinkType(file.data.type)) {
    //   console.log("is link type");
    //   this.fetchEmbed();
    // }

    // window.iframely && iframely.load();
  }

  // fetchEmbed = async () => {
  //   const url = this.props.file.data.link.url;
  //   const response = await Actions.getEmbed(url);
  //   console.log(response);
  // };

  render() {
    const { file, isMobile } = this.props;
    const type = file.data.type || "";
    const isLink = Validations.isLinkType(type);
    const url = isLink ? file.data.link.url : Strings.getURLfromCID(file.cid);
    const playType = typeMap[type] ? typeMap[type] : type;
    console.log(file.data.link.html);

    let element = <div css={STYLES_FAILURE}>No Preview</div>;

    if (isLink) {
      // return <iframe src={file.data.link.url} css={STYLES_IFRAME} />;
      if (file.data.link.html) {
        return (
          <>
            <script src="//cdn.iframe.ly/embed.js" async></script>
            <div
              style={{ width: 400, height: 400 }}
              dangerouslySetInnerHTML={{
                __html: file.data.link.html,
              }}
            />
          </>
          // <div className="iframely-embed">
          //   <div className="iframely-responsive">
          //     <a data-iframely-url href={url} />
          //   </div>
          // </div>

          // <>
          //   <div className="iframely-embed">
          //     <div className="iframely-responsive" style={{ width: 400, height: 400 }}>
          //       <a
          //         // href="https://github.com/kushtej/Assist"
          //         // data-iframely-url="//cdn.iframe.ly/HxgQem5"
          //         data-iframely-url={`//cdn.iframe.ly/api/oembed?url=${encodeURIComponent(
          //           url
          //         )}&api_key=bd2aa436ece01e67ede2f4`}
          //       ></a>
          //     </div>
          //   </div>
          //   <script async src="//cdn.iframe.ly/embed.js" charset="utf-8"></script>
          // </>
        );
      }
      return <iframe src={url} css={STYLES_IFRAME} />;
    }

    if (type.startsWith("application/pdf")) {
      return (
        <>
          {isMobile ? (
            <a href={url} target="_blank" style={{ textDecoration: "none" }}>
              <div css={STYLES_FAILURE}>Tap to open PDF in new tab</div>
            </a>
          ) : (
            <object
              css={STYLES_OBJECT}
              style={{ width: "calc(100% - 64px)" }}
              data={url}
              type={type}
              key={url}
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
          )}
        </>
      );
    }

    if (type.startsWith("video/")) {
      return (
        <video
          playsInline
          controls
          autoPlay={false}
          name="media"
          type={playType}
          css={STYLES_OBJECT}
          key={url}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <source src={url} type={playType} />
          {/** NOTE(amine): fallback if video type isn't supported (example .mov) */}
          <source src={url} type="video/mp4" />
        </video>
      );
    }

    if (type.startsWith("audio/")) {
      return (
        <div css={STYLES_ASSET}>
          <audio
            controls
            name="media"
            key={url}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <source src={url} type={playType} />
          </audio>
        </div>
      );
    }

    if (type.startsWith("text/html")) {
      return <iframe src={url} css={STYLES_IFRAME} />;
    }

    if (Validations.isFontFile(file.filename)) {
      return (
        <FontFrame
          name={file.data.name || file.filename}
          cid={file.cid}
          fallback={element}
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      );
    }

    if (Validations.isMarkdown(file.filename, type)) {
      return <MarkdownFrame date={file.createdAt} url={url} />;
    }

    if (Validations.isPreviewableImage(type)) {
      return (
        <div css={STYLES_ASSET}>
          <img
            css={STYLES_IMAGE}
            src={url}
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
        </div>
      );
    }

    // TODO(jim): We will need to revisit this later.
    if (type.startsWith("application/unity")) {
      const { config, loader } = file.data.unity;

      return <UnityFrame url={url} unityGameConfig={config} unityGameLoader={loader} key={url} />;
    }

    return element;
  }
}
