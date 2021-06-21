import App from "next/app";
import ThemeProvider from "~/components/system/ThemeProvider";

import * as React from "react";

import { Global } from "@emotion/react";
import { injectGlobalStyles, injectCodeBlockStyles } from "~/common/styles/global";

// NOTE(wwwjim):
// https://nextjs.org/docs/advanced-features/custom-app
function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <React.Fragment>
        {/* <script src="//cdn.iframe.ly/embed.js" async></script> */}
        <Global styles={injectGlobalStyles()} />
        <Global styles={injectCodeBlockStyles()} />
        <Component {...pageProps} />
      </React.Fragment>
    </ThemeProvider>
  );
}

MyApp.getInitialProps = async (appContext) => {
  const appProps = await App.getInitialProps(appContext);
  return { ...appProps };
};

export default MyApp;
