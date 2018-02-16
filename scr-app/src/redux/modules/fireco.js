import {Observable} from "rxjs";
import {
  configureMonacoModels, LOAD_MONACO_EDITOR_FULFILLED,
  loadMonacoEditor,
  loadMonacoEditors,
  updateMonacoEditor
} from "./monacoEditor";
import {CONFIGURE_FIREPADS_FULFILLED, configureFirepads} from "./firepad";
import {loadMonacoFulfilled, loadMonacoRejected} from "./monaco";

const CONFIGURE_FIRECO_WORKER='CONFIGURE_FIRECO_WORKER';
const CONFIGURE_FIRECO_WORKER_FULFILLED='CONFIGURE_FIRECO_WORKER_FULFILLED';
const CONFIGURE_FIRECO_WORKER_REJECTED='CONFIGURE_FIRECO_WORKER_REJECTED';

const CONFIGURE_FIRECOS='CONFIGURE_FIRECOS';
const CONFIGURE_FIRECOS_FULFILLED='CONFIGURE_FIRECOS_FULFILLED';
const CONFIGURE_FIRECOS_REJECTED='CONFIGURE_FIRECOS_REJECTED';

const CONFIGURE_FIRECO='CONFIGURE_FIRECO';
const CONFIGURE_FIRECO_FULFILLED='CONFIGURE_FIRECO_FULFILLED';
const CONFIGURE_FIRECO_REJECTED='CONFIGURE_FIRECO_REJECTED';

const FIRECO_SET_TEXT_FULFILLED='FIRECO_SET_TEXT_FULFILLED';
const FIRECO_GET_TEXT_FULFILLED='FIRECO_GET_TEXT_FULFILLED';

const defaultState={
  error: null,
  isFirecoWorkerConfigured: false,
  areFirecosConfiguring: false,
  areFirecosConfigured: false,
  fulfilledFirecos: 0,
  configuredFirecos: null,
  firecosTexts: null
};

export const configureFirecoWorker=firecoWorker => ({
  type: CONFIGURE_FIRECO_WORKER,
  firecoWorker: firecoWorker
});
export const configureFirecoWorkerFulfilled=() => ({type: CONFIGURE_FIRECO_WORKER_FULFILLED});
export const configureFirecoWorkerRejected=error => ({
  type: CONFIGURE_FIRECO_WORKER_REJECTED,
  error: error
});

export const configureFirecos=() => ({type: CONFIGURE_FIRECOS});
export const configureFirecosFulfilled=() => ({type: CONFIGURE_FIRECOS_FULFILLED});


export const configureFireco=editorId => ({
  type: CONFIGURE_FIRECO,
  editorId: editorId
});
export const configureFirecoFulfilled=editorId => ({
  type: CONFIGURE_FIRECO_FULFILLED,
  editorId: editorId
});
export const configureFirecoRejected=(editorId, error) => ({
  type: CONFIGURE_FIRECO_REJECTED,
  editorId: editorId,
  error: error
});


export const firecoSetTextFulfilled=editorId => ({
  type: FIRECO_SET_TEXT_FULFILLED,
  editorId: editorId
});

export const firecoGetTextFulfilled=(editorId, text) => ({
  type: FIRECO_GET_TEXT_FULFILLED,
  editorId: editorId,
  text: text
});

export const firecoReducer=
  (state=defaultState,
   action) => {
    switch (action.type) {
      case CONFIGURE_FIRECOS:
        return {
          ...state,
          areFirecosConfiguring: true,
          areFirecosConfigured: false,
          configuredFirecos: {}
        };
      
      case CONFIGURE_FIRECOS_FULFILLED:
        return {
          ...state,
          areFirecosConfiguring: false,
          areFirecosConfigured: true,
        };
      
      case CONFIGURE_FIRECOS_REJECTED:
        return {
          ...state,
          areFirecosConfiguring: false,
          error: action.error
        };
      
      case CONFIGURE_FIRECO:
        const configuredFirecos={...state.configuredFirecos};
        configuredFirecos[action.editorId]={isPending: true};
        return {
          ...state,
          configuredFirecos: configuredFirecos
        };
      
      case CONFIGURE_FIRECO_FULFILLED:
        const configuredFirecosFulfilled={...state.configuredFirecos};
        configuredFirecosFulfilled[action.editorId]={isFulfilled: true};
        return {
          ...state,
          configuredFirecos: configuredFirecosFulfilled,
          fulfilledFirecos: state.fulfilledFirecos + 1
        };
      case CONFIGURE_FIRECO_REJECTED:
        const configuredFirecosRejected={...state.configuredFirecos};
        configuredFirecosRejected[action.editorId]={
          isRejected: true,
          error: action.error
        };
        return {
          ...state,
          configuredFirecos: configuredFirecosRejected
        };
      default:
        return state;
    }
  };

export const firecoEpic=(action$, store, {appManager}) =>
  action$.ofType(LOAD_MONACO_EDITOR_FULFILLED)
    .mergeMap(action =>
      action$.ofType(CONFIGURE_FIREPADS_FULFILLED).mergeMap( () =>
      appManager.observerConfigureFireco(action.editorId)
      )
    );

export const firecosEpic=(action$, store) =>
  action$.ofType(CONFIGURE_FIRECO_FULFILLED)
    .filter(() => (store.getState().firecoReducer.fulfilledFirecos === store.getState().monacoEditorsReducer.monacoEditorsToLoad))
    .mapTo({type: CONFIGURE_FIRECOS_FULFILLED}).startWith(configureFirecos());

export const firecoSetTextEpic=(action$, store, {appManager}) =>
  action$.ofType(FIRECO_SET_TEXT_FULFILLED)
    .mergeMap(action => Observable.of({type: 'LOG3', action: action}))
// .do(action => {
//   }
//   // deps.appManager.monacoEditorSetText(action.editorId, action.text)
// );
export const firecoGetTextEpic=(action$, store, {appManager}) =>
  action$.ofType(FIRECO_GET_TEXT_FULFILLED)
    .mergeMap(action => Observable.of({type: 'LOG4', action: action}))
// .do(action => {
//   }
//   // deps.appManager.setEditorText(action.editorId, action.text)
// );
