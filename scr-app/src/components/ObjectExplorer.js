import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from 'material-ui/styles';

import {Inspector} from 'react-inspector';

const styles = theme => ({
  paper: {
    padding: theme.spacing.unit,
  },
  popover: {
    pointerEvents: 'none',
  }
});


class ObjectExplorer extends React.Component {
  state = {
    anchorEl: null,
    timeout: null
  };

  render() {
    const {classes, data} = this.props;

    return <Inspector data={data}/>;
  }
}

ObjectExplorer.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ObjectExplorer);
