import React, {Component, createContext, /*, StrictMode*/} from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import {chromeDark, chromeLight} from "react-inspector";
import withRoot, {themeTypes} from '../components/withRoot';
import NotificationCenter from '../containers/NotificationCenter';
import TopNavigationBar, {APP_BAR_HEIGHT} from '../components/TopNavigationBar';
import Pastebin from '../containers/Pastebin';

import {getEditorIds} from '../seecoderun/AppManager';
import {getShareUrl} from '../redux/modules/pastebin';
import {online$, end$} from '../utils/scrUtils';
import {takeUntil} from 'rxjs/operators';
import Chat from '../containers/Chat';
import {switchMonacoTheme} from '../redux/modules/monaco';

const muiChromeLight = {...chromeLight, ...({BASE_BACKGROUND_COLOR: 'transparent'})};
const muiChromeDark = {...chromeDark, ...({BASE_BACKGROUND_COLOR: 'transparent'})};

export const ThemeContext = createContext({});

let appStyle = {margin: 0};
const styles = theme => {
    appStyle = {
        margin: theme.spacing.unit,
        rowHeightSmall: APP_BAR_HEIGHT,
        rowHeight: APP_BAR_HEIGHT,
        // rowHeightSmall: theme
        //     .mixins.toolbar['@media (min-width:0px) and (orientation: landscape)']
        //     .minHeight,
        // rowHeight: theme.mixins.toolbar['@media (min-width:600px)'].minHeight
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
            paddingBottom: appStyle.rowHeight
        },
        rootContainerSmall: {
            overflow: 'auto',
            height: '100%',
            width: '100%',
            paddingBottom: appStyle.rowHeightSmall
        },
        rootContainerNavigationToggled: {
            overflow: 'auto',
            height: '100%',
            width: '100%',
            bottom: 0,
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

class Index extends Component {
    prevThemeType = 'lightTheme';
    editorIds = getEditorIds();
    storeUnsubscribe = null;

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
        const {shareUrl} = this.state;
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
        const {isConnected, isOnline} = this.state;
        return isConnected && isOnline;
    };

    getNetworkStateMessage = () => {
        const {isConnected, isOnline} = this.state;
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
        authUser: null,
        isChatToggled: false,
        chatTitle: 'Chat',
        chatClick: this.chatClick,
        resetLayoutClick: this.resetLayoutClick,
    };

    render() {
        const {store} = this.context;
        const {
            classes,
            url, themeType, switchTheme, minPastebinHeight
        } = this.props;
        const {
            isTopNavigationToggled,
            authUser, isChatToggled, chatClick, chatTitle, isNetworkOk
        } = this.state;
        const activateChat = !!authUser;

        const rootContainerClassName = isTopNavigationToggled ?
            classes.rootContainerNavigationToggled :
            window.innerWidth > 600 ? classes.rootContainer
                : classes.rootContainerSmall;

        const rootContainerBottomMargin = isTopNavigationToggled ? 0 :
            window.innerWidth > 600 ? appStyle.rowHeight
                : appStyle.rowHeightSmall;

        const heightAdjust = isTopNavigationToggled ? appStyle.margin : rootContainerBottomMargin + appStyle.margin;
        const onHeight = (node, heightAdjust) => {
            const minHeight = minPastebinHeight || 600;
            const newHeight = window.innerHeight - heightAdjust;
            return Math.max(minHeight, newHeight);
        };
        return (
            //<StrictMode>
            <ThemeContext.Provider value={{
                themeType: themeType,
                inspectorTheme: themeType === themeTypes.darkTheme ? muiChromeDark : muiChromeLight,
            }}
            >
                <div className={classes.root}>
                    <NotificationCenter {...this.state}/>
                    <TopNavigationBar {...this.state}
                                      url={url}
                                      themeType={themeType}
                                      switchTheme={switchTheme}

                    />
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
                            />
                        </div>
                    </div>
                    {
                        activateChat &&
                        <Chat dispatch={store.dispatch}
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
            </ThemeContext.Provider>
            // </StrictMode>
        );
    }

    componentDidMount() {
        const {store} = this.context;
        this.storeUnsubscribe = store.subscribe(() => {
            const isConnected = store.getState().firecoReducer.isConnected;
            if (this.state.isConnected !== isConnected) {
                this.setState({isConnected: isConnected});
            }

            const pastebinId = store.getState().pastebinReducer.pastebinId;
            if (this.state.pastebinId !== pastebinId) {
                const {url} = this.props;
                this.setState({
                    pastebinId: pastebinId,
                    shareUrl: getShareUrl(url, pastebinId)
                });
            }

            const authUser = store.getState().firecoReducer.authUser;
            if (this.state.authUser !== authUser) {
                this.setState({
                    authUser: authUser,
                });
            }
        });

        this.online$ = online$();
        this.online$.subscribe(isOnline => {
            if (this.state.isOnline !== isOnline) {
                this.setState({isOnline: isOnline});
            }
        });
    }

    componentDidUpdate() {
        const {themeType} = this.props;
        if (this.prevThemeType !== themeType) {
            this.prevThemeType = themeType;
            const {store} = this.context;
            store.dispatch(switchMonacoTheme(themeType));
        }
    }

    componentWillUnmount() {
        if (this.storeUnsubscribe) {
            this.storeUnsubscribe();
        }
        this.online$ && this.online$.pipe(takeUntil(end$()));
    }
}

Index.propTypes = {
    url: PropTypes.string.isRequired,
    classes: PropTypes.object.isRequired,
    switchTheme: PropTypes.func.isRequired,
    themeType: PropTypes.string.isRequired,
};
Index.contextTypes = {
    store: PropTypes.object.isRequired
};

export default withRoot(withStyles(styles)(Index));
