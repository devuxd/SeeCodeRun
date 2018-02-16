import {Observable} from "rxjs";
import {ajax} from 'rxjs/observable/dom/ajax';

import localStorage from 'store';

const DISPOSE_PASTEBIN='DISPOSE_PASTEBIN';

const FETCH_PASTEBIN='FETCH_PASTEBIN';
export const FETCH_PASTEBIN_FULFILLED='FETCH_PASTEBIN_FULFILLED';
export const FETCH_PASTEBIN_CONTENT_FULFILLED='FETCH_PASTEBIN_CONTENT_FULFILLED';
const FETCH_PASTEBIN_REJECTED='FETCH_PASTEBIN_REJECTED';

const FETCH_PASTEBIN_TOKEN='FETCH_PASTEBIN_TOKEN';
const FETCH_PASTEBIN_TOKEN_FULFILLED='FETCH_PASTEBIN_TOKEN_FULFILLED';
const FETCH_PASTEBIN_TOKEN_REJECTED='FETCH_PASTEBIN_TOKEN_REJECTED';

const AUTH_PASTEBIN='AUTH_PASTEBIN';
export const AUTH_PASTEBIN_FULFILLED='AUTH_PASTEBIN_FULFILLED';
const AUTH_PASTEBIN_REJECTED='AUTH_PASTEBIN_REJECTED';

const defaultPasteBinState={
  isFetchingPastebin: false,
  isPastebinFetched: false,
  pastebinId: null,
  pastebinServerAction: null, // created, copied, recovered
  initialEditorsTexts: null,
  isFetchingPastebinToken: false,
  isPastebinTokenFetched: false,
  pastebinToken: null,
  isPastebinAuthenticating: false,
  isPastebinAuthenticated: false,
  authUser: null,
  authUserActionCount: 0
};

