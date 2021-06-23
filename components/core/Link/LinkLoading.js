import * as System from "~/components/system";
import * as Styles from "~/common/styles";
import * as Constants from "~/common/constants";

import { LoaderSpinner } from "~/components/system/components/Loaders";
import { css } from "@emotion/react";

import LinkTag from "~/components/core/Link/LinkTag";

const STYLES_IMAGE_CONTAINER = css`
  width: 100%;
  max-height: 40%;
  overflow: hidden;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
`;

export default function LinkLoading({ file }) {
  const { link, name } = file.data;
  const { image, body, url } = link;
  return (
    <div
      css={Styles.VERTICAL_CONTAINER_CENTERED}
      style={{ backgroundColor: Constants.system.foreground, height: "100%" }}
    >
      <div css={STYLES_IMAGE_CONTAINER}>
        <img src={image} style={{ width: "100%" }} />
      </div>
      <div css={Styles.VERTICAL_CONTAINER_CENTERED}>
        <System.H3 style={{ marginBottom: 16, color: Constants.system.textBlack }}>
          {name}
        </System.H3>
        <LinkTag url={url} style={{ marginBottom: 16 }} />
        <LoaderSpinner style={{ height: 24, width: 24 }} />
      </div>
    </div>
  );
}
