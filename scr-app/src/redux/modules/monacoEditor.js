import {ofType} from 'redux-observable';
import {zip} from 'rxjs';
import {concatMap, filter, mapTo, startWith} from 'rxjs/operators';

import {CONFIGURE_MONACO_MODELS_FULFILLED} from './monaco';

export const LOAD_MONACO_EDITORS_FULFILLED = 'LOAD_MONACO_EDITORS_FULFILLED';

const MOUNT_EDITOR_FULFILLED = 'MOUNT_EDITOR_FULFILLED';

export const LOAD_MONACO_EDITOR_FULFILLED = 'LOAD_MONACO_EDITOR_FULFILLED';
const LOAD_MONACO_EDITOR_REJECTED = 'LOAD_MONACO_EDITOR_REJECTED';

export const MONACO_EDITOR_CONTENT_CHANGED = 'MONACO_EDITOR_CONTENT_CHANGED';

export const checkAreEditorsStatesFulfilled = (
   state,
   editorIds,
   editorStateProp = "monacoEditorsStates"
) => {
   const monacoEditorsStates = state?.[editorStateProp];
   const monacoEditorsToLoad = Object.keys(editorIds);
   let pending = monacoEditorsToLoad.length;
   
   for (let editorId of monacoEditorsToLoad) {
      if (monacoEditorsStates[editorId]?.isRejected) {
         return false;
      }
      
      if (monacoEditorsStates[editorId]?.isFulfilled) {
         pending--;
      }
   }
   return pending === 0;
};

const defaultState = {
   error: null,
   errorEditorId: null,
   areMonacoEditorsFulfilled: false,
   monacoEditorsStates: {},
};

const defaultMonacoEditorState = {
   isMounted: false,
   isFulfilled: false,
   isRejected: false,
   firecoPad: null,
   error: null,
};

export const mountEditorFulfilled = (
   editorId, editorHooks
) => ({
   type: MOUNT_EDITOR_FULFILLED,
   editorId,
   editorHooks,
});

const loadMonacoEditorsFulfilled = () => ({
   type: LOAD_MONACO_EDITORS_FULFILLED
});

export const loadMonacoEditorFulfilled = (
   editorId, firecoPad
) => ({
   type: LOAD_MONACO_EDITOR_FULFILLED,
   editorId,
   firecoPad,
});

export const loadMonacoEditorRejected = (
   editorId, error
) => ({
   type: LOAD_MONACO_EDITOR_REJECTED,
   editorId,
   error,
});


export const monacoEditorContentChanged = (
   editorId, text, changes
) => ({
   type: MONACO_EDITOR_CONTENT_CHANGED,
   editorId,
   text,
   changes,
});

export const monacoEditorsReducer = (
   state = defaultState,
   {
      type, editorId = null, firecoPad = null,
      text = "", changes = null, error = null
   }
) => {
   const monacoEditorsStates = {
      ...state.monacoEditorsStates
   };
   
   switch (type) {
      case LOAD_MONACO_EDITORS_FULFILLED:
         return {
            ...state,
            areMonacoEditorsFulfilled: true,
         };
      
      case MOUNT_EDITOR_FULFILLED:
         monacoEditorsStates[editorId] = {
            ...defaultMonacoEditorState,
            isMounted: true,
         };
         
         return {
            ...state,
            monacoEditorsStates
         };
      
      case LOAD_MONACO_EDITOR_FULFILLED:
         monacoEditorsStates[editorId] = {
            ...monacoEditorsStates[editorId],
            isFulfilled: true,
            isRejected: false,
            firecoPad,
            error,
         };
         
         return {
            ...state,
            monacoEditorsStates,
         };
      
      case LOAD_MONACO_EDITOR_REJECTED:
         monacoEditorsStates[editorId] = {
            ...monacoEditorsStates[editorId],
            isFulfilled: false,
            isRejected: true,
            firecoPad,
            error,
         };
         return {
            ...state,
            monacoEditorsStates,
            errorEditorId: editorId,
            error,
         };
      
      case MONACO_EDITOR_CONTENT_CHANGED:
         monacoEditorsStates[editorId] = {
            ...monacoEditorsStates[editorId],
            text,
            changes
         };
         return {
            ...state,
            monacoEditorsStates,
         };
      
      default:
         return state;
   }
};

export const mountedEditorEpic = (
   action$, state$, {appManager}
) => zip(
   action$.pipe(ofType(MOUNT_EDITOR_FULFILLED)),
   action$.pipe(
      ofType(
         CONFIGURE_MONACO_MODELS_FULFILLED,
         LOAD_MONACO_EDITOR_FULFILLED
      )
   ),
).pipe(
   concatMap(
      (
         [{editorId, editorHooks}]
      ) => appManager.observeConfigureMonacoEditor(editorId, editorHooks)
   )
);

export const monacoEditorsEpic = (
   action$, state$, {appManager}
) => action$.pipe(
   ofType(LOAD_MONACO_EDITOR_FULFILLED),
   filter(
      () => checkAreEditorsStatesFulfilled(
         state$.value.monacoEditorsReducer, appManager.editorIds
      )
   ),
   mapTo(loadMonacoEditorsFulfilled()),
);
