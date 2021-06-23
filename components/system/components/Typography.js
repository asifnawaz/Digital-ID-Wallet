import * as React from "react";
import * as Constants from "~/common/constants";
import * as Styles from "~/common/styles";
import * as Strings from "~/common/strings";

import { css } from "@emotion/react";

const onDeepLink = async (object) => {
  let slug = object.deeplink
    .split("/")
    .map((string) => Strings.createSlug(string, ""))
    .join("/");
  //TODO(martina): moved this cleanup here rather than when entering the info b/c it doesn't allow you to enter "-"'s if used during input. Switch to a dropdown / search later
  if (!object.deeplink.startsWith("/")) {
    slug = "/" + slug;
  }
  return window.open(slug);
};

const outboundRE = /^[a-z]+:/i;
const isExternal = (path) => outboundRE.test(path);

export const A = ({ href, children, dark }) => {
  // setup default linkProps
  const linkProps = {
    href,
    target: isExternal(href) ? "_blank" : "_self",
    rel: isExternal(href) ? "external nofollow" : "",
    css: Styles.LINK,
    children,
  };

  // process all types of Slate links
  switch (href.charAt(0)) {
    case "@": {
      // mention links
      const mention = href.substr(1).toLowerCase();
      linkProps.href = `/${mention}`;
      break;
    }
    case "#": {
      // hash deepLinks
      // TODO: disabled in Markdown for now
      const tag = href.substr(1).toLowerCase();
      linkProps.href = `/${tag}`;
      linkProps.onClick = (e) => {
        e.preventDefault();
        onDeepLink({ deeplink: tag });
      };
      break;
    }
    default: {
    }
  }
  return <a {...linkProps} />;
};

// const STYLES_H1 = css`
//   box-sizing: border-box;
//   font-size: ${Constants.typescale.lvl4};
//   line-height: 1.1;
//   font-family: ${Constants.font.semiBold};
//   font-weight: 400;
//   color: inherit;
//   text-decoration: none;
//   display: block;
//   overflow-wrap: break-word;

//   :hover {
//     color: inherit;
//   }

//   :visited {
//     color: inherit;
//   }

//   strong {
//     font-family: ${Constants.font.semiBold};
//     font-weight: 400;
//   }

//   ${ANCHOR}
// `;

export const H1 = (props) => {
  return <h1 {...props} css={[Styles.H1, props?.css]} />;
};

export const H2 = (props) => {
  return <h2 {...props} css={[Styles.H2, props?.css]} />;
};

export const H3 = (props) => {
  return <h3 {...props} css={[Styles.H3, props?.css]} />;
};

export const H4 = (props) => {
  return <h4 {...props} css={[Styles.H4, props?.css]} />;
};

export const H5 = (props) => {
  return <h5 {...props} css={[Styles.H5, props?.css]} />;
};

// const STYLES_P = css`
//   box-sizing: border-box;
//   font-family: ${Constants.font.text};
//   font-size: ${Constants.typescale.lvl1};
//   line-height: 1.5;
//   overflow-wrap: break-word;

//   strong,
//   b {
//     font-family: ${Constants.font.semiBold};
//     font-weight: 400;
//   }

//   ${ANCHOR}
// `;

export const P1 = (props) => {
  return <p1 {...props} css={[Styles.P1, props?.css]} />;
};

export const P2 = (props) => {
  return <p2 {...props} css={[Styles.P2, props?.css]} />;
};

export const P3 = (props) => {
  return <p3 {...props} css={[Styles.P3, props?.css]} />;
};

export const C1 = (props) => {
  return <p1 {...props} css={[Styles.C1, props?.css]} />;
};

export const C2 = (props) => {
  return <p2 {...props} css={[Styles.C2, props?.css]} />;
};

export const C3 = (props) => {
  return <p3 {...props} css={[Styles.C3, props?.css]} />;
};

export const B1 = (props) => {
  return <p3 {...props} css={[Styles.B1, props?.css]} />;
};

const STYLES_UL = css`
  box-sizing: border-box;
  padding-left: 24px;
`;

export const UL = (props) => {
  return <ul css={STYLES_UL} {...props} />;
};

const STYLES_OL = css`
  box-sizing: border-box;
  padding-left: 24px;
`;

export const OL = (props) => {
  return <ol css={STYLES_OL} {...props} />;
};

const STYLES_LI = css`
  box-sizing: border-box;
  margin-top: 12px;

  strong {
    font-family: ${Constants.font.semiBold};
    font-weight: 400;
  }
`;

export const LI = (props) => {
  return <li css={STYLES_LI} {...props} />;
};
