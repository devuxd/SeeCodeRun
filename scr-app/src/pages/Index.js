import React, {createRef, PureComponent, Suspense, useMemo,} from 'react';
import {compose} from 'redux';
import {connect} from 'react-redux'
import PropTypes from 'prop-types';
import {withStyles} from '@mui/styles';
import {SnackbarProvider} from 'notistack';
import {takeUntil} from 'rxjs/operators';

import withThemes, {ThemeContext} from '../themes';
import NotificationCenter from '../containers/NotificationCenter';
// import Pastebin from '../containers/Pastebin';

// import {editorIds} from '../core/AppManager';
import {end$, online$} from '../utils/scrUtils';

import {switchMonacoTheme} from '../redux/modules/monaco';
import withMediaQuery from '../utils/withMediaQuery';
import LazyChat from "../containers/LazyChat";


let importedPastebin = null;
const Pastebin = (props) => {
    const ImportedPastebin = useMemo(
        () => (importedPastebin ??= React.lazy(() => import('../containers/Pastebin'))),
        []
    );

    return (
        <Suspense fallback={<h4>Loading Pastebin...</h4>}>
            <ImportedPastebin {...props}/>
        </Suspense>
    );
};

const mapDispatchToProps = {switchMonacoTheme};

const mapStateToProps = (
    {
        firecoReducer,
        pastebinReducer,
    },
    {
        url,
    }
) => {
    const {isConnected, authUser, isFirecoEditorsReady} = firecoReducer;
    const {pastebinId} = pastebinReducer;

    return {
        pastebinId,
        shareUrl: pastebinId ? `${url}/#:${pastebinId}` : null,
        isConnected,
        loadChat: !!authUser && isFirecoEditorsReady,
    }
};


const styles = theme => {
    const {margin} = theme.appUnits;

    return {
        root: {
            display: 'block',
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            minWidth: 800,
            minHeight: 600,
        },
        margin: {
            margin,
        },
        scroller: {
            overflow: 'auto',
            height: '100%',
            width: '100%',
            margin: 0,
            padding: 0,
        },
    }
};

const getRootContainerBottomMargin = (
    isTopNavigationToggled, appUnits
) => {
    const {rowHeight, rowHeightSmall} = appUnits;
    const {innerWidth} = global;

    return (
        isTopNavigationToggled ? 0
            : innerWidth > 600 ? rowHeight
                : rowHeightSmall
    );
};

const getHeightAdjust = (
    isTopNavigationToggled, appUnits
) => {
    const {margin} = appUnits;

    return (
        isTopNavigationToggled ? margin
            : getRootContainerBottomMargin(
            isTopNavigationToggled, appUnits) + margin * 2
    );
};

class Index extends PureComponent {
    constructor(props) {
        super(props);
        this.pastebinRef = createRef();
        this.gridRef = createRef();
    }

    sendNotification = (message, autoHideDuration) => {
        this.setState({
            notification: {
                message,
                autoHideDuration
            }
        });
    };
    logoClick = (event, isTopNavigationToggled) => {
        this.setState((prevState) => ({
            isTopNavigationToggled:
                event ?
                    !prevState.isTopNavigationToggled
                    : isTopNavigationToggled,
        }));
    };

    changeShowNetworkState = showNetworkState => {
        this.setState({
            showNetworkState
        });
    };

    handleShareMenu = event => {
        this.setState({
            shareAnchorEl: event?.currentTarget,
        });
    };

    handleShareClose = () => {
        this.setState({shareAnchorEl: null});
    };

    shareClick = event => {
        event && event.preventDefault();
        const {shareUrl} = this.props;
        shareUrl && global.open(shareUrl, '_blank');
        this.handleShareClose();
    };

    shareClipboardClick = (/*link*/) => {
        this.sendNotification(
            'Pastebin URL for sharing has been copied' +
            ' to your clipboard.'
        );
        this.handleShareClose();
    };

    chatClick = (event, isChatToggled) => {
        this.setState((prevState) => ({
                isChatToggled: event ?
                    !prevState.isChatToggled
                    : isChatToggled,
                isUserAction: event ? true : prevState.activateChatReason,
            })
        );
    };

    isNetworkOk = () => {
        const {isConnected} = this.props;
        const {isOnline} = this.state;
        return isConnected && isOnline;
    };

    getNetworkStateMessage = () => {
        const {isConnected} = this.props;
        const {isOnline} = this.state;
        return `${
            isOnline && isConnected ? 'Update' : 'Error'
        }: ${
            isOnline ? 'Online.' : 'Offline'
        } ${
            isConnected ? 'Pastebin in sync.' : 'Pastebin not in sync.'}`;
    };

    onCopy = () => {
        this.setState({copied: true});
    };

    resetGridLayout = () => {
    };
    getCurrentGridLayout = () => {
    };

    setGridLayoutCallbacks = (resetGridLayout, getCurrentGridLayout) => {
        this.resetGridLayout = resetGridLayout;
        this.getCurrentGridLayout = getCurrentGridLayout;
    };

    currentLayout = () => {
        return this.getCurrentGridLayout();
    };

