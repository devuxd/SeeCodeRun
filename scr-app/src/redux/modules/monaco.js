import {Observable} from 'rxjs';

const LOAD_MONACO = 'LOAD_MONACO';
const LOAD_MONACO_FULFILLED = 'LOAD_MONACO_FULFILLED';
const LOAD_MONACO_REJECTED = 'LOAD_MONACO_REJECTED';
export const CONFIGURE_MONACO_FULFILLED = 'CONFIGURE_MONACO_FULFILLED';
const CONFIGURE_MONACO_REJECTED = 'CONFIGURE_MONACO_REJECTED';
const LOAD_MONACO_EDITORS = 'LOAD_MONACO_EDITORS';

const defaultState = {
  error: null,
  isMonacoLoading: false,
  isMonacoLoaded: false,
  isMonacoConfigured: false
};

const loadMonaco = () => ({type: LOAD_MONACO});
export const loadMonacoFulfilled = monaco => ({type: LOAD_MONACO_FULFILLED, monaco: monaco});
export const loadMonacoRejected = error => ({type: LOAD_MONACO_REJECTED, error: error});

export const configureMonacoFulfilled = () => ({type: CONFIGURE_MONACO_FULFILLED});
export const configureMonacoRejected = error => ({type: CONFIGURE_MONACO_REJECTED, error: error});

export const monacoReducer =
  (state = defaultState,
   action) => {
    switch (action.type) {
      case LOAD_MONACO:
        return {
          ...state,
          isMonacoLoading: true,
          isMonacoLoaded: false,
          isMonacoConfigured: false
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
      case CONFIGURE_MONACO_FULFILLED:
        return {
          ...state,
          isMonacoConfigured: true
        };
      case CONFIGURE_MONACO_REJECTED:
        return {
          ...state,
          error: action.error
        };
      default:
        return state;
    }
  };

export const monacoEpic = (action$, store, deps) => {
  return action$.ofType(LOAD_MONACO_FULFILLED)
    .mergeMap(action =>
      deps.appManager.observeConfigureMonaco(action.monaco, store.getState().pastebinReducer.pastebinId)
    ).startWith(loadMonaco());
};


