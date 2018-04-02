import React, {Component, createContext} from 'react';
import PropTypes from "prop-types";
import {Responsive} from 'react-grid-layout';
import Paper from 'material-ui/Paper';
import Button from 'material-ui/Button';
import AddIcon from 'material-ui-icons/Add';
import MoreHorizIcon from 'material-ui-icons/MoreHoriz';
import DragHandleIcon from 'material-ui-icons/DragHandle';
import {withStyles} from 'material-ui/styles';
import {configureFindChunks, functionLikeExpressions} from '../utils/scrUtils';

import Editor from './Editor';
import Playground from './Playground';
import {pastebinConfigureLayout} from "../redux/modules/pastebin";
import SizeProvider from '../utils/SizeProvider';
import {
  configureDefaultGridLayoutFormatter
} from '../utils/reactGridLayoutUtils';
import DebugContainer from "../components/DebugContainer";

let gridLayoutFormatter = configureDefaultGridLayoutFormatter();

export const PastebinContext = createContext({});
const animationId = `scr-a-id-${Date.now()}`;
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

class Pastebin extends Component {

  handleChangeDebugLoading = (isLoading) => {
    this.setState({isDebugLoading: isLoading});
  };

  getCurrentGridLayouts = () => {
    return gridLayoutFormatter.currentGridLayouts;
  };

  restoreGridLayouts = gridLayouts => {
    this.setState({
      gridLayouts: gridLayouts,
    });
    gridLayoutFormatter.currentGridLayouts = gridLayouts;
  };

  resetGridLayout = layout => {
    this.restoreGridLayouts(gridLayoutFormatter.getLayoutDummy(layout));
    setTimeout(() => {
      this.restoreGridLayouts(layout || gridLayoutFormatter.getDefaultGridLayouts());
    }, 0);

  };

  //layout: Layout, oldItem: LayoutItem, newItem: LayoutItem,
  // placeholder: LayoutItem, e: MouseEvent, element: HTMLElement
  onResizeStart = (layout, oldItem, newItem,
                   placeholder, e, element) => {
    gridLayoutFormatter.formatLayout(layout, oldItem, newItem);
  };

  onResize = (layout, oldItem, newItem
              /*, placeholder, e, element*/) => {
    gridLayoutFormatter.formatLayout(layout, oldItem, newItem);
  };

  onResizeStop = (layout, oldItem, newItem
                  /*, placeholder, e, element*/) => {
    gridLayoutFormatter.formatLayout(layout, oldItem, newItem);
  };

  formatDrag = layout => {
    gridLayoutFormatter.layoutFormatInvariant(layout);
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
  };

  onBreakpointChange = (newBreakpoint /*, newCols*/) => {
    gridLayoutFormatter.onBreakpointChange(newBreakpoint);
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

  onScrollEnd = () => {
    this.handleChangeDebugLoading(true);
    setTimeout(() => {
      this.setState((prevState) => {
        const rowsPerPage = Math.min(prevState.rowsPerPage + prevState.rowsPerPageIncrement, Math.max((prevState.timeline || []).length, prevState.minRows));
        if (rowsPerPage !== prevState.rowsPerPage) {
          return {rowsPerPage: rowsPerPage}
        } else {
          return null;
        }
      });

      this.handleChangeDebugLoading(false);
    }, 0);
  };

  addDebugContainerOnScrollEnd = () => {
    if (this.debugScrollerRef) {
      this.debugScrollListener = (e) => {
        if (this.debugScrollerRef.offsetHeight + this.debugScrollerRef.scrollTop >= this.debugScrollerRef.scrollHeight) {
          this.onScrollEnd(e);
        }
      };
      this.debugScrollerRef.addEventListener('scroll', this.debugScrollListener);
    }
  };

  removeDebugContainerOnScrollEnd = () => {
    if (this.debugScrollerRef) {
      this.debugScrollerRef.removeEventListener('scroll', this.debugScrollListener);
    }
  };

  createData(timeline, getEditorTextInLoc) {
    let tl = timeline || [];
    return (tl).map((entry, i) => ({
      id: entry.reactKey, // todo entry.timestamp
      time: entry.i,
      // time: entry.timestamp,
      expression: getEditorTextInLoc(entry.loc),
      value: entry.data,
      loc: {...entry.loc},
      expressionId: entry.id,
      entry: entry,
    }));
  }

  liveExpressionStoreChange = (timeline, isNew, highlightSingleText, getEditorTextInLoc, colorizeDomElement, objectNodeRenderer, handleChange) => {
    const {orderBy, order, isPlaying} = this.state;
    isPlaying && this.handleChangeDebugLoading(true);
    setTimeout(() => {
      if (isPlaying || isNew) {
        let currentTimeline = isPlaying ? timeline : this.state.timeline;
        const data = this.createData(currentTimeline, getEditorTextInLoc);
        //console.log(orderBy, order,orderBy === 'time' && order === 'desc');
        const sortedData = orderBy === 'time' && order === 'desc' ? data : this.sortData(data, orderBy, order);
        this.setState((prevState) => ({
          isPlaying: isNew ? true : prevState.isPlaying,
          timeline: currentTimeline,
          liveTimeline: timeline,
          rowsPerPage: prevState.rowsPerPage === prevState.minRows ? prevState.defaultRowsPerPage : prevState.rowsPerPage,
          data: sortedData,
          highlightSingleText: highlightSingleText,
          getEditorTextInLoc: getEditorTextInLoc,
          colorizeDomElement: colorizeDomElement,
          objectNodeRenderer: objectNodeRenderer,
          handleChange: handleChange,
        }));
        this.handleChangeDebugLoading(false);
      } else {
        this.setState({liveTimeline: timeline});
      }
    }, 0);
  };

  handleChangePlaying = () => {
    const {orderBy, order, isPlaying, timeline, liveTimeline, getEditorTextInLoc} = this.state;
    let currentTimeline = isPlaying ? timeline : liveTimeline;
    const data = this.createData(currentTimeline, getEditorTextInLoc);
    const sortedData = orderBy === 'time' && order === 'desc' ? data : this.sortData(data, orderBy, order);
    this.setState(prevState => ({
      isPlaying: !prevState.isPlaying,
      timeline: currentTimeline,
      data: sortedData,
    }));
  };

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
      nextSearchState.isFunctions|| nextSearchState.isExpressions|| nextSearchState.isValues;

    if(!hasFilter){
      if(filter === 'isFunctions'||filter === 'isExpressions'||filter === 'isValues'){
        nextSearchState[filter]=true;
      }else{
        nextSearchState.isFunctions=true;
      }
    }

    nextSearchState.findChuncks=
      configureFindChunks(!nextSearchState.isRegExp, nextSearchState.isCase, nextSearchState.isWord);
    this.setState({searchState: nextSearchState});
  };

