import isString from 'lodash/isString';
import AutoLogShift from './AutoLogShift';
import Trace from './Trace';

import {decodeBabelError} from '../../utils/scrUtils';
import {updateBundleFailure} from "../../redux/modules/liveExpressionStore";
import {updatePlaygroundLoadFailure} from "../../redux/modules/playground";
import {editorIds} from "../AppManager";
import {parseOptions} from "./ALE";

export const scriptWrap = (scriptContent, type = 'text/javascript') => (
    `<script type='${type}'>
${scriptContent}
</script>`);

export const SCRLoader = {
    headScript: scriptWrap(`var scrLoader={scriptsLoaded:false, onScriptsLoaded:function(){}, DOMLoaded:false,
             onRequireSyncLoaded:function(errors, fallbackOverrides){},
             onUserScriptLoaded:function(errors){},
             fallbackOverrides:{},
             errors:null,onErrTimeout:null}`),
    bodyScript: scriptWrap(`scrLoader.scriptsLoaded=true; scrLoader.onScriptsLoaded()`),
};

const defaultRequireString =
    `<script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.5/require.js"></script>`;

const defaultRequireOnErrorString = `requirejs.onError = function (err) {    
        scrLoader.errors = scrLoader.errors ||[];    
        scrLoader.errors.push(err);
        clearTimeout(scrLoader.onErrTimeout);
        scrLoader.onErrTimeout = setTimeout(function(){
        scrLoader.onRequireSyncLoaded(scrLoader.errors, scrLoader.fallbackOverrides);
        }, 1000); 
    };`;

const defaultRequireEnsureMockString = `var proto = Object.getPrototypeOf(requirejs)
    Object.defineProperties(proto, {
      ensure: {
        writable: false,
        value: function ensure (sources, cb) {
          return cb(requirejs);
        }
      }
    })`;

const defaultRequireOnLoadString = `scrLoader.requirejsLoad = requirejs.load;
          requirejs.load = function (context, moduleName, url) {
            scrLoader.fallbackOverrides[moduleName] = url;
            return scrLoader.requirejsLoad(context, moduleName, url);
          };`;

export const jsDelivrResolver = (depName) => { //similar: unpkg, cdnjs
    switch (depName) {
        default:
            return `https://cdn.jsdelivr.net/npm/${depName}`;
    }
};
export const jsDelivrVersionResolver = (depName) => { //similar: unpkg, cdnjs
    switch (depName) {
        default:
            return `https://data.jsdelivr.com/v1/package/npm/${depName}`;
    }
};

const appendTrailingInterrogation = (text) => (text ? text.endsWith('?') ? text : `${text}?` : text);
export const doJsDelivrFallbackPaths = (name, url) => {
    if (url.includes('//cdn.jsdelivr.net/')) {
        let fUrl = appendTrailingInterrogation(url);
        const matches = url.match(new RegExp(`${name}[^/]*`));
        let vName = name;
        if (matches && matches.length) {
            vName = matches[0];
        }

        const fallbackArray = [
            `https://cdn.jsdelivr.net/npm/${vName}/umd/${name}.development.js?`,
            `https://cdn.jsdelivr.net/npm/${vName}/umd/${name}.min.js?`,
            `https://cdn.jsdelivr.net/npm/${vName}/umd/${name}.js?`,
            `https://cdn.jsdelivr.net/npm/${vName}/dist/${name}.js?`,
            `https://cdn.jsdelivr.net/npm/${vName}/dist/${name}.min.js?`,
            `https://cdn.jsdelivr.net/npm/${vName}/${name}.js?`,
            `https://cdn.jsdelivr.net/npm/${vName}/${name}.min.js?`,
        ];
        const isPure = !(url.endsWith('?') || url.endsWith('/') || !matches || (matches && matches.length > 1) || !url.endsWith(vName));
        if (isPure) {
            const prevFallbackPath =
                isString(requireConfig.fallbackOverrides[name]) ? requireConfig.fallbackOverrides[name] : '';
            const fbMatches = prevFallbackPath.match(new RegExp(`${name}[^/]*`));
            let fbVName = name;
            if (fbMatches && fbMatches.length) {
                fbVName = fbMatches[0];
            }
            if (prevFallbackPath && fbVName === vName) {
                fallbackArray.unshift(prevFallbackPath);
            }
        }
        isPure ? fallbackArray.push(fUrl) : fallbackArray.unshift(fUrl);
        return fallbackArray;
    }
    return null;
};
export const requireConfig = {
    isDisabled: true, // now using built-in browser imports?
    cdnResolver: jsDelivrResolver,
    cdnVersionResolver: jsDelivrVersionResolver,
    requireString: defaultRequireString,
    requireOnErrorString: defaultRequireOnErrorString,
    requireOnLoadString: defaultRequireOnLoadString,
    requireEnsureString: defaultRequireEnsureMockString,
    fallbackOverrides: {},
    dependencyOverrides: {},
    dependencies: {},
    asyncDependencies: {},
    requireSync: [],
    config: {
        waitSeconds: 7,
        catchError: false,
        enforceDefine: true,
        baseUrl: "/scripts",
        // urlArgs: "",
        // appDir: ".",
        paths: {},
        shim: {}
    },
    onDependenciesChange: null,
    triggerChange: null,
    on: false,
};

