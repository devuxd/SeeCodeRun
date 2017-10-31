// @flow weak

import React, {Component} from 'react';
import scrLogo from '../res/scrLogo.png';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import Icon from 'material-ui/Icon';
// import MenuIcon from 'material-ui-icons/Menu';

const styles = theme => ({
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
  },
});

function logoClick() {
  window.open('https://seecode.run/', '_blank');
}

function ButtonAppBar(props) {
  const { classes } = props;
  return (
    <div className={classes.root}>
      <AppBar position="static" color="default">
        <Toolbar>
          <IconButton className={classes.menuButton}  aria-label="Menu">
            <img src={scrLogo} className="scr-logo" alt="SCR" onClick={logoClick}/>
          </IconButton>
          <IconButton>
            <Icon title={"Edit History"}>change_history</Icon>
          </IconButton>
          <Typography type="title" color="inherit" className={classes.flex}>
          </Typography>
          <IconButton>
            <Icon title={"Share Playground"}>share</Icon>
          </IconButton>
          <IconButton>
            <Icon title={"Chat"}>chat</Icon>
          </IconButton>
          <IconButton>
            <Icon title={"Help"}>help</Icon>
          </IconButton>
          <IconButton>
            <Icon title={"Contact Us"}>contact_mail</Icon>
          </IconButton>
          <IconButton>
            <Icon title={"About"}>info</Icon>
          </IconButton>
        </Toolbar>
      </AppBar>
    </div>
  );
}

ButtonAppBar.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ButtonAppBar);
