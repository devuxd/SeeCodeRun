import 'react-resizable/css/styles.css';
import React, {createContext, createRef, PureComponent} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';
import {Responsive} from 'react-grid-layout';
import {darken, hexToRgb, withStyles} from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import DragHandleIcon from '@material-ui/icons/DragHandle';
import Drawer from '@material-ui/core/Drawer';
import TvIcon from '@material-ui/icons/Tv';
import LanguageHtml5Icon from 'mdi-material-ui/LanguageHtml5';
import LanguageJavaScriptIcon from 'mdi-material-ui/LanguageJavascript';
import LanguageCss3Icon from 'mdi-material-ui/LanguageCss3';
import HighlightAltIcon from '@material-ui/icons/HighlightAlt';
import SortAscendingIcon from 'mdi-material-ui/SortAscending';
import SortDescendingIcon from 'mdi-material-ui/SortDescending';
import SortAlphabeticalAscendingIcon
    from 'mdi-material-ui/SortAlphabeticalAscending';
import SortAlphabeticalDescendingIcon
    from 'mdi-material-ui/SortAlphabeticalDescending';
import SortNumericAscendingIcon from 'mdi-material-ui/SortNumericAscending';
import SortNumericDescendingIcon from 'mdi-material-ui/SortNumericDescending';
import JSAN from 'jsan';

import {configureFindChunks, functionLikeExpressions} from '../utils/scrUtils';
import {VisualQueryManager} from '../seecoderun/modules/VisualQueryManager';

import Editor from './Editor';
import Playground from './Playground';
import SizeProvider from '../utils/SizeProvider';
import {configureDefaultGridLayoutFormatter} from '../utils/reactGridLayoutUtils';
import {
    configureDefaultGridLayoutFormatter
        as configureDefaultGridLayoutCompactFormatter
} from '../utils/reactGridLayoutCompactUtils';
import DebugContainer from '../components/DebugContainer';
import TraceControls from '../components/TraceControls';
import PointOfView, {createPointOfViewTile} from '../components/PointOfView';

const isDebug = false;

export const TimeoutDelay = {
    NOW: 0,
    FAST: 10,
    NORMAL: 100,
    SLOW: 1000,
};
export const TABLE_ROW_HEIGHT = 22;
export const PastebinContext = createContext({});

export const d = {
    //Matches PointOfView.createPointOfViewTile(...)
    log: (
        id, expressionText, expressionLanguage = 'typescript',
        fromData, toData, dataLanguage = 'json',
    ) => {
    },
};

const defaultSearchPlaceholderGreet = 'Search in trace,';
const defaultSearchPlaceholder = `${defaultSearchPlaceholderGreet} color:blue`;
let isCompact = true;
let gridLayoutFormatter = isCompact ?
    configureDefaultGridLayoutCompactFormatter()
    : configureDefaultGridLayoutFormatter();

const animationId = `scr-a-id-${Date.now()}`;

const CONFIGURE_PASTEBIN_LAYOUT = 'CONFIGURE_PASTEBIN_LAYOUT';

export const pastebinConfigureLayout =
    (restoreGridLayouts, getCurrentGridLayouts) => {
        return {
            type: CONFIGURE_PASTEBIN_LAYOUT,
            restoreGridLayouts,
            getCurrentGridLayouts,
        };
    };

const mapDispatchToProps = {pastebinConfigureLayout};


const sortOptions = [
    {
        time: true,
        desc: true,
        Icon: SortDescendingIcon,
    },
    {
        time: true,
        asc: true,
        Icon: SortAscendingIcon,

    },
    {
        expression: true,
        desc: true,
        Icon: SortAlphabeticalDescendingIcon,
    },
    {
        expression: true,
        asc: true,
        Icon: SortAlphabeticalAscendingIcon,

    },
    {
        value: true,
        desc: true,
        Icon: SortNumericDescendingIcon,
    },
    {
        value: true,
        asc: true,
        Icon: SortNumericAscendingIcon,

    }
];

const getSortIcon = (orderBy, orderFlow) => (
    (sortOptions[
        sortOptions.findIndex(
            sortOption => sortOption[orderBy] && sortOption[orderFlow]
        )
        ] || {}).Icon
);

const getNextSortOption = (orderBy, orderFlow) => (
    sortOptions[(
        sortOptions.findIndex(
            sortOption => sortOption[orderBy] && sortOption[orderFlow]
        )
        + 1
    ) % sortOptions.length] // returns first sort option  if not found
);

