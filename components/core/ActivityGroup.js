import * as React from "react";
import * as Constants from "~/common/constants";
import * as Validations from "~/common/validations";
import * as Window from "~/common/window";
import * as SVG from "~/common/svg";
import * as Actions from "~/common/actions";
import * as Events from "~/common/custom-events";
import * as ActivityUtilities from "~/common/activity-utilities";
import * as Styles from "~/common/styles";
import * as Strings from "~/common/strings";
import * as Utilities from "~/common/utilities";

import { GlobalCarousel } from "~/components/system/components/GlobalCarousel";
import { css } from "@emotion/react";
import { TabGroup, PrimaryTabGroup, SecondaryTabGroup } from "~/components/core/TabGroup";
import { P } from "~/components/system/components/Typography";
import { LoaderSpinner } from "~/components/system/components/Loaders";
import { Link } from "~/components/core/Link";
import { AnimatePresence, motion } from "framer-motion";

import EmptyState from "~/components/core/EmptyState";
import ScenePage from "~/components/core/ScenePage";
import WebsitePrototypeWrapper from "~/components/core/WebsitePrototypeWrapper";
import ObjectPreview from "~/components/core/ObjectPreview";
import CollectionPreview from "~/components/core/CollectionPreview";

const STYLES_OBJECT_GRID = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(248px, 1fr));
  grid-gap: 20px 12px;

  @media (max-width: ${Constants.sizes.mobile}px) {
    grid-template-columns: repeat(auto-fill, minmax(169px, 1fr));
  }
`;

const STYLES_GROUP_GRID = css`
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-row-gap: 32px;
  border-bottom: 1px solid #e5e5ea;
  padding-bottom: 24px;
`;

const STYLES_PROFILE_CONTAINER = css`
  display: flex;
  padding-right: 12px;
  box-sizing: border-box;
  & > * + * {
    margin-left: 8px;
  }
`;

const STYLES_TEXT_BLACK = (theme) =>
  css`
    color: ${theme.system.textBlack};
  `;

const STYLES_TEXT_GRAY_DARK = (theme) =>
  css`
    color: ${theme.system.textGrayDark};
  `;

const TEXT_TRUNCATE = css`
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  -webkit-line-clamp: 2;
  display: -webkit-box;
  -webkit-box-orient: vertical;
`;

const STYLES_PROFILE = css`
  width: 48px;
  height: 48px;
  border-radius: 8px;
`;

const ProfileInfo = ({ owner, time, action }) => {
  const { username, data = {} } = owner;
  const { photo } = data;
  return (
    <div css={STYLES_PROFILE_CONTAINER}>
      <img src={photo} alt={`${username} profile`} css={STYLES_PROFILE} />
      <div>
        <div css={Styles.HORIZONTAL_CONTAINER_CENTERED}>
          <P css={[STYLES_TEXT_BLACK, Styles.HEADING_04]}>{username}</P>
          <P css={[STYLES_TEXT_BLACK, Styles.HEADING_04]}>&nbsp;•&nbsp;</P>
          <P css={[STYLES_TEXT_GRAY_DARK, Styles.BODY_02]}>{time}</P>
        </div>
        <P css={[STYLES_TEXT_GRAY_DARK, TEXT_TRUNCATE, Styles.BODY_02]}>{action}</P>
      </div>
    </div>
  );
};

const STYLES_VIEW_MORE_CONTAINER = (theme) => css`
  background-color: ${theme.system.white};
  border: none;
  padding: 8px;
  border-radius: 8px;
  margin-top: 24px;
`;

const STYLES_SHOW_MORE_PREVIEWS = css`
  border-radius: 4px;
  height: 24px;
  width: 24px;
  background-color: red;
