import {Observable} from "rxjs";
import firebase  from 'firebase';
import {
  configureMonacoModels, LOAD_MONACO_EDITOR_FULFILLED,
  loadMonacoEditor,
  loadMonacoEditors,
  updateMonacoEditor
} from "./monacoEditor";

import {loadMonacoFulfilled, loadMonacoRejected} from "./monaco";
import {FETCH_PASTEBIN_TOKEN_FULFILLED} from "./pastebin";

const CONFIGURE_FIRECO='CONFIGURE_FIRECO';
const CONFIGURE_FIRECO_FULFILLED='CONFIGURE_FIRECO_FULFILLED';
const CONFIGURE_FIRECO_REJECTED='CONFIGURE_FIRECO_REJECTED';

const CONFIGURE_FIRECO_INIT='CONFIGURE_FIRECO_INIT';
const CONFIGURE_FIRECO_INIT_FULFILLED='CONFIGURE_FIRECO_INIT_FULFILLED';
const CONFIGURE_FIRECO_INIT_REJECTED='CONFIGURE_FIRECO_INIT_REJECTED';

const CONFIGURE_FIRECO_EDITOR='CONFIGURE_FIRECO_EDITOR';
const CONFIGURE_FIRECO_EDITOR_FULFILLED='CONFIGURE_FIRECO_EDITOR_FULFILLED';
const CONFIGURE_FIRECO_EDITOR_REJECTED='CONFIGURE_FIRECO_EDITOR_REJECTED';

const CONFIGURE_FIRECO_EDITORS='CONFIGURE_FIRECO_EDITORS';
const CONFIGURE_FIRECO_EDITORS_FULFILLED='CONFIGURE_FIRECO_EDITORS_FULFILLED';
const CONFIGURE_FIRECO_EDITORS_REJECTED='CONFIGURE_FIRECO_EDITORS_REJECTED';

// actions are the same in firecoWebWorker.js
const MESSAGE_REJECTED='MESSAGE_REJECTED';

const CONFIGURE_FIRECO_WEB_WORKER='CONFIGURE_FIRECO_WEB_WORKER';
export const CONFIGURE_FIRECO_WEB_WORKER_FULFILLED='CONFIGURE_FIRECO_WEB_WORKER_FULFILLED';
const CONFIGURE_FIRECO_WEB_WORKER_REJECTED='CONFIGURE_FIRECO_WEB_WORKER_REJECTED';

const ACTIVATE_FIREPAD='ACTIVATE_FIREPAD';
export const ACTIVATE_FIREPAD_FULFILLED='ACTIVATE_FIREPAD_FULFILLED';
export const ACTIVATE_FIREPAD_EXPIRED='ACTIVATE_FIREPAD_EXPIRED';
const ACTIVATE_FIREPAD_REJECTED='ACTIVATE_FIREPAD_REJECTED';

const FIRECO_SET_TEXT='FIRECO_SET_TEXT';
const FIRECO_SET_TEXT_FULFILLED='FIRECO_SET_TEXT_FULFILLED';
const FIRECO_SET_TEXT_REJECTED='FIRECO_SET_TEXT_REJECTED';

const FIRECO_TEXT_UPDATES='FIRECO_TEXT_UPDATES';
const FIRECO_TEXT_UPDATES_FULFILLED='FIRECO_TEXT_UPDATES_FULFILLED';
const FIRECO_TEXT_UPDATES_REJECTED='FIRECO_TEXT_UPDATES_REJECTED';
const FIRECO_TEXT_UPDATES_RECEIVED='FIRECO_TEXT_UPDATES_RECEIVED';

const FIRECO_RUNTIME_ERROR='FIRECO_RUNTIME_ERROR';

const DISPOSE_FIRECO='DISPOSE_FIRECO';
//end actions

const defaultState={
  error: null,
  isFirecoWorkerConfigured: false,
  areFirecosEditorsConfiguring: false,
  areFirecosEditorsConfigured: false,
  fulfilledFirecoEditors: 0,
  configuredFirecoEditors: null,
  firecoEditorsTexts: null
};

export const configureFireco=() => ({
  type: CONFIGURE_FIRECO,
});

export const configureFirecoFulfilled=() => ({
  type: CONFIGURE_FIRECO_FULFILLED,
});
export const configureFirecoRejected=error => ({
  type: CONFIGURE_FIRECO_REJECTED,
  error: error
});

export const configureFirecoInit=fireco => ({
  type: CONFIGURE_FIRECO_INIT,
  fireco: fireco
});

export const configureFirecoInitFulfilled=() => ({
  type: CONFIGURE_FIRECO_INIT_FULFILLED,
});
export const configureFirecoInitRejected=error => ({
  type: CONFIGURE_FIRECO_INIT_REJECTED,
  error: error
});

export const activateFirepad=(pastebinToken, firepadPaths) => ({
  type: ACTIVATE_FIREPAD,
  pastebinToken: pastebinToken,
  firepadPaths: firepadPaths
});

export const activateFirepadFulfilled=() => ({
  type: ACTIVATE_FIREPAD_FULFILLED,
});
export const activateFirepadRejected=error => ({
  type: ACTIVATE_FIREPAD_REJECTED,
  error: error
});

export const firecoRuntimeError=error => ({
  type: FIRECO_RUNTIME_ERROR,
  error: error
});

