import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Router} from 'aurelia-router';
import jqxcore     from '../../jqxcore';
import jqxsplitter from '../../jqxsplitter';
import {HtmlEditor} from '../htmlEditor/html-editor';
import {CssEditor} from '../cssEditor/css-editor'
import {JsEditor} from '../jsEditor/js-editor';
import {JsGutter} from '../jsGutter/js-gutter';
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
  }

// TODO: fix the routing bug. See github repo for more information
  activate(params) {
    if (params.id) {
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
    } else {
      let baseURL = 'https://seecoderun.firebaseio.com';
      let firebase = new Firebase(baseURL);
      
      this.pastebinId = firebase.push().key();

      this.router.navigate(this.pastebinId);
    }

        
   }

  attached() {
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
  }



// There is no obvious need for event aggregator in pastebin for now @first pull request.
//   subscribe() {
//     let ea = this.eventAggregator;
    
//     ea.subscribe('onEditorChanged', payload => {
//       // add code for subscribe event
//     });

//     ea.subscribe('onCursorMoved', payload => {
//       // add code for subscribe event
//     });
//   }
// }



}
