/* global Firebase */
/* global Firepad */
import {AppConfiguration} from "../app-configuration";

export class FirebaseManager{
    baseURL = new AppConfiguration().getConfiguration().firebaseURL;
    pastebinId = undefined;
    SERVER_TIMESTAMP = Firebase.ServerValue.TIMESTAMP;

    activate(pastebinId){
        if(pastebinId){
            this.pastebinId = pastebinId;
        }else{
            this.pastebinId = this.makeNewPastebinFirebaseReferenceId();
        }
    }

    makeNewPastebinFirebaseReferenceId(){
        return new Firebase(this.baseURL).push().key();
    }

    makePastebinFirebaseReference(pastebinId = this.pastebinId ){
        return new Firebase(`${this.baseURL}/${pastebinId}/`);
    }

    makeTraceSearchHistoryFirebase(){
        return new Firebase(`${this.baseURL}/${this.pastebinId}/content/search`);
    }

    makeChatFirebase(){
        return new Firebase(`${this.baseURL}/${this.pastebinId}/content/chat`);
    }

    makeJsEditorFirepad(jsEditor){
        let defaultText = '\ngo(); \n\nfunction go() {\n  var message = "Hello, world.";\n  console.log(message);\n}';
        return this.makeFirepad("js", jsEditor, defaultText);
    }

    makeHtmlEditorFirepad(htmlEditor){
        let defaultText = '<!DOCTYPE html>\n<html>\n<head>\n\t<meta charset="utf-8">\n\t<title>Coode</title>\n</head>\n<body>\n\n</body>\n</html>';
        return this.makeFirepad("html", htmlEditor, defaultText);
    }

    makeCssEditorFirepad(cssEditor){
        let defaultText = 'h1 { font-weight: bold; }';
        return this.makeFirepad("css", cssEditor, defaultText);
    }

    makeFirepad(subject, editor, defaultText){
        let subjectURL = `${this.baseURL}/${this.pastebinId}/content/${subject}`;
        let firebase = new Firebase(subjectURL);

        return Firepad.fromACE(
          firebase,
          editor, {
            defaultText: defaultText
          });
    }

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