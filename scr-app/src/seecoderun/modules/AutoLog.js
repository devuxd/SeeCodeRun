// import {TraceTypes, setAutoLogNames, toAst, wrapCallExpressions, wrapFunctionExpressions} from "../../utils/JsCodeShiftUtils";
import AutoLogShift from './AutoLogShift';
// import AutoLogShift from 'jscodetracker';
import Trace from './Trace';
import {
    updatePlaygroundLoadFailure,
    updatePlaygroundLoadSuccess
} from "../../redux/modules/playground";

let Babel = null;
export const babelTransform = async (source, tryAppendScript) => {
    if (!Babel) {// lazy loading Babel to improve boot up
        Babel = await import('@babel/standalone');
        Babel.registerPlugin('transform-class-properties', await import('babel-plugin-transform-class-properties'));
        Babel.registerPlugin('transform-object-rest-spread', await import('babel-plugin-transform-object-rest-spread'));
    }

    const alJsCode = Babel.transform(source, {
        presets: ['es2015', 'es2016', 'es2017', 'react'],
        plugins: ['transform-object-rest-spread', 'transform-class-properties']
    }).code;
    tryAppendScript(alJsCode);
};

export const autoLogName = '_$l';
export const preAutoLogName = '_$i';
export const postAutoLogName = '_$o';

// setAutoLogNames(autoLogName, preAutoLogName, postAutoLogName);

export const addCssAnJs = (doc, store, alJs, css) => {
    if (doc) {
        const style = doc.createElement("style");
        style.type = "text/css";
        style.innerHTML = css;
        style.onload = () => {
            store.dispatch(updatePlaygroundLoadSuccess('css'));
        };
        style.onerror = e => {
            store.dispatch(updatePlaygroundLoadFailure('css', e)); // do happens?
        };
        doc.body.appendChild(style);

        const script = doc.createElement("script");
        babelTransform(alJs, tryAppendScript(store, doc, script));

    }
};

const tryAppendScript = (store, doc, script) => ((alJsCode) => {
    try {
        script.innerHTML = alJsCode;
        script.onload = () => {
            store.dispatch(updatePlaygroundLoadSuccess('js'));
        };

        script.onerror = e => {
            store.dispatch(updatePlaygroundLoadFailure('js', e));
        };
        doc.body.appendChild(script);
    } catch (e) {
        store.dispatch(updatePlaygroundLoadFailure('js', e));
        // script.innerHTML=js;
        // doc.body.appendChild(script);
    }
});

class AutoLog {
    constructor() {
        this.autoLogShift = new AutoLogShift(autoLogName, preAutoLogName, postAutoLogName);
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
        console.log(code);
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
                addCssAnJs(runIframe.contentDocument, store, alJs, css);
            } else {

            }

        });
        runIframe.srcdoc = html;
    }
}

export default AutoLog;
