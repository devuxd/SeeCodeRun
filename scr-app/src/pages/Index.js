import React, {createRef, PureComponent} from 'react';
import {compose} from 'redux';
import {connect} from 'react-redux'
import PropTypes from 'prop-types';
import {withStyles} from '@mui/styles';
import {SnackbarProvider} from 'notistack';
import {takeUntil} from 'rxjs/operators';

import withThemes, {ThemeContext} from '../themes';
import NotificationCenter from '../containers/NotificationCenter';
import TopNavigationBar, {APP_BAR_HEIGHT} from '../components/TopNavigationBar';
import Pastebin from '../containers/Pastebin';

import {getEditorIds} from '../core/AppManager';
import {end$, online$} from '../utils/scrUtils';

import Chat from '../containers/Chat';
import {switchMonacoTheme} from '../redux/modules/monaco';
import withMediaQuery from '../utils/withMediaQuery';

const mapStateToProps = ({
                            firecoReducer,
                            pastebinReducer,
                         }, {url}) => {
   const {isConnected, authUser, isFirecoEditorsReady} = firecoReducer;
   const {pastebinId} = pastebinReducer;
   return {
      pastebinId,
      shareUrl: pastebinId ? `${url}/#:${pastebinId}` : null,
      authUser,
      isConnected,
      loadChat: !!authUser && isFirecoEditorsReady,
   }
};

const mapDispatchToProps = {switchMonacoTheme};

let appStyle = {margin: 0};
const styles = theme => {
   appStyle = {
      margin: theme.spacingUnit(1),
      rowHeightSmall: APP_BAR_HEIGHT,
      rowHeight: APP_BAR_HEIGHT,
   };
   appStyle.marginArray = [appStyle.margin, appStyle.margin];
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
         // height: '100%', // fixes unwanted scrollbars after RGL update
         // width: '100%',
         // overflow: 'auto',
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
         // overflow: 'visible',
         // height: '100%',
         // width: '100%',
         // margin: 0,
         // padding: 0,
      }
   }
};

class Index extends PureComponent {
   
   constructor(props) {
      super(props);
      this.pastebinRef = createRef();
      this.editorIds = getEditorIds();
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
            activateChatReason: event ? 'user' : 'system',
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
   
   onHeight = (node, heightAdjust) => {
      const {minPastebinHeight} = this.props;
      const minHeight = minPastebinHeight || 600;
      const newHeight = global.innerHeight - heightAdjust;
      return Math.max(minHeight, newHeight);
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
      activateChatReason: null,
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
         props, state, stateSetters,
         pastebinRef, editorIds,
         currentLayout, resetLayoutClick,
         logoClick, chatClick, isNetworkOk, onHeight, setGridLayoutCallbacks,
      } = this;
      
      const {
         classes, themes,
         url, pastebinId, shareUrl, authUser, isConnected, loadChat,
      } = props;
      
      const {
         themeType, switchTheme, muiTheme
      } = themes;
      
      const {
         isTopNavigationToggled, isChatToggled,
         chatTitle, activateChatReason,
      } = state;
      
      const rootContainerBottomMargin = isTopNavigationToggled ? 0 :
         global.innerWidth > 600 ? appStyle.rowHeight
            : appStyle.rowHeightSmall;
      
      const heightAdjust = isTopNavigationToggled ?
         appStyle.margin : rootContainerBottomMargin + appStyle.margin * 2;
      
      const forwardedState = {
         ...state,
         ...stateSetters,
         pastebinId,
         url,
         shareUrl,
         authUser,
         isConnected,
         themeType,
         switchTheme,
      };
      
      return (
         <ThemeContext.Provider
            value={themes}
         >
            <SnackbarProvider
               maxSnack={3}
               preventDuplicate
            >
               <NotificationCenter {...forwardedState}/>
               <div
                  className={classes.root}
                  ref={pastebinRef}
               >
                  <Pastebin
                     muiTheme={muiTheme}
                     disableGridAutomaticEditorLayout={true}
                     isTopNavigationToggled={
                        isTopNavigationToggled
                     }
                     themeType={themeType}
                     editorIds={editorIds}
                     setGridLayoutCallbacks={
                        setGridLayoutCallbacks
                     }
                     appClasses={classes}
                     appStyle={appStyle}
                     measureBeforeMount={true}
                     onHeight={onHeight}
                     heightAdjust={heightAdjust}
                     TopNavigationBarComponent={
                        <TopNavigationBar
                           {...forwardedState}
                        />
                     }
                  />
                  <Chat
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
                     dragConstraintsRef={pastebinRef}
                     activateChatReason={activateChatReason}
                     loadChat={loadChat}
                  />
               
               </div>
            </SnackbarProvider>
         </ThemeContext.Provider>
      );
   }
   
   handleChangeIsOnline = isOnline => {
      if (this.state.isOnline !== isOnline) {
         this.setState({isOnline});
      }
   };
   
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
   
   switchMonacoTheme = () => {
      const {themes, switchMonacoTheme} = this.props;
      const {monacoTheme} = themes;
      switchMonacoTheme && switchMonacoTheme(monacoTheme);
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
      withStyles(styles),
      connect(mapStateToProps, mapDispatchToProps)
   );
export default enhance(Index);
