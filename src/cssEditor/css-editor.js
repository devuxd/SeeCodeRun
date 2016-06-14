/* global $ */
/* global ace */

export class CssEditor {
  cssEditorDiv = "cssEditorDiv";

  constructor(eventAggregator, firebaseManager, aceUtils) {
    this.eventAggregator = eventAggregator;
    this.firebaseManager = firebaseManager;
    this.aceUtils = aceUtils;
  } 

  attached($parentDiv) {
    // $(`#${this.cssEditorDiv}`).css("height",`${$parentDiv.height()}px`);
    let editor = ace.edit(this.cssEditorDiv);
    this.aceUtils.configureEditor(editor);
    this.firepad = this.firebaseManager.makeCssEditorFirepad(editor);
    
    let session = editor.getSession();
    this.aceUtils.configureSession(session, 'ace/mode/css');
    this.setupSessionEvents(editor, session);
    
    this.editor = editor;
    this.session = session;
  }
  
  setupSessionEvents(editor, session) {
      let ea = this.eventAggregator;
      
      session.on('change', onEditorChanged);
      
      let editorChangedTimeout;
      
      function onEditorChanged(e) {
          clearTimeout(editorChangedTimeout);
          editorChangedTimeout = setTimeout(function pub() {
              ea.publish('onCssEditorChanged', editor.getValue());
          }, 2500);
      }
      
      this.editorChangedTimeout = editorChangedTimeout;
  }
  
}