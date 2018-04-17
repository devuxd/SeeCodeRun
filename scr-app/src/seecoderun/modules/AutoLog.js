// import {TraceTypes, setAutoLogNames, toAst, wrapCallExpressions, wrapFunctionExpressions} from "../../utils/JsCodeShiftUtils";
import AutoLogShift from './AutoLogShift';
// import AutoLogShift from 'jscodetracker';
import Trace from './Trace';
import {
    updatePlaygroundLoadFailure,
    updatePlaygroundLoadSuccess
} from "../../redux/modules/playground";

const defaultRequireString =
    `<script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.5/require.js"></script>`;

export const jsDelivrResolver = (depName) => {
    switch (depName) {
        case 'react':
            return `https://cdn.jsdelivr.net/npm/react@16.3.1/umd/react.development.js`;
        case 'react-dom':
            return `https://cdn.jsdelivr.net/npm/react-dom@16.3.1/umd/react-dom.development.js`;
        default:
            return `https://cdn.jsdelivr.net/npm/${depName}@latest`; //todo find version obtained
    }
};
export const doJsDelivrFallbackPathsOrPassBy = (name, url) => {
    let fUrl = url;
    if (!url.endsWith('?')) { // validate other cdns?
        fUrl = `${url}?`;
    }
    if (url.includes('//cdn.jsdelivr.net/')) {
        const matches = url.match(new RegExp(`${name}[^\/]*`));
        let vName = name;
        if (matches.length) {
            vName = matches[0];
        }

        fUrl = [`https://cdn.jsdelivr.net/npm/${vName}/umd/${name}.development.js?`, fUrl];
    }
    return fUrl;
};
export const requireConfig = {
    cdnResolver: jsDelivrResolver,
    requireString: defaultRequireString,
    dependencyOverrides: {},
    dependencies: {},
    asyncDependencies: {},
    requireSync: [],
    config: {
        appDir: ".",
        paths: {},
        shim: {
            //'bootstrap' : ['jquery']
        }
    },
    onDependenciesChange: null,
    on: false,
};

