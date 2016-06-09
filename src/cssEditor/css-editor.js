/* global $ */
/* global ace */

import '../aceThemes/mode-css';
import '../aceThemes/theme-chrome';

export class CssEditor {
  cssEditorDiv = "cssEditorDiv";

  constructor(eventAggregator, firebaseManager) {
    this.eventAggregator = eventAggregator;
    this.firebaseManager = firebaseManager;
  } 

  attached($parentDiv) {
    $(`#${this.cssEditorDiv}`).css("height",`${$parentDiv.height()}px`);
    let editor = ace.edit(this.cssEditorDiv);
    this.configureEditor(editor);
    this.firepad = this.firebaseManager.makeCssEditorFirepad(editor);
    
    let session = editor.getSession();
    this.configureSession(session);
    this.setupSessionEvents(editor, session);
    
    this.editor = editor;
    this.session = session;
  }
    
  configureEditor(editor) {
    editor.setTheme('ace/theme/chrome');
    editor.setShowFoldWidgets(false);
    editor.$blockScrolling = Infinity;
  } 

  configureSession(session) {
    session.setUseWrapMode(true);
    session.setUseWorker(false);
    session.setMode('ace/mode/css');
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