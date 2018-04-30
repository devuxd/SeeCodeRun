import React, {Component, createContext} from 'react';
import PropTypes from 'prop-types';
import throttle from 'lodash.throttle';
import debounce from 'lodash.debounce';
import {Responsive} from 'react-grid-layout';
// import {withStyles, Paper} from 'material-ui';
import {withStyles} from 'material-ui/styles';
import Paper from 'material-ui/Paper';
// import AddIcon from '@material-ui/icons/Add';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import DragHandleIcon from '@material-ui/icons/DragHandle';
import {configureFindChunks, functionLikeExpressions} from '../utils/scrUtils';

import Editor from './Editor';
import Playground from './Playground';
import {pastebinConfigureLayout} from "../redux/modules/pastebin";
import SizeProvider from '../utils/SizeProvider';
import PersistableContainer from './PersistableContainer';
import {
    configureDefaultGridLayoutFormatter
} from '../utils/reactGridLayoutUtils';
import {
    configureDefaultGridLayoutFormatter as configureDefaultGridLayoutCompactFormatter
} from '../utils/reactGridLayoutCompactUtils';
import DebugContainer from "../components/DebugContainer";
import ScrollingList from "../components/ScrollingList";
import TraceControls from '../components/TraceControls';

const PersistableTraceControls = PersistableContainer(TraceControls);

let isCompact = true;
let gridLayoutFormatter = isCompact ?
    configureDefaultGridLayoutCompactFormatter() : configureDefaultGridLayoutFormatter();

export const PastebinContext = createContext({});
const animationId = `scr-a-id-${Date.now()}`;

const TABLE_ROW_HEIGHT = 48;
const styles = theme => ({
    layout: {
        overflow: 'visible',
    },
    button: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        float: 'right',
        margin: theme.spacing.unit,
    },
    draggable: {
        position: 'absolute',
        zIndex: theme.zIndex.snackbar,
        right: 3,
        top: 3,
        color: 'rgba(30, 144, 255, 0.7)', // same as utils/react-grid-layout-scr-theme.css
        fontSize: theme.spacing.unit * 2,
        cursor: 'grab',
        active: {
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
        bottom: theme.spacing.unit,
        left: '50%',
        color: theme.palette.secondary.main,
        visibility: 'hidden',
        animation: `${animationId} 1s linear 1s infinite alternate`,
    },
});

let automaticLayout = 0;

