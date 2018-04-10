import {Observable} from 'rxjs';
import {ajax} from 'rxjs/observable/dom/ajax';
import localStorage from 'store';
import {getDefaultPastebinContent} from '../../utils/pastebinContentUtils';
import {ACTIVATE_FIREPAD_EXPIRED} from './fireco';
import {MONACO_EDITOR_CONTENT_CHANGED} from "./monacoEditor";

// const cloudFunctionsUrl=
//   process.env.PUBLIC_URL ?
//     'https://us-central1-firebase-seecoderun.cloudfunctions.net'
//     : '/firebase-seecoderun/us-central1';
const cloudFunctionsUrl = `${process.env.PUBLIC_URL}/firebase-seecoderun/us-central1`;
const getPasteBinIdUrl = `${cloudFunctionsUrl}/getPastebinId`;
const getPasteBinCopyUrl = `${cloudFunctionsUrl}/copyPastebin`;
const getPasteBinUrl = `${cloudFunctionsUrl}/getPastebin`;
const getPasteBinTokenUrl = `${cloudFunctionsUrl}/getPastebinToken`;

const CONFIGURE_PASTEBIN_LAYOUT = 'CONFIGURE_PASTEBIN_LAYOUT';
const CONFIGURE_PASTEBIN_LAYOUT_FULFILLED = 'CONFIGURE_PASTEBIN_LAYOUT_FULFILLED';
const CONFIGURE_PASTEBIN_LAYOUT_REJECTED = 'CONFIGURE_PASTEBIN_LAYOUT_REJECTED';

const DISPOSE_PASTEBIN = 'DISPOSE_PASTEBIN';

const FETCH_PASTEBIN = 'FETCH_PASTEBIN';
export const FETCH_PASTEBIN_FULFILLED = 'FETCH_PASTEBIN_FULFILLED';
const FETCH_PASTEBIN_REJECTED = 'FETCH_PASTEBIN_REJECTED';

const FETCH_PASTEBIN_CONTENT = 'FETCH_PASTEBIN_CONTENT';
export const FETCH_PASTEBIN_CONTENT_FULFILLED =
    'FETCH_PASTEBIN_CONTENT_FULFILLED';
export const FETCH_PASTEBIN_CONTENT_REJECTED =
    'FETCH_PASTEBIN_CONTENT_REJECTED';

const FETCH_PASTEBIN_TOKEN = 'FETCH_PASTEBIN_TOKEN';
export const FETCH_PASTEBIN_TOKEN_FULFILLED = 'FETCH_PASTEBIN_TOKEN_FULFILLED';
export const FETCH_PASTEBIN_TOKEN_REJECTED = 'FETCH_PASTEBIN_TOKEN_REJECTED';

const defaultPasteBinState = {
    pastebinId: null,
    currentGridLayouts: null,
    isNew: false,
    editorsTexts: null,
    pastebinToken: null,
    contentChangeEditorId: null
};

export const disposePastebin = () => {
    return {
        type: DISPOSE_PASTEBIN,
    };
};

export const pastebinConfigureLayout =
    (restoreGridLayouts, getCurrentGridLayouts) => {
        return {
            type: CONFIGURE_PASTEBIN_LAYOUT,
            restoreGridLayouts: restoreGridLayouts,
            getCurrentGridLayouts: getCurrentGridLayouts,
        };
    };

export const getShareUrl = (url, pastebinId) => {
    return pastebinId ? `${url}/#:${pastebinId}` : null;
};

export const fetchPastebin = (locationHash = '') => {
    const pastebinId = locationHash.replace(/#/, '');
    const isCopy = pastebinId.indexOf(':') === 0;
    const sourcePastebinId = isCopy ? pastebinId.replace(/:/, '') : null;
    return {
        type: FETCH_PASTEBIN,
        pastebinId: isCopy ? null : pastebinId,
        isNew: isCopy ? true : !pastebinId,
        isCopy: isCopy,
        sourcePastebinId: sourcePastebinId
    };
};

const fetchPastebinFulfilled = (pastebinId, initialEditorsTexts) => {
    return {
        type: FETCH_PASTEBIN_FULFILLED,
        pastebinId: pastebinId,
        editorsTexts: initialEditorsTexts,
    }
};

const fetchPastebinContent = () => {
    return {
        type: FETCH_PASTEBIN_CONTENT,
    }
};

const fetchPastebinContentFulfilled = (initialEditorsTexts) => {
    return {
        type: FETCH_PASTEBIN_CONTENT_FULFILLED,
        editorsTexts: initialEditorsTexts
    }
};

const fetchPastebinContentRejected = error => {
    return {
        type: FETCH_PASTEBIN_CONTENT_REJECTED,
        error: error
    }
};

const fetchPastebinRejected = error => {
    return {type: FETCH_PASTEBIN_REJECTED, error: error}
};

const fetchPastebinToken = () => {
    return {
        type: FETCH_PASTEBIN_TOKEN
    }
};
const fetchPastebinTokenFulfilled = pastebinToken => {
    return {type: FETCH_PASTEBIN_TOKEN_FULFILLED, pastebinToken: pastebinToken}
};

const fetchPastebinTokenRejected = error => {
    return {type: FETCH_PASTEBIN_TOKEN_REJECTED, error: error}
};

export const pastebinReducer = (state = defaultPasteBinState, action) => {
    let initialEditorsTexts = null;
    switch (action.type) {
        case FETCH_PASTEBIN:
            return {
                ...state,
                pastebinId: action.pastebinId,
                isNew: action.isNew,
                isCopy: action.isCopy,
                sourcePastebinId: action.sourcePastebinId,
                editorsTexts: null,
                error: null,
            };

        case MONACO_EDITOR_CONTENT_CHANGED:
            let editorsTexts = state.editorsTexts || {};
            editorsTexts = {...editorsTexts, [action.editorId]: action.text};
            return {
                ...state,
                editorsTexts: editorsTexts,
                contentChangeEditorId: action.editorId
            };

        case FETCH_PASTEBIN_FULFILLED:
            initialEditorsTexts =
                action.editorsTexts ? {...action.editorsTexts} : null;
            initialEditorsTexts =
                initialEditorsTexts && state.contentChangeEditorId ?
                    {...initialEditorsTexts, ...state.editorsTexts}
                    : initialEditorsTexts;
            return {
                ...state,
                pastebinId: action.pastebinId,
                editorsTexts: initialEditorsTexts || state.editorsTexts,
                error: null,
            };
        case FETCH_PASTEBIN_REJECTED:
            return {
                ...state,
                error: action.error
            };
        case FETCH_PASTEBIN_CONTENT_FULFILLED:
            initialEditorsTexts =
                action.editorsTexts ? {...action.editorsTexts} : null;
            initialEditorsTexts =
                initialEditorsTexts && state.editorsTexts ?
                    {...state.editorsTexts, ...initialEditorsTexts}
                    : initialEditorsTexts;
            initialEditorsTexts =
                initialEditorsTexts && state.contentChangeEditorId ?
                    {...initialEditorsTexts, ...state.editorsTexts}
                    : initialEditorsTexts;
            return {
                ...state,
                editorsTexts: initialEditorsTexts || state.editorsTexts,
                error: null,
            };
        case FETCH_PASTEBIN_CONTENT_REJECTED:
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
                pastebinToken: action.pastebinToken,
                error: null,
            };
        case FETCH_PASTEBIN_TOKEN_REJECTED:
            return {
                ...state,
                error: action.error,
            };
        default:
            return state;
    }
};