const styles = theme => ({
    '@global': {
        ".react-grid-layout": {
            position: "relative",
            transition: "height 200ms ease",
        },
        ".react-grid-item": {
            transition: "all 200ms ease",
            transitionProperty: "left, top",
        },
        ".react-grid-item.cssTransforms": {
            transitionProperty: "transform",
        },
        ".react-grid-item.resizing": {
            zIndex: 1,
            willChange: "width, height",
        },
        ".react-grid-item.react-draggable-dragging": {
            transition: "none",
            zIndex: 3,
            willChange: "transform",
        },
        ".react-grid-item > .react-resizable-handle": {
            position: "absolute",
            width: "5px",
            height: "100%",
            bottom: "0",
            right: "0",
            marginRight: "-6px",
            cursor: "ew-resize",
            background: "transparent",
            zIndex: 9999,
        },
        ".react-grid-item > .react-resizable-handle::after": {
            content: '""',
            position: "absolute",
            right: "4px",
            bottom: "4px",
            marginRight: "6px",
            width: "24px",
            height: "24px",
            background: `url(\'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="${
                hexToRgb(theme.palette.primary.main)
            }" d="M22,22H20V20H22V22M22,18H20V16H22V18M18,22H16V20H18V22M18,18H16V16H18V18M14,22H12V20H14V22M22,14H20V12H22V14Z" /></svg>\')`,
            cursor: "se-resize",
        },
        ".react-grid-item.react-grid-placeholder": {
            background: theme.palette.primary.main,
            opacity: 0.2,
            transitionDuration: "100ms",
            zIndex: 2,
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
            OUserSelect: "none",
            userSelect: "none",
        },
    },
    draggable: {
        position: 'absolute',
        zIndex: theme.zIndex.snackbar,
        bottom: 0,
        right: theme.spacing(4),
        color: theme.palette.primary.main,
        fontSize: theme.spacing(2),
        cursor: 'grab',
        '&:active': {
            cursor: 'grabbing',
        }
    },
    [`@keyframes ${animationId}`]: {
        to: {
            visibility: 'visible',
        },
        from: {
            visibility: 'hidden',
        }
    },
    loadingFeedback: {
        position: 'absolute',
        bottom: theme.spacing(1),
        left: '50%',
        color: theme.palette.secondary.main,
        visibility: 'hidden',
        animation: `${animationId} 1s linear 1s infinite alternate`,
    },
    layout: {
        overflow: 'visible',
    },
    button: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        float: 'right',
        margin: theme.spacing(1),
    },
    icon: {
        position: 'absolute',
        zIndex: theme.zIndex.snackbar,
        right: theme.spacing(0.5),
        top: theme.spacing(0.25),
        color: darken(theme.palette.action.disabled, 0.5),
        fontSize: theme.spacing(3),
    },
    locatorButton: {
        position: 'absolute',
        zIndex: theme.zIndex.snackbar,
        bottom: theme.spacing(4),
        right: 0,
    },
    locator: {
        fontSize: theme.spacing(2.5),
    },
});


class Pastebin extends PureComponent {
    debouncedOnDebugContainerResizeEnd = debounce(() => {
        this.handleChangeDebugLoading(false);
    }, 50);
    firstNotNullCaseId = -1;

    onGridResize = (isResizing) => this.resizeListener?.(isResizing);

    handleChangeDebugLoading = (isLoading) => {
        this.setState({isDebugLoading: isLoading});
    };

    getCurrentGridLayouts = () => {
        return gridLayoutFormatter.currentGridLayouts;
    };
    firstNotNullCaseEntry = null;
    prevLiveExpressionStoreIsNew = false;
    handleChangePlaying = debounce((id, play) => {
        this.setState((prevState) => {
            let {
                isPlaying, lastHandleChangePlayingId
            } = prevState;
            const {
                orderBy,
                order,
                timeline,
                liveTimeline,
                logs,
                liveLogs,
            } = prevState;

            if (id === 'table') {
                if (!isPlaying && !lastHandleChangePlayingId) {
                    return;
                }

                if (play) {
                    lastHandleChangePlayingId = null;
                    isPlaying = false;
                } else {
                    lastHandleChangePlayingId = id;
                    isPlaying = true;
                }

            }
            let currentTimeline = isPlaying ? timeline : liveTimeline;
            let currentLogs = isPlaying ? logs : liveLogs;
            const data = this.createData(currentTimeline);
            const logData = this.createLogData(currentLogs);
            const sortedData =
                orderBy === 'time' && order === 'desc' ? data
                    : this.sortData(data, orderBy, order);

            return {
                isPlaying: !isPlaying,
                lastHandleChangePlayingId,
                timeline: currentTimeline,
                logs: currentLogs,
                data: sortedData,
                logData
            };
        });
    }, 100);

    constructor(props) {
        super(props);
        this.gridRef = createRef();
        this.setUpdateMonacoEditorLayouts = {};
        this.updateMonacoEditorLayouts = {};
        this.debugScrollerRefSnapshots = {};
        VisualQueryManager.onChange = this.onVisualQueryChange;
        d.log = this.handleChangePointOfViewTiles;
        this.textInLocCacheResetThreshold = 1000;
        this.cleanEditorTextInLocCache();
    }

    //layout: Layout, oldItem: LayoutItem, newItem: LayoutItem,
    // placeholder: LayoutItem, e: MouseEvent, element: HTMLElement
    onResizeStart = (layout, oldItem, newItem,
                     placeholder, e, element) => {
        // gridLayoutFormatter.formatLayout(layout, oldItem, newItem);
        this.onGridResize(true);
    };

