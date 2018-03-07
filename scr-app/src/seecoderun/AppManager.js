import {Observable} from "rxjs";
import firebase from 'firebase';
import Firepad from 'firepad';
import _ from 'lodash';

import {
  configureMonacoModelsFulfilled,
  configureMonacoModelsRejected,
  updateMonacoModelsFulfilled,
  updateMonacoModelsRejected
} from "../redux/modules/monaco";
import {
  // configureMonacoModelsFulfilled,
  // configureMonacoModelsRejected,
  loadMonacoEditorFulfilled,
  loadMonacoEditorRejected, monacoEditorContentChanged
} from "../redux/modules/monacoEditor";

import {
  configureFirecoEditorFulfilled,
  configureFirecoEditorRejected,
  activateFirepadFulfilled,
  activateFirepadRejected, onConnectionChanged,
} from "../redux/modules/fireco";

import {
  configureMonacoModel,
  configureMonacoEditor,
  configureMonacoEditorWidgets,
  configureMonacoEditorMouseEventsObservable
} from "../utils/monacoUtils";
import {getDefaultTextForLanguage} from '../common/pastebinContent';
import JSXColoringProvider from "../utils/JSXColoringProvider";
import LiveExpressionStore from "./modules/LiveExpressionStore";

const dataBaseRoot='/scr2';
const firebaseConfig={
  apiKey: "AIzaSyBmm0n6NgjksFjrM6D5cDX7_zw-QH9xwiI",
  authDomain: "seecoderun.firebaseapp.com",
  databaseURL: "https://seecoderun.firebaseio.com",
  projectId: "firebase-seecoderun",
  storageBucket: "firebase-seecoderun.appspot.com",
  messagingSenderId: "147785767581"
};

const fireco={
  isInit: false,
  connectedRef: null,
  isAuth: false,
  unsubscribeOnIdTokenChanged: null,
};

const defaultFirecoPad={
  language: 'html',
  isJsx: false,
  monacoEditor: null,
  monacoEditorModel: null,
  monacoEditorSavedState: null, //{text: null, viewState: null}
  editorOptions: {},
  onContentChanged: () => {},
  colorizeJsx: ()=>{},
  firebasePath: null,
  firebaseRef: null,
  headlessFirepad: null,
  starvationTimeout: null,
  setFirecoText: null,
  getFirecoText: null,
  isNew: false,
  isInit: false,
  ignoreContentChange: false,
  mutex: false,
  nextSetFirecoTexts: [],
  text: null,// value obtained by firepad or set via scr
};

const editorIds={
  'js': 'js',
  'html': 'html',
  'css': 'css',
};

export const getEditorIds=() => ({...editorIds});

class AppManager {
  constructor() {
    this.pastebinLayout=null;
    this.pastebinId=null;
    this.monaco=null;
    this.hasSavedEditorsStates=false;
    this.firecoPads={ // editorIds as in Firebase: pastebinId/content/editorId (e.g. js)
      [editorIds['js']]: {
        ...defaultFirecoPad,
        language: 'javascript',
        editorOptions: {
          glyphMargin: true,
          nativeContextMenu: false,
          hover: true,
        },
      },
      [editorIds['html']]: {
        ...defaultFirecoPad
      },
      [editorIds['css']]: {
        ...defaultFirecoPad,
        language: 'css'
      }
    };
    this.jsxColoringProvider=null;
  }
  
  observeDispose() {
    try {
      this.dispose();
      return Observable.of({type: 'DISPOSE_FULFILLED'});
    } catch (error) {
      return Observable.of({type: 'DISPOSE_REJECTED', error: error});
    }
  }
  
  setPastebinId(pastebinId, shouldReplace=false) {
    if (pastebinId && (!this.pastebinId || shouldReplace)) {
      window.location.hash=pastebinId;
      this.pastebinId=pastebinId;
    }
  }
  
