import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import debounce from 'lodash/debounce';
import {withStyles} from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import Badge from '@material-ui/core/Badge';
import Chip from '@material-ui/core/Chip';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import TuneIcon from '@material-ui/icons/Tune';
import ChangeHistoryIcon from '@material-ui/icons/ChangeHistory';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import CenterFocusStrongIcon from '@material-ui/icons/CenterFocusStrong';
import CenterFocusWeakIcon from '@material-ui/icons/CenterFocusWeak';
import PauseIcon from '@material-ui/icons/Pause';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CallMergeIcon from '@material-ui/icons/CallMerge';
import CallSplitIcon from '@material-ui/icons/CallSplit';
import FilterListIcon from '@material-ui/icons/FilterList';
import {lighten} from '@material-ui/core/styles/colorManipulator';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';

import {PastebinContext, VisualQueryManager} from '../containers/Pastebin';
import GraphicalQuery from '../components/GraphicalQuery';
import {searchStateChange} from '../redux/modules/pastebin';

const {getVisualIdsFromRefs} = VisualQueryManager;

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
        height: '3em',
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

const handleChangeExpand = debounce((setExpanded, expanded) => {
    setExpanded(expanded);
}, 300);


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
    const [expanded, setExpanded] = React.useState(false);
    const {isCase, isWord, isRegExp, handleFilterClick} = searchState;

    const avatarClasses = {
        root: classes.chipRoot, // class name, e.g. `classes-root-x`
        avatar: classes.chipAvatar, // class name, e.g. `classes-label-x`
        label: classes.chipLabel,
    };
    const hasSelected = isCase || isWord || isRegExp;
    return (
        <InputAdornment>
                <span className={classes.chipArray}
                      onMouseEnter={
                          () => handleChangeExpand(setExpanded, true)
                      }
                      onMouseLeave={
                          () => handleChangeExpand(setExpanded, false)
                      }
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

function ResultsFilter(props) {
    const {
        classes, searchState, getSortInfo
    } = props;
    const {
        isFunctions, isExpressions, isValues, handleFilterClick
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
            <Tooltip
                title={"Include Functions"}
            >
                <Chip
                    label="f(x)"
                    onClick={() => handleFilterClick('isFunctions')}
                    classes={avatarClasses}
                    avatar={isFunctions ? <Avatar><CheckBoxIcon/></Avatar> :
                        <Avatar><CheckBoxOutlineBlankIcon/></Avatar>}
                />
            </Tooltip>
            <Tooltip
                title={"Include Expressions"}
            >
                <Chip
                    label="x=y"
                    onClick={() => handleFilterClick('isExpressions')}
                    classes={avatarClasses}
                    avatar={isExpressions ? <Avatar><CheckBoxIcon/></Avatar> :
                        <Avatar><CheckBoxOutlineBlankIcon/></Avatar>}
                />
            </Tooltip>
            <Tooltip
                title={"Include Values"}
            >
                <Chip
                    label="{...}"
                    onClick={() => handleFilterClick('isValues')}
                    classes={avatarClasses}
                    avatar={
                        isValues ? <Avatar><CheckBoxIcon/></Avatar> :
                            <Avatar><CheckBoxOutlineBlankIcon/></Avatar>
                    }
                />
            </Tooltip>
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
        selected,
        isPlaying, handleChangePlaying, timeline, liveTimeline,
        searchState, isSelectable, isAutoLogActive, handleChangeAutoExpand,
        searchStateChange
    } = props;
    const numSelected = selected.length;
    const newEntries = liveTimeline.length - timeline.length;
    const playingIcon =
        isPlaying ? <PauseIcon/> : newEntries ?
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

    React.useEffect(() => {
        searchStateChange(searchState)
    }, [searchState, searchStateChange]);

    const graphicalQuery = (searchState.visualQuery
    && searchState.visualQuery.length ?
        <Chip
            label={
                <>
                    {searchState.visualQuery.map(el => {
                        const query = [el];
                        const ids = getVisualIdsFromRefs(query);
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
                        searchState.visualQuery,
                        getVisualIdsFromRefs(searchState.visualQuery),
                        'select'
                    );
            }}
        />
        :
        <div
            className={classes.textField}/>);

    return (
        <>
            <div className={classes.itemCenter}>
                {numSelected > 0 ? null : <>
                    <Tooltip
                        title={isPlaying ? 'Pause Updates' : newEntries > 99 ? `${newEntries} new updates` : 'Resume Updates'}
                        placement={'bottom-end'}
                        enterDelay={300}
                    >
                        {playingButton}
                    </Tooltip>
                </>}
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
                            label={null}
                            placeholder="Search in trace, ex: color:blue"
                            type="search"
                            className={classes.textField}
                            InputProps={{
                                classes: {root: classes.inputProps},
                                startAdornment:
                                    (
                                        <InputAdornment>
                                            <ResultsFilter {...props} />
                                            {graphicalQuery}
                                        </InputAdornment>
                                    ),
                                endAdornment: <InputEndAdornment
                                    {...{
                                        classes,
                                        searchState
                                    }}
                                />
                            }}
                            FormHelperTextProps={{
                                component: 'span',
                                margin: 'dense',
                            }}
                            value={searchState.value}
                            onChange={searchState.handleChangeValue}
                        />
                    )}
                </div>
                <Tooltip
                    title={isAutoLogActive ? 'Deactivate Live Expressions' : 'Activate Live Expressions'}
                    placement={'bottom-end'}
                    enterDelay={300}
                >
                    <IconButton color={isAutoLogActive ? "primary" : 'inherit'}
                                onClick={handleChangeAutoExpand}>
                        {isAutoLogActive ? <CenterFocusStrongIcon/> :
                            <CenterFocusWeakIcon/>}
                    </IconButton>
                </Tooltip>
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

const EnhancedToolbarWithContext = props => (
    <PastebinContext.Consumer>
        {(context) => {
            return <EnhancedToolbar {...props} {...context}/>
        }}
    </PastebinContext.Consumer>
);
const TraceToolbar = withStyles(toolbarStyles)(EnhancedToolbarWithContext);
export default connect(mapStateToProps, mapDispatchToProps)(TraceToolbar);
