import * as firebase from "firebase";
import {Observable, Subject} from "rxjs";
import localStorage from 'store';

import {
  fetchPastebinToken,
  authPastebinFulfilled,
  authPastebinRejected
} from '../redux/modules/pastebin';

import {
  configureFirepadsFulfilled,
  configureFirepadsRejected
} from '../redux/modules/firepad';
import {
  configureMonacoFulfilled,
  configureMonacoRejected
} from "../redux/modules/monaco";
import {
  configureFirecoActionsFulfilled,
  configureFirecoActionsRejected,
  configureMonacoModelsFulfilled,
  configureMonacoModelsRejected,
  loadMonacoEditorFulfilled,
  loadMonacoEditorRejected
} from "../redux/modules/monacoEditor";
import {
  configureFirecoFulfilled,
  configureFirecoRejected
} from "../redux/modules/fireco";

import {
  configureMonaco,
  configureMonacoModel,
  configureMonacoEditor,
  configureMonacoEditorWidgets, configureMonacoEditorMouseEventsObservable
} from "../utils/monacoUtils";
import {getDefaultTextForLanguage} from "./modules/pastebinContent";
import {updatePlayground} from "../redux/modules/playground";
import JSXColoringProvider from "../utils/JSXColoringProvider";
import LiveExpressionStore from "./modules/LiveExpressionStore";

const SERVER_TIMESTAMP=firebase.database.ServerValue.TIMESTAMP;
const dataBaseRoot='/scr2';
const config={
  apiKey: "AIzaSyBmm0n6NgjksFjrM6D5cDX7_zw-QH9xwiI",
  authDomain: "seecoderun.firebaseapp.com",
  databaseURL: "https://seecoderun.firebaseio.com",
  projectId: "firebase-seecoderun",
  storageBucket: "firebase-seecoderun.appspot.com",
  messagingSenderId: "147785767581"
};

const defaultFireco={
  language: 'html',
  monacoEditor: null,
  monacoEditorModel: null,
  monacoEditorSavedState: null, //{text: null, viewState: null}
  editorOptions: {},
  observeMonacoEditorMouseEvents: false,
  dispatchMouseEvents: null,
  monacoEditorMouseEventsObservable: null,
  dispatchFirecoActions: null,
  firebasePath: null
};

class AppManager {
  constructor() {
    this.isOnline$=
      Observable.of(window.navigator.onLine);
    this.goesOffline$=
      Observable.fromEvent(window, 'offline').mapTo(false);
    this.goesOnline$=
      Observable.fromEvent(window, 'online').mapTo(true);
    
    this.online$=Observable.merge(
      this.isOnline$,
      this.goesOffline$,
      this.goesOnline$
    );
    
    firebase.initializeApp(config);
    this.firebase=firebase;
    this.SERVER_TIMESTAMP=SERVER_TIMESTAMP;
    this.pastebinId=null;
    this.monaco=null;
    this.isFetchPastebinRestored=false;
    this.hasSavedEditorsStates=false;
    this.firecos={ // editorIds as in Firebase: pastebinId/content/editorId (e.g. js)
      'js': {
        ...defaultFireco,
        language: 'javascript',
        editorOptions: {
          glyphMargin: true,
          nativeContextMenu: false,
          hover: true,
        },
        observeMonacoEditorMouseEvents: true
      },
      'html': {
        ...defaultFireco
      }, 'css': {
        ...defaultFireco,
        language: 'css'
      }
    };
    this.jsxColoringProvider=null;
  }
  
  observeDispose() {
    try {
      this.dispose();
      this.saveEditorsStates();
      return Observable.of({type: 'DISPOSE_FULFILLED'});
    } catch (error) {
      
      return Observable.of({type: 'DISPOSE_REJECTED', error: error});
    }
  }
  
  setPastebinId(pastebinId, shouldReplace=false) {
    if (pastebinId && (!this.pastebinId || shouldReplace)) {
      this.pastebinId=pastebinId;
    }
  }
  
