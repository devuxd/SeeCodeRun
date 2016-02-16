/* global Firepad */
/* global Firebase */
/* global ace */
import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Router} from 'aurelia-router';
import esprima from 'esprima';
import '../../mode-javascript';
import '../../theme-chrome';

@inject(EventAggregator, Router)
export class JsEditor {

  constructor(eventAggregator, router) {
    this.eventAggregator = eventAggregator;
    this.router = router;
    this.hasErrors = false;
  }

  activate(params) {
    if (params.id) {
      this.pastebinId = params.id;
    } else {
      let baseURL = 'https://radiant-heat-3277.firebaseio.com';
      let firebase = new Firebase(baseURL);
      let pastebinId = firebase.push().key();
      this.router.navigateToRoute('js-editor', { id: pastebinId });
    }

    //     let baseURL = 'https://radiant-heat-3277.firebaseio.com';
    //     let firebase = new Firebase(baseURL);
    //     let pastebin = firebase.child(params.id);
    //     let pastebinId = this.pastebinId;
    //     pastebin.once('value', getOrCreatePastebin);
    //     function getOrCreatePastebin(snapshot) {
    //       if (snapshot.exists()) {
    //         pastebinId = params.id;
    //       } else {
    //         pastebinId = firebase.push().key();
    //       }
    //     }
  }

  attached() {
    let editor = ace.edit('editorDiv');
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
    
    console.log(editor);
    
    function onEditorChanged(e) {
      clearTimeout(editorChangedTimeout);
      editorChangedTimeout = setTimeout(function pub() { 
        let syntax = esprima.parse(editor.getValue(), {loc: true});

        ea.publish('onEditorChanged', {
            data: e,
            length: session.getLength(),
            syntax: syntax
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
    //let baseURL = 'https://seecoderun.firebaseio.com';
    let baseURL = 'https://radiant-heat-3277.firebaseio.com';
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
      console.log('do something different');
    });
  }
}

