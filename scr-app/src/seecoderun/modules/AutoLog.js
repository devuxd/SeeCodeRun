// import {TraceTypes, setAutoLogNames, toAst, wrapCallExpressions, wrapFunctionExpressions} from "../../utils/JsCodeShiftUtils";
import isString from 'lodash/isString';
import DIBabelPlugin from 'babel-plugin-dynamic-import-webpack';
// import AutoLogShift from 'jscodetracker';
import AutoLogShift from './AutoLogShift';
import Trace from './Trace';
import {
    updatePlaygroundLoadFailure,
    updatePlaygroundLoadSuccess
} from "../../redux/modules/playground";
import {decodeBabelError} from "../../utils/scrUtils";

export const SCRLoader = {
    headScript: `<script>var scrLoader={scriptsLoaded:false, onScriptsLoaded:function(){}, DOMLoaded:false,
             onRequireSyncLoaded:function(errors, fallbackOverrides){},
             onUserScriptLoaded:function(errors){},
             fallbackOverrides:{},
             errors:null,onErrTimeout:null};</script>`,
    bodyScript: `<script>scrLoader.scriptsLoaded=true; scrLoader.onScriptsLoaded()</script>`,
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
})
`;

const defaultRequireOnLoadString = `scrLoader.requirejsLoad = requirejs.load;
          requirejs.load = function (context, moduleName, url) {
            scrLoader.fallbackOverrides[moduleName] = url;
            return scrLoader.requirejsLoad(context, moduleName, url);
          };`;

export const jsDelivrResolver = (depName) => { //similar: unpkg, cdnjs
    switch (depName) {
        default:
            return `https://cdn.jsdelivr.net/npm/${depName}`; //todo find version obtained
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
    isDisabled: false,
    cdnResolver: jsDelivrResolver,
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

