import React from 'react';
import {compose} from 'redux';
import {connect} from 'react-redux'
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import {SnackbarProvider} from 'notistack';
import {takeUntil} from 'rxjs/operators';

import withThemes, {ThemeContext} from '../themes';
import NotificationCenter from '../containers/NotificationCenter';
import TopNavigationBar, {APP_BAR_HEIGHT} from '../components/TopNavigationBar';
import Pastebin from '../containers/Pastebin';

import {getEditorIds} from '../seecoderun/AppManager';
import {online$, end$} from '../utils/scrUtils';

import Chat from '../containers/Chat';
import {switchMonacoTheme} from '../redux/modules/monaco';
import withMediaQuery from "../utils/withMediaQuery";

const mapStateToProps = ({firecoReducer, pastebinReducer, updateBundleReducer}, {url}) => {
    const {isConnected, authUser, isFirecoEditorsReady} = firecoReducer;
    const {pastebinId} = pastebinReducer;
    return {
        pastebinId,
        shareUrl: pastebinId ? `${url}/#:${pastebinId}` : null,
        authUser,
        isConnected,
        activateChat: !!authUser && isFirecoEditorsReady,
    }
};

const mapDispatchToProps = {switchMonacoTheme};

let appStyle = {margin: 0};
const styles = theme => {
    appStyle = {
        margin: theme.spacing(1),
        rowHeightSmall: APP_BAR_HEIGHT,
        rowHeight: APP_BAR_HEIGHT,
    };
    return {
        root: {
            display: 'block',
            position: 'fixed',
            height: '100%',
            width: '100%',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            overflow: 'hidden',
        },
        rootContainer: {
            overflow: 'auto',
            height: '100%',
            width: '100%',
        },
        rootContainerSmall: {
            overflow: 'auto',
            height: '100%',
            width: '100%',
        },
        rootContainerNavigationToggled: {
            overflow: 'auto',
            height: '100%',
            width: '100%',
            bottom: 0,
            paddingBottom: appStyle.margin
        },
        margin: {
            margin: appStyle.margin,
        },
        container: {
            overflow: 'hidden',
            height: '100%',
            width: '100%',
            margin: 0,
            padding: 0,
        },
        scroller: {
            overflow: 'auto',
            height: '100%',
            width: '100%',
            margin: 0,
            padding: 0,
        },
        content: {
            overflow: 'visible',
            height: '100%',
            width: '100%',
            margin: 0,
            padding: 0,
        }
    }
};

class Index extends React.Component {
    editorIds = getEditorIds();

    sendNotification = (message, autoHideDuration) => {
        this.setState({
            notification: {
                message: message,
                autoHideDuration: autoHideDuration
            }
        });
    };
    logoClick = (event, isTopNavigationToggled) => {
        this.setState({
            isTopNavigationToggled: event ? !this.state.isTopNavigationToggled : isTopNavigationToggled,
        });
    };

    changeShowNetworkState = showNetworkState => {
        this.setState({
            showNetworkState: showNetworkState
        });
    };

    handleShareMenu = event => {
        this.setState({
            shareAnchorEl: event.currentTarget,
        });
    };

    handleShareClose = () => {
        this.setState({shareAnchorEl: null});
    };

    shareClick = e => {
        e.preventDefault();
        const {shareUrl} = this.props;
        shareUrl && window.open(shareUrl, '_blank');
        this.handleShareClose();
    };

    shareClipboardClick = (/*link*/) => {
        this.sendNotification('Pastebin URL for sharing has been copied' +
            ' to your clipboard.');
        this.handleShareClose();
    };

