import {Observable} from 'rxjs';
import {ajax} from 'rxjs/observable/dom/ajax';

import localStorage from 'store';
import {getDefaultPastebinContent} from '../../utils/pastebinContentUtils';
import {
  ACTIVATE_FIREPAD_EXPIRED,
} from './fireco';
import {MONACO_EDITOR_CONTENT_CHANGED} from "./monacoEditor";

const cloudFunctionsUrl=process.env.PUBLIC_URL ? 'https://us-central1-firebase-seecoderun.cloudfunctions.net' : '/firebase-seecoderun/us-central1';
const getPasteBinIdUrl=`${cloudFunctionsUrl}/getPastebinId`;
const getPasteBinUrl=`${cloudFunctionsUrl}/getPastebin`;
const getPasteBinTokenUrl=`${cloudFunctionsUrl}/getPastebinToken`;

export const PASTEBIN_CONFIGURE_LAYOUT='PASTEBIN_CONFIGURE_LAYOUT';
const PASTEBIN_CONFIGURE_LAYOUT_FULFILLED='PASTEBIN_CONFIGURE_LAYOUT_FULFILLED';
const PASTEBIN_CONFIGURE_LAYOUT_REJECTED='PASTEBIN_CONFIGURE_LAYOUT_REJECTED';

const DISPOSE_PASTEBIN='DISPOSE_PASTEBIN';

const FETCH_PASTEBIN='FETCH_PASTEBIN';
export const FETCH_PASTEBIN_FULFILLED='FETCH_PASTEBIN_FULFILLED';
const FETCH_PASTEBIN_REJECTED='FETCH_PASTEBIN_REJECTED';
export const FETCH_PASTEBIN_CONTENT_FULFILLED='FETCH_PASTEBIN_CONTENT_FULFILLED';
export const FETCH_PASTEBIN_CONTENT_REJECTED='FETCH_PASTEBIN_CONTENT_REJECTED';

const FETCH_PASTEBIN_TOKEN='FETCH_PASTEBIN_TOKEN';
export const FETCH_PASTEBIN_TOKEN_FULFILLED='FETCH_PASTEBIN_TOKEN_FULFILLED';
const FETCH_PASTEBIN_TOKEN_REJECTED='FETCH_PASTEBIN_TOKEN_REJECTED';

const defaultPasteBinState={
  pastebinId: null,
  currentGridLayouts: null,
  isNew: false,
  editorsTexts: null,
  pastebinToken: null,
  contentChangeEditorId: null
};

export const pastebinConfigureLayout=(restoreGridLayouts, getCurrentGridLayouts) => {
  return {
    type: PASTEBIN_CONFIGURE_LAYOUT,
    restoreGridLayouts: restoreGridLayouts,
    getCurrentGridLayouts: getCurrentGridLayouts,
  };
};

export const fetchPastebin=(pastebinId) => {
  return {
    type: FETCH_PASTEBIN,
    pastebinId: pastebinId,
    isNew: !pastebinId,
  };
};

const fetchPastebinFulfilled=(pastebinId, initialEditorsTexts) => {
  return {
    type: FETCH_PASTEBIN_FULFILLED,
    pastebinId: pastebinId,
    editorsTexts: initialEditorsTexts,
  }
};

const fetchPastebinContentFulfilled=(initialEditorsTexts) => {
  return {
    type: FETCH_PASTEBIN_CONTENT_FULFILLED,
    editorsTexts: initialEditorsTexts
  }
};

const fetchPastebinContentRejected=error => {
  return {type: FETCH_PASTEBIN_CONTENT_REJECTED, error: error}
};

const fetchPastebinRejected=error => {
  return {type: FETCH_PASTEBIN_REJECTED, error: error}
};

const fetchPastebinTokenFulfilled=pastebinToken => {
  return {type: FETCH_PASTEBIN_TOKEN_FULFILLED, pastebinToken: pastebinToken}
};

const fetchPastebinTokenRejected=error => {
  return {type: FETCH_PASTEBIN_TOKEN_REJECTED, error: error}
};

export const pastebinReducer=(state=defaultPasteBinState, action) => {
  let initialEditorsTexts=null;
  switch (action.type) {
    case FETCH_PASTEBIN:
      return {
        ...state,
        pastebinId: action.pastebinId,
        isNew: action.isNew,
        editorsTexts: null,
      };
    
    case MONACO_EDITOR_CONTENT_CHANGED:
      let editorsTexts=state.editorsTexts || {};
      editorsTexts={...editorsTexts, [action.editorId]: action.text};
      return {
        ...state,
        editorsTexts: editorsTexts,
        contentChangeEditorId: action.editorId
      };
    
    case FETCH_PASTEBIN_FULFILLED:
      initialEditorsTexts=
        action.editorsTexts ? {...action.editorsTexts} : null;
      initialEditorsTexts=
        initialEditorsTexts && state.contentChangeEditorId ?
          {...initialEditorsTexts, ...state.editorsTexts}
          : initialEditorsTexts;
      return {
        ...state,
        pastebinId: action.pastebinId,
        editorsTexts: initialEditorsTexts || state.editorsTexts
      };
    case FETCH_PASTEBIN_CONTENT_FULFILLED:
      initialEditorsTexts=
        action.editorsTexts ? {...action.editorsTexts} : null;
      initialEditorsTexts=
        initialEditorsTexts && state.editorsTexts ?
          {...state.editorsTexts, ...initialEditorsTexts}
          : initialEditorsTexts;
      initialEditorsTexts=
        initialEditorsTexts && state.contentChangeEditorId ?
          {...initialEditorsTexts, ...state.editorsTexts}
          : initialEditorsTexts;
      return {
        ...state,
        editorsTexts: initialEditorsTexts || state.editorsTexts
      };
    case FETCH_PASTEBIN_REJECTED:
      return {
        ...state,
        error: action.error
      };
    case FETCH_PASTEBIN_TOKEN:
      return {
        ...state,
        pastebinToken: null
      };
    case FETCH_PASTEBIN_TOKEN_FULFILLED:
      return {
        ...state,
        pastebinToken: action.pastebinToken
      };
    case FETCH_PASTEBIN_TOKEN_REJECTED:
      return {
        ...state,
        error: action.error
      };
    default:
      return state;
  }
};


