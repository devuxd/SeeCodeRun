// @flow weak
import React, {Component} from 'react';
import PropTypes from "prop-types";
import {withStyles} from 'material-ui/styles';
import scrLogo from '../res/scrLogo.png';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import IconButton from 'material-ui/IconButton';
import Icon from 'material-ui/Icon';

const styles=() => ({
  flex: {
    flex: 1,
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
  }
});

class TopNavigationBar extends Component {
  
  getConnectionStateIcon=(isOnline, isConnected, className) => {
    return (
      <IconButton className={className} title={`${
        isOnline && isConnected ? 'Update' : 'Error'
        }: ${
        isOnline ? 'Online.' : 'Offline'
        }, ${
        isConnected ? 'Pastebin in sync.' : 'Pastebin not in sync.'}`
      } aria-label="Network"
                  color={isOnline && isConnected ? "default" : "secondary"}>{isOnline && isConnected ? null :
        <Icon>cloud_off</Icon>}
      </IconButton>
    );
  };
  
  render() {
    const {
      classes,
      isEditHistoryToggled, isShareToggled, isChatToggled,
      logoClick, editHistoryClick, shareClick, chatClick,
      helpClick, contactUsClick, aboutClick,
      isOnline, isConnected, showNetworkState
    }=this.props;
    return (
      <AppBar position="static" color="default">
        <Toolbar>
          <IconButton title={"Create a new seeCode.run playground"}
                      className={classes.menuButton} aria-label="Menu"
                      onClick={logoClick}>
            <img src={scrLogo} className="scr-logo" alt="SCR"/>
          </IconButton>
          
          <IconButton title={"Edit history"} onClick={editHistoryClick}
                      color={isEditHistoryToggled ? "secondary" : "default"}>
            <Icon>change_history</Icon>
          </IconButton>
          
          {showNetworkState ?
            this.getConnectionStateIcon(
              isOnline, isConnected, classes.menuButton
            )
            : null}
          
          <Typography variant="title" color="inherit"
                      className={classes.flex}>
          </Typography>
          <IconButton title={"Share playground"} onClick={shareClick}
                      color={isShareToggled ? "secondary" : "default"}>
            <Icon>share</Icon>
          </IconButton>
          <IconButton title={"Chat"} onClick={chatClick}
                      color={isChatToggled ? "secondary" : "default"}>
            <Icon>chat</Icon>
          </IconButton>
          <IconButton title={"Help"} onClick={helpClick}>
            <Icon>help</Icon>
          </IconButton>
          <IconButton title={"Contact us"} onClick={contactUsClick}>
            <Icon>contact_mail</Icon>
          </IconButton>
          <IconButton title={"About"} onClick={aboutClick}>
            <Icon>info</Icon>
          </IconButton>
        </Toolbar>
      </AppBar>
    );
  }
}

TopNavigationBar.propTypes={
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(TopNavigationBar);
