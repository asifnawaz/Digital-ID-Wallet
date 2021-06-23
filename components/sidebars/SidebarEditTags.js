import * as React from "react";
import * as Strings from "~/common/strings";
import * as Constants from "~/common/constants";
import * as System from "~/components/system";
import * as Validations from "~/common/validations";
import * as Actions from "~/common/actions";
import * as Events from "~/common/custom-events";

import { css } from "@emotion/react";
import { Tag } from "~/components/system/components/Tag";

const STYLES_GROUPING = css`
  width: 100%;
  border: 1px solid rgba(196, 196, 196, 0.5);
  background-color: ${Constants.system.white};
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 40px;
`;

export default class SidebarEditTags extends React.Component {
  state = {
    tags: this.props.sidebarData?.commonTags || [],
    suggestions: this.props.viewer?.tags || [],
  };

  componentDidMount() {
    this.updateSuggestions();
  }

  _handleChange = (e) => {
    this.setState(
      {
        [e.target.name]: e.target.value,
      },
      this.updateSuggestions
    );
  };

  updateSuggestions = () => {
    let newSuggestions = new Set([...this.state.suggestions, ...this.state.tags]);
    this.setState({ suggestions: Array.from(newSuggestions) });
  };

  _handleSave = async () => {
    let { checked, objects, commonTags } = this.props.sidebarData;
    const checkedIndexes = Object.keys(checked);

    let update = checkedIndexes.map((checkedIndex) => {
      const curr = objects[checkedIndex];
      let objectTags = curr?.data.tags || [];
      let newTags = this.state.tags;

      /* NOTE(daniel): since there are no common tags, we are simply adding new tags to the files */
      if (!commonTags.length) {
        return { ...curr, data: { ...curr.data, tags: [...new Set([...objectTags, ...newTags])] } };
      }

      /* NOTE(daniel): symmetrical difference between new tags and common tags */
      let diff = newTags
        .filter((i) => !commonTags.includes(i))
        .concat(commonTags.filter((i) => !newTags.includes(i)));

      let update = diff.reduce((acc, cur) => {
        if (!commonTags.includes(cur) && newTags.includes(cur)) {
          acc.push(cur);
        } else if (commonTags.includes(cur) && !newTags.includes(cur)) {
          let removalIndex = acc.findIndex((item) => item === cur);
          acc.splice(removalIndex, 1);
        }

        return acc;
      }, objectTags);

      return { ...curr, data: { ...curr.data, tags: update } };
    });

    const response = await Actions.updateFile(update);

    Events.hasError(response);
  };

  _handleSubmit = () => {
    this.props.onCancel();

    this._handleSave();

    let newSuggestions = new Set([...this.state.suggestions, ...this.state.tags]);
    this.props.onAction({ type: "UPDATE_VIEWER", viewer: { tags: Array.from(newSuggestions) } });
  };

  render() {
    const { numChecked } = this.props.sidebarData;

    return (
      <div style={{ marginBottom: 64 }}>
        <System.P1
          style={{
            fontFamily: Constants.font.semiBold,
            fontSize: Constants.typescale.lvl2,
            marginBottom: 36,
          }}
        >
          Edit tags
        </System.P1>

        <div css={STYLES_GROUPING}>
          <System.P1
            style={{
              fontFamily: Constants.font.semiBold,
              fontSize: Constants.typescale.lvl1,
              marginBottom: 8,
            }}
          >
            Tags
          </System.P1>
          <System.P1
            style={{
              fontFamily: Constants.font.text,
              fontSize: Constants.typescale.lvl0,
              color: Constants.system.textGray,
              marginBottom: 16,
            }}
          >
            Add or remove common tags on your files
          </System.P1>
          <Tag
            tags={this.state.tags}
            suggestions={this.state.suggestions}
            onChange={this._handleChange}
          />
        </div>

        <System.ButtonPrimary
          full
          style={{ padding: "14px 0" }}
          onClick={() => this._handleSubmit()}
        >
          Update tags for {`${numChecked} file${numChecked === 1 ? "" : "s"}`}
        </System.ButtonPrimary>
      </div>
    );
  }
}
