/* global ace */
/* global $ */

export class HtmlEditor {
  aceHtmlEditorDiv = "aceHtmlEditorDiv";

  constructor(eventAggregator, firebaseManager, aceUtils) {
    this.eventAggregator = eventAggregator;
    this.firebaseManager = firebaseManager;
    this.aceUtils =aceUtils;
  }
    
  attached($parentDiv) {
    // $(`#${this.aceHtmlEditorDiv}`).css("height",`${$parentDiv.height()}px`);
    let editor = ace.edit(this.aceHtmlEditorDiv);
    this.aceUtils.configureEditor(editor);
    this.firepad = this.firebaseManager.makeHtmlEditorFirepad(editor);

    let session = editor.getSession();
    this.aceUtils.configureSession(session, 'ace/mode/html');

    this.selection = editor.getSelection();       
    this.setupSessionEvents(editor, session);
    
    this.session = session;
    this.editor = editor;
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