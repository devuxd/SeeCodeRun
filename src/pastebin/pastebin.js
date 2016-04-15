/* global $ */
import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Router} from 'aurelia-router';
import jqxcore     from '../../jqxcore';
import jqxsplitter from '../../jqxsplitter';
import {HtmlEditor} from '../htmlEditor/html-editor';
import {CssEditor} from '../cssEditor/css-editor';
import {JsEditor} from '../jsEditor/js-editor';
import {JsGutter} from '../jsGutter/js-gutter';
import {HtmlViewer} from '../htmlViewer/html-viewer';
import {Chat} from '../chat/chat';
import {VisViewer} from '../visViewer/vis-viewer';
import {ConsoleWindow} from '../consoleWindow/console-window';
import {TraceViewController} from '../traceView/trace-view-controller';
import {TraceSearch} from '../searchTab/trace-search';

@inject(EventAggregator, Router)
export class Pastebin {

  constructor(eventAggregator, router) {
    this.eventAggregator = eventAggregator;
    this.router = router;
    this.heading = 'Pastebin';
    this.pastebinId ='';
    this.jsEditor = new JsEditor(this.eventAggregator);
    this.jsGutter = new JsGutter(this.eventAggregator);
    this.consoleWindow = new ConsoleWindow(this.eventAggregator);
    this.htmlEditor = new HtmlEditor(this.eventAggregator);
    this.cssEditor  = new CssEditor(this.eventAggregator);
    this.htmlViewer = new HtmlViewer(this.eventAggregator);
    this.visViewer  =new VisViewer(this.eventAggregator);
    this.chat = new Chat();
    this.traceViewController = new TraceViewController(this.eventAggregator);
    this.traceSearch = new TraceSearch(this.eventAggregator);
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
    this.consoleWindow.attached();
    this.jsGutter.attached();
    this.visViewer.attached();
    this.htmlViewer.attached();
    this.chat.attached({id: this.pastebinId});
    this.traceViewController.attached();
    this.traceSearch.attached();

     // Splitter
    $('#mainSplitter').jqxSplitter({ width: '99.8%', height: 760, panels: [{ size: '45%' }] });
    $('#rightSplitter').jqxSplitter({ width: '100%', height: 700, orientation: 'horizontal', panels: [{ size: '80%'}] });      
  }
}
