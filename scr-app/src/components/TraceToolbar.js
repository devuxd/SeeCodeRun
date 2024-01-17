import React, {useCallback, useEffect, useMemo, useState, useContext} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {BehaviorSubject} from "rxjs";
import {debounceTime} from "rxjs/operators";

import {withStyles} from '@mui/styles';
import {lighten} from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import TuneIcon from '@mui/icons-material/Tune';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak';
import PauseIcon from '@mui/icons-material/Pause';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import FilterListIcon from '@mui/icons-material/FilterList';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import PastebinContext from '../contexts/PastebinContext';
import GraphicalQuery from '../components/GraphicalQuery';
import {searchStateChange} from '../redux/modules/pastebin';
// import {VisualQueryManager} from "../core/modules/VisualQueryManager";
import HighlightAltIcon from "@mui/icons-material/HighlightAlt";

const mapStateToProps = null,
    mapDispatchToProps = {
        searchStateChange
    };

const toolbarStyles = theme => ({
    root: {
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
    },
    highlight:
        theme.palette.mode === 'light'
            ? {
                color: theme.palette.secondary.main,
                backgroundColor: lighten(theme.palette.secondary.light, 0.85),
            }
            : {
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.secondary.dark,
            },
    actions: {
        color: theme.palette.text.secondary,
        flex: '1 0 auto',
    },
    title: {
        flex: '1 1 100%',
    },
    textField: {
        margin: 0,
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
    },
    chipArray: {
        display: 'flex',
        position: 'relative',
        grow: 'column',
        justifyContent: 'center',
        flexWrap: 'wrap',
        zIndex: theme.zIndex.appBar,
        paddingLeft: theme.spacing(1),
    },
    tuneIcon: {
        fontSize: theme.typography.fontSize,
    },
    chipRoot: {
        fontSize: theme.typography.pxToRem(theme.typography.fontSize * 0.8),
        height: theme.typography.fontSize * 1.75,
        margin: 0,
        backgroundColor: 'transparent',
    },
    chipAvatar: {
        marginRight: -(theme.typography.fontSize / 2),
        height: theme.typography.fontSize * 1.75,
        width: theme.typography.fontSize * 1.75,
        fontSize: theme.typography.pxToRem(theme.typography.fontSize * 0.75),
        backgroundColor: 'transparent',
    },
    chipLabel: {
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(0.5),
    },
    inputProps: {
        paddingLeft: theme.spacing(0.5),
        height: '3rem',
    },
    itemCenter: {
        minWidth: 400,
        maxWidth: 1000,
        width: '50%',
        display: 'flex',
        alignItems: 'center',
        position: 'absolute',             /* new */
        left: '50%',
        transform: 'translateX(-50%)',
    },
});

// const handleChangeExpand = debounce((setExpanded, expanded) => {
//     setExpanded(expanded);
// }, 300);


const inputFilterOptions = [
    {
        title: 'Match Case',
        label: 'Aa',
        actionId: 'isCase'
    },
    {
        title: 'Words',
        label: 'W',
        actionId: 'isWord'
    },
    {
        title: 'Regex',
        label: '.*',
        actionId: 'isRegExp'
    },

];

