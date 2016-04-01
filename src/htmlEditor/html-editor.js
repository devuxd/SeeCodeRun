/* global Firepad */
/* global Firebase */
/* global ace */
import '../mode-html';
import '../theme-chrome';

export class HtmlEditor {
    
    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
    }
    
    activate(params) {
        if (params.id) {
            this.pastebinId = params.id;
        }
    }
    
    attached() {
        let editor = ace.edit('htmlEditorDiv');
        this.configureEditor(editor);
        
        this.editor = editor;
        
        let session = editor.getSession();
        this.configureSession(session);
        this.setupSessionEvents(session);
        
        this.session = session;
        
        this.firepad = this.createFirepad(editor);
    }
    
  configureEditor(editor) {
    editor.setTheme('ace/theme/chrome');
    editor.setShowFoldWidgets(false);
  }

  configureSession(session) {
    session.setUseWrapMode(true);
    session.setUseWorker(false);
    session.setMode('ace/mode/html');
  }
  
  setupSessionEvents(session) {
      let ea = this.eventAggregator;
      let editor = this.editor;
      
      session.on('change', onEditorChanged);
      
      let editorChangedTimeout;
      
      function onEditorChanged(e) {
          clearTimeout(editorChangedTimeout);
          editorChangedTimeout = setTimeout(function pub() {
              ea.publish('onHtmlEditorChanged', editor.getValue());
          }, 2500);
      }
      
      this.editorChangedTimeout = editorChangedTimeout;
  }
  
  createFirepad(editor) {
    let baseURL = 'https://seecoderun.firebaseio.com';
    let firebase = new Firebase(baseURL + '/' + this.pastebinId + '/content/html');

    return Firepad.fromACE(
      firebase,
      editor,
      {
        defaultText: '<h1>Html Editor</h1>'
      });
  }
}