    resetLayoutClick = (layout) => {
        this.resetGridLayout(layout);
    };

    onHeight = () => {
        const {minPastebinHeight, theme} = this.props;
        const {isTopNavigationToggled} = this.state;

        const heightAdjust = getHeightAdjust(
            isTopNavigationToggled, theme.appUnits
        );

        const minHeight = isNaN(minPastebinHeight) ? 600 : minPastebinHeight;
        const newHeight = global.innerHeight - heightAdjust;

        return Math.max(minHeight, newHeight);
    };

    handleChangeIsOnline = isOnline => {
        if (this.state.isOnline !== isOnline) {
            this.setState({isOnline});
        }
    };

    switchMonacoTheme = () => {
        const {themes, switchMonacoTheme} = this.props;
        const {monacoTheme} = themes;

        return switchMonacoTheme?.(monacoTheme);
    };

    state = {
        isTopNavigationToggled: false,
        copied: false,
        pastebinId: null,
        shareUrl: null,
        shareAnchorEl: null,
        showNetworkState: false,
        isOnline: true,
        isConnected: false,
        isChatToggled: false,
        chatTitle: 'Chat',
        isUserAction: false,
    };

    stateSetters = {
        onCopy: this.onCopy,
        handleShareMenu: this.handleShareMenu,
        handleShareClose: this.handleShareClose,
        shareClick: this.shareClick,
        shareClipboardClick: this.shareClipboardClick,
        logoClick: this.logoClick,
        changeShowNetworkState: this.changeShowNetworkState,
        isNetworkOk: this.isNetworkOk,
        getNetworkStateMessage: this.getNetworkStateMessage,
        chatClick: this.chatClick,
        resetLayoutClick: this.resetLayoutClick,
    };

    render() {
        const {
            props,
            state,
            stateSetters,
            pastebinRef,
            gridRef,
            currentLayout,
            resetLayoutClick,
            logoClick,
            chatClick,
            isNetworkOk,
            onHeight,
            setGridLayoutCallbacks,
        } = this;

        const {
            classes, themes,
            url, pastebinId, shareUrl, isConnected, loadChat,
            dependencies,
        } = props;

        const {
            isTopNavigationToggled, isChatToggled,
            chatTitle, isUserAction,
        } = state;

        const {
            themeType, switchTheme, muiTheme
        } = themes;

        const forwardedState = {
            ...state,
            ...stateSetters,
            pastebinId,
            url,
            shareUrl,
            isConnected,
            themeType,
            switchTheme,
        };

        return (
            <ThemeContext.Provider
                value={themes}
            >
                <SnackbarProvider
                    maxSnack={2}
                    preventDuplicate
                >
                    <NotificationCenter {...forwardedState}/>
                    <div
                        className={classes.root}
                        ref={pastebinRef}
                    >
                        <Pastebin
                            gridRef={gridRef}
                            muiTheme={muiTheme}
                            disableGridAutomaticEditorLayout={true}
                            isTopNavigationToggled={
                                isTopNavigationToggled
                            }
                            themeType={themeType}
                            // editorIds={editorIds}
                            setGridLayoutCallbacks={
                                setGridLayoutCallbacks
                            }
                            measureBeforeMount
                            onHeight={onHeight}
                            TopNavigationBarProps={forwardedState}
                            persistablePath={"configuration"}
                            dependencies={dependencies}
                        />
                        <LazyChat
                            isTopNavigationToggled={isTopNavigationToggled}
                            logoClick={logoClick}
                            isChatToggled={isChatToggled}
                            chatClick={chatClick}
                            chatTitle={chatTitle}
                            isNetworkOk={isNetworkOk}
                            currentLayout={currentLayout}
                            resetLayoutClick={resetLayoutClick}
                            themeType={themeType}
                            switchTheme={switchTheme}
                            dragConstraintsRef={gridRef}
                            isUserAction={isUserAction}
                            loadChat={loadChat}
                        />

                    </div>
                </SnackbarProvider>
            </ThemeContext.Provider>
        );
    }

    componentDidMount() {
        this.online$ = online$();
        this.online$subscriber = this.online$.subscribe(
            this.handleChangeIsOnline
        );

        this.switchMonacoTheme();
    }

    componentDidUpdate(prevProps) {
        const {themes} = this.props;
        const {monacoTheme} = themes;

        if (monacoTheme !== prevProps.themes.monacoTheme) {
            this.switchMonacoTheme();
        }
    }

    componentWillUnmount() {
        this.online$subscriber.unsubscribe();
        this.online$.pipe(takeUntil(end$()));
    }
}

Index.propTypes = {
    url: PropTypes.string.isRequired,
    classes: PropTypes.object.isRequired,
    mediaQuery: PropTypes.string,
    switchMonacoTheme: PropTypes.func,
    themes: PropTypes.object.isRequired,
};

const enhance =
    compose(
        withMediaQuery,
        withThemes,
        withStyles(styles, {withTheme: true}),
        connect(mapStateToProps, mapDispatchToProps)
    );
export default enhance(Index);
