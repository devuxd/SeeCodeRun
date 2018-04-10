// import {TraceTypes, setAutoLogNames, toAst, wrapCallExpressions, wrapFunctionExpressions} from "../../utils/JsCodeShiftUtils";
import AutoLogShift from './AutoLogShift';
// import AutoLogShift from 'jscodetracker';
import Trace from './Trace';
import {
    updatePlaygroundLoadFailure,
    updatePlaygroundLoadSuccess
} from "../../redux/modules/playground";

let babel = null;
export const babelTransformer = {};
export const babelTransform = async () => {
    if (!babel) {// lazy loading Babel to improve boot up
        const presetExcludes =
            ['flow', 'typescript', 'es2015', 'es2015-loose', 'stage-0', 'stage-1', 'stage-2', 'es2015-no-commonjs'];
        babel = await import('@babel/standalone');
        const options = {
            presets: Object.keys(babel.availablePresets)
                .filter(key => !presetExcludes.includes(key)),
            plugins: Object.keys(babel.availablePlugins)
                .filter(key => !(
                    key.includes('-flow')
                    || key.includes('-typescript')
                    || key.includes('-strict-mode')
                    || key.includes('-modules')
                    || key.includes('external-helpers')
                    || key.includes('transform-runtime')
                )),
        };

        options.presets.push(["es2015", {
            modules: false,
        }]);

        babelTransformer.transform = sourceCode => babel.transform(sourceCode, options);
    }
};

export const autoLogName = '_$l';
export const preAutoLogName = '_$i';
export const postAutoLogName = '_$o';

// setAutoLogNames(autoLogName, preAutoLogName, postAutoLogName);

export const addCssAnJs = (doc, store, css, js, alJs) => {
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

        babelTransform().then(() => tryAppendScript(store, doc, js, alJs));
    }
};

const tryAppendScript = (store, doc, js, alJs, isJs) => {
    const id = isJs ? 'js' : 'alJs';
    const source = isJs ? js : alJs;
    try {
        const sourceTransformed = babelTransformer.transform(source).code;
        // console.log('BC', id, sourceTransformed);
        const script = doc.createElement("script");
        // eslint-disable-next-line no-useless-escape
        script.type = 'text\/javascript';

        doc.body.appendChild(script);
        script.innerHTML = sourceTransformed;
        store.dispatch(updatePlaygroundLoadSuccess(id, sourceTransformed));
    } catch (e) {
        store.dispatch(updatePlaygroundLoadFailure(id, e));
        !isJs && tryAppendScript(store, doc, js, alJs, true);
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
        const locationMap = {};
        this.autoLogShift.autoLogAst(ast, locationMap, getLocationId);
        const code = ast.toSource();
        // console.log(code);
        return {
            locationMap: locationMap,
            trace: new Trace(locationMap),
            code: code
        };
    }

    transform(ast) {
        return {
            ...ast,
            trace: new Trace(ast.locationMap),
            code: ast.ast.toSource()
        };
    }

    configureIframe(runIframe, store, al, html, css, js, alJs) {
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


        runIframe.addEventListener('load', () => {
            if (al && al.trace && runIframe.contentWindow) {
                al.trace.configureWindow(runIframe, autoLogName, preAutoLogName, postAutoLogName);
                addCssAnJs(runIframe.contentDocument, store, css, js, alJs);
            } else {

            }

        });
        runIframe.srcdoc = html;
    }
}

export default AutoLog;
