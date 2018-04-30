import {CONFIGURE_MONACO_MODELS_FULFILLED} from "./monaco";

const LOAD_MONACO_EDITORS = 'LOAD_MONACO_EDITORS';
export const LOAD_MONACO_EDITORS_FULFILLED = 'LOAD_MONACO_EDITORS_FULFILLED';
const LOAD_MONACO_EDITORS_REJECTED = 'LOAD_MONACO_EDITORS_REJECTED';

const MOUNT_EDITOR_FULFILLED = 'MOUNT_EDITOR_FULFILLED';

const LOAD_MONACO_EDITOR = 'LOAD_MONACO_EDITOR';
export const LOAD_MONACO_EDITOR_FULFILLED = 'LOAD_MONACO_EDITOR_FULFILLED';
const LOAD_MONACO_EDITOR_REJECTED = 'LOAD_MONACO_EDITOR_REJECTED';

export const MONACO_EDITOR_CONTENT_CHANGED = 'MONACO_EDITOR_CONTENT_CHANGED';

const defaultState = {
    error: null,
    areMonacoEditorsLoading: false,
    areMonacoEditorsLoaded: false,
    monacoEditorsToLoad: 4,
    monacoEditorsAttempted: 0,
    monacoEditorsLoaded: 0,
    monacoEditorsStates: null
};

export const mountEditorFulfilled = (editorId, editorContainer) => ({
    type: MOUNT_EDITOR_FULFILLED,
    editorId: editorId,
    editorContainer: editorContainer,
});

const loadMonacoEditors = () => ({
    type: LOAD_MONACO_EDITORS
});

const loadMonacoEditorsFulfilled = () => ({
    type: LOAD_MONACO_EDITORS_FULFILLED
});

export const loadMonacoEditorFulfilled = (editorId, firecoPad) => ({
    type: LOAD_MONACO_EDITOR_FULFILLED,
    editorId: editorId,
    firecoPad: firecoPad
});

export const loadMonacoEditorRejected = (editorId, error) => ({
    type: LOAD_MONACO_EDITOR_REJECTED,
    editorId: editorId,
    error: error
});


export const monacoEditorContentChanged =
    (editorId, text, changes, isLocal) => ({
        type: MONACO_EDITOR_CONTENT_CHANGED,
        editorId: editorId,
        text: text,
        changes: changes,
        isLocal: isLocal
    })
;

export const monacoEditorsReducer =
    (state = defaultState,
     action) => {
        switch (action.type) {
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
                const monacoEditorsMounted = {...state.monacoEditorsStates};
                monacoEditorsMounted[action.editorId] = {isMounted: true};
                return {
                    ...state,
                    monacoEditorsStates: monacoEditorsMounted
                };

            case LOAD_MONACO_EDITOR:
                const monacoEditorsStates = {...state.monacoEditorsStates};
                monacoEditorsStates[action.editorId] = {isPending: true};
                return {
                    ...state,
                    monacoEditorsStates: monacoEditorsStates,
                    monacoEditorsAttempted: state.monacoEditorsAttempted + 1
                };
            case LOAD_MONACO_EDITOR_FULFILLED:
                const monacoEditorsLoadedFulfilled = {...state.monacoEditorsStates};
                monacoEditorsLoadedFulfilled[action.editorId] =
                    {
                        isFulfilled: true,
                        firecoPad: action.firecoPad
                    };
                return {
                    ...state,
                    monacoEditorsStates: monacoEditorsLoadedFulfilled,
                    monacoEditorsLoaded: state.monacoEditorsLoaded + 1,
                };
            case LOAD_MONACO_EDITOR_REJECTED:
                const monacoEditorsLoadedRejected = {...state.monacoEditorsStates};
                monacoEditorsLoadedRejected[action.editorId] = {
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

export const monacoEditorsEpic = (action$, store) =>
    action$.ofType(LOAD_MONACO_EDITOR_FULFILLED)
        .filter(() =>
            (store.getState().monacoEditorsReducer.monacoEditorsLoaded ===
                store.getState().monacoEditorsReducer.monacoEditorsToLoad))
        .mapTo(loadMonacoEditorsFulfilled())
        .startWith(loadMonacoEditors())
;

export const mountedEditorEpic = (action$, store, {appManager}) =>
    action$.ofType(MOUNT_EDITOR_FULFILLED)
        .zip(action$
            .ofType(CONFIGURE_MONACO_MODELS_FULFILLED, LOAD_MONACO_EDITOR_FULFILLED))
        .concatMap(actions => {
                const action = actions[0];
                return appManager
                    .observeConfigureMonacoEditor(action.editorId, action.editorContainer)
            }
        )
;