class Pastebin extends Component {
    constructor(props) {
        super(props);
        this.debugScrollerRef = React.createRef();
        this.updateMonacoEditorLayouts = {};
        this.exports = {};
        this.debugScrollerRefSnapshots = {};
        this.scrollingListContainers = {};
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.width !== prevState.width || nextProps.height !== prevState.height) {
            automaticLayout++;
            return {
                width: nextProps.width,
                height: nextProps.height,
            };
        }
        return null;
    }

    onGridResize = (isResizing) => {
        this.exports.onResize && this.exports.onResize(isResizing);
    }

    handleChangeDebugLoading = (isLoading) => {
        this.setState({isDebugLoading: isLoading});
    };

    getCurrentGridLayouts = () => {
        return gridLayoutFormatter.currentGridLayouts;
    };

    restoreGridLayouts = gridLayouts => {
        gridLayouts = gridLayoutFormatter.validateLayout(gridLayouts, gridLayoutFormatter.currentBreakPoint);
        this.setState({
            gridLayouts: gridLayouts,
        });
        gridLayoutFormatter.currentGridLayouts = gridLayouts;
        automaticLayout++;
        this.onDebugContainerResizeEnd(false);
    };

    resetGridLayout = layout => {
        this.restoreGridLayouts(gridLayoutFormatter.getLayoutDummy(layout));
        setTimeout(() => {
            this.restoreGridLayouts(layout || gridLayoutFormatter.getDefaultGridLayouts());
        }, 0);

    };

    debouncedOnDebugContainerResizeEnd = debounce((isNew) => {
        if (this.debugScrollerRef.current) {
            let availableHeight = this.debugScrollerRef.current.parentElement ?
                (this.debugScrollerRef.current.parentElement.style.height || '0')
                : (this.debugScrollerRef.current.style.height || '0');
            availableHeight = parseInt(availableHeight.replace('px', ''), 10);
            const defaultRowsPerPage = (parseInt(availableHeight / TABLE_ROW_HEIGHT, 10) || 0) + 1;
            this.setState((prevState) => {
                const nextRowsPerPage = isNew ?
                    defaultRowsPerPage : Math.max(
                        prevState.rowsPerPage + prevState.rowsPerPageIncrement, defaultRowsPerPage
                    );
                const rowsPerPage =
                    Math.min(nextRowsPerPage, Math.max((prevState.timeline || []).length, prevState.minRows));
                if (rowsPerPage !== prevState.rowsPerPage) {
                    return {rowsPerPage, defaultRowsPerPage};
                } else {
                    return null;
                }
            });
        }
        this.handleChangeDebugLoading(false);
    }, 50);

    onDebugContainerResizeEnd = (isNew) => {
        this.handleChangeDebugLoading(true);
        this.debouncedOnDebugContainerResizeEnd(isNew);
    };

    //layout: Layout, oldItem: LayoutItem, newItem: LayoutItem,
    // placeholder: LayoutItem, e: MouseEvent, element: HTMLElement
    onResizeStart = (layout, oldItem, newItem,
                     placeholder, e, element) => {
        // gridLayoutFormatter.formatLayout(layout, oldItem, newItem);
        this.onGridResize(true);
    };

    handleAutomaticLayout = () => {
        if (this.automaticLayout !== automaticLayout) {
            this.automaticLayout = automaticLayout;
            for (const editorId in this.updateMonacoEditorLayouts) {
                this.updateMonacoEditorLayouts[editorId] && this.updateMonacoEditorLayouts[editorId]();
            }
        }
    };

    handleAutomaticLayoutThrottled = throttle(this.handleAutomaticLayout, 100);
    handleAutomaticLayoutDebounced = debounce(this.handleAutomaticLayout, 100);

    onResize = (layout, oldItem, newItem
                /*, placeholder, e, element*/) => {
        gridLayoutFormatter.formatLayout(layout, oldItem, newItem);
        automaticLayout++;
        this.handleAutomaticLayoutThrottled();
    };

    onResizeStop = (layout, oldItem, newItem
                    /*, placeholder, e, element*/) => {
        gridLayoutFormatter.formatLayout(layout, oldItem, newItem);
        // if (newItem.i === 'debugContainer') {
        this.onDebugContainerResizeEnd(false);
        // }
        automaticLayout++;
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

    handleChangeTimeFlow = () => {
        const orderBy = 'time';
        let timeFlow = this.state.timeFlow;
        let order = timeFlow;
        if (this.state.orderBy === orderBy) {
            if (timeFlow === 'desc') {
                order = 'asc';
                timeFlow = order;
            } else {
                order = 'desc';
                timeFlow = order;
            }
        }
        const data = this.sortData(this.state.data, orderBy, order);
        this.setState({data, order, orderBy, timeFlow});
    };

    handleRequestSort = (event, property) => {
        const orderBy = property;
        let order = 'desc';
        if (this.state.orderBy === property && this.state.order === 'desc') {
            order = 'asc';
        }
        const data = this.sortData(this.state.data, orderBy, order);
        this.setState({data, order, orderBy});
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

    onScrollChange = (e, scrollData) => {
        //todo fix stop scroll  on end of conatiner
        // const listContainer = this.scrollingListContainers[this.state.tabIndex];
        // if (listContainer && listContainer.current && this.debugScrollerRef.current) {
        //     const scroller = this.debugScrollerRef.current;
        //     const scrollPos =  scroller.scrollHeight - scroller.scrollTop;
        //     const elementHeight = listContainer.current.offsetHeight;
        //     console.log(this.state.tabIndex, scrollPos, elementHeight, scrollData);
        //     if (scroller && scrollPos > elementHeight) {
        //
        //         scroller.scrollTop = scrollPos;
        //        scrollData.scrollTop = scroller.scrollTop;
        //     }
        //     // console.log(this.state.tabIndex, listContainer.current);
        // }
        this.debugScrollerRefSnapshots[this.state.tabIndex] = scrollData;
    }

    handleScrollEnd = (isBottom) => {
        this.setState((prevState) => {
            const rowsPerPage = isBottom ?
                Math.min(
                    prevState.rowsPerPage + prevState.rowsPerPageIncrement,
                    Math.max((prevState.timeline || []).length, prevState.minRows))
                : prevState.defaultRowsPerPage * 3;
            if (rowsPerPage !== prevState.rowsPerPage) {
                return {rowsPerPage};
            } else {
                return null;
            }
        });

        this.handleChangeDebugLoading(false);
    };

    debouncedScrollEnd = debounce(this.handleScrollEnd, 50);

    onScrollEnd = (e, isBottom) => {
        if (this.state.tabIndex !== 0) {
            return;
        }

        if (isBottom) {
            this.handleChangeDebugLoading(true);
            this.debouncedScrollEnd(isBottom);
        } else {
            const {rowsPerPage, defaultRowsPerPage} = this.state;
            if (rowsPerPage > defaultRowsPerPage * 3) {
                this.handleChangeDebugLoading(true);
                setTimeout(() => {
                    this.handleScrollEnd(isBottom);
                }, 500);
            }
        }
    };

    createData(timeline, getEditorTextInLoc) {
        let tl = timeline || [];
        return (tl).map((entry, i) => ({
            id: entry.reactKey,
            time: entry.i,
            // time: entry.timestamp,
            expression: getEditorTextInLoc(entry.loc),
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

    createLogData(log, getEditorTextInLoc) {
        let l = log || [];
        return l.map((entry, i) => {
            if (entry.isLog) {
                return {
                    id: entry.reactKey,
                    time: entry.i,
                    // time: entry.timestamp,
                    expression: getEditorTextInLoc(entry.loc),
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

    liveExpressionStoreChange = (traceSubscriber, timeline, logs, isNew, HighlightTypes, highlightSingleText, setCursorToLocation, getEditorTextInLoc, colorizeDomElement, objectNodeRenderer, handleChange) => {
        const {orderBy, order, isPlaying} = this.state;
        isPlaying && this.handleChangeDebugLoading(true);
        setTimeout(() => {
            if (isPlaying || isNew) {
                let currentTimeline = isPlaying ? timeline : this.state.timeline;
                let currentLogs = isPlaying ? logs : this.state.logs;
                const data = this.createData(currentTimeline, getEditorTextInLoc);
                const logData = this.createLogData(currentLogs, getEditorTextInLoc);
                //console.log(orderBy, order,orderBy === 'time' && order === 'desc');
                const sortedData = orderBy === 'time' && order === 'desc' ? data : this.sortData(data, orderBy, order);
                this.setState((prevState) => ({
                    isNew: isNew,
                    isPlaying: isNew ? true : prevState.isPlaying,
                    traceSubscriber: traceSubscriber,
                    timeline: currentTimeline,
                    liveTimeline: timeline,
                    logs: currentLogs,
                    liveLogs: logs,
                    rowsPerPage: prevState.rowsPerPage === prevState.minRows ? prevState.defaultRowsPerPage : prevState.rowsPerPage,
                    data: sortedData,
                    logData,
                    HighlightTypes: HighlightTypes,
                    highlightSingleText: highlightSingleText,
                    setCursorToLocation: setCursorToLocation,
                    getEditorTextInLoc: getEditorTextInLoc,
                    colorizeDomElement: colorizeDomElement,
                    objectNodeRenderer: objectNodeRenderer,
                    handleChange: handleChange,
                }));
                this.handleChangeDebugLoading(false);
            } else {
                this.setState({liveTimeline: timeline, liveLogs: logs, isNew});
            }
        }, 0);
    };

    handleChangePlaying = debounce((id, play) => {
        let {isPlaying, lastHandleChangePlayingId} = this.state;
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

        const {orderBy, order, timeline, liveTimeline, logs, liveLogs, getEditorTextInLoc} = this.state;
        let currentTimeline = isPlaying ? timeline : liveTimeline;
        let currentLogs = isPlaying ? logs : liveLogs;
        const data = this.createData(currentTimeline, getEditorTextInLoc);
        const logData = this.createLogData(currentLogs, getEditorTextInLoc);
        const sortedData = orderBy === 'time' && order === 'desc' ? data : this.sortData(data, orderBy, order);
        this.setState({
            isPlaying: !isPlaying,
            lastHandleChangePlayingId,
            timeline: currentTimeline,
            logs: currentLogs,
            data: sortedData,
            logData
        });
    }, 100);

    handleChangeTab = (event, value) => {
        this.setState({tabIndex: value});
    };

    handleChangeTabIndex = index => {
        this.setState({tabIndex: index});
    };

    handleChangeSearchValue = e => {
        const value = e.target.value || '';
        this.setState({
            searchState: {...this.state.searchState, value: value}
        })
    };

    handleChangeSearchFilterClick = (filter) => {
        const {searchState} = this.state;
        const nextSearchState = {...searchState, [filter]: !searchState[filter]};
        if (nextSearchState.isWord && nextSearchState.isRegExp) {
            if (filter === 'isWord') {
                nextSearchState.isRegExp = false;
            } else {
                nextSearchState.isWord = false;
            }
        }

        const hasFilter =
            nextSearchState.isFunctions || nextSearchState.isExpressions || nextSearchState.isValues;

        if (!hasFilter) {
            if (filter === 'isFunctions' || filter === 'isExpressions' || filter === 'isValues') {
                nextSearchState[filter] = true;
            } else {
                nextSearchState.isFunctions = true;
            }
        }

        nextSearchState.findChuncks =
            configureFindChunks(!nextSearchState.isRegExp, nextSearchState.isCase, nextSearchState.isWord);
        this.setState({searchState: nextSearchState});
    };

    state = {
        traceAvailable: true,
        autorunDelay: 2000,
        gridLayouts: gridLayoutFormatter.getDefaultGridLayouts(),
        liveExpressionStoreChange: this.liveExpressionStoreChange,
        isDebugLoading: false,
        isSelectable: false,
        tabIndex: 0,
        order: 'desc',
        orderBy: 'time',
        selected: [],
        data: [],
        logData: [],
        page: 0,
        rowsPerPage: 10,
        minRows: 5,
        defaultRowsPerPage: 50,
        rowsPerPageIncrement: 250,
        handleChangeDebugLoading: this.handleChangeDebugLoading,
        handleSelectClick: this.handleSelectClick,
        handleSelectAllClick: this.handleSelectAllClick,
        handleRequestSort: this.handleRequestSort,
        isRowSelected: this.isSelected,
        highlightSingleText: () => {
        },
        getEditorTextInLoc: () => {
            return '';
        },
        colorizeDomElement: () => {
        },
        timeline: [],
        logs: [],
        liveTimeline: [],
        liveLogs: [],
        isPlaying: true,
        timeFlow: 'desc',
        handleChangePlaying: this.handleChangePlaying,
        handleChangeTimeFlow: this.handleChangeTimeFlow,
        searchState: {
            functionLikeExpressions: functionLikeExpressions,
            value: '',
            handleChangeValue: this.handleChangeSearchValue,
            isFunctions: false, //true
            isExpressions: true, // false
            isValues: false,
            isCase: false,
            isWord: false,
            isRegExp: false,
            handleFilterClick: this.handleChangeSearchFilterClick,
            findChuncks: configureFindChunks(true),
        },
        width: 800,
        height: 600,
    };

    handleChangeAutorunDelay = autorunDelay => {
        this.setState({autorunDelay: autorunDelay ? parseInt(autorunDelay, 10) : 0});
    };

    updateMonacoEditorLayout = (editorId) => (monacoEditor) => {
        this.updateMonacoEditorLayouts[editorId] = monacoEditor;
    };

    // oldRender = () => {
    //     const {themeType, appClasses, classes, appStyle, editorIds} = this.props;
    //     const {
    //         gridLayouts, isDebugLoading, tabIndex, data, isNew, traceAvailable,
    //         autorunDelay, width, height
    //     } = this.state;
    //
    //     const rowHeight = Math.floor(height / gridLayoutFormatter.grid.rows[gridLayoutFormatter.currentBreakPoint]);
    //     gridLayoutFormatter.rowHeights[gridLayoutFormatter.currentBreakPoint] = rowHeight - appStyle.margin;
    //     return (
    //         <div className={appClasses.content}>
    //             <PastebinContext.Provider value={this.state}>
    //                 <Responsive
    //                     width={width}
    //                     breakpoints={gridLayoutFormatter.gridBreakpoints}
    //                     layouts={gridLayouts}
    //                     cols={gridLayoutFormatter.grid.cols}
    //                     compactType={'vertical'}
    //                     autoSize={true}
    //                     margin={[appStyle.margin, appStyle.margin]}
    //                     containerPadding={[appStyle.margin, appStyle.margin]}
    //                     rowHeight={gridLayoutFormatter.rowHeights[gridLayoutFormatter.currentBreakPoint]}
    //                     onResizeStart={this.onResizeStart}
    //                     onResize={this.onResize}
    //                     onResizeStop={this.onResizeStop}
    //                     draggableHandle={`.${classes.draggable}`}
    //                     // onDragStart={this.onDragStart}
    //                     onDrag={this.onDrag}
    //                     onDragStop={this.onDragStop}
    //                     onLayoutChange={this.onLayoutChange}
    //                     onBreakpointChange={this.onBreakpointChange}
    //                 >
    //                     <Paper key="scriptContainer">
    //                         <Editor editorId={editorIds['js']}
    //                                 themeType={themeType}
    //                                 observeLiveExpressions={true}
    //                         />
    //                     </Paper>
    //                     <Paper key="htmlContainer">
    //                         <Editor editorId={editorIds['html']}/>
    //                     </Paper>
    //                     <Paper key="cssContainer">
    //                         <Editor editorId={editorIds['css']}/>
    //                     </Paper>
    //                     <Paper key="debugContainer" className={appClasses.container}>
    //                         <ScrollingList
    //                             ScrollingListRef={this.debugScrollerRef}
    //                             onScrollEnd={this.onScrollEnd}
    //                             classes={appClasses.scroller}
    //                             listLength={data.length}
    //                             isRememberScrollingDisabled={isNew}
    //                         >
    //                             <DebugContainer
    //                                 ScrollingListRef={this.debugScrollerRef}
    //                                 appClasses={appClasses}
    //                                 appStyle={appStyle}
    //                                 tabIndex={tabIndex}
    //                                 handleChangeTab={this.handleChangeTab}
    //                                 handleChangeTabIndex={this.handleChangeTabIndex}
    //                             />
    //                         </ScrollingList>
    //
    //                         {isDebugLoading ? <span className={classes.loadingFeedback}><MoreHorizIcon/> </span> : null}
    //                     </Paper>
    //                     <Paper key="consoleContainer" className={appClasses.container}>
    //                         <DragHandleIcon className={classes.draggable}/>
    //                         <div className={appClasses.scroller}>
    //                             <div className={appClasses.content}>
    //                             </div>
    //                         </div>
    //                     </Paper>
    //                     <Paper key="playgroundContainer"
    //                            className={appClasses.container}
    //                     >
    //                         <DragHandleIcon className={classes.draggable}/>
    //                         <div className={appClasses.scroller}>
    //                             <Playground editorIds={editorIds}
    //                                         appClasses={appClasses}
    //                                         appStyle={appStyle}
    //                             />
    //                         </div>
    //                     </Paper>
    //                 </Responsive>
    //             </PastebinContext.Provider>
    //             {traceAvailable && <TraceControls
    //                 autorunDelay={autorunDelay} handleChangeAutorunDelay={this.handleChangeAutorunDelay}/>
    //             }
    //         </div>
    //     );
    // }

    render() {
        const {themeType, appClasses, classes, appStyle, editorIds} = this.props;
        const {
            gridLayouts, isDebugLoading, tabIndex, data, isNew, traceAvailable,
            autorunDelay, width, height
        } = this.state;

        const rowHeight = Math.floor(height / gridLayoutFormatter.grid.rows[gridLayoutFormatter.currentBreakPoint]);
        gridLayoutFormatter.rowHeights[gridLayoutFormatter.currentBreakPoint] = rowHeight - appStyle.margin;

        if (isCompact) {
            return (
                <div className={appClasses.content}>
                    <PastebinContext.Provider value={this.state}>
                        <Responsive
                            width={width}
                            breakpoints={gridLayoutFormatter.gridBreakpoints}
                            layouts={gridLayouts}
                            cols={gridLayoutFormatter.grid.cols}
                            // verticalCompact={true}
                            compactType={'vertical'}
                            autoSize={true}
                            margin={[appStyle.margin, appStyle.margin]}
                            containerPadding={[appStyle.margin, appStyle.margin]}
                            rowHeight={gridLayoutFormatter.rowHeights[gridLayoutFormatter.currentBreakPoint]}
                            onResizeStart={this.onResizeStart}
                            onResize={this.onResize}
                            onResizeStop={this.onResizeStop}
                            draggableHandle={`.${classes.draggable}`}
                            // onDragStart={this.onDragStart}
                            onDrag={this.onDrag}
                            onDragStop={this.onDragStop}
                            onLayoutChange={this.onLayoutChange}
                            onBreakpointChange={this.onBreakpointChange}
                        >
                            <Paper key="scriptContainer">
                                <Editor editorId={editorIds['js']}
                                        themeType={themeType}
                                        observeMouseEvents
                                        observeLiveExpressions={true}
                                        updateMonacoEditorLayout={this.updateMonacoEditorLayout(editorIds['js'])}
                                />
                            </Paper>
                            <Paper key="htmlContainer">
                                <Editor editorId={editorIds['html']}
                                        updateMonacoEditorLayout={this.updateMonacoEditorLayout(editorIds['html'])}
                                />
                            </Paper>
                            <Paper key="cssContainer">
                                <Editor editorId={editorIds['css']}
                                        updateMonacoEditorLayout={this.updateMonacoEditorLayout(editorIds['css'])}
                                />
                            </Paper>
                            <Paper key="debugContainer" className={appClasses.container}>
                                <ScrollingList
                                    ScrollingListRef={this.debugScrollerRef}
                                    onScrollEnd={this.onScrollEnd}

                                    onScrollChange={this.onScrollChange}
                                    classes={appClasses.scroller}
                                    listLength={data.length}
                                    isRememberScrollingDisabled={isNew}
                                >
                                    <DebugContainer
                                        ScrollingListRef={this.debugScrollerRef}
                                        appClasses={appClasses}
                                        appStyle={appStyle}
                                        tabIndex={tabIndex}
                                        ScrollingListContainers={this.scrollingListContainers}
                                        handleChangeTab={this.handleChangeTab}
                                        handleChangeTabIndex={this.handleChangeTabIndex}
                                    />
                                </ScrollingList>

                                {isDebugLoading ?
                                    <span className={classes.loadingFeedback}><MoreHorizIcon/> </span> : null}
                            </Paper>
                            <Paper key="playgroundContainer"
                                   className={appClasses.container}
                            >
                                <DragHandleIcon className={classes.draggable}/>
                                <Playground editorIds={editorIds}
                                            appClasses={appClasses}
                                            appStyle={appStyle}
                                            exports={this.exports}
                                />
                            </Paper>
                        </Responsive>
                    </PastebinContext.Provider>
                    {traceAvailable && <PersistableTraceControls
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
        const {setGridLayoutCallbacks} = this.props;
        setGridLayoutCallbacks(this.resetGridLayout, this.getCurrentGridLayouts);
        this.context.store.dispatch(
            pastebinConfigureLayout(
                this.restoreGridLayouts,
                this.getCurrentGridLayouts
            )
        );
        this.onDebugContainerResizeEnd();
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
        const {tabIndex} = this.state;
        const scrollSnapshot = this.debugScrollerRefSnapshots[tabIndex];
        if (tabIndex !== prevState.tabIndex) {
            if (scrollSnapshot) {
                return scrollSnapshot.scrollHeight - scrollSnapshot.scrollTop;
            } else {
                return this.debugScrollerRef.current.scrollHeight;
            }

        }
        return null;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.handleAutomaticLayoutDebounced();
        if (snapshot !== null) {
            const list = this.debugScrollerRef.current;
            list.scrollTop = list.scrollHeight - snapshot;
        }
    }

    // componentWillUnmount() {
    //
    // }

}

Pastebin.contextTypes = {
    store: PropTypes.object.isRequired
};

Pastebin.propTypes = {
    classes: PropTypes.object.isRequired,
    editorIds: PropTypes.object.isRequired,
    setGridLayoutCallbacks: PropTypes.func.isRequired,
};

export default withStyles(styles)(SizeProvider(Pastebin));