export const AutoLogErrors = {
    init: 'init',
    babel: 'babel',
    parse5: 'parse5',
    require: 'require'
};

const configureDependencies = async (deps) => {
        const newDependencies = {};
        requireConfig.requireSync = [];
        for (let dep in (deps.dependencies || {})) {
            dep = dep.replace(/["' ]/g, '');
            const versionResponse = await fetch(requireConfig.cdnVersionResolver(dep));
            if (versionResponse.ok) {
                const jVal = await versionResponse.json();
                console.log(deps, jVal);
            } else {
                console.log(dep, 'error');
            }

            if (!dep) {
                continue;
            }
            if (!newDependencies[dep]) {
                requireConfig.requireSync.push(dep);
            }
            if (requireConfig.dependencyOverrides[dep]) {
                newDependencies[dep] = requireConfig.dependencyOverrides[dep];
            } else {
                newDependencies[dep] = requireConfig.cdnResolver(dep);
            }
        }

        requireConfig.dependencies = newDependencies;

        const newAsyncDependencies = {};
        Object.keys(deps.asyncDependencies || {}).forEach(dep => {
            dep = dep.replace(/["' ]/g, '');
            if (!dep) {
                return;
            }
            if (requireConfig.dependencyOverrides[dep]) {
                newAsyncDependencies[dep] = requireConfig.dependencyOverrides[dep];
            } else {
                newAsyncDependencies[dep] = requireConfig.cdnResolver(dep);
            }
        });
        requireConfig.asyncDependencies = newAsyncDependencies;
        requireConfig.config.paths = {...requireConfig.dependencies, ...requireConfig.asyncDependencies};
        for (const name in requireConfig.config.paths) {
            const url = requireConfig.config.paths[name];
            requireConfig.config.paths[name] = doJsDelivrFallbackPaths(name, url)
                || appendTrailingInterrogation(url);
        }
// console.log('paths', requireConfig.config.paths);
    }
;

requireConfig.configureDependencies = configureDependencies;

export const updateDeps = (deps) => {
    requireConfig.on = true;
    if (deps) {
        configureDependencies(deps).then(
            () => requireConfig?.onDependenciesChange?.()
        );
    }
};

let parsersLoaded = false;
let Babel = null;
let parse5 = null;
export const BabelSCR = {};
export const importLoaders = async () => {
    if (!parse5) {
        parse5 = await import('parse5');
    }
    if (!Babel) {
        // const pluginName = 'dynamic-import-to-require-ensure';
        Babel = await import('@babel/standalone');
        // Babel.registerPlugin(pluginName, await import('./DynamicImportBabelPlugin'));

        const options = {
            parserOpts: parseOptions,
            // modules: false,
            // caller: {
            //     name: "scr",
            //     supportsStaticESM: true,
            // },
            // targets: {
            //     browsers: "> 0.25%, not dead",
            //     esmodules: true,
            // },
            presets: [
                ['env', {
                    // "exclude":
                    //     ["proposal-dynamic-import"],
                    "modules": false
                }
                ],
                'react',
            ],
            plugins: //[]
                Object.keys(Babel.availablePlugins)
                    .filter(key =>
                        // key === pluginName ||
                        // !key.includes("transform-modules-commonjs")||
                        (key.includes('proposal-') &&
                            !key.includes('proposal-decorators') &&
                            !key.includes('proposal-pipeline-operator') &&
                            !key.includes('proposal-dynamic-import')
                        )
                    )
            // .filter(key =>!key.includes("transform-modules-commonjs"))
        };
        BabelSCR.transform = sourceCode => Babel.transform(sourceCode, options);
    }
};

export const autoLogName = '_$l';
export const preAutoLogName = '_$i';
export const postAutoLogName = '_$o';

// setAutoLogNames(autoLogName, preAutoLogName, postAutoLogName);

const appendScript = (doc, script, isScript = false) => {
    const scriptEl = doc.createElement("script");
    scriptEl.type = isScript ? 'text/javascript' : "module";
    doc.body.appendChild(scriptEl);
    scriptEl.innerHTML = script;
};

const tryTransformScript = (source) => {
    try {
        return BabelSCR.transform(source);
    } catch (error) {
        return {error};
    }
};

class AutoLog {
    // constructor(jRef) {
    //     this.autoLogShift = new AutoLogShift(autoLogName, preAutoLogName, postAutoLogName, jRef);
    // }
    //
    // toAst(text) {
    //     const locationMap = {};
    //
    //     const ast = this.autoLogShift.autoLogSource(text, locationMap);
    //     return {
    //         source: text,
    //         ast: ast,
    //         locationMap: locationMap,
    //     };
    // }
    //
    // async transformWithLocationIds(ast, getLocationId) {
    //     const {
    //         locationMap, deps, ...rest
    //     } = this.autoLogShift.autoLogAst(ast, getLocationId);
    //     return {
    //         ...rest,
    //         locationMap,
    //         deps,
    //         trace: new Trace(locationMap, deps),
    //         getCode: (options) => ast?.toSource?.(options),
    //     };
    // }
    //
    // static transform(ast) {
    //     return {
    //         ...ast,
    //         trace: new Trace(ast?.locationMap),
    //         code: ast?.ast?.toSource?.()
    //     };
    // }

    appendIframe = () => {
    };

    updateIframe = (aleInstance, bundle, playgroundRef, iFrameRefHandler, updatePlaygroundLoadSuccess, updatePlaygroundLoadFailure) => {
        if (!bundle || !bundle.editorsTexts || !playgroundRef.current) {
            return;
        }

        // console.log("A", aleInstance);
        const {exceptionCallbackString, localWindowObjectIdentifierName = "window"} = aleInstance.ids;
        const onErrorHandler = this.makeOnErrorHandler(exceptionCallbackString, localWindowObjectIdentifierName);

        const html = bundle.editorsTexts[editorIds.html];
        const css = bundle.pCss ?? bundle.editorsTexts[editorIds.css];
        const js = bundle.editorsTexts[editorIds.js];

        const {alJs} = bundle;
        if (!alJs || alJs === bundle.current?.alJs) {
            console.log("Skipping updateIframe: No alJs");
            return;
        }
        if (
            !isString(html) || !isString(css)
            || !isString(js) || !isString(alJs)
        ) {
            console
                .log(
                    "[CRITICAL ERROR]: editor[s] text[s] missing",
                    html, css, js, alJs
                );

            return;
        }


        bundle.current = {alJs};
        // iFrameRefHandler.removeIframe();

        // bundle.alJs;// Auto-logged script.
        const autoLog = bundle.autoLog; // manager
        const autoLogger = bundle.autoLogger;// Auto-logged results and bindings
        autoLogger.aleInstance = aleInstance;
        const isAutoLogActive = true// bundle.isAutoLogActive; // redundant

        if (alJs) {
            // aleInstance.onBundleChange();
            // console.log('>>alJs', {alJs, autoLogger, isAutoLogActive, iFrameRefHandler,
            //     updatePlaygroundLoadSuccess,
            //     updatePlaygroundLoadFailure,
            //     html,
            //     css,
            //     js,});
            autoLog.configureIframe(
                iFrameRefHandler,
                updatePlaygroundLoadSuccess,
                updatePlaygroundLoadFailure,
                autoLogger,
                html,
                css,
                js,
                isAutoLogActive ? alJs : js,
                onErrorHandler
            );
        } else {
            if (autoLogger && autoLogger.ast) {
                autoLog.configureIframe(
                    iFrameRefHandler,
                    updatePlaygroundLoadSuccess,
                    updatePlaygroundLoadFailure,
                    autoLogger,
                    html,
                    css,
                    js,
                    js,
                    onErrorHandler
                );
            } else {
                // updatePlaygroundLoadFailure('js', new Error("PG"), null);
                console.log("CRITICAL:updatePlaygroundLoadFailure");
            }
        }
    };

    // 294 => 430 aljs not sent to updatebundle but  updatePlaygroundLoadSuccess('js', alJs);
    makeOnErrorHandler = (exceptionCallbackString, globalObjectIdentifierName) => {
        return `${globalObjectIdentifierName}.onerror = function (e) {
        ${exceptionCallbackString ? `${exceptionCallbackString}(e);` : "throw e;"}
        }`;
    };

    resetState = (state = {}) => {
        this._state = state;
    };

    state = (state = null) => {
        if (state) {
            this.resetState(state);
        }

        return this._state;
    };


    configureIframe = (runIframeHandler, updatePlaygroundLoadSuccess, updatePlaygroundLoadFailure, autoLogger, html, css, js, alJs, onErrorHandler) => {
        // console.log("configureIframe", runIframeHandler);
        autoLogger && updateDeps(autoLogger.deps);
        requireConfig.triggerChange = null;

        const state = this.state();
        const getState = () => this.state();
        // console.log("configureIframe 2");
        this.appendHtml(state, html, css, js, alJs, onErrorHandler).then(() => {
            // console.log("appendHtml");
            const sandboxIframe = () => {
                const runIframe = runIframeHandler?.createIframe();
                if (runIframe) {
                    runIframe.sandbox =
                        'allow-forms' +
                        ' allow-popups' +
                        ' allow-scripts' +
                        // ' allow-same-origin' +
                        ' allow-modals';
                    runIframe.style =
                        'overflow: auto;' +
                        ' height: 100%;' +
                        ' width: 100%;' +
                        ' margin: 0;' +
                        ' padding: 0;' +
                        ' border: 0;';
                }

                return runIframe;
            };

            const addIframeLoadListener = (runIframe) => runIframe.addEventListener('load', () => {

                if (autoLogger && autoLogger.trace && runIframe.contentWindow) {
                    // console.log("onScriptsLoaded", !!autoLogger.aleInstance.scr, runIframe, runIframe.contentWindow, runIframe.contentDocument);
                    autoLogger.aleInstance?.scr?.registerNatives(runIframe);

                    if (runIframe.contentWindow.scrLoader?.onScriptsLoaded) {

                        autoLogger.trace.configureWindow(runIframe, autoLogName, preAutoLogName, postAutoLogName);
                        // console.log("addIframeLoadListener", autoLogger.trace);
                        if (runIframe.contentWindow.scrLoader.scriptsLoaded) {
                            // console.log('appending', state.transformed.code, state.criticalError, state.transformed.error);
                            runIframe.contentWindow.scrLoader.onRequireSyncLoaded = (errors, fallbackOverrides) => {

                                if (!errors) {
                                    if (fallbackOverrides) {
                                        requireConfig.fallbackOverrides = {...fallbackOverrides};
                                    }
                                } else {
                                    autoLogger.trace.onError(errors, /*true*/);
                                }
                            };
                            runIframe.contentWindow.scrLoader.onUserScriptLoaded = autoLogger.trace.onMainLoaded;
                            appendScript(runIframe.contentDocument, state.transformed.code);
                        } else {
                            runIframe.contentWindow.scrLoader.onRequireSyncLoaded = (errors, fallbackOverrides) => {

                                if (!errors) {
                                    if (fallbackOverrides) {
                                        requireConfig.fallbackOverrides = {...fallbackOverrides};
                                    }
                                } else {
                                    autoLogger.trace.onError(errors, /*true*/); // isBundlingError
                                }
                            };
                            runIframe.contentWindow.scrLoader.onUserScriptLoaded = autoLogger.trace.onMainLoaded;
                            runIframe.contentWindow.scrLoader.onScriptsLoaded = () => {
                                // console.log("onScriptsLoaded", runIframe, runIframe.contentDocument);
                                // console.log('appending', state.transformed.code, state.criticalError, state.transformed.error);
                                appendScript(runIframe.contentDocument, state.transformed.code);
                            };
                        }
                    }
                } else {

                }
            });

            this.appendIframe = () => {
                let isAppended = false, DevTools = null;
                // console.log("appendIframe");

                //todo: CHECK PARSE ERROR BEFORE BUNDLING
                if (state.getHTML) {
                    const runIframe = sandboxIframe();
                    const alHTML = state.getHTML();
                    [isAppended, DevTools] = runIframeHandler.appendIframe(runIframe);
                    const activeRunIframe = runIframeHandler.getIframe();
                    if (isAppended && activeRunIframe) {
                        // console.log('appending', {DevTools}, runIframe === activeRunIframe, alHTML);
                        addIframeLoadListener(activeRunIframe);
                        activeRunIframe.srcdoc = alHTML;
                    }
                }
                updatePlaygroundLoadSuccess('js', alJs, DevTools);
            };
            requireConfig.triggerChange = this.appendIframe;
            this.appendIframe();
        }).catch(error => {
                // todo [semantic] errors, add retry
                // console.log("FFFF", getState(), this);
                const {humanUnderstandableError, criticalError} = this.state();
                if (humanUnderstandableError) {
                    switch (humanUnderstandableError.type) {
                        case AutoLogErrors.babel:
                            //const errorInfo = decodeBabelError(error);
                            //todo: <X x={}> causes TypeError: unknown file: Property value of ObjectProperty expected node to be of a type ["Expression","PatternLike"] but instead got "JSXEmptyExpression"
                            console.log('Semantic error!', humanUnderstandableError, error, ({...criticalError}));
                            updatePlaygroundLoadFailure('js', error, null);

                            break;
                        default:
                            console.log('humanUnderstandableError', humanUnderstandableError, error);
                    }
                } else {
                    console.log('Unknown error', error);
                }

                // if (criticalError) {
                //     console.log('criticalError', criticalError, state);
                // }
                // console.trace();

            }
        );
    }

    parseHtml = async (html, parse5Options) => {
        if (!parsersLoaded) {
            await importLoaders();
            //post: parse5 and BabelSCR.transform ready
            parsersLoaded = true;
        }

        const state = this.state({});

        state.humanUnderstandableError = {
            type: AutoLogErrors.init,
            message: 'Could not download files from server. Please check your Internet access and refresh this page.'
        };

        state.parsersLoaded = parsersLoaded;
        state.humanUnderstandableError = {
            type: AutoLogErrors.parse5,
            message: 'The HTML file contains errors.'
        };
        state.parsed = parse5.parse(html, parse5Options);
        state.humanUnderstandableError.message = 'HTML Element not found.';
        const htmlElementChildNodes = state.parsed.childNodes.find(node => node.nodeName === 'html').childNodes;

        state.humanUnderstandableError.message = 'Head Element not found.';
        state.headTagLocation = htmlElementChildNodes.find(node => node.nodeName === 'head').sourceCodeLocation;

        state.humanUnderstandableError.message = 'Body Element not found.';
        state.bodyTagLocation = htmlElementChildNodes.find(node => node.nodeName === 'body').sourceCodeLocation;

        state.humanUnderstandableError.message = 'Head opening tag not found.';

        this.state(state);

        return state.parsed;
    };

    async appendHtml(state, html, css, js, alJs, onErrorHandler) {
        const cssString = `<style>${css}</style>`;

        const defaultHeadTagLocation = {
            startTag: {
                startOffset: state.headTagLocation.startTag.startOffset,
                endOffset: state.headTagLocation.startTag.endOffset,
                _: !(state.humanUnderstandableError.message = 'Head closing tag not found.'),
            },
            endTag: {
                startOffset: state.headTagLocation.endTag.startOffset,
                endOffset: state.headTagLocation.endTag.endOffset,
                _: !(state.humanUnderstandableError.message = 'Body opening tag not found.'),
            }
        };

        const defaultBodyTagLocation = {
            startTag: {
                startOffset: state.bodyTagLocation.startTag.startOffset,
                endOffset: state.bodyTagLocation.startTag.endOffset,
                _: !(state.humanUnderstandableError.message = 'Body closing tag not found.'),
            },
            endTag: {
                startOffset: state.bodyTagLocation.endTag.startOffset,
                endOffset: state.bodyTagLocation.endTag.endOffset,
            }
        };

        state.humanUnderstandableError = {
            type: AutoLogErrors.babel,
            message: 'The JS file contains errors.',
        };


        state.transformed = tryTransformScript(alJs);
        if (state.transformed.error) {
            console.log("not running AlJs code");
            state.criticalError = state.transformed.error;
            state.transformed = BabelSCR.transform(js);
        }

        // console.log("CP", {alJs, state});

        state.transformed.source = state.transformed.code;
        //  requireConfig.requireSync.push('"material-ui/Tooltip"');
        state.transformed.code = requireConfig.isDisabled ?
            state.transformed.code
            : `${requireConfig.requireOnLoadString}
                ${requireConfig.requireEnsureString}
                requirejs(${JSON.stringify(requireConfig.requireSync)}, function(){
                scrLoader.onRequireSyncLoaded(scrLoader.errors, scrLoader.fallbackOverrides);
                ${state.transformed.code}
                scrLoader.moduleEval= function(code){
                 return eval(code);
                };
                scrLoader.onUserScriptLoaded();
                });`;

        state.humanUnderstandableError = null;

        state.getHTML = (config = requireConfig.config,
                         headTagLocation = defaultHeadTagLocation,
                         bodyTagLocation = defaultBodyTagLocation) => {
            const requireScriptsString = scriptWrap(
                requireConfig.isDisabled ?
                    `// NO REQUIRE-CONFIG` :
                    `${requireConfig.requireString})
                ${scriptWrap(` ${requireConfig.requireOnErrorString}
                requirejs.config(${JSON.stringify(config)});`)
                    }`);
            if (!state.humanUnderstandableError) {
                return `${html.substring(0, headTagLocation.endTag.startOffset)}
                    ${SCRLoader.headScript}
                    ${scriptWrap(onErrorHandler)}
                    ${html.substring(headTagLocation.endTag.startOffset, bodyTagLocation.startTag.endOffset)}
                     ${cssString}
                    ${html.substring(bodyTagLocation.startTag.endOffset, bodyTagLocation.endTag.startOffset)}
                     ${requireScriptsString}
                     ${SCRLoader.bodyScript}
                    ${html.substring(bodyTagLocation.endTag.startOffset, html.length)}`;
            } else {
                return null;
            }
        };
    }

}

export default AutoLog;
