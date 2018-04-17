import {Observable} from 'rxjs/Observable';

import './monacoUtils.css';

export const monacoProps = {
  fontSize: 12,
  widgetFontSize: 9,
  widgetOffsetHeight: 7,
  widgetVerticalHeight: 14,
  lineOffSetHeight: 14, //sync with css padding-top: lineOffSetHeight/2
  widgetBackgroundColor: 'transparent',
};
export const monacoEditorDefaultOptions = {
  model: null,  // handled in FirecoObservable
  glyphMargin: false,
  selectOnLineNumbers: true,
  nativeContextMenu: true,
  automaticLayout: true,
  fontLigatures: true,
  folding: true,
  hover: true,
  minimap: {enabled: false},
  scrollBeyondLastLine: false,
  formatOnPaste: true,
  scrollbar: {
    // Subtle shadows to the left & top. Defaults to true.
    useShadows: true,
    // Render vertical arrows. Defaults to false.
    verticalHasArrows: false,
    // Render horizontal arrows. Defaults to false.
    horizontalHasArrows: false,
    // Render vertical scrollbar.
    // Accepted values: 'auto', 'visible', 'hidden'.
    // Defaults to 'auto'
    vertical: 'auto',
    // Render horizontal scrollbar.
    // Accepted values: 'auto', 'visible', 'hidden'.
    // Defaults to 'auto'
    horizontal: 'auto',
    verticalScrollbarSize: 4,
    horizontalScrollbarSize: 4,
    arrowSize: 4,
    cursorWidth: 6,
  },
  fontSize: monacoProps.fontSize,
  quickSuggestionsDelay: 1250,
  lineHeight: 18 + monacoProps.lineOffSetHeight, // 18 is the default, sync with css: max-height:18px; and padding-top
  lineNumbersMinChars: 3, //5 is default
};

export const monacoEditorMouseEventTypes = {
  blurEditor: 'blurEditor',
  focusEditor: 'focusEditor',
  mouseMove: 'mouseMove',
  mouseLeave: 'mouseLeave',
  mouseDown: 'mouseDown',
  contextMenu: 'contextMenu'
};
//
// export function isApplePlatform() {
//   return (window && window.navigator && window.navigator.platform) ?
//     window.navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i) ? true : false
//     : true;
// }

export function configureLineNumbersProvider(editorId, doc) {
  //lineNumberProvider
  const lnp = {
    onLineNumbersUpdate: null,
    onVisibleLineNumbersChanged: null,//(maxVisibleLineNumber) => console.log("afterRender", editorId, maxVisibleLineNumber),
    preOnLineNumbersChanged: null,
    debounceTime: 100,
    maxVisibleLineNumber: 0,
    prevMaxVisibleLineNumber: 0,
    timeout: null,
    lineNumbersChanged: () => {
      clearTimeout(lnp.timeout);
      lnp.timeout = setTimeout(() => {
        lnp.onLineNumbersUpdate && lnp.onLineNumbersUpdate(lnp.maxVisibleLineNumber);
        const diff = lnp.maxVisibleLineNumber - lnp.prevMaxVisibleLineNumber;
        lnp.onVisibleLineNumbersChanged && diff && lnp.onVisibleLineNumbersChanged(lnp.maxVisibleLineNumber, diff);
      }, lnp.debounceTime);
    },
    lineNumbers: lineNumber => {
      if (lineNumber < lnp.maxVisibleLineNumber) { // is refresh
        lnp.prevMaxVisibleLineNumber = lnp.maxVisibleLineNumber;
        lnp.preOnLineNumbersChanged && lnp.preOnLineNumbersChanged(lnp.prevMaxVisibleLineNumber);
        lnp.maxVisibleLineNumber = 0;
      }
      if (lineNumber > lnp.maxVisibleLineNumber) {
        lnp.maxVisibleLineNumber = lineNumber;
        (lnp.onLineNumbersUpdate || lnp.onVisibleLineNumbersChanged) && lnp.lineNumbersChanged();
      }
      return `<span class="${editorId}-line-number-${lineNumber}">${lineNumber}</span>`;
    },
    getElementByLineNumber: lineNumber => {
      if (!lineNumber || lineNumber > lnp.maxVisibleLineNumber) {
        return null;
      }
      return doc.querySelector(`.${editorId}-line-number-${lineNumber}`);
    }
  };
  return lnp;
}


