import JSAN from 'jsan';
import {Subject} from "rxjs";
import {autoLogName, postAutoLogName, preAutoLogName} from "./AutoLog";
import _ from "lodash";

class Scope {
  constructor(parent, id) {
    this.parent = parent;
    this.id = id;
    this.state = 'entered';
    this.scopes = [];
    this.isLocal = false;
    this.localId = null;
  }

  enterScope(id) {
    const newScope = new Scope(this, id);
    this.scopes.push(newScope);
    return newScope;
  }

  exitScope(id) {
    if (this.id !== id) {
      // console.log("errrror", id);
    }
    if (!this.scopes.length) {
      this.state = 'exited';
      return this.parent;
    }
    return this.scopes.pop();
  }

}

class Trace {
  constructor(locationMap) {
    this.locationMap = locationMap;
    this.currentScope = null;
    this.rootScope = null;
    this.subject = new Subject();
    this.currentExpressionId = null; // program
    this.windowRoots = null;
    this.startTimestamp = null;
  }

  configureWindow(runIframe, autoLogName, preAutoLogName, postAutoLogName) {
    this.startTimestamp = Date.now();
    this.startStack();
    this.setWindowRoots(runIframe.contentWindow);
    runIframe.contentWindow[autoLogName] = this.autoLog;
    runIframe.contentWindow[preAutoLogName] = this.preAutoLog;
    runIframe.contentWindow[postAutoLogName] = this.postAutoLog;
    runIframe.contentWindow.onerror = this.onError;
    runIframe.contentWindow.console.log = this.consoleLog;
  }

  setWindowRoots(contentWindow) {
    this.windowRoots = {};
    this.windowRoots.consoleLog = contentWindow.console.log;
    this.setConsoleLog(contentWindow.console.log);
    this.windowRoots.window = contentWindow;
    this.windowRoots.document = contentWindow.document;
    this.windowRoots.documentBody = contentWindow.document.body;
  }


  getData(id) {
    return {id: id};
  }

  subscribe(callback) {
    this.unsubsubscribe = this.subject.subscribe(callback);
  }

  unsubscribe() {
    if (this.subject) {
      this.subject.complete();
    }
  }

  getCurrentStackIds() {
    const stack = [];
    let current = this.currentScope;

    do {
      stack.unshift(current.id);
      current = current.parent;
    } while (current);

    return stack;
  }

  locateStack(stack) {
    console.log('>>>>>>>>>>>>>');//, this.locationMap, stack);
    for (const i in stack) {
      if (stack[i] >= 0) {
        console.log(i, this.locationMap[stack[i]].loc);
      } else {
        console.log(i, 'root');
      }
    }

  }

  startStack() {
    this.rootScope = this.currentScope = new Scope(null, -1);
  }

  replacer = (key, value) => {
    const i = Object.values(this.windowRoots).indexOf(value);
    if (i > -1) {
      return `<<[[{{||}}]]>>${Object.keys(this.windowRoots)[i]}`;
    }
    return value;
  };

  getLiveRef=(data)=>{
    const windowRoot = _.isString(data) && data.startsWith('<<[[{{||}}]]>>') ? data.replace('<<[[{{||}}]]>>', '') : null;
    return this.windowRoots[windowRoot];
  };

  autoLog = (pre, value, post) => {
    // console.log({
    //   type: 'TRACE',
    //   action: {
    //     loc: this.locationMap[pre.id].loc,
    //     id: pre.id,
    //     data: JSAN.stringify(value)
    //   }
    // });
    let dataType = 'jsan';
    const data = JSAN.stringify(value, this.replacer, null, true);
    this.subject.next({id: pre.id, loc: this.locationMap[pre.id].loc, dataType: dataType, data: data});
    return value;
  };

  preAutoLog = (id) => {
    this.currentExpressionId = id;
    this.currentScope = this.currentScope.enterScope(id);
    // console.log({
    //   type: 'PRE-TRACE',
    //   action: {
    //     id: id,
    //   }
    // });
    return {id: id};
  };

  postAutoLog = (id) => {
    //console.log(id, JSAN.parse(JSAN.stringify(this.rootScope)));
    //this.locateStack(this.getCurrentStackIds());
    this.currentScope = this.currentScope.exitScope(id);
    return {id: id};
  };

  onError = error => {
    this.subject.next({
      id: this.currentExpressionId,
      loc: this.locationMap[this.currentExpressionId].loc,
      data: JSAN.stringify(error, null, null, true),
      isError: true
    });
  };

  setConsoleLog = log => {
    this.consoleLog = function (type, info = {}, params = []) {
      if (type === 'SCR_LOG' && info.location) {
        // store.dispatch();
      } else {
        log(["clg", ...arguments]);
      }

    };
  }
}

export default Trace;