  getEditorsStates() {
    const editorsStates={};
    for (const editorId in this.firecoPads) {
      const monacoEditor=this.firecoPads[editorId].monacoEditor;
      if (monacoEditor) {
        editorsStates[editorId]={
          text: monacoEditor.getValue(),
          viewState: monacoEditor.saveViewState(),
        };
      } else {
        return null;
      }
    }
    return editorsStates;
  }
  
  restoreEditorsStates(editorsStates) {
    if (this.hasSavedEditorsStates || !editorsStates) {
      return;
    }
    
    for (const editorId in this.firecoPads) {
      if (editorsStates[editorId]) {
        this.firecoPads[editorId].monacoEditorSavedState=editorsStates[editorId];
      } else {
        return;
      }
    }
    this.hasSavedEditorsStates=true;
  }
  
  getInitialEditorsTextsFromRestoreEditorsStates() {
    if (!this.hasSavedEditorsStates) {
      return null;
    }
    const initialEditorsTexts={};
    for (const editorId in this.firecoPads) {
      if (this.firecoPads[editorId].monacoEditorSavedState) {
        initialEditorsTexts[editorId]=this.firecoPads[editorId].monacoEditorSavedState.text;
      } else {
        return null;
      }
    }
    return initialEditorsTexts;
  }
  
  getCurrentGridLayouts() {
    if (this.pastebinLayout && this.pastebinLayout.getCurrentGridLayouts) {
      return this.pastebinLayout.getCurrentGridLayouts();
    }
    return null;
  }
  
  restoreGridLayouts(gridLayouts) {
    if (gridLayouts && this.pastebinLayout && this.pastebinLayout.restoreGridLayouts) {
      this.pastebinLayout.restoreGridLayouts(gridLayouts);
    }
  }
  
  setPastebinLayout(restoreGridLayouts, getCurrentGridLayouts) {
    this.pastebinLayout={
      restoreGridLayouts: restoreGridLayouts,
      getCurrentGridLayouts: getCurrentGridLayouts
    }
  }
  
  dispose() {
    this.disposeFireco();
  }
  
  configureFirepadPaths(pastebinId, isNew) {
    for (const editorId in this.firecoPads) {
      this.firecoPads[editorId].firebasePath=`${dataBaseRoot}/${pastebinId}/firecos/${editorId}`;
      this.firecoPads[editorId].isNew=isNew;
    }
  }
  
  observeConfigureMonacoModels() {
    try {
      if (window.monaco) {
        this.monaco=window.monaco;
        for (const editorId in this.firecoPads) {
          let text='';
          if (this.hasSavedEditorsStates &&
            this.firecoPads[editorId].monacoEditorSavedState) {
            text=_.isString(
              this.firecoPads[editorId].monacoEditorSavedState.text
            ) ? this.firecoPads[editorId].monacoEditorSavedState.text : '';
          }
          this.firecoPads[editorId].monacoEditorModel=
            configureMonacoModel(this.monaco,
              editorId,
              text,
              this.firecoPads[editorId].language, () => {
                if (!this.jsxColoringProvider) {
                  this.jsxColoringProvider=new JSXColoringProvider(this.monaco);
                }
                this.firecoPads[editorId].isJsx=true;
                let jsxColoringProviderTimeout=null;
                this.firecoPads[editorId].colorizeJsx=(monacoEditor, delay) => {
                  clearTimeout(jsxColoringProviderTimeout);
                  jsxColoringProviderTimeout=setTimeout(() => {
                    this.jsxColoringProvider.colorize(monacoEditor);
                  }, delay);
                };
              });
        }
        
        return Observable.of(configureMonacoModelsFulfilled());
      } else {
        return Observable.of(configureMonacoModelsRejected('Error: Monaco is not' +
          ' loaded'));
      }
    } catch (e) {
      return Observable.of(configureMonacoModelsRejected(e));
    }
  }
  
