/* global firebase */
/* global Firepad */
import {AppConfiguration} from "../app-configuration";

export class FirebaseManager{
    firebaseApp = null;
    pastebinId = undefined;
    SERVER_TIMESTAMP = firebase.database.ServerValue.TIMESTAMP;

    constructor(eventAggregator){
        this.eventAggregator = eventAggregator;
        let appConfiguration = new AppConfiguration();
        this.baseURL = appConfiguration.firebaseURL;
        this.isDebug = appConfiguration.isDebug;
        this.appRoot = appConfiguration.appRoot;
    }

    activate(pastebinId){
        this.pastebinId = pastebinId;
        this.initialize();
    }

    getCustomToken(pastebinId = this.pastebinId ){
        // return pastebinId;
        return {
            "provider": "anonymous",
            "uid": pastebinId
        };
    }

    initialize(pastebinId = this.pastebinId){
        let self = this;

        let config = {
          apiKey: "AIzaSyBmm0n6NgjksFjrM6D5cDX7_zw-QH9xwiI",
          authDomain: "seecoderun.firebaseapp.com",
          databaseURL: this.baseURL
        };

        if(pastebinId){
            config = {
                apiKey: "AIzaSyC5ovOrvFtW7BKE3PP4TwQKGz3eVnQ7FR8",
                databaseURL: this.baseURL
            };
        }

        this.firebaseApp = firebase.initializeApp(config);
        if (firebase.auth().currentUser) {
            firebase.auth().signOut();
        }

        this.firebaseApp.auth().onAuthStateChanged(function(user) {
            if (user) {
              // User is signed in.
              self.isAnonymous = user.isAnonymous;
              self.pastebinId = user.uid;
              self.eventAggregator.publish("pastebinReady");
              console.log(JSON.stringify(user));
            }else{
              self.eventAggregator.publish("pastebinError", {error: "Authentication failed"});
            }
        });

        let errorHandler = function(error) {
              self.eventAggregator.publish("pastebinError", error);
        };


        if(pastebinId){
            let customToken = firebase.auth.createCustomToken(String(pastebinId));
            this.firebaseApp.auth().signInWithCustomToken(customToken).catch(errorHandler);
        }else{

            this.firebaseApp.auth().signInAnonymously().catch(errorHandler);
        }
    }

    makeNewPastebinFirebaseReferenceId(){
        return this.firebaseApp.database(`${this.appRoot}/`).ref().push().key;
    }

    makePastebinFirebaseReference(pastebinId = this.pastebinId ){
        return this.firebaseApp.database().ref(`${this.appRoot}/${this.pastebinId}/`);
    }

    makeTraceSearchHistoryFirebase(){
        return this.firebaseApp.database().ref(`${this.appRoot}/${this.pastebinId}/content/search`);
    }

    makeChatFirebase(){
        return this.firebaseApp.database().ref(`${this.appRoot}/${this.pastebinId}/content/chat`);
    }

    makeJsEditorFirepad(jsEditor){
        // let defaultText = '\nhelloWorld();\n\nfunction helloWorld() {\n\t  var message = "<h1>Hello, world!</h1>";\n\t$("body").html(message);\n\tvar noClass= $("body").attr("class");\n}';
        let defaultText = '\nhelloWorld();\n\nfunction helloWorld() {\n\t  var message = "<h1>Hello, world!</h1>";\n\t$("body").html();\n}';
        return this.makeFirepad("js", jsEditor, defaultText);
    }

    makeHtmlEditorFirepad(htmlEditor){
        let defaultText = '<!DOCTYPE html>\n<html>\n<head>\n\t<meta charset="utf-8">\n\t<title>SeeCodeRun Pastebin</title>\n\t<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js">\n\t</script>\n</head>\n<body>\n\n</body>\n</html>';
        return this.makeFirepad("html", htmlEditor, defaultText);
    }

    makeCssEditorFirepad(cssEditor){
        let defaultText = 'h1 {\n\t font-weight: bold;\n}';
        return this.makeFirepad("css", cssEditor, defaultText);
    }

    makeFirepad(subject, editor, defaultText){
        let subjectPath = `${this.appRoot}/${this.pastebinId}/content/${subject}`;
        let firebase = this.firebaseApp.database().ref(subjectPath);

        return Firepad.fromACE(
          firebase,
          editor, {
            defaultText: defaultText
          });
    }

    // makeHistoryViewerFirepad(subject, editor){
    //     let subjectURL = `${this.baseURL}/${this.pastebinId}/content/${subject}`;
    //     let subjectFirebase = new Firebase(subjectURL);

    //     let subjectHistoryURL = `${this.baseURL}/${this.pastebinId}/content/${subject}/historyViewer`;
    //     let historyFirebase = new Firebase(subjectHistoryURL);

    //     // Remove the folder from the firebase
    //     historyFirebase.remove();
    //     editor.setValue("");
    //     // Copy the entire firebase to the history firebase
    //     subjectFirebase.once("value", function (snap) {
    //       historyFirebase.set(snap.val());
    //     });
    //     let sliderMaxValue = 0;
    //     subjectFirebase.child('history').once("value", function (sna) {
    //         sliderMaxValue = sna.numChildren();
    //     });

    //     editor.setValue("");
    //     return {
    //         sliderMaxValue: sliderMaxValue,
    //         subjectFirebase: subjectFirebase,
    //         historyFirebase: historyFirebase,
    //         historyFirepad: Firepad.fromACE(historyFirebase, editor,{defaultText: ""})
    //     };
    // }

    // slideHistoryViewerFirepad(subjectFirebase,  historyFirebase, editor, sliderValue){
    //     // Remove the history from the history firebase
    //     historyFirebase.child('history').remove();
    //     // Copy history from the firebase to the history firebase to display values till a specific point in history.
    //     subjectFirebase.child('history').limitToFirst(sliderValue).once("value", function (snap) {
    //         historyFirebase.child('history').set(snap.val());
    //     });
    // }

    makePastebinFirebaseReferenceCopy(source, destination) {
        source.once("value", function(snapshot) {
            destination.set(snapshot.val(), function(error) {
                if (error && typeof(console) !== 'undefined' && console.error) {
                    console.error(error);
                }
            });
        });
    }

}