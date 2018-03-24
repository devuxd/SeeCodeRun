import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from 'material-ui/styles';
import SwipeableViews from 'react-swipeable-views';
import AppBar from 'material-ui/AppBar';
import Tabs, {Tab} from 'material-ui/Tabs';
import Typography from 'material-ui/Typography';

import TraceTable from './TraceTable';

function TabContainer({children, dir}) {
  return (
    <Typography component="div" dir={dir} >
      {children}
    </Typography>
  );
}

TabContainer.propTypes = {
  children: PropTypes.node.isRequired,
  dir: PropTypes.string.isRequired,
};

const styles = theme => ({
  root: {
    backgroundColor: theme.palette.background.paper,
  },
});

class DebugContainer extends React.Component {
  state = {
    value: 0,
  };

  handleChange = (event, value) => {
    this.setState({value});
  };

  handleChangeIndex = index => {
    this.setState({value: index});
  };

  render() {
    const {classes, appClasses, theme, setLiveExpressionStoreChange} = this.props;

    return (
      <div className={classes.root}>
        <AppBar position="sticky" color="default">
          <Tabs
            value={this.state.value}
            onChange={this.handleChange}
            indicatorColor="primary"
            textColor="primary"
            fullWidth
            centered
          >
            <Tab label="Trace"/>
            <Tab label="Visualizations"/>
            <Tab label="History"/>
          </Tabs>
        </AppBar>
        <SwipeableViews
          axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
          index={this.state.value}
          onChangeIndex={this.handleChangeIndex}
        >
          <TabContainer dir={theme.direction}>
                <TraceTable setLiveExpressionStoreChange={setLiveExpressionStoreChange} />
          </TabContainer>
          <TabContainer dir={theme.direction} >

                D3 soon...

          </TabContainer>
          <TabContainer dir={theme.direction} className={appClasses.container}>
            Code edit history and dumped traces
          </TabContainer>
        </SwipeableViews>
      </div>
    );
  }
}

DebugContainer.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, {withTheme: true})(DebugContainer);
