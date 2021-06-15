import * as React from "react";
import * as NavigationData from "~/common/navigation-data";
import * as Actions from "~/common/actions";
import * as Strings from "~/common/strings";
import * as Styles from "~/common/styles";
import * as Credentials from "~/common/credentials";
import * as Constants from "~/common/constants";
import * as Validations from "~/common/validations";
import * as FileUtilities from "~/common/file-utilities";
import * as Window from "~/common/window";
import * as Store from "~/common/store";
import * as Websockets from "~/common/browser-websockets";
import * as UserBehaviors from "~/common/user-behaviors";
import * as Events from "~/common/custom-events";
import * as Logging from "~/common/logging";

// NOTE(jim):
// Scenes each have an ID and can be navigated to with _handleAction
import SceneError from "~/scenes/SceneError";
import SceneEditAccount from "~/scenes/SceneEditAccount";
import SceneFile from "~/scenes/SceneFile";
import SceneFilesFolder from "~/scenes/SceneFilesFolder";
import SceneSettings from "~/scenes/SceneSettings";
import SceneSlates from "~/scenes/SceneSlates";
import SceneSettingsDeveloper from "~/scenes/SceneSettingsDeveloper";
import SceneAuth from "~/scenes/SceneAuth";
import SceneSlate from "~/scenes/SceneSlate";
import SceneActivity from "~/scenes/SceneActivity";
import SceneDirectory from "~/scenes/SceneDirectory";
import SceneProfile from "~/scenes/SceneProfile";
import SceneArchive from "~/scenes/SceneArchive";
import SceneMakeFilecoinDeal from "~/scenes/SceneMakeFilecoinDeal";

// NOTE(jim):
// Sidebars each have a decorator and can be shown to with _handleAction
import SidebarCreateSlate from "~/components/sidebars/SidebarCreateSlate";
import SidebarCreateWalletAddress from "~/components/sidebars/SidebarCreateWalletAddress";
import SidebarWalletSendFunds from "~/components/sidebars/SidebarWalletSendFunds";
import SidebarFileStorageDeal from "~/components/sidebars/SidebarFileStorageDeal";
import SidebarAddFileToBucket from "~/components/sidebars/SidebarAddFileToBucket";
import SidebarAddFileToSlate from "~/components/sidebars/SidebarAddFileToSlate";
import SidebarDragDropNotice from "~/components/sidebars/SidebarDragDropNotice";
import SidebarSingleSlateSettings from "~/components/sidebars/SidebarSingleSlateSettings";
import SidebarFilecoinArchive from "~/components/sidebars/SidebarFilecoinArchive";
import SidebarHelp from "~/components/sidebars/SidebarHelp";
import SidebarFAQ from "~/components/sidebars/SidebarFAQ";
import SidebarEditTags from "~/components/sidebars/SidebarEditTags";

// NOTE(jim):
// Core components to the application structure.
import ApplicationHeader from "~/components/core/ApplicationHeader";
import ApplicationLayout from "~/components/core/ApplicationLayout";
import WebsitePrototypeWrapper from "~/components/core/WebsitePrototypeWrapper";
import CTATransition from "~/components/core/CTATransition";

import { GlobalModal } from "~/components/system/components/GlobalModal";
import { OnboardingModal } from "~/components/core/OnboardingModal";
import { SearchModal } from "~/components/core/SearchModal";
import { Alert } from "~/components/core/Alert";
import { announcements } from "~/components/core/OnboardingModal";
import { Logo } from "~/common/logo";
import { LoaderSpinner } from "~/components/system/components/Loaders";

const SIDEBARS = {
  SIDEBAR_FILECOIN_ARCHIVE: <SidebarFilecoinArchive />,
  SIDEBAR_FILE_STORAGE_DEAL: <SidebarFileStorageDeal />,
  SIDEBAR_WALLET_SEND_FUNDS: <SidebarWalletSendFunds />,
  SIDEBAR_CREATE_WALLET_ADDRESS: <SidebarCreateWalletAddress />,
  SIDEBAR_ADD_FILE_TO_BUCKET: <SidebarAddFileToBucket />,
  SIDEBAR_ADD_FILE_TO_SLATE: <SidebarAddFileToSlate />,
  SIDEBAR_CREATE_SLATE: <SidebarCreateSlate />,
  SIDEBAR_DRAG_DROP_NOTICE: <SidebarDragDropNotice />,
  SIDEBAR_SINGLE_SLATE_SETTINGS: <SidebarSingleSlateSettings />,
  SIDEBAR_HELP: <SidebarHelp />,
  SIDEBAR_FAQ: <SidebarFAQ />,
  SIDEBAR_EDIT_TAGS: <SidebarEditTags />,
};

