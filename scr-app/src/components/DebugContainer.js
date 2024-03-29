import React, {useCallback, useEffect, useMemo, useState} from 'react';
import PropTypes from 'prop-types';

import {withStyles} from '@mui/styles';
import Grow from '@mui/material/Grow';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import Paper from '@mui/material/Paper';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Slide from '@mui/material/Slide';

import PlayListPlayIcon from '@mui/icons-material/PlaylistPlay';
import ConsoleIcon from 'mdi-material-ui/ConsoleLine';

import {useLodashThrocer} from '../utils/reactUtils';
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
   const _classes = useMemo(() => ({
         primary: classes.listItemTextPrimary,
         secondary: isUpdating ?
            classes.colorTransitionStart : classes.colorTransition
      }),
      [
         classes, isUpdating
      ]
   );
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
            classes={_classes}
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

const defaultGrowTimeout = {
   appear: 0,
   enter: 2000,
   exit: 0
};

function DebugContainer(
   {
      classes,
      tabOptions,
      handleChangeTab,
      handleChangePlaying,
      isPlaying,
      badgeMaxCount = 99,
      growTimeout = defaultGrowTimeout,
   }
) {
   const {
      colorTransition, colorTransitionStart,
   } = classes;
   
   const [isTraceUpdating, setIsTraceUpdating] = useState(false);
   const [isConsoleUpdating, setIsConsoleUpdating] = useState(false);
   const [traceTotal, setTraceTotal] = useState(0);
   const [consoleTotal, setConsoleTotal] = useState(0);
   const [consoleTableMarginTop, setConsoleTableMarginTop] = useState(0);
   
   const [
      handleTraceTotalChangeThrottled,
      handleTraceTotalChangeDebounced
   ] = useMemo(
      () => ([
         (total) => {
            setIsTraceUpdating(true);
            setTraceTotal(total);
         },
         (total) => {
            setIsTraceUpdating(false);
            setTraceTotal(total);
         }
      ]),
      [setIsTraceUpdating, setTraceTotal]
   );
   
   const handleTraceTotalChange = useLodashThrocer(
      handleTraceTotalChangeThrottled,
      handleTraceTotalChangeDebounced
   );
   
   const [
      handleConsoleTotalChangeThrottled,
      handleConsoleTotalChangeDebounced
   ] = useMemo(
      () => ([
         (total) => {
            setIsConsoleUpdating(true);
            setConsoleTotal(total);
         },
         (total) => {
            setIsConsoleUpdating(false);
            setConsoleTotal(total);
         }
      ]),
      [setIsConsoleUpdating, setConsoleTotal]
   );
   
   const handleConsoleTotalChange = useLodashThrocer(
      handleConsoleTotalChangeThrottled,
      handleConsoleTotalChangeDebounced
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
   
   const [isTraceBadgeInvisible, setIsTraceBadgeInvisible] = useState(true);
   const setIsTraceBadgeInvisibleTrue = useCallback(
      () => setIsTraceBadgeInvisible(true),
      [setIsTraceBadgeInvisible]
   );
   
   const [
      isConsoleBadgeInvisible, setIsConsoleBadgeInvisible
   ] = useState(true);
   const setIsConsoleBadgeInvisibleTrue = useCallback(
      () => setIsConsoleBadgeInvisible(true),
      [setIsConsoleBadgeInvisible]
   );
   
   useEffect(() => {
      traceTotal
      && isTraceUpdating
      && isTraceBadgeInvisible
      && setIsTraceBadgeInvisible(false);
   }, [
      traceTotal, isTraceUpdating,
      isTraceBadgeInvisible, setIsTraceBadgeInvisible
   ]);
   
   useEffect(() => {
      consoleTotal
      && isConsoleUpdating
      && isConsoleBadgeInvisible
      && setIsConsoleBadgeInvisible(false);
   }, [
      consoleTotal, isConsoleUpdating,
      isConsoleBadgeInvisible, setIsConsoleBadgeInvisible
   ]);
   
   return (
      <div className={classes.root}>
         <ToggleButtonGroup
            value={tabOptions}
            onChange={handleChangeTab}
            aria-label="debug tables"
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
                  onOpen={setIsTraceBadgeInvisibleTrue}
               >
                  <Grow in={!isTraceUpdating} timeout={growTimeout}>
                     <Badge
                        invisible={isTraceBadgeInvisible}
                        max={badgeMaxCount}
                        badgeContent={traceTotal}
                        color="secondary"
                     >
                        <PlayListPlayIcon/>
                     </Badge>
                  </Grow>
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
                  onOpen={setIsConsoleBadgeInvisibleTrue}
               >
                  <Grow in={!isConsoleUpdating} timeout={growTimeout}>
                     <Badge
                        invisible={isConsoleBadgeInvisible}
                        max={badgeMaxCount}
                        badgeContent={consoleTotal}
                        color="secondary"
                     >
                        <ConsoleIcon/>
                     </Badge>
                  </Grow>
               </Tooltip>
            </ToggleButton>
            
            {/*"Streams"*/}
            {/*"Visualizations"*/}
         </ToggleButtonGroup>
         
         <Slide direction="down" in={tabOptions?.includes('console')}>
            <Paper
               elevation={2}
               className={classes.paper}
            >
               <ConsoleInput
                  onHeightChange={onHeightChange}
                  editorId='consoleInput'
                  isConsole
               />
            </Paper>
         </Slide>
         <div
            className={classes.tabVisible}
            // onMouseLeave={onDebugTabEnter}
            // onMouseEnter={onDebugTabExit}
         >
            {tabOptions?.includes('console') && (
               <div style={inputOffsetStyle}/>
            )}
            <div className={classes.fillContainer}>
               <TraceList
                  options = {tabOptions}
                  onHandleTotalChange={handleTraceTotalChange}
                  onHandleConsoleTotalChange={handleConsoleTotalChange}
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
