import {parse} from "@babel/parser";
import traverse from "@babel/traverse";
import {Observable, of} from 'rxjs';
import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';

import isString from 'lodash/isString';

import {
    searchStateChangeFulfilled,
    searchStateChangeRejected
} from '../redux/modules/pastebin';

import {
    configureMonacoModelsFulfilled,
    configureMonacoModelsRejected,
    loadMonacoFulfilled,
    loadMonacoRejected,
    switchMonacoThemeFulfilled,
    switchMonacoThemeRejected,
    updateMonacoModelsFulfilled,
    updateMonacoModelsRejected,
} from '../redux/modules/monaco';

import {
    loadMonacoEditorFulfilled,
    loadMonacoEditorRejected,
} from '../redux/modules/monacoEditor';

import {
    activateFirepadFulfilled,
    activateFirepadRejected,
    configureFirecoChatFulfilled,
    configureFirecoChatRejected,
    configureFirecoEditorFulfilled,
    configureFirecoEditorReady,
    configureFirecoEditorRejected,
    configureFirecoPersistableComponentFulfilled,
    configureFirecoPersistableComponentRejected,
    firecoEditorsSetUserIdFulfilled,
    firecoEditorsSetUserIdRejected,
    onConnectionChanged,
} from '../redux/modules/fireco';

import {
    configureLineNumbersProvider,
    configureMonacoEditor,
    configureMonacoModel, normalizeEditorModelText,
} from '../utils/monacoUtils';

import {MonacoHighlightTypes} from "../themes";

import firebaseConfig from './firebaseConfig';
import configureMonacoDefaults from '../configureMonaco';
import {
    CALE,
    MonacoOptions,
    parseOptions
} from "./modules/ALE";

import {makeAjax, makeScrCloudFunctions} from '../firebase/scrCloudFunctions';
import RxApp from "./RxApp";

let MonacoJSXHighlighter = null;

const {root, config} = firebaseConfig;

const fireco = {
    appId: `${Date.now()}`,
    serverTimestamp: () => null,
    app: null,
    database: null,
    auth: null,
    connectedRef: null,
    chatPath: null,
    usersPath: null,
    chatRef: null,
    usersRef: null,
    isAuth: false,
    unsubscribeOnIdTokenChanged: null,
    persistablePath: null,
    persistableComponents: {},
    persistableComponentsOnDispose: [],
    disposeFirecoChat: () => null,
    scrCloudFunctions: {},
    ajax: null,
};

const defaultFirecoPad = {
    id: null,
    language: 'html',
    isJsx: false,
    monacoEditor: null,
    monacoEditorModel: null,
    monacoEditorSavedState: null, //{text: null, viewState: null}
    editorOptions: {...MonacoOptions.baseLiveEditorConstructionOptions},
    onContentChanged: null,
    buildAst: null, // only populated if isJsx is true
    onAstBuilt: null,
    firebasePath: null,
    firebaseRef: null,
    firepadInstance: null,
    headlessFirepad: null,
    starvationTimeout: null,
    setFirecoText: null,
    getFirecoText: null,
    isNew: false,
    isInit: false,
    mutex: false,
    nextSetFirecoTexts: [],
    text: null,// value obtained by firepad or set via scr
    widgetLayoutChange: null, // handled in LiveExpressionStore
    firepadHeadless: null,
    serverTimestamp: null,
};

export const editorIds = {
    js: 'js',
    html: 'html',
    css: 'css',
};

class AppManager {
    disableMonacoJSXHighlighter = true;

    constructor(urlData, isProduction) {
        this.idLogRocket = null;// '2njsfv/scr';
        this.isProduction = isProduction;
        this.editorIds = editorIds;
        this.urlData = urlData;
        this.currentMonacoTheme = null;
        this.pastebinLayout = null;
        this.pastebinId = null;
        this.monaco = null;
        this.hasSavedEditorsStates = false;
        this.firecoPads = {
            // editorIds as in Firebase: pastebinId/content/editorId (e.g. js)
            [editorIds['js']]: {
                ...defaultFirecoPad,
                id: editorIds['js'],
                language: 'javascript',
                editorOptions: MonacoOptions.liveEditorConstructionOptions,
            },
            [editorIds['html']]: {
                ...defaultFirecoPad,
                id: editorIds['html'],
            },
            [editorIds['css']]: {
                ...defaultFirecoPad,
                id: editorIds['css'],
                language: 'scss' // css
            }
        };

        const rxApp = new RxApp(this, editorIds['js']);
        this.rxApp = () => rxApp;
    }


    observeLoadMonaco() {
        return new Observable(observer => {
                (async () => [
                    // monaco 0.41.0 does not include
                    await import('monaco-editor/esm/vs/editor/editor.api'),
                    // await import('monaco-editor/esm/metadata')
                ])()//'monaco-editor'
                    .then(([monaco, metadata]) => {
                        // fixes breaking changes [0.22.0] (29.01.2021) // addressed in index.html
                        // global.monaco = monaco;
                        // console.log("monaco metadata", metadata);
                        configureMonacoDefaults(monaco);
                        observer.next(loadMonacoFulfilled(monaco));
                        observer.complete();
                    })
                    .catch(error => {
                        observer.next(loadMonacoRejected(error));
                        observer.complete();
                    });

                return () => {
                    // no need
                };
            }
        );
    }

