/* global ace */
/* global $ */

export class HtmlEditor {
  firebaseTag = "html";
  aceHtmlEditorDiv = "aceHtmlEditorDiv";
  aceHtmlEditorSelector = "#aceHtmlEditorDiv";
  isFirstLoad = true;
  editorChangeDelay = 1500;

  constructor(eventAggregator, firebaseManager, aceUtils) {
    this.eventAggregator = eventAggregator;
    this.firebaseManager = firebaseManager;
    this.aceUtils =aceUtils;
  }

  attached() {
    let editor = ace.edit(this.aceHtmlEditorDiv);
    this.aceUtils.configureEditor(editor);
    this.eventAggregator.subscribe("pastebinReady", () => {
      this.firepad = this.firebaseManager.makeHtmlEditorFirepad(editor);
    });

    let session = editor.getSession();
    this.aceUtils.configureSession(session, 'ace/mode/html');

    this.selection = editor.getSelection();
    this.setupSessionEvents(editor, session);

    this.session = session;
    this.editor = editor;
    this.subscribe();
  }

  setupSessionEvents(editor, session) {
      let self = this;
      let ea = this.eventAggregator;

      let onEditorChanged =function onEditorChanged(e) {
         if(self.isFirstLoad){
          self.isFirstLoad = false;
          ea.publish('onHtmlEditorChanged', editor.getValue());
         }else{
          clearTimeout(self.editorChangedTimeout);
          self.editorChangedTimeout = setTimeout(function onHtmlEditorChangedTimeout() {
              ea.publish('onHtmlEditorChanged', editor.getValue());
          }, self.editorChangeDelay);
         }
      };
      session.on('change', onEditorChanged);
  }

  subscribe(){
    this.eventAggregator.subscribe("windowResize", layout =>{
        $(this.aceHtmlEditorSelector).height(layout.editorHeight);
        this.editor.resize();
      }
    );
  }

}