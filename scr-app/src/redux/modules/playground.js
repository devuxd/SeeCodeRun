const UPDATE_PLAYGROUND_CANCELED = 'UPDATE_PLAYGROUND_CANCELED';

const UPDATE_PLAYGROUND_INSTRUMENTATION_SUCCESS = 'UPDATE_PLAYGROUND_INSTRUMENTATION_SUCCESS';
const UPDATE_PLAYGROUND_INSTRUMENTATION_FAILURE = 'UPDATE_PLAYGROUND_INSTRUMENTATION_FAILURE';

const UPDATE_PLAYGROUND_BUNDLE_SUCCESS = 'UPDATE_PLAYGROUND_BUNDLE_SUCCESS';
const UPDATE_PLAYGROUND_BUNDLE_FAILURE = 'UPDATE_PLAYGROUND_BUNDLE_FAILURE';

const UPDATE_PLAYGROUND_LOAD_SUCCESS = 'UPDATE_PLAYGROUND_LOAD_SUCCESS';
const UPDATE_PLAYGROUND_LOAD_FAILURE = 'UPDATE_PLAYGROUND_LOAD_FAILURE';

const UpdatePlaygroundErrorTypes = {
    INSTRUMENTATION_ERROR: 'INSTRUMENTATION',
    BUNDLING_ERROR: 'BUNDLING_ERROR',
    LOADING_ERROR: 'LOADING_ERROR'
};

const defaultUpdatePlaygroundState = {
    isPlaygroundUpdatingCanceled: false,
    isPlaygroundUpdating: false,
    isInstrumenting: false,
    isInstrumented: false,
    isBundling: false,
    isBundled: false,
    isPlaygroundLoading: false,
    isPlaygroundUpdated: false,
    isPlaygroundCorrupted: false,
    runtimeErrors: null,
    errors: null,
    errorType: null,
    errorMessage: null,
    updatedEditorId: null,
    editorsTexts: null,
    editorsTextChanges: {}
};

export const updatePlaygroundInstrumentationSuccess = (editorId, autoLog) => ({
        type: UPDATE_PLAYGROUND_INSTRUMENTATION_SUCCESS,
        editorId: editorId,
        autoLog: autoLog,
    })
;

export const updatePlaygroundInstrumentationFailure = (editorId, error) => ({
        type: UPDATE_PLAYGROUND_INSTRUMENTATION_FAILURE,
        editorId: editorId,
        error: error,
    })
;

export const updatePlaygroundLoadSuccess = (editorId, transformed) => ({
        type: UPDATE_PLAYGROUND_LOAD_SUCCESS,
        editorId: editorId,
        transformed: transformed
    })
;

export const updatePlaygroundLoadFailure = (editorId, error) => ({
        type: UPDATE_PLAYGROUND_LOAD_FAILURE,
        editorId: editorId,
        error: error
    })
;

export const updatePlaygroundReducer =
    (state = defaultUpdatePlaygroundState,
     action) => {
        switch (action.type) {
            case UPDATE_PLAYGROUND_INSTRUMENTATION_SUCCESS:
                return {
                    ...state,
                    isInstrumenting: false,
                    isInstrumented: true,
                    isBundling: true,
                    errors: null,
                    editorId: action.editorId,
                    autoLog: action.autoLog,
                };

            case UPDATE_PLAYGROUND_INSTRUMENTATION_FAILURE:
                const errors = state.errors ? {...state.errors} : {};
                errors[action.editorId] = action.error;
                return {
                    ...state,
                    isInstrumenting: false,
                    isPlaygroundCorrupted: true,
                    errors: errors,
                    errorType: UpdatePlaygroundErrorTypes.INSTRUMENTATION_ERROR,
                    errorMessage: "An instrumentation error"
                };

            case UPDATE_PLAYGROUND_BUNDLE_SUCCESS:
                return {
                    ...state,
                    isBundling: false,
                    isBundled: true,
                    isPlaygroundLoading: true
                };

            case UPDATE_PLAYGROUND_BUNDLE_FAILURE:
                return {
                    ...state,
                    isBundling: false,
                    isPlaygroundCorrupted: true,
                    errorType: UpdatePlaygroundErrorTypes.BUNDLING_ERROR,
                    errorMessage: "A bundling error"
                };

            case UPDATE_PLAYGROUND_LOAD_SUCCESS:
                return {
                    ...state,
                    isPlaygroundUpdating: false,
                    isPlaygroundUpdated: true,
                    [action.editorId]: action.transformed,
                };

            case UPDATE_PLAYGROUND_LOAD_FAILURE:
                return {
                    ...state,
                    isPlaygroundLoading: false,
                    isPlaygroundCorrupted: true,
                    errorType: UpdatePlaygroundErrorTypes.LOADING_ERROR,
                    errorMessage: "A loading error"
                };

            case UPDATE_PLAYGROUND_CANCELED:
               // console.log("CANCELED");
                return {
                    ...state,
                    isPlaygroundUpdating: false,
                    isPlaygroundUpdatingCanceled: true
                };

            default:
                return state;
        }
    };

// export const updatePlaygroundEpic=(action$, store, {appManager}) =>
//     action$.ofType(UPDATE_PLAYGROUND_INSTRUMENTATION_SUCCESS)
//       .mergeMap(action => {
//           return Observable.of({
//             type: UPDATE_PLAYGROUND_BUNDLE_SUCCESS,
//             action: action
//           });
//         }
//       )
//   // .do(action => {
//   //   console.log("BOMMMMMMMMMMMM", action);
//   //   appManager.observeConfigureLiveExpressionStore(action.editorId, action.autoLog);
//   // })
//   //.mapTo({type: UPDATE_PLAYGROUND_LOAD_SUCCESS})
//   // .takeUntil(action$.ofType(UPDATE_PLAYGROUND_CANCELED))
// ;
//
// export const updatePlaygroundInstrumentationEpic=(action$, store, {appManager}) =>
//     action$.ofType(UPDATE_PLAYGROUND_INSTRUMENTATION_SUCCESS)
//       .mergeMap(action => {
//         //  console.log("ACCCCCC",action);
//         return Observable.of({
//           type: UPDATE_PLAYGROUND_LOAD_SUCCESS,
//           action: action
//         });
//       })
//   // .do(action => {
//   //   console.log("BOMMMMMMMMMMMM", action);
//   //   appManager.observeConfigureLiveExpressionStore(action.editorId, action.autoLog);
//   // })
//   //.mapTo({type: UPDATE_PLAYGROUND_LOAD_SUCCESS})
//   // .takeUntil(action$.ofType(UPDATE_PLAYGROUND_CANCELED))
// ;