    observeDispose() {
        try {
            this.dispose();
            return of({type: 'DISPOSE_FULFILLED'});
        } catch (error) {
            return of({type: 'DISPOSE_REJECTED', error: error});
        }
    }

    initLogRocket(userLogRocket) {
        const idLogRocket = this.idLogRocket;
        if (!userLogRocket || !idLogRocket || this.isProduction) {
            return false;
        }

        import('logrocket')
            .then(({default: LogRocket}) => {
                LogRocket.init(idLogRocket);
                LogRocket.identify(idLogRocket, userLogRocket);
                this.LogRocket = LogRocket;
                this.userLogRocket = userLogRocket;
            })
            .catch(error => console.warn('LogRocket Error', error));

        return true;
    }


    activateLogRocket = false;

    setPastebinId(pastebinId, shouldReplace = false) {
        if (pastebinId && (!this.pastebinId || shouldReplace)) {
            global.location.hash = pastebinId;

            this.pastebinId = pastebinId;

            const userLogRocket = {
                name: pastebinId,
                email: `${pastebinId}@scr.run`,
            };

            this.activateLogRocket && this.initLogRocket(userLogRocket);
        }
    }

    getEditorsStates() {
        const editorsStates = {};
        for (const editorId in this.firecoPads) {
            const monacoEditor = this.firecoPads[editorId].monacoEditor;
            if (monacoEditor) {
                editorsStates[editorId] = {
                    text: monacoEditor.getValue(),
                    viewState: monacoEditor.saveViewState(),
                };
            } else {
                return null;
            }
        }
        return editorsStates;
    }

    restoreEditorsStates(editorsStates) {
        if (this.hasSavedEditorsStates || !editorsStates) {
            return;
        }

        for (const editorId in this.firecoPads) {
            if (editorsStates[editorId]) {
                this.firecoPads[editorId]
                    .monacoEditorSavedState = editorsStates[editorId];
            } else {
                return;
            }
        }
        this.hasSavedEditorsStates = true;
    }

    getInitialEditorsTextsFromRestoreEditorsStates() {
        if (!this.hasSavedEditorsStates) {
            return null;
        }
        const initialEditorsTexts = {};
        for (const editorId in this.firecoPads) {
            if (this.firecoPads[editorId].monacoEditorSavedState) {
                initialEditorsTexts[editorId] =
                    this.firecoPads[editorId].monacoEditorSavedState.text;
            } else {
                return null;
            }
        }
        return initialEditorsTexts;
    }

    getCurrentGridLayouts() {
        if (this.pastebinLayout && this.pastebinLayout.getCurrentGridLayouts) {
            return this.pastebinLayout.getCurrentGridLayouts();
        }
        return null;
    }

    restoreGridLayouts(gridLayouts) {
        if (
            gridLayouts &&
            this.pastebinLayout &&
            this.pastebinLayout.restoreGridLayouts
        ) {
            this.pastebinLayout.restoreGridLayouts(gridLayouts);
        }
    }

    setPastebinLayout(restoreGridLayouts, getCurrentGridLayouts) {
        this.pastebinLayout = {
            restoreGridLayouts: restoreGridLayouts,
            getCurrentGridLayouts: getCurrentGridLayouts
        }
    }

    dispose() {
        this.disposeFirecos();
        fireco.connectedRef?.off("value", fireco.onValue);
        fireco.unsubscribeOnIdTokenChanged?.();
    }

    configureFirecoPaths(pastebinKey, isNew, uid = null) {
        const pastebinId = `${uid ? `${uid}/` : ''}${pastebinKey}`;
        fireco.chatPath = `${root}/${pastebinId}/chat`;
        fireco.usersPath = `${root}/${pastebinId}/users`;
        fireco.persistablePath = `${root}/${pastebinId}/components`;
        const rxCloudStorePath = `${root}/${pastebinId}/rxStore`;
        this.rxApp().onRxCloudStorePath(rxCloudStorePath, fireco.database);
        for (const editorId in this.firecoPads) {
            this.firecoPads[editorId].firebasePath =
                `${root}/${pastebinId}/firecos/${editorId}`;
            this.firecoPads[editorId].isNew = isNew;
        }
    }

    observeConfigureMonacoModels(monaco) {
        try {
            if (monaco) {
                this.monaco = monaco;
                this.currentMonacoTheme &&
                this.monaco.editor.setTheme(this.currentMonacoTheme);
                for (const editorId in this.firecoPads) {
                    const firecoPad = this.firecoPads[editorId];
                    firecoPad.monaco = monaco;


                    // let text = '';
                    // if (this.hasSavedEditorsStates &&
                    //     firecoPad.monacoEditorSavedState) {
                    //     text = isString(
                    //         firecoPad.monacoEditorSavedState.text
                    //     ) ? firecoPad.monacoEditorSavedState.text : '';
                    // }
                    firecoPad.monacoEditorModel =
                        configureMonacoModel(this.monaco,
                            editorId,
                            '',
                            firecoPad.language, () => {
                                firecoPad.isJsx = true;
                            });
                }

                return of(configureMonacoModelsFulfilled());
            } else {
                return of(
                    configureMonacoModelsRejected(
                        'Error: Monaco is not loaded'
                    )
                );
            }
        } catch (e) {
            return of(configureMonacoModelsRejected(e));
        }
    }

