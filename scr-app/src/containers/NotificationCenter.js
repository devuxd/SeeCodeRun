import React, {Component} from 'react';
import PropTypes from "prop-types";
import Snackbar from 'material-ui/Snackbar';
import Slide from 'material-ui/transitions/Slide';
import {withStyles} from "material-ui";
import _ from 'lodash';

const styles=() => ({
  snackbarContentNetWorkStatus: {
    // minWidth: 360,
    // width: 360,
  }
});

class NotificationCenter extends Component {
  state={
    defaultAutoHideDuration:4000,
    snackbarMessageId: 'notification-center',
    snackbarVertical: 'top',
    snackbarHorizontal: 'center',
    snackbarTransition: props => <Slide direction="down" {...props} />,
    snackbarAutoHideDuration: null,
    isSnackbarOpen: false,
    snackbarMessage: null,
    isSnackbarFirstOnlineConnected: true,
    isOnline: null,
    isConnected: null,
    notification:null,
  };
  disconnectedTimeout=null;
  
  handleClose=() => {
    this.setState({isSnackbarOpen: false});
  };
  
  makeSingleNotification=(message) => {
    const {snackbarMessageId}=this.state;
    return (<span id={snackbarMessageId}>
      {message}
    </span>);
  };
  
  componentWillReceiveProps(nextProps) {
    const {
      isOnline, isConnected,  changeShowNetworkState, getNetworkStateMessage,
      notification
    }=nextProps;
    
    const snackbarMessage=this.makeSingleNotification(getNetworkStateMessage());
    if (this.state.isConnected !== isConnected && this.state.isOnline !== isOnline) {
      if (this.state.isSnackbarFirstOnlineConnected) {
        if (isOnline && isConnected) {
          clearTimeout(this.disconnectedTimeout);
          this.setState({
            isSnackbarFirstOnlineConnected: false,
            isOnline: isOnline,
            isConnected: isConnected,
          });
          changeShowNetworkState(true);
        }
      } else {
        clearTimeout(this.disconnectedTimeout);
        this.setState({
          isSnackbarOpen: true,
          snackbarMessage: snackbarMessage,
          isOnline: isOnline,
          isConnected: isConnected,
          snackbarAutoHideDuration: isOnline && isConnected ?
            this.state.defaultAutoHideDuration : null,
        });
      }
      return;
    }
    
    if(notification && notification !== this.state.notification){
      this.setState({
        notification:notification,
        isSnackbarOpen: true,
        snackbarMessage: _.isString(notification.message)?
          this.makeSingleNotification(notification.message)
          :notification.message,
        snackbarAutoHideDuration: notification.autoHideDuration||
        this.state.defaultAutoHideDuration,
      });
    }
  }
  
  render() {
    const {classes}=this.props;
    const {snackbarAutoHideDuration, snackbarVertical, snackbarHorizontal,
      isSnackbarOpen, snackbarTransition, snackbarMessageId,
      snackbarMessage}=this.state;
    return (<Snackbar
      anchorOrigin={{
        vertical: snackbarVertical,
        horizontal: snackbarHorizontal
      }}
      open={isSnackbarOpen}
      autoHideDuration={snackbarAutoHideDuration}
      onClose={this.handleClose}
      transition={snackbarTransition}
      SnackbarContentProps={{
        'aria-describedby': snackbarMessageId,
        className: classes.snackbarContentNetWorkStatus,
      }}
      message={snackbarMessage}
    />);
  }
  
  componentDidMount() {
    const {changeShowNetworkState, getNetworkStateMessage}=this.props;
    this.disconnectedTimeout=setTimeout(() => {
      const snackbarMessage=this.makeSingleNotification(getNetworkStateMessage());
      this.setState({
        isSnackbarOpen: true,
        snackbarMessage: snackbarMessage,
        isSnackbarFirstOnlineConnected: false,
      });
      changeShowNetworkState(true);
    }, 5000);
  }
}

NotificationCenter.propTypes={
  getNetworkStateMessage: PropTypes.func.isRequired,
  changeShowNetworkState: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(NotificationCenter);