  observeUpdateMonacoModels(initialEditorsTexts) {
    try {
      if (initialEditorsTexts) {
        for (const editorId in this.firecoPads) {
          const firecoPad=this.firecoPads[editorId];
          if (!firecoPad.isInit && _.isString(initialEditorsTexts[editorId])) {
            firecoPad.monacoEditorModel.setValue(initialEditorsTexts[editorId]);
          }
        }
        return Observable.of(updateMonacoModelsFulfilled());
      } else {
        return Observable.of(updateMonacoModelsRejected('Error: no editors' +
          ' texts was provided'));
      }
    } catch (e) {
      return Observable.of(updateMonacoModelsRejected(e));
    }
  }
  
  observeConfigureMonacoEditor(editorId, editorContainer) {
    const {editorDiv, dispatchMouseEvents, lineNumbers, setMonacoEditor, onContentChangedAction}=editorContainer;
    if (this.monaco) {
      const firecoPad=this.firecoPads[editorId];
      try {
        const editorOptions={
          ...firecoPad.editorOptions,
          model: firecoPad.monacoEditorModel,
          lineNumbers: lineNumbers
        };
        const monacoEditor=configureMonacoEditor(this.monaco, editorDiv, editorOptions);
        
        if (firecoPad.monacoEditorSavedState && _.isString(firecoPad.monacoEditorSavedState.text)) {
          monacoEditor.setValue(firecoPad.monacoEditorSavedState.text);
          monacoEditor.restoreViewState(firecoPad.monacoEditorSavedState.viewState);
        }
        
        setMonacoEditor(firecoPad.monacoEditor);
        dispatchMouseEvents(configureMonacoEditorMouseEventsObservable(monacoEditor));
        firecoPad.monacoEditor=monacoEditor;
        
        const onContentChanged=changes => {
          const text=monacoEditor.getValue();
          onContentChangedAction(monacoEditorContentChanged(editorId, text, changes, !firecoPad.ignoreContentChange));
          firecoPad.colorizeJsx(monacoEditor, 500);
          firecoPad.onContentChanged(text);
        };
        monacoEditor.onDidChangeModelContent(onContentChanged);
        firecoPad.colorizeJsx(monacoEditor, 0);
        
        const falsy=false;
        if (falsy) {
          configureMonacoEditorWidgets(this.monaco, editorId, monacoEditor);
        }
        return Observable.of(loadMonacoEditorFulfilled(editorId));
      } catch (error) {
        return Observable.of(loadMonacoEditorRejected(editorId, error));
      }
      
    } else {
      return Observable.of(loadMonacoEditorRejected(editorId, 'Error: monaco is not configured. Execute configureMonaco(monaco) first, providing a monaco library reference'));
    }
  }
  
  observeActivateFireco(pastebinId, pastebinToken, isNew) {
    if (pastebinId && pastebinToken) {
      this.configureFirepadPaths(pastebinId, isNew);
      fireco.isAuth=false;
      return Observable.create(observer => {
        
        if (fireco.unsubscribeOnIdTokenChanged) {
          fireco.unsubscribeOnIdTokenChanged();
        }
        
        if (!fireco.isInit) {
          fireco.isInit=true;
          firebase.initializeApp(firebaseConfig);
          fireco.connectedRef=firebase.database().ref(".info/connected");
          fireco.connectedRef.on("value", snap =>
            observer.next(onConnectionChanged(snap.val()))
          );
        } else {
          fireco.connectedRef.off("value");
          fireco.connectedRef.on("value", snap =>
            observer.next(onConnectionChanged(snap.val()))
          );
        }
        
        fireco.unsubscribeOnIdTokenChanged=firebase.auth().onIdTokenChanged(
          user => {
            if (user) {
              if (!fireco.isAuth) {
                fireco.isAuth=true;
                observer.next(activateFirepadFulfilled(user));
              }
              // ignore non-token events
            }
          },
          error => {
            fireco.isAuth=false;
            observer.next(activateFirepadRejected(error));
          }
        );
        
        firebase.auth().signInWithCustomToken(pastebinToken)
          .catch((error) => {
            fireco.isAuth=false;
            observer.next(activateFirepadRejected(error));
          });
        
      });
    } else {
      return Observable.of(activateFirepadRejected('Values missing:' +
        ' pastebinToken, firepadPaths; or Fireco is not configured.'));
    }
  }
  