    observeUpdateMonacoModels(initialEditorsTexts) {
        try {
            if (initialEditorsTexts) {
                for (const editorId in this.firecoPads) {
                    const firecoPad = this.firecoPads[editorId];
                    if (
                        !firecoPad.isInit &&
                        isString(initialEditorsTexts[editorId])
                    ) {
                        //  firecoPad.monacoEditorModel
                        //  .setValue(initialEditorsTexts[editorId]);
                    } else {
                        return of(
                            updateMonacoModelsRejected(
                                'Error: no text was provided for editor' +
                                ' with id: ' + editorId + ', or' +
                                ' Fireco set it first.'
                            )
                        );
                    }
                }
                return of(updateMonacoModelsFulfilled());
            } else {
                return of(
                    updateMonacoModelsRejected(
                        'Error: no editors texts was provided'
                    )
                );
            }
        } catch (e) {
            return of(updateMonacoModelsRejected(e));
        }
    }

    activateMonacoJSXHighlighter = async (firecoPad, monaco = this.monaco) => {
        if (this.disableMonacoJSXHighlighter) {
            return;
        }
        // console.log("disableMonacoJSXHighlighter");

        firecoPad.monacoJSXHighlighter?._dispose();

        MonacoJSXHighlighter ??= (await import ('monaco-jsx-highlighter')).default;

        const monacoJSXHighlighter = new MonacoJSXHighlighter(
            monaco,
            code => parse(code, parseOptions),
            traverse,
            firecoPad.monacoEditor,
            {isUseSeparateElementStyles: true}
        );

        const d1 = monacoJSXHighlighter.highlightOnDidChangeModelContent();
        const d2 = monacoJSXHighlighter.addJSXCommentCommand();
        let disposed = false;

        monacoJSXHighlighter._dispose = () => {
            if (disposed) {
                return;
            }

            d1();
            d2();
            disposed = true;
        };

        firecoPad.monacoJSXHighlighter = monacoJSXHighlighter;
    };

    configureLiveExpressionWidgetsLayoutChangePassive(firecoPad) {
        const {monacoEditor} = firecoPad;
        let isChange = false;
        let isCursorPositionInColumnZero = false;

        let prevKeyCode = null;
        let currentKeyCode = null;
        let prevKey = null;
        let currentKey = null;

        let tm = null;
        const widgetLayoutChange = () => {
            console.log("works", firecoPad?.liveExpressionWidgetProvider?.beforeRender);
            isChange && firecoPad?.liveExpressionWidgetProvider?.beforeRender();
            isChange = false;
            clearTimeout(tm);
            tm = setTimeout(() => {
                firecoPad?.liveExpressionWidgetProvider?.afterRender();
            }, 500);
        };

        monacoEditor.onKeyDown((event) => {
            prevKey = currentKey;
            prevKeyCode = currentKeyCode;
            currentKey = event.browserEvent.key;
            currentKeyCode = event.browserEvent.keyCode;
            isChange = currentKey === 'Enter' || currentKeyCode === 13;
            isChange = // backspace or delete and rightmost
                isChange || ((currentKey === 'Backspace' ||
                        currentKeyCode === 8 || currentKeyCode === 46) &&
                    isCursorPositionInColumnZero);
            isChange = // paste or cut := ctrl||command + V||C english only =[
                isChange || ((prevKey === 'Control' || prevKeyCode === 17 ||
                        prevKey === 'Meta' || prevKeyCode === 91) &&
                    (currentKey === 'c' || currentKeyCode === 86 ||
                        currentKey === 'v' || currentKeyCode === 88));
            widgetLayoutChange();
        });

        let currentCursorEvent = {};
        // let prevCursorEvent = {};
        monacoEditor.onDidChangeCursorPosition((event) => {
            // prevCursorEvent = currentCursorEvent;
            currentCursorEvent = event;
            isCursorPositionInColumnZero =
                currentCursorEvent.position.column === 1;
            // monaco 0.11.1 column-min:0=>1
        });

        monacoEditor.onDidScrollChange(widgetLayoutChange);
    }

