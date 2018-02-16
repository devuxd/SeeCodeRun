import {Observable} from 'rxjs';
import {AUTH_PASTEBIN_FULFILLED} from "./pastebin";

const CONFIGURE_FIREPADS = 'CONFIGURE_FIREPADS';
export const CONFIGURE_FIREPADS_FULFILLED = 'CONFIGURE_FIREPADS_FULFILLED';
const CONFIGURE_FIREPADS_REJECTED = 'CONFIGURE_FIREPADS_REJECTED';

const defaultFirepadState = {
  error: null,
  isConfiguringFirepads: false,
  areFirepadsConfigured: false,
  firepadPaths: null
};

export const configureFirepads = pastebinId => ({type: CONFIGURE_FIREPADS, pastebinId: pastebinId});
export const configureFirepadsFulfilled = firepadPaths => ({
  type: CONFIGURE_FIREPADS_FULFILLED,
  firepadPaths: firepadPaths
});
export const configureFirepadsRejected = error => ({type: CONFIGURE_FIREPADS_REJECTED, error: error});

export const firepadReducer = (state = defaultFirepadState, action) => {
  switch (action.type) {
    case CONFIGURE_FIREPADS:
      return {
        ...state,
        isConfiguringFirepads: true,
        areFirepadsConfigured: false,
        firepadPaths: null
      };
    case CONFIGURE_FIREPADS_FULFILLED:
      return {
        ...state,
        isConfiguringFirepads: false,
        areFirepadsConfigured: true,
        firepadPaths: action.firepadPaths
      };
    case CONFIGURE_FIREPADS_REJECTED:
      return {
        ...state,
        isConfiguringFirepads: false,
        error: action.error
      };
    default:
      return state;
  }
};

export const firepadsEpic = (action$, store, {appManager}) =>
  action$.ofType(AUTH_PASTEBIN_FULFILLED)
    .throttleTime(2000)
    .mergeMap(() =>
      appManager.observerConfigureFirepads(store.getState().pastebinReducer.pastebinId)
    );
