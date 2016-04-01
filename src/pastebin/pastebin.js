import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Router} from 'aurelia-router';
import {JsEditor} from '../jsEditor/js-editor';
import {JsGutter} from '../jsGutter/js-gutter';
<<<<<<< HEAD
<<<<<<< HEAD
import {HtmlViewer} from'../htmlViewer/html-viewer';
import {VisViewer} from '../visViewer/vis-viewer'
import {ConsoleWindow} from '../consoleWindow/console-window'
@inject(EventAggregator, Router, JsEditor, HtmlEditor, CssEditor,JsGutter, HtmlViewer, VisViewer, ConsoleWindow)//,  JsEditor,JsGutter)
export class Pastebin {

  constructor(eventAggregator, router, jsEditor,htmlEditor,cssEditor,jsGutter,htmlViewer, visViewer, consoleWindow) {
=======
import {ConsoleWindow} from '../consoleWindow/console-window';

@inject(EventAggregator, Router, JsEditor, JsGutter, ConsoleWindow)
export class Pastebin {

  constructor(eventAggregator, router, jsEditor, jsGutter, consoleWindow) {
>>>>>>> parent of 8e0a935... Merge pull request #57 from tlatoza/feature-30
    this.eventAggregator = eventAggregator;
    this.router = router;
    this.heading = 'Pastebin';
    this.jsEditor = jsEditor;
<<<<<<< HEAD
    this.htmlEditor = htmlEditor;
    this.cssEditor= cssEditor;
    this.jsGutter = jsGutter;
    this.pastebinId ='';
    this.htmlViewer=htmlViewer;
    this.visViewer=visViewer;
    this.consoleWindow=consoleWindow;
=======
    this.jsGutter = jsGutter;
    this.consoleWindow = consoleWindow;
>>>>>>> parent of 8e0a935... Merge pull request #57 from tlatoza/feature-30
=======
import {ConsoleWindow} from '../consoleWindow/console-window';
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
>>>>>>> parent of 82bf960... Merge pull request #69 from tlatoza/Abdulaziz
  }

  activate(params) {
    if (params.id) {
<<<<<<< HEAD
<<<<<<< HEAD
        this.pastebinId = params.id;
        this.jsEditor.activate({ id: this.pastebinId }); 
        this.htmlEditor.activate({ id: this.pastebinId }); 
        this.cssEditor.activate({ id: this.pastebinId }); 
=======
      let id = params.id;
      this.pastebinId = id;
      this.jsEditor.activate({ id: id });
>>>>>>> parent of 8e0a935... Merge pull request #57 from tlatoza/feature-30
=======
      let id = params.id;
      this.pastebinId = id;
      this.jsEditor.activate({ id: id });
      this.htmlEditor.activate({ id: id });
      this.cssEditor.activate({ id: id });
>>>>>>> parent of 82bf960... Merge pull request #69 from tlatoza/Abdulaziz
    } else {
      let baseURL = 'https://seecoderun.firebaseio.com';
      let firebase = new Firebase(baseURL);
      
      let id = firebase.push().key();
      this.router.navigateToRoute('pastebin', { id: id });
    }
    
    this.subscribe();
  }

  attached() {
<<<<<<< HEAD
<<<<<<< HEAD
      
      // Constructing the pastebin 
      this.jsEditor.attached();
      this.jsGutter.attached();      
      this.htmlEditor.attached();
      this.cssEditor.attached();
      this.visViewer.attached();
      this.htmlViewer.attached();
      this.consoleWindow.attached();

       // Splitter
      $('#mainSplitter').jqxSplitter({ width: '99.8%', height: 760, panels: [{ size: '45%' }] });
      $('#rightSplitter').jqxSplitter({ width: '100%', height: 700, orientation: 'horizontal', panels: [{ size: '80%'}] });      
=======
    this.jsEditor.attached();
    this.jsGutter.attached();
    this.consoleWindow.attached();
>>>>>>> parent of 8e0a935... Merge pull request #57 from tlatoza/feature-30
=======
    this.jsEditor.attached();
    this.jsGutter.attached();
    this.consoleWindow.attached();
    this.htmlEditor.attached();
    this.cssEditor.attached();
>>>>>>> parent of 82bf960... Merge pull request #69 from tlatoza/Abdulaziz
  }

  subscribe() {
    let ea = this.eventAggregator;
    
    ea.subscribe('onEditorChanged', payload => {
      // add code for subscribe event
    });

<<<<<<< HEAD


=======
    ea.subscribe('onCursorMoved', payload => {
      // add code for subscribe event
    });
  }
>>>>>>> parent of 82bf960... Merge pull request #69 from tlatoza/Abdulaziz
}
