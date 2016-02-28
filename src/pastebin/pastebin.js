import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Router} from 'aurelia-router';
import {JsEditor} from '../jsEditor/js-editor';
import {JsGutter} from '../jsGutter/js-gutter';
import {ConsoleWindow} from '../consoleWindow/console-window';
import {HtmlEditor} from '../htmlEditor/html-editor';
import {CssEditor} from '../cssEditor/css-editor';
import {HtmlViewer} from '../htmlViewer/html-viewer';

@inject(EventAggregator, Router, JsEditor, JsGutter, ConsoleWindow, HtmlEditor, CssEditor, HtmlViewer)
export class Pastebin {

  constructor(eventAggregator, router, jsEditor, jsGutter, consoleWindow, htmlEditor, cssEditor, htmlViewer) {
    this.eventAggregator = eventAggregator;
    this.router = router;
    this.heading = 'Pastebin';
    this.jsEditor = jsEditor;
    this.jsGutter = jsGutter;
    this.consoleWindow = consoleWindow;
    this.htmlEditor = htmlEditor;
    this.cssEditor = cssEditor;
    this.htmlViewer = htmlViewer;
  }

  activate(params) {
    if (params.id) {
      let id = params.id;
      this.pastebinId = id;
      this.jsEditor.activate({ id: id });
      this.htmlEditor.activate({ id: id });
      this.cssEditor.activate({ id: id });
    } else {
      let baseURL = 'https://seecoderun.firebaseio.com';
      let firebase = new Firebase(baseURL);
      
      let id = firebase.push().key();
      this.router.navigateToRoute('pastebin', { id: id });
    }
    
    this.subscribe();
  }

  attached() {
    this.jsEditor.attached();
    this.jsGutter.attached();
    this.consoleWindow.attached();
    this.htmlEditor.attached();
    this.cssEditor.attached();
  }

  subscribe() {
    let ea = this.eventAggregator;
    
    ea.subscribe('onEditorChanged', payload => {
      // add code for subscribe event
    });

    ea.subscribe('onCursorMoved', payload => {
      // add code for subscribe event
    });
  }
}
