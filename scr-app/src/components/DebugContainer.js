import React, {useState, useCallback, useMemo} from 'react';
import PropTypes from 'prop-types';
import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';

import {withStyles} from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import Badge from '@material-ui/core/Badge';
import Paper from '@material-ui/core/Paper';
import ToggleButton from '@material-ui/core/ToggleButton';
import ToggleButtonGroup from '@material-ui/core/ToggleButtonGroup';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import Slide from '@material-ui/core/Slide';

import PlayListPlayIcon from '@material-ui/icons/PlaylistPlay';
import ConsoleIcon from 'mdi-material-ui/ConsoleLine';

import {useLodashDelayable} from '../utils/reactUtils';
import TraceList from './TraceList';
import ConsoleInput from './ConsoleInput';
import ConsoleList from './ConsoleList';

function TabResultLabel({
                            icon,
                            label,
                            classes,
                            formatText,
                            result,
                            isUpdating
                        }) {
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
                        classes.colorTransitionStart : classes.colorTransition
                }}
                primary={label}
                secondary={
                    formatText ?
                        formatText(result)
                        : result ? `${result} results` : 'No results'
                }
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
    floatingAction: {
        zIndex: theme.zIndex.speedDial,
        position: 'absolute',
        bottom: theme.spacing(2),
        right: theme.spacing(2),
        backgroundColor: theme.palette.background.default,
    },
    root: {
        minWidth: 600,
        height: '100%',
    },
    listItem: {
        padding: 0,
        color: 'unset',
    },
    labelContainer: {
        minHeight: 38,
        height: 38,
        paddingTop: 0,
        paddingBottom: 0,
    },
    avatar: {
        width: theme.spacing(4),
        height: theme.spacing(4),
    },
    listItemTextPrimary: {
        color: 'unset',
    },
    colorTransition: {
        transition: ['background-color'],
        transitionDuration: 2000,
    },
    colorTransitionStart: {
        backgroundColor: theme.palette.secondary.main
    },
    opacityTransition: {
        transition: ['opacity'],
        transitionDuration: 10000,
        transitionTimingFunction: 'cubic-bezier(1,0,1,-0.75)',
        opacity: 0,
    },
    opacityTransitionStart: {
        opacity: 1,
    },
    paper: {
        zIndex: 1,
        position: 'absolute',
        width: 'fill-available',
        margin: 0,
    },
    tabVisible: {
        position: 'absolute',
        height: '100%',
        width: '100%',
        visibility: 'visible',
    },
    tabHidden: {
        position: 'absolute',
        height: '100%',
        width: '100%',
        visibility: 'hidden',
    },
    fillContainer: {
        height: `100%`,
        width: '100%',
    },

});

function a11yProps(index) {
    return {
        id: `debug-table-${index}`,
        'aria-controls': `debug-tabpanel-${index}`,
    };
}