    onVisualQueryChange = (newVisualQuery = [], visualIds, action) => {
        this.setState(({searchState = {}}) => {
            let {visualQueryPreview = [], visualQuery = []} = searchState;
            switch (action) {
                case 'select':
                    const newQuery = [...visualQuery, ...newVisualQuery];
                    visualQuery = newQuery.filter(
                        (el, i) => (
                            !(newVisualQuery.indexOf(el) >= 0
                                && visualQuery.indexOf(el) >= 0)
                        )
                    );
                    break;
                case 'preview':
                    visualQueryPreview = newVisualQuery === visualQueryPreview ?
                        []
                        : newVisualQuery;
                    break;
                default:
                    console.warn(
                        "Unknown onVisualQueryChange action", action
                    );
            }

            searchState = {
                ...searchState,
                visualQuery,
                visualQueryPreview,
            };

            setTimeout(() => {
                this.setState(state => {
                    const {
                        orderBy,
                        order,
                        timeline,
                        getEditorTextInLoc
                    } = state;

                    const defaultData = this.createData(timeline);
                    const data = orderBy === 'time' && order === 'desc' ?
                        defaultData
                        : this.sortData(defaultData, orderBy, order);

                    return {
                        data,
                    };
                });

            }, TimeoutDelay.NOW);

            return {
                searchState
            }
        });
    };

    onResize = (layout, oldItem, newItem
                /*, placeholder, e, element*/) => {
        gridLayoutFormatter.formatLayout(layout, oldItem, newItem);
        this.handleAutomaticLayoutThrottled();
    };

    setResizeListener = resizeListener => (
        this.resizeListener = resizeListener
    );

    onResizeStop = (layout, oldItem, newItem
                    /*, placeholder, e, element*/) => {
        gridLayoutFormatter.formatLayout(layout, oldItem, newItem);
        // if (newItem.i === 'debugContainer') {
        this.onDebugContainerResizeEnd(false);
        // }
        this.handleAutomaticLayoutDebounced();
        this.onGridResize(false);
    };

    formatDrag = layout => {
        gridLayoutFormatter.layoutDragPositionInvariant(layout);
    };

    onDragStart = itemCallback => {
        this.formatDrag(itemCallback);
    };
    onDrag = itemCallback => {
        this.formatDrag(itemCallback);
    };
    onDragStop = itemCallback => {
        this.formatDrag(itemCallback);
    };

    onLayoutChange = (newLayout, newGridLayouts) => {
        gridLayoutFormatter.currentGridLayouts = newGridLayouts;
        this.handleAutomaticLayoutDebounced();
    };

    onBreakpointChange = (newBreakpoint /*, newCols*/) => {
        gridLayoutFormatter.onBreakpointChange(newBreakpoint);
        this.handleAutomaticLayoutDebounced();
    };

    handleChangeTimeFlow = (event, property, order) => {
        this.setState((prevState) => {
            let {timeFlow, data, logData} = prevState;
            const orderBy = 'time';
            if (!order) {
                order = timeFlow;
                if (prevState.orderBy === orderBy) {
                    if (timeFlow === 'desc') {
                        order = 'asc';
                        timeFlow = order;
                    } else {
                        order = 'desc';
                        timeFlow = order;
                    }
                }
            } else {
                timeFlow = order;
            }

            data = this.sortData(data, orderBy, order);
            logData = this.sortData(logData, orderBy, order);
            return {data, logData, order, orderBy, timeFlow};
        });
    };

    handleRequestSort = (event, orderBy, order) => {
        this.setState((prevState) => {
            let {data, logData} = prevState;
            if (!order) {
                order = 'desc';
                if (prevState.orderBy === orderBy &&
                    prevState.order === 'desc') {
                    order = 'asc';
                }
            }

            data = this.sortData(data, orderBy, order);
            logData = this.sortData(logData, orderBy, order);
            return {data, logData, order, orderBy};
        });
    };

    restoreGridLayouts = gridLayouts => {
        gridLayouts = gridLayoutFormatter.validateLayout(
            gridLayouts, gridLayoutFormatter.currentBreakPoint
        );
        this.setState({gridLayouts});
        gridLayoutFormatter.currentGridLayouts = gridLayouts;
        this.onDebugContainerResizeEnd(false);
    };

    sortData = (data, orderBy, order) => {
        return order === 'desc' ?
            data.sort((a, b) => (b[orderBy] < a[orderBy] ? -1 : 1))
            : data.sort((a, b) => (a[orderBy] < b[orderBy] ? -1 : 1));
    };

    handleSelectAllClick = (event, checked) => {
        if (checked) {
            this.setState({selected: this.state.data.map(n => n.id)});
            return;
        }
        this.setState({selected: []});
    };

    handleSelectClick = (event, id) => {
        const {selected} = this.state;
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }

