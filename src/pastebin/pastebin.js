import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Router} from 'aurelia-router';
import {JsEditor} from '../jsEditor/js-editor';
import {JsGutter} from '../jsGutter/js-gutter';
import {ConsoleWindow} from '../consoleWindow/console-window';
import {Chat} from '../chat/chat';
import {HtmlEditor} from '../htmlEditor/html-editor';
import {CssEditor} from '../cssEditor/css-editor';
import {HtmlViewer} from '../htmlViewer/html-viewer';

@inject(Router)
export class Pastebin {

  constructor(router) {
    this.eventAggregator = new EventAggregator();
    this.router = router;
    this.heading = 'Pastebin';
    this.jsEditor = new JsEditor(this.eventAggregator);
    this.jsGutter = new JsGutter(this.eventAggregator);
    this.consoleWindow = new ConsoleWindow(this.eventAggregator);
    this.htmlEditor = new HtmlEditor(this.eventAggregator);
    this.cssEditor = new CssEditor(this.eventAggregator);
    this.htmlViewer = new HtmlViewer(this.eventAggregator);
  }

  activate(params) {
    let baseURL = 'https://seecoderun.firebaseio.com';
    if (params.id) {
      let id = params.id;
      this.pastebinId = id;
      this.jsEditor.activate({ id: id });
      this.chat = new Chat(baseURL, this.pastebinId);
      this.htmlEditor.activate({ id: id });
      this.cssEditor.activate({ id: id });
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
