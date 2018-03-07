import React, {Component} from 'react';
import PropTypes from "prop-types";
import Snackbar from 'material-ui/Snackbar';
import Slide from 'material-ui/transitions/Slide';
import Tooltip from 'material-ui/Tooltip';
import CloudIcon from 'material-ui-icons/Cloud';
import CloudOffIcon from 'material-ui-icons/CloudOff';
import {withStyles} from "material-ui";

const styles=() => ({
  snackbarContentNetWorkStatus: {
    // minWidth: 360,
    width: 360,
  }
});

class NotificationCenter extends Component {
  state={
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
  };
  disconnectedTimeout=null;
  
  handleClose=() => {
    this.setState({isSnackbarOpen: false});
  };
  
  getConnectionStateMessage=(isOnline, isConnected) => {
    const {snackbarMessageId}=this.state;
    return (<span id={snackbarMessageId}>
      
      {
        isOnline && isConnected ? 'Update' : 'Error'
      }: {
      isOnline ? 'Online' : 'Offline'
    }, {
      isConnected ? 'Pastebin in sync.' : 'Pastebin not in sync.'}
    </span>);
  };
  
  getConnectionStateMessageIcon=(isOnline, isConnected) => {
    const {snackbarMessageId}=this.state;
    return (<span id={snackbarMessageId}>
         <Tooltip title={`${
           isOnline && isConnected ? 'Update' : 'Error'
           }: ${
           isOnline ? 'Online.' : 'Offline'
           } ${
           isConnected ? 'Pastebin in sync.' : 'Pastebin not in sync.'}`
         }>{isOnline && isConnected ? <CloudIcon/> :
           <CloudOffIcon color="error"/>}
         </Tooltip>
    </span>);
  };
  
  componentWillReceiveProps(nextProps) {
    const {isOnline, isConnected, changeShowNetworkState}=nextProps;
    const snackbarMessage=this.getConnectionStateMessage(isOnline, isConnected);
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
          snackbarAutoHideDuration: isOnline && isConnected ? 4000 : null
        });
      }
    }
  }
  
  render() {
    const {classes}=this.props;
    const {snackbarAutoHideDuration, snackbarVertical, snackbarHorizontal, isSnackbarOpen, snackbarTransition, snackbarMessageId, snackbarMessage}=this.state;
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
    const {changeShowNetworkState}=this.props;
    const {isOnline, isConnected}=this.state;
    this.disconnectedTimeout=setTimeout(() => {
      const snackbarMessage=this.getConnectionStateMessage(isOnline, isConnected);
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
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(NotificationCenter);
