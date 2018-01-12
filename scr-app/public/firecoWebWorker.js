const MESSAGE_REJECTED = 'MESSAGE_REJECTED';
const CONFIGURE = 'CONFIGURE';
const CONFIGURE_FULFILLED = 'CONFIGURE_FULFILLED';
const SET_TEXT = 'SET_TEXT';
const GET_TEXT = 'GET_TEXT';

let mutex = false;
let isAuth = false; //todo receive token validation update
let timeout = null;

onmessage = function (e) {
  if(!e.data){
    postMessage({type: MESSAGE_REJECTED, editorId: null, error: 'No data was provided.'});
  }

  const payload = e.data;
    switch (payload.type) {
      case CONFIGURE:
        configureFirecoWebWorker(payload.importScripts, payload.firebaseConfig);
        break;
      case GET_TEXT:
        getText(payload.editorId, payload.firebasePath, payload.pastebinToken);
        break;
      case SET_TEXT:
        setText(payload.editorId, payload.firebasePath, payload.text, payload.pastebinToken);
        break;
      default:
        postMessage({type: MESSAGE_REJECTED, editorId: null, error: 'Message type is not recognized.'});
    }
};

function configureFirecoWebWorker(scripts, config){
  // console.log(arguments);
  importScripts(...scripts);
  firebase.initializeApp(config);
  isFirecoWebWorkerReady = true;
  postMessage({type: CONFIGURE_FULFILLED});
}

let isFirecoWebWorkerReady = false;
const firecos = {};

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

function configureFireco(editorId, firebasePath) {
  if (!firecos[editorId]) {
    firecos[editorId] = {firebaseRef: firebase.database().ref(firebasePath)};
    firecos[editorId].headless = new Firepad.Headless(firecos[editorId].firebaseRef);
  }
}

// function disposeFirecos(){
//   for (const editorId in this.firecos) {
//     if (this.firecos[editorId].headless) {
//       this.firecos[editorId].headless.dispose();
//     }
//   }
// }


function getText(editorId, firebasePath, pastebinToken) {//editorId == DEFAULT_FIRECO
  let retries =30;
  if (firecos[editorId] && firecos[editorId].isGetTextListening) {
    postMessage({type: 'FIRECO_GET_TEXT_REJECTED', editorId: editorId, error: 'Listener is already active.'});
    return;
  }
  if (!isAuth) {
    firebase.auth().signInWithCustomToken(pastebinToken);
    isAuth = true;
  }
  clearTimeout(timeout);
  if (!firebase.auth().currentUser) {
    setTimeout(firepadGetText, 500);
    return;// {ignore: 'waiting auth'};
  }
  firepadGetText();

  function firepadGetText() {
    if (!firebase.auth().currentUser) {
      if(retries--){
        setTimeout(firepadGetText, 250);
      }else{
        postMessage({type: 'FIRECO_GET_TEXT_REJECTED', editorId: editorId, error: 'Auth timeout.'});
      }
      return;// {ignore: 'waiting auth'};
    }

    configureFireco(editorId, firebasePath);
    firecos[editorId].isGetTextListening = true;
    firecos[editorId].firebaseRef.on('value', () => {
      firecos[editorId].headless.getText(function (text) {
        if (!mutex) {
          postMessage({type: 'FIRECO_GET_TEXT_FULFILLED', editorId: editorId, text: text});
        }
      });
    });
  }
}

function setText(editorId, firebasePath, text, pastebinToken) { // text, editorId == DEFAULT_FIRECO
  let retries =50;
  if (mutex) {
    return;// {ignore: 'Still writing'};
  }
  if (!isAuth) {
    firebase.auth().signInWithCustomToken(pastebinToken);
    isAuth = true;
  }

  firepadSetText();

  function firepadSetText() {
    if (mutex || !firebase.auth().currentUser) {
      if(retries--){
        clearTimeout(timeout);
        timeout =setTimeout(firepadSetText, 100);
      }else{
        postMessage({type: 'FIRECO_SET_TEXT_REJECTED', editorId: editorId, error: 'Auth or write mutex timeout.'});
      }
      return;// {ignore: 'Still writing'};
    }
    configureFireco(editorId, firebasePath);
    mutex = true;
    firecos[editorId].headless.setText(text, function (err, committed) {
      mutex = false;
      // *err*       will be set if there was a catastrophic failure
      // *committed* will be true on success, or false if there was a history
      //               conflict writing to the pad's history.
      postMessage({type: 'FIRECO_SET_TEXT_FULFILLED', editorId: editorId, error: err, committed: committed});
    });
  }
}

