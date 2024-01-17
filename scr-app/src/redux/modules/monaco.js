import {ofType} from 'redux-observable';
import {zip} from 'rxjs';
import {mergeMap, startWith} from 'rxjs/operators';
import {createAction, createReducer} from '@reduxjs/toolkit';


import {FETCH_PASTEBIN_CONTENT_FULFILLED} from './pastebin';

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

const initialState = {
   error: null,
   isMonacoLoading: false,
   isMonacoLoaded: false,
   isConfiguringMonacoModels: false,
   areMonacoModelsConfigured: false,
   monacoTheme: 'vs-light',
};

const loadMonaco = createAction(LOAD_MONACO);
export const loadMonacoFulfilled = createAction(LOAD_MONACO_FULFILLED);
export const loadMonacoRejected = createAction(LOAD_MONACO_REJECTED);

export const configureMonacoModels = createAction(CONFIGURE_MONACO_MODELS);

export const configureMonacoModelsFulfilled = createAction(CONFIGURE_MONACO_MODELS_FULFILLED);
export const configureMonacoModelsRejected = createAction(CONFIGURE_MONACO_MODELS_REJECTED);

export const updateMonacoModelsFulfilled = createAction(UPDATE_MONACO_MODELS_FULFILLED);
export const updateMonacoModelsRejected = createAction(UPDATE_MONACO_MODELS_REJECTED);

export const switchMonacoTheme = createAction(SWITCH_MONACO_THEME);

export const switchMonacoThemeFulfilled = createAction(SWITCH_MONACO_THEME_FULFILLED);
export const switchMonacoThemeRejected = createAction(SWITCH_MONACO_THEME_REJECTED);

export const monacoReducer = createReducer(initialState, (builder) => {
   builder
      .addCase(loadMonaco, (draft) => {
         draft.isMonacoLoading = true;
         draft.isMonacoLoaded = false;
      })
      .addCase(loadMonacoFulfilled, (draft) => {
         draft.isMonacoLoading = false;
         draft.isMonacoLoaded = true;
      })
      .addCase(loadMonacoRejected, (draft, {payload}) => {
         draft.isMonacoLoading = false;
         draft.error = payload;
      })
      .addCase(configureMonacoModels, (draft) => {
         draft.isConfiguringMonacoModels = true;
         draft.areMonacoModelsConfigured = false;
      })
      .addCase(configureMonacoModelsFulfilled, (draft) => {
         draft.isConfiguringMonacoModels = false;
         draft.areMonacoModelsConfigured = true;
      })
      .addCase(configureMonacoModelsRejected, (draft, {payload}) => {
         draft.isConfiguringMonacoModels = false;
         draft.error = payload;
      })
      .addCase(switchMonacoTheme, (draft, {payload}) => {
         draft.monacoTheme = payload;
      });
})

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
      mergeMap(({payload}) =>
         appManager.observeConfigureMonacoModels(payload)
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
      mergeMap(({payload}) =>
         appManager.observeSwitchMonacoTheme(payload)
      )
   );
