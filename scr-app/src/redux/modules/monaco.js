import {FETCH_PASTEBIN_CONTENT_FULFILLED} from "./pastebin";

const LOAD_MONACO='LOAD_MONACO';
const LOAD_MONACO_FULFILLED='LOAD_MONACO_FULFILLED';
const LOAD_MONACO_REJECTED='LOAD_MONACO_REJECTED';

const CONFIGURE_MONACO_MODELS='CONFIGURE_MONACO_MODELS';
export const CONFIGURE_MONACO_MODELS_FULFILLED='CONFIGURE_MONACO_MODELS_FULFILLED';
const CONFIGURE_MONACO_MODELS_REJECTED='CONFIGURE_MONACO_MODELS_REJECTED';
export const UPDATE_MONACO_MODELS_FULFILLED='UPDATE_MONACO_MODELS_FULFILLED';
const UPDATE_MONACO_MODELS_REJECTED='UPDATE_MONACO_MODELS_REJECTED';

const SWITCH_MONACO_THEME='SWITCH_MONACO_THEME';
const SWITCH_MONACO_THEME_FULFILLED='SWITCH_MONACO_THEME_FULFILLED';
const SWITCH_MONACO_THEME_REJECTED='SWITCH_MONACO_THEME_REJECTED';

const defaultState={
  error: null,
  isMonacoLoading: false,
  isMonacoLoaded: false,
  isConfiguringMonacoModels: false,
  areMonacoModelsConfigured: false,
};

const loadMonaco=() => ({type: LOAD_MONACO});
export const loadMonacoFulfilled=() => ({
  type: LOAD_MONACO_FULFILLED,
});
export const loadMonacoRejected=error => ({
  type: LOAD_MONACO_REJECTED,
  error: error
});

export const configureMonacoModelsFulfilled=() => ({type: CONFIGURE_MONACO_MODELS_FULFILLED});
export const configureMonacoModelsRejected=error => ({
  type: CONFIGURE_MONACO_MODELS_REJECTED,
  error: error
});

export const updateMonacoModelsFulfilled=() => ({type: UPDATE_MONACO_MODELS_FULFILLED});
export const updateMonacoModelsRejected=error => ({
  type: UPDATE_MONACO_MODELS_REJECTED,
  error: error
});

export const switchMonacoTheme=previousThemeType => ({
  type: SWITCH_MONACO_THEME,
  previousThemeType: previousThemeType
});

export const switchMonacoThemeFulfilled=() => ({type: SWITCH_MONACO_THEME_FULFILLED});
export const switchMonacoThemeRejected=error => ({
  type: SWITCH_MONACO_THEME_REJECTED,
  error: error
});

export const monacoReducer=
  (state=defaultState,
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

export const configureMonacoModelsEpic=(action$, store, {appManager}) => {
  return action$.ofType(LOAD_MONACO_FULFILLED)
    .mergeMap(() =>
      appManager.observeConfigureMonacoModels()
    ).startWith(loadMonaco());
};

export const updateMonacoModelsEpic=(action$, store, {appManager}) =>
  action$.ofType(FETCH_PASTEBIN_CONTENT_FULFILLED)
    .zip(action$.ofType(CONFIGURE_MONACO_MODELS_FULFILLED))
    .mergeMap(() => {
        return appManager.observeUpdateMonacoModels(store.getState().pastebinReducer.editorsTexts)
      }
    )
;

export const configureMonacoThemeSwitchEpic=(action$, store, {appManager}) => {
  return action$.ofType(SWITCH_MONACO_THEME)
    .mergeMap(action =>
      appManager.observeSwitchMonacoTheme(action.previousThemeType)
    ).startWith(loadMonaco());
};


