import {ofType} from 'redux-observable';
import {zip} from 'rxjs';
import {mergeMap, startWith} from 'rxjs/operators';

import {FETCH_PASTEBIN_CONTENT_FULFILLED} from "./pastebin";

const LOAD_MONACO = 'LOAD_MONACO';
const LOAD_MONACO_FULFILLED = 'LOAD_MONACO_FULFILLED';
const LOAD_MONACO_REJECTED = 'LOAD_MONACO_REJECTED';

const CONFIGURE_MONACO_MODELS = 'CONFIGURE_MONACO_MODELS';
export const CONFIGURE_MONACO_MODELS_FULFILLED = 'CONFIGURE_MONACO_MODELS_FULFILLED';
const CONFIGURE_MONACO_MODELS_REJECTED = 'CONFIGURE_MONACO_MODELS_REJECTED';
export const UPDATE_MONACO_MODELS_FULFILLED = 'UPDATE_MONACO_MODELS_FULFILLED';
const UPDATE_MONACO_MODELS_REJECTED = 'UPDATE_MONACO_MODELS_REJECTED';

const SWITCH_MONACO_THEME = 'SWITCH_MONACO_THEME';
const SWITCH_MONACO_THEME_FULFILLED = 'SWITCH_MONACO_THEME_FULFILLED';
const SWITCH_MONACO_THEME_REJECTED = 'SWITCH_MONACO_THEME_REJECTED';

const defaultState = {
    error: null,
    isMonacoLoading: false,
    isMonacoLoaded: false,
    isConfiguringMonacoModels: false,
    areMonacoModelsConfigured: false,
};

const loadMonaco = () => ({type: LOAD_MONACO});
export const loadMonacoFulfilled = monaco => ({
    type: LOAD_MONACO_FULFILLED,
    monaco
});
export const loadMonacoRejected = error => ({
    type: LOAD_MONACO_REJECTED,
    error
});

export const configureMonacoModelsFulfilled = () => ({type: CONFIGURE_MONACO_MODELS_FULFILLED});
export const configureMonacoModelsRejected = error => ({
    type: CONFIGURE_MONACO_MODELS_REJECTED,
    error
});

export const updateMonacoModelsFulfilled = () => ({type: UPDATE_MONACO_MODELS_FULFILLED});
export const updateMonacoModelsRejected = error => ({
    type: UPDATE_MONACO_MODELS_REJECTED,
    error
});

export const switchMonacoTheme = monacoTheme => ({
    type: SWITCH_MONACO_THEME,
    monacoTheme
});

export const switchMonacoThemeFulfilled = () => ({type: SWITCH_MONACO_THEME_FULFILLED});
export const switchMonacoThemeRejected = error => ({
    type: SWITCH_MONACO_THEME_REJECTED,
    error
});

export const monacoReducer =
    (state = defaultState,
     action) => {
        switch (action.type) {
            case LOAD_MONACO:
                return {
                    ...state,
                    isMonacoLoading: true,
                    isMonacoLoaded: false,
                };

            case LOAD_MONACO_FULFILLED:
                return {
                    ...state,
                    isMonacoLoading: false,
                    isMonacoLoaded: true
                };

            case LOAD_MONACO_REJECTED:
                return {
                    ...state,
                    isMonacoLoading: false,
                    error: action.error
                };
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
            default:
                return state;
        }
    };

export const loadMonacoEpic = (action$, state$, {appManager}) =>
    action$.pipe(
        ofType(LOAD_MONACO),
        mergeMap(() =>
            appManager.observeLoadMonaco()
        ),
        startWith(loadMonaco()),
    );

export const configureMonacoModelsEpic = (action$, state$, {appManager}) =>
    action$.pipe(
        ofType(LOAD_MONACO_FULFILLED),
        mergeMap(action =>
            appManager.observeConfigureMonacoModels(action.monaco)
        ),
    );

export const updateMonacoModelsEpic = (action$, state$, {appManager}) =>
    zip(
        action$.pipe(ofType(FETCH_PASTEBIN_CONTENT_FULFILLED)),
        action$.pipe(ofType(CONFIGURE_MONACO_MODELS_FULFILLED)),
    ).pipe(
        mergeMap(() => {
                return appManager.observeUpdateMonacoModels(state$.value.pastebinReducer.editorsTexts)
            }
        ),
    );

export const configureMonacoThemeSwitchEpic = (action$, state$, {appManager}) =>
    action$.pipe(
        ofType(SWITCH_MONACO_THEME),
        mergeMap(action =>
            appManager.observeSwitchMonacoTheme(action.monacoTheme)
        )
    );
