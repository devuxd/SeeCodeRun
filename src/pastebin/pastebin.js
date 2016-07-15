/* global Split */
import {inject, DOM} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Router} from 'aurelia-router';

import {TraceModel} from '../traceService/trace-model';
import {AceUtils} from '../utils/ace-utils';
import {FirebaseManager} from "../persistence/firebase-manager";

import {NavigationBar} from '../navigationBar/navigation-bar';

import {HtmlEditor} from '../htmlEditor/html-editor';
import {CssEditor} from '../cssEditor/css-editor';
import {JsEditor} from '../jsEditor/js-editor';
import {JsGutter} from '../jsGutter/js-gutter';
import {HtmlViewer} from '../htmlViewer/html-viewer';
import {HistoryViewer} from '../historyViewer/history-viewer';
import {VisViewer} from '../visViewer/vis-viewer';
import {ConsoleWindow} from '../consoleWindow/console-window';

import {TraceViewController} from '../traceView/trace-view-controller';
import {ExpressionSelection} from '../expressionSelection/expression-selection';
import {TraceSearch} from '../traceSearch/trace-search';
import {TraceSearchHistory} from '../traceSearch/trace-search-history';
import {TracePlay} from '../tracePlay/play';

import {customElement} from 'aurelia-framework';

import $ from 'jquery';
import { resizable } from 'jquery-ui';

@customElement('pastebin')
@inject(EventAggregator, Router, TraceModel, AceUtils, FirebaseManager, DOM.Element)
export class Pastebin {
  heading = 'Pastebin';

  constructor(eventAggregator, router, traceModel, aceUtils, firebaseManager, domElement) {
    this.eventAggregator = eventAggregator;
    this.router = router;
    this.traceModel = traceModel;
    this.aceUtils = aceUtils;
    this.firebaseManager = firebaseManager;
    this.domElement = domElement;
    this.navigationBar = new NavigationBar(firebaseManager);

    this.consoleWindow = new ConsoleWindow(eventAggregator);

    this.jsEditor = new JsEditor(eventAggregator, firebaseManager, aceUtils);
    this.jsGutter = new JsGutter(eventAggregator, this.aceUtils);
    this.htmlEditor = new HtmlEditor(eventAggregator, firebaseManager, aceUtils);
    this.cssEditor  = new CssEditor(eventAggregator, firebaseManager, aceUtils);

    this.htmlEditorHistoryViewer = new HistoryViewer(this.htmlEditor, eventAggregator);
    this.htmlViewer = new HtmlViewer(eventAggregator, traceModel);
    this.visViewer  =new VisViewer(eventAggregator);

    this.traceViewController = new TraceViewController(eventAggregator, aceUtils, this.jsEditor);
    this.expressionSelection = new ExpressionSelection(eventAggregator);
    this.tracePlay = new TracePlay(eventAggregator, traceModel, aceUtils);

    this.traceSearch = new TraceSearch(eventAggregator, traceModel, aceUtils);
    this.traceSearchHistory = new TraceSearchHistory(eventAggregator, firebaseManager);
  }

  activate(params) {
    this.firebaseManager.activate(params.id);
    if(!params.id){
      window.history.replaceState({}, null, window.location + "#"+ this.firebaseManager.pastebinId);
    }
  }

  update(){
    let editorHeight = $("#main-splitter-left").height() - $("#codeTabs").height();
    let layout = {editorHeight: editorHeight};
    this.eventAggregator.publish("windowResize", layout);
  }

  attached() {
    let self = this;
    $(window).on('resize', windowResize => { self.update(); });

    this.eventAggregator.subscribe("jsGutterContentUpdate", payload =>{ setTimeout(self.update(), 500); });

    this.navigationBar.attached();

    this.consoleWindow.attached();

    this.jsEditor.attached();
    this.jsGutter.attached();

    this.htmlEditor.attached();
    this.cssEditor.attached();

    this.htmlEditorHistoryViewer.attached();

    this.htmlViewer.attached();
    this.visViewer.attached();

    this.traceViewController.attached();
    this.tracePlay.attached();
    this.traceSearch.attached();
    this.traceSearchHistory.attached();

    this.mainSplitterOptions = {
          sizes: [60, 40],
          gutterSize: 3,
          cursor: 'col-resize',
          minSize: 250
    };
    Split(['#main-splitter-left', '#main-splitter-right'], this.mainSplitterOptions);

    this.rightSplitterOptions = {
          direction: 'vertical',
          sizes: [85, 15],
          gutterSize: 3,
          cursor: 'row-resize',
          minSize: 50
    };
    Split(['#right-splitter-top', '#right-splitter-bottom'], this.rightSplitterOptions);

    this.$jsEditorCodeOptions = {
            containment: "parent",
            autoHide: false,
            handles: 'ew'
    };

    let $jsEditorCode = $("#js-editor-code");

    $jsEditorCode.resizable(this.$jsEditorCodeOptions);

    let $panelHeadingTitles = $('.panel-heading-title');
    $panelHeadingTitles.click();
    self.update();
  }

}
