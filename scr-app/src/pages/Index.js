import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {withStyles} from 'material-ui/styles';
import withRoot from '../components/withRoot';
import NotificationCenter from '../containers/NotificationCenter';
import TopNavigationBar from '../components/TopNavigationBar';
import Pastebin from '../containers/Pastebin';
import Playground from '../containers/Playground';

import {getEditorIds} from "../seecoderun/AppManager";
import {getShareUrl} from "../redux/modules/pastebin";
import {online$, end$} from '../utils/scrUtils';
import Chat from "../containers/Chat";
import {switchMonacoTheme} from "../redux/modules/monaco";

let appStyle={margin: 0};
const styles=theme => {
  appStyle={margin: theme.spacing.unit * 1.25};
  return {
    appMargin: {
      margin: appStyle.margin,
    },
    playgroundPaper: {
      margin: appStyle.margin,
      marginTop:0,
      marginBottom: appStyle.margin*10,
    },
    // padding: {
    //   padding: `0 ${theme.spacing.unit * 2}px`,
    // },
  }
};

class Index extends Component {
  editorIds=getEditorIds();
  storeUnsubscribe=null;
  
  sendNotification=(message, autoHideDuration) => {
    this.setState({
      notification: {
        message: message,
        autoHideDuration: autoHideDuration
      }
    });
  };
  logoClick=() => {
    this.setState({
      isTopNavigationToggled: !this.state.isTopNavigationToggled,
    });
  };
  
  changeShowNetworkState=showNetworkState => {
    this.setState({
      showNetworkState: showNetworkState
    });
  };
  
  handleShareMenu=event => {
    this.setState({
      shareAnchorEl: event.currentTarget,
    });
  };
  
  handleShareClose=() => {
    this.setState({shareAnchorEl: null});
  };
  
  shareClick=e => {
    e.preventDefault();
    //todo log in firebase
    const {shareUrl}=this.state;
    shareUrl && window.open(shareUrl, '_blank');
    this.handleShareClose();
  };
  
  shareClipboardClick=(/*link*/) => {
    this.sendNotification('Pastebin URL for sharing has been copied' +
      ' to your clipboard.');
    this.handleShareClose();
  };
  
  chatClick=() => {
    this.setState((prevState) => ({
        isChatToggled: !prevState.isChatToggled,
        chatTitle: prevState.isChatToggled ? 'Open Chat' : 'Close Chat',
      })
    );
  };
  
  isNetworkOk=() => {
    const {isConnected, isOnline}=this.state;
    return isConnected && isOnline;
  };
  
  getNetworkStateMessage=() => {
    const {isConnected, isOnline}=this.state;
    return `${
      isOnline && isConnected ? 'Update' : 'Error'
      }: ${
      isOnline ? 'Online.' : 'Offline'
      } ${
      isConnected ? 'Pastebin in sync.' : 'Pastebin not in sync.'}`;
  };
  
  onCopy=() => {
    this.setState({copied: true});
  };
  
  switchThemeDispatch=(store, themeType, switchTheme) => {
    return () => {
      switchTheme();
      store.dispatch(switchMonacoTheme(themeType))
    };
  };
  
  resetGridLayout=() => {
  };
  setResetGridLayout=resetGridLayout => {
    this.resetGridLayout=resetGridLayout;
  };
  resetLayoutClick=() => {
    this.resetGridLayout();
  };
  
  state={
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
    chatTitle: 'Close Chat',
    chatClick: this.chatClick,
    resetLayoutClick: this.resetLayoutClick,
  };
  
  resize=() => {
  };
  
  resizePlayground=() => {
    this.resize();
  };
  
  getResizePlayground=() => {
    return this.resizePlayground;
  };
  setResizePlayground=resize => {
    this.resize=resize || this.resize;
  };
  
  render() {
    const {store}=this.context;
    const {
      classes,
      url, isSwitchThemeToggled, themeType, switchTheme
    }=this.props;
    const {
      authUser, isChatToggled, chatClick, chatTitle, isNetworkOk
    }=this.state;
    const activateChat=!!authUser;
    const switchThemeDispatcher=
      this.switchThemeDispatch(store, themeType, switchTheme);
    return (
      <div style={{heigth:'100%', overflow: 'hidden'}}>
        <NotificationCenter {...this.state}/>
        <TopNavigationBar url={url} {...this.state}
                          switchTheme={switchThemeDispatcher}
                          isSwitchThemeToggled={isSwitchThemeToggled}
                          getResizePlayground={this.getResizePlayground}
        />
        <Pastebin editorIds={this.editorIds}
                  setResetGridLayout={this.setResetGridLayout}
                  getResizePlayground={this.getResizePlayground}
                  appClasses={classes}
                  appStyle={{...appStyle}}
        />
        <Playground editorIds={this.editorIds}
                    getResize={this.setResizePlayground}
                    appClasses={classes}
                    appStyle={{...appStyle}}
        />
        {
          activateChat &&
          <Chat dispatch={store.dispatch} isChatToggled={isChatToggled}
                chatClick={chatClick} chatTitle={chatTitle}
                isNetworkOk={isNetworkOk}
          />
        }
      </div>
    );
  }
  
  componentDidMount() {
    const {store}=this.context;
    this.storeUnsubscribe=store.subscribe(() => {
      const isConnected=store.getState().firecoReducer.isConnected;
      if (this.state.isConnected !== isConnected) {
        this.setState({isConnected: isConnected});
      }
      
      const pastebinId=store.getState().pastebinReducer.pastebinId;
      if (this.state.pastebinId !== pastebinId) {
        const {url}=this.props;
        this.setState({
          pastebinId: pastebinId,
          shareUrl: getShareUrl(url, pastebinId)
        });
      }
      
      const authUser=store.getState().firecoReducer.authUser;
      if (this.state.authUser !== authUser) {
        this.setState({
          authUser: authUser,
        });
      }
    });
    
    this.online$=online$();
    this.online$.subscribe(isOnline => {
      if (this.state.isOnline !== isOnline) {
        this.setState({isOnline: isOnline});
      }
    });
  }
  
  componentWillUnmount() {
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
    }
    this.online$ && this.online$.takeUntil(end$());
  }
}

Index.propTypes={
  url: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  switchTheme: PropTypes.func.isRequired,
  themeType: PropTypes.string.isRequired,
};
Index.contextTypes={
  store: PropTypes.object.isRequired
};

export default withRoot(withStyles(styles)(Index));
