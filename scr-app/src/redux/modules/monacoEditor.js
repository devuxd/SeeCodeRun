import {Observable} from 'rxjs';
import {CONFIGURE_MONACO_FULFILLED} from "./monaco";
import {
  FETCH_PASTEBIN_CONTENT_FULFILLED,
  FETCH_PASTEBIN_FULFILLED
} from "./pastebin";

const CONFIGURE_MONACO_MODELS='CONFIGURE_MONACO_MODELS';
const CONFIGURE_MONACO_MODELS_FULFILLED='CONFIGURE_MONACO_MODELS_FULFILLED';
const CONFIGURE_MONACO_MODELS_REJECTED='CONFIGURE_MONACO_MODELS_REJECTED';

const LOAD_MONACO_EDITORS='LOAD_MONACO_EDITORS';
const LOAD_MONACO_EDITORS_FULFILLED='LOAD_MONACO_EDITORS_FULFILLED';
const LOAD_MONACO_EDITORS_REJECTED='LOAD_MONACO_EDITORS_REJECTED';


const MOUNT_EDITOR_FULFILLED='MOUNT_EDITOR_FULFILLED';

const CONFIGURE_FIRECO_BINDS_FULFILLED='CONFIGURE_FIRECO_BINDS_FULFILLED';
const CONFIGURE_FIRECO_BINDS_REJECTED='CONFIGURE_FIRECO_BINDS_REJECTED';

const LOAD_MONACO_EDITOR='LOAD_MONACO_EDITOR';
export const LOAD_MONACO_EDITOR_FULFILLED='LOAD_MONACO_EDITOR_FULFILLED';
const LOAD_MONACO_EDITOR_REJECTED='LOAD_MONACO_EDITOR_REJECTED';
const UPDATE_MONACO_EDITOR='UPDATE_MONACO_EDITOR';

const defaultState={
  error: null,
  isConfiguringMonacoModels: false,
  areMonacoModelsConfigured: false,
  areMonacoEditorsLoading: false,
  areMonacoEditorsLoaded: false,
  monacoEditorsToLoad: 3,
  monacoEditorsAttempted: 0,
  monacoEditorsLoaded: 0,
  monacoEditorsStates: null
};

export const configureMonacoModels=initialEditorsTexts => ({
  type: CONFIGURE_MONACO_MODELS,
  initialEditorsTexts: initialEditorsTexts
});
export const configureMonacoModelsFulfilled=() => ({type: CONFIGURE_MONACO_MODELS_FULFILLED});
export const configureMonacoModelsRejected=error => ({
  type: CONFIGURE_MONACO_MODELS_REJECTED,
  error: error
});

export const mountEditorFulfilled=(editorId, editorDiv, dispatchFirecoActions, dispatchMouseEvents) => ({
  type: MOUNT_EDITOR_FULFILLED,
  editorId: editorId,
  editorDiv: editorDiv,
  dispatchFirecoActions: dispatchFirecoActions,
  dispatchMouseEvents: dispatchMouseEvents
});

export const configureFirecoBindsFulfilled=(editorId) => ({
  type: CONFIGURE_FIRECO_BINDS_FULFILLED,
  editorId: editorId
});

export const configureFirecoBindsRejected=(editorId, error) => ({
  type: CONFIGURE_FIRECO_BINDS_REJECTED,
  editorId: editorId,
  error: error
});


const loadMonacoEditors=() => ({
  type: LOAD_MONACO_EDITORS
});

const loadMonacoEditorsFulfilled=() => ({
  type: LOAD_MONACO_EDITORS_FULFILLED
});

// const loadMonacoEditorsRejected = error => ({
//   type: LOAD_MONACO_EDITORS_REJECTED,
//   error: error
// });

export const loadMonacoEditor=(editorId) => ({
  type: LOAD_MONACO_EDITOR,
  editorId: editorId
});

export const loadMonacoEditorFulfilled=(editorId, isUpdate) => ({
  type: LOAD_MONACO_EDITOR_FULFILLED,
  editorId: editorId,
  isUpdate: isUpdate
});