const configureDependencies=(deps)=>{
    const newDependencies = {};
    requireConfig.requireSync = [];
    Object.keys(deps.dependencies || {}).forEach(dep => {
        dep = dep.replace(/["' ]/g, '');
        if (!dep) {
            return;
        }
        // console.log(dep);
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
        requireConfig.config.paths[name] = doJsDelivrFallbackPathsOrPassBy(name, url);
    }
    // console.log('paths', requireConfig.config.paths);
};

requireConfig.configureDependencies= configureDependencies;

export const updateDeps = (deps) => {
    requireConfig.on = true;
    if (deps) {
        configureDependencies(deps);
        requireConfig.onDependenciesChange && requireConfig.onDependenciesChange();
    }
};

let parsersLoaded = false;
let babel = null;
let parse5 = null;
export const babelTransformer = {};
export const importLoaders = async () => {
    if (!parse5) {
        parse5 = await import('parse5');
    }
    if (!babel) {// lazy loading Babel to improve boot up
        const presetExcludes =
            ['flow', 'typescript', 'es2017', 'es2015', 'es2015-loose', 'stage-0', 'stage-1', 'stage-2', 'es2015-no-commonjs'];
        babel = await import('@babel/standalone');
        const options = {
            presets: //[],
                Object.keys(babel.availablePresets)
                    .filter(key => !presetExcludes.includes(key)),
            plugins: //[],
                Object.keys(babel.availablePlugins)
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
            modules: "commonjs",//false,//
        }]);
        // console.log('d', Object.keys(babel.availablePlugins));
        // options.plugins.push(
        // ["transform-runtime", {
        //     // "helpers": true,
        //     "polyfill": true,
        //    "regenerator": true,
        //   //  "moduleName": "babel-runtime"
        // }]);

        babelTransformer.transform = sourceCode => babel.transform(sourceCode, options);
    }
};

export const autoLogName = '_$l';
export const preAutoLogName = '_$i';
export const postAutoLogName = '_$o';

// setAutoLogNames(autoLogName, preAutoLogName, postAutoLogName);

export const appendCss = (doc, store, css) => {
    if (doc) {
        const style = doc.createElement("style");
        style.type = "text/css";
        style.innerHTML = css;
        style.onload = () => {
            store.dispatch(updatePlaygroundLoadSuccess('css', css));
        };
        style.onerror = e => {
            store.dispatch(updatePlaygroundLoadFailure('css', e)); // do happens?
        };
        doc.body.appendChild(style);
    }
};

const appendScript = (doc, script) => {
    const scriptEl = doc.createElement("script");
    // eslint-disable-next-line no-useless-escape
    scriptEl.type = 'text\/javascript';
    doc.body.appendChild(scriptEl);
    scriptEl.innerHTML = script;
};

const tryTransformScript = (source) => {
    try {
        return babelTransformer.transform(source);
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

    configureIframe(runIframe, store, autoLogger, html, css, js, alJs) {
        runIframe.sandbox =
            'allow-forms' +
            ' allow-popups' +
            ' allow-scripts' +
            ' allow-same-origin' +
            ' allow-modals';
        runIframe.style =
            'height: 100%;' +
            ' width: 100%;' +
            ' margin: 0;' +
            ' padding: 0;' +
            ' border: 0;';
        // runIframe.onerror= (e) => {
        //   console.log("error ifr", e);
        // };
        autoLogger && updateDeps(autoLogger.deps);

        const state = {};
        this.appendHtml(state, html, css, js, alJs).then(alHtml => {
            runIframe.addEventListener('load', () => {
                if (autoLogger && autoLogger.trace && runIframe.contentWindow) {

                    if (runIframe.contentWindow.scrLoader && runIframe.contentWindow.scrLoader.onScriptsLoaded) {
                        autoLogger.trace.configureWindow(runIframe, autoLogName, preAutoLogName, postAutoLogName);
                        if (runIframe.contentWindow.scrLoader.scriptsLoaded) {
                            console.log('appending', state.transformed.code, state.criticalError, state.transformed.error);
                            appendScript(runIframe.contentDocument, state.transformed.code);
                        } else {
                            runIframe.contentWindow.scrLoader.onScriptsLoaded = () => {
                                console.log('appending', state.transformed.code, state.criticalError, state.transformed.error);
                                appendScript(runIframe.contentDocument, state.transformed.code);
                            }
                        }
                    }
                } else {

                }
            });
            runIframe.srcdoc = alHtml;
        }).catch(error => {
            console.log('append html error', error);
            // store.dispatch(updatePlaygroundLoadSuccess(id, sourceTransformed));
        });
    }

    async appendHtml(state, html, css, js, alJs) {
        if (!parsersLoaded) {
            await importLoaders();
            //post: parse5 and babelTransformer.transform ready
            parsersLoaded = true;
        }
        state.parsersLoaded = parsersLoaded;
        state.parsed = parse5.parse(html, {locationInfo: true});
        state.headOpenTagLocation = state.parsed.childNodes.find(node => node.nodeName === 'html').childNodes.find(node => node.nodeName === 'head').__location;

        state.bodyOpenTagLocation = state.parsed.childNodes.find(node => node.nodeName === 'html').childNodes.find(node => node.nodeName === 'body').__location;
        state.bodyEndTagLocation = state.parsed.childNodes.find(node => node.nodeName === 'html').childNodes;
        state.transformed = tryTransformScript(alJs);
        if (state.transformed.error) {
            state.criticalError = state.transformed.error;
            state.transformed = babelTransformer.transform(js);
        }

        state.transformed.source = state.transformed.code;

        state.transformed.code = `require(${JSON.stringify(requireConfig.requireSync)}, function(){
                ${state.transformed.code}
            });`;

        //const headDependenciesString = dependencies.filter(dep => dep.isHead).reduce((a, c) => `${a}${c.toHTMLScript()}`, '');
        // const bodyDependenciesString = dependencies.filter(dep => !dep.isHead).reduce((a, c) => `${a}${c.toHTMLScript()}`, '');

        const cssString = `<style>${css}</style>`;

        // if (state.bodyOpenTagLocation) {
        //     html = `${html.substring(0, state.headOpenTagLocation.startTag.endOffset)}
        //     <script>window.scrLoader={scriptsLoaded:false, onScriptsLoaded:function(){}, DOMLoaded:false}</script>
        //     ${html.substring(state.headOpenTagLocation.startTag.endOffset, state.bodyOpenTagLocation.startTag.endOffset)}
        //     ${cssString}
        //     ${bodyDependenciesString}
        //      <script>window.scrLoader.scriptsLoaded=true; window.scrLoader.onScriptsLoaded()</script>
        //     ${html.substring(state.bodyOpenTagLocation.startTag.endOffset, html.length)}`;
        // }
        const requireString = !requireConfig ? '<-- NO REQUIRE-CONFIG -->' :
            `${requireConfig.requireString}<script>require.config(${JSON.stringify(requireConfig.config)});</script>`;
        //            ${bodyDependenciesString}
        //todo missing tag errors
        if (state.bodyOpenTagLocation) {
            html = `${html.substring(0, state.headOpenTagLocation.endTag.startOffset)}
            <script>window.scrLoader={scriptsLoaded:false, onScriptsLoaded:function(){}, DOMLoaded:false}</script>
            ${html.substring(state.headOpenTagLocation.endTag.startOffset, state.bodyOpenTagLocation.startTag.endOffset)}
             ${cssString}
            ${html.substring(state.bodyOpenTagLocation.startTag.endOffset, state.bodyOpenTagLocation.endTag.startOffset)}
            ${requireString}
             <script>window.scrLoader.scriptsLoaded=true; window.scrLoader.onScriptsLoaded()</script>
            ${html.substring(state.bodyOpenTagLocation.endTag.startOffset, html.length)}`;
        }
        // console.log(html);
        return html;
    }
}

export default AutoLog;
