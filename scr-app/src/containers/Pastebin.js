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
import _ from 'lodash';

const gridBreakpoints = {lg: 1200};
const grid = {
  cols: {lg: 100},
  rows: {lg: 50},
};

const getGridUnits = (cl, bk, prop) => {
  return Math.floor(grid[cl][bk] * (prop / 100));
};

const defaultGridLayouts = {
  lg:
    [
      {
        i: 'scriptContainer',
        x: 0,
        y: 0,
        w: getGridUnits('cols', 'lg', 40),
        h: getGridUnits('rows', 'lg', 40),
        isDraggable: false
      },
      {
        i: 'htmlContainer',
        x: getGridUnits('cols', 'lg', 40),
        y: 0,
        w: getGridUnits('cols', 'lg', 20),
        h: getGridUnits('rows', 'lg', 30),
        isDraggable: false,
      },
      {
        i: 'cssContainer',
        x: getGridUnits('cols', 'lg', 40),
        y: getGridUnits('rows', 'lg', 30),
        w: getGridUnits('cols', 'lg', 20),
        h: getGridUnits('rows', 'lg', 10),
        isDraggable: false,
      },
      {
        i: 'debugContainer',
        x: getGridUnits('cols', 'lg', 40) + getGridUnits('cols', 'lg', 20),
        y: 0,
        w: grid.cols.lg - (getGridUnits('cols', 'lg', 40) + getGridUnits('cols', 'lg', 20)),
        h: getGridUnits('rows', 'lg', 40),
        isDraggable: false,
      },
      {
        i: 'consoleContainer',
        x: 0,
        y: getGridUnits('rows', 'lg', 40),
        w: grid.cols.lg,
        h: getGridUnits('rows', 'lg', 20),
      },
      {
        i: 'playgroundContainer',
        x: 0,
        y: getGridUnits('rows', 'lg', 40) + getGridUnits('rows', 'lg', 20),
        w: grid.cols.lg,
        h: grid.rows.lg - (getGridUnits('rows', 'lg', 40) + getGridUnits('rows', 'lg', 20)),
      },
    ]
};

const getCellToIndex = (layouts, bk) => {
  const cellToIndex = {};
  layouts[bk].forEach((cell, index) => {
    cellToIndex[cell.i] = index;
  });
  return cellToIndex;
};

