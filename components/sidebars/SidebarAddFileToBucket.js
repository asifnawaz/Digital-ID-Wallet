import * as React from "react";
import * as Constants from "~/common/constants";
import * as Strings from "~/common/strings";
import * as System from "~/components/system";
import * as Store from "~/common/store";
import * as SVG from "~/common/svg";
import * as Validations from "~/common/validations";
import * as Events from "~/common/custom-events";
import * as FileUtilities from "~/common/file-utilities";

import { css } from "@emotion/react";
import { DataMeterBar } from "~/components/core/DataMeter";
import { SidebarWarningMessage } from "~/components/core/WarningMessage";
import { FileTypeGroup } from "~/components/core/FileTypeIcon";

const STYLES_FILE_HIDDEN = css`
  height: 1px;
  width: 1px;
  opacity: 0;
  visibility: hidden;
  position: fixed;
  top: -1px;
  left: -1px;
`;

const STYLES_FILE_LINE = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background-color: ${Constants.system.white};
  border-bottom: 1px solid ${Constants.system.foreground};
`;

const STYLES_FILE_NAME = css`
  min-width: 10%;
  width: 100%;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-size: 0.9rem;
  font-family: ${Constants.font.medium};
`;

const STYLES_LEFT = css`
  width: 100%;
  min-width: 10%;
  display: flex;
  align-items: center;
`;

const STYLES_RIGHT = css`
  flex-shrink: 0;
  display: flex;
  align-items: center;
`;

const STYLES_FILE_STATUS = css`
  flex-shrink: 0;
  margin-right: 16px;
  display: flex;
  align-items: center;
`;

const STYLES_BAR_CONTAINER = css`
  background: ${Constants.system.white};
  border-radius: 4px;
  padding: 16px;
  margin-top: 48px;
`;

const STYLES_PERFORMANCE = css`
  font-family: ${Constants.font.code};
  font-size: 12px;
  display: block;
  margin: 0 0 8px 0;
`;

export default class SidebarAddFileToBucket extends React.Component {
  state = {
    url: "",
  };

  _handleUpload = (e) => {
    this.props.onUpload({
      files: e.target.files,
      slate:
        this.props.page.id === "NAV_SLATE" && this.props.data?.id
          ? { id: this.props.data.id }
          : null,
    });
    this.props.onCancel();
  };

  _handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  _handleCancel = (e, key) => {
    e.preventDefault();
    e.stopPropagation();
    Events.dispatchCustomEvent({ name: `cancel-${key}` }); //NOTE(martina): so that will cancel if is in the middle of uploading
    Store.setCancelled(key); //NOTE(martina): so that will cancel if hasn't started uploading yet
    this.props.onAction({ type: "REGISTER_FILE_CANCELLED", value: key }); //NOTE(martina): so that fileLoading registers it
  };

  _handleUploadLink = () => {
    FileUtilities.uploadLink({ url: this.state.url, resources: this.props.resources });
    this.props.onCancel();
  };

  render() {
    let loaded = 0;
    let total = 0;
    if (this.props.fileLoading) {
      for (let file of Object.values(this.props.fileLoading)) {
        if (typeof file.loaded === "number" && typeof file.total === "number") {
          total += file.total;
          loaded += file.loaded;
        }
      }
    }
    return (
      <React.Fragment>
        <System.P1
          style={{
            fontFamily: Constants.font.semiBold,
            fontSize: Constants.typescale.lvl3,
            marginBottom: 36,
          }}
        >
          {this.props.fileLoading && Object.keys(this.props.fileLoading).length
            ? "Upload progress"
            : "Upload data"}
        </System.P1>

        <input
          css={STYLES_FILE_HIDDEN}
          multiple
          type="file"
          id="file"
          onChange={this._handleUpload}
        />

        {this.props.fileLoading && Object.keys(this.props.fileLoading).length ? null : (
          <React.Fragment>
            <FileTypeGroup style={{ margin: "64px 0px" }} />

            <System.P1>
              Click below or drop a file anywhere on the page to upload a file
              {this.props.data?.slatename || this.props.data?.data.name ? (
                <span>
                  {" "}
                  to <strong>{Strings.getPresentationSlateName(this.props.data)}</strong>
                </span>
              ) : (
                ""
              )}
              .
            </System.P1>

            <SidebarWarningMessage />

            <System.Input
              name="url"
              type="url"
              value={this.state.url}
              placeholder="URL"
              onChange={this._handleChange}
              style={{ marginTop: 48 }}
            />

            <System.ButtonPrimary
              full
              type="label"
              style={{ marginTop: 24 }}
              onClick={this._handleUploadLink}
            >
              Add link
            </System.ButtonPrimary>

            <System.Divider
              color="#AEAEB2"
              width="45px"
              height="0.5px"
              style={{ margin: "0px auto", marginTop: "20px" }}
            />

            <System.ButtonPrimary full type="label" htmlFor="file" style={{ marginTop: 24 }}>
              Upload file
            </System.ButtonPrimary>
            <br />
          </React.Fragment>
        )}

        {this.props.fileLoading && Object.keys(this.props.fileLoading).length ? (
          <div css={STYLES_BAR_CONTAINER}>
            <strong css={STYLES_PERFORMANCE}>
              {Strings.bytesToSize(loaded)} / {Strings.bytesToSize(total)}
            </strong>
            <DataMeterBar bytes={loaded} maximumBytes={total} />
          </div>
        ) : null}
        <div style={{ marginTop: 24, borderRadius: 4, overflow: "hidden" }}>
          {this.props.fileLoading
            ? Object.entries(this.props.fileLoading).map((entry) => {
                let file = entry[1];
                return (
                  <div css={STYLES_FILE_LINE} key={file.name}>
                    <span css={STYLES_LEFT}>
                      <div css={STYLES_FILE_STATUS}>
                        {file.failed ? (
                          <SVG.Alert
                            height="24px"
                            style={{
                              color: Constants.system.red,
                              pointerEvents: "none",
                            }}
                          />
                        ) : file.cancelled ? (
                          <SVG.Dismiss
                            height="24px"
                            style={{
                              color: Constants.system.gray,
                              pointerEvents: "none",
                            }}
                          />
                        ) : file.loaded === file.total ? (
                          <SVG.CheckBox height="24px" />
                        ) : (
                          <System.LoaderSpinner
                            style={{
                              width: "20px",
                              height: "20px",
                              margin: "2px",
                            }}
                          />
                        )}
                      </div>
                      <div
                        css={STYLES_FILE_NAME}
                        style={
                          file.failed
                            ? { color: Constants.system.red }
                            : file.cancelled
                            ? { color: Constants.system.gray }
                            : null
                        }
                      >
                        {file.name}
                      </div>
                    </span>
                    {file.loaded === file.total || file.failed || file.cancelled ? (
                      <div css={STYLES_RIGHT} style={{ height: 24, width: 24 }} />
                    ) : (
                      <span
                        css={STYLES_RIGHT}
                        style={{
                          cursor: "pointer",
                        }}
                        onClick={(e) => this._handleCancel(e, entry[0])}
                      >
                        <SVG.Dismiss
                          height="24px"
                          className="boundary-ignore"
                          style={{
                            color: Constants.system.gray,
                            pointerEvents: "none",
                          }}
                        />
                      </span>
                    )}
                  </div>
                );
              })
            : null}
        </div>
      </React.Fragment>
    );
  }
}
