import React, {Component} from 'react';
import PropTypes from "prop-types";
import {withStyles} from 'material-ui/styles';
import ScrIcon from './icons/SCR';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import IconButton from 'material-ui/IconButton';
import ChatIcon from 'material-ui-icons/Chat';
import ShareIcon from 'material-ui-icons/Share';
import CloudOffIcon from 'material-ui-icons/CloudOff';
import LightbulbOutlineIcon from 'material-ui-icons/LightbulbOutline';
import LightbulbIcon from './icons/Lightbulb';
import MoreVertIcon from 'material-ui-icons/MoreVert';
import Menu, {MenuItem} from 'material-ui/Menu';
import {CopyToClipboard} from "react-copy-to-clipboard";

let iconStyle = {};
const lightBulbIconStyle = {};
const scrSvg = {};

const styles = (theme) => {
    iconStyle = {
      fontSize: Math.floor(theme.typography.fontSize * 1.75)
    };

    lightBulbIconStyle.light = {
      color: theme.palette.action.active,
      fontSize: iconStyle.fontSize,
    };
    lightBulbIconStyle.dark = {
      color: theme.palette.secondary.main,
      fontSize: iconStyle.fontSize,
    };

    scrSvg.sticky = {
      color: theme.palette.secondary.main,
      secondaryColor: theme.palette.background.paper,
      fontSize: theme.typography.fontSize * 2,
    };
    scrSvg.logo = {
      color: theme.palette.action.active,
      secondaryColor: theme.palette.background.default,
      fontSize: theme.typography.fontSize * 3,
    };

    return {
      scrIconSticky: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: theme.zIndex.snackbar,
      },
      scrIcon: {
        paddingRight: theme.spacing.unit * 2,
      },
      flex: {
        flex: 1,
      },
      centered: {
        justifyContent: 'center',
      },
    }
  }
;

class TopNavigationBar extends Component {
  state = {infoAnchorEl: null};

  handleInfoMenu = event => {
    this.setState({infoAnchorEl: event.currentTarget});
  };

  handleInfoClose = () => {
    this.setState({infoAnchorEl: null});
  };

  helpClick = () => {
    window.open('https://github.com/tlatoza/SeeCodeRun/wiki/SeeCode.Run-Help!', '_blank');
  };

  contactUsClick = () => {
    window.open('mailto:contact@seecode.run', '_blank');
  };

  aboutClick = () => {
    window.open('https://github.com/tlatoza/SeeCodeRun/wiki/About-SeeCode.Run', '_blank');
  };

  repoClick = () => {
    window.open('https://github.com/devuxd/SeeCodeRun', '_blank');
  };

  onClick = callback => {
    return () => {
      callback && callback();
      this.handleInfoClose();
    };
  };

  render() {
    const {
      classes, themeType, switchTheme,
      isChatToggled, isTopNavigationToggled,
      logoClick, chatClick, chatTitle,
      showNetworkState, isNetworkOk, getNetworkStateMessage,
      shareAnchorEl, handleShareMenu, handleShareClose,
      shareUrl, shareClick, shareClipboardClick,
      resetLayoutClick,
    } = this.props;
    const shareOpen = !!shareAnchorEl;
    const {infoAnchorEl} = this.state;
    const infoOpen = !!infoAnchorEl;

    let networkStateIcon = null;
    if (showNetworkState) {
      const networkOk = isNetworkOk();
      const networkMessage = getNetworkStateMessage();
      if (!networkOk) {
        networkStateIcon = (
          <IconButton title={networkMessage} aria-label="Network State"
                      color="secondary">
            <CloudOffIcon style={iconStyle}/>
          </IconButton>);
      }
    }

    return (isTopNavigationToggled ?
        <AppBar position="sticky" color="default">
          <IconButton title={"Show toolbar"}
                      className={classes.scrIconSticky} aria-label="Menu"
                      onClick={logoClick}
                      color="default"
          >
            <ScrIcon {...scrSvg.sticky}/>
          </IconButton>
        </AppBar>
        :
        <AppBar position="sticky" color="default">
          <Toolbar>
            <IconButton title={"Hide toolbar"}
                        className={classes.scrIcon} aria-label="Menu"
                        onClick={logoClick}
                        color="secondary"
            >
              <ScrIcon {...scrSvg.logo}/>
            </IconButton>
            <IconButton title={chatTitle} onClick={chatClick}
                        color={isChatToggled ? "secondary" : "default"}>
              <ChatIcon style={iconStyle}/>
            </IconButton>
            <div>
              <IconButton
                aria-owns={shareOpen ? 'menu-appbar' : null}
                aria-haspopup="true"
                onClick={handleShareMenu}
                color={shareOpen ? "secondary" : "default"}
                title={"Share playground"}
              >
                <ShareIcon style={iconStyle}/>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={shareAnchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                open={shareOpen}
                onClose={handleShareClose}
              >
                <MenuItem onClick={shareClick}>{
                  shareUrl ? <a href={shareUrl} target="_blank"
                                onClick={e => e.preventDefault()}
                  >
                    {shareUrl}
                  </a> : 'No Pastebin to Share'
                }
                </MenuItem>
                {
                  shareUrl &&
                  <CopyToClipboard
                    onCopy={() => shareClipboardClick(shareUrl)}
                    text={shareUrl}>
                    <MenuItem className={classes.centered}>
                      Copy to Clipboard
                    </MenuItem>
                  </CopyToClipboard>
                }
              </Menu>
            </div>
            {
              networkStateIcon
            }
            <Typography variant="title" color="inherit"
                        className={classes.flex}>
            </Typography>
            <IconButton
              onClick={switchTheme}
              title={"Switch light/dark theme"}
            >
              {themeType === 'darkTheme' ?
                <LightbulbIcon {...lightBulbIconStyle.light}/>
                : <LightbulbOutlineIcon style={iconStyle}/>
              }
            </IconButton>
            <div>
              <IconButton
                aria-owns={infoOpen ? 'appbar-info-menu' : null}
                aria-haspopup="true"
                onClick={this.handleInfoMenu}
                color={infoOpen ? "secondary" : "default"}
                title="Info"
              >
                <MoreVertIcon style={iconStyle}/>
              </IconButton>
              <Menu
                id="appbar-info-menu"
                anchorEl={infoAnchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={infoOpen}
                onClose={this.handleInfoClose}
              >
                <MenuItem onClick={this.onClick(resetLayoutClick)}>Reset
                  layout</MenuItem>
                <MenuItem onClick={this.onClick(this.helpClick)}>Help</MenuItem>
                <MenuItem onClick={this.onClick(this.contactUsClick)}>Contact
                  us</MenuItem>
                <MenuItem
                  onClick={this.onClick(this.aboutClick)}>About</MenuItem>
                <MenuItem
                  onClick={this.onClick(this.repoClick)}>GitHub</MenuItem>
              </Menu>
            </div>
          </Toolbar>
        </AppBar>
    );
  }
}

TopNavigationBar.propTypes = {
  isNetworkOk: PropTypes.func.isRequired,
  getNetworkStateMessage: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
  switchTheme: PropTypes.func.isRequired,
};

export default withStyles(styles)(TopNavigationBar);
