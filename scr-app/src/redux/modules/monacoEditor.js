import {ofType} from 'redux-observable';
import {zip} from 'rxjs';
import {concatMap, startWith, mapTo, filter} from 'rxjs/operators';

import {CONFIGURE_MONACO_MODELS_FULFILLED} from './monaco';

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
    monacoEditorsToLoad: 3,
    monacoEditorsAttempted: 0,
    monacoEditorsLoaded: 0,
    monacoEditorsStates: null,
};

export const mountEditorFulfilled = (editorId, editorHooks) => ({
    type: MOUNT_EDITOR_FULFILLED,
    editorId,
    editorHooks,
});

const loadMonacoEditors = () => ({
    type: LOAD_MONACO_EDITORS
});

const loadMonacoEditorsFulfilled = () => ({
    type: LOAD_MONACO_EDITORS_FULFILLED
});

export const loadMonacoEditorFulfilled = (editorId, firecoPad) => ({
    type: LOAD_MONACO_EDITOR_FULFILLED,
    editorId,
    firecoPad,
});

export const loadMonacoEditorRejected = (editorId, error) => ({
    type: LOAD_MONACO_EDITOR_REJECTED,
    editorId,
    error,
});


export const monacoEditorContentChanged =
    (editorId, text, changes) => ({
        type: MONACO_EDITOR_CONTENT_CHANGED,
        editorId,
        text,
        changes,
    })
;

export const monacoEditorsReducer =
    (state = defaultState,
     action) => {
        const monacoEditorsStates = {...state.monacoEditorsStates};
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
                monacoEditorsStates[action.editorId] = {isMounted: true};
                return {
                    ...state,
                    monacoEditorsStates
                };

            case LOAD_MONACO_EDITOR:
                monacoEditorsStates[action.editorId] = {isPending: true};
                return {
                    ...state,
                    monacoEditorsStates,
                    monacoEditorsAttempted: state.monacoEditorsAttempted + 1
                };
            case LOAD_MONACO_EDITOR_FULFILLED:
                monacoEditorsStates[action.editorId] =
                    {
                        isFulfilled: true,
                        firecoPad: action.firecoPad
                    };
                return {
                    ...state,
                    monacoEditorsStates,
                    monacoEditorsLoaded: state.monacoEditorsLoaded + 1,
                };
            case LOAD_MONACO_EDITOR_REJECTED:
                monacoEditorsStates[action.editorId] = {
                    isRejected: true,
                    error: action.error
                };
                return {
                    ...state,
                    monacoEditorsStates,
                };
            default:
                return state;
        }
    };


export const mountedEditorEpic = (action$, state$, {appManager}) =>
    zip(
        action$.pipe(ofType(MOUNT_EDITOR_FULFILLED)),
        action$.pipe(ofType(CONFIGURE_MONACO_MODELS_FULFILLED, LOAD_MONACO_EDITOR_FULFILLED)),
    ).pipe(
        concatMap(actions => {
                const action = actions[0];
                return appManager
                    .observeConfigureMonacoEditor(action.editorId, action.editorHooks)
            }
        )
    );

export const monacoEditorsEpic = (action$, state$) =>
    action$.pipe(
        ofType(LOAD_MONACO_EDITOR_FULFILLED),
        filter(() =>
            (state$.value.monacoEditorsReducer.monacoEditorsLoaded ===
                state$.value.monacoEditorsReducer.monacoEditorsToLoad)
        ),
        mapTo(loadMonacoEditorsFulfilled()),
        startWith(loadMonacoEditors())
    );