  // observeActivateFirecoDinammically(pastebinId, pastebinToken, isNew) {
  //   if (pastebinId && pastebinToken) {
  //     this.configureFirepadPaths(pastebinId, isNew);
  //     fireco.isAuth=false;
  //     return Observable.create(observer => {
  //
  //       if (fireco.unsubscribeOnIdTokenChanged) {
  //         fireco.unsubscribeOnIdTokenChanged();
  //       }
  //
  //       const activateFirepad = ()=>{
  //         fireco.connectedRef.on("value", snap =>
  //           observer.next(onConnectionChanged(snap.val()))
  //         );
  //
  //         fireco.unsubscribeOnIdTokenChanged=firebase.auth().onIdTokenChanged(
  //           user => {
  //             if (user) {
  //               if (!fireco.isAuth) {
  //                 fireco.isAuth=true;
  //                 observer.next(activateFirepadFulfilled(user));
  //               }// ignore non-token events
  //             }
  //           },
  //           error => {
  //             fireco.isAuth=false;
  //             observer.next(activateFirepadRejected(error));
  //           }
  //         );
  //
  //         firebase.auth().signInWithCustomToken(pastebinToken)
  //           .catch((error) => {
  //             fireco.isAuth=false;
  //             observer.next(activateFirepadRejected(error));
  //           });
  //       };
  //
  //       if (!fireco.isInit) {
  //         fireco.isInit=true;
  //         import('firebase')
  //           .then((Firebase) => {
  //             firebase = Firebase;
  //             firebase.initializeApp(firebaseConfig);
  //             fireco.connectedRef=firebase.database().ref(".info/connected");
  //             activateFirepad();
  //           })
  //           .catch(err => {
  //             observer.next(activateFirepadRejected(err));
  //           });
  //       } else {
  //         fireco.connectedRef.off("value");
  //         activateFirepad();
  //       }
  //     });
  //   } else {
  //     return Observable.of(activateFirepadRejected('Values missing:' +
  //       ' pastebinToken, firepadPaths; or Fireco is not configured.'));
  //   }
  // }
  //
  disposeFireco() {
    for (const editorId in this.firecoPads) {
      if (this.firecoPads[editorId].headlessFirepad) {
        this.firecoPads[editorId].headlessFirepad.dispose();
      }
    }
    
    if (fireco.unsubscribeOnIdTokenChanged) {
      fireco.unsubscribeOnIdTokenChanged();
    }
  }
  
