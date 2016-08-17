/* global $ */
/* global ace */

export class CssEditor {
  firebaseTag = "css";
  cssEditorDiv = "cssEditorDiv";
  cssEditorSelector = "#cssEditorDiv";
  isFirstLoad = true;
  editorChangeDelay = 1500;

  constructor(eventAggregator, firebaseManager, aceUtils) {
    this.eventAggregator = eventAggregator;
    this.firebaseManager = firebaseManager;
    this.aceUtils = aceUtils;
  }

  attached() {
    let editor = ace.edit(this.cssEditorDiv);
    this.aceUtils.configureEditor(editor);
    this.eventAggregator.subscribe("pastebinReady", () => {
     this.firepad = this.firebaseManager.makeCssEditorFirepad(editor);
    });
    let session = editor.getSession();
    this.aceUtils.configureSession(session, 'ace/mode/css');
    this.setupSessionEvents(editor, session);

    this.editor = editor;
    this.session = session;
    this.subscribe();
  }

  setupSessionEvents(editor, session) {
      let self = this;
      let ea = this.eventAggregator;

      let onEditorChanged = function onEditorChanged(e) {
        if(self.isFirstLoad){
          self.isFirstLoad = false;
          ea.publish('onCssEditorChanged', editor.getValue());
        }else{
          clearTimeout(self.editorChangedTimeout);
          self.editorChangedTimeout = setTimeout(function pub() {
              ea.publish('onCssEditorChanged', editor.getValue());
          }, self.editorChangeDelay);
        }
      };
      session.on('change', onEditorChanged);
  }

  subscribe(){
    this.eventAggregator.subscribe("windowResize", layout =>{
        $(this.cssEditorSelector).height(layout.editorHeight);
        this.editor.resize();
      }
    );
  }

}