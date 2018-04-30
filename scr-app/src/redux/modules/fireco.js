import {
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
    areFirecosEditorsConfiguring: false,
    areFirecosEditorsConfigured: false,
    fulfilledFirecoEditors: 0,
    configuredFirecoEditors: null
};

export const onConnectionChanged = isConnected => ({
    type: ON_CONNECTION_CHANGED,
    isConnected: isConnected
});

export const activateFirepad = () => ({
    type: ACTIVATE_FIREPAD,
});

export const activateFirepadFulfilled = authUser => ({
    type: ACTIVATE_FIREPAD_FULFILLED,
    authUser: authUser
});
export const activateFirepadRejected = error => ({
    type: error.code === 'auth/invalid-credential' ?
        ACTIVATE_FIREPAD_EXPIRED : ACTIVATE_FIREPAD_REJECTED,
    error: error
});

export const configureFirecoEditors = () => ({type: CONFIGURE_FIRECO_EDITORS});
export const configureFirecoEditorsFulfilled =
    () => ({type: CONFIGURE_FIRECO_EDITORS_FULFILLED});

export const configureFirecoEditorFulfilled = editorId => ({
    type: CONFIGURE_FIRECO_EDITOR_FULFILLED,
    editorId: editorId
});

export const configureFirecoEditorRejected = (editorId, error) => ({
    type: CONFIGURE_FIRECO_EDITOR_REJECTED,
    editorId: editorId,
    error: error
});

export const configureFirecoChat = (onFirecoActive, onDispose) => ({
    type: CHAT_MOUNTED,
    onFirecoActive: onFirecoActive,
    onDispose: onDispose,
});

export const configureFirecoChatFulfilled = () => ({
    type: CONFIGURE_FIRECO_CHAT_FULFILLED,
});

export const configureFirecoChatRejected = (error) => ({
    type: CONFIGURE_FIRECO_CHAT_REJECTED,
    error: error
});

export const configureFirecoPersistableComponent = (path, onFirecoActive, onDispose) => ({
    type: PERSISTABLE_COMPONENT_MOUNTED,
    path:path,
    onFirecoActive: onFirecoActive,
    onDispose: onDispose,
});

export const configureFirecoPersistableComponentFulfilled = () => ({
    type: CONFIGURE_PERSISTABLE_COMPONENT_FULFILLED,
});

export const configureFirecoPersistableComponentRejected = (error) => ({
    type: CONFIGURE_PERSISTABLE_COMPONENT_REJECTED,
    error: error
});

export const firecoReducer =
    (state = defaultState,
     action) => {
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
                const configuredFirecoEditors = {...state.configuredFirecoEditors};
                configuredFirecoEditors[action.editorId] = {isPending: true};
                return {
                    ...state,
                    configuredFirecoEditors: configuredFirecoEditors
                };

            case CONFIGURE_FIRECO_EDITOR_FULFILLED:
                const configuredFirecosFulfilled = {...state.configuredFirecoEditors};
                configuredFirecosFulfilled[action.editorId] = {isFulfilled: true};
                return {
                    ...state,
                    configuredFirecoEditors: configuredFirecosFulfilled,
                    fulfilledFirecoEditors: state.fulfilledFirecoEditors + 1
                };
            case CONFIGURE_FIRECO_EDITOR_REJECTED:
                const configuredFirecosRejected = {...state.configuredFirecoEditors};
                configuredFirecosRejected[action.editorId] = {
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

export const firecoActivateEpic = (action$, store, {appManager}) =>
    action$.ofType(FETCH_PASTEBIN_TOKEN_FULFILLED)
        .zip(
            action$.ofType(
                LOAD_MONACO_EDITORS_FULFILLED
            )
        )
        .mergeMap(() =>
            appManager.observeActivateFireco(
                store.getState().pastebinReducer.pastebinId,
                store.getState().pastebinReducer.pastebinToken,
                store.getState().pastebinReducer.isNew
            )
        )
        .startWith(activateFirepad())
;

export const firecoEditorEpic = (action$, store, {appManager}) =>
    action$.ofType(LOAD_MONACO_EDITOR_FULFILLED)
        .filter(action=>action.editorId !== 'consoleInput') //// ignore consoleInput
        .zip(
            action$.ofType(
                ACTIVATE_FIREPAD_FULFILLED,
                CONFIGURE_FIRECO_EDITOR_FULFILLED
            )
        )
        .mergeMap(actions =>
            appManager.observeConfigureFirecoEditor(
                actions[0].editorId,
                store.getState().pastebinReducer.editorsTexts ?
                    store.getState().pastebinReducer.editorsTexts[actions[0].editorId]
                    : null
            )
        )
;

export const firecoEditorsEpic = (action$, store) =>
    action$.ofType(CONFIGURE_FIRECO_EDITOR_FULFILLED)
        .filter(() =>
            (store.getState().firecoReducer.fulfilledFirecoEditors ===
                store.getState().monacoEditorsReducer.monacoEditorsToLoad-1) // ignore consoleInput
        )
        .mapTo(configureFirecoEditorsFulfilled())
        .startWith(configureFirecoEditors())
;

export const firecoChatEpic = (action$, store, {appManager}) =>
    action$.ofType(CHAT_MOUNTED)
        .zip(
            action$.ofType(
                CONFIGURE_FIRECO_EDITORS_FULFILLED
                //ACTIVATE_FIREPAD_FULFILLED // too early
            )
        )
        .mergeMap(actions => {
                return appManager.observeConfigureFirecoChat(
                    actions[0].onFirecoActive,
                    actions[0].onDispose,
                    `scr_chatUserId#${
                        store.getState().pastebinReducer.pastebinId
                        }`
                )
            }
        )
;

export const firecoPersistableComponentEpic = (action$, store, {appManager}) =>
    action$.ofType(PERSISTABLE_COMPONENT_MOUNTED)
        .zip(
            action$.ofType(
                ACTIVATE_FIREPAD_FULFILLED
            )
        )
        .mergeMap(actions => {
                return appManager.observeConfigureFirecoPersistableComponent(
                    actions[0].path,
                    actions[0].onFirecoActive,
                    actions[0].onDispose
                )
            }
        )
;


