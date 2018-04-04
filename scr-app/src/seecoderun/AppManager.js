import {Observable} from 'rxjs';
import firebase from 'firebase';
import Firepad from 'firepad';
import j from 'jscodeshift';
import _ from 'lodash';

import {
  configureMonacoModelsFulfilled,
  configureMonacoModelsRejected,
  switchMonacoThemeFulfilled,
  switchMonacoThemeRejected,
  updateMonacoModelsFulfilled,
  updateMonacoModelsRejected,
} from '../redux/modules/monaco';

import {
  loadMonacoEditorFulfilled,
  loadMonacoEditorRejected,
  monacoEditorContentChanged,
} from '../redux/modules/monacoEditor';

import {
  configureFirecoEditorFulfilled,
  configureFirecoEditorRejected,
  activateFirepadFulfilled,
  activateFirepadRejected,
  onConnectionChanged,
  configureFirecoChatRejected,
  configureFirecoChatFulfilled,
} from '../redux/modules/fireco';

import {
  configureMonacoModel,
  configureMonacoEditor,
  configureMonacoEditorMouseEventsObservable,
  configureLineNumbersProvider,
} from '../utils/monacoUtils';

import JSXColoringProvider from '../utils/JSXColoringProvider';
import LiveExpressionWidgetProvider from '../utils/LiveExpressionWidgetProvider';

const dataBaseRoot = '/scr2';
const firebaseConfig = {
  apiKey: "AIzaSyBmm0n6NgjksFjrM6D5cDX7_zw-QH9xwiI",
  authDomain: "seecoderun.firebaseapp.com",
  databaseURL: "https://seecoderun.firebaseio.com",
  projectId: "firebase-seecoderun",
  storageBucket: "firebase-seecoderun.appspot.com",
  messagingSenderId: "147785767581"
};

const fireco = {
  TIMESTAMP: firebase.database.ServerValue.TIMESTAMP,
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
};

const defaultFirecoPad = {
  id: null,
  language: 'html',
  isJsx: false,
  editorComponent: null,
  monacoEditor: null,
  monacoEditorModel: null,
  monacoEditorSavedState: null, //{text: null, viewState: null}
  editorOptions: {},
  onContentChanged: null,
  buildAst: null, // only populated if isJsx is true
  onAstBuilt: null,
  firebasePath: null,
  firebaseRef: null,
  headlessFirepad: null,
  starvationTimeout: null,
  setFirecoText: null,
  getFirecoText: null,
  isNew: false,
  isInit: false,
  ignoreContentChange: false,
  mutex: false,
  nextSetFirecoTexts: [],
  text: null,// value obtained by firepad or set via scr
};

const editorIds = {
  'js': 'js',
  'html': 'html',
  'css': 'css',
};

export const monacoThemes = {
  current: 'vs-light',
  lightTheme: 'vs-light', // matches withRoot.js themes' keys
  darkTheme: 'vs-dark'// matches withRoot.js themes' keys
};

export const getEditorIds = () => ({...editorIds});

class AppManager {
  constructor() {
    this.pastebinLayout = null;
    this.pastebinId = null;
    this.monaco = null;
    this.hasSavedEditorsStates = false;
    this.firecoPads = { // editorIds as in Firebase: pastebinId/content/editorId (e.g. js)
      [editorIds['js']]: {
        ...defaultFirecoPad,
        id: editorIds['js'],
        language: 'javascript',
        editorOptions: {
          glyphMargin: true,
          nativeContextMenu: false,
          hover: true,
        },
      },
      [editorIds['html']]: {
        ...defaultFirecoPad,
        id: editorIds['html'],
      },
      [editorIds['css']]: {
        ...defaultFirecoPad,
        id: editorIds['css'],
        language: 'css'
      }
    };
    this.jsxColoringProvider = null;
    this.chatOnDispose = null;
  }

  observeDispose() {
    try {
      this.dispose();
      return Observable.of({type: 'DISPOSE_FULFILLED'});
    } catch (error) {
      return Observable.of({type: 'DISPOSE_REJECTED', error: error});
    }
  }