export const disposePastebinEpic = (action$, store, {appManager}) =>
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
        )
;

export const pastebinLayoutEpic = (action$, store, {appManager}) =>
    action$.ofType(FETCH_PASTEBIN_FULFILLED)
        .zip(action$.ofType(CONFIGURE_PASTEBIN_LAYOUT))
        .mergeMap(actions => {
            if (actions[1].restoreGridLayouts && actions[1].getCurrentGridLayouts) {
                appManager
                    .setPastebinLayout(
                        actions[1].restoreGridLayouts,
                        actions[1].getCurrentGridLayouts
                    );
                appManager.restoreGridLayouts(
                    localStorage.get(`scr_layoutSavedState#${
                        store.getState().pastebinReducer.pastebinId
                        }`));
                return Observable.of({type: CONFIGURE_PASTEBIN_LAYOUT_FULFILLED});
            } else {
                return Observable.of({type: CONFIGURE_PASTEBIN_LAYOUT_REJECTED});
            }
        })
;

export const pastebinEpic = (action$, store, {appManager}) =>
    action$.ofType(FETCH_PASTEBIN)
        .mergeMap(action => {
            if (action.isNew) {
                const url = action.isCopy ?
                    `${getPasteBinCopyUrl}?sourcePastebinId=${action.sourcePastebinId}`
                    : getPasteBinIdUrl;
                const getPastebinIdRequest = () => ajax({
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

                if (action.isCopy) {
                    return getPastebinIdRequest();
                } else {
                    return Observable.concat(
                        Observable.of(fetchPastebinContentFulfilled(
                            getDefaultPastebinContent()
                        )),
                        getPastebinIdRequest()
                    );
                }

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

export const pastebinTokenEpic = (action$, store) =>
    action$.ofType(FETCH_PASTEBIN_FULFILLED, ACTIVATE_FIREPAD_EXPIRED, FETCH_PASTEBIN_TOKEN)
        .mergeMap(() => {
            const url =
                `${getPasteBinTokenUrl}?pastebinId=${
                    store.getState().pastebinReducer.pastebinId
                    }`;
            return ajax({
                crossDomain: true,
                url: url,
            })
                .map(result =>
                    fetchPastebinTokenFulfilled(result.response.pastebinToken)
                )
                .catch(error =>
                    Observable.of(fetchPastebinTokenRejected(error))
                );
        })
;

export const pastebinTokenRejectedEpic = action$ =>
    action$.ofType(FETCH_PASTEBIN_TOKEN_REJECTED)
        .delay(1000)
        .mapTo(fetchPastebinToken())
;

export const pastebinContentEpic = (action$, store) =>
    action$.ofType(FETCH_PASTEBIN_FULFILLED, FETCH_PASTEBIN_CONTENT)
        .filter(() => !store.getState().pastebinReducer.isNew)
        .mergeMap(() => {
            const url =
                `${
                    getPasteBinUrl
                    }?pastebinId=${store.getState().pastebinReducer.pastebinId}`;
            return ajax({
                crossDomain: true,
                url: url,
            })
                .map(result =>
                    fetchPastebinContentFulfilled(result.response.initialEditorsTexts)
                )
                .catch(error =>
                    Observable.of(fetchPastebinContentRejected(error))
                );
        })
;

export const pastebinContentRejectedEpic = action$ =>
    action$.ofType(FETCH_PASTEBIN_CONTENT_REJECTED)
        .delay(2000)
        .mapTo(fetchPastebinContent())
;
