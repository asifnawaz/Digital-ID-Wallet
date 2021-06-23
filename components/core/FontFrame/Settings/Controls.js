import * as React from "react";
import * as SVG from "~/common/svg";
import * as Constants from "~/common/constants";

import { P1 } from "~/components/system/components/Typography";
import { Slider } from "~/components/system/components/Slider";
import { css } from "@emotion/react";

import Select from "~/components/core/FontFrame/Settings/Select";

const STYLES_LABEL = (theme) => css`
  font-size: 0.875rem;
  color: ${theme.fontPreviewDarkMode ? theme.system.gray70 : theme.system.textGrayLight};
  margin-bottom: 4px;
`;

export const Controller = ({
  value,
  options,
  onChange,
  selectSuffix = "",
  //NOTE(Amine): minWidth will remove junk when Select value change
  selectMinWidth,
  label,
  min,
  max,
  step,
  disabled,
}) => {
  return (
    <div
      css={
        disabled &&
        css`
          opacity: 0.3;
          pointer-events: none;
        `
      }
    >
      <P1 css={STYLES_LABEL}>{label}</P1>
      <div css={css({ display: "flex", alignItems: "center" })}>
        <Select
          options={options}
          value={value}
          onChange={onChange}
          placeholderSuffix={selectSuffix}
          minWidth={selectMinWidth}
        />
        <div style={{ width: "100%" }}>
          <Slider
            discrete
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            containerStyle={{ height: "auto", marginLeft: "18px" }}
            sliderBarStyle={(theme) => css`
              height: 2px;
              background-color: ${theme.fontPreviewDarkMode
                ? theme.system.gray70
                : theme.system.gray30};
            `}
            activeBarStyle={(theme) => css`
              height: 2px;
              bottom: 2px;
              background-color: ${theme.fontPreviewDarkMode
                ? theme.system.white
                : theme.system.gray80};
            `}
            handleStyle={(theme) => css`
              width: 15px;
              height: 15px;
              bottom: 11px;
              background-color: ${theme.fontPreviewDarkMode
                ? theme.system.white
                : theme.system.gray80};

              :hover {
                box-shadow: 0 0 0 4px
                  ${theme.fontPreviewDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(75, 74, 77, 0.1)"};
              }
              :active {
                box-shadow: 0 0 0 8px
                  ${theme.fontPreviewDarkMode
                    ? "rgba(255, 255, 255, 0.2)"
                    : "rgba(75, 74, 77, 0.2)"};
              }
            `}
          />
        </div>
      </div>
    </div>
  );
};

const STYLES_CONTENT_SELECT = (theme) => css`
  display: flex;
  justify-content: space-between;
  width: 100%;
  border: 1px solid ${theme.fontPreviewDarkMode ? Constants.system.gray80 : Constants.system.gray20};
  padding: 8px 12px;
  border-radius: 4px;
`;

export const ContentControl = ({ options, value, onChange, showLabel = true }) => {
  return (
    <div
      css={css`
        width: 100%;
      `}
    >
      {showLabel && <P1 css={STYLES_LABEL}>Content</P1>}
      <Select
        inputStyle={STYLES_CONTENT_SELECT}
        options={options}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

const STYLES_ALIGNEMENT_BUTTON = (theme) => css`
  display: flex;
  border-radius: 4px;
  border: 1px solid ${theme.fontPreviewDarkMode ? theme.system.textGrayDark : theme.system.gray20};
  margin-left: 16px;
  button {
    display: block;
    box-sizing: border-box;
    cursor: pointer;
    padding: 8px 12px;
    margin: 0;
    border: none;
  }
  button:focus {
    outline: none;
  }

  svg {
    display: block;
  }
`;

const getIconColor = (isActive, theme) => {
  const darkMode = isActive ? theme.system.white : theme.system.textGray;
  const lightMode = isActive ? theme.system.gray80 : theme.system.textGray;
  return theme.fontPreviewDarkMode ? darkMode : lightMode;
};
const getBackgroundColor = (isActive, theme) => {
  if (!isActive) return "transparent";
  return theme.fontPreviewDarkMode ? theme.system.gray80 : theme.system.gray20;
};
const STYLES_ALIGN_BUTTON = (isActive) => (theme) => css`
  background-color: ${getBackgroundColor(isActive, theme)};
  path {
    stroke: ${getIconColor(isActive, theme)};
  }
`;
export const AlignmentControl = ({
  vAlign,
  textAlign,
  options,
  onChange,
  updateTextAlign,
  disabled,
}) => {
  return (
    <div
      css={
        disabled &&
        css`
          opacity: 0.3;
          pointer-events: none;
        `
      }
    >
      <P1 css={STYLES_LABEL}>Alignment</P1>
      <div css={css({ display: "flex", alignItems: "center" })}>
        <Select options={options} value={vAlign} onChange={onChange} />
        <div css={STYLES_ALIGNEMENT_BUTTON}>
          <button
            onClick={() => updateTextAlign("left")}
            css={STYLES_ALIGN_BUTTON(textAlign === "left")}
          >
            <SVG.AlignLeft height={16} width={16} />
          </button>
          <button
            onClick={() => updateTextAlign("center")}
            css={STYLES_ALIGN_BUTTON(textAlign === "center")}
          >
            <SVG.AlignCenter height={16} width={16} />
          </button>
          <button
            onClick={() => updateTextAlign("right")}
            css={STYLES_ALIGN_BUTTON(textAlign === "right")}
          >
            <SVG.AlignRight height={16} width={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const STYLES_SETTINGS_WRAPPER = (theme) => css`
  box-sizing: border-box;
  display: flex;
  border-radius: 4px;
  border: 1px solid ${theme.fontPreviewDarkMode ? theme.system.textGrayDark : theme.system.gray20};
  justify-content: space-between;
  overflow: hidden;
  button {
    display: block;
    box-sizing: border-box;
    cursor: pointer;
    padding: 8px 12px;
    margin: 0;
    border: none;
    background: none;
    color: ${theme.fontPreviewDarkMode ? theme.system.white : theme.system.textGrayDark};
  }
  button:focus {
    outline: none;
  }

  svg {
    display: block;
    path {
      stroke: ${theme.fontPreviewDarkMode ? theme.system.white : theme.system.textGrayDark};
    }
  }
  .reset_button {
    border-left: 1px solid
      ${theme.fontPreviewDarkMode ? theme.system.textGrayDark : theme.system.gray20};
  }
`;

const STYLES_FEELING_LUCKY = css`
  width: 100%;
  text-align: left;
`;

export const SettingsControl = ({ getRandomLayout, resetLayout }) => (
  <div>
    <P1 css={STYLES_LABEL}>Settings</P1>
    <div css={STYLES_SETTINGS_WRAPPER}>
      <button css={STYLES_FEELING_LUCKY} onClick={getRandomLayout}>
        <P1
          css={css`
            font-size: 14px;
            white-space: pre;
          `}
        >
          I’m feeling lucky
        </P1>
      </button>
      <button className="reset_button" onClick={resetLayout}>
        <SVG.RotateCcw height={16} width={16} />
      </button>
    </div>
  </div>
);
