/* global Firebase */
/* global Firepad */
import {AppConfiguration} from "../app-configuration";

export class FirebaseManager {
  baseURL = new AppConfiguration().getConfiguration().firebaseURL;
  pastebinId = undefined;
  SERVER_TIMESTAMP = Firebase.ServerValue.TIMESTAMP;
  isCopy = false;

  activate(pastebinId) {
    if (pastebinId) {
      this.pastebinId = pastebinId;
    } else {
      this.pastebinId = this.makeNewPastebinFirebaseReferenceId();
    }
  }

  makeNewPastebinFirebaseReferenceId(baseURL = this.baseURL) {
    let defaultPastebinScheme = {
      creationTimestamp: this.SERVER_TIMESTAMP,
      content: {
        //js, css and html handled by Firepad
        search: 0,
        chat: 0,
        share: {
          currentEvent: 0,
          parentPastebinId: 0,
          children: 0
        }
      },
      users: 0
    };
    return new Firebase(baseURL).push(defaultPastebinScheme).key();
  }

  makePastebinFirebaseReference(pastebinId = this.pastebinId) {
    return new Firebase(`${this.baseURL}/${pastebinId}/`);
  }

  makeTraceSearchHistoryFirebase(pastebinId = this.pastebinId) {
    return new Firebase(`${this.baseURL}/${pastebinId}/content/search`);
  }

  makeChatFirebase(pastebinId = this.pastebinId) {
    return new Firebase(`${this.baseURL}/${pastebinId}/content/chat`);
  }

  makeShareEventsFirebase(pastebinId = this.pastebinId) {
    return new Firebase(`${this.baseURL}/${pastebinId}/content/share/events`);
  }

  makeShareChildrenFirebase(pastebinId = this.pastebinId) {
    return new Firebase(`${this.baseURL}/${pastebinId}/content/share/children`);
  }

  makeMetagsURLFirebaseVote(metagURLKey, pastebinId = this.pastebinId) {
    return new Firebase(`${this.baseURL}/${pastebinId}/metags/urls/${metagURLKey}`);
  }


  makePastebinMetagsURLsFirebase(pastebinId = this.pastebinId) {
    return new Firebase(`${this.baseURL}/${pastebinId}/metags/urls`);
  }

  makeGlobalMetagsURLsFirebase() {
    return new Firebase(`${this.baseURL}/metags/urls`);
  }

  makeGlobalMetagsURLsFirebaseByKey(metagGlobalURLKey) {
    return new Firebase(`${this.baseURL}/metags/urls/${metagGlobalURLKey}`);
  }

  /**
   * Copies a pastebin content to a new one. It associates them as parent and child, once the copy is created. In Firebase, reference "parentPastebinId/content/share/children" will get childPastebinId pushed and "childPastebinId/share/parent" will be set to parentPastebinId.
   * @param {String} parentPastebinId - the pastebin id to be copied.
   * @param {Boolean} copyChat - the pastebin's should be copied or not. It will not copy the chat content by default(false).
   * @return {String} childPastebinId, the pastebin id of the newly created copy.
   */
  copyPastebinById(parentPastebinId, copyChat = false) {
    this.isCopy = true;
    let firebaseManager = this;
    let childPastebinId = firebaseManager.makeNewPastebinFirebaseReferenceId();

    let parentShareReferenceChildren = firebaseManager.makeShareChildrenFirebase(parentPastebinId);
    parentShareReferenceChildren.push({childPastebinId: childPastebinId, timestamp: firebaseManager.SERVER_TIMESTAMP});

    let sourceReference = firebaseManager.makePastebinFirebaseReference(parentPastebinId);
    let destinationReference = firebaseManager.makePastebinFirebaseReference(childPastebinId);

    let dataChanger = {
      changeData: (data) => {
        if (data.content) {
          data.creationTimestamp = this.SERVER_TIMESTAMP;
          data.content.chat = {};
          data.content.share = {
            currentEvent: 0,
            parentPastebinId: parentPastebinId,
            children: 0
          };
        }
        return data;
      }
    };

    firebaseManager.makeFirebaseReferenceCopy(sourceReference, destinationReference, dataChanger);

    return childPastebinId;
  }

