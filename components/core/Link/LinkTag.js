import * as System from "~/components/system";
import * as SVG from "~/common/SVG";
import * as Constants from "~/common/constants";
import * as Styles from "~/common/styles";

import { css } from "@emotion/react";
import { useRef } from "react";
import { DynamicIcon } from "~/components/core/DynamicIcon";

const STYLES_COPY_INPUT = css`
  pointer-events: none;
  position: absolute;
  opacity: 0;
`;

const STYLES_COPY_PASTE = css`
  color: ${Constants.system.white};
  opacity: 50%;
  transition: 200ms ease all;

  :hover {
    color: ${Constants.system.white};
    opacity: 100%;
  }
`;

const STYLES_TAG_BACKGROUND = css`
  background-color: ${Constants.system.brand};
  border-radius: 8px;
  padding: 8px 16px;

  ${Styles.HORIZONTAL_CONTAINER_CENTERED}
`;

export default function LinkTag({ url, ...props }) {
  const _ref = useRef(null);

  const onCopy = (e) => {
    e.stopPropagation();
    e.preventDefault();
    _ref.current.select();
    document.execCommand("copy");
  };

  let shortURL;
  if (url.length > 40) {
    shortURL = url.substr(0, 40).concat("...");
  } else {
    shortURL = url;
  }
  return (
    <a css={Styles.LINK} href={url} target="_blank">
      <div css={STYLES_TAG_BACKGROUND} style={props.style}>
        <SVG.ExternalLink
          height="16px"
          style={{ color: Constants.system.white, paddingRight: 4 }}
        />
        <System.P2 style={{ color: Constants.system.white, paddingRight: 8 }}>{shortURL}</System.P2>
        <div css={[Styles.ICON_CONTAINER, STYLES_COPY_PASTE]} onClick={onCopy}>
          <DynamicIcon successState={<SVG.Check height="16px" style={{ display: "block" }} />}>
            <SVG.CopyAndPaste style={{ display: "block" }} height="16px" />
          </DynamicIcon>
        </div>
        <input ref={_ref} readOnly value={url} css={STYLES_COPY_INPUT} />
      </div>
    </a>
  );
}
