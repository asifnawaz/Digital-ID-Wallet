import * as React from "react";
import * as Constants from "~/common/constants";
import * as Styles from "~/common/styles";
import * as UserBehaviors from "~/common/user-behaviors";

import { PopoverNavigation } from "~/components/system";
import { css } from "@emotion/react";
import { Link } from "~/components/core/Link";

import { Boundary } from "~/components/system/components/fragments/Boundary";
import { useIntercom } from "react-use-intercom";

const STYLES_HEADER = css`
  position: relative;
  margin-left: 16px;

  @media (max-width: ${Constants.sizes.mobile}px) {
    padding: 0px;
    width: auto;
  }
`;

const STYLES_PROFILE = css`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 10%;
  width: 204px;

  color: ${Constants.system.pitchBlack};
  background-color: ${Constants.system.white};
  font-size: 12px;
  text-decoration: none;
  border-radius: 4px;
  min-height: 48px;
  cursor: pointer;
  border: 1px solid rgba(229, 229, 229, 0.5);
  box-shadow: 0 0 7px 0 rgba(0, 0, 0, 0.03);

  @media (max-width: ${Constants.sizes.mobile}px) {
    display: none;
  }
`;

const STYLES_PROFILE_MOBILE = css`
  display: flex;
  align-items: center;
`;

const STYLES_PROFILE_IMAGE = css`
  background-color: ${Constants.system.foreground};
  background-size: cover;
  background-position: 50% 50%;
  flex-shrink: 0;
  height: 24px;
  width: 24px;
  border-radius: 2px;
  cursor: pointer;

  ${"" /* @media (max-width: ${Constants.sizes.mobile}px) {
    height: 24px;
    width: 24px;
  } */}
`;

const STYLES_PROFILE_USERNAME = css`
  min-width: 10%;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 12px;
  user-select: none;
  font-family: ${Constants.font.medium};
  font-size: ${Constants.typescale.lvl1};
`;

const STYLES_ITEM_BOX_MOBILE = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background-color: ${Constants.system.white};
  cursor: pointer;
  border-radius: 4px;
  border-left: 2px solid ${Constants.system.foreground};
`;

const STYLES_ITEM_BOX = css`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 8px;
  padding-right: 9px;
  transition: 200ms ease all;
  border-left: 2px solid ${Constants.system.foreground};

  :hover {
    color: ${Constants.system.brand};
  }
`;

const OpenIntercom = ({ user }) => {
  const { show } = useIntercom();

  const showWithProps = () =>
    show({
      name: user.data.name || user.username,
    });

  return (
    <span style={{ cursor: "pointer", display: "block" }} onClick={() => showWithProps()}>
      Help
    </span>
  );
};

export class ApplicationUserControlsPopup extends React.Component {
  _handleAction = (props) => {
    this.props.onTogglePopup();
    this.props.onAction(props);
  };

  _handleSignOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.props.onTogglePopup();
    UserBehaviors.signOut({ viewer: this.props.viewer });
  };

  render() {
    if (this.props.popup === "profile") {
      const topSection = (
        <div css={Styles.HORIZONTAL_CONTAINER} style={{ marginBottom: 14 }}>
          <span
            css={STYLES_PROFILE_IMAGE}
            style={{
              cursor: "default",
              width: 46,
              height: 46,
              marginRight: 16,
              backgroundImage: `url('${this.props.viewer.data.photo}')`,
            }}
          />
          <div
            css={Styles.VERTICAL_CONTAINER}
            style={{
              height: 46,
              justifyContent: "space-between",
            }}
          >
            <div css={Styles.HEADING_04}>
              {this.props.viewer.data.name || `@${this.props.viewer.username}`}
            </div>
            <div css={Styles.HORIZONTAL_CONTAINER}>
              <span css={Styles.SMALL_TEXT} style={{ marginRight: 8 }}>{`${
                this.props.viewer.library.length
              } File${this.props.viewer.library.length === 1 ? "" : "s"}`}</span>
              <span css={Styles.SMALL_TEXT}>{`${this.props.viewer.slates.length} Collection${
                this.props.viewer.slates.length === 1 ? "" : "s"
              }`}</span>
            </div>
          </div>
        </div>
      );

      const navigation = [
        [
          {
            text: (
              <Link
                href={`/$/user/${this.props.viewer.id}`}
                style={{ display: "block" }}
                onAction={this._handleAction}
              >
                Profile
              </Link>
            ),
          },
          {
            text: (
              <Link
                href={"/_/directory"}
                style={{ display: "block" }}
                onAction={this._handleAction}
              >
                Directory
              </Link>
            ),
          },
        ],
        [
          {
            text: (
              <Link href={"/_/filecoin"} style={{ display: "block" }} onAction={this._handleAction}>
                Filecoin
              </Link>
            ),
          },
          {
            text: (
              <Link
                href={"/_/storage-deal"}
                style={{ display: "block" }}
                onAction={this._handleAction}
              >
                Storage deal
              </Link>
            ),
          },
          {
            text: (
              <Link href={"/_/api"} style={{ display: "block" }} onAction={this._handleAction}>
                API
              </Link>
            ),
          },
        ],
        [
          {
            text: (
              <Link href={"/_/settings"} style={{ display: "block" }} onAction={this._handleAction}>
                Settings
              </Link>
            ),
          },
        ],
        [
          {
            text: <OpenIntercom style={{ display: "block" }} user={this.props.viewer} />,
          },
          {
            text: "Sign out",
            onClick: (e) => {
              this._handleSignOut(e);
            },
          },
        ],
      ];

      return (
        <>
          <div css={Styles.MOBILE_ONLY}>
            <Boundary
              captureResize={true}
              captureScroll={false}
              enabled={this.props.popup === "profile"}
              onOutsideRectEvent={() => this.props.onTogglePopup()}
            >
              <PopoverNavigation
                style={{
                  width: "max-content",
                  position: "relative",
                  border: "none",
                  boxShadow: "none",
                  width: "100vw",
                  background: "none",
                  pointerEvents: "auto",
                }}
                css={Styles.HEADING_04}
                itemStyle={{ fontSize: Constants.typescale.lvl0 }}
                topSection={topSection}
                navigation={navigation}
              />
            </Boundary>
          </div>
          <div css={Styles.MOBILE_HIDDEN}>
            <Boundary
              captureResize={true}
              captureScroll={false}
              enabled={this.props.popup === "profile"}
              onOutsideRectEvent={() => this.props.onTogglePopup()}
            >
              <PopoverNavigation
                style={{
                  top: 36,
                  right: 0,
                  width: "max-content",
                }}
                css={Styles.HEADING_04}
                itemStyle={{ fontSize: Constants.typescale.lvl0 }}
                topSection={topSection}
                navigation={navigation}
              />
            </Boundary>
          </div>
        </>
      );
    }
    return null;
  }
}

export class ApplicationUserControls extends React.Component {
  render() {
    let tooltip = <ApplicationUserControlsPopup {...this.props} />;
    return (
      <div css={STYLES_HEADER}>
        <div css={STYLES_PROFILE_MOBILE} style={{ position: "relative" }}>
          <span
            css={STYLES_PROFILE_IMAGE}
            onClick={() => this.props.onTogglePopup("profile")}
            style={{
              backgroundImage: `url('${this.props.viewer.data.photo}')`,
            }}
          />
          {this.props.popup === "profile" ? tooltip : null}
        </div>
      </div>
    );
  }
}