function InputEndAdornment(props) {
    const {classes, searchState} = props;
    const [expanded /*, setExpanded*/] = useState(true);
    const {isCase, isWord, isRegExp, handleFilterClick} = searchState;

    const avatarClasses = {
        root: classes.chipRoot, // class name, e.g. `classes-root-x`
        avatar: classes.chipAvatar, // class name, e.g. `classes-label-x`
        label: classes.chipLabel,
    };
    const hasSelected = isCase || isWord || isRegExp;
    return (
        <InputAdornment position="end">
                <span className={classes.chipArray}
                    // onMouseEnter={
                    //     () => handleChangeExpand(setExpanded, true)
                    // }
                    // onMouseLeave={
                    //     () => handleChangeExpand(setExpanded, false)
                    // }
                >
                    {!expanded ? hasSelected ?
                            <TuneIcon
                                className={classes.tuneIcon}
                            />
                            : <TuneIcon
                                color="inherit"
                                className={classes.tuneIcon}
                            />
                        : <Paper>
                            {inputFilterOptions.map(filter =>
                                (<Tooltip
                                        title={filter.title}
                                        key={filter.actionId}
                                    >
                                        <Chip
                                            label={filter.label}
                                            onClick={
                                                () => handleFilterClick(
                                                    filter.actionId
                                                )
                                            }
                                            classes={avatarClasses}
                                            avatar={searchState[
                                                filter.actionId
                                                ] ?
                                                <Avatar>
                                                    <CheckBoxIcon
                                                        color="primary"/>
                                                </Avatar>
                                                : <Avatar>
                                                    <CheckBoxOutlineBlankIcon/>
                                                </Avatar>}
                                        />
                                    </Tooltip>
                                ))}
                        </Paper>
                    }
                </span>
        </InputAdornment>
    );
}

function ResultsFilter(
    {
        classes,
        isGraphicalLocatorActive,
        handleChangeGraphicalLocator,
        searchState,
        getSortInfo
    }
) {
    const {
        // isFunctions,
        isExpressions, isValues, handleFilterClick
    } = searchState;
    //const hasSelected = isFunctions || isExpressions || isValues;
    const avatarClasses = {
        root: classes.chipRoot, // class name, e.g. `classes-root-x`
        avatar: classes.chipAvatar, // class name, e.g. `classes-label-x`
        label: classes.chipLabel,
    };

    const {SortIcon, sortTitle, handleGetNextSortOption} = getSortInfo();

    return (
        <>
            {/*<Tooltip*/}
            {/*    title={"Include Functions"}*/}
            {/*>*/}
            {/*    <Chip*/}
            {/*        label="f(x)"*/}
            {/*        onClick={() => handleFilterClick('isFunctions')}*/}
            {/*        classes={avatarClasses}*/}
            {/*        avatar={isFunctions ? <Avatar><CheckBoxIcon/></Avatar> :*/}
            {/*            <Avatar><CheckBoxOutlineBlankIcon/></Avatar>}*/}
            {/*    />*/}
            {/*</Tooltip>*/}
            <Tooltip
                title={sortTitle}
            >
                <Chip
                    onClick={handleGetNextSortOption}
                    classes={avatarClasses}
                    avatar={
                        <Avatar>
                            <SortIcon/>
                        </Avatar>
                    }
                />
            </Tooltip>
            <Tooltip
                title={"Include Code Expressions"}
            >
                <Chip
                    label="code"//"x=y"
                    onClick={() => handleFilterClick('isExpressions')}
                    classes={avatarClasses}
                    avatar={isExpressions ? <Avatar><CheckBoxIcon/></Avatar> :
                        <Avatar><CheckBoxOutlineBlankIcon/></Avatar>}
                />
            </Tooltip>
            <Tooltip
                title={"Include Execution Values"}
            >
                <Chip
                    label="values"//"{...}"
                    onClick={() => handleFilterClick('isValues')}
                    classes={avatarClasses}
                    avatar={
                        isValues ? <Avatar><CheckBoxIcon/></Avatar> :
                            <Avatar><CheckBoxOutlineBlankIcon/></Avatar>
                    }
                />
            </Tooltip>
            <Tooltip
                title={"Include Visual Elements"}
            >
                <Chip
                    label="visuals"//"{...}"
                    onClick={handleChangeGraphicalLocator}
                    classes={avatarClasses}
                    avatar={
                        isGraphicalLocatorActive ? <Avatar><CheckBoxIcon/></Avatar> :
                            <Avatar><CheckBoxOutlineBlankIcon/></Avatar>
                    }
                />
            </Tooltip>
            {/*<Tooltip*/}
            {/*    title={*/}
            {/*       `${*/}
            {/*           isGraphicalLocatorActive ?*/}
            {/*               'Hide' : 'Show'*/}
            {/*       } visual elements referenced in code`*/}
            {/*    }*/}
            {/*>*/}
            {/*   <IconButton*/}
            {/*       color={*/}
            {/*          isGraphicalLocatorActive ?*/}
            {/*              'secondary' : 'inherit'*/}
            {/*       }*/}
            {/*       className={classes.locatorButton}*/}
            {/*       raised="true"*/}
            {/*       onClick={*/}
            {/*          handleChangeGraphicalLocator*/}
            {/*       }*/}
            {/*   >*/}
            {/*      <HighlightAltIcon*/}
            {/*          className={classes.locator}*/}
            {/*      />*/}
            {/*   </IconButton>*/}
            {/*</Tooltip>*/}
        </>
    );
}

