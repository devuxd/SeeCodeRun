import JSAN from 'jsan';
import {Subject} from "rxjs";

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

  autoLog = (pre, value, post) => {
    // console.log({
    //   type: 'TRACE',
    //   action: {
    //     loc: this.locationMap[pre.id].loc,
    //     id: pre.id,
    //     data: JSAN.stringify(value)
    //   }
    // });
    this.subject.next({id: pre.id, loc: this.locationMap[pre.id].loc, data: JSAN.stringify(value)});
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
    console.log({
      type: 'POST-TRACE',
      action: {
        id: id,
      }
    });
    return {id: id};
  };

  onError = error => {
    this.subject.next({
      id: this.currentExpressionId,
      loc: this.locationMap[this.currentExpressionId].loc,
      data: JSAN.stringify(error),
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
    return this.consoleLog;
  }
}

export default Trace;
