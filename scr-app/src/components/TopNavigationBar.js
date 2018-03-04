// @flow weak

import React, {Component} from 'react';
import PropTypes from "prop-types";
import { withStyles } from 'material-ui/styles';
import scrLogo from '../res/scrLogo.png';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import IconButton from 'material-ui/IconButton';
import Icon from 'material-ui/Icon';

const styles = {
  //
  root: {
    marginTop: 0,
    width: '100%',
  },
  flex: {
    flex: 1,
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
  }
};

class TopNavigationBar extends Component {
  constructor(props) {
    super(props);

    this.editHistoryClick = this.editHistoryClick.bind(this);
    this.shareClick = this.shareClick.bind(this);
    this.chatClick = this.chatClick.bind(this);

    this.state = {
      isEditHistoryToggled: false,
      isShareToggled: false,
      isChatToggled: false
    };
  }

  logoClick() {
    window.open('https://seecode.run/', '_blank');
  }

  editHistoryClick() {
    this.setState({
      isEditHistoryToggled: !this.state.isEditHistoryToggled
    });
  }


  shareClick() {
    this.setState({
      isShareToggled: !this.state.isShareToggled
    });
  }


  chatClick() {
    this.setState({
      isChatToggled: !this.state.isChatToggled
    });
  }


  helpClick() {
    window.open('https://github.com/tlatoza/SeeCodeRun/wiki/SeeCode.Run-Help!', '_blank');
  }


  contactUsClick() {
    window.open('mailto:contact@seecode.run', '_blank');
  }


  aboutClick() {
    window.open('https://github.com/tlatoza/SeeCodeRun/wiki/About-SeeCode.Run', '_blank');
  }

  render() {
    const classes = this.props.classes;
    return (
      <div className={classes.root}>
        <AppBar position="static" color="default">
          <Toolbar>
            <IconButton title={"Create a new seeCode.run playground"} className={classes.menuButton} aria-label="Menu"
                        onClick={this.logoClick}>
              <img src={scrLogo} className="scr-logo" alt="SCR"/>
            </IconButton>
            <IconButton title={"Edit history"} onClick={this.editHistoryClick} color={this.state.isEditHistoryToggled? "secondary": "default"}>
              <Icon>change_history</Icon>
            </IconButton>
            <Typography variant="title" color="inherit" className={classes.flex}>
            </Typography>
            <IconButton title={"Share playground"} onClick={this.shareClick} color={this.state.isShareToggled? "secondary": "default"}>
              <Icon>share</Icon>
            </IconButton>
            <IconButton title={"Chat"} onClick={this.chatClick} color={this.state.isChatToggled? "secondary": "default"}>
              <Icon>chat</Icon>
            </IconButton>
            <IconButton title={"Help"} onClick={this.helpClick}>
              <Icon>help</Icon>
            </IconButton>
            <IconButton title={"Contact us"} onClick={this.contactUsClick}>
              <Icon>contact_mail</Icon>
            </IconButton>
            <IconButton title={"About"} onClick={this.aboutClick}>
              <Icon>info</Icon>
            </IconButton>
          </Toolbar>
        </AppBar>
      </div>
    );
  }
}

TopNavigationBar.propTypes = {
  classes: PropTypes.object.isRequired,
};

TopNavigationBar.contextTypes = {
  store: PropTypes.object.isRequired
}

export default withStyles(styles)(TopNavigationBar);
