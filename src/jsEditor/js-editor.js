/* global $ */
/* global ace */

import '../aceThemes/mode-javascript';
import '../aceThemes/theme-chrome';
import md5 from 'md5';

export class JsEditor {
  aceJsEditorDiv = "aceJsEditorDiv";
  
  constructor(eventAggregator, firebaseManager) {
    this.eventAggregator = eventAggregator;
    this.firebaseManager = firebaseManager;
    this.hasErrors = false;
    this.editorHashedText = '1';
    this.md5 = md5;
    this.height = 700;
  }

  
  attached() {
    $(`#${this.aceJsEditorDiv}`).css("height",`${$("#mainContainer").height() + $("#mainContainer").offset()['top'] - $("#js-container").offset()['top']}px`);
    let editor = ace.edit(this.aceJsEditorDiv);
    this.configureEditor(editor);
    this.firepad = this.firebaseManager.makeJsEditorFirepad(editor);

    let session = editor.getSession();
    this.configureSession(session);

    let selection = editor.getSelection();
    this.selection = selection;
    this.setupSessionEvents(editor, session);
    this.subscribe(session);
    
    this.session = session;
    this.editor = editor;
}

  configureEditor(editor){
    editor.setTheme('ace/theme/chrome');
    editor.setShowFoldWidgets(false);
    editor.$blockScrolling = Infinity;
  }

  configureSession(session) {
    session.setUseWrapMode(true);
    session.setUseWorker(false);
    session.setMode('ace/mode/javascript');
  }

  setupSessionEvents(editor, session) {
    let ea = this.eventAggregator;
    let editorHashedText = this.editorHashedText;

     ea.publish("onEditorReady", editor);

    session.on('change',
      onEditorChanged);

    let editorChangedTimeout;

    function onEditorChanged(e) {

      clearTimeout(editorChangedTimeout);

      editorChangedTimeout = setTimeout(function pub() {
        let js = editor.getValue();
        let curs = editor.getCursorPosition().row + 1;

        // This line strip out the spaces at the end of the documents.
        let newStr = js.replace(/(\s+$)/g, '');
        // then, hash it and store it in localHash variable.
        let localHash = md5(newStr);
        if (editorHashedText !== localHash ) {
          
          editorHashedText = localHash; 
          // subscribe to this event to be notified with the following data when the JS-editor changed.   
          ea.publish('onJsEditorChanged', {
            js: js,
            length: session.getLength(),
            cursor: curs
          });
        }

      }, 2500);
    }



    this.editorHashedText = editorHashedText;
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

    //For gutter
    session.selection.on('changeCursor', () => {

      let info = {
        cursor: this.editor.getCursorPosition().row + 1,
        lastVisibleRow: session.getLength(),
        position: this.editor.getCursorPosition()
      };
      ea.publish('onCursorMoved', info);
    });
    
    //For exprssions selection
    editor.on("click", ()=>{
        ea.publish("onEditorClick");
    });
    
    editor.getSession().on('changeScrollTop', function(scrollTop) {
        let info = {
            top: scrollTop
        };

        ea.publish('jsEditorchangeScrollTop', info);
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
      }
      else {
        console.log('no errors');
      }
    });


    // This  event is published by js-gutter.js to scroll the JS editor. 
    ea.subscribe('onScrolled', info => {
      session.setScrollTop(info.top);
    });

  }

  setEditorText(hash) {
    this.editorText = hash;
  }

}
