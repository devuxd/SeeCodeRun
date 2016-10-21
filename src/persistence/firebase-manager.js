/* global Firebase */
/* global Firepad */
import {AppConfiguration} from "../app-configuration";

export class FirebaseManager {
  baseURL = new AppConfiguration().getConfiguration().firebaseURL;
  pastebinId = undefined;
  SERVER_TIMESTAMP = Firebase.ServerValue.TIMESTAMP;

  activate(pastebinId) {
    if (pastebinId) {
      this.pastebinId = pastebinId;
    } else {
      this.pastebinId = this.makeNewPastebinFirebaseReferenceId();
    }
  }

  makeNewPastebinFirebaseReferenceId() {
    return new Firebase(this.baseURL).push().key();
  }

  makePastebinFirebaseReference(pastebinId = this.pastebinId) {
    return new Firebase(`${this.baseURL}/${pastebinId}/`);
  }

  makeTraceSearchHistoryFirebase() {
    return new Firebase(`${this.baseURL}/${this.pastebinId}/content/search`);
  }

  makeChatFirebase() {
    return new Firebase(`${this.baseURL}/${this.pastebinId}/content/chat`);
  }

  makeJsEditorFirepad(jsEditor) {
    // let defaultText = '\nhelloWorld();\n\nfunction helloWorld() {\n\t  var message = "<h1>Hello, world!</h1>";\n\t$("body").html(message);\n\tvar noClass= $("body").attr("class");\n}';
    let defaultText = '\nhelloWorld();\n\nfunction helloWorld() {\n\t  var message = "<h1>Hello, world!</h1>";\n\t$("body").html();\n}';
    return this.makeFirepad("js", jsEditor, defaultText);
  }

  makeHtmlEditorFirepad(htmlEditor) {
    let defaultText = '<!DOCTYPE html>\n<html>\n<head>\n\t<meta charset="utf-8">\n\t<title>SeeCodeRun Pastebin</title>\n\t<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js">\n\t</script>\n</head>\n<body>\n\n</body>\n</html>';
    return this.makeFirepad("html", htmlEditor, defaultText);
  }

  makeCssEditorFirepad(cssEditor) {
    let defaultText = 'h1 {\n\t font-weight: bold;\n}';
    return this.makeFirepad("css", cssEditor, defaultText);
  }

  makeFirepad(subject, editor, defaultText) {
    let subjectURL = `${this.baseURL}/${this.pastebinId}/content/${subject}`;
    let firebase = new Firebase(subjectURL);

    return Firepad.fromACE(
      firebase,
      editor, {
        defaultText: defaultText
      });
  }

  makeHistoryViewerFirepad(subject, editor) {
    let subjectURL = `${this.baseURL}/${this.pastebinId}/content/${subject}`;
    let subjectFirebase = new Firebase(subjectURL);

    let subjectHistoryURL = `${this.baseURL}/${this.pastebinId}/content/${subject}/historyViewer`;
    let historyFirebase = new Firebase(subjectHistoryURL);

    // Remove the folder from the firebase
    historyFirebase.remove();
    editor.setValue("");
    // Copy the entire firebase to the history firebase
    subjectFirebase.once("value", function (snap) {
      historyFirebase.set(snap.val());
    });
    let sliderMaxValue = 0;
    subjectFirebase.child('history').once("value", function (sna) {
      sliderMaxValue = sna.numChildren();
    });

    editor.setValue("");
    return {
      sliderMaxValue: sliderMaxValue,
      subjectFirebase: subjectFirebase,
      historyFirebase: historyFirebase,
      historyFirepad: Firepad.fromACE(historyFirebase, editor, {defaultText: ""})
    };
  }

  slideHistoryViewerFirepad(subjectFirebase, historyFirebase, editor, sliderValue) {
    // Remove the history from the history firebase
    historyFirebase.child('history').remove();
    // Copy history from the firebase to the history firebase to display values till a specific point in history.
    subjectFirebase.child('history').limitToFirst(sliderValue).once("value", function (snap) {
      historyFirebase.child('history').set(snap.val());
    });
  }

  makePastebinFirebaseReferenceCopy(source, destination, parentPastebinId) {
    source.once("value", function (snapshot) {
      let data = snapshot.val();
      if (data) {
        data.parentPastebinId = parentPastebinId;
      }
      destination.set(data, function (error) {
        if (error && typeof(console) !== 'undefined' && console.error) {
          console.error(error);
        }
      });
    });
  }

}