`;

const ViewMoreContent = ({ items, children, ...props }) => (
  <button css={[Styles.HOVERABLE, STYLES_VIEW_MORE_CONTAINER]} {...props}>
    <div css={Styles.HORIZONTAL_CONTAINER_CENTERED}>
      <div css={Styles.HORIZONTAL_CONTAINER_CENTERED}>
        {items?.slice(0, 3).map((src, i) => (
          <div
            key={i}
            style={{ marginLeft: 2 }}
            css={STYLES_SHOW_MORE_PREVIEWS}
            alt="file preview"
          />
        ))}
      </div>
      <P style={{ marginLeft: 12 }} css={Styles.HEADING_05}>
        {children}
      </P>
    </div>
  </button>
);

const ActivityCreateFileGroup = ({ file, owner, slate, type }) => {
  const { elements, restElements } = React.useMemo(() => {
    if (!Array.isArray(file)) {
      return { elements: [file] };
    }
    return { elements: file.slice(0, 4), restElements: file.slice(4) };
  }, [file]);

  const [showMore, setShowMore] = React.useState(false);
  const viewMoreFiles = () => setShowMore(true);

  const timeSinceUploaded = Utilities.getTimeUnitBetween(elements[0].createdAt);
  const nbrOfFilesUploaded = elements.length + (restElements?.length || 0);
  const action = React.useMemo(() => {
    if (type === "CREATE_FILE") {
      return `uploaded ${nbrOfFilesUploaded} ${Strings.pluralize("file", nbrOfFilesUploaded)} ${
        slate ? `to ${slate.slatename}` : ""
      }`;
    }
    return `added ${nbrOfFilesUploaded} ${Strings.pluralize("file", nbrOfFilesUploaded)} ${
      slate && `to ${slate.slatename}`
    }`;
  }, []);

  return (
    <div css={STYLES_GROUP_GRID}>
      <ProfileInfo time={timeSinceUploaded} owner={owner} action={action} />
      <div>
        <div css={STYLES_OBJECT_GRID}>
          {elements.map((file) => (
            <ObjectPreview key={file.id} file={file} />
          ))}
          {showMore &&
            restElements.map((file, i) =>
              // NOTE(amine): animate only the first 8 elements
              i < 8 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={file.id}
                >
                  <ObjectPreview file={file} />
                </motion.div>
              ) : (
                <ObjectPreview file={file} />
              )
            )}
        </div>
        {!showMore && restElements?.length ? (
          <ViewMoreContent items={restElements} onClick={viewMoreFiles}>
            View {restElements.length} more {Strings.pluralize("file", restElements.length)}
          </ViewMoreContent>
        ) : null}
      </div>
    </div>
  );
};

const ActivitySlateGroup = ({ owner, slate, ...props }) => {
  const { elements, restElements } = React.useMemo(() => {
    if (!Array.isArray(slate)) {
      return { elements: [slate] };
    }
    return { elements: slate.slice(0, 4), restElements: slate.slice(4) };
  }, [slate]);

  const [showMore, setShowMore] = React.useState(false);
  const viewMoreFiles = () => setShowMore(true);

  // const timeSinceUploaded = Utilities.getTimeUnitBetween(elements[0].createdAt);
  const nbrOfFilesUploaded = elements.length + (restElements?.length || 0);
  const action = `Martina created ${nbrOfFilesUploaded} ${Strings.pluralize(
    "collection",
    nbrOfFilesUploaded
  )}`;
  return (
    <div css={STYLES_GROUP_GRID} {...props}>
      <ProfileInfo time={"5h"} owner={owner} action={action} />
      <div>
        <div>
          {elements.map((collection) => (
            <CollectionPreview key={collection.id} collection={collection} />
          ))}
        </div>
        {!showMore && restElements?.length ? (
          <ViewMoreContent items={restElements} onClick={viewMoreFiles}>
            View {restElements.length} more {Strings.pluralize("file", restElements.length)}
          </ViewMoreContent>
        ) : null}
      </div>
    </div>
  );
};

export default function ActivityGroup({ type, owner, file, slate, ...group }) {
  if (type === "CREATE_FILE" || type === "CREATE_SLATE_OBJECT") {
    return <ActivityCreateFileGroup file={file} owner={owner} type={type} slate={slate} />;
  }
  if (type === "CREATE_SLATE") {
    return <ActivitySlateGroup owner={owner} slate={slate} />;
  }

  return (
    <div css={STYLES_GROUP_GRID}>
      <div>{type}</div>
    </div>
  );
}
