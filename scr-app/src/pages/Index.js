/* eslint-disable flowtype/require-valid-file-annotation */
import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {withStyles} from 'material-ui/styles';
import withRoot from '../components/withRoot';
import Paper from 'material-ui/Paper';

import TopNavigation from '../containers/TopNavigation';
import PasteBin from '../containers/Pastebin';
// import BottomNavigation from '../containers/bottomNavigation'; <BottomNavigation/>

const styles = {
  root: {
    height: '99.9%'
  },
};

class Index extends Component {

  render() {
    const {classes} = this.props;
    return (
      <Paper className={classes.root}>
        <TopNavigation/>
        <PasteBin/>
      </Paper>
    );
  }

  componentDidMount() {

  }
}

Index.propTypes = {
  classes: PropTypes.object.isRequired
};

Index.contextTypes = {
  store: PropTypes.object.isRequired
};

export default withRoot(withStyles(styles)(Index));
