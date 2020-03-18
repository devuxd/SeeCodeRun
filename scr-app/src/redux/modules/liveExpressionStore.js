const UPDATE_BUNDLE = 'UPDATE_BUNDLE';
const UPDATE_BUNDLE_SUCCESS = 'UPDATE_BUNDLE_SUCCESS';
const UPDATE_BUNDLE_FAILURE = 'UPDATE_BUNDLE_FAILURE';

const defaultUpdateBundleState = {
  errors: null,
  timestamp: null,
  bundle: null,
};

export const updateBundle = (timestamp) => ({
    type: UPDATE_BUNDLE,
    timestamp: timestamp,
  })
;

export const updateBundleSuccess = (bundle=null) => ({
    type: UPDATE_BUNDLE_SUCCESS,
    bundle: bundle,
  })
;

export const updateBundleFailure = (error) => ({
    type: UPDATE_BUNDLE_FAILURE,
    errors: error,
  })
;

export const updateBundleReducer = (state = defaultUpdateBundleState, action) => {
    switch (action.type) {
      case UPDATE_BUNDLE:
        return {
          ...state,
          errors: null,
        //  bundle: null,
          timestamp: action.timestamp,
        };
      case UPDATE_BUNDLE_SUCCESS:
        return {
          ...state,
          errors: null,
          bundle: action.bundle,
        };

      case UPDATE_BUNDLE_FAILURE:
        return {
          ...state,
          bundle: null,
          errors: action.errors,
        };
      default:
        return state;
    }
  };
