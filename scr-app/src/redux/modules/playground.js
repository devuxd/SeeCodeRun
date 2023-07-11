import {ofType} from 'redux-observable';
import {of, combineLatestWith, mergeMap, takeUntil, switchMap} from 'rxjs';
import {UPDATE_BUNDLE_SUCCESS} from "./liveExpressionStore"
import {immutableAutoUpdateObjectArray} from "../../utils/immutableHelperUtils";
import {makeTaskQueue} from "../../utils/renderingUtils";


const UPDATE_PLAYGROUND_CANCELED = 'UPDATE_PLAYGROUND_CANCELED';

const UPDATE_PLAYGROUND_INSTRUMENTATION_SUCCESS = 'UPDATE_PLAYGROUND_INSTRUMENTATION_SUCCESS';
const UPDATE_PLAYGROUND_INSTRUMENTATION_FAILURE = 'UPDATE_PLAYGROUND_INSTRUMENTATION_FAILURE';

const UPDATE_PLAYGROUND_BUNDLE_SUCCESS = 'UPDATE_PLAYGROUND_BUNDLE_SUCCESS';
const UPDATE_PLAYGROUND_BUNDLE_FAILURE = 'UPDATE_PLAYGROUND_BUNDLE_FAILURE';

const UPDATE_PLAYGROUND_LOAD = 'UPDATE_PLAYGROUND_LOAD';
const UPDATE_PLAYGROUND_LOAD_SUCCESS = 'UPDATE_PLAYGROUND_LOAD_SUCCESS';
const UPDATE_PLAYGROUND_LOAD_FAILURE = 'UPDATE_PLAYGROUND_LOAD_FAILURE';

const UpdatePlaygroundErrorTypes = {
    INSTRUMENTATION_ERROR: 'INSTRUMENTATION',
    BUNDLING_ERROR: 'BUNDLING_ERROR',
    LOADING_ERROR: 'LOADING_ERROR'
};

const defaultUpdatePlaygroundState = {
    // isPlaygroundUpdatingCanceled: false,
    isPlaygroundUpdating: false,
    isInstrumenting: false,
    isInstrumented: false,
    isBundling: false,
    isBundled: false,
    isPlaygroundUpdated: false,
    isPlaygroundCorrupted: false,
    exceptions: {},
    errors: {},
    extras: {},
    errorType: null,
    errorMessage: null,
    updatedEditorId: null,
    editorsTexts: null,
    editorsTextChanges: {},
    cancelEvent: null,
};

export const updatePlaygroundInstrumentationSuccess = (editorId, autoLog) => ({
        type: UPDATE_PLAYGROUND_INSTRUMENTATION_SUCCESS,
        editorId,
        autoLog,
    })
;

export const updatePlaygroundInstrumentationFailure = (editorId, error, exception, extra) => ({
        type: UPDATE_PLAYGROUND_INSTRUMENTATION_FAILURE,
        editorId,
        exception,
        error,
        extra,
    })
;

export const updatePlaygroundLoad = (editorId, updateIframe) => ({
        type: UPDATE_PLAYGROUND_LOAD,
        editorId,
        updateIframe
    })
;

export const updatePlaygroundLoadSuccess = (editorId, transformed, DevTools) => ({
        type: UPDATE_PLAYGROUND_LOAD_SUCCESS,
        editorId,
        transformed,
        DevTools
    })
;

export const updatePlaygroundLoadFailure = (editorId, error, exception, extra) => ({
        type: UPDATE_PLAYGROUND_LOAD_FAILURE,
        editorId,
        exception,
        error,
        extra,
    })
;

export const updatePlaygroundLoadCanceled = (editorId, cancelEvent) => ({
        type: UPDATE_PLAYGROUND_CANCELED,
        editorId,
        cancelEvent,
    })
;


