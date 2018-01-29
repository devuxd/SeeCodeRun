import React from 'react';
import PropTypes from 'prop-types';
import Popover from 'material-ui/Popover';
import {withStyles} from 'material-ui/styles';

import ObjectExplorer from '../components/ObjectExplorer';

const styles = theme => ({
  paper: {
    padding: theme.spacing.unit,
  },
  popover: {
    // restricts backdrop from being modal
    width: 0,
    height: 0
    // pointerEvents: 'none',
  }
});

const defaultCloseDelay = 1000;

const closedState = {
  timeout: null,
  previousAnchorEl: null,
  anchorEl: null,
  mouseEvent: null,
};

class ExpressionPopover extends React.Component {
  state = {
    ...closedState
  };

  componentWillReceiveProps(nextProps, nextContext) {
    const {previousAnchorEl} = this.state;
    const {anchorEl, mouseEvent} = nextProps;
    if (anchorEl) {
      // if (previousAnchorEl !== anchorEl) {
        this.handleOpen(anchorEl, mouseEvent);
      // }
    } else {
      this.handleClose();
    }
  }

  handleOpen = (newAnchorEl, mouseEvent) => {
    const {timeout} = this.state;
    clearTimeout(timeout);
    if (newAnchorEl && mouseEvent) {
      const {anchorEl} = this.state;
      this.setState({
        anchorEl: null,
      });

      setTimeout(() => {
        // this.store.dispatch();
        this.setState({
          previousAnchorEl: anchorEl,
          anchorEl: newAnchorEl,
          mouseEvent: mouseEvent,
          timeout: null,
        });
      }, 0);

    } else {
      this.setState({timeout: null});
    }
  };

  handleClose = event => {
    const {closeDelay} = this.props;
    let {timeout} = this.state;
    clearTimeout(timeout);

    const eventType = event ? event.type : 'click';
    if (eventType === 'click') {
      this.setState({...closedState});
      return;
    }

    timeout = setTimeout(() => {
        this.setState({...closedState});
      },
      isNaN(closeDelay)?defaultCloseDelay: closeDelay
    );
    this.setState({timeout: timeout});
  };

  render() {
    const {classes, data} = this.props;
    let {anchorEl} = this.state;
    const open = !!anchorEl;
    return (
      <Popover
        className={classes.popover}
        classes={{
          paper: classes.paper,
        }}
        hideBackdrop={true}
        disableBackdropClick={true}
        disableAutoFocus={true}
        disableEnforceFocus={true}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={this.handleClose}
      >
        <ObjectExplorer data={document}/>
      </Popover>
    );
  }
}

ExpressionPopover.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ExpressionPopover);