const SCENES = {
  NAV_ERROR: <SceneError />,
  NAV_SIGN_IN: <SceneAuth />,
  NAV_ACTIVITY: <SceneActivity />,
  NAV_DIRECTORY: <SceneDirectory />,
  NAV_PROFILE: <SceneProfile />,
  NAV_DATA: <SceneFilesFolder />,
  // NAV_FILE: <SceneFile />,
  NAV_SLATE: <SceneSlate />,
  NAV_API: <SceneSettingsDeveloper />,
  NAV_SETTINGS: <SceneEditAccount />,
  NAV_SLATES: <SceneSlates />,
  NAV_DIRECTORY: <SceneDirectory />,
  NAV_FILECOIN: <SceneArchive />,
  NAV_STORAGE_DEAL: <SceneMakeFilecoinDeal />,
};

let mounted;

export default class ApplicationPage extends React.Component {
  _body;

  state = {
    selected: {},
    viewer: this.props.viewer,
    page: this.props.page || {},
    data: this.props.data,
    activePage: this.props.page?.id,
    sidebar: null,
    online: null,
    isMobile: this.props.isMobile,
    activeUsers: null,
    loading: false,
  };

  async componentDidMount() {
    this._handleWindowResize();
    if (mounted) {
      return false;
    }

    mounted = true;

    window.addEventListener("dragenter", this._handleDragEnter);
    window.addEventListener("dragleave", this._handleDragLeave);
    window.addEventListener("dragover", this._handleDragOver);
    window.addEventListener("drop", this._handleDrop);
    window.addEventListener("online", this._handleOnlineStatus);
    window.addEventListener("offline", this._handleOnlineStatus);
    window.addEventListener("resize", this._handleWindowResize);
    window.addEventListener("paste", this._handleUploadFromClipboard);
    window.onpopstate = this._handleBackForward;

    if (this.state.viewer) {
      await this._handleSetupWebsocket();
    }
  }

  componentWillUnmount() {
    window.removeEventListener("dragenter", this._handleDragEnter);
    window.removeEventListener("dragleave", this._handleDragLeave);
    window.removeEventListener("dragover", this._handleDragOver);
    window.removeEventListener("drop", this._handleDrop);
    window.removeEventListener("online", this._handleOnlineStatus);
    window.removeEventListener("offline", this._handleOnlineStatus);
    window.removeEventListener("resize", this._handleWindowResize);
    window.removeEventListener("paste", this._handleUploadFromClipboard);

    mounted = false;

    let wsclient = Websockets.getClient();
    if (wsclient) {
      Websockets.deleteClient();
    }
  }

  _handleUploadFromClipboard = (e) => {
    const clipboardItems = e.clipboardData.items || [];
    if (!clipboardItems) return;

    const { fileLoading, toUpload } = FileUtilities.formatPastedImages({
      clipboardItems,
    });

    this._handleRegisterFileLoading({ fileLoading });

    const page = this.state.page;
    let slate = null;
    if (page?.id === "NAV_SLATE" && this.state.data?.ownerId === this.state.viewer?.id) {
      slate = this.state.data;
    }

    FileUtilities.uploadFiles({
      files: toUpload,
      slate,
      keys: Object.keys(fileLoading),
      resources: this.props.resources,
      context: this,
    });
  };

  _handleUpdateViewer = ({ viewer, callback }) => {
    // _handleUpdateViewer = (newViewerState, callback) => {
    // let setAsyncState = (newState) =>
    //   new Promise((resolve) =>
    //     this.setState(
    //       {
    //         viewer: { ...this.state.viewer, ...newState, type: "VIEWER" },
    //       },
    //       resolve
    //     )
    //   );
    // await setAsyncState(newViewerState);

    //NOTE(martina): if updating viewer affects this.state.data (e.g. you're viewing your own slate), update data as well
    if (viewer?.slates?.length) {
      const page = this.state.page;
      if (page?.id === "NAV_SLATE" && this.state.data?.ownerId === this.state.viewer.id) {
        let data = this.state.data;
        for (let slate of viewer.slates) {
          if (slate.id === data.id) {
            data = slate;
            break;
          }
        }
        this.setState(
          {
            viewer: { ...this.state.viewer, ...viewer },
            data,
          },
          () => {
            if (callback) {
              callback();
            }
          }
        );
        return;
      }
    }
    this.setState(
      {
        viewer: { ...this.state.viewer, ...viewer },
      },
      () => {
        if (callback) {
          callback();
        }
      }
    );
  };

