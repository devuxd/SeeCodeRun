import React, {Component} from 'react';
import {Responsive, WidthProvider} from 'react-grid-layout';
import Editor from '../components/Editor';
import Playground from '../components/Playground';

import {withStyles} from 'material-ui/styles';
import '../styles/Pastebin.css';

import Paper from 'material-ui/Paper';
import Button from 'material-ui/Button';
import AddIcon from 'material-ui-icons/Add';
import PropTypes from "prop-types";

import _ from 'lodash';

const gridBreakpoints = {lg: 1200};
const gridCols = {lg: 120};
const gridRowHeight = {lg: 50};
const gridLayouts = {
  lg:
    [
      {i: 'scriptContainer', x: 0, y: 0, w: 50, h: 4, minW: 10, maxW: gridCols.lg - 20, minH: 2, isDraggable: false},
      {i: 'htmlContainer', x: 50, y: 0, w: 30, h: 2, minW: 10, maxW: gridCols.lg - 20, minH: 1, isDraggable: false},
      {i: 'cssContainer', x: 50, y: 2, w: 30, h: 2, minW: 10, maxW: gridCols.lg - 20, minH: 1, isDraggable: false},
      {i: 'debugContainer', x: 80, y: 0, w: 40, h: 4, minW: 10, maxW: gridCols.lg - 20, minH: 2, isDraggable: false},
      {i: 'consoleContainer', x: 0, y: 4, w: gridCols.lg, minW: gridCols.lg, h: 1},
      {i: 'outputContainer', x: 0, y: 5, w: gridCols.lg, h: 4, isDraggable: false}
    ]
};
const ResponsiveReactGridLayout = WidthProvider(Responsive);

