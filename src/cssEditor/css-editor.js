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
    this.firepad = this.firebaseManager.makeCssEditorFirepad(editor);

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

      let editorLayout = self.aceUtils.getLayout(editor);
      if (!$(".ace_autocomplete").is(":visible")) {
        ea.publish('autoCompleteHidden', editorLayout, "cssEditor");
      }
      clearTimeout(self.searcherTimeout);
      self.searcherTimeout = setTimeout(function () {
        if ($(".ace_autocomplete").is(":visible")) {
          let aceAutoCompletePosition = {};
          aceAutoCompletePosition.top = $(".ace_autocomplete").offset().top - 30;
          aceAutoCompletePosition.left = $(".ace_autocomplete").offset().left + 5 + $(".ace_autocomplete").width();

          ea.publish('autoCompleteShown', aceAutoCompletePosition, "cssEditor");
        }
      }, 2300); // same as editor timeout

      ea.publish('jsEditorPreChange',
        editorLayout
      );

      if (self.isFirstLoad) {
        self.isFirstLoad = false;
        ea.publish('onCssEditorChanged', editor.getValue());
      } else {
        clearTimeout(self.editorChangedTimeout);
        self.editorChangedTimeout = setTimeout(function pub() {
          ea.publish('onCssEditorChanged', editor.getValue());
        }, self.editorChangeDelay);
      }
    };
    session.on('change', onEditorChanged);

    // Copy-n-Paste tracking
    editor.on("copy", function (text) {
      ea.publish('editorCopyAction', text, "cssEditor");
    });
    editor.on("paste", function (event) {
      ea.publish('editorPasteAction', event, "cssEditor");
    });

    //Searcher Binding
    editor.commands.addCommand({
      name: "Toggle Searcher's Quick Search",
      bindKey: {win: "Ctrl-q", mac: "Command-q"},
      exec: function (thisEditor) {
        let cursorPosition = thisEditor.getCursorPosition();
        if (!cursorPosition) {
          return;
        }
        let pixelPosition = thisEditor.renderer.textToScreenCoordinates(cursorPosition);
        let cssPosition = {top: pixelPosition.pageY - 40, left: pixelPosition.pageX, takeFocus: true};
        ea.publish('toggleSearcher', cssPosition, "cssEditor");
      }
    });
  }

  subscribe() {
    this.eventAggregator.subscribe("windowResize", layout => {
        $(this.cssEditorSelector).height(layout.editorHeight);
        this.editor.resize();
      }
    );
  }

}
