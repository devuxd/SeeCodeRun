import {ofType} from 'redux-observable';
import {of, from, map, concatMap, switchMap} from 'rxjs';
// import postcss from "postcss";
// import postcssPresetEnv from "postcss-preset-env";
import {createActions, handleActions, combineActions} from 'redux-actions';
import {immutableAutoUpdateObjectArray} from "../../utils/immutableHelperUtils";

let postcss = null;
let postcssPresetEnv = null;

const defaultUpdateBundleState = {
    isBundling: false,
    isBundled: false,
    errorType: null,
    errors: {},
    exceptions: {}, // coming from the parsers or bundlers
    bundle: null,
    timestamp: null,
};

export const UPDATE_BUNDLE = "UPDATE_BUNDLE";
export const UPDATE_BUNDLE_SUCCESS = "UPDATE_BUNDLE_SUCCESS";
export const UPDATE_BUNDLE_FAILURE = "UPDATE_BUNDLE_FAILURE";

export const {updateBundle, updateBundleSuccess, updateBundleFailure} = createActions({
    UPDATE_BUNDLE: (editorsTexts, autoLog, activateAleInstance) => ({
        ...defaultUpdateBundleState,
        isBundling: true,
        editorsTexts,
        autoLog,
        activateAleInstance,
    }),
    UPDATE_BUNDLE_SUCCESS: (bundle) => ({
        isBundling: false,
        isBundled: true,
        bundle,
    }),
    UPDATE_BUNDLE_FAILURE: (editorId, exceptions, errors, errorType) => ({
        editorId,
        errorType,
        exceptions,
        errors,
    }),
});


export const updateBundleReducer = handleActions(
    {
        [combineActions(updateBundle, updateBundleSuccess, updateBundleFailure)]: (
            state,
            {payload}
        ) => {
            const {
                isBundling,
                editorId,
                errors: newErrors,
                exceptions: newExceptions,
                errorType,
                aleInstance,
                alJs,
                ...restP
            } = payload;

            const {errors, exceptions, ...restS} = state;

            let nextErrors = errors, nextExceptions = exceptions;

            if (isBundling) {
                nextErrors = {};
                nextExceptions = {};
            }

            if (editorId) {
                nextErrors = immutableAutoUpdateObjectArray(errors, editorId, newErrors);
                nextExceptions = immutableAutoUpdateObjectArray(exceptions, editorId, newExceptions);
            }

            return {
                ...restS,
                isBundling,
                ...restP,
                errors: nextErrors,
                exceptions: nextExceptions,
            };
        }
    },
    {
        ...defaultUpdateBundleState
    });

//todo may 4 morning done!
//1. detach the playground event from bundle so it generates bundle
// 1.a garantee it runs
// 2.b adress nothing else
//2. allow the edit-parse event to be cancellable
//3. all cancellables must be within epics.
// bundle then trigger append.
export const updateLiveExpressionStoreEpic = (action$, state$, {appManager}) =>
    action$.pipe(
        ofType(UPDATE_BUNDLE),
        switchMap(({payload = {}}) => {
                const {editorsTexts, autoLog, activateAleInstance} = payload;
                const {css, html} = editorsTexts; // js contained in aleInstance

                return from(
                    (async () => {
                        let isBundleSuccess = true;

                        let nextActions = [],
                            bundle = {},
                            alJs = null;

                        let aleInstance = null,
                            setAleInstance = null,
                            editorId = null,
                            errorType = UPDATE_BUNDLE;

                        const htmlErrors = [],
                            htmlExceptions = [],
                            jsErrors = [],
                            jsExceptions = [],
                            cssErrors = [],
                            cssExceptions = [];

                        try {
                            const {sourceCodeLocationInfo = true} = autoLog.parse5Options ?? {};
                            const onParseError = error => {
                                error.name = 'ParserError';
                                htmlErrors.push(error);
                            };

                            await autoLog.parseHtml(
                                html, {sourceCodeLocationInfo, onParseError}
                            );

                        } catch (exception) {
                            htmlExceptions.push(exception);
                        }

                        if (htmlExceptions.length || htmlErrors.length) {
                            isBundleSuccess = false;
                            editorId = "html";
                            nextActions.push(updateBundleFailure(editorId, htmlExceptions, htmlErrors, errorType));
                        }

                        try {
                            const [aleInstanceT, setAleInstanceT] = activateAleInstance();

                            aleInstance = aleInstanceT;
                            setAleInstance = setAleInstanceT;
                            //const {alJs, editorId, errors, errorType} =  autoLog?.updateIframe()??{};

                            alJs = aleInstance.getWrappedALECode(true);
                            // checking if parsing error was thrown first? separate parsing js from ast traversal

                            bundle = (aleInstance && alJs) ? {
                                aleInstance,
                                editorsTexts,
                                alJs,
                                pCss: '',
                                autoLog,
                                autoLogger: {
                                    deps: {},
                                    trace: {
                                        configureWindow: () => {
                                            //todo: window ready before set tracer
                                            // console.log("LES");
                                        },
                                        onError: () => {
                                        },
                                        onMainLoaded: () => {
                                        },
                                    },
                                },
                            } : bundle; // bundle won't change until a new working one is ready


                            // appManager.observeConfigureLiveExpressionStore(action.editorId, action.autoLog);
                        } catch (error) {
                            //todo: adapt to unsafe act
                            jsErrors.push(error);
                            console.log("?", error);
                        }

                        if (jsExceptions.length || jsErrors.length) {
                            isBundleSuccess = false;
                            editorId = "js";
                            nextActions.push(updateBundleFailure(editorId, jsExceptions, jsErrors, errorType));
                        }

                        //todo
                        // do the aljs, parse5 and other things here
                        //  get aljs, also the timestamp

                        try {
                            if (!postcss) {
                                postcss = (await import("postcss")).default;
                                postcssPresetEnv = (await import("postcss-preset-env")).default;
                            }
                            const pCssResult = await postcss(
                                [postcssPresetEnv({
                                        stage: 3,
                                        features: {
                                            'nesting-rules': true
                                        }
                                    }
                                )
                                    // , postcssNested(), autoprefixer()
                                ]
                            ).process(
                                css, {from: "scss.scss", to: "css.css"}
                            );
                            const cxx = (await pCssResult);
                            //console.log("pCssResult", {css, pCssResult, cxx, cx: postcss.parse(css, {from: "css"})});
                            bundle.pCss = cxx?.css;

                        } catch (error) {
                            if (error.name === 'CssSyntaxError') {
                                cssErrors.push(error);
                            } else {
                                cssExceptions.push(error);
                            }
                        }

                        if (cssErrors.length || cssExceptions.length) {
                            editorId = "css";
                            nextActions.push(updateBundleFailure(editorId, cssExceptions, cssErrors, errorType));
                        }

                        if (isBundleSuccess) {
                            setAleInstance?.();
                            nextActions.unshift(updateBundleSuccess(bundle));
                        }

                        return nextActions;
                    })()
                ).pipe(
                    concatMap((nextActions) => of(...nextActions))
                );

            }
        ),
        // .do(action => {
        //   console.log("BOMMMMMMMMMMMM", action);
        //   appManager.observeConfigureLiveExpressionStore(action.editorId, action.autoLog);
        // })
        //.mapTo({type: UPDATE_PLAYGROUND_LOAD_SUCCESS})

    );