function DebugContainer(
    {
        classes,
        tabIndex,
        handleChangeTab,
        handleChangePlaying,
        isPlaying,
        badgeMaxCount = 99
    }
) {
    const {
        colorTransition, colorTransitionStart,
        opacityTransition, opacityTransitionStart,
    } = classes;
    const [isTraceUpdating, setIsTraceUpdating] = useState(false);
    const [isConsoleUpdating, setIsConsoleUpdating] = useState(false);
    const [traceTotal, setTraceTotal] = useState(0);
    const [consoleTotal, setConsoleTotal] = useState(0);
    const [consoleTableMarginTop, setConsoleTableMarginTop] = useState(0);

    const [handleTraceTotalChangeThrottled] = useLodashDelayable(
        throttle,
        (total) => {
            setIsTraceUpdating(true);
            setTraceTotal(total);
        },
        1500,
        {leading: true, trailing: false}
    );
    const [handleTraceTotalChangeDebounced] = useLodashDelayable(
        debounce,
        (total) => {
            handleTraceTotalChangeThrottled.cancel();
            setIsTraceUpdating(false);
            setTraceTotal(total);
        },
        500,
        {leading: false, trailing: true, maxWait: 1000}
    );

    const [handleTraceTotalChange] = useLodashDelayable(
        throttle,
        (total) => {
            handleTraceTotalChangeThrottled(total);
            handleTraceTotalChangeDebounced(total);
        },
        0,
    );

    const [handleConsoleTotalChangeThrottled] = useLodashDelayable(
        throttle,
        (total) => {
            setIsConsoleUpdating(true);
            setConsoleTotal(total);
        },
        1500,
        {leading: true, trailing: false}
    );
    const [handleConsoleTotalChangeDebounced] = useLodashDelayable(
        debounce,
        (total) => {
            handleConsoleTotalChangeThrottled.cancel();
            setIsConsoleUpdating(false);
            setConsoleTotal(total);
        },
        500,
        {leading: false, trailing: true, maxWait: 1000}
    );

    const [handleConsoleTotalChange] = useLodashDelayable(
        throttle,
        (total) => {
            handleConsoleTotalChangeThrottled(total);
            handleConsoleTotalChangeDebounced(total);
        },
        0,
    );
    const onDebugTabEnter = useCallback(
        () => handleChangePlaying('table', true),
        [handleChangePlaying]);
    const onDebugTabExit = useCallback(
        () => handleChangePlaying('table', false),
        [handleChangePlaying]);

    const inputOffsetStyle = useMemo(() => ({
        height: consoleTableMarginTop,
        width: '100%'
    }), [consoleTableMarginTop]);

    const onHeightChange = useCallback(
        (
            event, {containerHeight}
        ) => setConsoleTableMarginTop(containerHeight)
        , [setConsoleTableMarginTop]);

    const traceBadgeClasses = useMemo(
        () => ({
            badge: isTraceUpdating ? opacityTransitionStart : opacityTransition
        })
        , [isTraceUpdating, opacityTransition, opacityTransitionStart]
    );

    const consoleBadgeClasses = useMemo(
        () => ({
            badge: isConsoleUpdating ?
                opacityTransitionStart : opacityTransition
        })
        , [isConsoleUpdating, opacityTransition, opacityTransitionStart]
    );

    return (
        <div className={classes.root}>
            <ToggleButtonGroup
                value={tabIndex}
                onChange={handleChangeTab}
                aria-label="debug tables"
                exclusive
                className={classes.floatingAction}
            >
                <ToggleButton
                    value="trace"
                    aria-label="trace"
                    {...a11yProps('trace')}
                    className={
                        isTraceUpdating ? colorTransitionStart : colorTransition
                    }
                >
                    <Tooltip
                        title={`Trace: ${traceTotal} total entries`}
                        placement={'bottom-end'}
                        enterDelay={300}
                    >
                        <Badge
                            max={badgeMaxCount}
                            badgeContent={traceTotal}
                            color="secondary"
                            classes={traceBadgeClasses}
                        >
                            <PlayListPlayIcon/>
                        </Badge>
                    </Tooltip>
                </ToggleButton>
                <ToggleButton
                    value="console"
                    aria-label="console"
                    {...a11yProps('console')}
                    className={
                        isConsoleUpdating ?
                            colorTransitionStart : colorTransition
                    }
                >
                    <Tooltip
                        title={`Console: ${consoleTotal} total entries`}
                        placement={'bottom-end'}
                        enterDelay={300}
                    >
                        <Badge
                            max={badgeMaxCount}
                            badgeContent={consoleTotal}
                            color="secondary"
                            classes={consoleBadgeClasses}
                        >
                            <ConsoleIcon/>
                        </Badge>
                    </Tooltip>
                </ToggleButton>

                {/*"Streams"*/}
                {/*"Visualizations"*/}
            </ToggleButtonGroup>

            <Slide direction="down" in={tabIndex === 'console'}>
                <Paper
                    elevation={2}
                    className={classes.paper}
                >
                    <ConsoleInput
                        onHeightChange={onHeightChange}
                    />
                </Paper>
            </Slide>
            <div
                className={
                    tabIndex === 'trace' ?
                        classes.tabVisible : classes.tabHidden
                }
                onMouseLeave={onDebugTabEnter}
                onMouseEnter={onDebugTabExit}
            >
                <TraceList
                    headerHeight={0}
                    onHandleTotalChange={handleTraceTotalChange}
                    heightDelta={0}
                    autoScroll={isPlaying}
                />
            </div>
            <div
                className={
                    tabIndex === 'console' ?
                        classes.tabVisible : classes.tabHidden
                }
            >
                <div style={inputOffsetStyle}/>
                <div className={classes.fillContainer}
                     onMouseLeave={onDebugTabEnter}
                     onMouseEnter={onDebugTabExit}
                >
                    <ConsoleList
                        headerHeight={consoleTableMarginTop}
                        onHandleTotalChange={handleConsoleTotalChange}
                        heightDelta={consoleTableMarginTop}
                        autoScroll={isPlaying}
                    />
                </div>
            </div>
        </div>
    );
}

DebugContainer.propTypes = {
    classes: PropTypes.object.isRequired,
    theme: PropTypes.object.isRequired,
    handleChangePlaying: PropTypes.func.isRequired,
};

export default withStyles(styles, {withTheme: true})(DebugContainer);
