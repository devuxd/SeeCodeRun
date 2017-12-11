const functions = require('firebase-functions');
global.window = {}; // fixes firepad 1.4.0 infamous line with window.firebase in Node.
const Firepad = require('firepad');
const admin = require('firebase-admin');
const serviceAccount = require("./serviceAccountKey.json");
const getDefaultTextForLanguage = require('./pastebinContent');

const REQUEST_TIMEOUT_MS = 5000;
const SERVER_TIMESTAMP = admin.database.ServerValue.TIMESTAMP;
const uid = '023CwP2OJ5cMu2wLYPHvHC9qXhC2';
const dataBaseUrl = 'https://seecoderun.firebaseio.com';
const dataBaseRoot = '/scr2'; //todo change to scr2/test when testing locally
const defaultPastebinScheme = {
  creationTimestamp: SERVER_TIMESTAMP,
  firecos: 0, //history on each child  handled with Firepad
  search: 0,
  chat: 0,
  shares: {
    currentEvent: 0,
    parentPastebinId: 0,
    children: 0
  },
  users: 0
};


function makeNewPastebinId() {
  return admin.database().ref(dataBaseRoot).push(defaultPastebinScheme).key;
}

function makeFirebaseReferenceCopy(source, destination, dataChanger) {
  source.once("value").then(snapshot => {
    let data = snapshot.val();
    if (data) {
      data = dataChanger.changeData(data);
      destination.set(data, function (error) {
        if (error && typeof(console) !== 'undefined' && console.error) {
          console.error(error);
        }
      });
    } else {
      console.log("[Client Error]: Client copied unset references (source, destination)", source.key, destination.key);
    }
  }).catch(error =>
    console.log("[Server Error]: Error copying ", error)
  );
}

/**
 * Copies a pastebin cont-ent to a new one. It associates them as parent and child, once the copy is created. In Firebase, reference "parentPastebinId/content/share/children" will get childPastebinId pushed and "childPastebinId/share/parent" will be set to parentPastebinId.
 * @param {String} parentPastebinId - the paste-bin id to be copied.
 * @param {Boolean} copyChat - the pastebin's should be copied or not. It will not copy the chat content by default(false).
 * @return {String} childPastebinId, the pastebin id of the newly created copy.
 */
function copyPastebinById(parentPastebinId, copyChat = false) {
  let childPastebinId = makeNewPastebinId();

  admin.database().ref(`${dataBaseRoot}/${parentPastebinId}/shares/children`)
    .push({childPastebinId: childPastebinId, timestamp: SERVER_TIMESTAMP});

  let sourceReference = admin.database().ref(`${dataBaseRoot}/${parentPastebinId}/`);
  let destinationReference = admin.database().ref(`${dataBaseRoot}/${childPastebinId}/`);

  let dataChanger = {
    changeData: data => {
      data.creationTimestamp = SERVER_TIMESTAMP;

      if (!copyChat) {
        data.chat = {};
      }

      data.shares = {
        currentEvent: 0,
        parentPastebinId: parentPastebinId,
        children: 0
      };
      return data;
    }
  };

  makeFirebaseReferenceCopy(sourceReference, destinationReference, dataChanger);

  return childPastebinId;
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: dataBaseUrl,
  // storageBucket: "firebase-seecoderun.appspot.com",
  databaseAuthVariableOverride: {
    uid: uid
  }
});