export function configureMonacoModel(monaco, editorId, text, language = 'js', onJsx) {
  let extension = language;

  if (language.indexOf('js') >= 0 || language.indexOf('cript') >= 0) {
    extension = 'jsx';
    if (onJsx) {
      onJsx();
    }
  }

  return monaco.editor.createModel(text, language,
    // isApplePlatform() ?
      new monaco.Uri.file(`${editorId}.${extension}`)
      // : new monaco.Uri(`./${editorId}.${extension}`)
  );
}

export function configureMonacoEditor(monaco, editorEl, customEditorOptions) {
  const options = {...monacoEditorDefaultOptions, ...customEditorOptions};
  return monaco.editor.create(editorEl, options);
}

export function configureMonacoEditorMouseEventsObservable(editor) {
  return Observable.create(observer => {
    editor.onDidFocusEditor(() => {
      observer.next({
        type: monacoEditorMouseEventTypes.focusEditor,
        event: null
      });
    });
    editor.onDidBlurEditor(() => {
      observer.next({
        type: monacoEditorMouseEventTypes.blurEditor,
        event: null
      });
    });

    editor.onMouseMove(event => {
      observer.next({
        type: monacoEditorMouseEventTypes.mouseMove,
        event: event
      });
    });
    editor.onMouseLeave(event => {
      observer.next({
        type: monacoEditorMouseEventTypes.mouseLeave,
        event: event
      });
    });
    editor.onMouseDown(event => {
      observer.next({
        type: monacoEditorMouseEventTypes.mouseDown,
        event: event
      });
    });
    editor.onContextMenu(event => {
      observer.next({
        type: monacoEditorMouseEventTypes.contextMenu,
        event: event
      });
    });
  });
}

// let once = false;

