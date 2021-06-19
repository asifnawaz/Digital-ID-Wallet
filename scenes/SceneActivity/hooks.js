import * as React from "react";
import * as Actions from "~/common/actions";
import * as Events from "~/common/custom-events";
import * as ActivityUtilities from "~/common/activity-utilities";

const fetchExploreItems = (viewer, onAction, state, setState) => async (update) => {
  const sections = viewer?.explore || state.explore || [];
  const requestObject = {};
  if (sections.length) {
    if (update) {
      requestObject.latestTimestamp = sections[0].createdAt;
    } else {
      requestObject.earliestTimestamp = sections[sections.length - 1].createdAt;
    }
  }

  const response = await Actions.getExplore(requestObject);
  if (Events.hasError(response)) {
    return;
  }

  const newItems = response.data || [];
  const newSections = ActivityUtilities.processActivity(newItems);
  const newExploreFeed = [...sections, ...newSections];

  if (viewer) {
    onAction({ type: "UPDATE_VIEWER", viewer: { explore: newExploreFeed } });
    return;
  }

  setState({ explore: newExploreFeed });
};

const fetchActivityItems = (viewer, onAction) => async (update) => {
  const sections = viewer?.activity || [];
  const requestObject = {};
  if (sections.length) {
    if (update) {
      requestObject.latestTimestamp = sections[0].createdAt;
    } else {
      requestObject.earliestTimestamp = sections[sections.length - 1].createdAt;
    }
  }
  requestObject.following = viewer.following.map((item) => item.id);
  requestObject.subscriptions = viewer.subscriptions.map((item) => item.id);

  const response = await Actions.getActivity(requestObject);
  if (Events.hasError(response)) {
    return;
  }

  const newItems = response.data || [];
  const newSections = ActivityUtilities.processActivity(newItems);
  const newActivityFeed = [...sections, ...newSections];

  onAction({ type: "UPDATE_VIEWER", viewer: { activity: newActivityFeed } });
};

const getSections = (viewer, state, tab) => {
  if (!viewer) return state.explore;

  if (tab === "explore") {
    return viewer.explore;
  }
  return viewer.activity;
};

const getTab = (page, viewer) => {
  if (page.params?.tab) return page.params?.tab;

  if (viewer?.subscriptions?.length || viewer?.following?.length) {
    return "activity";
  }
  return "explore";
};

export function useActivity({ page, viewer, onAction }) {
  const [state, setState] = React.useState({ explore: [], loading: true });

  const tab = getTab(page, viewer);

  const fetchNewItems = React.useMemo(
    () =>
      viewer && tab === "activity"
        ? fetchActivityItems(viewer, onAction)
        : fetchExploreItems(viewer, onAction, state, setState),
    [tab, viewer]
  );
  const feed = getSections(viewer, state, tab);

  React.useEffect(() => {
    if (feed && feed?.length !== 0) return;

    fetchNewItems(true);
  }, [tab]);

  return { fetActivityItems: fetchNewItems, feed, tab, isloading: state.loading };
}
