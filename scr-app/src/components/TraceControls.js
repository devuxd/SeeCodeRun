import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import SpeedDial from '@material-ui/lab/SpeedDial';
import SpeedDialIcon from '@material-ui/lab/SpeedDialIcon';
import SpeedDialAction from '@material-ui/lab/SpeedDialAction';
import SettingsIcon from 'material-ui-icons/Settings';
import PlayArrowIcon from 'material-ui-icons/PlayArrow';
import PlaylistPlayIcon from 'material-ui-icons/PlaylistPlay';
import CodeIcon from 'material-ui-icons/Code';
import EditIcon from 'material-ui-icons/ModeEdit';

const styles = theme => ({
  speedDial: {
    position: 'absolute',
    bottom: theme.spacing.unit,
    right: theme.spacing.unit,
  },
});

const actions = [
  { icon: <PlayArrowIcon />, name: 'Autorun delay' },
  { icon: <PlaylistPlayIcon />, name: 'Trace history' },
  { icon: <CodeIcon />, name: 'Code bundling' },
  { icon: <EditIcon />, name: 'Change history' },
];

class TraceControls extends React.Component {
  state = {
    open: false,
    hidden: false,
  };

  handleVisibility = () => {
    this.setState({
      open: false,
      hidden: !this.state.hidden,
    });
  };

  handleClick = () => {
    this.setState({
      open: !this.state.open,
    });
  };

  handleOpen = () => {
    if (!this.state.hidden) {
      this.setState({
        open: true,
      });
    }
  };

  handleClose = () => {
    this.setState({
      open: false,
    });
  };

  render() {
    const { classes } = this.props;
    const { hidden, open } = this.state;

    return (
        <SpeedDial
          ariaLabel="seeCode.run configuration"
          className={classes.speedDial}
          hidden={hidden}
          icon={<SpeedDialIcon icon={<SettingsIcon />} />}
          onBlur={this.handleClose}
          onClick={this.handleClick}
          onClose={this.handleClose}
          onFocus={this.handleOpen}
          onMouseEnter={this.handleOpen}
          onMouseLeave={this.handleClose}
          open={open}
        >
          {actions.map(action => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={this.handleClick}
            />
          ))}
        </SpeedDial>
    );
  }
}

TraceControls.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(TraceControls);