    observeConfigureMonacoEditor(editorId, editorHooks) {
        const {
            editorRef, monacoEditorContentChanged,
            editorDidMount, isConsole, monacoOptions,
            disposerRef,
            setIsMonacoEditorReady,
        } = editorHooks;

        const {monaco, prevEditorRef} = this;

        if (monaco) {
            try {
                if (isConsole) {
                    this.consoleInputEditor = configureMonacoEditor(
                        monaco,
                        editorRef.current,
                        {
                            ...monacoOptions,
                            model: monaco.editor.createModel(
                                '',
                                'javascript'
                            )
                        }
                    );

                    editorDidMount(this.consoleInputEditor);

                    return of(
                        loadMonacoEditorFulfilled(editorId, null)
                    );
                }

                const firecoPad = this.firecoPads[editorId];


                const action = of(
                    loadMonacoEditorFulfilled(editorId, firecoPad)
                );

                // if (firecoPad.isConfigured) {
                //     console.log("perhaps? observeConfigureMonacoEditor");
                //     return action;
                // }


                const editorOptions = {
                    ...firecoPad.editorOptions,
                    model: firecoPad.monacoEditorModel,
                    // lineNumbers: firecoPad.lineNumbersProvider.lineNumbers
                };

                if (prevEditorRef?.current) {
                    if (prevEditorRef.current === editorRef.current) {
                        console.log(">>>..............................>");
                    } else {
                        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                    }
                }

                const monacoEditor = configureMonacoEditor(
                    monaco,
                    editorRef.current,
                    editorOptions,
                );

                firecoPad.monacoEditor = monacoEditor;


                const {behaviors} = firecoPad;
                // console.log("firecoPad", {firecoPad, behaviors});
                behaviors?.().monacoEditorSubject().next({editorId, monacoEditor, monaco});


                firecoPad.lineNumbersProvider = configureLineNumbersProvider(
                    editorId
                );

                if (isString(firecoPad.monacoEditorSavedState?.viewState)) {
                    monacoEditor.restoreViewState(
                        firecoPad.monacoEditorSavedState.viewState
                    );
                }

                if (firecoPad.isJsx) {
                    this
                        .activateMonacoJSXHighlighter(firecoPad)
                        .catch(e => console.warn(e));
                }

                firecoPad.onContentChangedAction =
                    (modelContentChanges) => {
                        if (monacoEditorContentChanged) {
                            //console.log("monacoEditorContentChanged", firecoPad, modelContentChanges);

                            return monacoEditorContentChanged?.(
                                editorId, monacoEditor.getValue(), modelContentChanges
                            );
                        }
                        return null;
                    };
                const asyncContentChanged = async () => {
                    const modelContentChanges = firecoPad.modelContentChanges;
                    firecoPad.modelContentChanges = null;
                    firecoPad.onContentChanged?.(modelContentChanges);
                    firecoPad.onContentChangedAction(modelContentChanges);
                };

                const timeWindow = 150;
                let layoutHidden = false;
                const throttledWidgetLayoutChange = throttle(
                    () => firecoPad.widgetLayoutChange?.(),
                    timeWindow, {leading: true, trailing: true});

                const debouncedAsyncContentChanged = debounce(
                    () => {
                        asyncContentChanged()
                            .then(() => (layoutHidden = false))
                            .catch(error => console.log(
                                    '[ERROR]asyncContentChanged',
                                    error
                                )
                            );
                    }, timeWindow * 2);
                //todo: simplify change response
                firecoPad.onDidChangeModelContent = debounce(async () => {
                    if (!layoutHidden) {
                        layoutHidden = true;
                        throttledWidgetLayoutChange();
                    }
                    debouncedAsyncContentChanged();
                }, 50, {maxWait: timeWindow});

                firecoPad.handleChangeModelContent = (codeChanges) => {
                    // console.log("onDidChangeModelContent", {codeChanges});
                    behaviors?.().codeChangesSubject?.().next({codeChanges});
                    firecoPad.modelContentChanges ??= [];
                    firecoPad.modelContentChanges.push(codeChanges);
                    firecoPad.onDidChangeModelContent?.();
                };

//onDidChangeModelContentOrError
                const disposer = monacoEditor.onDidChangeModelContent((codeChanges) => {
                    if (!firecoPad.isMonacoEditorReady && setIsMonacoEditorReady) {
                        firecoPad.isMonacoEditorReady = true;
                        setIsMonacoEditorReady(firecoPad.isMonacoEditorReady);
                        disposer.dispose();
                        firecoPad?.handleChangeModelContent(codeChanges);
                    }

                });

                let disposed = false;

                disposerRef.current = {
                    dispose: () => {
                        if (disposed) {
                            return;
                        }

                        debouncedAsyncContentChanged.cancel();
                        firecoPad.onDidChangeModelContent.cancel();
                        disposer?.dispose();
                        monacoEditor.dispose();

                        disposed = true;
                    },
                };

                // firecoPad.isConfigured = true;

                return action;

            } catch (error) {
                return of(loadMonacoEditorRejected(editorId, error));
            }

        } else {
            return of(
                loadMonacoEditorRejected(
                    editorId,
                    'Error: monaco is not configured.' +
                    ' Execute configureMonaco(monaco) first,' +
                    ' providing a monaco library reference'
                )
            );
        }
    }

    observeSwitchMonacoTheme(monacoTheme) {
        if (!monacoTheme) {
            return of(
                switchMonacoThemeRejected('Unknown Monaco theme type')
            );
        }

        if (this.monaco) {
            if (monacoTheme !== this.currentMonacoTheme) {
                this.currentMonacoTheme = monacoTheme;
                this.monaco.editor.setTheme(this.currentMonacoTheme);
            }
        } else {
            this.currentMonacoTheme = monacoTheme;
        }
        return of(switchMonacoThemeFulfilled());
    }

    ajax = (...options) => {
        if (fireco.ajax) {
            return fireco.ajax(...options);
        }

        return new Observable(observer => {
            let subscription = null;

            this.loadFires().then(() => {
                subscription = fireco.ajax(...options).subscribe({
                    next(value) {
                        observer.next(value);
                    },
                    error(err) {
                        observer.error(err);
                    },
                    complete() {
                        observer.complete();
                    }
                });

            }).catch(error => observer.error(error));

            return () => {
                subscription?.unsubscribe();
            };
        });
    };