let currentBreakPoint = 'lg';
let currentGridLayouts = _.cloneDeep(defaultGridLayouts);
let C2I = getCellToIndex(currentGridLayouts, currentBreakPoint);

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
    gridLayouts: _.cloneDeep(defaultGridLayouts),
  };

  getCurrentGridLayouts = () => {
    return currentGridLayouts;
  };

  restoreGridLayouts = gridLayouts => {
    this.setState({
      gridLayouts: gridLayouts,
    });
    currentGridLayouts = gridLayouts;
  };


  resetGridLayout = layout => {
    const hack = {...defaultGridLayouts};
    hack[currentBreakPoint] = [...hack[currentBreakPoint], {
      i: 'dummy',
      x: 0,
      y: 0,
      w: 0,
      h: 0
    }];
    this.restoreGridLayouts(hack);
    setTimeout(() => {
      this.restoreGridLayouts(layout || {...defaultGridLayouts});
    }, 0);

  };

  layoutFormatInvariant = layout => {
    layout[C2I.scriptContainer].x = 0;
    layout[C2I.htmlContainer].y = layout[C2I.scriptContainer].y;
    layout[C2I.debugContainer].y = layout[C2I.scriptContainer].y;


    layout[C2I.htmlContainer].x = layout[C2I.scriptContainer].w;
    layout[C2I.cssContainer].x = layout[C2I.htmlContainer].x;

    layout[C2I.scriptContainer].minH = 2;
    layout[C2I.debugContainer].minH = 2;
    layout[C2I.consoleContainer].minH = 2;
    layout[C2I.playgroundContainer].minH = 2;

    layout[C2I.consoleContainer].minW = layout[C2I.consoleContainer].w;
    layout[C2I.playgroundContainer].minW = layout[C2I.playgroundContainer].w;

    layout[C2I.scriptContainer].maxW = layout[C2I.debugContainer].x - 1;
    layout[C2I.cssContainer].y = layout[C2I.htmlContainer].y + layout[C2I.htmlContainer].h;
  };

  formatLayoutHeight = (layout, sourceIndex) => {
    if (layout[sourceIndex].h
      + layout[C2I.consoleContainer].h
      + layout[C2I.playgroundContainer].h > grid.rows[currentBreakPoint]) {
      if (layout[C2I.consoleContainer].h < 3) {
        layout[sourceIndex].h =
          grid.rows[currentBreakPoint] - layout[C2I.consoleContainer].h - layout[C2I.debugContainer].h;
      } else {
        layout[C2I.consoleContainer].h =
          grid.rows[currentBreakPoint] - layout[sourceIndex].h - layout[C2I.playgroundContainer].h;
      }
    } else {
      layout[C2I.consoleContainer].h =
        grid.rows[currentBreakPoint] - layout[C2I.scriptContainer].h - layout[C2I.playgroundContainer].h;
    }
  };

  formatLayout = (layout, oldItem, newItem) => {

    if (newItem.i === 'scriptContainer') {
      const newX = layout[C2I.scriptContainer].x + layout[C2I.scriptContainer].w;
      layout[C2I.htmlContainer].x = newX;
      layout[C2I.cssContainer].x = newX;
      const newW = grid.cols[currentBreakPoint] - layout[C2I.scriptContainer].w - layout[C2I.debugContainer].w;
      layout[C2I.htmlContainer].w = newW;
      layout[C2I.cssContainer].w = newW;

      this.formatLayoutHeight(layout, C2I.scriptContainer);
      if (layout[C2I.scriptContainer].h > layout[C2I.htmlContainer].h) {
        layout[C2I.cssContainer].h = layout[C2I.scriptContainer].h - layout[C2I.htmlContainer].h;
      } else {
        layout[C2I.htmlContainer].h = layout[C2I.htmlContainer].h - 1;
        layout[C2I.cssContainer].y = layout[C2I.htmlContainer].y + layout[C2I.htmlContainer].h;
        layout[C2I.cssContainer].h = 1;
      }

      layout[C2I.debugContainer].h = layout[C2I.scriptContainer].h;
    }

    if (newItem.i === 'htmlContainer' || newItem.i === 'cssContainer') {

      if (newItem.i === 'cssContainer') {
        let newH = layout[C2I.htmlContainer].h + layout[C2I.cssContainer].h;
        if (newH + layout[C2I.consoleContainer].h + layout[C2I.playgroundContainer].h > grid.rows[currentBreakPoint]) {
          if (layout[C2I.consoleContainer].h < 3) {
            layout[C2I.cssContainer].h = layout[C2I.scriptContainer].h - layout[C2I.htmlContainer].h;
            newH = layout[C2I.htmlContainer].h + layout[C2I.cssContainer].h;
          }
        }
        layout[C2I.scriptContainer].h = newH;
        layout[C2I.debugContainer].h = newH;
        this.formatLayoutHeight(layout, C2I.scriptContainer);
        layout[C2I.htmlContainer].w = layout[C2I.cssContainer].w;

      } else {
        layout[C2I.cssContainer].w = layout[C2I.htmlContainer].w;

        const newH = layout[C2I.scriptContainer].h - layout[C2I.htmlContainer].h;
        if (newH > 0) {
          layout[C2I.cssContainer].h = newH;
        } else {
          layout[C2I.htmlContainer].h = layout[C2I.scriptContainer].h - layout[C2I.cssContainer].h;
        }

      }
      layout[C2I.cssContainer].y = layout[C2I.htmlContainer].y + layout[C2I.htmlContainer].h;
      layout[C2I.scriptContainer].h = layout[C2I.cssContainer].h + layout[C2I.htmlContainer].h;
      layout[C2I.debugContainer].h = layout[C2I.cssContainer].h + layout[C2I.htmlContainer].h;

      const newX = layout[C2I.htmlContainer].x + layout[C2I.htmlContainer].w;
      const newW =
        (grid.cols[currentBreakPoint] - (layout[C2I.scriptContainer].w + layout[C2I.htmlContainer].w)) || 1;

      if (newX + newW > grid.cols[currentBreakPoint]) {
        const maxW =
          grid.cols[currentBreakPoint] - (layout[C2I.scriptContainer].w + layout[C2I.debugContainer].w);
        layout[C2I.cssContainer].w = maxW;
        layout[C2I.htmlContainer].w = maxW;
      } else {
        layout[C2I.debugContainer].x = newX;
        layout[C2I.debugContainer].w = newW
      }
    }

    if (newItem.i === 'debugContainer') {
      layout[C2I.debugContainer].w =
        grid.cols[currentBreakPoint] - (layout[C2I.scriptContainer].w + layout[C2I.htmlContainer].w);

      layout[C2I.scriptContainer].h = layout[C2I.debugContainer].h;
      this.formatLayoutHeight(layout, C2I.scriptContainer);
      layout[C2I.debugContainer].h = layout[C2I.scriptContainer].h;

      if (layout[C2I.debugContainer].h > layout[C2I.htmlContainer].h) {
        layout[C2I.cssContainer].h = layout[C2I.debugContainer].h - layout[C2I.htmlContainer].h;
      } else {
        layout[C2I.htmlContainer].h = layout[C2I.htmlContainer].h - 1;
        layout[C2I.cssContainer].h = 1;
      }

    }

    if (newItem.i === 'consoleContainer' || newItem.i === 'playgroundContainer') {
      let newH = grid.rows[currentBreakPoint] - layout[C2I.scriptContainer].h - layout[C2I.playgroundContainer].h;
      let sourceContainer = layout[C2I.playgroundContainer];
      let targetContainer = layout[C2I.consoleContainer];
      if (newItem.i === 'consoleContainer') {
        newH = grid.rows[currentBreakPoint] - layout[C2I.scriptContainer].h - layout[C2I.consoleContainer].h || 1;
        sourceContainer = layout[C2I.consoleContainer];
        targetContainer = layout[C2I.playgroundContainer];
      }
      if (newH > 1) {
        targetContainer.h = newH;
      } else {
        sourceContainer.h = grid.rows[currentBreakPoint] - layout[C2I.scriptContainer].h - targetContainer.h;
      }
    }
    this.layoutFormatInvariant(layout);
  };

  //layout: Layout, oldItem: LayoutItem, newItem: LayoutItem,
  // placeholder: LayoutItem, e: MouseEvent, element: HTMLElement
  onResizeStart = (layout, oldItem, newItem,
                   placeholder, e, element) => {
    this.formatLayout(layout, oldItem, newItem);
  };

  onResize = (layout, oldItem, newItem
              /*, placeholder, e, element*/) => {
    this.formatLayout(layout, oldItem, newItem);
  };

  onResizeStop = (layout, oldItem, newItem
                  /*, placeholder, e, element*/) => {
    this.formatLayout(layout, oldItem, newItem);
  };

  formatDrag = layout => {
    this.layoutFormatInvariant(layout);
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
    currentGridLayouts = newGridLayouts;
  };

  onBreakpointChange = (newBreakpoint /*, newCols*/) => {
    currentBreakPoint = newBreakpoint;
  };

  render() {
    const {appClasses, classes, appStyle, editorIds, width, height} = this.props;
    const rowHeight = Math.floor(height / grid.rows[currentBreakPoint]);
    const {gridLayouts} = this.state;
    const rowHeights = {
      [currentBreakPoint]: rowHeight - appStyle.margin
    };
    // console.log(document.querySelectorAll('.react-grid-item .react-resizable-handle').forEach(handle=>{
    //   console.log(handle);
    //   handle.style.innerHTML ='';
    // }));
    return (
      <div className={appClasses.content}>
        <Responsive
          width={width}
          layouts={gridLayouts}
          breakpoints={gridBreakpoints}
          cols={grid.cols}
          compactType={'vertical'}
          autoSize={true}
          margin={[appStyle.margin, appStyle.margin]}
          containerPadding={[appStyle.margin, appStyle.margin]}
          rowHeight={rowHeights[currentBreakPoint]}
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
            <Editor editorId={editorIds['js']} observeMouseEvents/>
          </Paper>
          <Paper key="htmlContainer">
            <Editor editorId={editorIds['html']}/>
          </Paper>
          <Paper key="cssContainer">
            <Editor editorId={editorIds['css']}/>
          </Paper>
          <Paper key="debugContainer" className={appClasses.container}>
            <Button variant="fab" color="primary" aria-label="add"
                    className={classes.button}>
              <AddIcon/>
            </Button>
          </Paper>
          <Paper key="consoleContainer" className={appClasses.container}>
            <DragHandleIcon className={classes.draggable}/>
            <div className={appClasses.scroller}>
              <div className={appClasses.content}>
              </div>
            </div>

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
