importScripts(
  'https://www.gstatic.com/firebasejs/4.6.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/4.6.2/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/4.6.2/firebase-database.js',
  'firepad.js'
);

const SERVER_TIMESTAMP = firebase.database.ServerValue.TIMESTAMP;
const dataBaseRoot = '/scr2';
const config = {
  apiKey: "AIzaSyBmm0n6NgjksFjrM6D5cDX7_zw-QH9xwiI",
  authDomain: "seecoderun.firebaseapp.com",
  databaseURL: "https://seecoderun.firebaseio.com",
  projectId: "firebase-seecoderun",
  storageBucket: "firebase-seecoderun.appspot.com",
  messagingSenderId: "147785767581"
};

firebase.initializeApp(config);

const firecos = {};

function configureFireco(editorId, firebasePath) {
  if (!firecos[editorId]) {
    firecos[editorId] = {firebaseRef: firebase.database().ref(firebasePath)};
    firecos[editorId].headless = new Firepad.Headless(firecos[editorId].firebaseRef);
  }
}

const SET_TEXT = 'SET_TEXT';
const GET_TEXT = 'GET_TEXT';
let mutex = false;
let isAuth = false; //todo receive token validation update
let timeout = null;

function getText(editorId, firebasePath, pastebinToken) {
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
      setTimeout(firepadGetText, 250);
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
    // catch(error =>{
    //   firecos[editorId].isGetTextListening = false;
    //   postMessage({type: 'FIRECO_GET_TEXT_REJECTED', editorId: editorId, error: error});
    // } );
  }
}

function setText(editorId, firebasePath, text, pastebinToken) {
  if (mutex) {
    return;// {ignore: 'Still writing'};
  }
  if (!isAuth) {
    firebase.auth().signInWithCustomToken(pastebinToken);
    isAuth = true;
  }
  clearTimeout(timeout);
  if (!firebase.auth().currentUser) {
    setTimeout(firepadSetText, 1000);
    return;//{ignore: 'waiting auth'};
  }
  setTimeout(firepadSetText, 100);

  function firepadSetText() {
    if (mutex) {
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

  return {scheduled: 'true'};
}

onmessage = function (e) {
  const payload = e.data;
  switch (payload.type) {
    //todo dispose firepads
    case GET_TEXT:
      getText(payload.editorId, payload.firebasePath, payload.pastebinToken);
      break;
    case SET_TEXT:
      setText(payload.editorId, payload.firebasePath, payload.text, payload.pastebinToken);
      break;
    default:
      postMessage({type: 'ACTION_REJECTED', editorId: null, error: 'No message type was provided.'});
  }
};