    loadFires = async () => {
        if (fireco.app) {
            return fireco;
        }

        const firebase = (await import('firebase/compat/app')).default;
        await import ('firebase/compat/auth');
        await import ('firebase/compat/database');
        const allFirepad = (await import( 'firepad'));
        const Firepad = allFirepad.default;

        //MonacoAdapter.prototype.onChange


//         const MonacoAdapter = Firepad.MonacoAdapter;
//
//
//         const onChange = MonacoAdapter.prototype.onChange;
//
// // Step 2: Override the function with your custom version
//         let tid = null;
//         let doOp = true;
//         let previousVersionId = 0;
//         MonacoAdapter.prototype.onChange = function (...args) {
//             // if (!doOp) {
//             //     return
//             // }
//             // Insert your custom logic here
//
//             const currentVersionId = args[0].versionId;
//
//             if (previousVersionId === currentVersionId) {
//
//             }
//
//             const {changes} = args[0];
//
//             const delta = currentVersionId - previousVersionId;
//             console.log("sendOperation() onChange", this, {
//                 delta,
//                 currentVersionId,
//                 previousVersionId
//             }, changes, args[0]);
//             previousVersionId = currentVersionId;
//
//
//             // doOp = false;
//             // try {
//             onChange.call(this, ...args);
//             // } catch (e) {
//             //     console.log("sendOperation() onChange", args[0].versionId, args, e);
//             // }
//             // Call the original function with the current context and original arguments
//
//             // const result =
//             // clearTimeout(tid);
//             // tid = setTimeout(
//             //     () => {
//             //         doOp = true;
//             //     }
//             //     , 0);
//
//             // You can also modify the result here if needed
//             // console.log("Custom logic after calling the original function");
//
//             // Return the result
//             // return result;
//         };
        // console.log("Firepad", {...Firepad}, MonacoAdapter);

        // Step 1: Save a reference to the original function
        // const originalOperationFromMonacoChanges = MonacoAdapter.prototype.operationFromMonacoChanges;

// Step 2: Override the function with your custom version
//         MonacoAdapter.prototype.operationFromMonacoChanges = function (changes, doc, fromVersion) {
//             // Insert your custom logic here
//             console.log("Custom logic before calling the original function", {changes, doc, fromVersion});
//
//             // Call the original function with the current context and original arguments
//
//             const result = originalOperationFromMonacoChanges.call(this, changes, doc, fromVersion);
//
//             // You can also modify the result here if needed
//             // console.log("Custom logic after calling the original function");
//
//             // Return the result
//             return result;
//         };

        //TextOperation.prototype.compose

//         const TextOperation = Firepad.TextOperation;
//         // console.log("Firepad", {...Firepad}, MonacoAdapter);
//
//         // Step 1: Save a reference to the original function
//         const compose = TextOperation.prototype.compose;
//
// // Step 2: Override the function with your custom version
//         TextOperation.prototype.compose = function (operation2) {
//             // Insert your custom logic here
//             var operation1 = this;
//             // console.log("Custom logic before calling compose", {
//             //     operation1,
//             //     operation2
//             // }, operation1.targetLength, operation2.baseLength);
//             if (operation1.targetLength !== operation2.baseLength) {
//                 operation1.targetLength = operation2.baseLength
//             }
//
//             try {
//                 const result = compose.call(this, operation2);
//                 return result;
//             } catch (e) {
//                 return operation2;
//             }
//             // Call the original function with the current context and original arguments
//             //const result = compose.call(this, operation2);
//
//             // You can also modify the result here if needed
//             // console.log("Custom logic after calling the original function");
//
//             // Return the result
//             //return result;
//         };

//         const FirebaseAdapter = Firepad.firebaseAdapter_;
//         console.log("Firepad", {...Firepad}, allFirepad, FirebaseAdapter);
//
//         // Step 1: Save a reference to the original function
//         const sendOperation = FirebaseAdapter.prototype.sendOperation;
//
// // Step 2: Override the function with your custom version
//         FirebaseAdapter.prototype.sendOperation = function (operation, callback) {
//             // Insert your custom logic here
//             // var operation1 = this;
//             // // console.log("Custom logic before calling compose", {
//             // //     operation1,
//             // //     operation2
//             // // }, operation1.targetLength, operation2.baseLength);
//             // if (operation1.targetLength !== operation2.baseLength) {
//             //     operation1.targetLength = operation2.baseLength
//             // }
//
//             // Sanity check that this operation is valid.
//             console.log("sendOperation", this.document_?.targetLength === operation?.baseLength, this.document_?.targetLength, operation?.baseLength);
//
//             try {
//                 const result = sendOperation.call(this, operation, callback);
//                 // return result;
//             } catch (e) {
//                 // return operation2;
//             }
//             // Call the original function with the current context and original arguments
//             //const result = compose.call(this, operation2);
//
//             // You can also modify the result here if needed
//             // console.log("Custom logic after calling the original function");
//
//             // Return the result
//             //return result;
//         };

        // FirebaseAdapter.prototype.sendOperation


        // const firebase = (await import('firebase/app')).default;
        // // const {getAuth} =
        // await import ('firebase/auth');
        // // const Database =
        // await import ('firebase/database');
        // const Firepad = (await import( '@hackerrank/firepad')).default;
        //"@hackerrank/firepad": "^0.8.5",

        // try {
        // const firebase = (await import('firebase/compat/app')).default;
        // // const {getAuth} =
        // await import ('firebase/compat/auth');
        // // const Database =
        // await import ('firebase/compat/database');
        // const Firepad = (await import( '@lucafabbian/firepad')).default;

        //old firebase 8...
        // const firebase = (await import('firebase/app')).default;
        // // const {getAuth} =
        // await import ('firebase/auth');
        // // const Database =
        // await import ('firebase/database');
        // const Firepad = (await import('firepad')).default;// "firepad": "^1.5.11",


        const {initializeApp} = firebase;
        // const {getDatabase, serverTimestamp} = Database;


        fireco.appId = this.pastebinId ?? fireco.appId;

        const app = initializeApp(config, fireco.appId);
        const database = firebase.database(app);
        const auth = firebase.auth(app);
        // const database = getDatabase(app);
        // const auth = getAuth(app);
        const serverTimestamp = () => firebase.database.ServerValue.TIMESTAMP;
        // console.log("firebase", {firebase, fireco, database, auth, f: serverTimestamp(), config});
        const connectedRef = database.ref(".info/connected");

        const scrCloudFunctions = makeScrCloudFunctions(app, serverTimestamp);
        const ajax = makeAjax(scrCloudFunctions);

        fireco.firebase = firebase;
        fireco.Firepad = Firepad;
        fireco.app = app;
        fireco.database = database;
        fireco.auth = auth;
        fireco.serverTimestamp = serverTimestamp;
        fireco.connectedRef = connectedRef;
        fireco.scrCloudFunctions = scrCloudFunctions;
        fireco.ajax = ajax;

        return fireco;
        // } catch (e) {
        //     console.log("loadFires", e);
        // }
    };