exports.getPastebin = functions.https.onRequest((req, res) => {
  const pastebinResponse = {
    session: req.query.session,
    pastebinId: req.query.pastebinId,
    initialEditorsTexts: {},
    error: null
  };
  const firepadsEditorIds = {'js': {isFulfilled: false}, 'html': {isFulfilled: false}, 'css': {isFulfilled: false}}; // keys are editorIds in firebase path 'pastebinId/content/editorId'
  const firepadTimeOut = setTimeout(function () {
      pastebinResponse.error = '[Server Error]: Timeout getting pastebin data.';
      console.log(pastebinResponse.error, REQUEST_TIMEOUT_MS);
      res.status(500).send(pastebinResponse);
    },
    REQUEST_TIMEOUT_MS);

  function setPastebinContent() { //firepadsEditorIds, pastebinResponse
    const firebasePastebinRef = admin.database().ref(`${dataBaseRoot}/${pastebinResponse.pastebinId}`);
    for (const editorId in firepadsEditorIds) {
      const headlessFirepad = new Firepad.Headless(firebasePastebinRef.child(`firecos/${editorId}`));
      headlessFirepad.setText(pastebinResponse.initialEditorsTexts[editorId], function (error, committed) {
        if (error || !committed) {
          console.log(`[Server Error]: Firepad setText on ${editorId} Failed. Firepad error:${error || 'none'}, committed:${committed} `, pastebinResponse);
        }
        headlessFirepad.dispose();
      });
    }
  }

  function sendExistingContent(firebasePastebinRef) { //firepadsEditorIds, pastebinResponse, firepadTimeOut
    let attemptResponse = function attemptResponse(doneEditorId, text) {
      firepadsEditorIds[doneEditorId].isFulfilled = true;
      pastebinResponse.initialEditorsTexts[doneEditorId] = text;
      let done = true;
      for (const editorId in firepadsEditorIds) {
        done = !firepadsEditorIds[editorId].isFulfilled ? false : done;
      }
      if (done) {
        res.status(200).send(pastebinResponse);
        clearTimeout(firepadTimeOut);
      }
    };
    for (const editorId in firepadsEditorIds) {
      const headlessFirepad = new Firepad.Headless(firebasePastebinRef.child(`firecos/${editorId}`));
      headlessFirepad.getText(function (text) {
        headlessFirepad.dispose();
        attemptResponse(editorId, text);
      });
    }
  }

  try {
    if (!pastebinResponse.session) {
      pastebinResponse.session = admin.database().ref(`${dataBaseRoot}/${pastebinResponse.pastebinId}/users`).push().key;
    }

    if (pastebinResponse.pastebinId) {
      const firebasePastebinRef = admin.database().ref(`${dataBaseRoot}/${pastebinResponse.pastebinId}`);
      firebasePastebinRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
          sendExistingContent(firebasePastebinRef);
        } else {
          pastebinResponse.error = '[Client Error]: Pastebin does not exist. Custom pastebinIds are not allowed.';
          res.status(400).send(pastebinResponse);
          clearTimeout(firepadTimeOut);
          console.log(pastebinResponse.error, pastebinResponse);
        }
      }).catch(error => {
        pastebinResponse.error = '[Server Error]: Authentication failed while accessing pastebin. Please inform admin to get renew Firebase service account.';
        res.status(500).send(pastebinResponse);
        console.log(pastebinResponse.error, error);
      });

    } else {
      pastebinResponse.pastebinId = makeNewPastebinId();
      for (const editorId in firepadsEditorIds) {
        pastebinResponse.initialEditorsTexts[editorId] = getDefaultTextForLanguage(editorId);
      }
      res.status(200).send(pastebinResponse);
      clearTimeout(firepadTimeOut);
      setPastebinContent();
    }
  } catch (error) {
    pastebinResponse.error = '[Server Error]: Internal error.';
    res.status(500).send(pastebinResponse);
    clearTimeout(firepadTimeOut);
    console.log(pastebinResponse.error, error);
  }
});

exports.copyPastebin = functions.https.onRequest((req, res) => {
  const pastebinResponse = {
    pastebinId: req.query.pastebinId,
    pastebinCopyId: null,
    error: null
  };
  try {
    if (pastebinResponse.pastebinId) {
      pastebinResponse.pastebinCopyId = copyPastebinById(pastebinResponse.pastebinId);
      if (pastebinResponse.pastebinCopyId) {
        res.status(200).send(pastebinResponse);
      } else { //todo not validated for performance
        pastebinResponse.error = '[Client Error]: could not copy pastebin, pastebinId does not exist.';
        res.status(400).send(pastebinResponse);
        console.log(pastebinResponse.error, pastebinResponse);
      }

    } else {
      pastebinResponse.error = '[Client Error]: No Pastebin ID was provided. Please add pastebinId="a_value" to the URL.';
      res.status(400).send(pastebinResponse);
      console.log(pastebinResponse.error, pastebinResponse);
    }

  } catch (error) {
    pastebinResponse.error = '[Server Error]: Internal Error.';
    res.status(500).send(pastebinResponse);
    console.log(pastebinResponse.error, pastebinResponse);
  }
});

exports.getPastebinToken = functions.https.onRequest((req, res) => {
  const uid = req.query.pastebinId;
  const pastebinResponse = {
    pastebinToken: null,
    error: null
  };
  if (uid) {
    admin.auth().createCustomToken(uid)
      .then(customToken => {
        pastebinResponse.pastebinToken = customToken;
        res.status(200).send(pastebinResponse);
      })
      .catch(error => {
        pastebinResponse.error = '[Server Error]: Authentication failed while accessing pastebin. Please inform admin to get renew Firebase service account.';
        res.status(500).send(pastebinResponse);
        console.log(pastebinResponse.error, error);
      });
  } else {
    pastebinResponse.error = '[Client Error]: No Pastebin ID was provided. Please add pastebinId="a_value" to the URL';
    res.status(400).send(pastebinResponse);
    console.log(pastebinResponse.error, error);
  }
});
