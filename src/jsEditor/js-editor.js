/* global $ */
/* global ace */

export class JsEditor {
  firebaseTag = "js";
  aceJsEditorDiv = "aceJsEditorDiv";
  jsEditorSelector = "#aceJsEditorDiv";
  isFirstLoad = true;
  editorCompactedText = "";
  editorChangedTimeout = null;
  hasErrors = false;
  height = 700;
  editorChangeDelay = 1500;

  constructor(eventAggregator, firebaseManager, aceUtils) {
    this.eventAggregator = eventAggregator;
    this.firebaseManager = firebaseManager;
    this.aceUtils = aceUtils;
  }

  attached() {
    let editor = ace.edit(this.aceJsEditorDiv);
    this.aceUtils.configureEditor(editor);
    this.firepad = this.firebaseManager.makeJsEditorFirepad(editor);
    let session = editor.getSession();
    this.aceUtils.configureSession(session);

    let selection = editor.getSelection();
    this.selection = selection;
    this.setupSessionEvents(editor, session);
    this.subscribe(session);

    this.session = session;
    this.editor = editor;
  }

  setupSessionEvents(editor, session) {
    let self = this;
    let ea = this.eventAggregator;

    let publishEditorChanged = function publishEditorChanged() {
      let jsCode = editor.getValue();
      let curs = editor.getCursorPosition().row + 1;
      if (jsCode) {
        let editorCompactedText = jsCode;

        if (self.editorChangedText !== editorCompactedText) {
          self.editorChangedText = editorCompactedText;
          ea.publish('jsEditorChange', {
            js: jsCode,
            length: session.getLength(),
            cursor: curs
          });
        }
      }
    };

    this.onEditorChangeChecked = function onEditorChangeChecked(hasErrors) {
      let editorLayout = self.aceUtils.getLayout(editor);
      if (hasErrors) {
        ea.publish('jsEditorChangeError',
          editorLayout
        );
        return;
      }

      ea.publish('jsEditorPreChange',
        editorLayout
      );

      if (self.isFirstLoad) {
        self.isFirstLoad = false;
        publishEditorChanged();
        ea.publish("jsEditorReady", editor);
        editor.resize(true);
        let editorLayout = self.aceUtils.getLayout(editor);
        editor.scrollToLine(editorLayout.firstLineNumber + editorLayout.lastRow, false, false, trueafterScrollAnimationFinish => {
        });
        editor.scrollToLine(editorLayout.firstLineNumber, false, false, afterScrollAnimationFinish => {
        });
        editor.gotoLine(editorLayout.firstLineNumber);
      } else {
        clearTimeout(self.editorChangedTimeout);
        self.editorChangedTimeout = setTimeout(publishEditorChanged, self.editorChangeDelay);
      }
    };

    session.on('change',
      function onEditorChanged() {
        let editorLayout = self.aceUtils.getLayout(editor);
        ea.publish('jsEditorPreChange',
          editorLayout
        );
        clearTimeout(self.editorChangedTimeout);
        self.editorChangedTimeout = setTimeout(publishEditorChanged, self.editorChangeDelay);
      });

    let onAnnotationChanged = function onAnnotationChanged() {
      let annotations = session.getAnnotations();
      for (let key in annotations) {
        if (annotations.hasOwnProperty(key) && annotations[key].type === 'error') {
          ea.publish('jsEditorAnnotationChange', {
            hasErrors: true,
            annotation: annotations[key]
          });
          return;
        }
      }
      ea.publish('jsEditorAnnotationChange', {
        hasErrors: false,
        annotation: null
      });
    };
    session.on('changeAnnotation',
      onAnnotationChanged);

    session.selection.on('changeCursor', () => {
      let cursorPosition = this.editor.getCursorPosition();

      if (!cursorPosition) {
        return;
      }

      let info = {
        cursor: cursorPosition.row + 1,
        lastVisibleRow: session.getLength(),
        position: cursorPosition
      };
      ea.publish("jsEditorCursorMoved", info);
    });

    editor.on("click", function jsEditorClick(event) {
      ea.publish("jsEditorClick", event);
    });

    editor.renderer.on('resize', function jsEditorResize() {
      let editorLayout = self.aceUtils.getLayout(editor);
      ea.publish('jsEditorResize', editorLayout);
    });

    editor.renderer.on('beforeRender', function jsEditorBeforeRender() {
      let editorLayout = self.aceUtils.getLayout(editor);
      ea.publish('jsEditorBeforeRender', editorLayout);
    });

    editor.renderer.on('afterRender', function jsEditorAfterRender() {
      let editorLayout = self.aceUtils.getLayout(editor);
      ea.publish('jsEditorAfterRender', editorLayout);
    });

    editor.getSession().on('changeScrollTop', function jsEditorchangeScrollTop(scrollTop) {
      let scrollerHeight = editor.renderer.$size.scrollerHeight;
      // let scrollerHeight =$(`${this.jsEditorSelector} .ace_scrollbar-inner`).prop('scrollHeight');
      let scrollData = {
        scrollTop: scrollTop,
        scrollerHeight: scrollerHeight
      };
      ea.publish('jsEditorChangeScrollTop', scrollData);
    });
  }

  subscribe(session) {
    let ea = this.eventAggregator;
    let self = this;

    ea.subscribe("windowResize", layout => {
        $(self.jsEditorSelector).height(layout.editorHeight);
        self.editor.resize();
      }
    );

    ea.subscribe('jsGutterChangeScrollTop', scrollData => {
      session.setScrollTop(scrollData.scrollTop);
    });

    ea.subscribe('jsEditorAnnotationChange', payload => {
      this.hasErrors = payload.hasErrors;
      this.onEditorChangeChecked(this.hasErrors);
    });

    ea.subscribe('jsGutterLineClick', lineNumber => {
      this.editor.scrollToLine(lineNumber, true, true, afterScrollAnimationFinish => {
      });
      this.editor.gotoLine(lineNumber);
    });

    ea.subscribe('visualizationSelectionRangeRequest', () => {
      let selection = {
        range: session.selection.getRange()
      };
      ea.publish('visualizationSelectionRangeResponse', selection);
    });

    ea.subscribe("traceSearchGotoLine", lineData => {
      this.editor.scrollToLine(lineData.lineNumber, true, true, afterScrollAnimationFinish => {
      });
      this.editor.gotoLine(lineData.lineNumber);
    });

  }

}
