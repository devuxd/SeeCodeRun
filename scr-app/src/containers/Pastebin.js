import React, {Component} from 'react';
import ReactDom from 'react-dom';
import PropTypes from "prop-types";
import {Responsive, WidthProvider} from 'react-grid-layout';
import Paper from 'material-ui/Paper';
import Button from 'material-ui/Button';
import AddIcon from 'material-ui-icons/Add';
import {withStyles} from 'material-ui/styles';

import '../styles/Pastebin.css';
import Editor from './Editor';
import Playground from './Playground';
import {pastebinConfigureLayout} from "../redux/modules/pastebin";
import {getEditorIds} from "../seecoderun/AppManager";
import ReactDOM from "react-dom";

const gridBreakpoints={lg: 1200};
const gridCols={lg: 120};
const gridHeights={lg: '1200px'};
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
        isDraggable: false
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
        isDraggable: false
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
        isDraggable: false
      },
      {
        i: 'consoleContainer',
        x: 0,
        y: 4,
        w: gridCols.lg,
        minW: gridCols.lg,
        h: 1
      },
      {
        i: 'outputContainer',
        x: 0,
        y: 5,
        w: gridCols.lg,
        h: 4,
        isDraggable: false
      }
    ]
};

let currentGridLayouts=defaultGridLayouts;
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

class PasteBin extends Component {
  state={
    height: 1200,
    gridLayouts: currentGridLayouts,
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
  
  restoreGridLayouts=gridLayouts => {
    currentGridLayouts=gridLayouts;
    this.setState({
      gridLayouts: currentGridLayouts
    });
  };
  
  getCurrentGridLayouts=() => {
    return currentGridLayouts;
  };
  
  componentWillMount() {
    this.context.store.dispatch(
      pastebinConfigureLayout(
        this.restoreGridLayouts,
        this.getCurrentGridLayouts)
    );
  }
  
  //layout: Layout, oldItem: LayoutItem, newItem: LayoutItem,
  // placeholder: LayoutItem, e: MouseEvent, element: HTMLElement
  onResizeStart(layout, oldItem, newItem,
                placeholder, e, element) {
    // console.log("onResizeStart", oldItem, newItem, layout);
    this.resizeEditorsAndDebugCells(layout, oldItem, newItem);
  }
  
  resizeEditorsAndDebugCells(layout, oldItem, newItem) {
    
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
    
  }
  
  onResize(layout, oldItem, newItem
           /*, placeholder, e, element*/) {
    this.resizeEditorsAndDebugCells(layout, oldItem, newItem);
  }
  
  onResizeStop(layout, oldItem, newItem
               /*, placeholder, e, element*/) {
    this.resizeEditorsAndDebugCells(layout, oldItem, newItem);
  }
  
  onLayoutChange=(newLayout, newGridLayouts) => {
    currentGridLayouts=newGridLayouts;
  };
  
  mounted=false;
  
  componentDidMount() {
    this.mounted=true;
    
    window.addEventListener("resize", this.onWindowResize);
    // Call to properly set the breakpoint and resize the elements.
    // Note that if you're doing a full-width element, this can get a little wonky if a scrollbar
    // appears because of the grid. In that case, fire your own resize event, or set `overflow: scroll` on your body.
    this.onWindowResize();
  }
  
  componentWillUnmount() {
    this.mounted=false;
    window.removeEventListener("resize", this.onWindowResize);
  }
  
  onWindowResize=() => {
    if (!this.mounted) return;
    // eslint-disable-next-line
    const node=ReactDOM.findDOMNode(this); // Flow casts this to Text | Element
    if (node instanceof HTMLElement)
      this.setState({height: node.offsetHeight});
  };
  
  render() {
    const editorIds=getEditorIds();
    const classes=this.props.classes;
    const {gridLayouts, height}=this.state;
    const heightChanges={
      height: height + 'px'
    };
    console.log(heightChanges);
    return (
      <ResponsiveReactGridLayout
       // className={classes.layout}
        styles={heightChanges}
        layouts={gridLayouts}
        breakpoints={gridBreakpoints}
        cols={gridCols}
        compactType={'vertical'}
        measureBeforeMount={true}
        autoSize={true}
        rowHeight={151}
        onResizeStart={this.onResizeStart.bind(this)}
        onResize={this.onResize.bind(this)}
        onResizeStop={this.onResizeStop.bind(this)}
        onLayoutChange={this.onLayoutChange}
      >
        <Paper key="scriptContainer">
          <Editor editorId={editorIds['js']} observeMouseEvents={true}/>
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
        <Paper key="outputContainer">
          <Playground editorIds={editorIds}/>
        </Paper>
      </ResponsiveReactGridLayout>
    );
  }
}

PasteBin.contextTypes={
  store: PropTypes.object.isRequired
};

PasteBin.propTypes={
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(PasteBin);