const configureDependencies = (deps) => {
    const newDependencies = {};
    requireConfig.requireSync = [];
    Object.keys(deps.dependencies || {}).forEach(dep => {
        dep = dep.replace(/["' ]/g, '');
        if (!dep) {
            return;
        }
        if (!newDependencies[dep]) {
            requireConfig.requireSync.push(dep);
        }
        if (requireConfig.dependencyOverrides[dep]) {
            newDependencies[dep] = requireConfig.dependencyOverrides[dep];
        } else {
            newDependencies[dep] = requireConfig.cdnResolver(dep);
        }
    });
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
};

requireConfig.configureDependencies = configureDependencies;

export const updateDeps = (deps) => {
    requireConfig.on = true;
    if (deps) {
        configureDependencies(deps);
        requireConfig.onDependenciesChange && requireConfig.onDependenciesChange();
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
    if (!Babel) {// lazy loading Babel to improve boot up
        const presetExcludes =
            ['flow', 'typescript', 'es2017', 'es2015', 'es2015-loose', 'stage-0', 'stage-1', 'stage-2', 'es2015-no-commonjs'];
        Babel = await import('@babel/standalone');
        Babel.registerPlugin('dynamic-import-webpack', DIBabelPlugin);
        const options = {
            presets: //[],
                Object.keys(Babel.availablePresets)
                    .filter(key => !presetExcludes.includes(key)),
            plugins: //[],
                Object.keys(Babel.availablePlugins)
                    .filter(key => !(
                        key.includes('-flow')
                        || key.includes('-typescript')
                        || key.includes('-strict-mode')
                        || key.includes('-modules')
                        || key.includes('external-helpers')
                        || key.includes('transform-runtime')
                        || key.includes('-async-to')
                        || key.includes('-regenerator')
                    )),
        };

        options.presets.push(['es2015', {
            modules: "commonjs",
        }]);

        BabelSCR.transform = sourceCode => Babel.transform(sourceCode, options);
    }
};

export const autoLogName = '_$l';
export const preAutoLogName = '_$i';
export const postAutoLogName = '_$o';

// setAutoLogNames(autoLogName, preAutoLogName, postAutoLogName);

const appendScript = (doc, script) => {
    const scriptEl = doc.createElement("script");
    scriptEl.type = 'text/javascript';
    doc.body.appendChild(scriptEl);
    scriptEl.innerHTML = script;
};

const tryTransformScript = (source) => {
    try {
        return BabelSCR.transform(source);
    } catch (e) {
        return {error: e};
    }
};

class AutoLog {
    constructor(jRef) {
        this.autoLogShift = new AutoLogShift(autoLogName, preAutoLogName, postAutoLogName, jRef);
    }

    toAst(text) {
        const locationMap = {};

        const ast = this.autoLogShift.autoLogSource(text, locationMap);
        return {
            source: text,
            ast: ast,
            locationMap: locationMap,
        };
    }

    transformWithLocationIds(ast, getLocationId) {

        const {locationMap, deps} = this.autoLogShift.autoLogAst(ast, getLocationId);
        const code = ast.toSource();
        // console.log(code);
        return {
            locationMap: locationMap,
            trace: new Trace(locationMap),
            code,
            deps
        };
    }

    transform(ast) {
        return {
            ...ast,
            trace: new Trace(ast.locationMap),
            code: ast.ast.toSource()
        };
    }

    appendIframe = () => {
    };

    configureIframe(runIframeHandler, store, autoLogger, html, css, js, alJs) {

        // runIframe.onerror= (e) => {
        //   console.log("error ifr", e);
        // };
        autoLogger && updateDeps(autoLogger.deps);

        const state = {};
        requireConfig.triggerChange = null;
        this.appendHtml(state, html, css, js, alJs).then(() => {
            const sandboxIframe = () => {
                const runIframe = runIframeHandler.createIframe();
                runIframe.sandbox =
                    'allow-forms' +
                    ' allow-popups' +
                    ' allow-scripts' +
                    ' allow-same-origin' +
                    ' allow-modals';
                runIframe.style =
                    'overflow: auto;' +
                    ' height: 100%;' +
                    ' width: 100%;' +
                    ' margin: 0;' +
                    ' padding: 0;' +
                    ' border: 0;';
                return runIframe;
            };

            const addIframeLoadListener = (runIframe) => runIframe.addEventListener('load', () => {
                if (autoLogger && autoLogger.trace && runIframe.contentWindow) {

                    if (runIframe.contentWindow.scrLoader && runIframe.contentWindow.scrLoader.onScriptsLoaded) {
                        autoLogger.trace.configureWindow(runIframe, autoLogName, preAutoLogName, postAutoLogName);
                        if (runIframe.contentWindow.scrLoader.scriptsLoaded) {
                            // console.log('appending', state.transformed.code, state.criticalError, state.transformed.error);
                            runIframe.contentWindow.scrLoader.onRequireSyncLoaded = (errors, fallbackOverrides) => {

                                if (!errors) {
                                    if (fallbackOverrides) {
                                        requireConfig.fallbackOverrides = {...fallbackOverrides};
                                    }
                                } else {
                                    console.log('load errors', errors);
                                    //todo handle bundling/dependency error
                                    autoLogger.trace.onError(errors);
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
                                    console.log('load errors', errors);
                                }
                            };
                            runIframe.contentWindow.scrLoader.onUserScriptLoaded = autoLogger.trace.onMainLoaded;
                            runIframe.contentWindow.scrLoader.onScriptsLoaded = () => {
                                // console.log('appending', state.transformed.code, state.criticalError, state.transformed.error);
                                appendScript(runIframe.contentDocument, state.transformed.code);
                            };
                        }
                    }
                } else {

                }
            });

            this.appendIframe = () => {
                if (state.getHTML) {
                    const runIframe = sandboxIframe();
                    const alHTML = state.getHTML();
                    const isAppended = runIframeHandler.appendIframe(runIframe);
                    const activeRunIframe = runIframeHandler.getIframe();
                    if (isAppended && activeRunIframe) {
                        // console.log('appending', runIframe === activeRunIframe, alHTML);
                        addIframeLoadListener(activeRunIframe);
                        activeRunIframe.srcdoc = alHTML;
                    }
                }
            };
            requireConfig.triggerChange = this.appendIframe;
            this.appendIframe();
        }).catch(error => {
            // todo [semantic] errors
                const {humanUnderstandableError} = state;
                if (humanUnderstandableError) {
                    switch (humanUnderstandableError.type) {
                        case AutoLogErrors.babel:
                            const errorInfo = decodeBabelError(error);
                            console.log('Semantic error', errorInfo, humanUnderstandableError);
                            break;
                        default:
                            console.log('humanUnderstandableError', humanUnderstandableError, error);
                    }
                } else {
                    console.log('Unknown error', error);
                }


                // store.dispatch(updatePlaygroundLoadSuccess(id, sourceTransformed));
            }
        )
        ;
    }


    async appendHtml(state, html, css, js, alJs) {
        state.humanUnderstandableError = {
            type: AutoLogErrors.init,
            message: 'Could not download files from server. Please check your Internet access and refresh this page.'
        };
        if (!parsersLoaded) {
            await
                importLoaders();
            //post: parse5 and BabelSCR.transform ready
            parsersLoaded = true;
        }
        state.parsersLoaded = parsersLoaded;
        state.humanUnderstandableError = {
            type: AutoLogErrors.parse5,
            message: 'The HTML file contains errors.'
        };
        state.parsed = parse5.parse(html, {locationInfo: true});
        state.humanUnderstandableError.message = 'HTML Element not found.';
        const htmlElementChildNodes = state.parsed.childNodes.find(node => node.nodeName === 'html').childNodes;

        state.humanUnderstandableError.message = 'Head Element not found.';
        state.headTagLocation = htmlElementChildNodes.find(node => node.nodeName === 'head').__location;

        state.humanUnderstandableError.message = 'Body Element not found.';
        state.bodyTagLocation = htmlElementChildNodes.find(node => node.nodeName === 'body').__location;

        state.humanUnderstandableError.message = 'Head opening tag not found.';
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
            state.criticalError = state.transformed.error;
            state.transformed = BabelSCR.transform(js);
        }

        state.transformed.source = state.transformed.code;

        state.transformed.code = requireConfig.isDisabled ?
            state.transformed.code
            : `${requireConfig.requireOnLoadString}
                ${requireConfig.requireEnsureString}
                requirejs(${JSON.stringify(requireConfig.requireSync)}, function(){
                scrLoader.onRequireSyncLoaded(scrLoader.errors, scrLoader.fallbackOverrides);
                ${state.transformed.code}
                scrLoader.onUserScriptLoaded();
                });`;

        const cssString = `<style>${css}</style>`;

        state.humanUnderstandableError = null;

        state.getHTML = (config = requireConfig.config,
                         headTagLocation = defaultHeadTagLocation,
                         bodyTagLocation = defaultBodyTagLocation) => {
            const requireScriptsString = requireConfig.isDisabled ?
                '<-- NO REQUIRE-CONFIG -->' :
                `${requireConfig.requireString}
                <script>
                ${requireConfig.requireOnErrorString}
                requirejs.config(${JSON.stringify(config)});
                </script>`;
            if (!state.humanUnderstandableError) {
                return `${html.substring(0, headTagLocation.endTag.startOffset)}
                    ${SCRLoader.headScript}
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
