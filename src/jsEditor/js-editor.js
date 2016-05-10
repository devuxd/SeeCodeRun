/* global Firepad */
/* global Firebase */
/* global ace */
import '../mode-javascript';
import '../theme-chrome';
import md5 from 'md5';
export class JsEditor {

  constructor(eventAggregator) {
    this.eventAggregator = eventAggregator;
    this.hasErrors = false;
    this.editorHashedText = '1';
    this.md5=md5;
  }

  activate(params) {
    this.pastebinId = params.id;
  }

  attached(params) {
    if (params.id) {
      this.pastebinId = params.id;
    }

    let editor = ace.edit('aceJsEditorDiv');
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
    editor.$blockScrolling = Infinity;
  }

  configureSession(session) {
    session.setUseWrapMode(true);
    session.setUseWorker(false);
    session.setMode('ace/mode/javascript');
  }

  setupSessionEvents(session) {
    let ea = this.eventAggregator;
    let editor = this.editor;
    let editorHashedText = this.editorHashedText;

     ea.publish("onEditorReady", this.editor);

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
  }

  createFirepad(editor) {
    let baseURL = 'https://seecoderun.firebaseio.com';
    let firebase = new Firebase(baseURL + '/' + this.pastebinId + '/content/js');

    return Firepad.fromACE(
      firebase,
      editor, {
        defaultText: '\ngo(); \n\nfunction go() {\n  var message = "Hello, world.";\n  console.log(message);\n}'
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