export const configureFirecoWorker=(firepadURL, importScripts, firebaseConfig) => ({
  type: CONFIGURE_FIRECO_WEB_WORKER,
  firepadURL: firepadURL,
  importScripts: importScripts,
  firebaseConfig: firebaseConfig
});


export const configureFirecoEditors=() => ({type: CONFIGURE_FIRECO_EDITORS});
export const configureFirecoEditorsFulfilled=() => ({type: CONFIGURE_FIRECO_EDITORS_FULFILLED});


export const configureFirecoEditor=editorId => ({
  type: CONFIGURE_FIRECO_EDITOR,
  editorId: editorId
});
export const configureFirecoEditorFulfilled=editorId => ({
  type: CONFIGURE_FIRECO_EDITOR_FULFILLED,
  editorId: editorId
});
export const configureFirecoEditorRejected=(editorId, error) => ({
  type: CONFIGURE_FIRECO_EDITOR_REJECTED,
  editorId: editorId,
  error: error
});

export const firecoSetText=(editorId, text) => ({
  type: FIRECO_SET_TEXT,
  editorId: editorId,
  text: text
});

export const firecoSetTextFulfilled=editorId => ({
  type: FIRECO_SET_TEXT_FULFILLED,
  editorId: editorId
});


export const firecoReducer=
  (state=defaultState,
   action) => {
    switch (action.type) {
      case CONFIGURE_FIRECO_EDITORS:
        return {
          ...state,
          areFirecoEditorsConfiguring: true,
          areFirecoEditorsConfigured: false,
          configuredFirecoEditors: {}
        };
      
      case CONFIGURE_FIRECO_EDITORS_FULFILLED:
        return {
          ...state,
          areFirecoEditorsConfiguring: false,
          areFirecoEditorsConfigured: true,
        };
      
      case CONFIGURE_FIRECO_EDITORS_REJECTED:
        return {
          ...state,
          areFirecoEditorsConfiguring: false,
          error: action.error
        };
      
      case CONFIGURE_FIRECO_EDITOR:
        const configuredFirecoEditors={...state.configuredFirecoEditors};
        configuredFirecoEditors[action.editorId]={isPending: true};
        return {
          ...state,
          configuredFirecoEditors: configuredFirecoEditors
        };
      
      case CONFIGURE_FIRECO_EDITOR_FULFILLED:
        const configuredFirecosFulfilled={...state.configuredFirecoEditors};
        configuredFirecosFulfilled[action.editorId]={isFulfilled: true};
        return {
          ...state,
          configuredFirecoEditors: configuredFirecosFulfilled,
          fulfilledFirecoEditors: state.fulfilledFirecoEditors + 1
        };
      case CONFIGURE_FIRECO_EDITOR_REJECTED:
        const configuredFirecosRejected={...state.configuredFirecoEditors};
        configuredFirecosRejected[action.editorId]={
          isRejected: true,
          error: action.error
        };
        return {
          ...state,
          configuredFirecoEditors: configuredFirecosRejected
        };
      default:
        return state;
    }
  };

export const firecoEpic=(action$, store, {appManager}) =>
    action$.ofType(CONFIGURE_FIRECO_INIT)
      .mergeMap(action =>
        appManager.observeConfigureFirecoInit(action.fireco)
      )
  // .mergeMap(action => Observable.of({type: 'log', action: action}))
;

export const firecoActivateEpic=(action$, store, {appManager}) =>
  action$.ofType(FETCH_PASTEBIN_TOKEN_FULFILLED)
    .zip(
      action$.ofType(CONFIGURE_FIRECO_WEB_WORKER_FULFILLED)
    )
    .mergeMap(() =>{
      firebase.auth().signInWithCustomToken(store.getState().pastebinReducer.pastebinToken);
      return appManager.observeActivateFirepad(store.getState().pastebinReducer.pastebinId, store.getState().pastebinReducer.pastebinToken)
      }
      // appManager.observeActivateFirepad(store.getState().pastebinReducer.pastebinId, store.getState().pastebinReducer.pastebinToken)
    )
;

export const firecoEditorEpic=(action$, store, {appManager}) =>
  action$.ofType(LOAD_MONACO_EDITOR_FULFILLED)
    .zip(
      action$.ofType(ACTIVATE_FIREPAD_FULFILLED, CONFIGURE_FIRECO_EDITOR_FULFILLED)
    )
    .mergeMap(actions =>
      appManager.observeConfigureFirecoEditor(actions[0].editorId)
    )
;

export const firecoEditorsEpic=(action$, store) =>
  action$.ofType(CONFIGURE_FIRECO_EDITOR_FULFILLED)
    .filter(() => (store.getState().firecoReducer.fulfilledFirecoEditors === store.getState().monacoEditorsReducer.monacoEditorsToLoad))
    .mapTo(configureFirecoEditorsFulfilled()).startWith(configureFirecoEditors());

export const firecoSetTextEpic=(action$, store, {appManager}) =>
  action$.ofType(FIRECO_SET_TEXT_FULFILLED)
    .mergeMap(action => Observable.of({type: 'LOG3', action: action}))
// .do(action => {
//   }
//   // deps.appManager.monacoEditorSetText(action.editorId, action.text)
// );
export const firecoGetTextEpic=(action$, store, {appManager}) =>
  action$.ofType(FIRECO_TEXT_UPDATES_RECEIVED)
    .mergeMap(action => Observable.of({type: 'LOG4', action: action}))
// .do(action => {
//   }
//   // deps.appManager.setEditorText(action.editorId, action.text)
// );