  observeConfigureFirecoEditor(editorId) {
    if (!fireco.isAuth) {
      return Observable.of(configureFirecoEditorRejected(editorId, 'Error:' +
        ' Fireco' +
        ' is not' +
        ' authenticated. Execute activateFireco(pastebinToken) first,' +
        ' providing a' +
        ' a valid token'));
    }
    if (!this.monaco) {
      return Observable.of(configureFirecoEditorRejected(editorId, 'Error:' +
        ' monaco' +
        ' is not' +
        ' configured. Execute configureMonaco(monaco) first, providing a' +
        ' monaco library reference'));
    }
    
    try {
      const firecoPad=this.firecoPads[editorId];
      firecoPad.firebaseRef=firebase.database().ref(firecoPad.firebasePath);
      firecoPad.headlessFirepad=new Firepad.Headless(firecoPad.firebaseRef);
      
      firecoPad.starvationTimeout=null;
      firecoPad.getFirecoText=() => {
        firecoPad.headlessFirepad.getText((text) => {
          if (!firecoPad.mutex) {
            firecoPad.isInit=true;
            this.setEditorText(editorId, text);
          }
        });
      };
      
      firecoPad.setFirecoText=(text) => {
        clearTimeout(firecoPad.starvationTimeout);
        // Prevents Firepad mutex starvation when Firebase is not connected.
        firecoPad.starvationTimeout=setTimeout(() => {
          firecoPad.mutex=false;
        }, 10000);
        
        firecoPad.mutex=true;
        firecoPad.headlessFirepad.setText(text, (/*error, committed*/) => {
          clearTimeout(firecoPad.starvationTimeout);
          if (firecoPad.nextSetFirecoTexts.length) {
            // chains all editor changes
            firecoPad.nextSetFirecoTexts.pop()();
          } else {
            firecoPad.mutex=false;
          }
        });
      };
      if (firecoPad.isNew) {
        firecoPad.setFirecoText(getDefaultTextForLanguage(editorId));
      } else {
        firecoPad.getFirecoText();
      }
      
      firecoPad.firebaseRef.on('value', snapshot => {
        if (snapshot.exists()) {
          firecoPad.getFirecoText();
        }
      });
      
      firecoPad.onContentChanged=text => {
        if (!firecoPad.ignoreContentChange) {
          if (firecoPad.mutex) {
            firecoPad.nextSetFirecoTexts.unshift(() => firecoPad.setFirecoText(text));
          } else {
            firecoPad.setFirecoText(text);
          }
        }
      };
      return Observable.of(configureFirecoEditorFulfilled(editorId));
    } catch (error) {
      return Observable.of(configureFirecoEditorRejected(editorId, error));
    }
  }
  
  observeConfigureLiveExpressionStore(editorId, autoLog) {
    const monacoEditor=this.firecos[editorId].monacoEditor;
    this.firecos[editorId].liveExpressionStore=new LiveExpressionStore(this.monaco, editorId, monacoEditor, autoLog);
    
  }
  
  setEditorText(editorId, text) {
    const firecoPad=this.firecoPads[editorId];
    firecoPad.text=text;
    if (!firecoPad.monacoEditor || text === firecoPad.monacoEditor.getValue()) {
      return;
    }
    firecoPad.ignoreContentChange=true;
    const viewState=firecoPad.monacoEditor.saveViewState();
    firecoPad.monacoEditor.setValue(text);
    firecoPad.monacoEditor.restoreViewState(viewState);
    firecoPad.ignoreContentChange=false;
  }
  
  observeUpdatePlayground() {
  
  }


//
// makePastebinFirebaseReference(pastebinId = this.pastebinId) {
//   return new Firebase(`${this.baseURL}/${pastebinId}/`);
// }
//
// makeTraceSearchHistoryFirebase(pastebinId = this.pastebinId) {
//   return new Firebase(`${this.baseURL}/${pastebinId}/content/search`);
// }
//
// makeChatFirebase(pastebinId = this.pastebinId) {
//   return new Firebase(`${this.baseURL}/${pastebinId}/content/chat`);
// }
//
// makeShareEventsFirebase(pastebinId = this.pastebinId) {
//   return new Firebase(`${this.baseURL}/${pastebinId}/content/share/events`);
// }
//
// makeShareChildrenFirebase(pastebinId = this.pastebinId) {
//   return new Firebase(`${this.baseURL}/${pastebinId}/content/share/children`);
// }
//
// makeMetagsURLFirebaseVote(metagURLKey, pastebinId = this.pastebinId) {
//   return new Firebase(`${this.baseURL}/${pastebinId}/metags/urls/${metagURLKey}`);
// }
//
//
// makePastebinMetagsURLsFirebase(pastebinId = this.pastebinId) {
//   return new Firebase(`${this.baseURL}/${pastebinId}/metags/urls`);
// }
//
// makeGlobalMetagsURLsFirebase(pastebinId = this.pastebinId) {
//   return new Firebase(`${this.baseURL}/metags/urls`);
// }
//
// makeGlobalMetagsURLsFirebaseByKey(metagGlobalURLKey) {
//   return new Firebase(`${this.baseURL}/metags/urls/${metagGlobalURLKey}`);
// }
//
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
  
}

export default function configureAppManager() {
  return new AppManager();
};