        this.setState({selected: newSelected});
    };


    isSelected = id => this.state.selected.indexOf(id) !== -1;

    resetGridLayout = layout => {
        this.restoreGridLayouts(gridLayoutFormatter.getLayoutDummy(layout));
        setTimeout(() => {
            this.restoreGridLayouts(
                layout || gridLayoutFormatter.getDefaultGridLayouts()
            );
        }, TimeoutDelay.NOW);

    };

    onDebugContainerResizeEnd = (isUpdate) => {
        this.handleChangeDebugLoading(true);
        this.debouncedOnDebugContainerResizeEnd(isUpdate);
    };

    handleAutomaticLayout = () => {
        if (this.props.disableGridAutomaticEditorLayout) {
            return;
        }
        for (const editorId in this.updateMonacoEditorLayouts) {
            this.updateMonacoEditorLayouts[editorId]
            && this.updateMonacoEditorLayouts[editorId]();
        }
    };

    handleAutomaticLayoutThrottled =
        throttle(() => this.handleAutomaticLayout(), 250);
    handleAutomaticLayoutDebounced =
        debounce(() => this.handleAutomaticLayout(), 250);

    getSortInfo = () => {
        const {order, orderBy, timeFlow} = this.state;
        const orderFlow = orderBy === 'time' ?
            timeFlow : order;
        return {
            handleGetNextSortOption: event => {
                const orderFlow = orderBy === 'time' ? timeFlow : order;
                const nextOptions = getNextSortOption(
                    orderBy,
                    orderFlow
                );
                const nextOptionsKeys = Object.keys(
                    nextOptions
                );

                if (nextOptions.time) {
                    this.handleChangeTimeFlow(event, ...nextOptionsKeys);
                } else {
                    this.handleRequestSort(event, ...nextOptionsKeys);
                }
            },
            SortIcon: getSortIcon(orderBy, orderFlow),
            sortTitle: `Order by ${
                orderBy
            } ${
                orderFlow === 'desc' ?
                    'descending' : 'ascending'
            }`
        };
    };

    timelineSearchFilter = entry => {
        const {searchState} = this.state;
        return (entry.isError || !searchState.visualQuery?.length) ||
            (entry.isOutput && searchState.visualQuery.find(
                    q => entry.outputRefs?.includes(q)
                )
            )
    };

    cleanEditorTextInLocCache = () => {
        if (!this.textInLocCacheResetCounter) {
            this.textInLocCache = {};
            this.textInLocCacheResetCounter = this.textInLocCacheResetThreshold;
        }
        this.textInLocCacheResetCounter--;
    }

    getEditorTextInLoc = () => {
        console.warn("Monaco editor's must replace this placeholder");
        return '';
    }

    getEditorTextInLocCache = (id, loc) => {
        const {textInLocCache, getEditorTextInLoc} = this;

        if (!textInLocCache[id] || textInLocCache[id].loc !== loc) {
            textInLocCache[id] = {
                loc,
                text: getEditorTextInLoc(loc),
            };
        }
        return textInLocCache[id].text;
    };

    createData(
        timeline
    ) {
        return (timeline || []).filter(
            this.timelineSearchFilter
        ).map((entry, i) => ({
            id: entry.reactKey,
            time: entry.i,
            // time: entry.timestamp,
            expression: this.getEditorTextInLocCache(entry.id, entry.loc),
            value: entry.data,
            loc: {...entry.loc},
            expressionId: entry.id,
            entry: entry,
            isError: entry.isError,
            isGraphical: entry.isDOM,
            funcRefId: entry.funcRefId,
            dataRefId: entry.dataRefId,
        }));
    }

    createLogData(log) {
        return (log || []).map((entry, i) => {
            if (entry.isLog) {
                return {
                    id: entry.reactKey,
                    time: entry.i,
                    // time: entry.timestamp,
                    expression:
                        this.getEditorTextInLocCache(entry.id, entry.loc),
                    value: entry.data,
                    loc: {...entry.loc},
                    expressionId: entry.id,
                    entry: entry,
                    isError: entry.isError,
                    isGraphical: entry.isDOM,
                    funcRefId: entry.funcRefId,
                    dataRefId: entry.dataRefId,
                }
            } else {
                return {
                    id: entry.reactKey,
                    time: entry.i,
                    // time: entry.timestamp,
                    isFromInput: true,
                    value: entry.data,
                    entry: entry,
                    isResult: entry.isResult,
                    isError: entry.isError,
                }
            }
        });
    }

    findSearchPlaceholderExample = (sortedData) => {
        let {searchState} = this.state;

        if (this.firstNotNullCaseEntry) {
            this.firstNotNullCaseId =
                sortedData.indexOf(this.firstNotNullCaseEntry);
        }

        if (this.firstNotNullCaseId < 0) {

            this.firstNotNullCaseId = sortedData.findIndex(
                (entry) => {
                    const noExpressionMatchesVarDefiniton =
                        entry?.expression?.match(
                            /[let|const|var]\s+/
                        ) === null;
                    const value = JSAN.parse(entry.value);
                    const isInvalidValue = value === null;
                    // (!value && value !== false && value !== 0);
                    return (
                        noExpressionMatchesVarDefiniton &&
                        isInvalidValue
                    );
                }
            );
        }

        if (this.firstNotNullCaseId > -1) {
            this.firstNotNullCaseEntry =
                sortedData[this.firstNotNullCaseId];
        }

        if (this.firstNotNullCaseEntry) {
            const {expression = ''} = this.firstNotNullCaseEntry;
            const placeholder = `${
                defaultSearchPlaceholderGreet
            } ${expression.split(/[^\w+]|null/)[0]} null`;
            searchState = {...searchState, placeholder};
        }
        return searchState;
    };

    liveExpressionStoreChange = (
        traceSubscriber, timeline, logs, isNew, HighlightTypes,
        highlightSingleText, highlightErrors,
        setCursorToLocation, getEditorTextInLoc, colorizeDomElement,
        objectNodeRenderer, handleChange
    ) => {
        this.getEditorTextInLoc = getEditorTextInLoc;
        isNew && !timeline.length && this.cleanEditorTextInLocCache();

        const {orderBy, order, isPlaying} = this.state;
        isPlaying && this.handleChangeDebugLoading(true);

        this.prevLiveExpressionStoreIsNew && clearTimeout(
            this.liveExpressionStoreChangeTimeout
        );
        this.prevLiveExpressionStoreIsNew = isNew;

        this.liveExpressionStoreChangeTimeout = setTimeout(() => {
            if (isPlaying || isNew) {
                let currentTimeline = isPlaying ?
                    timeline : this.state.timeline;
                let currentLogs = isPlaying ? logs : this.state.logs;
                const data = this.createData(currentTimeline);
                const logData = this.createLogData(currentLogs);

                const sortedData = this.sortData(data, orderBy, order);
                const sortedLogData = this.sortData(
                    logData, orderBy, order
                );

                const searchState = this.findSearchPlaceholderExample(
                    sortedData
                );

                const configureMappingEventListeners = (n) => {
                    let onMouseEnter = null, onMouseLeave = null,
                        onClick = null;
                    if (!n.isFromInput) {
                        onMouseEnter = () =>
                            highlightSingleText(
                                n.loc, n.isError ? HighlightTypes.error
                                    : n.isGraphical ?
                                        HighlightTypes.graphical
                                        : HighlightTypes.text,
                                traceSubscriber.getMatches(
                                    n.funcRefId,
                                    n.dataRefId,
                                    n.entry.calleeId
                                )
                            )
                        onMouseLeave = () => highlightSingleText();
                        onClick = () => setCursorToLocation(n.loc)
                    }
                    return {onMouseEnter, onMouseLeave, onClick};
                };
                this.setState((prevState) => ({
                    searchState,
                    isNew,
                    isPlaying: isNew ? true : prevState.isPlaying,
                    traceSubscriber,
                    timeline: currentTimeline,
                    liveTimeline: timeline,
                    logs: currentLogs,
                    liveLogs: logs,
                    data: sortedData,
                    logData: sortedLogData,
                    HighlightTypes,
                    highlightSingleText,
                    highlightErrors,
                    setCursorToLocation,
                    colorizeDomElement,
                    objectNodeRenderer,
                    handleChange,
                    configureMappingEventListeners
                }));
                this.handleChangeDebugLoading(false);
            } else {
                this.setState({
                    liveTimeline: timeline,
                    liveLogs: logs,
                    isNew
                });
            }
        }, isNew ? TimeoutDelay.NOW : TimeoutDelay.NORMAL);
    };

    handleChangeTab = (event, tabIndex) => {
        if (tabIndex) {
            this.setState({tabIndex});
        }
    };

    handleChangeSearchValue = value => {
        this.setState(prevState => ({
            searchState: {...prevState.searchState, value}
        }));
    };

    handleChangeSearchFilterClick = (filter) => {
        const {searchState} = this.state;
        const nextSearchState = {
            ...searchState,
            [filter]: !searchState[filter]
        };
        if (nextSearchState.isWord && nextSearchState.isRegExp) {
            if (filter === 'isWord') {
                nextSearchState.isRegExp = false;
            } else {
                nextSearchState.isWord = false;
            }
        }

        const hasFilter = nextSearchState.isFunctions
            || nextSearchState.isExpressions || nextSearchState.isValues;

        if (!hasFilter) {
            if (filter === 'isFunctions'
                || filter === 'isExpressions'
                || filter === 'isValues') {
                nextSearchState[filter] = true;
            } else {
                nextSearchState.isFunctions = true;
            }
        }

        nextSearchState.findChunks = configureFindChunks(
            !nextSearchState.isRegExp,
            nextSearchState.isCase,
            nextSearchState.isWord
        );
        this.setState({searchState: nextSearchState});
    };

    handleChangeAutoExpand = () => {
        this.setState(
            prevState => ({isAutoLogActive: !prevState.isAutoLogActive})
        );
    };

    matchesFilterConsole = (data) => {
        const {searchState} = this.state;
        const {value, findChunks, isWord, isRegExp} = searchState;
        const _findChunks = (textToHighlight) => {
            const searchWords = isWord || isRegExp ?
                [value] : value.split(' ');
            return findChunks({
                searchWords,
                textToHighlight
            })
        };
        const result = {
            found: false,
            functions: [],
            expressions: [],
            values: [],
        };

        const isAnyText = !value.trim().length;

        if (isAnyText) {
            result.found = true;
            return result;
        }

        result.values = _findChunks(data.expression);
        result.found = !!result.values.length;

        if (!result.found) {
            result.values = _findChunks(data.value);
            result.found = !!result.values.length;
        }

        return result;
    };

    matchesFilterTrace = (data) => {
        const {searchState} = this.state;
        const {
            value,
            findChunks: _findChunks,
            isWord,
            isRegExp,
            isFunctions,
            isExpressions,
            isValues,
            functionLikeExpressions,
        } = searchState;
        const searchWords = isWord || isRegExp ? [value] :
            value.split(' ').filter(v => v.trim().length);
        const findChunks = (textToHighlight) => {
            return _findChunks(
                {searchWords, textToHighlight}
            );
        };
        const andFindChunks =
            (textToHighlight) => searchWords.reduce(
                (acc, word) => {
                    acc.push({
                        word,
                        chunks: _findChunks(
                            {
                                searchWords: [word],
                                textToHighlight
                            }
                        )
                    })
                    return acc;
                }
                , []
            );

        const isAndFind = (
            wordChunks
        ) => !(wordChunks.findIndex(wordChunk => !wordChunk.chunks.length) > -1);

        const result = {
            found: false,
            functions: [],
            expressions: [],
            values: [],
            expressionChunks: [],
            isCodeMatch: false,
            isStateMatch: false,
        };

        const hasFilters = isFunctions || isExpressions || isValues;

        const isAnyText = !value.trim().length;

        if (isAnyText && !hasFilters) {
            result.found = true;
            return result;
        }

        if (isFunctions && functionLikeExpressions.includes(
            data.entry.expressionType
        )) {
            result.functions = isAnyText ? [] : findChunks(data.expression);
            result.isCodeMatch = !!result.functions.length;
        }

        if (isExpressions &&
            !functionLikeExpressions.includes(data.entry.expressionType)
        ) {
            result.expressions = isAnyText ? [] : findChunks(data.expression);
            result.isCodeMatch = result.isCodeMatch
                || !!result.expressions.length;
        }

        if (isValues) {
            result.values = isAnyText ? [] : findChunks(data.value);
            result.isStateMatch = !!result.values.length;
        }

        result.expressionChunks = result.functions.concat(
            result.expressions
        );

        if ((isFunctions || isExpressions) && isValues) {
            result.found =
                isAnyText
                || isAndFind(
                andFindChunks(data.expression + ' ' + data.value)
                );

        } else {
            result.found =
                isAnyText
                || (result.isCodeMatch || result.isStateMatch);
        }

        return result;
    };

    state = {
        VisualQueryManager,
        gridLayouts: gridLayoutFormatter.getDefaultGridLayouts(),
        traceAvailable: true,
        autorunDelay: 2000,
        isDebugLoading: false,
        isSelectable: false,
        tabIndex: 'trace',
        order: 'desc',
        orderBy: 'time',
        selected: [],
        data: [],
        logData: [],
        page: 0,
        rowsPerPage: 10,
        minRows: 10,
        defaultRowsPerPage: 10,
        rowsPerPageIncrement: 100,
        timeline: [],
        logs: [],
        liveTimeline: [],
        liveLogs: [],
        isPlaying: true,
        timeFlow: 'desc',
        isAutoLogActive: true,
        width: 800,
        height: 600,
        hoveredCellKey: null,
        isGraphicalLocatorActive: false,
        pointOfViewTiles: [],
        liveExpressionStoreChange: this.liveExpressionStoreChange,
        handleChangeDebugLoading: this.handleChangeDebugLoading,
        handleSelectClick: this.handleSelectClick,
        handleSelectAllClick: this.handleSelectAllClick,
        handleRequestSort: this.handleRequestSort,
        isRowSelected: this.isSelected,
        handleChangePlaying: this.handleChangePlaying,
        getSortInfo: this.getSortInfo,
        handleChangeTimeFlow: this.handleChangeTimeFlow,
        handleChangeAutoExpand: this.handleChangeAutoExpand,
        highlightSingleText: () => {
        },
        colorizeDomElement: () => {
        },
        configureMappingEventListeners: () => () => {
        },
        searchState: {
            placeholder: defaultSearchPlaceholder,
            disableMultiWord: false,
            isFunctions: true,
            isExpressions: true,
            isValues: true,
            isCase: false,
            isWord: false,
            isRegExp: false,
            visualQuery: [],
            visualKey: null,
            value: '',
            handleChangeValue: this.handleChangeSearchValue,
            handleFilterClick: this.handleChangeSearchFilterClick,
            matchesFilterTrace: this.matchesFilterTrace,
            matchesFilterConsole: this.matchesFilterConsole,
            findChunks: configureFindChunks(true),
            functionLikeExpressions: functionLikeExpressions,
        },
    };

    handleChangePointOfViewTiles = (...params) => {
        if (params.length) {
            this.setState(
                prevState => ({
                    pointOfViewTiles: [
                        ...prevState.pointOfViewTiles,
                        createPointOfViewTile(...params)
                    ]
                }));
        } else {
            this.setState({pointOfViewTiles: []});
        }
    };


    handleChangeAutorunDelay = autorunDelay => this.setState({
        autorunDelay: autorunDelay ? parseInt(autorunDelay, 10) : 0
    });

    updateMonacoEditorLayout = (editorId) => {
        if (!this.setUpdateMonacoEditorLayouts[editorId]) {
            this.setUpdateMonacoEditorLayouts[editorId] =
                (monacoEditorLayout) => {
                    this.updateMonacoEditorLayouts[editorId] =
                        monacoEditorLayout;
                }
        }
        return this.setUpdateMonacoEditorLayouts[editorId];
    };

    handleChangeHoveredCellKey = (event, hoveredCellKey) => {
        this.setState({hoveredCellKey});
    }

    handleChangeGraphicalLocator = () => this.setState(
        prevState => {
            const isGraphicalLocatorActive =
                !prevState.isGraphicalLocatorActive;
            const searchState = {...prevState.searchState};
            if (isGraphicalLocatorActive) {
                searchState.isExpressionsTemp = searchState.isExpressions;
                searchState.isExpressions = true;
            } else {
                searchState.visualQuery = [];
                searchState.visualId = null;
                searchState.isExpressions = searchState.isExpressionsTemp;
            }
            return {
                isGraphicalLocatorActive,
                searchState
            }
        });

    handleChangeEnterCellScriptContainer =
        event => this.handleChangeHoveredCellKey(
            event, 'scriptContainer'
        );
    handleChangeLeaveCellScriptContainer =
        event => this.handleChangeHoveredCellKey(event, null);
    handleChangeEnterCellHtmlContainer =
        event => this.handleChangeHoveredCellKey(
            event, 'htmlContainer'
        );
    handleChangeLeaveCellHtmlContainer =
        event => this.handleChangeHoveredCellKey(event, null)
    handleChangeEnterCellCssContainer =
        event => this.handleChangeHoveredCellKey(
            event, 'cssContainer'
        );
    handleChangeLeaveCellCssContainer =
        event => this.handleChangeHoveredCellKey(event, null);
    handleChangeEnterCellDebugContainer =
        event => this.handleChangeHoveredCellKey(
            event, 'debugContainer'
        );
    handleChangeLeaveCellDebugContainer =
        event => this.handleChangeHoveredCellKey(event, null);
    handleChangeEnterCellPlaygroundContainer =
        event => this.handleChangeHoveredCellKey(
            event, 'playgroundContainer'
        );
    handleChangeLeaveCellPlaygroundContainer =
        event => this.handleChangeHoveredCellKey(event, null);

    render() {
        const {
            appClasses, classes, appStyle, editorIds, TopNavigationBarComponent,
            isTopNavigationToggled,
            width,
            height,
        } = this.props;
        const {
            gridLayouts,
            isDebugLoading,
            tabIndex,
            traceAvailable,
            autorunDelay,
            hoveredCellKey,
            isGraphicalLocatorActive,
            isAutoLogActive,
            pointOfViewTiles,
            isPlaying,
            searchState,
        } = this.state;

        VisualQueryManager.visualQuery = searchState?.visualQuery || [];

        const rowHeight = Math.floor(
            height / gridLayoutFormatter.grid.rows[
                gridLayoutFormatter.currentBreakPoint
                ]
        );
        gridLayoutFormatter.rowHeights[
            gridLayoutFormatter.currentBreakPoint
            ] = rowHeight - appStyle.margin;

        const debugDrawer = (isDebug && global.monaco && global.monaco.editor
            && isAutoLogActive &&
            <Drawer anchor={"bottom"} open={isAutoLogActive}
                    onClose={this.handleChangeAutoExpand}>
                <PointOfView monaco={global.monaco}
                             tiles={pointOfViewTiles}/>
            </Drawer>);

        const _rowHeight = gridLayoutFormatter.rowHeights[
            gridLayoutFormatter.currentBreakPoint
            ];
        if (isCompact) {
            return (
                <div
                    className={appClasses.content}
                >
                    <PastebinContext.Provider
                        value={this.state}
                    >
                        {debugDrawer}
                        {TopNavigationBarComponent}
                        <Responsive
                            innerRef={this.gridRef}
                            width={width}
                            breakpoints={gridLayoutFormatter.gridBreakpoints}
                            layouts={gridLayouts}
                            cols={gridLayoutFormatter.grid.cols}
                            verticalCompact={true}
                            compactType={'vertical'}
                            autoSize={true}
                            margin={appStyle.marginArray}
                            containerPadding={appStyle.marginArray}
                            rowHeight={_rowHeight}
                            onResizeStart={this.onResizeStart}
                            onResize={this.onResize}
                            onResizeStop={this.onResizeStop}
                            draggableHandle={`.${classes.draggable}`}
                            onDragStart={this.onDragStart}
                            onDrag={this.onDrag}
                            onDragStop={this.onDragStop}
                            onLayoutChange={this.onLayoutChange}
                            onBreakpointChange={this.onBreakpointChange}
                        >
                            <Paper
                                elevation={1}
                                key="scriptContainer"
                                onMouseEnter={
                                    this.handleChangeEnterCellScriptContainer
                                }
                                onMouseLeave={
                                    this.handleChangeLeaveCellScriptContainer
                                }
                            >
                                <Editor
                                    editorId={editorIds['js']}
                                    observeMouseEvents
                                    observeLiveExpressions={true}
                                    updateMonacoEditorLayout={
                                        this.updateMonacoEditorLayout(
                                            editorIds['js']
                                        )
                                    }
                                />
                                {hoveredCellKey === 'scriptContainer' ?
                                    null
                                    : <LanguageJavaScriptIcon
                                        className={classes.icon}
                                    />
                                }
                            </Paper>
                            <Paper
                                elevation={1}
                                key="htmlContainer"
                                onMouseEnter={
                                    this.handleChangeEnterCellHtmlContainer
                                }
                                onMouseLeave={
                                    this.handleChangeLeaveCellHtmlContainer
                                }
                            >
                                <Editor editorId={editorIds['html']}
                                        updateMonacoEditorLayout={
                                            this.updateMonacoEditorLayout(
                                                editorIds['html']
                                            )
                                        }
                                />
                                {hoveredCellKey === 'htmlContainer' ?
                                    null
                                    : <LanguageHtml5Icon
                                        className={classes.icon}
                                    />
                                }
                            </Paper>
                            <Paper
                                elevation={1}
                                key="cssContainer"
                                onMouseEnter={
                                    this.handleChangeEnterCellCssContainer
                                }
                                onMouseLeave={
                                    this.handleChangeLeaveCellCssContainer
                                }
                            >
                                <Editor
                                    editorId={editorIds['css']}
                                    updateMonacoEditorLayout={
                                        this.updateMonacoEditorLayout(
                                            editorIds['css']
                                        )
                                    }
                                />
                                {hoveredCellKey === 'cssContainer' ?
                                    null
                                    : <LanguageCss3Icon
                                        className={classes.icon}
                                    />
                                }
                            </Paper>
                            <Paper
                                elevation={1}
                                key="debugContainer"
                                className={appClasses.container}
                                onMouseEnter={
                                    this.handleChangeEnterCellDebugContainer
                                }
                                onMouseLeave={
                                    this.handleChangeLeaveCellDebugContainer
                                }
                            >

                                <DebugContainer
                                    tabIndex={tabIndex}
                                    handleChangeTab={this.handleChangeTab}
                                    handleChangePlaying={
                                        this.handleChangePlaying
                                    }
                                    isPlaying={isPlaying}
                                />


                                {isDebugLoading ?
                                    <span
                                        className={classes.loadingFeedback}
                                    >
                                        <MoreHorizIcon/>
                                    </span>
                                    : null}
                            </Paper>
                            <Paper
                                elevation={1}
                                key="playgroundContainer"
                                className={appClasses.container}
                                onMouseEnter={
                                    this.handleChangeEnterCellPlaygroundContainer
                                }
                                onMouseLeave={
                                    this.handleChangeLeaveCellPlaygroundContainer
                                }
                            >
                                <Tooltip
                                    title={
                                        `${
                                            isGraphicalLocatorActive ?
                                                'Hide' : 'Show'
                                        } visual elements referenced in code`
                                    }
                                >
                                    <IconButton
                                        color={
                                            isGraphicalLocatorActive ?
                                                'secondary' : 'inherit'
                                        }
                                        className={classes.locatorButton}
                                        raised="true"
                                        onClick={
                                            this.handleChangeGraphicalLocator
                                        }
                                    >
                                        <HighlightAltIcon
                                            className={classes.locator}
                                        />
                                    </IconButton>
                                </Tooltip>
                                <DragHandleIcon
                                    className={classes.draggable}
                                />
                                <Playground
                                    editorIds={editorIds}
                                    isAutoLogActive={isAutoLogActive}
                                    isGraphicalLocatorActive={
                                        isGraphicalLocatorActive
                                    }
                                    handleChangeGraphicalLocator={
                                        this.handleChangeGraphicalLocator
                                    }
                                    resizeListener={this.setResizeListener}
                                />
                                {hoveredCellKey === 'playgroundContainer' ?
                                    null
                                    : <TvIcon
                                        className={classes.icon}
                                    />
                                }
                            </Paper>
                        </Responsive>
                    </PastebinContext.Provider>
                    {traceAvailable &&
                    <TraceControls
                        isTopNavigationToggled={isTopNavigationToggled}
                        persistablePath={'traceControls'}
                        autorunDelay={autorunDelay}
                        handleChangeAutorunDelay={this.handleChangeAutorunDelay}
                    />}
                </div>
            );

        }
        return this.oldRender();
    }

    componentDidMount() {
        const {setGridLayoutCallbacks, pastebinConfigureLayout} = this.props;
        setGridLayoutCallbacks(
            this.resetGridLayout, this.getCurrentGridLayouts
        );

        pastebinConfigureLayout(
            this.restoreGridLayouts, this.getCurrentGridLayouts
        );
        this.onDebugContainerResizeEnd();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.handleAutomaticLayoutDebounced();
    }

    componentWillUnmount() {
        VisualQueryManager.visualQuery = [];
    }


}

Pastebin.propTypes = {
    classes: PropTypes.object.isRequired,
    editorIds: PropTypes.object.isRequired,
    setGridLayoutCallbacks: PropTypes.func.isRequired,
    disableGridAutomaticEditorLayout: PropTypes.bool,
};

export default connect(
    null,
    mapDispatchToProps)(withStyles(styles)(SizeProvider(Pastebin))
);
