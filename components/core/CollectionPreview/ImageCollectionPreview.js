import * as React from "react";

import { useInView } from "~/common/hooks";
import { isBlurhashValid } from "blurhash";
import { Blurhash } from "react-blurhash";
import { css } from "@emotion/react";

const STYLES_CONTAINER = css`
  position: relative;
  border-radius: 8px;
  height: 307px;
`;

const STYLES_PREVIEW = css`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
  background-size: cover;
`;

const STYLES_DESCRIPTION_CONTAINER = css`
  width: 100%;
  height: 131px;
  margin-top: auto;
`;

export default function CollectionPreview({ slate }) {
  const previewerRef = React.useRef();
  const [isLoading, setLoading] = React.useState(true);
  const handleOnLoaded = () => setLoading(false);

  const { isInView } = useInView({
    ref: previewerRef,
  });

  const coverImage = file?.data?.coverImage;
  const blurhash = React.useMemo(() => {
    return file.data.blurhash && isBlurhashValid(file.data.blurhash)
      ? file.data.blurhash
      : coverImage?.data.blurhash && isBlurhashValid(coverImage?.data.blurhash)
      ? coverImage?.data.blurhash
      : null;
  }, [file]);

  const shouldShowPlaceholder = isLoading && blurhash;
  return (
    <div css={STYLES_CONTAINER}>
      {isInView && (
        <div css={STYLES_PREVIEW}>
          {shouldShowPlaceholder && (
            <Blurhash
              hash={blurhash}
              height="100%"
              width="100%"
              resolutionX={32}
              resolutionY={32}
              punch={1}
            />
          )}
        </div>
      )}
      <div></div>
      <div css={STYLES_DESCRIPTION_CONTAINER}></div>
    </div>
  );
}