export const updatePlaygroundReducer =
    (state = defaultUpdatePlaygroundState,
     action) => {
        let {errors, exceptions, extras} = state;
        const {type, editorId, exception, error, extra, autoLog, cancelEvent, DevTools} = action;

        switch (type) {
            case UPDATE_PLAYGROUND_INSTRUMENTATION_SUCCESS:
                return {
                    ...state,
                    isInstrumenting: false,
                    isInstrumented: true,
                    isBundling: true,
                    exceptions: {},
                    errors: {},
                    extras: {},
                    editorId,
                    autoLog,
                };

            case UPDATE_PLAYGROUND_INSTRUMENTATION_FAILURE:
                return {
                    ...state,
                    isInstrumenting: false,
                    isPlaygroundCorrupted: true,
                    errorType: UpdatePlaygroundErrorTypes.INSTRUMENTATION_ERROR,
                    errorMessage: "An instrumentation error",
                    exceptions: immutableAutoUpdateObjectArray(exceptions, editorId, exception),
                    errors: immutableAutoUpdateObjectArray(errors, editorId, error),
                    extras: immutableAutoUpdateObjectArray(extras, editorId, extra),
                };

            case UPDATE_PLAYGROUND_BUNDLE_SUCCESS:
                return {
                    ...state,
                    isBundling: false,
                    isBundled: true,
                    // errorType: null,
                    // errorMessage: null,
                    // exceptions: {},
                    // errors: {},
                    // extras: {},
                };

            case UPDATE_PLAYGROUND_BUNDLE_FAILURE:
                return {
                    ...state,
                    isBundling: false,
                    isPlaygroundCorrupted: true,
                    errorType: UpdatePlaygroundErrorTypes.BUNDLING_ERROR,
                    errorMessage: "A bundling error",
                    exceptions: immutableAutoUpdateObjectArray(exceptions, editorId, exception),
                    errors: immutableAutoUpdateObjectArray(errors, editorId, error),
                    extras: immutableAutoUpdateObjectArray(extras, editorId, extra),
                };

            case UPDATE_PLAYGROUND_LOAD:
                return {
                    ...state,
                    isPlaygroundUpdating: true,
                    isPlaygroundUpdated: false,
                    isPlaygroundCorrupted: false,
                    // isPlaygroundUpdatingCanceled: false,
                    [action.editorId]: null,
                    errorType: null,
                    errorMessage: null,
                    exceptions: {},
                    errors: {},
                    extras: {},
                };

            case UPDATE_PLAYGROUND_LOAD_SUCCESS: //this may be triggering js and alj twice, the bundle aint complete
                return {
                    ...state,
                    isPlaygroundUpdating: false,
                    isPlaygroundUpdated: true,
                    isPlaygroundCorrupted: false,
                    [action.editorId]: action.transformed,
                    DevTools

                };

            case UPDATE_PLAYGROUND_LOAD_FAILURE:
                return {
                    ...state,
                    isPlaygroundUpdating: false,
                    isPlaygroundCorrupted: true,
                    errorType: UpdatePlaygroundErrorTypes.LOADING_ERROR,
                    errorMessage: "A loading error",
                    exceptions: immutableAutoUpdateObjectArray(exceptions, editorId, exception),
                    errors: immutableAutoUpdateObjectArray(errors, editorId, error),
                    extras: immutableAutoUpdateObjectArray(extras, editorId, extra),
                };

            case UPDATE_PLAYGROUND_CANCELED:
                // console.log("CANCELED");
                return {
                    ...defaultUpdatePlaygroundState
                    //     state,
                    // isPlaygroundUpdating: false,
                    // isPlaygroundUpdatingCanceled: true,
                    // cancelEvent,
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
export const updatePlaygroundEpic = (action$, state$, {appManager}) =>
    action$.pipe(
        ofType(UPDATE_BUNDLE_SUCCESS),
        combineLatestWith(action$.pipe(ofType(UPDATE_PLAYGROUND_LOAD))),
        switchMap(([preAction, action]) => {
                let error = null;
                let type = UPDATE_PLAYGROUND_LOAD_SUCCESS;
                const setProgress = (...p) => console.log("setProgress", ...p);

                const setTimelineData = (...p) => console.log("setTimelineData", ...p);


                const setTimestamp = (...p) => console.log("setTimestamp", ...p);

                const onUpdateCallback = (taskHandle, currentTaskNumber, totalTaskCount, timestamp) => {

                    setProgress(100 * (currentTaskNumber / totalTaskCount));

                    if (currentTaskNumber !== totalTaskCount) {
                        return timestamp;
                    }

                    setTimelineData(timelineData => {
                        setIsUpdating(false);
                        setTimelineDelta(timelineDelta);

                        const nextTimelineData = {
                            // ...timelineData,
                            ...deltaTimelineDataRef.current,
                        };

                        //  deltaTimelineDataRef.current = {};
                        return nextTimelineData;
                    });
                    setTimestamp(timestamp);
                };

                const queueTask = makeTaskQueue(onUpdateCallback);

                const onTraceChange = (timeline, isTraceReset, timelineDataDelta, timelineDelta, programEndI) => {

                    console.log("R: onTraceChange", {
                        timeline,
                        isTraceReset,
                        timelineDataDelta,
                        timelineDelta,
                        programEndI
                    });

                    if (isTraceReset) {
                        //todo
                        // timelineDataVisibleRef.current = {};
                        // setTimelineData({});
                    }

                    // const [from, to] = timelineDelta;

                    // const deltaTimelineData = {}; // has an issue, no values
                    //  console.log(">>", timeline, timelineDataDelta);

                    for (let key in timelineDataDelta) {
                        const extra = timelineDataDelta[key];
                        const entry = timeline[extra?.i];
                        console.log("timelineDataDelta", extra, entry);
                        queueTask(() => {
                                const serialized = entry?.logValue?.serialized;
                                if (serialized) {
                                    deltaTimelineDataRef.current[key] = deltaTimelineDataRef.current[key] ?? [];
                                    deltaTimelineDataRef.current[key].push({
                                        i: extra?.i,
                                        visible: true,
                                        value: null,//JSEN.parse(serialized),
                                        entry,
                                        extra,
                                    });
                                }
                                // console.log(key, serialized, deltaTimelineDataRef.current[key]);
                            }
                        );
                    }
                };

                try {
                    // console.log("updatePlaygroundEpic", action);
                    //preAction.payload?.bundle?.aleInstance.setAfterTraceChange(onTraceChange);
                    action.updateIframe();
                    // do not exist =)
                    // appManager.observeConfigureLiveExpressionStore(action.editorId, preAction.payload.bundle?.autoLog);
                } catch (e) {
                    error = e;
                    type = UPDATE_PLAYGROUND_LOAD_FAILURE;
                }

                // console.log("updatePlaygroundEpic", error);

                return (of({
                    type,
                    payload: {
                        error,

                    }
                }));
            },
        ),
    );