    authSignInMethod = "signInAnonymously"; //signInWithCustomToken

    observeActivateFireco(pastebinId, pastebinToken, isNew, timeout = 1000) {
        // console.log("observeActivateFireco", {pastebinId, pastebinToken, isNew});
        if (pastebinId && pastebinToken) {

            fireco.isAuth = false;
            return new Observable(observer => {
                //http://localhost:3000/#-MmsphZhV1G1mZdAF3Ze

                let retries = 3;
                let tid = null;
                const onError = (error) => {
                    clearTimeout(tid);
                    tid = setTimeout(() => {
                        if (retries > 0) {
                            retries--;
                            signIn();
                            return;
                        }

                        if (fireco.isAuth === false) {
                            return;
                        }

                        fireco.isAuth = false;
                        observer.next(activateFirepadRejected(error));

                    }, timeout);

                };
                const signIn = () => {
                    if (this.authSignInMethod === "signInAnonymously") {
                        return fireco.auth.signInAnonymously(

                        ).catch(onError);
                    }

                    return fireco.auth.signInWithCustomToken(
                        pastebinToken
                    ).catch(onError);
                };


                this.loadFires().then(() => {
                    fireco.onValue = snap => observer.next(onConnectionChanged(snap.val()));
                    fireco.connectedRef.on("value", fireco.onValue);


                    fireco.unsubscribeOnAuthStateChanged =
                        fireco.auth.onAuthStateChanged(user => {
                                // console.log("onAuthStateChanged", user);
                                if (user) {
                                    fireco.isAuth = true;
                                    this.configureFirecoPaths(
                                        pastebinId,
                                        isNew
                                        // , user.uid
                                    );

                                    //todo: make users use google to persist pastebins
                                    // add more robust rules
                                    //https://github.com/FirebaseExtended/firepad/tree/master/examples/security
                                    // move identify framework to manage old data
                                    // try {
                                    //     const provider = new fireco.firebase.auth.GoogleAuthProvider();
                                    //     // fireco.firebase.auth()
                                    //     fireco.auth
                                    //         .signInWithPopup(provider)
                                    //         .then((result) => {
                                    //             /** @type {firebase.auth.OAuthCredential} */
                                    //             const credential = result.credential;
                                    //
                                    //             // This gives you a Google Access Token. You can use it to access the Google API.
                                    //             const token = credential.accessToken;
                                    //             // The signed-in user info.
                                    //             const user = result.user;
                                    //             // IdP data available in result.additionalUserInfo.profile.
                                    //             const googleUser = user;
                                    //
                                    //             const credentialN = fireco.firebase.auth.GoogleAuthProvider.credential(
                                    //                 googleUser.getAuthResponse().id_token);
                                    //
                                    //             // fireco.firebase.auth
                                    //             fireco.auth
                                    //                 .currentUser.linkWithCredential(credentialN)
                                    //                 .then((usercred) => {
                                    //                     const user = usercred.user;
                                    //                     console.log("Anonymous account successfully upgraded", user);
                                    //                 }).catch((error) => {
                                    //                 console.log("Error upgrading anonymous account", error);
                                    //             });
                                    //             // ...
                                    //         }).catch((error) => {
                                    //         // Handle Errors here.
                                    //         var errorCode = error.code;
                                    //         var errorMessage = error.message;
                                    //         // The email of the user's account used.
                                    //         var email = error.email;
                                    //         // The firebase.auth.AuthCredential type that was used.
                                    //         var credential = error.credential;
                                    //
                                    //
                                    //         // ...
                                    //     });
                                    // }catch (e){
                                    //     console.log("signInWithPopup", e);
                                    // }

                                    observer.next(
                                        activateFirepadFulfilled(user)
                                    );
                                } else {
                                    fireco.isAuth = false;
                                    onError(
                                        new Error("Firebase user logged out")
                                    );
                                }
                            },
                            onError
                        );

                    signIn();
                });

                return () => {
                    fireco.connectedRef?.off("value", fireco.onValue);
                    fireco.unsubscribeOnAuthStateChanged?.();
                    fireco.unsubscribeOnAuthStateChanged = null;
                };

            });
        } else {
            return of(activateFirepadRejected('Values missing:' +
                ' pastebinToken, firepadPaths; or Fireco is not configured.'));
        }
    }