// function observeAddViewZone(monacoEditor, afterLineNumber) {
//   return Observable.create(observer => {
//     const viewZone = {};
//     monacoEditor.changeViewZones(function (changeAccessor) {
//       console.log(changeAccessor);
//
//       viewZone.domNode = document.createElement('div');
//       // viewZone.domNode.style.background = 'lightgreen';
//       // viewZone.domNode.style['z-index'] = 300;
//       //   viewZone.domNode.innerText=JSON.stringify(changeAccessor);
//
//       viewZone.domNode.innerText = afterLineNumber;
//       const viewZoneConf = {
//         afterLineNumber: afterLineNumber,
//         heightInLines: 0.5,
//         // height: '50px',
//         domNode: viewZone.domNode
//       };
//       viewZone.viewZoneId = changeAccessor.addZone(viewZoneConf);
//       // render(<Inspector data={viewZoneConf}/>, viewZone.domNode);
//       observer.next(viewZone);
//       observer.complete();
//       if (!once) {
//         console.log("CA", changeAccessor);
//         once = true;
//       }
//
//     });
//   });
// }
//
// function viewZoneChangeAccessorObservable(monacoEditor) {
//   return Observable.create(observer => {
//     monacoEditor.changeViewZones(function (changeAccessor) {
//       // console.log("CAAAa", changeAccessor);
//       // changeAccessor.addZone({
//       //   afterlineNumber: 0,
//       //   domNode: document.createElement('div')
//       // });
//       // changeAccessor.addZone= changeAccessor.addZone;
//       observer.next({...changeAccessor});
//     });
//   });
// }
//
// function addLiveLine(changeAccessor, afterLineNumber) {
//   const viewZone = {};
//   viewZone.domNode = document.createElement('div');
//   viewZone.domNode.style = "font-size:10px;";
//   viewZone.domNode.innerText = afterLineNumber;
//   const viewZoneConf = {
//     afterLineNumber: afterLineNumber,
//     heightInLines: 0.5,
//     domNode: viewZone.domNode
//   };
//   viewZone.viewZoneId = changeAccessor.addZone(viewZoneConf);
//   setTimeout(() => changeAccessor.layoutZone(viewZone.viewZoneId), 100);
//   return viewZone;
// }
//
// //monaco.editor.OverlayWidgetPositionPreference.BOTTOM_RIGHT_CORNER
// export function addOverlayWidget(monacoEditor, getDomNode, overlayId, overlayWidgetPositionPreference) {
//   const overlayWidget = {
//     domNode: null,
//     getId: () => {
//       return overlayId;
//     },
//     getDomNode: () => {
//       overlayWidget.domNode = getDomNode();
//     },
//     getPosition: function () {
//       return {
//         preference: overlayWidgetPositionPreference
//       };
//
//     }
//   };
//   monacoEditor.addOverlayWidget(overlayWidget);
//   return overlayWidget;
// }
//
//
// //previousState = []
// //new monaco.Range(3, 1, 3, 1)
// // options: {
// // isWholeLine: true,
// //   className: 'myContentClass',
// //   glyphMarginClassName: 'myGlyphMarginClass'
// // }
// export function addNavigators(editor, previousState = [], range, options) {
//   return editor.deltaDecorations(previousState, [
//     {
//       range: range,
//       options: options
//     }
//   ]);
// }
//
// function addCodeLens(monaco, editor) {
//   let commandId = editor.addCommand(0, function () {
//     // services available in `ctx`
//     // console.log("c", arguments);
//
//   }, '');
//
//   monaco.languages.registerCodeLensProvider('javascript', {
//     provideCodeLenses: function (model, token) {
//       return [
//         {
//           range: {
//             startLineNumber: 2,
//             startColumn: 1,
//             endLineNumber: 2,
//             endColumn: 1
//           },
//           id: "First Line",
//           command: {
//             id: commandId,
//             title: "First Line: blaaaaaa",
//             content: "bluuuuuuuuu"
//           }
//         }
//       ];
//     },
//     resolveCodeLens: function (model, codeLens, token) {
//       // console.log(arguments);
//       return codeLens;
//     }
//   });
// }
//
// function addCompletionProviders() {
//   let monaco = this.state.monaco;
//
//   function createDependencyProposals() {
//     // returning a static list of proposals, not even looking at the prefix (filtering is done by the Monaco editor),
//     // here you could do a server side lookup
//     return [
//       {
//         label: '"lodash"',
//         kind: monaco.languages.CompletionItemKind.Function,
//         documentation: "The Lodash library exported as Node.js modules.",
//         insertText: '"lodash": "*"'
//       },
//       {
//         label: '"express"',
//         kind: monaco.languages.CompletionItemKind.Function,
//         documentation: "Fast, unopinionated, minimalist web framework",
//         insertText: '"express": "*"'
//       },
//       {
//         label: '"mkdirp"',
//         kind: monaco.languages.CompletionItemKind.Function,
//         documentation: "Recursively mkdir, like <code>mkdir -p</code>",
//         insertText: '"mkdirp": "*"'
//       }
//     ];
//   }
//
//
//   monaco.languages.registerCompletionItemProvider('javascript', {
//     provideCompletionItems: function (model, position) {
//       // find out if we are completing a property in the 'dependencies' object.
//       var textUntilPosition = model.getValueInRange({
//         startLineNumber: 1,
//         startColumn: 1,
//         endLineNumber: position.lineNumber,
//         endColumn: position.column
//       });
//       var match = textUntilPosition.match(/"dependencies"\s*:\s*{\s*("[^"]*"\s*:\s*"[^"]*"\s*,\s*)*("[^"]*)?$/);
//       // console.log(match);
//       if (match) {
//         return createDependencyProposals();
//       }
//       return [];
//     }
//   });

// }