export const fetchPastebin=() => {
  try {
    const pastebinId=window.location.hash.replace(/#/g, '') || '';
    // session='' creates a new session
    let session=(pastebinId && localStorage.get(`scr_session#${pastebinId}`)) ? localStorage.get(`scr_session#${pastebinId}`) : '';
    return {
      type: FETCH_PASTEBIN,
      pastebinId: pastebinId,
      session: session
    };
  } catch (e) {
    return {type: FETCH_PASTEBIN, e: e};
  }
  
};

const fetchPastebinFulfilled=(pastebinId, session) => {
  localStorage.set(`scr_session#${pastebinId}`, session ||localStorage.get(`scr_session#${pastebinId}`));
  window.location.hash=pastebinId;
  return {
    type: FETCH_PASTEBIN_FULFILLED,
    pastebinId: pastebinId,
    session: session,
  }
};

const fetchPastebinContentFulfilled=(initialEditorsTexts) => {
  return {
    type: FETCH_PASTEBIN_CONTENT_FULFILLED,
    initialEditorsTexts: initialEditorsTexts
  }
};

const fetchPastebinRejected=error => {
  return {type: FETCH_PASTEBIN_REJECTED, error: error}
};

export const fetchPastebinToken=pastebinId => {
  return {type: FETCH_PASTEBIN_TOKEN, pastebinId: pastebinId};
};

const fetchPastebinTokenFulfilled=pastebinToken => {
  return {type: FETCH_PASTEBIN_TOKEN_FULFILLED, pastebinToken: pastebinToken}
};

const fetchPastebinTokenRejected=error => {
  return {type: FETCH_PASTEBIN_TOKEN_REJECTED, error: error}
};

export const authPastebin=pastebinToken => ({
  type: AUTH_PASTEBIN,
  pastebinToken: pastebinToken
});
export const authPastebinFulfilled=authUser => ({
  type: AUTH_PASTEBIN_FULFILLED,
  authUser: authUser
});
export const authPastebinRejected=error => ({
  type: AUTH_PASTEBIN_REJECTED,
  error: error
});

const cloudFunctionsUrl='https://us-central1-firebase-seecoderun.cloudfunctions.net';
const getPasteBinIdUrl=`${cloudFunctionsUrl}/getPastebinId`;
const getPasteBinUrl=`${cloudFunctionsUrl}/getPastebin`;
const getPasteBinTokenUrl=`${cloudFunctionsUrl}/getPastebinToken`;

export const pastebinReducer=(state=defaultPasteBinState, action) => {
  switch (action.type) {
    case FETCH_PASTEBIN:
      return {
        ...state,
        isFetchingPastebin: true,
        isPastebinFetched: false,
        pastebinId: action.pastebinId,
        initialEditorsTexts: {},
      };
    case FETCH_PASTEBIN_FULFILLED:
      return {
        ...state,
        isFetchingPastebin: false,
        isPastebinFetched: true,
        pastebinId: action.pastebinId,
      };
    case FETCH_PASTEBIN_CONTENT_FULFILLED:
      return {
        ...state,
        isFetchingPastebin: false,
        isPastebinFetched: true,
        pastebinId: action.pastebinId,
        initialEditorsTexts: action.initialEditorsTexts
      };
    case FETCH_PASTEBIN_REJECTED:
      return {
        ...state,
        isFetchingPastebin: false,
        error: action.error
      };
    case FETCH_PASTEBIN_TOKEN:
      return {
        ...state,
        isFetchingPastebinToken: true,
        isPastebinTokenFetched: false,
        pastebinToken: null
      };
    case FETCH_PASTEBIN_TOKEN_FULFILLED:
      return {
        ...state,
        isFetchingPastebinToken: false,
        isPastebinTokenFetched: true,
        pastebinToken: action.pastebinToken
      };
    case FETCH_PASTEBIN_TOKEN_REJECTED:
      return {
        ...state,
        isFetchingPastebinToken: false,
        error: action.error
      };
    case AUTH_PASTEBIN:
      return {
        ...state,
        isPastebinAuthenticating: true,
        isPastebinAuthenticated: false,
        authUser: null,
        authUserActionCount: 0
      };
    case AUTH_PASTEBIN_FULFILLED:
      return {
        ...state,
        isPastebinAuthenticating: false,
        isPastebinAuthenticated: true,
        authUser: action.authUser,
        authUserActionCount: state.authUserActionCount + 1
      };
    case AUTH_PASTEBIN_REJECTED:
      return {
        ...state,
        isPastebinAuthenticating: false,
        error: action.error
      };
    default:
      return state;
  }
};



export const disposePastebinEpic=(action$, store, {appManager}) =>
  action$.ofType(DISPOSE_PASTEBIN)
    .mergeMap(() =>
      appManager.observeDispose()
    );

export const pastebinEpic=(action$, store, {appManager}) =>
  action$.ofType(FETCH_PASTEBIN)
    // .switchMap(action=>Observable.of({type:'LOG', action:action}))
    //new ajax request cancel old ones
    .mergeMap(action => {
      if (action.session) {
        appManager.setPastebinId(action.pastebinId);
        appManager.restoreEditorsStates(true);
        return Observable.of(fetchPastebinFulfilled(action.pastebinId, action.session));
      } else {
        const url=`${getPasteBinIdUrl}?pastebinId=${action.pastebinId || ''}&session=${action.session || ''}`;
        return ajax({
          crossDomain: true,
          url: url,
        })
          .map(result => {
            appManager.setPastebinId(result.response.pastebinId);
            appManager.restoreEditorsStates(true);
            return fetchPastebinFulfilled(result.response.pastebinId, result.response.session);
          })
          // .takeUntil(action$.ofType(FETCH_PASTEBIN_FULFILLED))
          .catch(error => Observable.of(fetchPastebinRejected(error)));
      }
    })
;

export const pastebinTokenEpic=(action$, store, {appManager}) =>
  action$.ofType(FETCH_PASTEBIN_FULFILLED)
    .mergeMap(() => {
      const url=`${getPasteBinTokenUrl}?pastebinId=${store.getState().pastebinReducer.pastebinId}`;
      return ajax({
        crossDomain: true,
        url: url,
      })
        .map(result => {
          console.log("T");
          return fetchPastebinTokenFulfilled(result.response.pastebinToken)
        })
        // .takeUntil(action$.ofType(FETCH_PASTEBIN_TOKEN_FULFILLED))
        .catch(error => Observable.of(fetchPastebinTokenRejected(error)));
    })
;

export const authPastebinEpic=(action$, store, {appManager}) =>
  action$.ofType(FETCH_PASTEBIN_TOKEN_FULFILLED)
    // .throttleTime(2000)
    .mergeMap(() => {
      // return Observable.of({type:"LOG"});
      console.log("A");
        return appManager.observeAuthPastebin(store.getState().pastebinReducer.pastebinToken)
      }
    )
// .ignoreElements()
;

export const pastebinContentEpic=(action$, store, {appManager}) =>
  action$.ofType(FETCH_PASTEBIN_FULFILLED)
    .mergeMap(() => {
      // console.log("TOOOOOO");
      const url=`${getPasteBinUrl}?pastebinId=${store.getState().pastebinReducer.pastebinId}`;
      return ajax({
        crossDomain: true,
        url: url,
      })
        .map(result => {
          console.log("C");
          return fetchPastebinContentFulfilled(result.response.initialEditorsTexts)
        })
        .takeUntil(action$.ofType(FETCH_PASTEBIN_CONTENT_FULFILLED))
        .catch(error => Observable.of(fetchPastebinRejected(error)));
    })
;
