
export const makeGetPastebinId = (makeNewPastebin, SERVER_TIMESTAMP)=>((req, res) => {
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
            },
            SERVER_TIMESTAMP);
    } catch (error) {
        pastebinResponse.error = '[Server Error]: Internal error.';
        if (!pastebinResponse.isSent) {
            res.status(500).send(pastebinResponse);
            pastebinResponse.isSent = true;
        }
        console.log(pastebinResponse.error, error);
    }
});

export const makeGetPastebin = (getDatabaseRootRef)=>((req, res) => {
    const pastebinResponse = {
        pastebinId: req.query.pastebinId,
        initialEditorsTexts: {},
        error: null
    };

    try {
        if (pastebinResponse.pastebinId) {
            const firebasePastebinRef =
                getDatabaseRootRef().child(`${pastebinResponse.pastebinId}`);
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

export const makeCopyPastebin=((copyPastebinById, SERVER_TIMESTAMP)=>(req, res) => {
    const pastebinResponse = {
        sourcePastebinId: req.query.sourcePastebinId,
        copyUsers: req.query.copyUsers,
        copyChat: req.query.copyChat,
        pastebinId: null,
        error: null
    };

    try {
        if (pastebinResponse.sourcePastebinId) {
            copyPastebinById(pastebinResponse.sourcePastebinId, res, pastebinResponse, SERVER_TIMESTAMP);
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

export const makeGetPastebinToken = (createCustomToken)=>((req, res) => {
    const pastebinResponse = {
        pastebinToken: null,
        error: null
    };

    const uid = req.query.pastebinId;

    if (uid) {
        createCustomToken(uid)
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
