import React from 'react';
import PropTypes from 'prop-types';
import {withStyles, AppBar, Typography, Tabs, Tab} from 'material-ui';
import SwipeableViews from 'react-swipeable-views';

import TraceTable from './TraceTable';
import TraceToolbar from './TraceToolbar';

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
        backgroundColor: theme.palette.background.paper,
    },
});

class DebugContainer extends React.Component {

    render() {
        const {classes, appClasses, theme, tabIndex, handleChangeTab, handleChangeTabIndex} = this.props;

        return (
            <div style={{minWidth: 500}}>
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
                        <Tab label="Streams"/>
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
                        Code edit history and dumped traces
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
