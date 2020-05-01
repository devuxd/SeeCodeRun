import React, {Component, createContext, /*, StrictMode*/} from 'react';
import {compose} from 'redux';
import {connect} from 'react-redux'
import PropTypes from 'prop-types';

import {ThemeProvider} from '@material-ui/styles';
import {withStyles} from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';


import {getThemes, themeTypes} from '../themes';
import NotificationCenter from '../containers/NotificationCenter';
import TopNavigationBar, {APP_BAR_HEIGHT} from '../components/TopNavigationBar';
import Pastebin from '../containers/Pastebin';

import {getEditorIds} from '../seecoderun/AppManager';
import {online$, end$} from '../utils/scrUtils';
import {takeUntil} from 'rxjs/operators';
import Chat from '../containers/Chat';
import {switchMonacoTheme} from '../redux/modules/monaco';
import withMediaQuery from '../utils/withMediaQuery';

export const ThemeContext = createContext({});

const mapStateToProps = ({firecoReducer, pastebinReducer}, {url}) => {
    const {isConnected, authUser, areFirecoEditorsConfigured} = firecoReducer;
    const {pastebinId} = pastebinReducer;
    return {
        pastebinId,
        shareUrl: pastebinId ? `${url}/#:${pastebinId}` : null,
        authUser,
        isConnected,
        activateChat: (!!authUser) && areFirecoEditorsConfigured,
    }
};

const mapDispatchToProps = {switchMonacoTheme};

let appStyle = {margin: 0};
const styles = theme => {
    appStyle = {
        margin: theme.spacing(1),
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
        themeType: null,
        theme: null,
        inspectorTheme: null,
        monacoTheme: null,
        themeUserOverrides: false,
    };

    switchTheme = (aThemeType) => {

        this.setState((prevState) => {
            const themeType =
                aThemeType && themeTypes[aThemeType] ||
                prevState.themeType === themeTypes.lightTheme ? themeTypes.darkTheme : themeTypes.lightTheme;
            const {theme, inspectorTheme, monacoTheme} = getThemes(themeType);
            return {
                themeType,
                theme,
                inspectorTheme,
                monacoTheme,
                themeUserOverrides: true,
            }
        });
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const {mediaQueryResult: prefersLightMode} = nextProps;
        const themeType = prefersLightMode ? themeTypes.lightTheme : themeTypes.darkTheme;
        if (prevState.themeUserOverrides) {
            return null;
        } else {
            const {theme, inspectorTheme, monacoTheme} = getThemes(themeType);
            return {
                themeType,
                theme,
                inspectorTheme,
                monacoTheme,
            };
        }

    }

    render() {
        const {
            classes,
            url, minPastebinHeight,
            pastebinId, shareUrl, authUser, isConnected, activateChat,
        } = this.props;
        const {
            isTopNavigationToggled,
            isChatToggled, chatClick, chatTitle, isNetworkOk,
            themeType, theme, inspectorTheme, monacoTheme,
        } = this.state;

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

        const forwardedState = {...this.state, pastebinId, shareUrl, authUser, isConnected};
        return (
            <ThemeContext.Provider value={{
                switchTheme: this.switchTheme,
                themeType,
                theme,
                inspectorTheme,
                monacoTheme,
            }}
            >
                <ThemeProvider theme={theme}>
                    <CssBaseline/>
                    <div className={classes.root}>
                        <NotificationCenter {...forwardedState}/>
                        <TopNavigationBar {...forwardedState}
                                          url={url}
                                          switchTheme={this.switchTheme}

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
                                switchTheme={this.switchTheme}
                            />
                        }
                    </div>
                </ThemeProvider>
            </ThemeContext.Provider>
        );
    }

    componentDidMount() {
        const {switchMonacoTheme} = this.props;
        const {monacoTheme} = this.state;
        this.online$ = online$();
        this.online$.subscribe(isOnline => {
            if (this.state.isOnline !== isOnline) {
                this.setState({isOnline: isOnline});
            }
        });
        switchMonacoTheme && switchMonacoTheme(monacoTheme);
    }

    componentDidUpdate(prevProps, prevState) {
        const {switchMonacoTheme} = this.props;
        const {monacoTheme} = this.state;
        if (monacoTheme !== prevState.monacoTheme) {
            switchMonacoTheme(monacoTheme);
        }
    }

    componentWillUnmount() {
        this.online$ && this.online$.pipe(takeUntil(end$()));
    }
}

Index.propTypes = {
    url: PropTypes.string.isRequired,
    classes: PropTypes.object.isRequired,
    mediaQuery: PropTypes.string,
    switchMonacoTheme: PropTypes.func,
};

const enhance = compose(withStyles(styles), withMediaQuery, connect(mapStateToProps, mapDispatchToProps));
export default enhance(Index);