export const disposePastebinEpic=(action$, store, {appManager}) =>
  action$.ofType(DISPOSE_PASTEBIN)
    .mergeMap(() => {
        localStorage.set(
          `scr_monacoEditorsSavedStates#${
            store.getState().pastebinReducer.pastebinId
            }`,
          appManager.getEditorsStates()
        );
        localStorage.set(`scr_layoutSavedState#${
            store.getState().pastebinReducer.pastebinId
            }`,
          appManager.getCurrentGridLayouts());
        return appManager.observeDispose();
      }
    );

export const pastebinLayoutEpic=(action$, store, {appManager}) =>
  action$.ofType(FETCH_PASTEBIN_FULFILLED)
    .zip(action$.ofType(PASTEBIN_CONFIGURE_LAYOUT))
    .mergeMap(actions => {
      if (actions[1].restoreGridLayouts && actions[1].getCurrentGridLayouts) {
        appManager.setPastebinLayout(actions[1].restoreGridLayouts, actions[1].getCurrentGridLayouts);
        appManager.restoreGridLayouts(
          localStorage.get(`scr_layoutSavedState#${
            store.getState().pastebinReducer.pastebinId
            }`));
        return Observable.of({type: PASTEBIN_CONFIGURE_LAYOUT_FULFILLED});
      } else {
        return Observable.of({type: PASTEBIN_CONFIGURE_LAYOUT_REJECTED});
      }
    });
;

export const pastebinEpic=(action$, store, {appManager}) =>
  action$.ofType(FETCH_PASTEBIN)
    .mergeMap(action => {
      if (action.isNew) {
        const url=getPasteBinIdUrl;
        const getPastebinIdRequest=() => ajax({
          crossDomain: true,
          url: url,
        })
          .map(result => {
            appManager.setPastebinId(result.response.pastebinId);
            return fetchPastebinFulfilled(
              result.response.pastebinId,
              null,
            );
          })
          .catch(error => Observable.of(fetchPastebinRejected(error)));
        
          return Observable.concat(
            Observable.of(fetchPastebinContentFulfilled(
              getDefaultPastebinContent()
            )),
            getPastebinIdRequest()
          );
      } else {
        appManager.setPastebinId(action.pastebinId);
        //todo: needs validation when user edited from a different machine
        appManager.restoreEditorsStates(
          localStorage.get(`scr_monacoEditorsSavedStates#${
            action.pastebinId
            }`)
        );
        return Observable.of(fetchPastebinFulfilled(
          action.pastebinId,
          appManager.getInitialEditorsTextsFromRestoreEditorsStates()
          )
        );
      }
    })
;

export const pastebinTokenEpic=(action$, store) =>
  action$.ofType(FETCH_PASTEBIN_FULFILLED, ACTIVATE_FIREPAD_EXPIRED)
    .mergeMap(() => {
      const url=`${getPasteBinTokenUrl}?pastebinId=${store.getState().pastebinReducer.pastebinId}`;
      return ajax({
        crossDomain: true,
        url: url,
      })
        .map(result => {
          return fetchPastebinTokenFulfilled(result.response.pastebinToken)
        })
        .catch(error => Observable.of(fetchPastebinTokenRejected(error)));
    })
;


export const pastebinContentEpic=(action$, store) =>
  action$.ofType(FETCH_PASTEBIN_FULFILLED)
    .filter(() => !store.getState().pastebinReducer.isNew)
    .mergeMap(() => {
      const url=`${getPasteBinUrl}?pastebinId=${store.getState().pastebinReducer.pastebinId}`;
      return ajax({
        crossDomain: true,
        url: url,
      })
        .map(result => fetchPastebinContentFulfilled(result.response.initialEditorsTexts)
          // {
          // if(result.response && result.response.initialEditorsTexts && result.response.initialEditorsTexts && Object.keys(result.response.initialEditorsTexts).length===3){
          //   return fetchPastebinContentFulfilled(result.response.initialEditorsTexts);
          // }else{
          //   return fetchPastebinContentRejected('Malformed Server Response.');
          // }
          // }
        
        )
        // .takeUntil(action$.ofType(CONFIGURE_FIRECO_EDITORS_FULFILLED))
        .catch(error => Observable.of(fetchPastebinContentRejected(error)));
    })
;
