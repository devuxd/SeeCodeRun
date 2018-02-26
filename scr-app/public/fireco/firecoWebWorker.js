/* eslint-env webWorker */
// actions are the same in fireco.js
const MESSAGE_REJECTED='MESSAGE_REJECTED';

const CONFIGURE_FIRECO_WEB_WORKER='CONFIGURE_FIRECO_WEB_WORKER';
const CONFIGURE_FIRECO_WEB_WORKER_FULFILLED='CONFIGURE_FIRECO_WEB_WORKER_FULFILLED';
const CONFIGURE_FIRECO_WEB_WORKER_REJECTED='CONFIGURE_FIRECO_WEB_WORKER_REJECTED';

const ACTIVATE_FIREPAD='ACTIVATE_FIREPAD';
const ACTIVATE_FIREPAD_FULFILLED='ACTIVATE_FIREPAD_FULFILLED';
const ACTIVATE_FIREPAD_EXPIRED='ACTIVATE_FIREPAD_EXPIRED';
const ACTIVATE_FIREPAD_REJECTED='ACTIVATE_FIREPAD_REJECTED';

const FIRECO_SET_TEXT='FIRECO_SET_TEXT';
const FIRECO_SET_TEXT_FULFILLED='FIRECO_SET_TEXT_FULFILLED';
const FIRECO_SET_TEXT_REJECTED='FIRECO_SET_TEXT_REJECTED';

const FIRECO_TEXT_UPDATES='FIRECO_TEXT_UPDATES';
const FIRECO_TEXT_UPDATES_FULFILLED='FIRECO_TEXT_UPDATES_FULFILLED';
const FIRECO_TEXT_UPDATES_REJECTED='FIRECO_TEXT_UPDATES_REJECTED';
const FIRECO_TEXT_UPDATES_RECEIVED='FIRECO_TEXT_UPDATES_RECEIVED';

const DISPOSE_FIRECO='DISPOSE_FIRECO';
//end actions

const defaultImportScripts=[
  'https://www.gstatic.com/firebasejs/4.6.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/4.6.2/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/4.6.2/firebase-database.js',
  '/firepad.js'
];
// const defaultImportScripts=[
//   'https://www.gstatic.com/firebasejs/3.3.0/firebase-app.js',
//   'https://www.gstatic.com/firebasejs/3.3.0/firebase-auth.js',
//   'https://www.gstatic.com/firebasejs/3.3.0/firebase-database.js'
// ];

const defaultFirepadURL='firepad.js';

const defaultFirebaseConfig={
  apiKey: "AIzaSyBmm0n6NgjksFjrM6D5cDX7_zw-QH9xwiI",
  authDomain: "seecoderun.firebaseapp.com",
  databaseURL: "https://seecoderun.firebaseio.com",
  projectId: "firebase-seecoderun",
  storageBucket: "firebase-seecoderun.appspot.com",
  messagingSenderId: "147785767581"
};

const firecos={};
let firepadPaths = null;
let isFirecoWebWorkerReady=false;
let unsubscribeOnIdTokenChanged=null;
let isFirecoWebWorkerAuth=false;
let isFirecoWebWorkerAuthPosted=false;
let mutex=false;
let timeout=null;

onmessage=function (e) {
  if (!e.data) {
    postMessage({
      type: MESSAGE_REJECTED,
      editorId: null,
      error: 'No data was provided.',
    });
    return;
  }
  
  const payload=e.data;
  switch (payload.type) {
    case CONFIGURE_FIRECO_WEB_WORKER:
      configureFirecoWebWorker(payload.importScripts, payload.firebaseConfig, payload.firepadURL);
      break;
    case ACTIVATE_FIREPAD:
      if (isFirecoWebWorkerReady) {
        activateFirepads(payload.pastebinToken, payload.firepadPaths);
      } else {
        postMessage({
          type: ACTIVATE_FIREPAD_REJECTED, error: 'FirecoObservable must be configured' +
          ' first'
        });
      }
      break;
    case FIRECO_TEXT_UPDATES:
      if (isFirecoWebWorkerAuth) {
        textUpdates(
          payload.editorId,
          payload.firebasePath,
        );
      } else {
        postMessage({
          type: FIRECO_TEXT_UPDATES_REJECTED,
          editorId: null,
          error: 'The workers has not been configured or authenticated.' +
          'Listen to the "ACTIVATE_FIREPAD_FULFILLED" event.',
        });
      }
      break;
    case FIRECO_SET_TEXT:
      if (isFirecoWebWorkerAuth) {
        setText(
          payload.editorId,
          payload.text,
        );
      } else {
        postMessage({
          type: FIRECO_SET_TEXT_REJECTED,
          editorId: null,
          error: 'The workers has not been configured or authenticated.' +
          'Listen to the "ACTIVATE_FIREPAD_FULFILLED" event.',
        });
      }
      break;
    case DISPOSE_FIRECO:
      disposeFireco();
      break;
    default:
      postMessage({
        type: MESSAGE_REJECTED,
        editorId: null,
        error: 'Message type is not recognized.',
      });
  }
};

/**
 * Initializes configuration of the web worker.
 * @param {Array} scripts - Array with the required imports.
 * @param {Array} config - Firebase init config.
 * @param {String} firepadURL - Firepad URL required for importing it.
 */
