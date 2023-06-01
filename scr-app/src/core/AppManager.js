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
    configureMonacoModel,
} from '../utils/monacoUtils';

import {MonacoHighlightTypes} from "../themes";

import firebaseConfig from './firebaseConfig';
import configureMonacoDefaults from '../configureMonaco';
import {
    MonacoOptions,
    parseOptions
} from "./modules/ALE";

let MonacoJSXHighlighter = null;

const {root, config} = firebaseConfig;

const fireco = {
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
};

export const editorIds = {
    js: 'js',
    html: 'html',
    css: 'css',
};

class AppManager {
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
    }

    observeLoadMonaco() {
        return new Observable(observer => {
                (async () => await import ('monaco-editor'))()
                    .then(monaco => {
                        // fixes breaking changes [0.22.0] (29.01.2021)
                        global.monaco = monaco;
                        configureMonacoDefaults(monaco);
                        observer.next(loadMonacoFulfilled(monaco));
                    })
                    .catch(error => {
                        observer.next(loadMonacoRejected(error)
                        )
                    });
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

    setPastebinId(pastebinId, shouldReplace = false) {
        if (pastebinId && (!this.pastebinId || shouldReplace)) {
            global.location.hash = pastebinId;

            this.pastebinId = pastebinId;

            const userLogRocket = {
                name: pastebinId,
                email: `${pastebinId}@scr.run`,
            };

            this.initLogRocket(userLogRocket);
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

    configureFirecoPaths(pastebinId, isNew) {
        fireco.chatPath = `${root}/${pastebinId}/chat`;
        fireco.usersPath = `${root}/${pastebinId}/users`;
        fireco.persistablePath = `${root}/${pastebinId}/components`;
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
            onEditorContentFirstRender,
            disposerRef,
        } = editorHooks;

        if (this.monaco) {
            try {
                if (isConsole) {
                    this.consoleInputEditor = configureMonacoEditor(
                        this.monaco,
                        editorRef.current,
                        {
                            ...monacoOptions,
                            model: this.monaco.editor.createModel(
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

                firecoPad.lineNumbersProvider = configureLineNumbersProvider(
                    editorId
                );

                const editorOptions = {
                    ...firecoPad.editorOptions,
                    model: firecoPad.monacoEditorModel,
                    lineNumbers: firecoPad.lineNumbersProvider.lineNumbers
                };

                const monacoEditor = configureMonacoEditor(
                    this.monaco,
                    editorRef.current,
                    editorOptions,
                );

                firecoPad.monacoEditor = monacoEditor;


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
                    (changes) => monacoEditorContentChanged?.(
                        editorId, monacoEditor.getValue(), changes
                    );
                const asyncContentChanged = async (changes) => {
                    firecoPad.onContentChanged?.();
                    firecoPad.onContentChangedAction(changes);
                };

                const timeWindow = 150;
                let layoutHidden = false;
                const throttledWidgetLayoutChange = throttle(
                    () => firecoPad.widgetLayoutChange?.(),
                    timeWindow, {leading: true, trailing: true});

                const debouncedAsyncContentChanged = debounce(
                    (changes) => {
                        asyncContentChanged(changes)
                            .then(() => (layoutHidden = false))
                            .catch(error => console.log(
                                    '[ERROR]asyncContentChanged',
                                    error
                                )
                            );
                    }, timeWindow * 2);
                //todo: simplify change response
                firecoPad.onDidChangeModelContent = debounce(async changes => {
                    if (!layoutHidden) {
                        layoutHidden = true;
                        throttledWidgetLayoutChange();
                    }
                    debouncedAsyncContentChanged(changes);
                }, 50, {maxWait: timeWindow});

                firecoPad.isMonacoEditorReady = firecoPad.isMonacoEditorReady ?? false;

                const disposer = monacoEditor
                    .onDidChangeModelContent(changes => {
                        !firecoPad.isMonacoEditorReady &&
                        (firecoPad.isMonacoEditorReady = true);

                        onEditorContentFirstRender?.();
                        firecoPad.onDidChangeModelContent?.(changes)
                    });

                let disposed = false;

                disposerRef.current = {
                    dispose: () => {
                        if (disposed) {
                            return;
                        }

                        debouncedAsyncContentChanged.cancel();
                        firecoPad.onDidChangeModelContent.cancel();
                        disposer.dispose();
                        monacoEditor.dispose();

                        disposed = true;
                    },
                };

                return of(
                    loadMonacoEditorFulfilled(editorId, firecoPad)
                );

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

    observeActivateFireco(pastebinId, pastebinToken, isNew) {
        if (pastebinId && pastebinToken) {
            this.configureFirecoPaths(pastebinId, isNew);
            fireco.isAuth = false;
            return Observable.create(observer => {
                if (fireco.unsubscribeOnAuthStateChanged) {
                    fireco.unsubscribeOnAuthStateChanged();
                    fireco.unsubscribeOnAuthStateChanged = null;
                }
                //http://localhost:3000/#-MmsphZhV1G1mZdAF3Ze
                const loadFire = async () => {
                    if (!fireco.app) {
                        fireco.firebase = (await import('firebase/app')).default;
                        await import ('firebase/auth');
                        await import ('firebase/database');

                        fireco.Firepad = (await import('firepad')).default;
                        fireco.app =
                            fireco.firebase.initializeApp(config, pastebinId);
                        fireco.database = fireco.firebase.database(fireco.app);
                        fireco.auth = fireco.firebase.auth(fireco.app);

                        fireco.serverTimestamp =
                            () => fireco.firebase.database.ServerValue.TIMESTAMP;
                        fireco.connectedRef =
                            fireco.database.ref(".info/connected");

                    } else {
                        fireco.connectedRef.off("value", fireco.onValue);
                    }

                    fireco.onValue =
                        snap => observer.next(onConnectionChanged(snap.val()));

                    fireco.connectedRef.on("value", fireco.onValue);
                };

                loadFire().then(() => {
                    const onError = (error) => {
                        fireco.isAuth = false;
                        observer.next(activateFirepadRejected(error));
                    };

                    fireco.unsubscribeOnAuthStateChanged =
                        fireco.auth.onAuthStateChanged(user => {
                                if (user) {
                                    fireco.isAuth = true;
                                    observer.next(
                                        activateFirepadFulfilled(user)
                                    );
                                } else {
                                    onError(
                                        new Error("Firebase user logged out")
                                    );
                                }
                            },
                            onError
                        );

                    return fireco.auth.signInWithCustomToken(
                        pastebinToken
                    ).catch(onError);
                });

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

    observeConfigureFirecoEditor(editorId, editorText) {
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
            firecoPad.firepadInstance = fireco.Firepad.fromMonaco(
                firecoPad.firebaseRef,
                firecoPad.monacoEditor,
                {defaultText: editorText}
            );
            return Observable.create(observer => {
                observer.next(configureFirecoEditorFulfilled(editorId));
                firecoPad.firepadInstance.on('ready', () => {
                    observer.next(configureFirecoEditorReady(editorId));
                });
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