    chatClick = (event, isChatToggled) => {
        this.setState((prevState) => ({
                isChatToggled: event ? !prevState.isChatToggled : isChatToggled,
                // chatTitle: prevState.isChatToggled ? 'Open Chat' : 'Close Chat',
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

    state = {
        isTopNavigationToggled: false,
        copied: false,
        onCopy: this.onCopy,
        pastebinId: null,
        shareUrl: null,
        shareAnchorEl: null,
        handleShareMenu: this.handleShareMenu,
        handleShareClose: this.handleShareClose,
        shareClick: this.shareClick,
        shareClipboardClick: this.shareClipboardClick,
        logoClick: this.logoClick,
        showNetworkState: false,
        isOnline: true,
        isConnected: false,
        changeShowNetworkState: this.changeShowNetworkState,
        isNetworkOk: this.isNetworkOk,
        getNetworkStateMessage: this.getNetworkStateMessage,
        isChatToggled: false,
        chatTitle: 'Chat',
        chatClick: this.chatClick,
        resetLayoutClick: this.resetLayoutClick,
    };

    render() {
        const {
            classes,
            url, minPastebinHeight,
            pastebinId, shareUrl, authUser, isConnected, activateChat,
            themeType, muiTheme, inspectorTheme, monacoTheme, switchTheme,
        } = this.props;
        const {
            isTopNavigationToggled,
            isChatToggled, chatClick, chatTitle, isNetworkOk,
        } = this.state;

        const rootContainerClassName = isTopNavigationToggled ?
            classes.rootContainerNavigationToggled :
            window.innerWidth > 600 ? classes.rootContainer
                : classes.rootContainerSmall;

        const rootContainerBottomMargin = isTopNavigationToggled ? 0 :
            window.innerWidth > 600 ? appStyle.rowHeight
                : appStyle.rowHeightSmall;

        const heightAdjust = isTopNavigationToggled ? appStyle.margin : rootContainerBottomMargin + appStyle.margin*2;
        const onHeight = (node, heightAdjust) => {
            const minHeight = minPastebinHeight || 600;
            const newHeight = window.innerHeight - heightAdjust;
            return Math.max(minHeight, newHeight);
        };

        const forwardedState = {...this.state, pastebinId, shareUrl, authUser, isConnected};

        return (
            <ThemeContext.Provider value={{
                switchTheme,
                themeType,
                muiTheme,
                inspectorTheme,
                monacoTheme,
            }}
            >
                <SnackbarProvider maxSnack={3}>
                    <div className={classes.root}>
                        <NotificationCenter {...forwardedState}/>
                        <div className={rootContainerClassName}>
                            <div className={classes.scroller}>
                                <Pastebin
                                    themeType={themeType}
                                    editorIds={this.editorIds}
                                    setGridLayoutCallbacks={this.setGridLayoutCallbacks}
                                    appClasses={classes}
                                    appStyle={{...appStyle}}
                                    measureBeforeMount={true}
                                    onHeight={onHeight}
                                    heightAdjust={heightAdjust}
                                    TopNavigationBarComponent={<TopNavigationBar {...forwardedState}
                                                                                 url={url}
                                                                                 switchTheme={switchTheme}
                                                                                 themeType={themeType}
                                    />}
                                />
                            </div>
                        </div>
                        {
                            activateChat &&
                            <Chat
                                isTopNavigationToggled={isTopNavigationToggled}
                                logoClick={this.logoClick}
                                isChatToggled={isChatToggled}
                                chatClick={chatClick}
                                chatTitle={chatTitle}
                                isNetworkOk={isNetworkOk}
                                currentLayout={this.currentLayout}
                                resetLayoutClick={this.resetLayoutClick}
                                themeType={themeType}
                                switchTheme={switchTheme}
                            />
                        }
                    </div>
                </SnackbarProvider>
            </ThemeContext.Provider>
        );
    }

    componentDidMount() {
        this.online$ = online$();
        this.online$.subscribe(isOnline => {
            if (this.state.isOnline !== isOnline) {
                this.setState({isOnline});
            }
        });
        this.switchMonacoTheme();
    }

    componentDidUpdate(prevProps) {
        const {monacoTheme} = this.props;
        if (monacoTheme !== prevProps.monacoTheme) {
            this.switchMonacoTheme();
        }
    }

    componentWillUnmount() {
        this.online$ && this.online$.pipe(takeUntil(end$()));
    }

    switchMonacoTheme = () => {
        const {switchMonacoTheme, monacoTheme} = this.props;
        switchMonacoTheme && switchMonacoTheme(monacoTheme);
    }
}

Index.propTypes = {
    url: PropTypes.string.isRequired,
    classes: PropTypes.object.isRequired,
    mediaQuery: PropTypes.string,
    switchMonacoTheme: PropTypes.func,
};

const enhance = compose(withMediaQuery, withThemes, withStyles(styles), connect(mapStateToProps, mapDispatchToProps));
export default enhance(Index);