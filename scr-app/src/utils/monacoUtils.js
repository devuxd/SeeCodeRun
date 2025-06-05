import {Observable} from 'rxjs';

export const monacoProps = {
    fixedOverflowWidgets: true,
    fontSize: 12,
    widgetFontSize: 9,
    widgetOffsetHeight: 9, // 8 causes 1 px gap between decoration and content widget
    widgetMaxHeight: 14,
    widgetMinWidth: 0,//7 causes hover leg
    lineOffSetHeight: 14, //sync with css padding-top: lineOffSetHeight/2
    widgetBackgroundColor: 'transparent',
};

export const defaultSimpleMonacoOptions = {
    wordWrap: 'on',
    overviewRulerBorder: false,
    overviewRulerLanes: 0,
    glyphMargin: false,
    lineNumbers: 'off',
    folding: false,
    selectOnLineNumbers: false,
    selectionHighlight: false,
    cursorStyle: 'line',
    cursorWidth: 1,
    scrollbar: {
        useShadows: false,
        horizontal: 'hidden',
        verticalScrollbarSize: 9,
        alwaysConsumeMouseWheel: false,
    },
    lineDecorationsWidth: 0,
    scrollBeyondLastLine: false,
    renderLineHighlight: 'none',
    minimap: {
        enabled: false,
    },
    contextmenu: false,
};

export const monacoEditorDefaultOptions = {
    model: null,  // handled in FirecoObservable
    glyphMargin: false,
    selectOnLineNumbers: true,
    nativeContextMenu: true,
    automaticLayout: true,
    // automaticLayout: false,
    fontLigatures: true,
    folding: true,
    hover: false,
    minimap: {enabled: false},
    scrollBeyondLastLine: false,
    formatOnPaste: true,
    cursorStyle: 'line',
    cursorWidth: 1,
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
        alwaysConsumeMouseWheel: false,
    },
    renderLineHighlight: 'gutter',
    smoothScrolling: true,
    fontSize: monacoProps.fontSize,
    // quickSuggestionsDelay: 1250,
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

export function configureLineNumbersProvider(editorId, doc = document) {
    //lineNumberProvider
    const lnp = {
        onLineNumbersUpdate: null,
        //(maxVisibleLineNumber) => console.log("afterRender", editorId, maxVisibleLineNumber),
        onVisibleLineNumbersChanged: null,
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


export const normalizeLineEndings = (str) => {
    return str?.replace(/\r\n|\r/g, "\n") ?? "";
}

export const normalizeEditorModelText = (model, monaco) => {
    if (model.getEndOfLineSequence() !== monaco.editor.EndOfLineSequence.LF) {
        model.pushEOL(monaco.editor.EndOfLineSequence.LF);
        model.applyEdits([
            {
                range: model.getFullModelRange(),
                text: model.getLinesContent().reduce((r, e) => `${r}${normalizeLineEndings(e)}`, "")
            }
        ]);
    }
}

export function configureMonacoModel(monaco, editorId, text, language = 'js', onJsx) {
    let extension = language;

    if (language.indexOf('js') >= 0 || language.indexOf('cript') >= 0) {
        extension = 'jsx';
        if (onJsx) {
            onJsx();
        }
    }

    const model = monaco.editor.createModel(text, language,
        monaco.Uri.file(`${editorId}.${extension}`)
    );

    normalizeEditorModelText(model, monaco);

    return model;

}

// Fixes disposing element within a React component that unmounts it before
const configureMonacoEditorDetachModel = (monacoEditor) => {
    const detachModel = monacoEditor._detachModel.bind(monacoEditor);

    function _detachModel() {
        // Error in React unmount (removeChild):
        // if (removeDomNode && this._domElement.contains(removeDomNode)) {
        //    this._domElement.removeChild(removeDomNode);
        // }

        let model = this._modelData?.model;

        try {
            model = detachModel();
        } catch (e) {
            try {
                // continue right after error (original code):
                if (this._bannerDomNode &&
                    this._domElement.contains(this._bannerDomNode)) {
                    this._domElement.removeChild(this._bannerDomNode);
                }
            } catch (e1) {
                console.warn(
                    "Monaco ran into an error while detaching model:"
                    , e1
                    , " Original error:",
                    e
                );
            }
        }

        return model;
    }

    monacoEditor._detachModel = _detachModel.bind(monacoEditor);
};

// export function configureCreateDecorationsCollection(monacoEditor){
//    const createDecorationsCollection = monacoEditor.createDecorationsCollection;
//    monacoEditor.createDecorationsCollection = (...args)=>{
//       const collection = createDecorationsCollection.apply(monacoEditor,...args);
//       collection.getDecorationIds = ()=> collection._decorationIds;
//       return collection;
//    };
// }

function makeOnDidChangeModelContentOrError(monacoEditor) {

    return (originalCallback, onDidChangeModelContentError = console.error) => {

        return monacoEditor.onDidChangeModelContent((...ar) => {
            try {
                // Execute the original callback function safely
                originalCallback(...ar);
            } catch (error) {
                // Error handling logic
                onDidChangeModelContentError?.("Error occurred in onDidChangeModelContent callback:", error);
                // console.error("Error occurred in onDidChangeModelContent callback:", error);
                // You can also implement additional error handling logic here,
                // such as logging to an external service, showing a notification to the user, etc.
            }
        });
    };
}

export function configureMonacoEditor(monaco, editorEl, customEditorOptions) {
    const options = {...monacoEditorDefaultOptions, ...customEditorOptions};
    const monacoEditor = monaco.editor.create(editorEl, options);
    monacoEditor.onDidChangeModelContentOrError = makeOnDidChangeModelContentOrError(monacoEditor);
    configureMonacoEditorDetachModel(monacoEditor);
    // configureCreateDecorationsCollection(monacoEditor);
    return monacoEditor;
}

export function configureMonacoEditorMouseEventsObservable(editor) {
    return Observable.create(observer => {
        editor.onDidFocusEditorWidget(() => {
            observer.next({
                type: monacoEditorMouseEventTypes.focusEditor,
                event: null
            });
        });
        editor.onDidBlurEditorWidget(() => {
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
