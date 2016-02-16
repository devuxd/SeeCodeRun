import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {JsEditor} from './jsEditor/js-editor';
import {JsGutter} from './jsGutter/js-gutter';
import {ConsoleWindow} from './consoleWindow/console-window';

@inject(EventAggregator, JsEditor, JsGutter, ConsoleWindow)
export class Pastebin {

  constructor(eventAggregator, jsEditor, jsGutter, consoleWindow) {
    this.eventAggregator = eventAggregator;
    this.heading = 'Pastebin';
    this.pastebinId = '-KAWJMXcpwoo0kh8-mz6';
    this.jsEditor = jsEditor;
    this.jsEditor.activate({ id: this.pastebinId });
    this.jsGutter = jsGutter;
    this.consoleWindow = consoleWindow;
    this.consoleWindow.activate();
  }

  activate() {
    this.subscribe();
  }

  attached() {
    this.jsEditor.attached();
    this.jsGutter.attached();
  }

  subscribe() {
    let ea = this.eventAggregator;
    
    ea.subscribe('onEditorChanged', payload => {
      console.log(payload);
    });

    ea.subscribe('onCursorMoved', payload => {
      console.log(payload);
    });
  }
}
