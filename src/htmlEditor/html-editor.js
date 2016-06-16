/* global ace */
/* global $ */

export class HtmlEditor {
  aceHtmlEditorDiv = "aceHtmlEditorDiv";
  aceHtmlEditorSelector = "#aceHtmlEditorDiv";

  constructor(eventAggregator, firebaseManager, aceUtils) {
    this.eventAggregator = eventAggregator;
    this.firebaseManager = firebaseManager;
    this.aceUtils =aceUtils;
  }
    
  attached() {
    let editor = ace.edit(this.aceHtmlEditorDiv);
    this.aceUtils.configureEditor(editor);
    this.firepad = this.firebaseManager.makeHtmlEditorFirepad(editor);

    let session = editor.getSession();
    this.aceUtils.configureSession(session, 'ace/mode/html');

    this.selection = editor.getSelection();       
    this.setupSessionEvents(editor, session);
    
    this.session = session;
    this.editor = editor;
    this.subscribe();
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
  
  subscribe(){
    let ea = this.eventAggregator;
    ea.subscribe("windowResize", layout =>{
        $(this.aceHtmlEditorSelector).height(layout.editorHeight);
        this.editor.resize();
      }
    );
  }
  
}