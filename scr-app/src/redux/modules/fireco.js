import {ofType} from 'redux-observable';
import {zip, combineLatest} from 'rxjs';
import {mergeMap, switchMap, startWith, mapTo, filter} from 'rxjs/operators';

import {
    checkAreEditorsStatesFulfilled,
    LOAD_MONACO_EDITOR_FULFILLED,
    LOAD_MONACO_EDITORS_FULFILLED,
} from "./monacoEditor";

import {
    FETCH_PASTEBIN_TOKEN_FULFILLED,
} from "./pastebin";

const ON_CONNECTION_CHANGED = 'ON_CONNECTION_CHANGED';
const CONFIGURE_FIRECO_EDITOR = 'CONFIGURE_FIRECO_EDITOR';
const CONFIGURE_FIRECO_EDITOR_FULFILLED = 'CONFIGURE_FIRECO_EDITOR_FULFILLED';
const CONFIGURE_FIRECO_EDITOR_REJECTED = 'CONFIGURE_FIRECO_EDITOR_REJECTED';
export const CONFIGURE_FIRECO_EDITOR_READY = 'CONFIGURE_FIRECO_EDITOR_READY';
const CONFIGURE_FIRECO_EDITORS_READY = 'CONFIGURE_FIRECO_EDITORS_READY';
const FIRECO_EDITORS_SET_USER_ID = 'FIRECO_EDITORS_SET_USER_ID';
const FIRECO_EDITORS_SET_USER_ID_FULFILLED = 'FIRECO_EDITORS_SET_USER_ID_FULFILLED';
const FIRECO_EDITORS_SET_USER_ID_REJECTED = 'FIRECO_EDITORS_SET_USER_ID_REJECTED';

const CONFIGURE_FIRECO_EDITORS = 'CONFIGURE_FIRECO_EDITORS';
export const CONFIGURE_FIRECO_EDITORS_FULFILLED =
    'CONFIGURE_FIRECO_EDITORS_FULFILLED';
const CONFIGURE_FIRECO_EDITORS_REJECTED = 'CONFIGURE_FIRECO_EDITORS_REJECTED';

const ACTIVATE_FIREPAD = 'ACTIVATE_FIREPAD';
export const ACTIVATE_FIREPAD_FULFILLED = 'ACTIVATE_FIREPAD_FULFILLED';
export const ACTIVATE_FIREPAD_EXPIRED = 'ACTIVATE_FIREPAD_EXPIRED';
const ACTIVATE_FIREPAD_REJECTED = 'ACTIVATE_FIREPAD_REJECTED';

const PERSISTABLE_COMPONENT_MOUNTED = 'PERSISTABLE_COMPONENT_MOUNTED';
const CONFIGURE_PERSISTABLE_COMPONENT_FULFILLED = 'CONFIGURE_PERSISTABLE_COMPONENT_FULFILLED';
const CONFIGURE_PERSISTABLE_COMPONENT_REJECTED = 'CONFIGURE_PERSISTABLE_COMPONENT_REJECTED';

const CHAT_MOUNTED = 'CHAT_MOUNTED';
const CONFIGURE_FIRECO_CHAT_FULFILLED = 'CONFIGURE_FIRECO_CHAT_FULFILLED';
const CONFIGURE_FIRECO_CHAT_REJECTED = 'CONFIGURE_FIRECO_CHAT_REJECTED';

const defaultState = {
    error: null,
    isConnected: false, // Uses Firebase's connected info
    authUser: null,
    areFirecoEditorsConfiguring: false,
    areFirecoEditorsConfigured: false,
    fulfilledFirecoEditors: 0,
    readyFirecoEditors: 0,
    isFirecoEditorsReady: false,
    configuredFirecoEditors: {},
    userId: null,
    userColor: null,
    isSetUserIdPending: false,
    isSetUserIdFulfilled: false,
    isPersistableComponentMounted: false,
    isConfigurePersistableComponentFulfilled: false,
    persistableComponentPaths: [],
};

export const onConnectionChanged = isConnected => ({
    type: ON_CONNECTION_CHANGED,
    isConnected,
});

export const activateFirepad = () => ({
    type: ACTIVATE_FIREPAD,
});

export const activateFirepadFulfilled = authUser => ({
    type: ACTIVATE_FIREPAD_FULFILLED,
    authUser,
});
export const activateFirepadRejected = error => ({
    type: error.code === 'auth/invalid-credential' ?
        ACTIVATE_FIREPAD_EXPIRED : ACTIVATE_FIREPAD_REJECTED,
    error,
});

