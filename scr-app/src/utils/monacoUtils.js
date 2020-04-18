import {Observable} from 'rxjs';

export const monacoProps = {
    fontSize: 12,
    widgetFontSize: 9,
    widgetOffsetHeight: 7,
    widgetMaxHeight: 14,
    lineOffSetHeight: 14, //sync with css padding-top: lineOffSetHeight/2
    widgetBackgroundColor: 'transparent',
};

export const defaultSimpleMonacoOptions = {
    wordWrap: 'on',
    overviewRulerBorder:false,
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
    // automaticLayout: true,
    automaticLayout: false,
    fontLigatures: true,
    folding: true,
    hover: true,
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
    // smoothScrolling: true,
    fontSize: monacoProps.fontSize,
    quickSuggestionsDelay: 1250,
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


export function configureMonacoModel(monaco, editorId, text, language = 'js', onJsx) {
    let extension = language;

    if (language.indexOf('js') >= 0 || language.indexOf('cript') >= 0) {
        extension = 'jsx';
        if (onJsx) {
            onJsx();
        }
    }

    return monaco.editor.createModel(text, language,
        new monaco.Uri.file(`${editorId}.${extension}`)
    );
}

export function configureMonacoEditor(monaco, editorEl, customEditorOptions) {
    const options = {...monacoEditorDefaultOptions, ...customEditorOptions};
    return monaco.editor.create(editorEl, options);
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