// import {TraceTypes, setAutoLogNames, toAst, wrapCallExpressions, wrapFunctionExpressions} from "../../utils/JsCodeShiftUtils";
import AutoLogShift from './AutoLogShift';
import Trace from './Trace';
import * as Babel from "babel-standalone";
import {
  updatePlaygroundLoadFailure,
  updatePlaygroundLoadSuccess
} from "../../redux/modules/playground";

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
      store.dispatch(updatePlaygroundLoadFailure('ccs', e)); // do happens?
    };
    doc.body.appendChild(style);

    const script = doc.createElement("script");
    try {
      script.innerHTML = Babel.transform(alJs, {
        presets: ['es2017', 'react'],
        plugins: ['transform-object-rest-spread', 'transform-class-properties']
      }).code;

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
  }
};

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

  transformWithLocationIds(ast, getLocationId){
    const locationMap = {};
    this.autoLogShift.autoLogAst(ast, locationMap,getLocationId);
    return {
      locationMap: locationMap,
      trace: new Trace(locationMap),
      code: ast.toSource()
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
