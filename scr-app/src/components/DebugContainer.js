import React from 'react';
import PropTypes from 'prop-types';
import throttle from 'lodash/throttle';
import debounce from 'lodash.debounce';
// import {withStyles, AppBar, Typography, Tabs, Tab} from 'material-ui';
import {withStyles} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import SwipeableViews from 'react-swipeable-views';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import {fade} from '@material-ui/core/styles/colorManipulator';

import Slide from '@material-ui/core/Slide';

import PlayListPlayIcon from '@material-ui/icons/PlaylistPlay';
import ConsoleIcon from 'mdi-material-ui/ConsoleLine';
import TraceTable from './TraceTable';
import TraceToolbar from './TraceToolbar';
import ConsoleInput from './ConsoleInput';
import ConsoleTable from './ConsoleTable';

class TabLabel extends React.Component {
    state = {
        isUpdating: false,
        total: 0,
    };

    handleTotalChangeThrottled = throttle((total) => {
        this.setState({total, isUpdating: true});
    }, 100, {leading: true});

    handleTotalChangeDebounced = debounce((total) => {
        this.setState({total, isUpdating: false});
    }, 250);

    handleTotalChange = (total) => {
        this.handleTotalChangeThrottled(total);
        this.handleTotalChangeDebounced(total);
    };

    render() {
        const {icon, label, classes, resultsMessage} = this.props;
        const {total, isUpdating} = this.state;
        const message = resultsMessage ? resultsMessage(total) : total ? `${total} results` : 'No results';

        return (
            <ListItem
                role={undefined}
                dense
                disableGutters
                component="div"
                className={classes.listItem}
            >
                <ListItemAvatar className={classes.avatar}>
                    <Avatar children={icon}/>
                </ListItemAvatar>
                <ListItemText
                    classes={{
                        root: classes.listItemText,
                        primary: classes.listItemTextPrimary,
                        secondary: isUpdating ?
                            classes.listItemTextSecondaryUpdate : classes.listItemTextSecondary
                    }}
                    primary={label}
                    secondary={message}
                />
            </ListItem>
        );
    }

    componentDidMount() {
        if (this.props.exports) {
            this.props.exports.handleTotalChange = this.handleTotalChange;
        }
    }
}

TabLabel.propTypes = {
    classes: PropTypes.object.isRequired,
    icon: PropTypes.node.isRequired,
    label: PropTypes.string.isRequired,
    resultsMessage: PropTypes.func,
    exports: PropTypes.object,
};

class TabContainer extends React.Component {
    constructor(props) {
        super(props);
        this.listRef = React.createRef();
    }

    render() {
        const {children, /*, dir*/} = this.props;
        return (<div ref={this.listRef} children={children}/>);
    }

    //<Typography component="div" dir={dir}>
    //  {children}
    //</Typography>
}

TabContainer.propTypes = {
    children: PropTypes.node.isRequired,
    dir: PropTypes.string.isRequired,
};

const styles = theme => ({
    appCompact: {
        minHeight: 38,
    },
    appCompactTab: {
        // minHeight: 42,
        // height: 42,
    },
    root: {
        minWidth: 600,
        // overflowY: 'hidden',
        // height: '100%'
        //  backgroundColor: theme.palette.background.paper,
    },
    listItem: {
        padding: 0,
        color: 'unset',
    },
    labelContainer: {
        minHeight: 38,
        height: 38,
        paddingTop: 0,
        // marginTop: -theme.spacing.unit/4,
        paddingBottom: 0,
    },
    avatar: {
        width: theme.spacing(4),
        height: theme.spacing(4),
    },
    // listItemText: {
    //     // maxWidth: '30px',
    // },
    listItemTextPrimary: {
        color: 'unset',
    },
    listItemTextSecondary: {
        maxWidth: 200,
        textTransform: 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        transition: ['color'],
        transitionDuration: 1000,
    },
    listItemTextSecondaryUpdate: {
        maxWidth: 200,
        textTransform: 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        color: theme.palette.secondary.main
    },
    consoleInput: {
        // zIndex: theme.zIndex.appBar
    },
    paper: {
        zIndex: 1,
        position: 'absolute',
        width: 'fill-available',
        margin: theme.spacing(1),
    },
});

class DebugContainer extends React.Component {
    traceExports = {};
    consoleExports = {};
    traceTabIndex = 0;
    consoleTabIndex = 1;

    render() {
        const {theme, classes, tabIndex, handleChangeTab, handleChangeTabIndex, ScrollingListContainers} = this.props;
        return (
            <div className={classes.root}>
                <AppBar position="sticky" color="default" className={classes.appCompact} elevation={1}>
                    <TraceToolbar/>
                    <Tabs
                        value={tabIndex}
                        onChange={handleChangeTab}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="fullWidth"
                        centered
                        className={classes.appCompact}
                    >
                        <Tab
                            label={<TabLabel
                                classes={classes} icon={<PlayListPlayIcon/>} label="trace" exports={this.traceExports}/>
                            }
                        />
                        <Tab
                            label={<TabLabel
                                classes={classes} icon={<ConsoleIcon/>} label="console" exports={this.consoleExports}/>
                            }
                        />
                        {/*<Tab label="Streams"/>*/}
                        {/*<Tab label="Visualizations"/>*/}
                    </Tabs>
                </AppBar>
                <Slide direction="down" in={this.consoleTabIndex === tabIndex}>
                    <Paper elevation={2} className={classes.paper}>
                        <ConsoleInput className={classes.consoleInput}/>
                    </Paper>
                </Slide>

                <SwipeableViews
                    axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                    index={tabIndex}
                    onChangeIndex={handleChangeTabIndex}
                    animateHeight={false}
                    ignoreNativeScroll={true}
                    animateTransitions={false}
                    // onTransitionEnd={(...p)=>{console.log(p);}}
                >
                    <TraceTable
                        handleTotalChange={this.traceExports.handleTotalChange}
                        index={this.traceTabIndex}
                        ScrollingListContainers={ScrollingListContainers}
                    />
                    <ConsoleTable
                        handleTotalChange={this.consoleExports.handleTotalChange}
                        index={this.consoleTabIndex}
                        ScrollingListContainers={ScrollingListContainers}
                    />


                    {/*D3 soon...*/}

                    {/*</TabContainer>*/}
                </SwipeableViews>
            </div>
        );
    }
}

DebugContainer.propTypes = {
    ScrollingListContainers: PropTypes.object,
    classes: PropTypes.object.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withStyles(styles, {withTheme: true})(DebugContainer);