export const configureFirecoEditors = () => ({type: CONFIGURE_FIRECO_EDITORS});
export const configureFirecoEditorsFulfilled =
    () => ({type: CONFIGURE_FIRECO_EDITORS_FULFILLED});

export const configureFirecoEditorFulfilled = editorId => ({
    type: CONFIGURE_FIRECO_EDITOR_FULFILLED,
    editorId,
});

export const configureFirecoEditorRejected = (editorId, error) => ({
    type: CONFIGURE_FIRECO_EDITOR_REJECTED,
    editorId,
    error,
});

export const configureFirecoEditorReady = editorId => ({
    type: CONFIGURE_FIRECO_EDITOR_READY,
    editorId,
});

export const configureFirecoEditorsReady = () => ({
    type: CONFIGURE_FIRECO_EDITORS_READY,
});

export const firecoEditorsSetUserId =
    (userId, userColor) => ({
        type: FIRECO_EDITORS_SET_USER_ID,
        userId,
        userColor,
    })
;

export const firecoEditorsSetUserIdFulfilled =
    (userId, userColor) => ({
        type: FIRECO_EDITORS_SET_USER_ID_FULFILLED,
        userId,
        userColor,
    })
;

export const firecoEditorsSetUserIdRejected =
    (userId, userColor, error) => ({
        type: FIRECO_EDITORS_SET_USER_ID_REJECTED,
        userId,
        userColor,
        error
    })
;

export const configureFirecoChat = (onFirecoActive, disposeFirecoChat) => ({
    type: CHAT_MOUNTED,
    onFirecoActive,
    disposeFirecoChat,
});

export const configureFirecoChatFulfilled = () => ({
    type: CONFIGURE_FIRECO_CHAT_FULFILLED,
});

export const configureFirecoChatRejected = (error) => ({
    type: CONFIGURE_FIRECO_CHAT_REJECTED,
    error,
});

export const configureFirecoPersistableComponent = (path, onFirecoActive, onDispose) => ({
    type: PERSISTABLE_COMPONENT_MOUNTED,
    path,
    onFirecoActive,
});

export const configureFirecoPersistableComponentFulfilled = () => ({
    type: CONFIGURE_PERSISTABLE_COMPONENT_FULFILLED,
});

export const configureFirecoPersistableComponentRejected = (error) => ({
    type: CONFIGURE_PERSISTABLE_COMPONENT_REJECTED,
    error,
});

