import * as React from "react";
import * as Constants from "~/common/constants";
import * as System from "~/components/system";
import * as Actions from "~/common/actions";
import * as Credentials from "~/common/credentials";

import { Boundary } from "~/components/system/components/fragments/Boundary";
import { css } from "@emotion/react";
import { Logo } from "~/common/logo";
import { Link } from "~/components/core/Link";

const STYLES_BACKGROUND = css`
  z-index: ${Constants.zindex.cta};
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  text-align: center;
  font-size: 1rem;

  @supports ((-webkit-backdrop-filter: blur(15px)) or (backdrop-filter: blur(15px))) {
    -webkit-backdrop-filter: blur(15px);
    backdrop-filter: blur(15px);
  }

  @keyframes CTATransition-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  animation: CTATransition-fade-in 400ms ease;
`;

const STYLES_TRANSITION = css`
  margin: 15% auto 0 auto;
  max-width: 376px;

  @keyframes authentication-popover-fade-in {
    from {
      transform: translateY(-80px);
      opacity: 0;
    }

    to {
      transform: translateY(0px);
      opacity: 1;
    }
  }

  animation: authentication-popover-fade-in 300ms ease;
`;

const STYLES_POPOVER = css`
  height: 424px;
  padding: 32px 36px;
  border-radius: 4px;
  background: ${Constants.system.white};
  box-shadow: 0 0 30px 0 rgba(0, 0, 0, 0.05);
`;

const STYLES_EXPLAINER = css`
  color: ${Constants.system.white};
`;

const STYLES_LINK_ITEM = css`
  display: block;
  text-decoration: none;
  font-weight: 400;
  font-size: 14px;
  font-family: ${Constants.font.semiBold};
  user-select: none;
  cursor: pointer;
  margin-top: 2px;
  color: ${Constants.system.black};
  transition: 200ms ease all;
  word-wrap: break-word;

  :hover {
    color: ${Constants.system.brand};
  }
`;

export default class CTATransition extends React.Component {
  state = {
    visible: false,
  };

  componentDidMount = () => {
    window.addEventListener("slate-global-open-cta", this._handleOpen);
    window.addEventListener("slate-global-close-cta", this._handleClose);
  };

  componentWillUnmount = () => {
    window.removeEventListener("slate-global-open-cta", this._handleOpen);
    window.removeEventListener("slate-global-close-cta", this._handleClose);
  };

  _handleOpen = (e) => {
    this.setState({ visible: true });
  };

  _handleClose = (e) => {
    this.setState({ visible: false });
  };

  _handleAction = (props) => {
    this.setState({ visible: false }, () => {
      this.props.onAction(props);
    });
  };

  render() {
    return (
      this.state.visible && (
        <div>
          <div css={STYLES_BACKGROUND}>
            <div css={STYLES_TRANSITION}>
              <div css={STYLES_EXPLAINER}>Sign up or sign in to continue</div>
              <br />
              <Boundary
                captureResize={true}
                captureScroll={false}
                enabled
                onOutsideRectEvent={this._handleClose}
              >
                <div css={STYLES_POPOVER}>
                  <Logo height="36px" style={{ display: "block", margin: "56px auto 0px auto" }} />

                  <System.P1 style={{ margin: "56px 0", textAlign: "center" }}>
                    An open-source file sharing network for research and collaboration
                  </System.P1>
                  <Link href={"/_/auth?tab=signup"} onAction={this._handleAction}>
                    <div style={{ textDecoration: `none` }}>
                      <System.ButtonPrimary full style={{ marginBottom: 16 }}>
                        Continue to sign up
                      </System.ButtonPrimary>
                    </div>
                  </Link>
                  <Link href={"/_/auth?tab=signin"} onAction={this._handleAction}>
                    <div css={STYLES_LINK_ITEM}>Already have an account?</div>
                  </Link>
                </div>
              </Boundary>
            </div>
          </div>
        </div>
      )
    );
  }
}

// `/_${Strings.createQueryParams({
//   scene: "NAV_PROFILE",
//   user: this.props.creator.username,
// })}`