const styles = theme => ({
  layout: {
    height: '1500px'
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
  constructor(props) {
    super(props);
    this.state = {
      gridLayouts: gridLayouts,
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

    }
  }

  //layout: Layout, oldItem: LayoutItem, newItem: LayoutItem,placeholder: LayoutItem, e: MouseEvent, element: HTMLElement
  onResizeStart(layout, oldItem, newItem,
                placeholder, e, element) {
    // console.log("onResizeStart", oldItem, newItem, layout);
    this.resizeEditorsAndDebugCells(layout, oldItem, newItem);
  }

  resizeEditorsAndDebugCells(layout, oldItem, newItem) {

    if (newItem.i === "scriptContainer" && (oldItem.w !== newItem.w || oldItem.h !== newItem.h)) {
      layout[1].x = layout[0].x + layout[0].w;
      layout[2].x = layout[0].x + layout[0].w;

      layout[1].w = gridCols.lg - layout[0].w - layout[3].w;
      layout[2].w = gridCols.lg - layout[0].w - layout[3].w;

      if (layout[0].h > layout[1].h) {
        layout[2].h = layout[0].h - layout[1].h;
      } else {
        layout[1].h = layout[1].h - 1;
        layout[2].y = layout[1].y + layout[1].h + 1;
        layout[2].h = 1;
      }

      layout[3].h = layout[0].h;

    }

  }

  onResize(layout, oldItem, newItem,
           placeholder, e, element) {
    // console.log("onResizeStop", oldItem, newItem, layout);
    this.resizeEditorsAndDebugCells(layout, oldItem, newItem);
  }

  onResizeStop(layout, oldItem, newItem,
               placeholder, e, element) {

    this.resizeEditorsAndDebugCells(layout, oldItem, newItem);

  }

  onLayoutChange = newLayout => {
    const layout = this.context.store.getState().pastebinReducer.layout;
    if (_.isEqual(layout, newLayout)) {
      //this.context.store.dispatch(layoutChange(layout));
    }
  };

  //ScriptEditor
  render() {
    const classes = this.props.classes;
    return (
      <ResponsiveReactGridLayout className={classes.layout}
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
          <Editor editorId={'js'} />
        </Paper>
        <Paper key="htmlContainer">
          <Editor editorId={'html'} />
        </Paper>
        <Paper key="cssContainer">
          <Editor editorId={'css'} />
        </Paper>
        <Paper key="debugContainer">
          DEBUG
          <Button fab color="primary" aria-label="add" className={classes.button}>
            <AddIcon/>
          </Button>
        </Paper>
        <Paper key="consoleContainer">
          CONSOLE
        </Paper>
        <Paper key="outputContainer">
          <Playground/>
        </Paper>
      </ResponsiveReactGridLayout>
    );
  }
}

PasteBin.contextTypes = {
  store: PropTypes.object.isRequired
};

PasteBin.propTypes = {
  classes: PropTypes.object.isRequired,
};


export default withStyles(styles)(PasteBin);


// /* global Split */
// import {inject} from 'aurelia-framework';
// import {EventAggregator} from 'aurelia-event-aggregator';
// import {Router} from 'aurelia-router';
//
// import {TraceModel} from '../traceService/trace-model';
// import {AceUtils} from '../utils/ace-utils';
// import {FirebaseManager} from "../persistence/firebase-manager";
//
// import {NavigationBar} from '../navigationBar/navigation-bar';
//
// import {HtmlEditor} from '../htmlEditor/html-editor';
// import {CssEditor} from '../cssEditor/css-editor';
// import {JsEditor} from '../jsEditor/js-editor';
// import {JsGutter} from '../jsGutter/js-gutter';
// import {HtmlViewer} from '../htmlViewer/html-viewer';
// import {VisViewer} from '../visViewer/vis-viewer';
// import {ConsoleWindow} from '../consoleWindow/console-window';
//
// import {TraceViewController} from '../traceView/trace-view-controller';
// import {ExpressionSelection} from '../expressionSelection/expression-selection';
// import {TraceSearch} from '../traceSearch/trace-search';
// import {TraceSearchHistory} from '../traceSearch/trace-search-history';
//
// import {Searcher} from '../searcher/searcher';
// import {GraphicalAnalyzer} from '../visualAnalysis/graphical-analyzer';
//
// import $ from 'jquery';
// import {resizable} from 'jquery-ui';
//
// @inject(EventAggregator, Router, TraceModel, AceUtils, FirebaseManager)
// export class Pastebin {
//   heading = 'Pastebin';
//
//   constructor(eventAggregator, router, traceModel, aceUtils, firebaseManager) {
//     this.eventAggregator = eventAggregator;
//     this.router = router;
//     this.traceModel = traceModel;
//     this.aceUtils = aceUtils;
//     this.firebaseManager = firebaseManager;
//     this.navigationBar = new NavigationBar(firebaseManager, eventAggregator);
//
//     this.consoleWindow = new ConsoleWindow(eventAggregator);
//
//     this.jsEditor = new JsEditor(eventAggregator, firebaseManager, aceUtils);
//     this.jsGutter = new JsGutter(eventAggregator, this.aceUtils);
//     this.htmlEditor = new HtmlEditor(eventAggregator, firebaseManager, aceUtils);
//     this.cssEditor = new CssEditor(eventAggregator, firebaseManager, aceUtils);
//
//     this.htmlViewer = new HtmlViewer(eventAggregator, traceModel);
//     this.visViewer = new VisViewer(eventAggregator, aceUtils, this.jsEditor);
//
//     this.traceViewController = new TraceViewController(eventAggregator, aceUtils, this.jsEditor);
//     this.expressionSelection = new ExpressionSelection(eventAggregator);
//
//     this.traceSearch = new TraceSearch(eventAggregator, traceModel, aceUtils);
//     this.traceSearchHistory = new TraceSearchHistory(eventAggregator, firebaseManager);
//
//     this.searcher = new Searcher(eventAggregator, firebaseManager);
//     this.graphicalAnalyzer =  new GraphicalAnalyzer(eventAggregator);
//   }
//
//   activate(params) {
//     let pastebinId = null;
//     if (params.id) {
//       let copyAndId = params.id.split(":");
//       if (copyAndId[0] === "") {
//         let parentPastebinId = copyAndId[1];
//         pastebinId = this.firebaseManager.copyPastebinById(parentPastebinId);
//         let windowLocation = window.location.toString().split("#")[0];
//         window.history.replaceState({}, null, windowLocation + "#" + pastebinId);
//       } else {
//         pastebinId = params.id;
//       }
//     }
//     this.firebaseManager.activate(pastebinId);
//     if (!pastebinId) {
//       window.history.replaceState({}, null, window.location + "#" + this.firebaseManager.pastebinId);
//     }
//   }
//
//   update() {
//     let editorHeight = $("#main-splitter-left").height() - $("#codeTabs").height();
//     let layout = {editorHeight: editorHeight};
//     this.eventAggregator.publish("windowResize", layout);
//     this.eventAggregator.publish("seePanelBodyResize", layout);
//
//   }
//
//   attached() {
//     let self = this;
//     $(window).on('resize', () => {
//       self.update();
//     });
//
//     this.eventAggregator.subscribe("jsGutterContentUpdate", () => {
//       setTimeout(self.update(), 500);
//     });
//
//     this.navigationBar.attached();
//
//     this.consoleWindow.attached();
//
//     this.jsEditor.attached();
//     this.jsGutter.attached();
//
//     this.htmlEditor.attached();
//     this.cssEditor.attached();
//
//     this.editors = {
//       "#js-container": this.jsEditor,
//       "#html-container": this.htmlEditor,
//       "#css-container": this.cssEditor
//     };
//
//     this.htmlViewer.attached();
//     this.visViewer.attached();
//
//     this.traceViewController.attached();
//     this.traceSearch.attached();
//     this.traceSearchHistory.attached();
//
//     this.searcher.attached();
//     this.graphicalAnalyzer.attached();
//
//     this.mainSplitterOptions = {
//       sizes: [60, 40],
//       gutterSize: 3,
//       cursor: 'col-resize',
//       minSize: 250
//     };
//     Split(['#main-splitter-left', '#main-splitter-right'], this.mainSplitterOptions);
//
//     this.rightSplitterOptions = {
//       direction: 'vertical',
//       sizes: [85, 15],
//       gutterSize: 3,
//       cursor: 'row-resize',
//       minSize: 150,
//       onDrag: function Pastebin_rightSplitterOptions_onDragEnd() {
//         self.eventAggregator.publish("rightSplitterResize");
//       }
//     };
//     Split(['#right-splitter-top', '#right-splitter-bottom'], this.rightSplitterOptions);
//
//     this.$jsEditorCodeOptions = {
//       containment: "parent",
//       autoHide: false,
//       handles: 'ew'
//     };
//
//     let $jsEditorCode = $("#js-editor-code");
//
//     $jsEditorCode.resizable(this.$jsEditorCodeOptions);
//     let $codeSection = $("#code-section");
//     let jsEditorWidth = $codeSection.width() * .8;
//     $jsEditorCode.width(jsEditorWidth);
//
//     let $panelHeadingTitles = $('.panel-heading-title');
//     $panelHeadingTitles.click();
//
//     self.eventAggregator.publish("panelHeadingsLoaded", $panelHeadingTitles);
//     $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
//       self.eventAggregator.publish("activeTabChange", {tabContainerSelector: e.target.href.substring(e.target.href.lastIndexOf("#"))});
//     });
//
//     self.eventAggregator.subscribe("activeTabChange", tabEvent=> {
//       let activeEditor = this.editors[tabEvent.tabContainerSelector];
//       if (activeEditor) {
//         self.eventAggregator.publish("activeEditorChange", {activeEditor: activeEditor});
//       }
//     });
//     self.eventAggregator.publish("activeEditorChange", {activeEditor: this.jsEditor});
//     self.update();
//   }
//
// }