    disposeFirecos() {
        fireco.disposeFirecoChat?.();

        for (const editorId in this.firecoPads) {
            this.firecoPads[editorId]?.firepadInstance?.dispose();
        }
    }

    observeConfigureFirecoEditor(editorId, editorText, flushChangesDebounceTime = 500, ignoreSyncChangesTime = 5000) {
        if (!fireco.isAuth) {
            return of(configureFirecoEditorRejected(editorId, 'Error:' +
                ' Fireco' +
                ' is not' +
                ' authenticated. Execute activateFireco(pastebinToken) first,' +
                ' providing a' +
                ' a valid token'));
        }
        if (!this.monaco) {
            return of(configureFirecoEditorRejected(editorId, 'Error:' +
                ' monaco' +
                ' is not' +
                ' configured. Execute configureMonaco(monaco) first, providing a' +
                ' monaco library reference'));
        }

        try {
            const firecoPad = this.firecoPads[editorId];

            firecoPad.firebaseRef = fireco.database.ref(firecoPad.firebasePath);
            // const editor = firecoPad.monacoEditor;
            // fixed 1.5.11 (firepad)
            // editor.onDidBlurEditor = editor.onDidBlurEditorWidget;
            // editor.onDidFocusEditor = editor.onDidFocusEditorWidget;
            let isReady = false;

            firecoPad.firepadInstance = fireco.Firepad.fromMonaco(
                firecoPad.firebaseRef,
                firecoPad.monacoEditor,
                {defaultText: editorText}
            );


            let changesBuffer = [];

            let flushTid = null;
            const doCrossOSCompatibility = () => {
                const model = firecoPad.monacoEditor?.getModel();
                const monaco = this.monaco;


                if (!(model && monaco)) {
                    return
                }

                normalizeEditorModelText(model, monaco);
                // console.log("YOLT", editorId, {model, monaco});
            };

            let isCrossOSCompatibleSync = false;
            let isCrossOSCompatibleSyncEdits = false;
            const flushChangesBuffer = () => {
                // Clear any scheduled flush to debounce changes
                clearTimeout(flushTid);
                flushTid = setTimeout(() => {
                    if (!isCrossOSCompatibleSync) {
                        // console.log("YOLO", editorId, {
                        //     isCrossOSCompatibleSync,
                        //     isCrossOSCompatibleSyncEdits,
                        //     changesBuffer
                        // });
                        isCrossOSCompatibleSync = true;
                        isCrossOSCompatibleSyncEdits = true;
                        doCrossOSCompatibility();
                        return;
                    }


                    if (isCrossOSCompatibleSyncEdits) {
                        // console.log("YOLTR", editorId, {
                        //     isCrossOSCompatibleSync,
                        //     isCrossOSCompatibleSyncEdits,
                        //     changesBuffer
                        // });
                        isCrossOSCompatibleSyncEdits = false;
                        changesBuffer = [];
                        return;
                    }


                    if (firecoPad.handleChangeModelContent) {
                        // console.log("YOLTE", editorId, {
                        //     isCrossOSCompatibleSync,
                        //     isCrossOSCompatibleSyncEdits,
                        //     changesBuffer
                        // });
                        changesBuffer.forEach(change => {
                            firecoPad.handleChangeModelContent(change);
                        });
                        changesBuffer = []; // Clear the buffer after processing changes
                    }
                }, flushChangesDebounceTime);
            };

            let ignoreSynced = false;
            let syncTid = null;

            const scheduleIgnoreSync = () => {
                // Clear any previous ignoreSync schedule
                clearTimeout(syncTid);
                syncTid = setTimeout(() => {
                    ignoreSynced = true; // Enable fallback to force flushing changes
                    flushChangesBuffer(); // Flush changes immediately upon fallback activation
                }, ignoreSyncChangesTime);
            };

            // Initialize the fallback mechanism
            scheduleIgnoreSync();

            const onContentChange = (event) => {
                changesBuffer.push(event);
                if (!ignoreSynced) {
                    scheduleIgnoreSync(); // Prepare fallback if not already in fallback state
                } else {
                    flushChangesBuffer(); // Flush immediately if in fallback state
                }
            };
            // Setup the listener for content changes
            const disposer = firecoPad.monacoEditor.onDidChangeModelContent(onContentChange);

            const flushChanges = (isSynced) => {

                // Stop the fallback mechanism if changes are synced
                clearTimeout(syncTid);
                if (isReady && isSynced) {
                    ignoreSynced = false; // Respect actual sync state, reset fallback
                    flushChangesBuffer(); // Flush changes as sync is confirmed
                } else {
                    scheduleIgnoreSync(); // Prepare fallback if not synced
                }
            };

// Listen for sync state changes
            firecoPad.firepadInstance.on('synced', flushChanges);


            firecoPad.serverTimestamp = fireco.serverTimestamp;

            firecoPad.firepadHeadless = () => fireco.Firepad.Headless;
            return new Observable(observer => {
                observer.next(configureFirecoEditorFulfilled(editorId));
                const onReady = () => {
                    isReady = true;
                    observer.next(configureFirecoEditorReady(editorId));
                    observer.complete();
                };
                firecoPad.firepadInstance.on('ready', onReady);

                return () => {
                    // isReady = false;
                    firecoPad.firepadInstance.off('ready', onReady);
                    // disposer?.dispose();
                };
            });
        } catch (error) {
            return of(configureFirecoEditorRejected(editorId, error));
        }
    }

