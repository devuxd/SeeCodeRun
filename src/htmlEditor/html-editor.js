/* global ace */
/* global $ */ 
import '../aceThemes/mode-html';
import '../aceThemes/theme-chrome';

export class HtmlEditor {
  aceHtmlEditorDiv = "aceHtmlEditorDiv";

  constructor(eventAggregator, firebaseManager) {
    this.eventAggregator = eventAggregator;
    this.firebaseManager = firebaseManager;
  }
    
  attached($parentDiv) {
    $(`#${this.aceHtmlEditorDiv}`).css("height",`${$parentDiv.height()}px`);
    let editor = ace.edit(this.aceHtmlEditorDiv);
    this.configureEditor(editor);
    this.firepad = this.firebaseManager.makeHtmlEditorFirepad(editor);

    let session = editor.getSession();
    this.configureSession(session);

    this.selection = editor.getSelection();       
    this.setupSessionEvents(editor, session);
    
    this.session = session;
    this.editor = editor;
  }

  configureEditor(editor) {
    editor.setTheme('ace/theme/chrome');
    editor.setShowFoldWidgets(false);
    editor.$blockScrolling = Infinity;
  }

  configureSession(session) {
    session.setUseWrapMode(true);
    session.setUseWorker(false);
    session.setMode('ace/mode/html');
  }
  
  setupSessionEvents(editor, session) {
      let ea = this.eventAggregator;
      
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
  
}