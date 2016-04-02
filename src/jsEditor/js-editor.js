/* global Firepad */
/* global Firebase */
/* global ace */
import {inject} from 'aurelia-framework';
<<<<<<< HEAD
import {EventAggregator} from 'aurelia-event-aggregator';
<<<<<<< HEAD
=======
import {Router} from 'aurelia-router';
>>>>>>> parent of 8e0a935... Merge pull request #57 from tlatoza/feature-30
=======
>>>>>>> parent of 82bf960... Merge pull request #69 from tlatoza/Abdulaziz
import {TraceService} from '../traceService/traceService';
import '../mode-javascript';
import '../theme-chrome';

<<<<<<< HEAD
<<<<<<< HEAD
@inject(EventAggregator)
=======
@inject(EventAggregator, Router)
>>>>>>> parent of 8e0a935... Merge pull request #57 from tlatoza/feature-30
=======
>>>>>>> parent of 82bf960... Merge pull request #69 from tlatoza/Abdulaziz
export class JsEditor {

  constructor(eventAggregator, router) {
    this.eventAggregator = eventAggregator;
    this.router = router;
    this.hasErrors = false;
  }

  activate(params) {
<<<<<<< HEAD
<<<<<<< HEAD
    
    this.pastebinId = params.id;
        
  }

  attached() {
    let editor = ace.edit('aceJsEditorDiv');
=======
    if (params.id) {
      this.pastebinId = params.id;
    } else {
      let baseURL = 'https://seecoderun.firebaseio.com';
      let firebase = new Firebase(baseURL);
      let pastebinId = firebase.push().key();
    }
  }

  attached() {
    let editor = ace.edit('editorDiv');
>>>>>>> parent of 8e0a935... Merge pull request #57 from tlatoza/feature-30
=======
    if (params.id) {
      this.pastebinId = params.id;
    } 
  }

  attached() {
    let editor = ace.edit('jsEditorDiv');
>>>>>>> parent of 82bf960... Merge pull request #69 from tlatoza/Abdulaziz
    this.configureEditor(editor);
    
    this.editor = editor;

    let session = editor.getSession();
    this.configureSession(session);
    this.setupSessionEvents(session);

    let selection = editor.getSelection();
    this.setupSelectionEvents(selection);

    this.session = session;
    this.selection = selection;
    this.firepad = this.createFirepad(editor);
    this.subscribe();
  }

  configureEditor(editor) {
    editor.setTheme('ace/theme/chrome');
    editor.setShowFoldWidgets(false);
  }

  configureSession(session) {
    session.setUseWrapMode(true);
    session.setUseWorker(false);
    session.setMode('ace/mode/javascript');
    session.addGutterDecoration(0, 'label label-info');
  }

  setupSessionEvents(session) {
    let ea = this.eventAggregator;
    let editor = this.editor;

    session.on('change',
      onEditorChanged);

    let editorChangedTimeout;
    
    function onEditorChanged(e) {
      clearTimeout(editorChangedTimeout);
      editorChangedTimeout = setTimeout(function pub() { 
        let syntax = new TraceService().getTrace(editor.getValue());
<<<<<<< HEAD
<<<<<<< HEAD
        let curs = editor.getCursorPosition().row+1;  
       
            // Two events for onEditorChanged 
            
            //This is been used by HtmlViewer  
        ea.publish('onJsEditorChanged', {
            js: editor.getValue(), 
            length: session.getLength(), 
            syntax: syntax,  
            cursor: curs
        });

           // This is reserved for TraceServices
         ea.publish('onEditorChanged', {
            js: editor.getValue(), 
            length: session.getLength(), 
            syntax: syntax,  
            cursor: curs
=======

        ea.publish('onEditorChanged', {
            data: e,
            length: session.getLength(),
            syntax: syntax
>>>>>>> parent of 8e0a935... Merge pull request #57 from tlatoza/feature-30
=======

        ea.publish('onJsEditorChanged', {
            js: editor.getValue(),
            data: e,
            length: session.getLength(),
            syntax: syntax
>>>>>>> parent of 82bf960... Merge pull request #69 from tlatoza/Abdulaziz
        });
      }, 2500);
    }

    this.editorChangedTimeout = editorChangedTimeout;

    session.on('changeAnnotation',
      onAnnotationChanged);

    function onAnnotationChanged() {
      let annotations = session.getAnnotations();
      for (let key in annotations) {
        if (annotations.hasOwnProperty(key) && annotations[key].type === 'error') {
          ea.publish('onAnnotationChanged', {
            hasErrors: true,
            annotation: annotations[key]
          });
        }
      }
      ea.publish('onAnnotationChanged', {
        hasErrors: false,
        annotation: null
      });
    }
  }

  setupSelectionEvents(selection) {
    let ea = this.eventAggregator;

    selection.on('changeCursor',
      onCursorMoved);

    function onCursorMoved(e) {
      ea.publish('onCursorMoved', e);
    }
  }

  createFirepad(editor) {
    let baseURL = 'https://seecoderun.firebaseio.com';
    let firebase = new Firebase(baseURL + '/' + this.pastebinId + '/content/js');

    return Firepad.fromACE(
      firebase,
      editor,
      {
        defaultText: 'go(); \n\nfunction go() {\n  var message = "Hello, world.";\n  console.log(message);\n}'
      });
  }

  subscribe() {
    let ea = this.eventAggregator;
    let hasErrors = this.hasErrors;
    let editor = this.editor;

    ea.subscribe('onEditorChanged', payload => {
      // add code here for subscribe event
    });

    ea.subscribe('onAnnotationChanged', payload => {
      hasErrors = payload.hasErrors;

      if (payload.hasErrors) {
        console.log('has errors at: ' + payload.annotation);
      } else {
        console.log('no errors');
      }
    });

    ea.subscribe('onCursorMoved', payload => {
      // add code here for subscribe event
    });
  }
}

