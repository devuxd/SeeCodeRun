import {ofType} from 'redux-observable';
import {concat, of, zip} from 'rxjs';
import {
    catchError,
    debounceTime,
    delay,
    filter,
    map,
    mapTo,
    mergeMap,
    startWith
} from 'rxjs/operators';
import {ajax} from 'rxjs/ajax';
import localStorage from 'store';
import {getDefaultPastebinContent} from '../../utils/pastebinContentUtils';
import {ACTIVATE_FIREPAD_EXPIRED} from './fireco';
import {MONACO_EDITOR_CONTENT_CHANGED} from './monacoEditor';
import firebaseConfig from '../../seecoderun/firebaseConfig';

const {cloudFunctionsPath} = firebaseConfig;

const cloudFunctionsUrl = `${process.env.PUBLIC_URL}/${cloudFunctionsPath}`;
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

const SEARCH_STATE_CHANGE = 'SEARCH_STATE_CHANGE';
const SEARCH_STATE_CHANGE_FULFILLED =
    'SEARCH_STATE_CHANGE_FULFILLED';
const SEARCH_STATE_CHANGE_REJECTED =
    'SEARCH_STATE_CHANGE_REJECTED';

const defaultPasteBinState = {
    pastebinId: null,
    currentGridLayouts: null,
    isNew: false,
    editorsTexts: null,
    pastebinToken: null,
    contentChangeEditorId: null,
    searchState: null,
};

export const disposePastebin = () => {
    return {
        type: DISPOSE_PASTEBIN,
    };
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

export const searchStateChange = (searchState) => {
    return {
        type: SEARCH_STATE_CHANGE,
        searchState,
    }
};
export const searchStateChangeFulfilled = result => {
    return {type: SEARCH_STATE_CHANGE_FULFILLED, result}
};

export const searchStateChangeRejected = error => {
    return {type: SEARCH_STATE_CHANGE_REJECTED, error}
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
                editorsTexts,
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

export const disposePastebinEpic = (action$, state$, {appManager}) =>
    action$.pipe(
        ofType(DISPOSE_PASTEBIN),
        mergeMap(() => {
                localStorage.set(
                    `scr_monacoEditorsSavedStates#${
                        state$.value.pastebinReducer.pastebinId
                    }`,
                    appManager.getEditorsStates()
                );
                localStorage.set(`scr_layoutSavedState#${
                        state$.value.pastebinReducer.pastebinId
                    }`,
                    appManager.getCurrentGridLayouts());
                return appManager.observeDispose();
            }
        ),
    );

export const pastebinLayoutEpic = (action$, state$, {appManager}) =>
    zip(
        action$.pipe(ofType(FETCH_PASTEBIN_FULFILLED)),
        action$.pipe(ofType(CONFIGURE_PASTEBIN_LAYOUT)),
    ).pipe(
        mergeMap(actions => {
            if (actions[1].restoreGridLayouts && actions[1].getCurrentGridLayouts) {
                appManager
                    .setPastebinLayout(
                        actions[1].restoreGridLayouts,
                        actions[1].getCurrentGridLayouts
                    );
                appManager.restoreGridLayouts(
                    localStorage.get(`scr_layoutSavedState#${
                        state$.value.pastebinReducer.pastebinId
                    }`));
                return of({type: CONFIGURE_PASTEBIN_LAYOUT_FULFILLED});
            } else {
                return of({type: CONFIGURE_PASTEBIN_LAYOUT_REJECTED});
            }
        })
    );

export const pastebinEpic = (action$, state$, {appManager}) =>
    action$.pipe(
        ofType(FETCH_PASTEBIN),
        mergeMap(action => {
            if (action.isNew) {
                const url = action.isCopy ?
                    `${getPasteBinCopyUrl}?sourcePastebinId=${action.sourcePastebinId}`
                    : getPasteBinIdUrl;
                const getPastebinIdRequest = () => ajax({
                    crossDomain: true,
                    url: url,
                }).pipe(
                    map(result => {
                        appManager.setPastebinId(result.response.pastebinId);
                        return fetchPastebinFulfilled(
                            result.response.pastebinId,
                            null,
                        );
                    }),
                    catchError(error => of(fetchPastebinRejected(error))),
                );

                if (action.isCopy) {
                    return getPastebinIdRequest();
                } else {
                    return concat(
                        of(fetchPastebinContentFulfilled(
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
                return of(fetchPastebinFulfilled(
                    action.pastebinId,
                    appManager.getInitialEditorsTextsFromRestoreEditorsStates()
                    )
                );
            }
        }),
        startWith(fetchPastebin(appManager.urlData.hash)),
    );

export const pastebinTokenEpic = (action$, state$) =>
    action$.pipe(
        ofType(FETCH_PASTEBIN_FULFILLED, ACTIVATE_FIREPAD_EXPIRED, FETCH_PASTEBIN_TOKEN),
        mergeMap(() => {
            const url =
                `${getPasteBinTokenUrl}?pastebinId=${
                    state$.value.pastebinReducer.pastebinId
                }`;
            return ajax({
                crossDomain: true,
                url: url,
            }).pipe(
                map(result =>
                    fetchPastebinTokenFulfilled(result.response.pastebinToken)
                ),
                catchError(error =>
                    of(fetchPastebinTokenRejected(error))
                ),
            );
        }),
    );

export const pastebinTokenRejectedEpic = action$ =>
    action$.pipe(
        ofType(FETCH_PASTEBIN_TOKEN_REJECTED),
        delay(1000),
        mapTo(fetchPastebinToken())
    );

export const pastebinContentEpic = (action$, state$) =>
    action$.pipe(
        ofType(/*FETCH_PASTEBIN_FULFILLED,*/ FETCH_PASTEBIN_CONTENT),
        filter(() => !state$.value.pastebinReducer.isNew),
        mergeMap(() => {
            const url =
                `${
                    getPasteBinUrl
                }?pastebinId=${state$.value.pastebinReducer.pastebinId}`;
            return ajax({
                crossDomain: true,
                url: url,
            }).pipe(
                map(result =>
                    fetchPastebinContentFulfilled(result.response.initialEditorsTexts)
                ),
                catchError(error =>
                    of(fetchPastebinContentRejected(error))
                )
            );
        }),
    );

export const pastebinContentRejectedEpic = action$ =>
    action$.pipe(
        ofType(FETCH_PASTEBIN_CONTENT_REJECTED),
        delay(2000),
        mapTo(fetchPastebinContent()),
    );

export const pastebinSearchStateChangeEpic = (action$, state$, {appManager}) =>
    action$.pipe(
        ofType(SEARCH_STATE_CHANGE),
        debounceTime(1000),
        mergeMap((action)=>appManager.observeSearchStateChange(action.searchState)),
    );