function EnhancedToolbar(props) {
    // active={orderBy === column.id}
    // direction={order}
    // onClick={handleSortOnClick}
    // onClick={createSortHandler(column.id)}
    const {
        classes,
        searchStateChange,
        ...rest
    } = props;

    const {
        searchState, VisualQueryManager,
        selected,
        isPlaying, handleChangePlaying, timeline, liveTimeline, isSelectable, isAutoLogActive, handleChangeAutoExpand,
        formHelperTextProps = {
            component: 'span',
            margin: 'dense',
        },
        searchDelay = 500,
        handleChangeGraphicalLocator,
        isGraphicalLocatorActive,
        getSortInfo,
        ...cRest
    } = useContext(PastebinContext);

    // console.log("EnhancedToolbar", {
    //     classes,
    //     searchStateChange,
    //     rest,
    //     searchState, VisualQueryManager,
    //     selected,
    //     isPlaying, handleChangePlaying, timeline, liveTimeline, isSelectable, isAutoLogActive, handleChangeAutoExpand,
    //     formHelperTextProps,
    //     searchDelay,
    //     handleChangeGraphicalLocator,
    //     isGraphicalLocatorActive,
    //     getSortInfo,
    //     cRest
    // });

    const {visualQuery, value, handleChangeValue, placeholder} = searchState;

    const numSelected = selected.length;
    const newEntries = liveTimeline.length - timeline.length;
    const playingIcon =
        isPlaying ? <PauseIcon/> : newEntries > 0 ?
            <Badge
                max={100}
                badgeContent={newEntries}
                color="secondary"
            >
                <PlayArrowIcon/>
            </Badge> : <PlayArrowIcon/>;
    const playingButton =
        <IconButton color="primary" onClick={handleChangePlaying}>
            {playingIcon}
        </IconButton>;

    useEffect(() => {
        searchStateChange(searchState)
    }, [searchState, searchStateChange]);


    const graphicalQuery = useMemo(() => (
            visualQuery?.length ?
                <Chip
                    label={
                        <>
                            {visualQuery.map(el => {
                                const query = [el];
                                const ids =
                                    VisualQueryManager.getVisualIdsFromRefs(query);
                                return (
                                    <GraphicalQuery
                                        key={JSON.stringify(ids)}
                                        outputRefs={query}
                                        visualIds={ids}
                                        selected={true}
                                    />)
                            })}</>}
                    onDelete={() => {
                        VisualQueryManager
                            .onChange(
                                visualQuery,
                                VisualQueryManager.getVisualIdsFromRefs(visualQuery),
                                'select'
                            );
                    }}
                />
                :
                <div
                    className={classes.textField}/>),
        [visualQuery, classes]
    );

    const InputProps = useMemo(() => ({
            autoComplete: 'off',
            classes: {root: classes.inputProps},
            startAdornment:
                (
                    <InputAdornment position="start">
                        <ResultsFilter {...{
                            classes,
                            isGraphicalLocatorActive,
                            handleChangeGraphicalLocator,
                            searchState,
                            getSortInfo
                        }} />
                        {graphicalQuery}
                    </InputAdornment>
                ),
            endAdornment: <InputEndAdornment
                {...{
                    classes,
                    searchState
                }}
            />
        })
        , [classes,
            isGraphicalLocatorActive,
            handleChangeGraphicalLocator,
            searchState,
            getSortInfo, graphicalQuery]);


    const searchValueRx = useMemo(() => (new BehaviorSubject('')), []);

    const [textValue, setTextValue] = useState(() => {
        searchValueRx.next(value);
        return value;
    });

    const onTextValueChange = useCallback((event) => {
        const textValue = event.target.value || '';
        setTextValue(textValue);
        searchValueRx.next(textValue);
    }, [searchValueRx]);

    useEffect(() => {
        setTextValue(value);
    }, [value]);

    useEffect(() => {
            const uns = searchValueRx.pipe(debounceTime(searchDelay)).subscribe(
                searchValue => {
                    handleChangeValue(searchValue);
                });
            return () => uns.unsubscribe();
        },
        [searchValueRx]
    );
    // mini-gradescope for labs,

    return (
        <>
            <div className={classes.itemCenter}>
                {/*{numSelected > 0 ? null : <>*/}
                {/*   <Tooltip*/}
                {/*      title={*/}
                {/*         isPlaying ? 'Pause Updates' : newEntries > 99 ?*/}
                {/*            `${newEntries} new updates` : 'Resume Updates'*/}
                {/*      }*/}
                {/*      placement={'bottom-end'}*/}
                {/*      enterDelay={300}*/}
                {/*   >*/}
                {/*      {playingButton}*/}
                {/*   </Tooltip>*/}
                {/*</>}*/}
                <div className={classes.title}>
                    {numSelected > 0 ? (
                        <Typography color="inherit" variant="subtitle1">
                            {numSelected} selected
                        </Typography>
                    ) : (
                        <TextField
                            fullWidth
                            margin="dense"
                            id="search"
                            placeholder={placeholder}
                            type="search"
                            className={classes.textField}
                            InputProps={InputProps}
                            FormHelperTextProps={formHelperTextProps}
                            value={textValue}
                            onChange={onTextValueChange}
                        />
                    )}
                </div>
                {/*<Tooltip*/}
                {/*   title={*/}
                {/*      isAutoLogActive ?*/}
                {/*         'Deactivate Live Expressions'*/}
                {/*         : 'Activate Live Expressions'*/}
                {/*   }*/}
                {/*   placement={'bottom-end'}*/}
                {/*   enterDelay={300}*/}
                {/*>*/}
                {/*   <IconButton color={isAutoLogActive ? "primary" : 'inherit'}*/}
                {/*               onClick={handleChangeAutoExpand}>*/}
                {/*      {isAutoLogActive ? <CenterFocusStrongIcon/> :*/}
                {/*         <CenterFocusWeakIcon/>}*/}
                {/*   </IconButton>*/}
                {/*</Tooltip>*/}
            </div>
            <div className={classes.actions}>
                {numSelected > 0 ? (
                    <>
                        <Tooltip title="Compare values">
                            <IconButton aria-label="Compare values">
                                <ChangeHistoryIcon/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="New Pin">
                            <IconButton aria-label="New Pin">
                                <CallSplitIcon/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Add to existing pin">
                            <IconButton aria-label="Add to existing pin">
                                <CallMergeIcon/>
                            </IconButton>
                        </Tooltip>
                    </>
                ) : (isSelectable ?
                        <Tooltip title="Filter list">
                            <IconButton aria-label="Filter list">
                                <FilterListIcon/>
                            </IconButton>
                        </Tooltip> : null
                )}
            </div>
        </>
    );
}

EnhancedToolbar.propTypes = {
    classes: PropTypes.object.isRequired,
    handleTotalChange: PropTypes.func,
    handleChangePlaying: PropTypes.func,
};

EnhancedToolbar.contexTypes = {
    selected: PropTypes.number.isRequired,
};

const TraceToolbar = withStyles(toolbarStyles)(EnhancedToolbar);
export default connect(mapStateToProps, mapDispatchToProps)(TraceToolbar);