    observeConfigureFirecoChat(
        onFirecoActive, disposeFirecoChat, chatUserIdLocalStoragePath
    ) {
        try {
            fireco.chatRef = fireco.chatRef || fireco.database.ref(fireco.chatPath);
            fireco.usersRef = fireco.usersRef || fireco.database.ref(
                fireco.usersPath
            );

            fireco.disposeFirecoChat = disposeFirecoChat;

            onFirecoActive(
                fireco.chatRef,
                fireco.usersRef,
                fireco.serverTimestamp,
                chatUserIdLocalStoragePath
            );

            return of(
                configureFirecoChatFulfilled()
            );
        } catch (error) {
            return of(
                configureFirecoChatRejected(error)
            );
        }
    }

    observeConfigureFirecoPersistableComponent(path, onFirecoActive) {
        try {
            if (
                !path || path.trim().length === 0 || path.startsWith('/')
            ) {
                return of(
                    configureFirecoChatRejected(
                        'Empty path string or starts with /'
                    )
                );
            }
            fireco.persistableComponents[path] =

                fireco.persistableComponents[path] ||
                fireco.database.ref(`${fireco.persistablePath}/${path}`);
            onFirecoActive(fireco.persistableComponents[path], fireco.serverTimestamp);
            // fireco.persistableComponentsOnDispose.push({onDispose, path});
            return of(
                configureFirecoPersistableComponentFulfilled()
            );
        } catch (error) {
            return of(
                configureFirecoPersistableComponentRejected(error)
            );
        }
    }

    observeFirecoEditorsSetUserId(userId, userColor) {
        try {
            for (const editorId in this.firecoPads) {
                const {firepadInstance} = this.firecoPads[editorId] || {};
                if (firepadInstance) {
                    firepadInstance.setUserId(userId || "unknown");
                    userColor && firepadInstance.setUserColor(userColor);
                }
            }
            return of(
                firecoEditorsSetUserIdFulfilled(userId, userColor)
            );
        } catch (error) {
            return of(
                firecoEditorsSetUserIdRejected(userId, userColor, error)
            );
        }
    }

    observeSearchStateChange(searchState = {}) {
        try {
            const {
                value,
                isRegExp,
                isCase,
                isWord,
                captureMatches = false,
                searchOnlyEditableRange = false
            } = searchState;
            const defaultWordSeparators = isWord ?
                this.monaco.editor.EditorOptions?.wordSeparators?.defaultValue
                : null;
            let decorations = [];

            for (const editorId in this.firecoPads) {
                const firecoPad = this.firecoPads[editorId];
                const {monacoEditor} = firecoPad || {};
                if (monacoEditor) {

                    firecoPad.findMatchesDecorations ??= monacoEditor.createDecorationsCollection();

                    const {findMatchesDecorations} = firecoPad;

                    if (value) {
                        const matches = monacoEditor.getModel?.().findMatches(
                            value, searchOnlyEditableRange, isRegExp, isCase,
                            defaultWordSeparators, captureMatches
                        );

                        decorations = matches.map(({range}) => ({
                            range,
                            options: {className: MonacoHighlightTypes.text}
                        }));

                        findMatchesDecorations.set(decorations);
                    } else {
                        findMatchesDecorations.clear();
                    }
                }
            }
            return of(
                searchStateChangeFulfilled({searchState, decorations})
            );
        } catch (error) {
            return of(
                searchStateChangeRejected(error)
            );
        }
    }

    // setEditorText(editorId, text) {
    //     const firecoPad = this.firecoPads[editorId];
    //     firecoPad.text = text;
    //     if (!firecoPad.monacoEditor
    //     || text === firecoPad.monacoEditor.getValue()) {
    //         return;
    //     }
    //     this.onDidChangeModelContent = firecoPad.onDidChangeModelContent;
    //     firecoPad.onDidChangeModelContent = null;
    //     const viewState = firecoPad.monacoEditor.saveViewState();
    //     firecoPad.monacoEditor.setValue(text);
    //     firecoPad.monacoEditor.restoreViewState(viewState);
    //
    //     firecoPad.onDidChangeModelContent = this.onDidChangeModelContent;
    //     setTimeout(() => {
    //         firecoPad.buildAst && firecoPad.buildAst();
    //     }, 0);
    // }

//
// makeTraceSearchHistoryFirebase(pastebinId = this.pastebinId) {
//   return new Firebase(`${this.baseURL}/${pastebinId}/content/search`);
// }

//
// makeMetagsURLFirebaseVote(metagURLKey, pastebinId = this.pastebinId) {
//   return new Firebase(
//   `${this.baseURL}/${pastebinId}/metags/urls/${metagURLKey}`);
// }
//
//
// makePastebinMetagsURLsFirebase(pastebinId = this.pastebinId) {
//   return new Firebase(`${this.baseURL}/${pastebinId}/metags/urls`);
// }
//
// makeGlobalMetagsURLsFirebase(pastebinId = this.pastebinId) {
//   return new Firebase(`${this.baseURL}/metags/urls`);
// }
//
// makeGlobalMetagsURLsFirebaseByKey(metagGlobalURLKey) {
//   return new Firebase(`${this.baseURL}/metags/urls/${metagGlobalURLKey}`);
// }
//

}

export default function configureAppManager(urlData, isProduction) {
    return new AppManager(urlData, isProduction);
};
