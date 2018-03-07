// import {TraceTypes, setAutoLogNames, toAst, wrapCallExpressions, wrapFunctionExpressions} from "../../utils/JsCodeShiftUtils";
import AutoLogShift from './AutoLogShift';
import Trace from './Trace';
import * as Babel from "babel-standalone";
import {
  updatePlaygroundLoadFailure,
  updatePlaygroundLoadSuccess
} from "../../redux/modules/playground";

export const autoLogName='_$l';
export const preAutoLogName='_$i';
export const postAutoLogName='_$o';

// setAutoLogNames(autoLogName, preAutoLogName, postAutoLogName);

class AutoLog {
  constructor() {
    this.autoLogShift=new AutoLogShift(autoLogName, preAutoLogName, postAutoLogName);
  }
  
  toAst(text){
    const locationMap=[];
    const ast= this.autoLogShift.autoLogSource(text, locationMap);
    return {
      source: text,
      ast: ast,
      locationMap: locationMap,
    };
  }
  
  transform(ast) {
    return{
      ...ast,
      trace: new Trace(ast.locationMap),
      code: ast.ast.toSource()
    };
  }
  
  configureIframe(runIframe, store, al, html, css, js, alJs) {
    runIframe.sandbox=
      'allow-forms' +
      ' allow-popups' +
      ' allow-scripts' +
      ' allow-same-origin' +
      ' allow-modals';
    runIframe.style=
      'height: 100%;' +
      ' width: 100%;' +
      ' margin: 0;' +
      ' padding: 0;' +
      ' border: 0;';
    
    runIframe.addEventListener('error', (e) => {
      console.log("error ifr", e);
    });
    
    runIframe.addEventListener('load', () => {
      if(al && al.trace){
        al.trace.startStack();
        runIframe.contentWindow[autoLogName]=al.trace.autoLog;
        runIframe.contentWindow[preAutoLogName]=al.trace.preAutoLog;
        runIframe.contentWindow[postAutoLogName]=al.trace.postAutoLog;
  
        const log=runIframe.contentWindow.console.log;
        runIframe.contentWindow.console.log=function (type, info={}, params=[]) {
          if (type === 'SCR_LOG' && info.location) {
            // store.dispatch();
          } else {
            log(["c", ...arguments]);
          }
    
        };
      }
      
      
      if (runIframe.contentDocument) {
        const doc=runIframe.contentDocument;
        
        // Not rigth this
        // let prev=this.cssElement;
        // if (prev) {
        //   prev.remove();
        // }
        // prev=this.jsElement;
        // if (prev) {
        //   prev.remove();
        // }
        const style=doc.createElement("style");
        style.type="text/css";
        style.innerHTML=css;
        
        doc.body.appendChild(style);
        // console.log("ddddddddd");
        // this.cssElement=style;
        
        
        const script=doc.createElement("script");
        // this.jsElement=script;
        try {
          script.innerHTML=Babel.transform(alJs, {
            presets: ['es2017', 'react'],
            plugins: ['transform-object-rest-spread', 'transform-class-properties']
          }).code;
          
          script.onload = ()=>{
            store.dispatch(updatePlaygroundLoadSuccess('js'));
          };
          
          script.onerror = e=>{
            store.dispatch(updatePlaygroundLoadFailure('js', e));
          };
          doc.body.appendChild(script);
          
        } catch (e) {
          //console.log("e", e);
  
          store.dispatch(updatePlaygroundLoadFailure('js', e));
          //store.dispatch
          script.innerHTML=js;
          doc.body.appendChild(script);
        }
        
      }
      
    });
    runIframe.srcdoc=html;
  }
  
  getReplaceScript() {
    let id=window.setTimeout(function () {
    }, 0);
    
    while (id--) {
      window.clearTimeout(id); // will do nothing if no timeout with id is present
    }
    
  }
}

export default AutoLog;
