import React, {useState} from 'react';
import PropTypes from 'prop-types';
import throttle from 'lodash/throttle';
import debounce from 'lodash.debounce';
import {withStyles} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';

import Slide from '@material-ui/core/Slide';

import PlayListPlayIcon from '@material-ui/icons/PlaylistPlay';
import ConsoleIcon from 'mdi-material-ui/ConsoleLine';
import TraceTable from './TraceTable';
import TraceToolbar from './TraceToolbar';
import ConsoleInput from './ConsoleInput';
import ConsoleTable from './ConsoleTable';

function TabResultLabel({icon, label, classes, formatText, result, isUpdating}) {
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
                secondary={formatText ? formatText(result) : result ? `${result} results` : 'No results'}
            />
        </ListItem>
    );
}

TabResultLabel.propTypes = {
    icon: PropTypes.node,
    label: PropTypes.string.isRequired,
    classes: PropTypes.object,
    formatText: PropTypes.func,
    result: PropTypes.any,
    isUpdating: PropTypes.bool,
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

function a11yProps(index) {
    return {
        id: `debug-tab-${index}`,
        'aria-controls': `debug-tabpanel-${index}`,
    };
}

function DebugContainer({classes, tabIndex, handleChangeTab, ScrollingListContainers, handleChangePlaying}) {
    const traceTabIndex = 0;
    const consoleTabIndex = 1;
    const [isTraceUpdating, setIsTraceUpdating] = useState(false);
    const [traceTotal, setTraceTotal] = useState(0);
    const [isConsoleUpdating, setIsConsoleUpdating] = useState(false);
    const [consoleTotal, setConsoleTotal] = useState(0);

    const handleTraceTotalChangeThrottled = throttle((total) => {
        setIsTraceUpdating(true);
        setTraceTotal(total);
    }, 100, {leading: true});

    const handleTraceTotalChangeDebounced = debounce((total) => {
        setIsTraceUpdating(false);
        setTraceTotal(total);
    }, 250);

    const handleTraceTotalChange = (total) => {
        handleTraceTotalChangeThrottled(total);
        handleTraceTotalChangeDebounced(total);
    };

    const handleConsoleTotalChangeThrottled = throttle((total) => {
        setIsConsoleUpdating(true);
        setConsoleTotal(total);
    }, 100, {leading: true});

    const handleConsoleTotalChangeDebounced = debounce((total) => {
        setIsConsoleUpdating(false);
        setConsoleTotal(total);
    }, 250);

    const handleConsoleTotalChange = (total) => {
        handleConsoleTotalChangeThrottled(total);
        handleConsoleTotalChangeDebounced(total);
    };

    return (<div className={classes.root}>
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
                    aria-label="debug tabs"
                >
                    <Tab
                        {...a11yProps(traceTabIndex)}
                        label={<TabResultLabel result={traceTotal} isUpdating={isTraceUpdating}
                                               classes={classes} icon={<PlayListPlayIcon/>} label="trace"/>
                        }
                    />
                    <Tab
                        {...a11yProps(consoleTabIndex)}
                        label={<TabResultLabel result={consoleTotal} isUpdating={isConsoleUpdating}
                                               classes={classes} icon={<ConsoleIcon/>} label="console"/>
                        }
                    />
                    {/*<Tab label="Streams"/>*/}
                    {/*<Tab label="Visualizations"/>*/}
                </Tabs>
            </AppBar>
            <Slide direction="down" in={consoleTabIndex === tabIndex}>
                <Paper elevation={2} className={classes.paper}>
                    <ConsoleInput className={classes.consoleInput}/>
                </Paper>
            </Slide>
            <TraceTable
                onHandleTotalChange={handleTraceTotalChange}
                ScrollingListContainers={ScrollingListContainers}
                open={tabIndex === traceTabIndex}
                handleChangePlaying={handleChangePlaying}
            />
            <ConsoleTable
                onHandleTotalChange={handleConsoleTotalChange}
                ScrollingListContainers={ScrollingListContainers}
                open={tabIndex === consoleTabIndex}
                handleChangePlaying={handleChangePlaying}
            />
        </div>
    );
}

DebugContainer.propTypes = {
    ScrollingListContainers: PropTypes.object,
    classes: PropTypes.object.isRequired,
    theme: PropTypes.object.isRequired,
    handleChangePlaying: PropTypes.func.isRequired,
};

export default withStyles(styles, {withTheme: true})(DebugContainer);
