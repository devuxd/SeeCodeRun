/* global $ */

import {inject, DOM} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Router} from 'aurelia-router';
import {TraceModel} from '../traceService/trace-model';
import {AceUtils} from '../utils/ace-utils';
import {FirebaseManager} from "../persistence/firebase-manager";

import {NavigationBar} from '../layout/navigationBar/navigation-bar';
import {UserList} from '../userList/user-list';

import {HtmlEditor} from '../htmlEditor/html-editor';
import {CssEditor} from '../cssEditor/css-editor';
import {JsEditor} from '../jsEditor/js-editor';
import {JsGutter} from '../jsGutter/js-gutter';
import {HtmlViewer} from '../htmlViewer/html-viewer';
import {HistoryViewer} from '../historyViewer/history-viewer';
import {Chat} from '../chat/chat';
import {VisViewer} from '../visViewer/vis-viewer';
import {ConsoleWindow} from '../consoleWindow/console-window';
import '../../include/jqxcore';
import '../../include/jqxsplitter';

import {TraceViewController} from '../traceView/trace-view-controller';
import {ExpressionSelection} from '../expressionSelection/expression-selection';
import {TraceSearch} from '../traceSearch/trace-search';
import {TraceSearchHistory} from '../traceSearch/trace-search-history';
import {TracePlay} from '../tracePlay/play';


@inject(EventAggregator, Router, TraceModel, AceUtils, FirebaseManager, DOM.Element)
export class Pastebin {

  constructor(eventAggregator, router, traceModel, aceUtils, firebaseManager, domElement) {
    this.eventAggregator = eventAggregator;
    this.router = router;
    this.traceModel = traceModel;
    this.aceUtils = aceUtils;
    this.firebaseManager = firebaseManager;
    this.domElement = domElement;
    this.heading = 'Pastebin';
    this.navigationBar = new NavigationBar();
    this.userList = new UserList(firebaseManager);
    this.jsGutter = new JsGutter(eventAggregator);
    this.consoleWindow = new ConsoleWindow(eventAggregator);
    
    this.jsEditor = new JsEditor(eventAggregator, firebaseManager);
    this.htmlEditor = new HtmlEditor(eventAggregator, firebaseManager);
    this.cssEditor  = new CssEditor(eventAggregator, firebaseManager);
    
    this.htmlEditorHistoryViewer = new HistoryViewer(this.htmlEditor, eventAggregator);
    this.htmlViewer = new HtmlViewer(eventAggregator, traceModel);
    this.visViewer  =new VisViewer(eventAggregator);
    
    this.chat = new Chat(firebaseManager);

    this.traceViewController = new TraceViewController(eventAggregator, aceUtils);
    this.expressionSelection = new ExpressionSelection(eventAggregator);
    this.tracePlay = new TracePlay(eventAggregator, traceModel, aceUtils);
    
    this.traceSearch = new TraceSearch(eventAggregator, traceModel, aceUtils);
    this.traceSearchHistory = new TraceSearchHistory(eventAggregator, firebaseManager);
  }

  activate(params) {
    this.firebaseManager.activate(params.id);
  }

  attached() {
    this.userList.attached();
    
    this.jsEditor.attached();
    this.htmlEditor.attached();
    this.cssEditor.attached();
    
    this.htmlEditorHistoryViewer.attached();
    
    this.consoleWindow.attached();
    this.jsGutter.attached();
    this.visViewer.attached();
    this.htmlViewer.attached();
    this.chat.attached();
    this.traceViewController.attached();

    this.traceSearchHistory.attached();
    this.tracePlay.attached();
    this.traceSearch.attached();
    
    $('#mainSplitter').jqxSplitter({ width: '100%', height: $("#mainContainer").height(), panels: [{ size: '45%' }] });
    $('#rightSplitter').jqxSplitter({ width: '100%', height: $("#mainContainer").height(), orientation: 'horizontal', panels: [{ size: '80%'}] }); 
  
  }

}
