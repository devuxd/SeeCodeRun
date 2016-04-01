/* global Firepad */
/* global Firebase */
/* global ace */
import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
<<<<<<< HEAD
=======
import {Router} from 'aurelia-router';
>>>>>>> parent of 8e0a935... Merge pull request #57 from tlatoza/feature-30
import {TraceService} from '../traceService/traceService';
import '../mode-javascript';
import '../theme-chrome';

<<<<<<< HEAD
@inject(EventAggregator)
=======
@inject(EventAggregator, Router)
>>>>>>> parent of 8e0a935... Merge pull request #57 from tlatoza/feature-30
export class JsEditor {

  constructor(eventAggregator, router) {
    this.eventAggregator = eventAggregator;
    this.router = router;
    this.hasErrors = false;
  }

  activate(params) {
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
    this.configureEditor(editor);
    
    this.editor = editor;
    
    let session = editor.getSession();
    this.configureSession(session);

    let selection = editor.getSelection();
    this.session = session;
    this.selection = selection;
    this.firepad = this.createFirepad(editor);        
    this.setupSessionEvents(session);
    this.subscribe(session);
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
      

      // Copy event for Vis-viewer
      editor.on('copy', expression =>
      {
           ea.publish('onEditorCopy', {
            expression: expression,
            row: editor.getCursorPosition().row +1,
            column: editor.getCursorPosition().column+1
            
      });});

       //For gutter
    session.selection.on
           ('changeCursor', () => {

           let info =
           {
              cursor : this.editor.getCursorPosition().row+1,
              lastVisibleRow: session.getLength()
               
           }; 
            ea.publish('onCursorMoved', info );
          });
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

  subscribe(session) {
    let ea = this.eventAggregator;
    let hasErrors = this.hasErrors;
    let editor = this.editor;


    ea.subscribe('onAnnotationChanged', payload => {
      hasErrors = payload.hasErrors;

      if (payload.hasErrors) {
        console.log('has errors at: ' + payload.annotation);
      } else {
        console.log('no errors');
      }
    });

    
    // This is event is published by js-gutter.js to scroll the JS editor. 
     ea.subscribe('onScrolled', info =>  {     
      session.setScrollTop(info.top);
    });
  
}
 
}

