import * as React from "react";
import * as Constants from "~/common/constants";
import * as Validations from "~/common/validations";
import * as Window from "~/common/window";
import * as SVG from "~/common/svg";
import * as Actions from "~/common/actions";
import * as Events from "~/common/custom-events";
import * as ActivityUtilities from "~/common/activity-utilities";

import { GlobalCarousel } from "~/components/system/components/GlobalCarousel";
import { css } from "@emotion/react";
import { TabGroup, PrimaryTabGroup, SecondaryTabGroup } from "~/components/core/TabGroup";
import { LoaderSpinner } from "~/components/system/components/Loaders";
import { Link } from "~/components/core/Link";

import EmptyState from "~/components/core/EmptyState";
import ScenePage from "~/components/core/ScenePage";
import WebsitePrototypeWrapper from "~/components/core/WebsitePrototypeWrapper";
import ActivityGroup from "~/components/core/ActivityGroup";

import { useActivity } from "./hooks";

const STYLES_GROUPS_CONTAINER = css`
  margin-top: 32px;
  & > * + * {
    margin-top: 32px;
  }
`;

export default function SceneActivity({ page, viewer, onAction }) {
  const { feed, tab } = useActivity({ page, viewer, onAction });
  return (
    <WebsitePrototypeWrapper
      title={`${page.pageTitle} • Slate`}
      url={`${Constants.hostname}${page.pathname}`}
    >
      <ScenePage>
        {viewer && (
          <SecondaryTabGroup
            tabs={[
              { title: "My network", value: { tab: "activity" } },
              { title: "Explore", value: { tab: "explore" } },
            ]}
            value={tab}
            onAction={onAction}
            style={{ marginTop: 0 }}
          />
        )}
        <div css={STYLES_GROUPS_CONTAINER}>
          {feed?.map((group) => (
            <ActivityGroup key={group.id} {...group} />
          ))}
        </div>
      </ScenePage>
    </WebsitePrototypeWrapper>
  );
}
