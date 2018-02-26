import {
  configureFirecoInit,
  configureFirecoWorker,
} from './redux/modules/fireco';
import firebase  from 'firebase';
// configures Monaco and the Firebase/Firepad WebWorker, requires window,
// document, and window.Worker. It adds MS's custom AMD load
// window.require, and Monaco as  window.monaco.

firebase.initializeApp({
  apiKey: "AIzaSyBmm0n6NgjksFjrM6D5cDX7_zw-QH9xwiI",
  authDomain: "seecoderun.firebaseapp.com",
  databaseURL: "https://seecoderun.firebaseio.com",
  projectId: "firebase-seecoderun",
  storageBucket: "firebase-seecoderun.appspot.com",
  messagingSenderId: "147785767581"
});
const fireco={
  publicURL: window.scrPublicURL,// set in index.html's head
  firecoPath: '/fireco', // path within web page's root to the fireco folder
  isCdnOk: true,
  monacoPath: window.location.host === 'seecode.run' ? 'min' : 'dev',
  monacoUrl: null,
  monacoBuild: '0.10.1',
  firecoWorker: null,
};

const errorTypeMessages={
  'UNCAUGHT': 'Some files were not loaded, please check your internet connection.',
  'WEB_WORKER': 'Browser is not compatible with seeCode.Run, it requires web workers.',
  'MONACO_LOAD_LOCAL_SCRIPT': 'Some files were not loaded, please check your internet connection.',
};

const getError=(errorType, details=null) => {
  return {
    cause: errorType,
    message: errorTypeMessages[errorType],
    details: details
  };
};

const importScript=(sSrc, onloadFunc, onerrorFunc) => {
  const oScript=document.createElement('script');
  oScript.type='text/javascript';
  if (onloadFunc) {
    oScript.onload=onloadFunc;
  }
  if (onerrorFunc) {
    oScript.onerror=onerrorFunc;
  }
  document.currentScript.parentNode.insertBefore(oScript, document.currentScript);
  oScript.src=sSrc;
};

const loadMonaco=(onMonacoLoaded, scr=fireco) => {
  //window.require is MS/monaco's custom AMD loader
  window.require.config({paths: {'vs': scr.monacoUrl}});
  window.require(['vs/editor/editor.main'], onMonacoLoaded);
};

const initFirecoWebWorker=(onFirecoWebWorkerMessage, onFirecoError,  scr = fireco) => {// sync
  // worker
  // for the monaco editor
  if (window.Worker) {
    scr.firecoWorker=new window.Worker(`${scr.publicURL + scr.firecoPath}/firecoWebWorker.js`);
    scr.firecoWorker.onmessage=e => {
      const payload = e.data;
      if(!e || !payload || !payload.type){
        onFirecoError('Message is' +
          ' not an valid action.');
      }else{
        onFirecoWebWorkerMessage(payload);
      }
    };
    scr.firecoWorker.onerror=error => onFirecoError(error);
    onFirecoWebWorkerMessage(configureFirecoInit(scr));
    scr.firecoWorker.postMessage(configureFirecoWorker(
      `${scr.publicURL + scr.firecoPath}/firepad.js`
      // optional:
      // importScripts,
      // firebaseConfig
    ));
  } else {
    onFirecoError(getError('WEB_WORKER'));
  }
};

const initMonacoLoader=(onMonacoLoaded, onFirecoError, scr = fireco) => { // uses window.scr defined in
  // head
  scr.isCdnOk= !!window.require; // can be loaded from CDN. Not enabled,
  // see index.html.
  if (scr.isCdnOk) { // loading monaco from CDN
    // Before loading vs/editor/editor.main, define a global MonacoEnvironment that overwrites
    // the default worker url location (used when creating WebWorkers). The problem here is that
    // HTML5 does not allow cross-domain web workers, so we need to proxy the instantiation of
    // a web worker through a same-domain script
    window.MonacoEnvironment={
      getWorkerUrl: function (/* workerId, label */) {
        if (scr.monacoPath === 'min') {
          return `${scr.firecoPath}/monaco-editor-worker-loader-proxy.js`;
        } else {
          return `${scr.firecoPath}/monaco-editor-worker-loader-proxy.dev.js`;
        }
      }
    };
    scr.monacoUrl=`https://cdn.jsdelivr.net/npm/monaco-editor@${scr.monacoBuild}/${scr.monacoPath}/vs`;
    return loadMonaco(onMonacoLoaded);
  } else {// loading monaco locally
    scr.monacoUrl=`${scr.publicURL + scr.firecoPath}/monaco-editor/${scr.monacoPath}/vs`;
    importScript(`${scr.monacoUrl}/loader.js`
      , () => loadMonaco(onMonacoLoaded)
      , error => {
        onFirecoError(getError('MONACO_LOAD_LOCAL_SCRIPT', error));
      });
  }
  
  return true;
};

const configureFireco=(onMonacoLoaded, onFirecoWebWorkerMessage, onFirecoError) => {
  // try {
    initMonacoLoader(onMonacoLoaded, onFirecoError);
    initFirecoWebWorker(onFirecoWebWorkerMessage, onFirecoError);
  // } catch (e) {
  //   onFirecoError(getError('UNCAUGHT', e));
  // }
};

export default configureFireco;