  makeJsEditorFirepad(jsEditor) {
    let defaultText = '\nhelloWorld();\n\nfunction helloWorld() {\n\tvar message = "world!";\n\tvar $helloMessage = $("#hello_message");\n\t$helloMessage.append(message);\n\t$helloMessage.addClass("shiny-red");\n}';
    return this.makeFirepad("js", jsEditor, defaultText);
  }

  makeHtmlEditorFirepad(htmlEditor) {
    let defaultText = '<!DOCTYPE html>\n<html>\n<head>\n\t<meta charset="utf-8">\n\t<title>SeeCodeRun Pastebin</title>\n\t<script src="https://code.jquery.com/jquery-3.1.1.js">\n\t</script>\n</head>\n<body>\n\t<div id="hello_message">\n\t\tHello,\n\t</div>\n</body>\n</html>';
    return this.makeFirepad("html", htmlEditor, defaultText);
  }

  makeCssEditorFirepad(cssEditor) {
    let defaultText = 'body > div:first-child {\n\t font-weight: bold;\n}\n\n.shiny-red {\n\t color: red;\n}';
    return this.makeFirepad("css", cssEditor, defaultText);
  }

  makeFirepad(subject, editor, defaultText) {
    let subjectURL = `${this.baseURL}/${this.pastebinId}/content/${subject}`;
    let firebase = new Firebase(subjectURL);

    if (this.isCopy) {
      defaultText = null;
    }

    return Firepad.fromACE(
      firebase,
      editor, {
        defaultText: defaultText
      });
  }

  makeHistoryViewerFirepad(subject, editor, context) {
    let subjectURL = `${this.baseURL}/${this.pastebinId}/content/${subject}`;
    let subjectFirebase = new Firebase(subjectURL);

    let subjectHistoryURL = `${this.baseURL}/${this.pastebinId}/historyViewer/${subject}`;
    let historyFirebase = new Firebase(subjectHistoryURL);

    // Copy the entire firebase to the history firebase
    subjectFirebase.once("value", function (snapshot) {
      historyFirebase.set(snapshot.val());
    });


    subjectFirebase.child('history').once("value", function (snapshot) {
      let sliderMaxValue = snapshot.numChildren();
      context.updateSliderMaxValue(sliderMaxValue);
    });

    let headless = Firepad.Headless(historyFirebase);
    headless.getText(function (text) {
      editor.setValue(text);
    });
    return {
      subjectFirebase: subjectFirebase,
      historyFirebase: historyFirebase,
      historyFirepadHeadless: headless
    };
  }

  slideHistoryViewerFirepad(subjectFirebase, historyFirebase, sliderValue, activeHistoryEditor, context) {
    context.historyFirepadHeadless.dispose();
    // Copy history from the firebase to the history firebase to display values till a specific point in history.
    subjectFirebase.child('history').limitToFirst(sliderValue).once("value", function (snapshot) {
      historyFirebase.child('history').set(snapshot.val());
      context.historyFirepadHeadless = Firepad.Headless(historyFirebase);
      context.historyFirepadHeadless.getText(function (text) {
        activeHistoryEditor.setValue(text);
      });

    });
  }

  stopReceivingHistoryUpdates(firebaseRef) {
    if (!firebaseRef) {
      return;
    }
    firebaseRef.child('history').off("child_added");
  }

  makeFirebaseReferenceCopy(source, destination, dataChanger = this, thenCallback) {
    source.once("value", function (snapshot) {
      let data = snapshot.val();
      if (data) {
        data = dataChanger.changeData(data);
      }
      destination.set(data, function (error) {
        if (error && typeof(console) !== 'undefined' && console.error) {
          console.error(error);
        }
      });
    });
  }

  /**
   * Default method for DataChanger Interface. In this case, it does not change anything.
   * @param {Object} data - the JSON object to be modified.
   * @return {Object}, the JSON object result of the modification.
   */
  changeData(data) {
    return data;
  }

}
