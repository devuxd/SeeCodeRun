import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Router} from 'aurelia-router';
import {JsEditor} from '../jsEditor/js-editor';
import {JsGutter} from '../jsGutter/js-gutter';
import {ConsoleWindow} from '../consoleWindow/console-window';
import {Chat} from '../chat/chat';

@inject(EventAggregator, Router, JsEditor, JsGutter, ConsoleWindow)
export class Pastebin {

  constructor(eventAggregator, router, jsEditor, jsGutter, consoleWindow) {
    this.eventAggregator = eventAggregator;
    this.router = router;
    this.heading = 'Pastebin';
    this.jsEditor = jsEditor;
    this.jsGutter = jsGutter;
    this.consoleWindow = consoleWindow;
    
  }

  activate(params) {
    let baseURL = 'https://seecoderun.firebaseio.com';
    if (params.id) {
      let id = params.id;
      this.pastebinId = id;
      this.jsEditor.activate({ id: id });
      this.chat = new Chat(baseURL, this.pastebinId);
    } else {
      
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
    this.chat.attached();
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
