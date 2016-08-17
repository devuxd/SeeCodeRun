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
import {VisViewer} from '../visViewer/vis-viewer';
import {ConsoleWindow} from '../consoleWindow/console-window';

import {TraceViewController} from '../traceView/trace-view-controller';
import {ExpressionSelection} from '../expressionSelection/expression-selection';
import {TraceSearch} from '../traceSearch/trace-search';
import {TraceSearchHistory} from '../traceSearch/trace-search-history';

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
    this.firebaseManager.eventAggregator = eventAggregator;
    this.domElement = domElement;
    this.navigationBar = new NavigationBar(firebaseManager, eventAggregator);

    this.consoleWindow = new ConsoleWindow(eventAggregator);

    this.jsEditor = new JsEditor(eventAggregator, firebaseManager, aceUtils);
    this.jsGutter = new JsGutter(eventAggregator, this.aceUtils);
    this.htmlEditor = new HtmlEditor(eventAggregator, firebaseManager, aceUtils);
    this.cssEditor  = new CssEditor(eventAggregator, firebaseManager, aceUtils);

    this.htmlViewer = new HtmlViewer(eventAggregator, traceModel);
    this.visViewer  =new VisViewer(eventAggregator, aceUtils, this.jsEditor);

    this.traceViewController = new TraceViewController(eventAggregator, aceUtils, this.jsEditor);
    this.expressionSelection = new ExpressionSelection(eventAggregator);

    this.traceSearch = new TraceSearch(eventAggregator, traceModel, aceUtils);
    this.traceSearchHistory = new TraceSearchHistory(eventAggregator, firebaseManager);
  }

  activate(params) {
    this.firebaseManager.activate(params.id);
    if(params.id){
      this.isPasteBinIdInURL = true;
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
    this.eventAggregator.subscribe("pastebinReady", () =>{
      if(!this.isPasteBinIdInURL){
        this.isPasteBinIdInURL = true;
        window.history.replaceState({}, null, window.location + "#"+ this.firebaseManager.pastebinId);
      }
    });
    this.eventAggregator.subscribe("pastebinError", error =>{
      let errorCode = error.code;
      let errorMessage = error.message;
      if (errorCode === 'auth/operation-not-allowed') {
        alert('You must enable Anonymous auth in the Firebase Console.');
        console.log(errorCode+"\n" +errorMessage);
      } else {
        console.error(error);
      }
    });

    this.navigationBar.attached();

    this.consoleWindow.attached();

    this.jsEditor.attached();
    this.jsGutter.attached();

    this.htmlEditor.attached();
    this.cssEditor.attached();

    this.editors = {
      "#js-container": this.jsEditor,
      "#html-container": this.htmlEditor,
      "#css-container": this.cssEditor
    };

    this.htmlViewer.attached();
    this.visViewer.attached();

    this.traceViewController.attached();
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
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
      self.eventAggregator.publish("activeTabChange", {tabContainerSelector: e.target.href.substring(e.target.href.lastIndexOf("#"))});
    });

    self.eventAggregator.subscribe("activeTabChange", tabEvent=>{
      let activeEditor = this.editors[tabEvent.tabContainerSelector];
      if(activeEditor){
        self.eventAggregator.publish("activeEditorChange", {activeEditor: activeEditor});
      }
    });
    self.eventAggregator.publish("activeEditorChange", {activeEditor: this.jsEditor});
    self.update();
  }

}