function configureFirecoWebWorker(scripts=defaultImportScripts, config=defaultFirebaseConfig, firepadURL=defaultFirepadURL) {
  try {
    importScripts(...scripts);
    firebase.initializeApp(config);
    isFirecoWebWorkerReady=true;
    postMessage({type: CONFIGURE_FIRECO_WEB_WORKER_FULFILLED});
  } catch (e) {
    console.log(e);
    postMessage({type: CONFIGURE_FIRECO_WEB_WORKER_REJECTED, error: !!e});
  }
}

// const p =myAsyncFunction('https://us-central1-firebase-seecoderun.cloudfunctions.net/getPastebin?session=yes&pastebinId=-L029pzcgsjXQBdkWXDC');
//
// const p2 =myAsyncFunction('https://us-central1-firebase-seecoderun.cloudfunctions.net/getPastebin?');
// function myAsyncFunction(url) {
//   return new Promise((resolve, reject) => {
//     const xhr = new XMLHttpRequest();
//     xhr.open("GET", url);
//     xhr.onload = () => resolve(xhr.responseText);
//     xhr.onerror = () => reject(xhr.statusText);
//     xhr.send();
//   });
// }
//
// p.then(function(){
//   console.log(arguments);
// });
// p2.then(function(){
//   console.log('2', arguments);
// });

function handleAuthFulfilled(authUser) {
  isFirecoWebWorkerAuth=true;
  if (!isFirecoWebWorkerAuthPosted) {
    
    postMessage({
      type: ACTIVATE_FIREPAD_FULFILLED,
      hasAuthUser: !!authUser
    });
    isFirecoWebWorkerAuthPosted=true;
  }
  configureFirepads();
}

function handleAuthRejected(error) {
  isFirecoWebWorkerAuth=false;
  isFirecoWebWorkerAuthPosted=false;
  postMessage({// auth error: invalid/expired token
    type: error.code === 'auth/invalid-credential' ? ACTIVATE_FIREPAD_EXPIRED : ACTIVATE_FIREPAD_REJECTED,
    error: error
  });
}


function activateFirepads(pastebinToken, newFirepadPaths) {
  firepadPaths = newFirepadPaths;
  unsubscribeOnIdTokenChanged=firebase.auth().onIdTokenChanged(
    user => {
      if (user) {
        handleAuthFulfilled(user);
      } else {
        // ignore non-token events
      }
    },
    error => {
      handleAuthRejected(error);
    }
  );
  
  firebase.auth().signInWithCustomToken(pastebinToken)
    .then(user => {
      handleAuthFulfilled(user);
      }
    )
    .catch(error => {
      handleAuthRejected(error);
      }
    );
}

function configureFirepads(){
  for(let editorId in firepadPaths){
    if(firepadPaths.hasOwnProperty(editorId)){
     // console.log(editorId, firepadPaths[editorId]);
      configureFirepad(editorId, firepadPaths[editorId]);
    }
  }
}


function configureFirepad(editorId, firebasePath) {
  //if (!firecos[editorId]) {
    firecos[editorId]={firebaseRef: firebase.database().ref(firebasePath).ref};
   console.log(firecos[editorId].firebaseRef.child("lastVisit").set(Date.now()));
    firecos[editorId].headless=new Firepad.Headless(firecos[editorId].firebaseRef);
  //}
}

function disposeFireco() {
  for (const editorId in this.firecos) {
    if (this.firecos[editorId].headless) {
      this.firecos[editorId].headless.dispose();
    }
  }
  
  if (unsubscribeOnIdTokenChanged) {
    unsubscribeOnIdTokenChanged();
  }
}


function textUpdates(editorId) {// editorId ==
  try{
    firecos[editorId].isGetTextListening=true;
    firecos[editorId].firebaseRef.on('value', () => {
      firecos[editorId].headless.getText(function (text) {
        if (!mutex) {
          postMessage({
            type: FIRECO_TEXT_UPDATES_RECEIVED,
            editorId: editorId,
            text: text
          });
        } else {
          console.log("MUTEX READ")
        }
      });
    });
    postMessage({
      type: FIRECO_TEXT_UPDATES_FULFILLED,
      editorId: editorId,
    });
  }catch(e){
    postMessage({
      type: FIRECO_TEXT_UPDATES_REJECTED,
      editorId: editorId,
      error: e
    });
  }
  
}
//each fireco has mutex
function setText(editorId, text) { // text, editorId == DEFAULT_FIRECO
  let retries=50;
  firepadSetText();
  
  function firepadSetText() {
    if (mutex) {// {ignore: 'Still writing'};
      if (retries--) {
        clearTimeout(timeout);
        timeout=setTimeout(firepadSetText, 100);
      } else {
        console.log("W NOPE");
        postMessage({
          type: FIRECO_SET_TEXT_REJECTED,
          editorId: editorId,
          error: 'Auth or write mutex timeout.'
        });
      }
      return;
    }
    // mutex=true;
    //console.log("MUTEX ON", text||'nothing', firecos[editorId].headless);
    firecos[editorId].headless.setText(text||"blah", function (err, committed) {
      mutex=false;
      console.log("MUTEX OFF");
      // *err*       will be set if there was a catastrophic failure
      // *committed* will be true on success, or false if there was a history
      //               conflict writing to the pad's history.
      postMessage({
        type: (err || !committed) ? FIRECO_SET_TEXT_REJECTED : FIRECO_SET_TEXT_FULFILLED,
        editorId: editorId,
        error: err,
        committed: committed
      });
    });
    // firecos[editorId].headless.setText("hello", function(){
    //   console.log("tttt",arguments);
    // });
    //
    // console.log("MUTEX O   N", text||'nothing');
  }
}

