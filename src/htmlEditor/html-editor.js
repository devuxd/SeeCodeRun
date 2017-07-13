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
    this.aceUtils = aceUtils;
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
    let self = this;
    let ea = this.eventAggregator;

    let onEditorChanged = function onEditorChanged(e) {

      let editorLayout = self.aceUtils.getLayout(editor);
      if (!$(".ace_autocomplete").is(":visible")) {
        ea.publish('autoCompleteHidden', editorLayout, "htmlEditor");
      }
      clearTimeout(self.searcherTimeout);
      self.searcherTimeout = setTimeout(function () {
        if ($(".ace_autocomplete").is(":visible")) {
          let aceAutoCompletePosition = {};
          aceAutoCompletePosition.top = $(".ace_autocomplete").offset().top - 30;
          aceAutoCompletePosition.left = $(".ace_autocomplete").offset().left + 5 + $(".ace_autocomplete").width();

          ea.publish('autoCompleteShown', aceAutoCompletePosition, "htmlEditor");
        }
      }, 2300); // same as editor timeout

      ea.publish('jsEditorPreChange',
        editorLayout
      );

      if (self.isFirstLoad) {
        self.isFirstLoad = false;
        ea.publish('onHtmlEditorChanged', editor.getValue());
      } else {
        clearTimeout(self.editorChangedTimeout);
        self.editorChangedTimeout = setTimeout(function onHtmlEditorChangedTimeout() {
          ea.publish('onHtmlEditorChanged', editor.getValue());
        }, self.editorChangeDelay);
      }
    };
    session.on('change', onEditorChanged);

    // Copy-n-Paste tracking
    editor.on("copy", function (text) {
      ea.publish('editorCopyAction', text, "htmlEditor");
    });
    editor.on("paste", function (event) {
      ea.publish('editorPasteAction', event, "htmlEditor");
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
        ea.publish('toggleSearcher', cssPosition, "htmlEditor");
      }
    });
  }

  subscribe() {
    this.eventAggregator.subscribe("windowResize", layout => {
        $(this.aceHtmlEditorSelector).height(layout.editorHeight);
        this.editor.resize();
      }
    );
  }

}
