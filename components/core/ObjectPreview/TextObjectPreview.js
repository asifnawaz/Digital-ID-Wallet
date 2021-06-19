import "isomorphic-fetch";

import * as React from "react";
import * as Styles from "~/common/styles";

import { P } from "~/components/system";
import { css } from "@emotion/react";

import ObjectPreviewPremitive from "./ObjectPreviewPremitive";
import TextPlaceholder from "./placeholders/Text";

const STYLES_CONTAINER = css`
  position: relative;
  display: flex;
  height: 100%;
  justify-content: center;
  svg {
    overflow: visible !important;
    width: ${(123 / 248) * 100}%;
    height: ${(151 / 248) * 100}%;
  }
`;

const STYLES_TAG = (theme) => css`
  position: absolute;
  text-transform: uppercase;
  background-color: ${theme.system.bgLight};
  bottom: 26%;
  left: 50%;
  transform: translateX(-50%);
  padding: 2px 8px;
  border-radius: 4px;
`;

const STYLES_TEXT_PREVIEW = (theme) =>
  css({
    height: "100%",
    width: "100%",
    margin: "8px",
    backgroundColor: "#FFF",
    borderRadius: "8px",
    boxShadow: theme.shadow.large,
  });

const STYLES_CONTENT_PADDING = css`
  padding: 16px;
`;
const DEFAULT_CONTENT =
  "This web of time – the strands of which approach one another, bifurcate, intersect or ignore each other through the centuries – embraces every possibility. We do not exist in most of them. In some you exist and not I, while in others I do, and you do not.";

export default function TextObjectPreview({ url, type, ...props }) {
  const [{ content, error }, setState] = React.useState({ content: "", error: undefined });

  React.useLayoutEffect(() => {
    fetch(url)
      .then(async (res) => {
        const content = await res.text();
        setState({ content });
      })
      .catch((e) => {
        setState({ error: e });
      });
  }, []);

  return (
    <ObjectPreviewPremitive type={!error && type} {...props}>
      <div css={STYLES_CONTAINER}>
        {error ? (
          <>
            <TextPlaceholder text={DEFAULT_CONTENT} />
            <div css={STYLES_TAG}>
              <P css={Styles.SMALL_TEXT}>{type}</P>
            </div>
          </>
        ) : (
          <div css={STYLES_TEXT_PREVIEW}>
            <P css={[Styles.SMALL_TEXT, STYLES_CONTENT_PADDING]}>{content}</P>
          </div>
        )}
      </div>
    </ObjectPreviewPremitive>
  );
}
