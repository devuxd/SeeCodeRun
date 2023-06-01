const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Firepad = require('firepad');
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

const REQUEST_TIMEOUT_MS = 5000;
const SERVER_TIMESTAMP = ()=>admin.database.ServerValue.TIMESTAMP;


const dataBaseRoot = '/scr2';
const defaultPastebinScheme = ()=>({
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

const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL,
    databaseAuthVariableOverride: {
        uid: uid
    }
});

const databaseRootRef = app.database().ref(dataBaseRoot);

// Data functions
const makeNewPastebin = onComplete => {
    return databaseRootRef
        .push(defaultPastebinScheme(), onComplete);
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

const sendExistingContent = (res, pastebinResponse, firebasePastebinRef) => {
    const firepadsEditorIds = {
        'js': {isFulfilled: false},
        'html': {isFulfilled: false},
        'css': {isFulfilled: false}
    };
    const firepadTimeOut = setTimeout(() => {
            pastebinResponse.error = '[Server Error]:' +
                ' Timeout getting pastebin data after ' + REQUEST_TIMEOUT_MS + 'ms';
            res.status(500).send(pastebinResponse);
            console.log(pastebinResponse.error, pastebinResponse);
        },
        REQUEST_TIMEOUT_MS);
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

const copyPastebinById = (parentPastebinId, res, pastebinResponse) => {
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

    const onComplete = error => {
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

// Cloud Functions:
exports.getPastebinId = functions.https.onRequest((req, res) => {
    const pastebinResponse = {
        pastebinId: null,
        error: null
    };

    try {
        const pastebinRef = makeNewPastebin(() => {
            pastebinResponse.pastebinId = pastebinRef.key;
            if (!pastebinResponse.isSent) {
                res.status(200).send(pastebinResponse);
                pastebinResponse.isSent = true;
            }
        });
    } catch (error) {
        pastebinResponse.error = '[Server Error]: Internal error.';
        if (!pastebinResponse.isSent) {
            res.status(500).send(pastebinResponse);
            pastebinResponse.isSent = true;
        }
        console.log(pastebinResponse.error, error);
    }
});

exports.getPastebin = functions.https.onRequest((req, res) => {
    const pastebinResponse = {
        pastebinId: req.query.pastebinId,
        initialEditorsTexts: {},
        error: null
    };

    try {
        if (pastebinResponse.pastebinId) {
            const firebasePastebinRef =
                databaseRootRef.child(`${pastebinResponse.pastebinId}`);
            firebasePastebinRef.once('value').then(snapshot => {
                if (snapshot.exists()) {
                    res.status(200).send(pastebinResponse);
                    //slows down requests
                   // sendExistingContent(res, pastebinResponse, firebasePastebinRef);
                } else {
                    pastebinResponse.error = '[Client Error]: Pastebin does not exist.' +
                        ' Custom pastebinIds are not allowed.';
                    res.status(400).send(pastebinResponse);
                    console.log(pastebinResponse.error, pastebinResponse);
                }
            }).catch(error => {
                pastebinResponse.error = '[Server Error]: Internal error.';
                res.status(500).send(pastebinResponse);
                console.log(pastebinResponse.error, error);
            });
        } else {
            pastebinResponse.error = '[Client Error]: PastebinId was not provided.';
            res.status(400).send(pastebinResponse);
            console.log(pastebinResponse.error, pastebinResponse);
        }
    } catch (error) {
        pastebinResponse.error = '[Server Error]: Internal error.';
        res.status(400).send(pastebinResponse);
        console.log(pastebinResponse.error, pastebinResponse, error);
    }
});

exports.copyPastebin = functions.https.onRequest((req, res) => {
    const pastebinResponse = {
        sourcePastebinId: req.query.sourcePastebinId,
        copyUsers: req.query.copyUsers,
        copyChat: req.query.copyChat,
        pastebinId: null,
        error: null
    };

    try {
        if (pastebinResponse.sourcePastebinId) {
            copyPastebinById(pastebinResponse.sourcePastebinId, res, pastebinResponse);
        } else {
            pastebinResponse.error = '[Client Error]: No Pastebin ID was provided.' +
                ' Please add pastebinId="a_value" to the URL.';
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
    const pastebinResponse = {
        pastebinToken: null,
        error: null
    };
    const uid = req.query.pastebinId;

    if (uid) {
        admin.auth().createCustomToken(uid)
            .then(customToken => {
                pastebinResponse.pastebinToken = customToken;
                res.status(200).send(pastebinResponse);
            })
            .catch(error => {
                pastebinResponse.error = '[Server Error]: Authentication failed ' +
                    'while accessing pastebin. Please inform admin to get renew ' +
                    'Firebase service account.';
                res.status(500).send(pastebinResponse);
                console.log(pastebinResponse.error, error);
            });
    } else {
        pastebinResponse.error = '[Client Error]: No Pastebin ID was provided. ' +
            'Please add pastebinId="a_value" to the URL';
        res.status(400).send(pastebinResponse);
        console.log(pastebinResponse.error, error);
    }
});

process.env.NODE_ENV !== 'production' && console.log('USING DEVELOPMENT FIREBASE DB FOR FUNCTIONS: ', Object.keys(exports || {}));
