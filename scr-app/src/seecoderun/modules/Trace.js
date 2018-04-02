import JSAN from 'jsan';
import {Subject} from "rxjs";
import _ from "lodash";
import {isNode, createObjectIterator, hasChildNodes, copifyDOMNode} from '../../utils/scrUtils';


const obsConfig = {attributes: true, childList: true};

// Callback function to execute when mutations are observed
const obsCallback = function (mutationsList) {
  for (var mutation of mutationsList) {
    if (mutation.type == 'childList') {
      console.log('A child node has been added or removed.');
    }
    else if (mutation.type == 'attributes') {
      console.log('The ' + mutation.attributeName + ' attribute was modified.');
    }
  }
};


const objectIterator = createObjectIterator();

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
    this.startTimestamp = null;
    this.magicTag = null;
    this.window = null;
    this.consoleLog = null;
    this.realConsoleLog = null;
    this.timeline = [];
    this.isValid= false;
  }

  configureWindow(runIframe, autoLogName, preAutoLogName, postAutoLogName) {
    this.startTimestamp = Date.now();
    this.magicTag = `<<[[{{|${this.startTimestamp}|}}]]>>`;
    this.startStack();
    this.setWindowRoots(runIframe.contentWindow);
    runIframe.contentWindow[autoLogName] = this.autoLog;
    runIframe.contentWindow[preAutoLogName] = this.preAutoLog;
    runIframe.contentWindow[postAutoLogName] = this.postAutoLog;
    runIframe.contentWindow.onerror = this.onError;
    runIframe.contentWindow.console.log = this.consoleLog;
    this.domNodesObs = [];
    this.domNodes = [];
    //todo save before dispose
    this.timeline = [];
    this.timelineLength = 0;
    this.subject.next(this.timeline);
    clearInterval(this.tli);
    this.tli = setInterval(() => {
      if (this.timelineLength !== this.timeline.length) {
        this.timelineLength = this.timeline.length;
        this.subject.next([...this.timeline]);
      }
    }, 1000);
    this.isValid= true;
  }

  setWindowRoots(contentWindow) {
    this.realConsoleLog = contentWindow.console.log;
    this.setConsoleLog(contentWindow.console.log);
    this.window = contentWindow;
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

  getWindowRoots = () => {
    let windowRoots = {};
    try {
      windowRoots = {
        window: this.window,
        document: this.window.document,
        body: this.window.document.body,
        log: this.consoleLog,
      };
    } catch (e) {
    }
    return windowRoots;
  };

  getReactKey(i) {
    return `${this.startTimestamp};${i}`;
  }


  getReplacer = (res = {isDOM: false}) => {
    const windowRoots = this.getWindowRoots();
    return (key, value) => {
      const i = Object.values(windowRoots).indexOf(value);
      if (i > -1) {
        return `${this.magicTag}${Object.keys(windowRoots)[i]}`;
      }
      if (isNode(value)) {
        const val = copifyDOMNode(value);
        const domId = this.domNodes.indexOf(value);
        if (domId >= 0) {
          val.liveRef = `${this.magicTag}${domId}`;
        } else {
          this.domNodes.push(value);
          val.liveRef = `${this.magicTag}${this.domNodes.length - 1}`;
          // Create an observer instance linked to the callback function
          const observer = new MutationObserver(obsCallback);
          // Start observing the target node for configured mutations
          observer.observe(value, obsConfig);
          this.domNodesObs.push(observer);
        }
        res.isDOM = true;
        return val;
      }
      return value;
    };
  };

  parseLiveRefs = (data, hideLiveRefs) => {
    let liveRef = this.reinstateLiveRef(data);
    if ((!liveRef.isReinstate) && _.isObjectLike(data)) {
      if (_.isArrayLike(data)) {
        for (const i in data) {
          const aLiveRef = this.reinstateLiveRef(data[i]);
          (aLiveRef.isReinstate) && (data[i] = (hideLiveRefs ? aLiveRef.hiddenMessage : aLiveRef.ref));
        }
      } else {
        for (const i in Object.values(data)) {
          const aLiveRef = this.reinstateLiveRef(data[i]);
          (aLiveRef.isReinstate) && (data[Object.keys(data)[i]] = (hideLiveRefs ? aLiveRef.hiddenMessage : aLiveRef.ref));
        }
      }
    }
    return {
      isLive: liveRef.isLive || liveRef.isReinstate,
      data: liveRef.isReinstate ? (hideLiveRefs ? liveRef.hiddenMessage : liveRef.ref) : data,
    };
  };

  reinstateLiveRef = (data) => {
    const windowRoots = this.getWindowRoots();

    let liveRefId = _.isString(data) && data.startsWith(this.magicTag) ? data.replace(this.magicTag, '') : null;

    let index = Object.values(windowRoots).indexOf(data);
    const windowRoot = index < 0 && liveRefId ? liveRefId : null;
    let liveRef = windowRoots[windowRoot];

    if (!liveRef && this.domNodes) {
      index = this.domNodes.indexOf(data);
      if (index < 0 && liveRefId) {
        const domId = parseInt(liveRefId);
        liveRef = this.domNodes[domId];
      }
    } else {
      liveRefId = windowRoot;
    }

    return {
      isLive: index > -1,
      isReinstate: !!liveRef,
      refId: liveRefId,
      hiddenMessage: `[${liveRefId}]:live expression disabled`,
      ref: liveRef,
    };
  };

  pushEntry = (pre, value, post, type, extra, extraIds) => {
    let dataType = 'jsan';
    let res = {};
    const data = JSAN.stringify(value, this.getReplacer(res), null, true);
    let objectClassName = value && value.constructor && value.constructor.name;
    //this.subject.next({id: pre.id, loc: this.locationMap[pre.id].loc, dataType: dataType, data: data});
    const i = this.timeline.length;
    const expression = this.locationMap[pre.id];
    this.timeline.unshift({
      ...pre,
      i: i,
      reactKey: this.getReactKey(i),
      loc: expression.loc,
      expressionType: expression.expressionType,
      dataType: dataType,
      data: data,
      isDOM: res.isDOM,
      objectClassName: objectClassName,
      timestamp: Date.now()
    });
  };

  composedExpressions = {
    MemberExpression: (pre, value, post, type, extra, extraIds) => {
      this.pushEntry({id: extraIds[0]}, value, post, type, extra);
      this.pushEntry({id: extraIds[1]}, extra, post, type, extra);
      return value[extra];
    },
    // BinaryExpression: (ast, locationMap, getLocationId, path) => {
    // },
    // CallExpression: (ast, locationMap, getLocationId, path) => {
    // },
    // NewExpression: (ast, locationMap, getLocationId, path) => {
    // },
    // FunctionExpression: (ast, locationMap, getLocationId, path) => {
    // },
  };

  autoLog = (pre, value, post, type, extra, extraIds) => {
    //console.log(pre, value, post, type, extra, extraIds);
    if (this.composedExpressions[type]) {
      value = Trace.ComposedExpressions[type](pre, value, post, type, extra, extraIds);
    } else {
      //blocks
    }
    this.pushEntry(pre, value, post, type, extra);
    return {_: value};
  };

  preAutoLog = (id) => {
    this.currentExpressionId = id;
    this.currentScope = this.currentScope.enterScope(id);
    return {id};
  };

  postAutoLog = (id) => {
    //console.log(id, JSAN.parse(JSAN.stringify(this.rootScope)));
    //this.locateStack(this.getCurrentStackIds());
    this.currentScope = this.currentScope.exitScope(id);
    return {id: id};
  };

  onError = error => {
    let i = this.timeline.length;
    const expression = this.locationMap[this.currentExpressionId];
    this.timeline.unshift({
      i: i,
      reactKey: this.getReactKey(i),
      isError: true,
      id: this.currentExpressionId,
      loc: expression.loc,
      expressionType: expression.expressionType,
      data: JSAN.stringify(error, null, null, true),
      timestamp: Date.now(),
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