export const firecoReducer =
    (state = defaultState,
     action) => {
        const configuredFirecoEditors = {...state.configuredFirecoEditors};
        switch (action.type) {
            case ON_CONNECTION_CHANGED:
                return {
                    ...state,
                    isConnected: action.isConnected,
                };
            case ACTIVATE_FIREPAD:
                return {
                    ...state,
                    authUser: null
                };
            case ACTIVATE_FIREPAD_FULFILLED:
                return {
                    ...state,
                    authUser: action.authUser
                };
            case CONFIGURE_FIRECO_EDITORS:
                return {
                    ...state,
                    areFirecoEditorsConfiguring: true,
                    areFirecoEditorsConfigured: false,
                    configuredFirecoEditors: {},
                    fulfilledFirecoEditors: 0,
                    readyFirecoEditors: 0,
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
                configuredFirecoEditors[action.editorId] = {isPending: true};
                return {
                    ...state,
                    configuredFirecoEditors,
                };

            case CONFIGURE_FIRECO_EDITOR_FULFILLED:
                configuredFirecoEditors[action.editorId] = {isFulfilled: true};
                return {
                    ...state,
                    configuredFirecoEditors,
                    fulfilledFirecoEditors: state.fulfilledFirecoEditors + 1
                };
            case CONFIGURE_FIRECO_EDITOR_REJECTED:
                configuredFirecoEditors[action.editorId] = {
                    isRejected: true,
                    error: action.error
                };
                return {
                    ...state,
                    configuredFirecoEditors,
                };
            case CONFIGURE_FIRECO_EDITOR_READY:
                configuredFirecoEditors[action.editorId] =
                    configuredFirecoEditors[action.editorId] || {};
                configuredFirecoEditors[action.editorId].isReady = true;
                return {
                    ...state,
                    configuredFirecoEditors,
                    readyFirecoEditors: state.readyFirecoEditors + 1,
                };
            case FIRECO_EDITORS_SET_USER_ID:
                return {
                    ...state,
                    userId: action.userId,
                    userColor: action.userColor,
                    isSetUserIdPending: true,
                    isSetUserIdFulfilled: false,
                };
            case FIRECO_EDITORS_SET_USER_ID_FULFILLED:
                return {
                    ...state,
                    isSetUserIdPending: false,
                    isSetUserIdFulfilled: true,
                };
            case FIRECO_EDITORS_SET_USER_ID_REJECTED:
                return {
                    ...state,
                    isSetUserIdPending: false,
                    isSetUserIdFulfilled: false,
                    error: action.error,
                };
            case CONFIGURE_FIRECO_EDITORS_READY:
                return {
                    ...state,
                    isFirecoEditorsReady: true,
                };

            case PERSISTABLE_COMPONENT_MOUNTED:
                return {
                    ...state,
                    isPersistableComponentMounted: true,
                    persistableComponentPaths: [
                        ...state.persistableComponentPaths, action.path
                    ],
                };

            case CONFIGURE_PERSISTABLE_COMPONENT_FULFILLED:
                return {
                    ...state,
                    isConfigurePersistableComponentFulfilled: true,
                };
            case CONFIGURE_PERSISTABLE_COMPONENT_REJECTED:
                return {
                    ...state,
                    isConfigurePersistableComponentFulfilled: false,
                    error: action.error,
                };

            default:
                return state;
        }
    };

export const firecoActivateEpic = (
    action$, state$, {appManager}
) => zip(
    action$.pipe(
        startWith(activateFirepad()),
        ofType(FETCH_PASTEBIN_TOKEN_FULFILLED),
    ),
    action$.pipe(
        ofType(LOAD_MONACO_EDITORS_FULFILLED),
    ),
).pipe(
    mergeMap(() =>
        appManager.observeActivateFireco(
            state$.value.pastebinReducer.pastebinId,
            state$.value.pastebinReducer.pastebinToken,
            state$.value.pastebinReducer.isNew,
        )
    )
);

export const firecoEditorEpic = (
    action$, state$, {appManager}
) => zip(
    action$.pipe(
        ofType(LOAD_MONACO_EDITOR_FULFILLED),
        filter(action => action.firecoPad),
    ),
    action$.pipe(
        ofType(
            ACTIVATE_FIREPAD_FULFILLED,
            CONFIGURE_FIRECO_EDITOR_FULFILLED
        ))
).pipe(
    mergeMap(([action]) =>
        appManager.observeConfigureFirecoEditor(
            action.editorId,
            state$.value.pastebinReducer.editorsTexts ?
                state$.value.pastebinReducer.editorsTexts[action.editorId]
                : null
        )
    ),
);

export const firecoEditorsEpic = (
    action$, state$, {appManager}
) => action$.pipe(
    ofType(CONFIGURE_FIRECO_EDITOR_FULFILLED),
    filter(
        () => checkAreEditorsStatesFulfilled(
            state$.value.firecoReducer, appManager.editorIds, "configuredFirecoEditors"
        )
    ),
    mapTo(configureFirecoEditorsFulfilled()),
    startWith(configureFirecoEditors()),
);

export const firecoChatEpic = (
    action$, state$, {appManager}
) => combineLatest([
    action$.pipe(
        ofType(ACTIVATE_FIREPAD_FULFILLED),
    ),
    action$.pipe(
        ofType(
            CHAT_MOUNTED
        ),
    )
]).pipe(
    mergeMap(([, action]) => {
            return appManager.observeConfigureFirecoChat(
                action.onFirecoActive,
                action.disposeFirecoChat,
                `scr_chatUserId#${
                    state$.value.pastebinReducer.pastebinId
                }`
            )
        }
    ),
);

export const firecoPersistableComponentEpic = (
    action$, state$, {appManager}
) => combineLatest([
    action$.pipe(
        ofType(ACTIVATE_FIREPAD_FULFILLED),
    ),
    action$.pipe(
        ofType(
            PERSISTABLE_COMPONENT_MOUNTED
        ),
    )
]).pipe(
    mergeMap(
        ([, action]) => appManager.observeConfigureFirecoPersistableComponent(
            action.path,
            action.onFirecoActive,
        )
    ),
);

export const firecoEditorsReadyEpic = (
    action$, state$, {appManager}
) => action$.pipe(
    ofType(CONFIGURE_FIRECO_EDITOR_READY),
    filter(
        () => checkAreEditorsStatesFulfilled(
            state$.value.firecoReducer,
            appManager.editorIds,
            "configuredFirecoEditors"
        )
    ),
    mapTo(configureFirecoEditorsReady()),
);

export const firecoEditorsSetUserIdEpic = (
    action$, state$, {appManager}
) => action$.pipe(
    filter(() =>
        (
            state$.value.firecoReducer.isFirecoEditorsReady
        )
    ),
    ofType(FIRECO_EDITORS_SET_USER_ID),
    switchMap(
        action => appManager.observeFirecoEditorsSetUserId(
            action.userId,
            action.userColor,
        )
    )
);