  _handleUpdateData = ({ data, callback }) => {
    // _handleUpdateData = (data, callback) => {
    //TODO(martina): maybe add a default window.history.replacestate where it pushes the new data to browser?
    this.setState({ data }, () => {
      if (callback) {
        callback();
      }
    });
  };

  _handleSetupWebsocket = async () => {
    let wsclient = Websockets.getClient();
    if (wsclient) {
      await Websockets.deleteClient();
      wsclient = null;
    }
    if (this.props.resources && !Strings.isEmpty(this.props.resources.pubsub)) {
      if (!this.state.viewer) {
        Logging.error("WEBSOCKET: NOT AUTHENTICATED");
        return;
      }
      wsclient = Websockets.init({
        resource: this.props.resources.pubsub,
        viewer: this.state.viewer,
        onUpdate: this._handleUpdateViewer,
        onNewActiveUser: this._handleNewActiveUser,
      });
    }
    if (!wsclient) {
      Events.dispatchMessage({
        message:
          "We cannot connect to our live update server. You may have to refresh to see updates.",
      });
    }
    return;
  };

  _handleNewActiveUser = (users) => {
    this.setState({ activeUsers: users });
  };

  _handleWindowResize = () => {
    const { width } = Window.getViewportSize();

    // (1) is Window.isMobileBrowser checks, that one holds.
    // (2) then if the viewport is smaller than the width
    let isMobile = width > Constants.sizes.mobile ? this.props.isMobile : true;

    // only change if necessary.
    if (this.state.isMobile !== isMobile) {
      Logging.log("changing to mobile?", isMobile);
      this.setState({ isMobile });
    }
  };

  _handleOnlineStatus = async () => {
    if (navigator.onLine) {
      Events.dispatchMessage({ message: "Back online!", status: "INFO" });
    } else {
      Events.dispatchMessage({ message: "Offline. Trying to reconnect" });
    }
    this.setState({ online: navigator.onLine });
  };

  _handleDrop = async (e) => {
    e.preventDefault();
    this.setState({ sidebar: null });
    const { fileLoading, files, numFailed, error } = await FileUtilities.formatDroppedFiles({
      dataTransfer: e.dataTransfer,
    });

    if (error) {
      return null;
    }

    let page = this.state.page;

    let slate = null;
    if (page?.id === "NAV_SLATE" && this.state.data?.ownerId === this.state.viewer?.id) {
      slate = this.state.data;
    }

    this._handleRegisterFileLoading({ fileLoading });
    FileUtilities.uploadFiles({
      files,
      slate,
      keys: Object.keys(fileLoading),
      numFailed,
      resources: this.props.resources,
      context: this,
    });
  };

  _handleUploadFiles = async ({ files, slate }) => {
    const { fileLoading, toUpload, numFailed } = FileUtilities.formatUploadedFiles({ files });

    this._handleRegisterFileLoading({ fileLoading });
    FileUtilities.uploadFiles({
      files: toUpload,
      slate,
      keys: Object.keys(fileLoading),
      numFailed,
      resources: this.props.resources,
      context: this,
    });
  };

  _handleRegisterFileLoading = ({ fileLoading }) => {
    if (this.state.fileLoading) {
      return this.setState({
        fileLoading: { ...this.state.fileLoading, ...fileLoading },
      });
    }
    return this.setState({
      fileLoading,
    });
  };

  _handleRegisterFileCancelled = ({ key }) => {
    let fileLoading = this.state.fileLoading;
    fileLoading[key].cancelled = true;
    this.setState({ fileLoading });
  };

  _handleRegisterLoadingFinished = ({ keys }) => {
    let fileLoading = this.state.fileLoading;
    for (let key of keys) {
      delete fileLoading[key];
    }
    this.setState({ fileLoading });
  };

  _handleDragEnter = (e) => {
    e.preventDefault();
    if (this.state.sidebar) {
      return;
    }

    // NOTE(jim): Only allow the sidebar to show with file drag and drop.
    if (e.dataTransfer?.items?.length && e.dataTransfer.items[0].kind !== "file") {
      return;
    }

    this._handleAction({
      type: "SIDEBAR",
      value: "SIDEBAR_DRAG_DROP_NOTICE",
    });
  };

