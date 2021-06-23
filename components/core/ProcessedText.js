import { H1, H2, H3, H4, P1, UL, OL, LI, A } from "~/components/system/components/Typography";

import { Markdown } from "~/components/system/components/Markdown";

const ProcessedText = ({ text, dark }) => {
  const remarkReactComponents = {
    h1: P,
    h2: P,
    h3: P,
    h4: P,
    h5: P,
    h6: P,
    ol: OL,
    ul: UL,
    li: LI,
    a: (props) => <A dark={dark} {...props} />,
  };
  return <Markdown md={text} options={{ remarkReactComponents }} />;
};

export default ProcessedText;
