import React, {Component} from 'react';
import PropTypes from "prop-types";
import {Responsive, WidthProvider} from 'react-grid-layout';
import Paper from 'material-ui/Paper';
import Button from 'material-ui/Button';
import AddIcon from 'material-ui-icons/Add';
import {withStyles} from 'material-ui/styles';
import Editor from './Editor';
import {pastebinConfigureLayout} from "../redux/modules/pastebin";

const gridBreakpoints={lg: 1200};
const gridCols={lg: 120};
const gridHeights={lg: 1200};
const defaultGridLayouts={
  lg:
    [
      {
        i: 'scriptContainer',
        x: 0,
        y: 0,
        w: 50,
        h: 4,
        minW: 10,
        maxW: gridCols.lg - 20,
        minH: 2,
        isDraggable: false
      },
      {
        i: 'htmlContainer',
        x: 50,
        y: 0,
        w: 30,
        h: 2,
        minW: 10,
        maxW: gridCols.lg - 20,
        minH: 1,
        isDraggable: false,
      },
      {
        i: 'cssContainer',
        x: 50,
        y: 2,
        w: 30,
        h: 2,
        minW: 10,
        maxW: gridCols.lg - 20,
        minH: 1,
        isDraggable: false,
      },
      {
        i: 'debugContainer',
        x: 80,
        y: 0,
        w: 40,
        h: 4,
        minW: 10,
        maxW: gridCols.lg - 20,
        minH: 2,
        isDraggable: false,
      },
      {
        i: 'consoleContainer',
        x: 0,
        y: 4,
        w: gridCols.lg,
        minW: gridCols.lg,
        h: 1
      },
    ]
};

let currentGridLayouts={...defaultGridLayouts};
const ResponsiveReactGridLayout=WidthProvider(Responsive);

const styles=theme => ({
  layout: {
    height: gridHeights.lg
  },
  button: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    float: 'right',
    margin: theme.spacing.unit,
  },
});

class Pastebin extends Component {
  state={
    gridLayouts: {...defaultGridLayouts},
    monaco: null,
    editors: {
      scriptEditor: null,
      documentEditor: null,
      styleEditor: null
    },
    navigatorDecorations: {
      scriptEditor: null,
      documentEditor: null,
      styleEditor: null
    }
  };
  
  
  getCurrentGridLayouts=() => {
    return currentGridLayouts;
  };
  
  restoreGridLayouts=gridLayouts => {
    this.setState({
      gridLayouts: gridLayouts,
    });
    currentGridLayouts=gridLayouts;
  };
  
  resetGridLayout=() => {
    const hack={...defaultGridLayouts};
    hack.lg=[...hack.lg, {
      i: 'dummy',
      x: 0,
      y: 0,
      w: 0,
      h: 0
    }];
    this.restoreGridLayouts(hack);
    setTimeout(() => {
      this.restoreGridLayouts({...defaultGridLayouts});
    }, 0);
    
  };
  
  formatLayout=(layout, oldItem, newItem) => {
    if (newItem.i === "scriptContainer"
      && (oldItem.w !== newItem.w || oldItem.h !== newItem.h)) {
      layout[1].x=layout[0].x + layout[0].w;
      layout[2].x=layout[0].x + layout[0].w;
      
      layout[1].w=gridCols.lg - layout[0].w - layout[3].w;
      layout[2].w=gridCols.lg - layout[0].w - layout[3].w;
      
      if (layout[0].h > layout[1].h) {
        layout[2].h=layout[0].h - layout[1].h;
      } else {
        layout[1].h=layout[1].h - 1;
        layout[2].y=layout[1].y + layout[1].h + 1;
        layout[2].h=1;
      }
      
      layout[3].h=layout[0].h;
      
    }
  };
  
  //layout: Layout, oldItem: LayoutItem, newItem: LayoutItem,
  // placeholder: LayoutItem, e: MouseEvent, element: HTMLElement
  onResizeStart=(layout, oldItem, newItem,
                 placeholder, e, element) => {
    this.formatLayout(layout, oldItem, newItem);
  };
  
  onResize=(layout, oldItem, newItem
            /*, placeholder, e, element*/) => {
    this.formatLayout(layout, oldItem, newItem);
  };
  
  onResizeStop=(layout, oldItem, newItem
                /*, placeholder, e, element*/) => {
    this.formatLayout(layout, oldItem, newItem);
  };
  
  onLayoutChange=(newLayout, newGridLayouts) => {
    currentGridLayouts=newGridLayouts;
    this.resizePlayground();
  };
  
  resizePlayground=() => {
  };
  
  render() {
    const {classes, editorIds}=this.props;
    const {gridLayouts}=this.state;
    return (
      <ResponsiveReactGridLayout
        className={classes.layout}
        layouts={gridLayouts}
        breakpoints={gridBreakpoints}
        cols={gridCols}
        compactType={'vertical'}
        measureBeforeMount={true}
        autoSize={true}
        rowHeight={151}
        onResizeStart={this.onResizeStart}
        onResize={this.onResize}
        onResizeStop={this.onResizeStop}
        onLayoutChange={this.onLayoutChange}
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
        <Paper key="debugContainer">
          DEBUG
          <Button variant="fab" color="primary" aria-label="add"
                  className={classes.button}>
            <AddIcon/>
          </Button>
        </Paper>
        <Paper key="consoleContainer">
          CONSOLE
        </Paper>
      </ResponsiveReactGridLayout>
    );
  }
  
  componentDidMount() {
    const {setResetGridLayout, getResizePlayground}=this.props;
    setResetGridLayout(this.resetGridLayout);
    this.context.store.dispatch(
      pastebinConfigureLayout(
        this.restoreGridLayouts,
        this.getCurrentGridLayouts
      )
    );
    this.resizePlayground=getResizePlayground();
    this.resizePlayground();
  }
}

Pastebin.contextTypes={
  store: PropTypes.object.isRequired
};

Pastebin.propTypes={
  classes: PropTypes.object.isRequired,
  editorIds: PropTypes.object.isRequired,
  setResetGridLayout: PropTypes.func.isRequired,
};

export default withStyles(styles)(Pastebin);
