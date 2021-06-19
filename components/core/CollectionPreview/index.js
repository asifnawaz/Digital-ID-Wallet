import * as React from "react";
import * as Validations from "~/common/validations";

import { useInView } from "~/common/hooks";
import { isBlurhashValid } from "blurhash";
import { Blurhash } from "react-blurhash";
import { css } from "@emotion/react";

export default function CollectionPreview({ collection }) {
  const files = collection.objects.filter((file) => Validations.isPreviewableImage(file?.type));
  console.log(collection.objects, files);
  return <div>yo</div>;
}
