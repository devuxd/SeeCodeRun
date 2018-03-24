import React, {Component} from 'react';
import PropTypes from "prop-types";
import {Responsive} from 'react-grid-layout';
import Paper from 'material-ui/Paper';
import Button from 'material-ui/Button';
import AddIcon from 'material-ui-icons/Add';
import DragHandleIcon from 'material-ui-icons/DragHandle'
import {withStyles} from 'material-ui/styles';
import Editor from './Editor';
import Playground from './Playground';
import {pastebinConfigureLayout} from "../redux/modules/pastebin";
import SizeProvider from '../utils/SizeProvider';
import {
  configureDefaultGridLayoutFormatter
} from '../utils/reactGridLayoutUtils';
import DebugContainer from "../components/DebugContainer";

let gridLayoutFormatter = configureDefaultGridLayoutFormatter();

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
  }
});

class Pastebin extends Component {
  state = {
    gridLayouts: gridLayoutFormatter.getDefaultGridLayouts(),
    liveExpressionStoreChange: ()=>{},
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

  setLiveExpressionStoreChange=(callback)=>{
    this.setState({liveExpressionStoreChange:callback});
  };

  render() {
    const {themeType, appClasses, classes, appStyle, editorIds, width, height} = this.props;
    const rowHeight = Math.floor(height / gridLayoutFormatter.grid.rows[gridLayoutFormatter.currentBreakPoint]);
    const {gridLayouts, liveExpressionStoreChange} = this.state;
    gridLayoutFormatter.rowHeights[gridLayoutFormatter.currentBreakPoint] = rowHeight - appStyle.margin;

    return (
      <div className={appClasses.content}>
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
                    liveExpressionStoreChange={liveExpressionStoreChange}
            />
          </Paper>
          <Paper key="htmlContainer">
            <Editor editorId={editorIds['html']}/>
          </Paper>
          <Paper key="cssContainer">
            <Editor editorId={editorIds['css']}/>
          </Paper>
          <Paper key="debugContainer" className={appClasses.container}>
            <div className={appClasses.scroller}>
              <div className={appClasses.content}>
                <DebugContainer appClasses={appClasses}
                                appStyle={appStyle}
                                setLiveExpressionStoreChange={this.setLiveExpressionStoreChange}
                />
              </div>
            </div>
          </Paper>
          <Paper key="consoleContainer" className={appClasses.container}>
            <DragHandleIcon className={classes.draggable}/>
            <div className={appClasses.scroller}>
              <div className={appClasses.content}>
              </div>
            </div>
            <Button variant="fab" color="primary" aria-label="add"
                    className={classes.button}>
              <AddIcon/>
            </Button>
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
