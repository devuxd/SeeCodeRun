import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Router} from 'aurelia-router';
import {JsEditor} from '../jsEditor/js-editor';
import {JsGutter} from '../jsGutter/js-gutter';
import {ConsoleWindow} from '../consoleWindow/console-window';
import {JsSandBox} from '../traceService/js-sandbox';

@inject(EventAggregator, Router, JsEditor, JsGutter, ConsoleWindow, JsSandBox)
export class Pastebin {

  constructor(eventAggregator, router, jsEditor, jsGutter, consoleWindow, jsSandBox) {
    this.eventAggregator = eventAggregator;
    this.router = router;
    this.heading = 'Pastebin';
    this.jsEditor = jsEditor;
    this.jsGutter = jsGutter;
    this.consoleWindow = consoleWindow;
    
    this.jsSandBox = jsSandBox;
  }

  activate(params) {
    if (params.id) {
      let id = params.id;
      this.pastebinId = id;
      this.jsEditor.activate({ id: id });
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
    this.jsSandBox.attached();
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