  saveEditorsStates() {
    if (!this.pastebinId) {
      return;
    }
    const editorsStates={};
    for (const editorId in this.firecos) {
      // console.log("save", editorId, this.firecos[editorId].monacoEditor.getValue());
      editorsStates[editorId]={
        text: this.firecos[editorId].monacoEditor.getValue(),
        viewState: this.firecos[editorId].monacoEditor.saveViewState()
      };
    }
    localStorage.set(`scr_monacoEditorsSavedStates#${this.pastebinId}`, editorsStates);
    //  console.log("save", JSON.stringify(localStorage.get(`scr_monacoEditorsSavedStates#${this.pastebinId}`)));
  }
  
  restoreEditorsStates(isFetchPastebinRestoration) {
    if (!this.pastebinId) {
      return;
    }
    if (isFetchPastebinRestoration && this.isFetchPastebinRestored) {
      return;
    }
    
    const editorsStates=localStorage.get(`scr_monacoEditorsSavedStates#${this.pastebinId}`);
    if (!editorsStates) {
      return;
    }
    
    this.hasSavedEditorsStates=true;
    
    for (const editorId in this.firecos) {
      if (editorsStates[editorId]) {
        this.firecos[editorId].monacoEditorSavedState=editorsStates[editorId];
      }
    }
    
    this.isFetchPastebinRestored=isFetchPastebinRestoration ? isFetchPastebinRestoration : this.isFetchPastebinRestored;
  }
  
  dispose() {
    if (this.unsubscribeOnIdTokenChanged) {
      this.unsubscribeOnIdTokenChanged();
    }
  }
  
  //todo editor.restoreViewState
  observeConfigureDispatchActions(editorId, dispatchFirecoActions) {
    try {
      this.configureDispatchFirecoActions(editorId, dispatchFirecoActions);
      return Observable.of(configureFirecoActionsFulfilled(editorId));
    } catch (error) {
      return Observable.of(configureFirecoActionsRejected(editorId, error));
    }
  }
  
  configureDispatchFirecoActions(editorId, dispatchFirecoActions) {
    this.firecos[editorId].dispatchFirecoActions=dispatchFirecoActions;
  }
  
  observeAuthPastebin(pastebinToken) {
    this.pastebinToken=pastebinToken;
    if (this.unsubscribeOnIdTokenChanged) {
      this.unsubscribeOnIdTokenChanged();
    }
    
    this.observableAuthPastebin=Observable.create(
      observer => {
        this.unsubscribeOnIdTokenChanged=firebase.auth().onIdTokenChanged(
          user => {
            if (user) {
              observer.next(authPastebinFulfilled(user));
            } else {
              // ignore non-token events
              // return observer.next({type: 'AUTH_SIGN_IN'});
            }
          },
          error => {  // auth error: invalid/expired token
            if (error.code === 'auth/invalid-credential') {
              observer.next(fetchPastebinToken());
            } else {
              observer.next(authPastebinRejected(error));
            }
          }
        );
        //signInWithCustomToken
        firebase.auth().signInWithCustomToken(pastebinToken)
          .then(user => {
              observer.next(authPastebinFulfilled(user));
            }
          )
          .catch(error => {
              observer.next(authPastebinRejected(error));
            }
          );
      }
    );
    return this.observableAuthPastebin;
  }
  
  observerConfigureFirepads(pastebinId) {
    if (!pastebinId) {
      return Observable.of(configureFirepadsRejected('Error: PastebinId was' +
        ' not' +
        ' provided'));
    }
    try {
      const firepadPaths=this.configureFirepads(pastebinId);
      return Observable.of(configureFirepadsFulfilled(firepadPaths));
    } catch (error) {
      return Observable.of(configureFirepadsRejected(error));
    }
  }
  
  configureFirepads(pastebinId) {
    const firepadPaths={};
    
    for (const editorId in this.firecos) {
      const firebasePath=`${dataBaseRoot}/${pastebinId}/firecos/${editorId}`;
      firepadPaths[editorId]=firebasePath;
      this.firecos[editorId].firebasePath=firebasePath;
    }
    return firepadPaths;
  }
  
