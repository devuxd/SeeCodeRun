import React from 'react';
import PropTypes from 'prop-types';
import Popover from 'material-ui/Popover';
import Typography from 'material-ui/Typography';
import {withStyles} from 'material-ui/styles';

import ObjectExplorer from '../components/ObjectExplorer';

const styles = theme => ({
  paper: {
    padding: theme.spacing.unit,
  },
  popover: {
    // pointerEvents: 'none',
  }
});

const closeDelay = 1000;

class ExpressionPopover extends React.Component {
  state = {
    anchorEl: null,
    timeout: null
  };

  handlePopoverOpen = event => {
    let {timeout} = this.state;
    clearTimeout(timeout);
    console.log("open", event.target, timeout);
   this.setState({anchorEl: event.target, timeout: null});
  };

  handlePopoverClose = event => {
    // if(event){
    //   return;
    // }
    let {timeout} = this.state;
    clearTimeout(timeout);
    console.log("close", event, timeout);
    timeout = setTimeout(() => {
        this.setState({anchorEl: null});
      },
      closeDelay
    );
    this.setState({timeout: timeout});
  };

  render() {
    const {classes} = this.props;
    const {anchorEl} = this.state;
    const open = !!anchorEl;

    return (
      <div className="wrapper">
        <Typography onMouseOver={this.handlePopoverOpen} onMouseOut={this.handlePopoverClose}>
          Hover with a Popover.
        </Typography>
        <Popover
          className={classes.popover}
          classes={{
            paper: classes.paper,
          }}
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
          onClose={this.handlePopoverClose}
          onEntering={console.log("Entering")}
          onEnter={console.log("Enter")}
          onEntered={console.log("Entered")}
        >
          <ObjectExplorer
            onMouseOver={this.handlePopoverOpen}
            onMouseOut={this.handlePopoverClose}
            data={{
              x: {x1: 0},
              y: 'ssssssssssssssswdhievbrigbbtgbirt',
              z: ['1111113242543747764', 53647457658578799979]
            }}/>
        </Popover>
      </div>
    );
  }
}

ExpressionPopover.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ExpressionPopover);
