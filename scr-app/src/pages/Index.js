import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Reboot from 'material-ui/Reboot';
import {withStyles} from 'material-ui/styles';
import withRoot from '../components/withRoot';
import Paper from 'material-ui/Paper';

import TopNavigation from '../containers/TopNavigation';
import PasteBin from '../containers/Pastebin';
const styles = {
  root: {
    height: '99.9%'
  },
};

class Index extends Component {
  render() {
    const {classes} = this.props;
    return (
      <div>
        <Reboot/>
        <Paper className={classes.root}>
          <TopNavigation/>
          <PasteBin/>
        </Paper>
      </div>
    );
  }
}

Index.propTypes = {
  classes: PropTypes.object.isRequired
};
Index.contextTypes = {
  store: PropTypes.object.isRequired
};

export default withRoot(withStyles(styles)(Index));
