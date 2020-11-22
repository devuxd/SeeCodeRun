import {createActions, handleActions, combineActions} from 'redux-actions';

const defaultUpdateBundleState = {
    isFirstBundle: false,
    isBundling: false,
    isBundled: false,
    errors: null,
    timestamp: null,
    bundle: null,
};

export const {updateBundle, updateBundleSuccess, updateBundleFailure} = createActions({
    UPDATE_BUNDLE: (timestamp = Date.now()) => ({
        errors: null,
        isBundled: false,
        isBundling: true,
        timestamp,
    }),
    UPDATE_BUNDLE_SUCCESS: (bundle = null) => ({
        isFirstBundle: true,
        isBundling: false,
        isBundled: true,
        errors: null,
        bundle,
    }),
    UPDATE_BUNDLE_FAILURE: (errors = null) => ({
        isFirstBundle: true,
        isBundling: false,
        isBundled: false,
        bundle: null,
        errors,
    }),
});


export const updateBundleReducer = handleActions(
    {
        [combineActions(updateBundle, updateBundleSuccess, updateBundleFailure)]: (
            state,
            {payload}
        ) => {
            return {...state, ...payload};
        }
    },
    defaultUpdateBundleState
);