  setPastebinId(pastebinId, shouldReplace = false) {
    if (pastebinId && (!this.pastebinId || shouldReplace)) {
      window.location.hash = pastebinId;
      this.pastebinId = pastebinId;
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
        this.firecoPads[editorId].monacoEditorSavedState = editorsStates[editorId];
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
        initialEditorsTexts[editorId] = this.firecoPads[editorId].monacoEditorSavedState.text;
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
    if (gridLayouts && this.pastebinLayout && this.pastebinLayout.restoreGridLayouts) {
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
    this.chatOnDispose && this.chatOnDispose();
    this.disposeFireco();
  }

  configureFirecoPaths(pastebinId, isNew) {
    fireco.chatPath = `${dataBaseRoot}/${pastebinId}/chat`;
    fireco.usersPath = `${dataBaseRoot}/${pastebinId}/users`;
    for (const editorId in this.firecoPads) {
      this.firecoPads[editorId].firebasePath = `${dataBaseRoot}/${pastebinId}/firecos/${editorId}`;
      this.firecoPads[editorId].isNew = isNew;
    }
  }

  observeConfigureMonacoModels() {
    try {
      if (window.monaco) {
        this.monaco = window.monaco;
        for (const editorId in this.firecoPads) {
          const firecoPad = this.firecoPads[editorId];
          let text = '';
          if (this.hasSavedEditorsStates &&
            firecoPad.monacoEditorSavedState) {
            text = _.isString(
              firecoPad.monacoEditorSavedState.text
            ) ? firecoPad.monacoEditorSavedState.text : '';
          }
          firecoPad.monacoEditorModel =
            configureMonacoModel(this.monaco,
              editorId,
              text,
              firecoPad.language, () => {
                firecoPad.isJsx = true;
              });
        }

        return Observable.of(configureMonacoModelsFulfilled());
      } else {
        return Observable.of(configureMonacoModelsRejected('Error: Monaco is not' +
          ' loaded'));
      }
    } catch (e) {
      return Observable.of(configureMonacoModelsRejected(e));
    }
  }

  observeUpdateMonacoModels(initialEditorsTexts) {
    try {
      if (initialEditorsTexts) {
        for (const editorId in this.firecoPads) {
          const firecoPad = this.firecoPads[editorId];
          if (!firecoPad.isInit && _.isString(initialEditorsTexts[editorId])) {
            firecoPad.monacoEditorModel.setValue(initialEditorsTexts[editorId]);
          } else {
            return Observable.of(updateMonacoModelsRejected('Error: no ' +
              ' text was provided for editor with id: ' + editorId + ', or' +
              ' Fireco set it first.'));
          }
        }
        return Observable.of(updateMonacoModelsFulfilled());
      } else {
        return Observable.of(updateMonacoModelsRejected('Error: no editors' +
          ' texts was provided'));
      }
    } catch (e) {
      return Observable.of(updateMonacoModelsRejected(e));
    }
  }

  addEnhancers(monaco, editorId, firecoPad) {

    if (!firecoPad.jsxColoringProvider) {
      firecoPad.jsxColoringProvider =
        new JSXColoringProvider(monaco, editorId, firecoPad.monacoEditor);
      firecoPad.liveExpressionWidgetProvider =
        new LiveExpressionWidgetProvider(monaco, editorId, firecoPad.monacoEditor);
    }

    firecoPad.astResult = {};
    firecoPad.getAst = () => {
      const code = firecoPad.monacoEditor.getValue();
      const astBeforeError = firecoPad.astResult.ast || firecoPad.astResult.astBeforeError;
      let ast = null, astError = null;
      try {
        ast = j(code);
        astError = null;

      } catch (error) {
        ast = null;
        astError = error;
        //todo: needs to be smart and remove errors, then try again.
      }
      return {code, ast, astError, astBeforeError};
    };
    firecoPad.parseAst = () => {
      firecoPad.astResult = firecoPad.getAst();
      firecoPad.onAstBuilt && firecoPad.onAstBuilt(firecoPad.astResult.ast, firecoPad.astResult.astError, firecoPad.astResult.astBeforeError);
    };
    let getAstTimeout = null;
    firecoPad.astDebounceTime = 50;
    firecoPad.buildAst = (debounceTime, enhanceDebounceTime) => {
      clearTimeout(getAstTimeout);
      getAstTimeout = setTimeout(() => {
        firecoPad.parseAst();
        firecoPad.enhanceCode(enhanceDebounceTime);
      }, debounceTime || (debounceTime === 0 ? 0 : firecoPad.astDebounceTime));
    };

    let enhanceTimeout = null;
    firecoPad.enhanceDebounceTime = 300;
    firecoPad.enhanceCode = (debounceTime) => {
      clearTimeout(enhanceTimeout);
      enhanceTimeout = setTimeout(() => {
        firecoPad.liveExpressionWidgetProvider.widgetize(firecoPad.astResult);
        firecoPad.jsxColoringProvider.colorize(firecoPad.astResult.ast);
      }, debounceTime || (debounceTime === 0 ? 0 : firecoPad.enhanceDebounceTime));
    };
  }

  configureLiveExpressionWidgetsLayoutChange(firecoPad) {
    const {monacoEditor} = firecoPad;
    let isChange = false;
    let isCursorPositionInColumnZero = false;

    let prevKey = null;
    let currentKey = null;

    let tm = null;
    const widgetLayoutChange = () => {
      isChange && firecoPad.liveExpressionWidgetProvider && firecoPad.liveExpressionWidgetProvider.beforeRender();
      isChange = false;
      clearTimeout(tm);
      tm = setTimeout(() => {
        firecoPad.liveExpressionWidgetProvider && firecoPad.liveExpressionWidgetProvider.afterRender();
      }, 500);
    };

    monacoEditor.onKeyDown((event) => {
      prevKey = currentKey;
      currentKey = event.browserEvent.keyCode;
      isChange = currentKey === 13; // enter
      isChange = // backspace or delete and rightmost
        isChange || ((currentKey === 8 || currentKey === 46) && isCursorPositionInColumnZero);
      isChange = // paste or cut := ctrl||command + V||C english only =[
        isChange || ((prevKey === 17 || prevKey === 91) && (currentKey === 86 || currentKey === 88));
      widgetLayoutChange();
    });

    let currentCursorEvent = {};
    let prevCursorEvent = {};
    monacoEditor.onDidChangeCursorPosition((event) => {
      prevCursorEvent = currentCursorEvent;
      currentCursorEvent = event;
      isCursorPositionInColumnZero = currentCursorEvent.position.column === 1; // monaco 0.11.1 column-min:0=>1
    });

    monacoEditor.onDidScrollChange(widgetLayoutChange);
  }

  observeConfigureMonacoEditor(editorId, editorComponent) {
    const {editorDiv, dispatchMouseEvents, onContentChangedAction} = editorComponent;
    if (this.monaco) {
      const firecoPad = this.firecoPads[editorId];
      firecoPad.editorComponent = editorComponent;
      try {
        firecoPad.lineNumbersProvider = configureLineNumbersProvider(editorId, document);
        const editorOptions = {
          ...firecoPad.editorOptions,
          model: firecoPad.monacoEditorModel,
          lineNumbers: firecoPad.lineNumbersProvider.lineNumbers
        };
        const monacoEditor = configureMonacoEditor(this.monaco, editorDiv, editorOptions);

        if (firecoPad.monacoEditorSavedState && _.isString(firecoPad.monacoEditorSavedState.text)) {
          monacoEditor.setValue(firecoPad.monacoEditorSavedState.text);
          monacoEditor.restoreViewState(firecoPad.monacoEditorSavedState.viewState);
        }

        dispatchMouseEvents(configureMonacoEditorMouseEventsObservable(monacoEditor));
        firecoPad.monacoEditor = monacoEditor;
        if (firecoPad.isJsx) {
          this.addEnhancers(this.monaco, editorId, firecoPad); //  populates buildAst +
          this.configureLiveExpressionWidgetsLayoutChange(firecoPad);
        }

        const onContentChanged = changes => {
          const text = monacoEditor.getValue();
          onContentChangedAction && onContentChangedAction(
            monacoEditorContentChanged(editorId, text, changes, !firecoPad.ignoreContentChange)
          );
          firecoPad.buildAst && firecoPad.buildAst(); // internally triggers JSX Coloring and LiveExpressions
          firecoPad.onContentChanged && firecoPad.onContentChanged(text);
        };

        monacoEditor.onDidChangeModelContent(onContentChanged);

        firecoPad.buildAst && firecoPad.buildAst(0, 0);

        return Observable.of(loadMonacoEditorFulfilled(editorId, firecoPad));
      } catch (error) {
        return Observable.of(loadMonacoEditorRejected(editorId, error));
      }

    } else {
      return Observable.of(loadMonacoEditorRejected(editorId, 'Error: monaco is not configured. Execute configureMonaco(monaco) first, providing a monaco library reference'));
    }
  }

  observeSwitchMonacoTheme(themeType) {
    if (!monacoThemes[themeType]) {
      return Observable.of(switchMonacoThemeRejected('Unknown theme type'));
    }

    if (this.monaco) {
      if (monacoThemes[themeType] !== monacoThemes.current) {
        monacoThemes.current = monacoThemes[themeType];
        this.monaco.editor.setTheme(monacoThemes.current);
      }
      return Observable.of(switchMonacoThemeFulfilled());
    }

    return Observable.of(loadMonacoEditorRejected('Attempting to switch' +
      ' Monaco theme without loading Monaco.'));
  }

  observeActivateFireco(pastebinId, pastebinToken, isNew) {
    if (pastebinId && pastebinToken) {
      this.configureFirecoPaths(pastebinId, isNew);
      fireco.isAuth = false;
      return Observable.create(observer => {
        if (fireco.unsubscribeOnIdTokenChanged) {
          fireco.unsubscribeOnIdTokenChanged();
        }

        if (!fireco.app) {
          fireco.app = firebase.initializeApp(firebaseConfig, pastebinId);
          fireco.database = firebase.database(fireco.app);
          fireco.auth = firebase.auth(fireco.app);
          fireco.connectedRef = fireco.database.ref(".info/connected");
          fireco.connectedRef.on("value", snap =>
            observer.next(onConnectionChanged(snap.val()))
          );
        } else {
          fireco.connectedRef.off("value");
          fireco.connectedRef.on("value", snap =>
            observer.next(onConnectionChanged(snap.val()))
          );
        }

        fireco.unsubscribeOnIdTokenChanged = fireco.auth.onIdTokenChanged(
          user => {
            if (user) {
              if (!fireco.isAuth) {
                fireco.isAuth = true;
                observer.next(activateFirepadFulfilled(user));
              }
              // ignore non-token events
            }
          },
          error => {
            fireco.isAuth = false;
            observer.next(activateFirepadRejected(error));
          }
        );

        fireco.auth.signInWithCustomToken(pastebinToken)
          .catch((error) => {
            fireco.isAuth = false;
            observer.next(activateFirepadRejected(error));
          });

      });
    } else {
      return Observable.of(activateFirepadRejected('Values missing:' +
        ' pastebinToken, firepadPaths; or Fireco is not configured.'));
    }
  }

  disposeFireco() {
    for (const editorId in this.firecoPads) {
      if (this.firecoPads[editorId].headlessFirepad) {
        this.firecoPads[editorId].headlessFirepad.dispose();
      }
    }

    if (fireco.unsubscribeOnIdTokenChanged) {
      fireco.unsubscribeOnIdTokenChanged();
    }
  }

  observeConfigureFirecoEditor(editorId, editorText) {
    if (!fireco.isAuth) {
      return Observable.of(configureFirecoEditorRejected(editorId, 'Error:' +
        ' Fireco' +
        ' is not' +
        ' authenticated. Execute activateFireco(pastebinToken) first,' +
        ' providing a' +
        ' a valid token'));
    }
    if (!this.monaco) {
      return Observable.of(configureFirecoEditorRejected(editorId, 'Error:' +
        ' monaco' +
        ' is not' +
        ' configured. Execute configureMonaco(monaco) first, providing a' +
        ' monaco library reference'));
    }

    try {
      const firecoPad = this.firecoPads[editorId];
      firecoPad.firebaseRef = fireco.database.ref(firecoPad.firebasePath);
      firecoPad.headlessFirepad = new Firepad.Headless(firecoPad.firebaseRef);

      firecoPad.starvationTimeout = null;
      firecoPad.getFirecoText = () => {
        firecoPad.headlessFirepad.getText((text) => {
          if (!firecoPad.mutex) {
            firecoPad.isInit = true;
            this.setEditorText(editorId, text);
          }
        });
      };

      firecoPad.setFirecoText = (text) => {
        if (firecoPad.mutex) {
          // chains all pending editor changes
          firecoPad.nextSetFirecoTexts.unshift(() => firecoPad.setFirecoText(text));
          // firecoPad.nextSetFirecoTexts = [() => firecoPad.setFirecoText(text), ...firecoPad.nextSetFirecoTexts];
          clearTimeout(firecoPad.starvationTimeout);
          // Prevents Firepad mutex starvation when Firebase is not connected.
          firecoPad.starvationTimeout = setTimeout(() => {
            firecoPad.mutex = false;
          }, 5000);
          return;
        }

        firecoPad.mutex = true;
        firecoPad.headlessFirepad.setText(text, (/*error, committed*/) => {
          firecoPad.mutex = false;
          clearTimeout(firecoPad.starvationTimeout);
          if (firecoPad.nextSetFirecoTexts.length) {
            // only send the most recent change, discard the rest
            firecoPad.nextSetFirecoTexts[0]();
            firecoPad.nextSetFirecoTexts = [];
            // firecoPad.nextSetFirecoTexts.pop()();
            // const nextSetFirecoTexts = [...firecoPad.nextSetFirecoTexts];
            // nextSetFirecoTexts.pop()();
            // firecoPad.nextSetFirecoTexts = nextSetFirecoTexts;
          }
        });
      };

      if (firecoPad.isNew && _.isString(editorText)) {
        firecoPad.setFirecoText(editorText);
      } else {
        firecoPad.getFirecoText();
      }

      firecoPad.firebaseRef.on('value', snapshot => {
        if (snapshot.exists()) {
          firecoPad.getFirecoText();
        }
      });

      firecoPad.onContentChanged = text => {
        if (!firecoPad.ignoreContentChange) {
          firecoPad.setFirecoText(text);
        }
      };
      return Observable.of(configureFirecoEditorFulfilled(editorId));
    } catch (error) {
      return Observable.of(configureFirecoEditorRejected(editorId, error));
    }
  }

  observeConfigureFirecoChat(onFirecoActive, onDispose, chatUserIdLocalStoragePath) {
    try {
      fireco.chatRef = fireco.chatRef || fireco.database.ref(fireco.chatPath);
      fireco.usersRef = fireco.usersRef || fireco.database.ref(fireco.usersPath);
      onFirecoActive(fireco.chatRef, fireco.usersRef, fireco.TIMESTAMP, chatUserIdLocalStoragePath);
      this.chatOnDispose = onDispose;
      return Observable.of(configureFirecoChatFulfilled());
    } catch (error) {
      return Observable.of(configureFirecoChatRejected(error));
    }
  }

  setEditorText(editorId, text) {
    const firecoPad = this.firecoPads[editorId];
    firecoPad.text = text;
    if (!firecoPad.monacoEditor || text === firecoPad.monacoEditor.getValue()) {
      return;
    }
    firecoPad.ignoreContentChange = true;
    const viewState = firecoPad.monacoEditor.saveViewState();
    firecoPad.monacoEditor.setValue(text);
    firecoPad.monacoEditor.restoreViewState(viewState);
    firecoPad.ignoreContentChange = false;
    setTimeout(() => (firecoPad.buildAst && firecoPad.buildAst()), 0);
  }

//
// makeTraceSearchHistoryFirebase(pastebinId = this.pastebinId) {
//   return new Firebase(`${this.baseURL}/${pastebinId}/content/search`);
// }

//
// makeMetagsURLFirebaseVote(metagURLKey, pastebinId = this.pastebinId) {
//   return new Firebase(`${this.baseURL}/${pastebinId}/metags/urls/${metagURLKey}`);
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

export default function configureAppManager() {
  return new AppManager();
};

