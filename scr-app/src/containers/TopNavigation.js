// import NavigationBar from './components/navigationBar';
import TopNavigationBar from '../components/TopNavigationBar';
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {online$} from '../utils/scrUtils';
import NotificationCenter from "./NotificationCenter";
import {withStyles} from "material-ui";

const styles=theme => ({
  margin: {
    margin: theme.spacing.unit * 2,
  },
  padding: {
    padding: `0 ${theme.spacing.unit * 2}px`,
  },
  root: {
    marginTop: 0,
    width: '100%',
  }
});

class TopNavigation extends Component {
  storeUnsubscribe=null;
  
  logoClick=() => {
    window.open('https://seecode.run/', '_blank');
  };
  
  editHistoryClick=() => {
    this.setState((prevState) => ({
        isEditHistoryToggled: !prevState.isEditHistoryToggled
      })
    );
  };
  
  changeShowNetworkState=showNetworkState => {
    this.setState({
      showNetworkState: showNetworkState
    });
  };
  
  shareClick=() => {
    this.setState((prevState) => ({
      isShareToggled: !prevState.isShareToggled
      })
    );
  };
  
  chatClick=() => {
    this.setState((prevState) => ({
      isChatToggled: !prevState.isChatToggled
      })
    );
  };
  
  helpClick=() => {
    window.open('https://github.com/tlatoza/SeeCodeRun/wiki/SeeCode.Run-Help!', '_blank');
  };
  
  contactUsClick=() => {
    window.open('mailto:contact@seecode.run', '_blank');
  };
  
  aboutClick=() => {
    window.open('https://github.com/tlatoza/SeeCodeRun/wiki/About-SeeCode.Run', '_blank');
  };
  
  state={
    showNetworkState: false,
    isOnline: true,
    isConnected: false,
    isEditHistoryToggled: false,
    isShareToggled: false,
    isChatToggled: false,
    logoClick: this.logoClick,
    editHistoryClick: this.editHistoryClick,
    changeShowNetworkState: this.changeShowNetworkState,
    shareClick: this.shareClick,
    chatClick: this.chatClick,
    helpClick: this.helpClick,
    contactUsClick: this.contactUsClick,
    aboutClick: this.aboutClick,
  };
  
  componentWillMount() {
    const {store}=this.context;
    this.storeUnsubscribe=store.subscribe(() => {
      const isConnected=store.getState().firecoReducer.isConnected;
      if (this.state.isConnected !== isConnected) {
        this.setState({isConnected: isConnected});
      }
    });
    
    this.online$=online$();
    this.online$.subscribe(isOnline => {
      if (this.state.isOnline !== isOnline) {
        this.setState({isOnline: isOnline});
      }
    });
  }
  
  render() {
    const {classes}=this.props;
    return (<div className={classes.root}>
      <TopNavigationBar {...this.state}/>
      <NotificationCenter {...this.state}/>
    </div>);
  }
  
  componentWillUnmount() {
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
    }
    this.online$.complete();
  }
  
}

TopNavigation.contextTypes={
  store: PropTypes.object.isRequired
};

export default withStyles(styles)(TopNavigation);