  observeConfigureMonaco(monaco) {
    try {
      if (monaco) {
        this.monaco=monaco;
        configureMonaco(monaco);
        for (const editorId in this.firecos) {
          let text=this.pastebinId ? '//...loading your code =]' : getDefaultTextForLanguage(editorId);
          //    console.log("this.hasSavedEditorsStates",this.hasSavedEditorsStates);
          if (this.hasSavedEditorsStates) {
            text=this.firecos[editorId].monacoEditorSavedState.text;
          }
          this.firecos[editorId].monacoEditorModel=configureMonacoModel(this.monaco, editorId, text, this.firecos[editorId].language);
        }
        this.jsxColoringProvider=new JSXColoringProvider(monaco);
        return Observable.of(configureMonacoFulfilled());
      } else {
        return Observable.of(configureMonacoRejected('Error: Provide a monaco library reference'));
      }
    } catch (e) {
      return Observable.of(configureMonacoRejected(e));
    }
  }
  
  observeUpdateMonacoModels(initialEditorsTexts) {
    try {
      // console.log("here !", initialEditorsTexts);
      if (initialEditorsTexts) {
        for (const editorId in this.firecos) {
          if (!this.hasSavedEditorsStates
            || this.firecos[editorId].monacoEditorSavedState.text !== initialEditorsTexts[editorId]) {
            this.setEditorText(editorId, initialEditorsTexts[editorId]);
          }
        }
        return Observable.of(configureMonacoModelsFulfilled());
      } else {
        return Observable.of(configureMonacoModelsRejected('Error: no editors texts was provided'));
      }
    } catch (e) {
      return Observable.of(configureMonacoModelsRejected(e));
    }
    
  }
  
  observeConfigureMonacoEditor(editorId, editorDiv, dispatchMouseEvents) {
      if (this.monaco) {
        this.firecos[editorId].dispatchMouseEvents=dispatchMouseEvents;
        try {
          let model=this.firecos[editorId].monacoEditorModel;
          const editorOptions={
            ...this.firecos[editorId].editorOptions
          };
          this.firecos[editorId].monacoEditor=configureMonacoEditor(this.monaco, editorDiv, editorOptions);
          if (this.firecos[editorId].monacoEditorSavedState) {
            this.firecos[editorId].monacoEditor.restoreViewState(this.firecos[editorId].monacoEditorSavedState.viewState);
            this.firecos[editorId].monacoEditorModel.setValue(this.firecos[editorId].monacoEditorSavedState.text);
          }
          this.firecos[editorId].monacoEditor.setModel(model);
          
          // if (this.firecos[editorId].observeMonacoEditorMouseEvents) {
          //   this.firecos[editorId].monacoEditorMouseEventsObservable=configureMonacoEditorMouseEventsObservable(this.firecos[editorId].monacoEditor);
          //   this.firecos[editorId].dispatchMouseEvents(this.firecos[editorId].monacoEditorMouseEventsObservable);
          // }
  
          return Observable.of(loadMonacoEditorFulfilled(editorId));
        } catch (error) {
          return Observable.of(loadMonacoEditorRejected(editorId, error));
        }

      } else {
        return Observable.of(loadMonacoEditorRejected(editorId, 'Error: monaco is not configured. Execute configureMonaco(monaco) first, providing a monaco library reference'));
      }
  }
  
