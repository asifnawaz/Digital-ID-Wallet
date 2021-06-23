import * as React from "react";
import * as Actions from "~/common/actions";
import * as Constants from "~/common/constants";
import * as System from "~/components/system";
import * as Strings from "~/common/strings";
import * as Validations from "~/common/validations";
import * as Events from "~/common/custom-events";
import * as SVG from "~/common/svg";
import * as UserBehaviors from "~/common/user-behaviors";

import { RadioGroup } from "~/components/system/components/RadioGroup";
import { css } from "@emotion/react";
import { ConfirmationModal } from "~/components/core/ConfirmationModal";
import { Link } from "~/components/core/Link";

const DEFAULT_IMAGE =
  "https://slate.textile.io/ipfs/bafkreiaow45dlq5xaydaeqocdxvffudibrzh2c6qandpqkb6t3ahbvh6re";

const STYLES_HEADER = css`
  font-family: ${Constants.font.semiBold};
`;

const STYLES_TEXT = css`
  color: ${Constants.system.textGray};
  font-size: ${Constants.typescale.lvl0};
`;

const STYLES_IMAGE_BOX = css`
  max-width: 368px;
  max-height: 368px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${Constants.system.white};
  overflow: hidden;
  border-radius: 4px;
`;

const STYLES_GROUPING = css`
  width: 100%;
  border: 1px solid rgba(196, 196, 196, 0.5);
  background-color: ${Constants.system.white};
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 24px;
`;

export default class SidebarSingleSlateSettings extends React.Component {
  state = {
    slatename: this.props.data.slatename,
    isPublic: this.props.data.isPublic,
    body: this.props.data.data.body,
    name: this.props.data.data.name,
    tags: this.props.data.data?.tags || [],
    suggestions: this.props.viewer?.tags || [],
    modalShow: false,
  };

  componentDidMount = () => {
    this.updateSuggestions();
  };

  updateSuggestions = () => {
    let newSuggestions = new Set([...this.state.suggestions, ...this.state.tags]);
    this.setState({ suggestions: Array.from(newSuggestions) });
  };

  _handleSubmit = async () => {
    let slates = this.props.viewer.slates;
    for (let slate of slates) {
      if (slate.id === this.props.data.id) {
        slate.data.name = this.state.name;
        slate.isPublic = this.state.isPublic;
        slate.data.body = this.state.body;
        slate.data.tags = this.state.tags;

        let newSuggestions = new Set([...this.state.suggestions, ...this.state.tags]);
        this.props.onAction({
          type: "UPDATE_VIEWER",
          viewer: { slates, tags: Array.from(newSuggestions) },
        });

        break;
      }
    }

    this.props.onCancel();
    const response = await Actions.updateSlate({
      id: this.props.data.id,
      isPublic: this.state.isPublic,
      data: {
        name: this.state.name,
        body: this.state.body,
        tags: this.state.tags,
      },
    });

    if (Events.hasError(response)) {
      return;
    }
  };

  _handleCancel = () => {
    this.props.onCancel();
  };