export const loadMonacoEditorRejected=(editorId, error) => ({
  type: LOAD_MONACO_EDITOR_REJECTED,
  editorId: editorId,
  error: error
});

export const updateMonacoEditor=editorId => ({
  type: UPDATE_MONACO_EDITOR,
  editorId: editorId
});

export const monacoEditorsReducer=
  (state=defaultState,
   action) => {
    switch (action.type) {
      case CONFIGURE_MONACO_MODELS:
        return {
          ...state,
          isConfiguringMonacoModels: true,
          areMonacoModelsConfigured: false,
        };
      case CONFIGURE_MONACO_MODELS_FULFILLED:
        return {
          ...state,
          isConfiguringMonacoModels: false,
          areMonacoModelsConfigured: true,
        };
      case CONFIGURE_MONACO_MODELS_REJECTED:
        return {
          ...state,
          isConfiguringMonacoModels: false,
          error: action.error
        };
      
      case LOAD_MONACO_EDITORS:
        return {
          ...state,
          areMonacoEditorsLoading: true,
          areMonacoEditorsLoaded: false
        };
      case LOAD_MONACO_EDITORS_FULFILLED:
        return {
          ...state,
          areMonacoEditorsLoading: false,
          areMonacoEditorsLoaded: true,
        };
      case LOAD_MONACO_EDITORS_REJECTED:
        return {
          ...state,
          error: action.error
        };
      
      case MOUNT_EDITOR_FULFILLED:
        const monacoEditorsMounted={...state.monacoEditorsStates};
        monacoEditorsMounted[action.editorId]={isMounted: true};
        return {
          ...state,
          monacoEditorsStates: monacoEditorsMounted
        };
      
      case LOAD_MONACO_EDITOR:
        const monacoEditorsStates={...state.monacoEditorsStates};
        monacoEditorsStates[action.editorId]={isPending: true};
        return {
          ...state,
          monacoEditorsStates: monacoEditorsStates,
          monacoEditorsAttempted: state.monacoEditorsAttempted + 1
        };
      case LOAD_MONACO_EDITOR_FULFILLED:
        const monacoEditorsLoadedFulfilled={...state.monacoEditorsStates};
        monacoEditorsLoadedFulfilled[action.editorId]={isFulfilled: true};
        return {
          ...state,
          monacoEditorsStates: monacoEditorsLoadedFulfilled,
          monacoEditorsLoaded: state.monacoEditorsLoaded + 1,
        };
      case LOAD_MONACO_EDITOR_REJECTED:
        const monacoEditorsLoadedRejected={...state.monacoEditorsStates};
        monacoEditorsLoadedRejected[action.editorId]={
          isRejected: true,
          error: action.error
        };
        return {
          ...state,
          monacoEditorsStates: monacoEditorsLoadedRejected
        };
      default:
        return state;
    }
  };

export const monacoEditorsEpic=(action$, store) =>
  action$.ofType(LOAD_MONACO_EDITOR_FULFILLED)
    .filter(() =>
      (store.getState().monacoEditorsReducer.monacoEditorsLoaded ===
        store.getState().monacoEditorsReducer.monacoEditorsToLoad))
    .mapTo(loadMonacoEditorsFulfilled())
    .startWith(loadMonacoEditors())
;

export const mountedEditorEpic=(action$, store, {appManager}) =>
  action$.ofType(MOUNT_EDITOR_FULFILLED)
    .zip(action$.ofType(CONFIGURE_MONACO_FULFILLED, CONFIGURE_FIRECO_BINDS_FULFILLED))
    .concatMap(actions => {
        const action=actions[0];
        return Observable.concat(
          appManager.observeConfigureBinds(action.editorId, action.dispatchFirecoActions),
          appManager.observeConfigureMonacoEditor(action.editorId, action.editorDiv, action.dispatchMouseEvents)
        );
      }
    )
;

export const monacoEditorEpic=(action$, store, {appManager}) =>
  action$.ofType(FETCH_PASTEBIN_CONTENT_FULFILLED).zip(action$.ofType(LOAD_MONACO_EDITORS_FULFILLED))
    .mergeMap(actions => {
        return appManager.observeUpdateMonacoModels(actions[0].initialEditorsTexts)
      }
    )
;