  _handleDragLeave = (e) => {
    e.preventDefault();
  };

  _handleDragOver = (e) => {
    e.preventDefault();
  };

  _withAuthenticationBehavior = (authenticate) => async (state, newAccount) => {
    let response = await authenticate(state);
    if (Events.hasError(response)) {
      return response;
    }
    if (response.shouldMigrate) {
      return response;
    }
    let viewer = await UserBehaviors.hydrate();
    if (Events.hasError(viewer)) {
      return viewer;
    }

    this.setState({ viewer });
    await this._handleSetupWebsocket();

    let unseenAnnouncements = [];
    for (let feature of announcements) {
      if (!viewer.data.onboarding || !Object.keys(viewer.data.onboarding).includes(feature)) {
        unseenAnnouncements.push(feature);
      }
    }

    if (newAccount || unseenAnnouncements.length) {
      Events.dispatchCustomEvent({
        name: "create-modal",
        detail: {
          modal: (
            <OnboardingModal
              onAction={this._handleAction}
              viewer={viewer}
              newAccount={newAccount}
              unseenAnnouncements={unseenAnnouncements}
            />
          ),
          noBoundary: true,
        },
      });
    }

    if (newAccount) {
      Actions.updateSearch("create-user");
    }

    // let redirected = this._handleURLRedirect();
    // if (!redirected) {
    //   this._handleAction({ type: "NAVIGATE", value: "NAV_DATA" });
    // }
    window.location.replace("/_/activity");

    return response;
  };

  _handleSelectedChange = (e) => {
    this.setState({
      selected: { ...this.state.selected, [e.target.name]: e.target.value },
    });
  };

  _handleDismissSidebar = () => {
    this.setState({ sidebar: null, sidebarData: null });
  };

  _handleAction = (options) => {
    if (options.type === "NAVIGATE") {
      return this._handleNavigateTo(options);
    }

    if (options.type === "UPDATE_VIEWER") {
      return this._handleUpdateViewer(options);
    }

    if (options.type === "UPDATE_PARAMS") {
      return this._handleUpdatePageParams(options);
    }

    if (options.type === "SIDEBAR") {
      return this.setState({
        sidebar: SIDEBARS[options.value],
        sidebarData: options.data,
      });
    }

    if (options.type === "REGISTER_FILE_CANCELLED") {
      return this._handleRegisterFileCancelled({ key: options.value });
    }

    if (options.type === "NEW_WINDOW") {
      return window.open(options.value);
    }

    Logging.error("Error: Failed to _handleAction because TYPE did not match any known actions");
  };

  _handleNavigateTo = async ({ href, redirect = false, popstate = false }) => {
    const { page, details } = NavigationData.getByHref(href, this.state.viewer);

    Events.dispatchCustomEvent({ name: "slate-global-close-carousel", detail: {} });

    if (redirect || popstate) {
      window.history.replaceState(null, "Slate", page.pathname);
    } else {
      window.history.pushState(null, "Slate", page.pathname);
    }

    let state = { data: null, sidebar: null, page };
    if (!next.ignore) {
      state.activePage = page.id;
    }

    let body = document.documentElement || document.body;
    if (page.id === "NAV_SLATE" || page.id === "NAV_PROFILE") {
      state.loading = true;
    }
    this.setState(state, () => {
      if (!popstate) {
        body.scrollTo(0, 0);
      }
      if (page.id === "NAV_SLATE" || page.id === "NAV_PROFILE") {
        this.updateDataAndPathname({ page, details });
      }
    });
  };

  updateDataAndPathname = async ({ page, details }) => {
    let pathname = page.pathname.split("?")[0];
    let search = Strings.getQueryStringFromParams(page.params);
    let data;
    if (page?.id === "NAV_SLATE") {
      let response = await Actions.getSerializedSlate(details);
      if (!response || response.error) {
        this.setState({ loading: false });
        this._handleNavigateTo({ href: "/_/404", redirect: true });
        return;
      }
      data = response.data;
      pathname = `/${data.user.username}/${data.slatename}${search}`;
    } else if (page?.id === "NAV_PROFILE") {
      let response = await Actions.getSerializedProfile(details);
      if (!response || response.error) {
        this.setState({ loading: false });
        this._handleNavigateTo({ href: "/_/404", redirect: true });
        return;
      }
      data = response.data;
      pathname = `/${data.username}${search}`;
    }

    this.setState({ data, loading: false });

    window.history.replaceState(null, "Slate", pathname);
  };

