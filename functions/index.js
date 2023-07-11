const database = require('firebase/database');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Firepad = require('firepad');
const ScrFunctions = require('./scr-functions');
const config = require("./cloud-functions.json");

const uid = config.uid; // matches the uid used in db rules
let serviceAccount = null, databaseURL = null;
if (process.env.NODE_ENV === 'production') {
    serviceAccount = require("./serviceAccountKey.prod.json");
    databaseURL = config.prodDbURL;
} else {
    serviceAccount = require("./serviceAccountKey.dev.json");
    databaseURL = config.devDbURL;
}

const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL,
    databaseAuthVariableOverride: {
        uid: uid
    }
});

const dataBaseRoot = '/scr2';

const databaseRootRef = app.database().ref(dataBaseRoot);


const SERVER_TIMESTAMP = ()=>(database.serverTimestamp());

const defaultPastebinScheme = (SERVER_TIMESTAMP)=>({
    creationTimestamp: SERVER_TIMESTAMP(),
    firecos: 0, //history on each child  handled by Firepad: html, js, css
    search: 0,
    chat: 0,
    shares: {
        currentEvent: 0,
        parentPastebinId: 0,
        children: 0
    },
    users: 0
});

// Data functions
const makeNewPastebin = (onComplete, SERVER_TIMESTAMP) => {
    return databaseRootRef
        .push(defaultPastebinScheme(SERVER_TIMESTAMP), onComplete);
};

const makeNewPastebinId = () => {
    return databaseRootRef.push(0).key;
};

const attemptResponse = (
    res,
    pastebinResponse, firepadTimeOut, firepadsEditorIds, doneEditorId, text) => {
    firepadsEditorIds[doneEditorId].isFulfilled = true;
    pastebinResponse.initialEditorsTexts[doneEditorId] = text;
    for (const editorId in firepadsEditorIds) {
        if (!firepadsEditorIds[editorId].isFulfilled) {
            return;
        }
    }
    res.status(200).send(pastebinResponse);
    clearTimeout(firepadTimeOut);
};

const sendExistingContent = (res, pastebinResponse, firebasePastebinRef, requestTimeoutMs= 5000) => {
    const firepadsEditorIds = {
        'js': {isFulfilled: false},
        'html': {isFulfilled: false},
        'css': {isFulfilled: false}
    };
    const firepadTimeOut = setTimeout(() => {
            pastebinResponse.error = '[Server Error]:' +
                ' Timeout getting pastebin data after ' + requestTimeoutMs + 'ms';
            res.status(500).send(pastebinResponse);
            console.log(pastebinResponse.error, pastebinResponse);
        },
        requestTimeoutMs);
    for (const editorId in firepadsEditorIds) {
        const headlessFirepad =
            new Firepad.Headless(firebasePastebinRef.child(`firecos/${editorId}`));
        headlessFirepad.getText(text => {
            attemptResponse(
                res,
                pastebinResponse, firepadTimeOut, firepadsEditorIds, editorId, text);
            headlessFirepad.dispose();
        });
    }
};

const makeFirebaseReferenceCopy = (
    source, destination, changeData, onComplete, onError) => {
    source.once("value").then(snapshot => {
        if (snapshot.exists()) {
            destination.set(changeData(snapshot.val()), onComplete);
        } else {
            onError({
                type: '[Client Error]',
                details: 'Provided pastebinId does not exist.',
                message: null
            });
        }
    }).catch(error =>
        onError({
            type: "[Server Error]",
            details: 'Error copying pastebin.',
            message: error
        })
    );
};

const copyPastebinById = (parentPastebinId, res, pastebinResponse, SERVER_TIMESTAMP) => {
    const childPastebinId = makeNewPastebinId();
    let sourceReference =
        databaseRootRef.child(`${parentPastebinId}/`);
    let destinationReference =
        databaseRootRef.child(`${childPastebinId}/`);

    const changeData = data => {
        data.creationTimestamp = SERVER_TIMESTAMP();
        if (!pastebinResponse.copyUsers) {
            data.users = {};
        }
        if (!pastebinResponse.copyChat) {
            data.chat = {};
        }
        data.shares = {
            currentEvent: 0,
            parentPastebinId: parentPastebinId,
            children: 0
        };
        return data;
    };

    const onError = error => {
        pastebinResponse.error = `${error.type}: ${error.details}`;
        if (!pastebinResponse.isSent) {
            res.status('[Server Error]' ? 500 : 400).send(pastebinResponse);
            pastebinResponse.isSent = true;
        }
        destinationReference.remove(e => {
            console.log(error.type, error.details, error.message, e);
        });
    };

    const onComplete = (error, SERVER_TIMESTAMP) => {
        if (error) {
            onError({
                type: '[Server Error]',
                details: 'Could not update new copy of ' +
                    ' provided pastebin.',
                message: error
            });
        } else {
            sourceReference.child('shares/children')
                .push({childPastebinId: childPastebinId, timestamp: SERVER_TIMESTAMP()},
                    error => {
                        if (error) {
                            onError({
                                type: '[Server Error]',
                                details: 'Could not update parent\'s children data during' +
                                    ' pastebin copy.',
                                message: error
                            });
                        } else {
                            pastebinResponse.pastebinId = childPastebinId;
                            if (!pastebinResponse.isSent) {
                                res.status(200).send(pastebinResponse);
                                pastebinResponse.isSent = true;
                            }
                        }
                    });
        }
    };
    makeFirebaseReferenceCopy(
        sourceReference, destinationReference, changeData, onComplete, onError);
};

const getDatabaseRootRef = ()=>databaseRootRef;

const createCustomToken = (...params) =>admin.auth().createCustomToken(...params);

// Cloud Functions:
exports.getPastebinId = functions.https.onRequest(ScrFunctions.makeGetPastebinId(makeNewPastebin, SERVER_TIMESTAMP));

exports.getPastebin = functions.https.onRequest(ScrFunctions.makeGetPastebin(getDatabaseRootRef));

exports.copyPastebin = functions.https.onRequest(ScrFunctions.makeCopyPastebin(copyPastebinById, SERVER_TIMESTAMP));

exports.getPastebinToken = functions.https.onRequest(ScrFunctions.makeGetPastebinToken(createCustomToken));

process.env.NODE_ENV !== 'production' && console.log('USING DEVELOPMENT FIREBASE DB FOR FUNCTIONS: ', Object.keys(exports || {}));