  _handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value }, () => {
      if (e.target.name === "tags") {
        this.updateSuggestions();
      }
    });
  };

  _handleDelete = async (res) => {
    if (!res) {
      this.setState({ modalShow: false });
      return;
    }

    this.props.onAction({
      type: "NAVIGATE",
      href: "/_/collections",
    });

    let slates = this.props.viewer.slates.filter((slate) => slate.id !== this.props.data.id);
    this.props.onAction({ type: "UPDATE_VIEWER", viewer: { slates } });

    const response = await Actions.deleteSlate({
      id: this.props.data.id,
    });

    if (Events.hasError(response)) {
      return;
    }

    this.setState({ modalShow: false });
  };

  render() {
    const slug = Strings.createSlug(this.state.name);
    const url = `/${this.props.viewer.username}/${slug}`;
    let preview = this.props.data.data.preview;
    if (!preview) {
      for (let object of this.props.data.objects) {
        if (
          object.data.type &&
          Validations.isPreviewableImage(object.data.type) &&
          object.data.size &&
          object.data.size < Constants.linkPreviewSizeLimit
        ) {
          preview = Strings.getURLfromCID(object.cid);
          break;
        }
      }
    }
    if (!preview) {
      preview = DEFAULT_IMAGE;
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
          Collection settings
        </System.P1>

        <div css={STYLES_GROUPING}>
          <System.P1 css={STYLES_HEADER}>Name</System.P1>
          <System.P1
            css={STYLES_TEXT}
            style={{
              marginTop: 12,
            }}
          >
            Give your collection a name so you and others can find it on Slate and on the web.
          </System.P1>

          <System.Input
            placeholder="Collection name..."
            style={{ marginTop: 12 }}
            name="name"
            value={this.state.name}
            onChange={this._handleChange}
            onSubmit={this._handleSubmit}
            descriptionStyle={{ fontSize: "20px !important" }}
            labelStyle={{ fontSize: "20px" }}
          />
          <System.P1
            style={{
              marginTop: 12,
              color: Constants.system.textGrayLight,
              fontSize: Constants.typescale.lvl0,
            }}
          >
            https://slate.host{url}
          </System.P1>
        </div>

        <div css={STYLES_GROUPING}>
          <System.P1 css={STYLES_HEADER}>Description</System.P1>
          <System.P1
            css={STYLES_TEXT}
            style={{
              marginTop: 12,
            }}
          >
            Give your collection a description, add links, and connect it to other collections.
          </System.P1>

          <System.Textarea
            style={{ marginTop: 12 }}
            name="body"
            placeholder="Collection description..."
            value={this.state.body}
            onChange={this._handleChange}
            onSubmit={this._handleSubmit}
          />
        </div>

        <div css={STYLES_GROUPING}>
          <System.P1 css={STYLES_HEADER}>Tags</System.P1>
          <System.P1
            css={STYLES_TEXT}
            style={{
              marginTop: 12,
            }}
          >
            Add tags to a collection to categorize it.
          </System.P1>
          <System.Tag
            name="tags"
            tags={this.state.tags}
            suggestions={this.state.suggestions}
            style={{ marginTop: 12 }}
            onChange={this._handleChange}
          />
        </div>

        <div css={STYLES_GROUPING}>
          <System.P1 css={STYLES_HEADER}>Cover image</System.P1>

          <System.P1
            css={STYLES_TEXT}
            style={{
              marginTop: 12,
            }}
          >
            This is the cover image for your collection. You can select a different cover image
            using the "Make cover image" button.
          </System.P1>

          <div css={STYLES_IMAGE_BOX} style={{ marginTop: 24 }}>
            <img src={preview} alt="" style={{ maxWidth: "368px", maxHeight: "368px" }} />
          </div>
        </div>

        <div css={STYLES_GROUPING}>
          <System.P1 css={STYLES_HEADER} style={{ marginBottom: 12 }}>
            Privacy
          </System.P1>
          <System.P1
            css={STYLES_TEXT}
            style={{
              marginTop: 12,
            }}
          >
            All collections are public by default. This means they can be discovered and seen by
            anyone on the internet. If you make it private, only you will be able to see it.
          </System.P1>
          <RadioGroup
            name="isPublic"
            options={[
              {
                value: true,
                label: (
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <SVG.Globe height="16px" style={{ marginRight: 8 }} />
                    Public
                  </div>
                ),
              },
              {
                value: false,
                label: (
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <SVG.SecurityLock height="16px" style={{ marginRight: 8 }} />
                    Private
                  </div>
                ),
              },
            ]}
            style={{ marginTop: 12 }}
            labelStyle={{ fontFamily: Constants.font.medium }}
            selected={this.state.isPublic}
            onChange={this._handleChange}
          />
        </div>

        <div style={{ marginTop: 40 }}>
          <System.ButtonPrimary full onClick={this._handleSubmit}>
            Save changes
          </System.ButtonPrimary>

          <div style={{ marginTop: 16 }}>
            <System.ButtonWarning
              full
              onClick={() => this.setState({ modalShow: true })}
              style={{ overflow: "hidden" }}
            >
              Delete collection
            </System.ButtonWarning>
          </div>
        </div>
        {this.state.modalShow && (
          <ConfirmationModal
            type={"DELETE"}
            withValidation={false}
            callback={this._handleDelete}
            header={`Are you sure you want to delete the collection “${this.state.slatename}”?`}
            subHeader={`This collection will be deleted but all your files will remain in your file library. You can’t undo this action.`}
          />
        )}
      </React.Fragment>
    );
  }
}
