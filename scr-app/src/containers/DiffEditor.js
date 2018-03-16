// makeHistoryViewerFirepad(subject, editor, context) {
//   let subjectURL = `${this.baseURL}/${this.pastebinId}/content/${subject}`;
//   let subjectFirebase = new Firebase(subjectURL);
//
//   let subjectHistoryURL = `${this.baseURL}/${this.pastebinId}/historyViewer/${subject}`;
//   let historyFirebase = new Firebase(subjectHistoryURL);
//
//   // Copy the entire firebase to the history firebase
//   subjectFirebase.once("value", function (snapshot) {
//     historyFirebase.set(snapshot.val());
//   });
//
//
//   subjectFirebase.child('history').once("value", function (snapshot) {
//     let sliderMaxValue = snapshot.numChildren();
//     context.updateSliderMaxValue(sliderMaxValue);
//   });
//
//   let headless = Firepad.Headless(historyFirebase);
//   headless.getText(function (text) {
//     editor.setValue(text);
//   });
//   return {
//     subjectFirebase: subjectFirebase,
//     historyFirebase: historyFirebase,
//     historyFirepadHeadless: headless
//   };
// }
//
// slideHistoryViewerFirepad(subjectFirebase, historyFirebase, sliderValue, activeHistoryEditor, context) {
//   context.historyFirepadHeadless.dispose();
//   // Copy history from the firebase to the history firebase to display values till a specific point in history.
//   subjectFirebase.child('history').limitToFirst(sliderValue).once("value", function (snapshot) {
//     historyFirebase.child('history').set(snapshot.val());
//     context.historyFirepadHeadless = Firepad.Headless(historyFirebase);
//     context.historyFirepadHeadless.getText(function (text) {
//       activeHistoryEditor.setValue(text);
//     });
//
//   });
// }
//
// stopReceivingHistoryUpdates(firebaseRef) {
//   if (!firebaseRef) {
//     return;
//   }
//   firebaseRef.child('history').off("child_added");
// }