  observerConfigureFireco(editorId) {
    if (this.monaco) {
      try {
        const monacoEditor=this.firecos[editorId].monacoEditor;
        const dispatchFirecoActions=this.firecos[editorId].dispatchFirecoActions;
        configureMonacoEditorWidgets(this.monaco, editorId, monacoEditor);
        const configureGetTextListener=() => {
          this.postMessageGetEditorText(editorId)
        };
        const monacoEditorOnDidChangeModelContentSubject=new Subject();
        const configureSetTextListener=() => {
          const onContentChanged=changes => { //changes object ignored
            monacoEditorOnDidChangeModelContentSubject.next(updatePlayground(editorId, monacoEditor.getValue(), changes));
            const setTextDelay=this.firecos[editorId].ignoreContentChange ? 1000 : 0;
            clearTimeout(this.firecos[editorId].postMessageSetEditorTextTimeout);
            this.firecos[editorId].postMessageSetEditorTextTimeout=
              setTimeout(() => {
                if (this.firecos[editorId].ignoreContentChange) {
                  return;
                }
                this.postMessageSetEditorText(editorId, monacoEditor.getValue());
              }, setTextDelay);
            
            setTimeout(() => {
              this.jsxColoringProvider.colorize(monacoEditor);
            }, 0);
          };
          monacoEditor.onDidChangeModelContent(onContentChanged);
          
          setTimeout(() => {
            this.jsxColoringProvider.colorize(monacoEditor);
          }, 0);
        };
        dispatchFirecoActions(monacoEditorOnDidChangeModelContentSubject, configureGetTextListener, configureSetTextListener, this.getFirecoObservable(), this.setEditorText);
        return Observable.of(configureFirecoFulfilled(editorId));
      } catch (error) {
        return Observable.of(configureFirecoRejected(editorId, error));
      }
    } else {
      return Observable.of(configureFirecoRejected(editorId, 'Error: monaco' +
        ' is not' +
        ' configured. Execute configureMonaco(monaco) first, providing a' +
        ' monaco library reference'));
    }
  }
  
  observeConfigureLiveExpressionStore(editorId, autoLog) {
    const monacoEditor=this.firecos[editorId].monacoEditor;
    this.firecos[editorId].liveExpressionStore=new LiveExpressionStore(this.monaco, editorId, monacoEditor, autoLog);
    
  }
  
  setEditorText=(editorId, text) => {
    if (text === this.firecos[editorId].monacoEditor.getValue()) {
      return;
    }
    // console.log("here?", text);
    this.firecos[editorId].ignoreContentChange=true;
    const viewState=this.firecos[editorId].monacoEditor.saveViewState();
    this.firecos[editorId].monacoEditor.setValue(text);
    this.firecos[editorId].monacoEditor.restoreViewState(viewState);
    this.firecos[editorId].ignoreContentChange=false;
    
  };
  
  getFirecoObservable=() => {
    if (!this.firecoObservable) {
      this.firecoObservable=this.configurePostMessageObservable();
    }
    return this.firecoObservable;
  };
  
  configurePostMessageObservable() {
    return Observable.create(observer => {
      let retries=0;
      const maxRetries=30;
      firecoWorkerReady();
      
      function firecoWorkerReady() {
        if (window.scr && window.scr.firecoWorker) {
          observer.next({type: 'FIRECO_WORKER_READY'});
          window.scr.firecoWorker.onmessage=function (e) {
            observer.next(e.data);
          };
        } else {
          if (retries === maxRetries) {
            observer.next({error:'Fireco worker not found.'});
          } else {
            setTimeout(firecoWorkerReady, (retries++) * 10);
          }
        }
      }
    });
  }
  
  postMessageSetEditorText=(editorId, text) => {
    if (window.scr && window.scr.firecoWorker) {
      const firebasePath=this.firecos[editorId].firebasePath;
      window.scr.firecoWorker.postMessage({
        type: 'SET_TEXT',
        editorId: editorId,
        firebasePath: firebasePath,
        text: text,
        pastebinToken: this.pastebinToken
      });
    }
  };
  
  postMessageGetEditorText=(editorId) => {
    if (window.scr && window.scr.firecoWorker) {
      const firebasePath=this.firecos[editorId].firebasePath;
      window.scr.firecoWorker.postMessage({
        type: 'GET_TEXT',
        editorId: editorId,
        firebasePath: firebasePath,
        pastebinToken: this.pastebinToken
      });
    }
  };
  
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

