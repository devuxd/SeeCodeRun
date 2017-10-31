import React, { Component } from 'react';
import '../styles/pasteBin.css';

class PasteBin extends Component {
  constructor(props){
    super(props);
    this.state={
      monaco: null,
      editors: {
        scriptEditor: null,
        documentEditor: null,
        styleEditor: null
      },
      navigatorDecorations:{
        scriptEditor: null,
        documentEditor: null,
        styleEditor: null
      }

    }
  }
  render() {
    return (
      <div id="container" className="editor" >
      </div>
    );
  }

  onMonacoLoaded(monaco){
    let jsEditor = monaco.editor.create(document.getElementById('container'), {
      value: [
        '"use strict";',
        '',
        "class Chuck {",
        "    greet() {",
        "        return Facts.next();",
        "    }",
        "}",
        'function x() {',
        '\tconsole.log("Hello world!");',
        '}',
        '// press ctrl + space while having the cursor on "mk"',
        '"dependencies":{"mk"}'
      ].join('\n'),
      language: 'javascript',
      glyphMargin: true,
      nativeContextMenu: false
    });

    this.setState({
      monaco: monaco,
      editors: {
        scriptEditor: jsEditor
      }
    });

    this.addNavigators();
    this.addCodeLens();
    this.addCompletionProviders();
    this.addConfigurationDefaults();
  }

  addNavigators(){
    let monaco = this.state.monaco;
    let editor = this.state.editors.scriptEditor;

    let editorDecorations = editor.deltaDecorations([], [
      {
        range: new monaco.Range(3,1,3,1),
        options: {
          isWholeLine: true,
          className: 'myContentClass',
          glyphMarginClassName: 'myGlyphMarginClass'
        }
      }
    ]);

    this.setState({
      navigatorDecorations: {
        scriptEditor: editorDecorations
      }
    });

  }

  addCodeLens(){
    let monaco = this.state.monaco;
    let editor = this.state.editors.scriptEditor;
    var commandId = editor.addCommand(0, function() {
      // services available in `ctx`
      console.log("c", arguments);

    }, '');

    monaco.languages.registerCodeLensProvider('javascript', {
      provideCodeLenses: function(model, token) {
        return [
          {
            range: {
              startLineNumber: 2,
              startColumn: 1,
              endLineNumber: 2,
              endColumn: 1
            },
            id: "First Line",
            command: {
              id: commandId,
              title: "First Line: blaaaaaa",
              content: "bluuuuuuuuu"
            }
          }
        ];
      },
      resolveCodeLens: function(model, codeLens, token) {
        console.log(arguments);
        return codeLens;
      }
    });
  }

  addCompletionProviders() {
    let monaco = this.state.monaco;

    function createDependencyProposals() {
      // returning a static list of proposals, not even looking at the prefix (filtering is done by the Monaco editor),
      // here you could do a server side lookup
      return [
        {
          label: '"lodash"',
          kind: monaco.languages.CompletionItemKind.Function,
          documentation: "The Lodash library exported as Node.js modules.",
          insertText: '"lodash": "*"'
        },
        {
          label: '"express"',
          kind: monaco.languages.CompletionItemKind.Function,
          documentation: "Fast, unopinionated, minimalist web framework",
          insertText: '"express": "*"'
        },
        {
          label: '"mkdirp"',
          kind: monaco.languages.CompletionItemKind.Function,
          documentation: "Recursively mkdir, like <code>mkdir -p</code>",
          insertText: '"mkdirp": "*"'
        }
      ];
    }


    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: function(model, position) {
        // find out if we are completing a property in the 'dependencies' object.
        var textUntilPosition = model.getValueInRange({startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column});
        var match = textUntilPosition.match(/"dependencies"\s*:\s*{\s*("[^"]*"\s*:\s*"[^"]*"\s*,\s*)*("[^"]*)?$/);
        console.log(match);
        if (match) {
          return createDependencyProposals();
        }
        return [];
      }
    });

  }

  addConfigurationDefaults(){
    let monaco = this.state.monaco;
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false
    });

// compiler options
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES6,
      allowNonTsExtensions: true
    });

// extra libraries
    monaco.languages.typescript.javascriptDefaults.addExtraLib([
      'declare class Facts {',
      '    /**',
      '     * Returns the next fact',
      '     */',
      '    static next():string',
      '}',
    ].join('\n'), 'filename/facts.d.ts');


  }

    componentDidMount(){
    // Workaround to sync loading React container and then Monaco
    window.onPasteBinDidMount(this);
  }
}

export default PasteBin;


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