  _handleUpdatePageParams = ({ params, callback, redirect = false }) => {
    let query = Strings.getQueryStringFromParams(params);
    const href = window.location.pathname.concat(query);
    if (redirect) {
      window.history.replaceState(null, "Slate", href);
    } else {
      window.history.pushState(null, "Slate", href);
    }
    this.setState({ page: { ...this.state.page, params } }, () => {
      if (callback) {
        callback();
      }
    });
  };

  _handleBackForward = () => {
    let href = window.location.pathname.concat(
      window.location.search ? `${window.location.search}` : ""
    );
    this._handleNavigateTo({ href, popstate: true });
  };

  render() {
    let page = this.state.page;
    if (!page?.id) {
      page = NavigationData.getById(null, this.state.viewer);
    }
    let headerElement;
    if (page.id !== "NAV_SIGN_IN") {
      headerElement = (
        <ApplicationHeader
          viewer={this.state.viewer}
          navigation={NavigationData.navigation}
          page={page}
          onAction={this._handleAction}
          isMobile={this.state.isMobile}
          isMac={this.props.isMac}
          activePage={this.state.activePage}
        />
      );
    }

    const scene = React.cloneElement(SCENES[page.id], {
      key: this.state.data?.id,
      page: page,
      data: this.state.data,
      viewer: this.state.viewer,
      selected: this.state.selected,
      onSelectedChange: this._handleSelectedChange,
      onAuthenticate: this._withAuthenticationBehavior(UserBehaviors.authenticate),
      onTwitterAuthenticate: this._withAuthenticationBehavior(UserBehaviors.authenticateViaTwitter),
      onAction: this._handleAction,
      onUpload: this._handleUploadFiles,
      isMobile: this.state.isMobile,
      isMac: this.props.isMac,
      resources: this.props.resources,
      activeUsers: this.state.activeUsers,
      userBucketCID: this.state.userBucketCID,
      external: !!!this.state.viewer,
    });

    let sidebarElement;
    if (this.state.sidebar) {
      sidebarElement = React.cloneElement(this.state.sidebar, {
        page: page,
        selected: this.state.selected,
        viewer: this.state.viewer,
        data: this.state.data,
        sidebarData: this.state.sidebarData,
        fileLoading: this.state.fileLoading,
        onSelectedChange: this._handleSelectedChange,
        onCancel: this._handleDismissSidebar,
        onUpload: this._handleUploadFiles,
        onAction: this._handleAction,
        resources: this.props.resources,
      });
    }

    const title = `Slate: ${page.pageTitle}`;
    const description = "";
    const url = "https://slate.host/_";

    // if (!this.state.loaded) {
    //   return (
    //     <WebsitePrototypeWrapper description={description} title={title} url={url}>
    //       <div
    //         style={{
    //           height: "100vh",
    //           display: "flex",
    //           alignItems: "center",
    //           justifyContent: "center",
    //         }}
    //       >
    //         <Logo style={{ width: "20vw", maxWidth: "200px" }} />
    //       </div>
    //     </WebsitePrototypeWrapper>
    //   );
    // }
    return (
      <React.Fragment>
        <ApplicationLayout
          page={page}
          onAction={this._handleAction}
          header={headerElement}
          sidebar={sidebarElement}
          onDismissSidebar={this._handleDismissSidebar}
          fileLoading={this.state.fileLoading}
          isMobile={this.state.isMobile}
          isMac={this.props.isMac}
          viewer={this.state.viewer}
        >
          {this.state.loading ? (
            <div
              css={Styles.CONTAINER_CENTERED}
              style={{
                width: "100vw",
                height: "100vh",
              }}
            >
              <LoaderSpinner style={{ height: 32, width: 32 }} />
            </div>
          ) : (
            scene
          )}
        </ApplicationLayout>
        <GlobalModal />
        <SearchModal
          viewer={this.state.viewer}
          onAction={this._handleAction}
          isMobile={this.props.isMobile}
          resourceURI={this.props.resources.search}
        />
        <CTATransition onAction={this._handleAction} />
        {/* {!this.state.loaded ? (
            <div
              style={{
                position: "absolute",
                width: "100vw",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Logo style={{ width: "20vw", maxWidth: "200px" }} />
            </div>
          ) : null} */}
      </React.Fragment>
    );
  }
}
