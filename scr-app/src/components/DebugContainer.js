import React from 'react';
import PropTypes from 'prop-types';
// import {withStyles, AppBar, Typography, Tabs, Tab} from 'material-ui';
import {withStyles} from 'material-ui/styles';
import AppBar from 'material-ui/AppBar';
import Typography from 'material-ui/Typography';
import Tabs, {Tab} from 'material-ui/Tabs';
import SwipeableViews from 'react-swipeable-views';

import TraceTable from './TraceTable';
import TraceToolbar from './TraceToolbar';
import Console from './Console';

function TabContainer({children, dir}) {
    return (
        <Typography component="div" dir={dir}>
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
        minWidth: 600,
      //  backgroundColor: theme.palette.background.paper,
    },
});

class DebugContainer extends React.Component {

    render() {
        const {theme, classes, tabIndex, handleChangeTab, handleChangeTabIndex} = this.props;

        return (
            <div className={classes.root}>
                <AppBar position="sticky" color="default">
                    <TraceToolbar/>
                    <Tabs
                        value={tabIndex}
                        onChange={handleChangeTab}
                        indicatorColor="primary"
                        textColor="primary"
                        fullWidth
                        centered
                    >
                        <Tab label="Trace"/>
                        <Tab label="Console"/>
                        {/*<Tab label="Streams"/>*/}
                        {/*<Tab label="Visualizations"/>*/}
                    </Tabs>
                </AppBar>

                <SwipeableViews
                    axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                    index={tabIndex}
                    onChangeIndex={handleChangeTabIndex}
                >
                    <TabContainer dir={theme.direction}>
                        <TraceTable/>
                    </TabContainer>
                    <TabContainer dir={theme.direction}>
                        <Console />
                    </TabContainer>
                    {/*<TabContainer dir={theme.direction}>*/}

                    {/*D3 soon...*/}

                    {/*</TabContainer>*/}
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