  state = {
    gridLayouts: gridLayoutFormatter.getDefaultGridLayouts(),
    liveExpressionStoreChange: this.liveExpressionStoreChange,
    isDebugLoading: false,
    tabIndex: 0,
    order: 'desc',
    orderBy: 'time',
    selected: [],
    data: [],
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
    liveTimeline: [],
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
  };

  render() {
    const {themeType, appClasses, classes, appStyle, editorIds, width, height} = this.props;
    const rowHeight = Math.floor(height / gridLayoutFormatter.grid.rows[gridLayoutFormatter.currentBreakPoint]);
    const {gridLayouts, liveExpressionStoreChange, liveState, isDebugLoading, tabIndex} = this.state;
    gridLayoutFormatter.rowHeights[gridLayoutFormatter.currentBreakPoint] = rowHeight - appStyle.margin;
    //const timeline = isPlaying ? liveTimeline : pausedTimeline;
    return (
      <div className={appClasses.content}>
        <PastebinContext.Provider value={this.state}>
          <Responsive
            width={width}
            breakpoints={gridLayoutFormatter.gridBreakpoints}
            layouts={gridLayouts}
            cols={gridLayoutFormatter.grid.cols}
            compactType={'vertical'}
            autoSize={true}
            margin={[appStyle.margin, appStyle.margin]}
            containerPadding={[appStyle.margin, appStyle.margin]}
            rowHeight={gridLayoutFormatter.rowHeights[gridLayoutFormatter.currentBreakPoint]}
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
            <Paper key="scriptContainer">
              <Editor editorId={editorIds['js']}
                      themeType={themeType}
                      observeMouseEvents
                      observeLiveExpressions={true}
                //  liveExpressionStoreChange={liveExpressionStoreChange}
              />
            </Paper>
            <Paper key="htmlContainer">
              <Editor editorId={editorIds['html']}/>
            </Paper>
            <Paper key="cssContainer">
              <Editor editorId={editorIds['css']}/>
            </Paper>
            <Paper key="debugContainer" className={appClasses.container}>
              <div className={appClasses.scroller} ref={ref => {
                this.debugScrollerRef = this.debugScrollerRef || ref;
              }}>
                <DebugContainer appClasses={appClasses}
                                appStyle={appStyle}
                                tabIndex={tabIndex}
                                handleChangeTab={this.handleChangeTab}
                                handleChangeTabIndex={this.handleChangeTabIndex}
                />
              </div>
              {isDebugLoading ? <span className={classes.loadingFeedback}><MoreHorizIcon/> </span> : null}
            </Paper>
            <Paper key="consoleContainer" className={appClasses.container}>
              <DragHandleIcon className={classes.draggable}/>
              <div className={appClasses.scroller}>
                <div className={appClasses.content}>
                </div>
              </div>
              {/*<Button variant="fab" color="primary" aria-label="add"*/}
              {/*className={classes.button}>*/}
              {/*<AddIcon/>*/}
              {/*</Button>*/}
            </Paper>
            <Paper key="playgroundContainer"
                   className={appClasses.container}
            >
              <DragHandleIcon className={classes.draggable}/>
              <div className={appClasses.scroller}>
                <Playground editorIds={editorIds}
                            appClasses={appClasses}
                            appStyle={appStyle}
                />
              </div>
            </Paper>
          </Responsive>
        </PastebinContext.Provider>
      </div>
    );
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
    this.addDebugContainerOnScrollEnd();
  }

  componentWillUnmount() {
    this.removeDebugContainerOnScrollEnd();
  }

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
