/* global Firebase */
/* global $ */
import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Router} from 'aurelia-router';

import {HtmlEditor} from '../htmlEditor/html-editor';
import {CssEditor} from '../cssEditor/css-editor';
import {JsEditor} from '../jsEditor/js-editor';
import {JsGutter} from '../jsGutter/js-gutter';
import {HtmlViewer} from '../htmlViewer/html-viewer';
import {HistoryViewer} from '../historyViewer/history-viewer';
import {Chat} from '../chat/chat';
import {VisViewer} from '../visViewer/vis-viewer';
import {ConsoleWindow} from '../consoleWindow/console-window';
import '/jqxcore';
import '/jqxsplitter';
import {TraceModel} from '../traceService/trace-model';
import {TraceViewController} from '../traceView/trace-view-controller';
import {TraceSearch} from '../searchTab/trace-search';
import {AceUtils} from '../utils/ace-utils';
import {TraceSearchHistory} from '../searchTab/trace-search-history';

@inject(EventAggregator, Router, TraceModel, AceUtils)
export class Pastebin {

  constructor(eventAggregator, router, traceModel, aceUtils) {
    this.eventAggregator = eventAggregator;
    this.router = router;
    this.traceModel = traceModel;
    this.aceUtils = aceUtils;
    this.heading = 'Pastebin';
    this.pastebinId ='';
    this.jsEditor = new JsEditor(this.eventAggregator);
    this.jsGutter = new JsGutter(this.eventAggregator);
    this.consoleWindow = new ConsoleWindow(this.eventAggregator);
    this.htmlEditor = new HtmlEditor(this.eventAggregator);
    this.cssEditor  = new CssEditor(this.eventAggregator);
    
    this.htmlEditorHistoryViewer = new HistoryViewer(this.htmlEditor, this.eventAggregator);
    this.htmlViewer = new HtmlViewer(this.eventAggregator, this.traceModel);
    
    this.visViewer  =new VisViewer(this.eventAggregator);
    this.chat = new Chat();
    this.traceViewController = new TraceViewController(this.eventAggregator, this.traceModel, this.aceUtils);
    this.traceSearch = new TraceSearch(this.eventAggregator, this.traceModel, this.aceUtils);
    this.traceSearchHistory = new TraceSearchHistory(this.eventAggregator, this.traceModel);
  }

  activate(params) {
    if (params.id) {
      let id = params.id;
      this.pastebinId = id;
      this.jsEditor.activate({ id: id });
      this.htmlEditor.activate({ id: id });
      this.cssEditor.activate({ id: id });
      this.chat.activate({ id: id });
    } else {
      let baseURL = 'https://seecoderun.firebaseio.com';
      let firebase = new Firebase(baseURL);
      
      this.pastebinId = firebase.push().key();
      this.router.navigateToRoute('pastebin', {id: this.pastebinId});
    }
    
  }

  attached() {
    this.jsEditor.attached({id: this.pastebinId});
    this.htmlEditor.attached({id: this.pastebinId});
    this.cssEditor.attached({id: this.pastebinId});
    
    this.htmlEditorHistoryViewer.attached();
    
    this.consoleWindow.attached();
    this.jsGutter.attached();
    this.visViewer.attached();
    this.htmlViewer.attached();
    this.chat.attached({id: this.pastebinId});
    this.traceViewController.attached();
    this.traceSearchHistory.attached({id: this.pastebinId});
    this.traceSearch.attached(this.jsEditor.editor);

    $('#mainSplitter').jqxSplitter({ width: '99.8%', height: 760, panels: [{ size: '45%' }] });
    $('#rightSplitter').jqxSplitter({ width: '100%', height: 750, orientation: 'horizontal', panels: [{ size: '80%'}] });      
  }
}
