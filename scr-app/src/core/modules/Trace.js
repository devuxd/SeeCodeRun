import {Subject} from 'rxjs';
import isString from 'lodash/isString';
import isObjectLike from 'lodash/isObjectLike';
import isArrayLike from 'lodash/isArrayLike';
import {copifyDOMNode, isNode} from '../../utils/scrUtils';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';

import JSEN from '../../utils/JSEN';
import ClassFactory from './ClassFactory';
import {NavigationTypes} from './AutoLogShift';

export const MAGIC_TAG = `@$.@`;

let listener = null;
export const listen = (lis) => {
   listener = lis;
};

let dispatcher = null;
const ignoreTags = ['style'];

export const TraceActions = {
   log: 'log',
   evaluate: 'evaluate',
   evaluateCommand: 'evaluateCommand',
   evaluateResult: 'evaluateResult',
   evaluateError: 'evaluateError'
};

let consoleClear = null;
export const clearConsole = () => consoleClear?.();

let isPreserveLogs = false;
let preservedLogs = [];
export const preserveLogs = (shouldPreserve) => {
   isPreserveLogs = shouldPreserve;
};

let isIgnoreObjectPrivateProperties = true;
export const ignoreObjectPrivateProperties = (shouldIgnore) => {
   isIgnoreObjectPrivateProperties = shouldIgnore;
};

export const canDispatch = () => !!dispatcher;

export const dispatch = (action = {}) => {
   switch (action.type) {
      case TraceActions.evaluate:
         // console.log(listener, dispatcher, action);
         try {
            listener?.(TraceActions.evaluateCommand, action.command);
            dispatcher && listener?.(
               TraceActions.evaluateResult,
               dispatcher(action.command)
            );
         } catch (e) {
            listener?.(TraceActions.evaluateError, e);
         }
         
         break;
      default:
         console.log('No action type');
   }
};

let haltingTimeout = 5000;

export const configurehaltingTimeout = (haltingTimeoutInMs) => {
   haltingTimeout = haltingTimeoutInMs;
};

const obsConfig = {attributes: true, childList: true};

// Callback function to execute when mutations are observed
const obsCallback = function (mutationsList) {
   for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
         //   console.log('A child node has been added or removed.');
      } else if (mutation.type === 'attributes') {
         //     console.log('The '
         //     + mutation.attributeName + ' attribute was modified.');
      }
   }
};


// const objectIterator = createObjectIterator();

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
   constructor(locationMap, deps) {
      this.locationMap = locationMap;
      this.deps = deps;
      this.currentScope = null;
      this.rootScope = null;
      this.subject = new Subject();
      this.currentExpressionId = null; // program
      this.currentCallExpressionId = null; // program
      this.startTimestamp = null;
      this.window = null;
      this.consoleLog = null;
      this.realConsoleLog = null;
      this.timeline = [];
      if (isPreserveLogs) {
         this.logs = preservedLogs;
      } else {
         this.logs = [];
         preservedLogs = this.logs;
      }
      
      this.branches = [];
      this.haltingCase = null;
      this.mainLoadedTimelineI = 0;
      this.dataRefs = [];
      this.dataRefMatches = [];
      this.funcRefs = [];
      this.funcRefMatches = [];
      this.isValid = false;
      listener = null;
      dispatcher = null;
      consoleClear = null;
   }
   
   nextTick() {
      this.subject.next({
         timeline: [...this.timeline],
         logs: [...this.logs],
         mainLoadedTimelineI: this.mainLoadedTimelineI,
      });
   }
   
   configureWindow(runIframe, autoLogName, preAutoLogName, postAutoLogName) {
      console.log("LEGACY?");
      this.startTimestamp = Date.now();
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
      if (isPreserveLogs) {
         this.logs = preservedLogs;
      } else {
         this.logs = [];
         preservedLogs = this.logs;
      }
      this.timelineLength = 0;
      this.timeline = [];
      this.branches = [];
      this.mainLoadedTimelineI = 0;
      this.dataRefs = [];
      this.dataRefMatches = [];
      this.funcRefs = [];
      this.funcRefMatches = [];
      // this.subject
      // .next({timeline: [...this.timeline], logs: [...this.logs]});
      clearInterval(this.tli);
      this.lastTickTimestamp = Date.now();
      this.tli = setInterval(
         () => {
            this.lastTickTimestamp = Date.now();
            if ((this.timeline.length || this.logs.length) &&
               (this.timelineLength !== this.timeline.length
                  || this.logsLength !== this.logs.length)) {
               this.timelineLength = this.timeline.length;
               this.logsLength = this.logs.length;
               this.nextTick();
            }
         },
         1000
      );
      
      const wAlert = runIframe.contentWindow.alert;
      runIframe.contentWindow.alert = (...params) => {
         const r = wAlert(...params);
         this.lastTickTimestamp = Date.now();
         return r;
      };
      const wConfirm = runIframe.contentWindow.confirm;
      runIframe.contentWindow.confirm = (...params) => {
         const r = wConfirm(...params);
         this.lastTickTimestamp = Date.now();
         return r;
      };
      const wPrompt = runIframe.contentWindow.prompt;
      runIframe.contentWindow.prompt = (...params) => {
         const r = wPrompt(...params);
         this.lastTickTimestamp = Date.now();
         return r;
      };
      this.isValid = true;
      dispatcher = runIframe.contentWindow['eval'];
      const context = this;
      listener = function (actionType, ...params) {
         let i = context.logs.length;
         const isError = actionType === TraceActions.evaluateError;
         const isResult = actionType === TraceActions.evaluateResult;
         
         params = isError ?
            [
               ClassFactory.fromErrorClassName(
                  params[0].name,
                  params[0].message
               )
            ]
            : params;
         let timelineI = context.timeline.length;
         context.logs.push({
            i: i,
            timelineI,
            reactKey: context.getReactKey(i),
            traceAction: actionType,
            isLog: false,
            isError,
            isResult,
            data: params,
            timestamp: Date.now(),
         });
      };
      
      consoleClear = () => {
         this.logs = [];
         preservedLogs = this.logs;
      };
      
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
            console: this.window.console,
         };
      } catch (e) {
      }
      return windowRoots;
   };
   
   getReactKey(i) {
      return `${this.startTimestamp};${i}`;
   }
   
   setDomNodeAdded(callback) {
      this.domNodeAdded = callback;
   }
   
   onDomNodeAdded() {
      this.domNodeAdded?.([...(this.domNodes || [])]);
   }
   
   getReplacer = (
      res// = {isDOM: false, isOutput: false, outputRefs: []}
   ) => {
      const windowRoots = this.getWindowRoots();
      return (key, value) => {
         if (isIgnoreObjectPrivateProperties &&
            isString(key) &&
            key.startsWith('_')) {
            return undefined;// ignoring libraries private data
         }
         const i = Object.values(windowRoots).indexOf(value);
         if (i > -1) {
            JSEN.replacer(null, `${MAGIC_TAG}${Object.keys(windowRoots)[i]}`);
         }
         if (isNode(value)) {
            res.isOutput = !ignoreTags.includes(
               (value.tagName || '').toLowerCase()
            );
            const val = copifyDOMNode(value);
            const domId = this.domNodes.indexOf(value);
            if (domId >= 0) {
               val.liveRef = `${MAGIC_TAG}${domId}`;
            } else {
               // console.log('ref', value.tagName,res, value);
               this.domNodes.push(value);
               val.liveRef = `${MAGIC_TAG}${this.domNodes.length - 1}`;
               // Create an observer instance linked to the callback function
               const observer = new MutationObserver(obsCallback);
               // Start observing the target node for configured mutations
               observer.observe(value, obsConfig);
               this.domNodesObs.push(observer);
            }
            res.isDOM = true;
            res.outputRefs = res.outputRefs || [];
            res.outputRefs.push(value);
            this.onDomNodeAdded();
            return JSEN.replacer(null, val);;
         }
         return JSEN.replacer(key, value);
      };
   };
   
   parseLiveRefs = (data, hideLiveRefs) => {
      let liveRef = this.reinstateLiveRef(data);
      //const liveRefs
      if ((!liveRef.isReinstate) && isObjectLike(data)) {
         if (isArrayLike(data)) {
            for (const i in data) {
               const aLiveRef = this.reinstateLiveRef(data[i]);
               if (aLiveRef.isReinstate) {
                  data[i] = hideLiveRefs ?
                     aLiveRef.hiddenMessage
                     : aLiveRef.ref;
               }
            }
         } else {
            for (const i in Object.values(data)) {
               const aLiveRef = this.reinstateLiveRef(data[i]);
               if (aLiveRef.isReinstate) {
                  data[Object.keys(data)[i]] = hideLiveRefs ?
                     aLiveRef.hiddenMessage
                     : aLiveRef.ref;
               }
            }
         }
      }
      return {
         isLive: liveRef.isLive || liveRef.isReinstate,
         liveRef,
         data: liveRef.isReinstate ? hideLiveRefs ?
            liveRef.hiddenMessage
            : liveRef.ref
            : data,
      };
   };
   
   reinstateLiveRef = (data) => {
      const windowRoots = this.getWindowRoots();
      
      let liveRefId = isString(data) && data.startsWith(MAGIC_TAG) ?
         data.replace(MAGIC_TAG, '')
         : null;
      
      let index = Object.values(windowRoots).indexOf(data);
      const windowRoot = index < 0 && liveRefId ? liveRefId : null;
      let liveRef = windowRoots[windowRoot];
      
      if (!liveRef && this.domNodes) {
         index = this.domNodes.indexOf(data);
         if (index < 0 && liveRefId) {
            const domId = parseInt(liveRefId, 10);
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
   
   pushEntry = (pre, value, post, type, refId) => {
      if (this.funcRefs && this.funcRefs[refId] === this.consoleLog) {
         return;
      }
      let dataType = 'jsan';
      let res = {isDOM: false, isOutput: false, outputRefs: []};
      const data = JSEN.stringify(value, this.getReplacer(res), null, true);
      //this.subject.next({id: pre.id, loc: this.locationMap[pre.id].loc, dataType: dataType, data: data});
      const i = this.timeline.length;
      const expression = this.locationMap[pre.id];
      const parentExpression = expression ? this.locationMap[expression.parentId] : null;
      if (!expression) {
         return;
      }
      
      const dataRefId = this.funcRefs.indexOf(value);
      if (isObjectLike(value) && !isString(value)) {
         if (dataRefId < 0) {
            this.dataRefs.push(value);
            this.dataRefMatches.push({[pre.id]: 1});
         } else {
            this.dataRefMatches[dataRefId][pre.id] = (this.dataRefMatches[dataRefId][pre.id] || 0) + 1;
         }
         
      }
      
      this.timeline.unshift({
         ...pre,
         i,
         reactKey: this.getReactKey(i),
         expression,
         parentExpression,
         loc: expression.loc,
         expressionType: expression.expressionType,
         value,
         dataType,
         data,
         isDOM: res.isDOM,
         isOutput: res.isOutput,
         outputRefs: res.outputRefs,
         objectType: JSEN.getObjectType(value),
         objectClassName: JSEN.getObjectClassName(value),
         timestamp: Date.now(),
         dataRefId,
         funcRefId: refId,
      });
   };
   
   getMatches = (funcRefId, dataRefId, calleeId) => {
      const calleeLoc = calleeId && this.locationMap[calleeId] ? this.locationMap[calleeId].loc : null;
      
      const funcMatches =
         Object.keys(this.funcRefMatches[funcRefId] || {}).map(key => this.locationMap[key].loc);
      if (funcMatches.length) {
         if (calleeLoc) {
            funcMatches.push(calleeLoc);
         }
         return funcMatches;
      } else {
         const dataMatches =
            Object.keys(this.dataRefMatches[dataRefId] || {}).map(key => this.locationMap[key].loc);
         if (dataMatches.length) {
            if (calleeLoc) {
               dataMatches.push(calleeLoc);
            }
            return dataMatches;
         } else {
            if (calleeLoc) {
               return [calleeLoc];
            } else {
               return null;
            }
         }
      }
   };
   
   findPreviousOccurrence = (id) => {
      for (let i = this.timeline.length - 1; i > -1; i--) {
         if (this.timeline[i].id === id) {
            return this.timeline[i];
         }
      }
      return null;
   };
   
   composedExpressions = {
      MemberExpression: (pre, value, post, type, extraIds, areNew, extraValues) => {
         const objectData =
            areNew[0] ? extraValues[0] : extraIds[0] !== 'null' ?
               this.findPreviousOccurrence(extraIds[0]).value : value;
         const propertyData = areNew[1] ? extraValues[1] : this.findPreviousOccurrence(extraIds[1]).value;
         // console.log('MemberExpression', objectData, propertyData, objectData[propertyData]);
         // console.log(pre, value, post, type, extraIds, areNew, extraValues);
         areNew[0] && this.pushEntry({id: extraIds[0]}, objectData, post, type);
         areNew[1] && !isString(propertyData) && this.pushEntry({id: extraIds[1]}, propertyData, post, type);
         if (objectData === undefined || objectData === null) {
            const errorMessage = `: accessing property of invalid reference: ${objectData}`;
            this.pushEntry({
               id: extraIds[0], isError: true, errorMessage: errorMessage,
               errorLoc: this.locationMap[extraIds[0]].loc
            }, objectData, post, type);
            throw errorMessage;
         }
         
         if (propertyData === undefined || propertyData === null ||
            propertyData === 'undefined' || propertyData === 'null') {
            const errorMessage = `: referencing invalid property: ${propertyData}`;
            this.pushEntry(
               {
                  id: extraIds[1],
                  isError: true,
                  errorMessage: errorMessage,
                  errorLoc: this.locationMap[extraIds[1]].loc
               }, propertyData, post, type);
            throw errorMessage;
         }
         // console.log('MemberExpression', objectData[propertyData]("x"));
         return objectData[propertyData];
         // value;
         //  console.log('MemberExpression', this.timeline);
         
      },
      BinaryExpression: (pre, value, post, type, extraIds, areNew, extraValues) => {
         const leftData = areNew[0] ? extraValues[0] : this.findPreviousOccurrence(extraIds[0]).value;
         const rightData = areNew[1] ? extraValues[1] : this.findPreviousOccurrence(extraIds[1]).value;
         areNew[0] && this.pushEntry({id: extraIds[0]}, leftData, post, type);
         areNew[1] && this.pushEntry({id: extraIds[1]}, rightData, post, type);
         //  return value;
      },
      CallExpression: (pre, value, post, type, extraIds, areNew, extraValues) => {
         //console.log(pre, value, post, type, extraIds, areNew, extraValues);
         let funcRefId = this.funcRefs.indexOf(extraValues[0]);
         if (funcRefId < 0) {
            funcRefId = this.funcRefs.length;
            this.funcRefs.push(extraValues[0]);
            this.funcRefMatches.push({[pre.id]: 1});
         } else {
            this.funcRefMatches[funcRefId][pre.id] = (this.funcRefMatches[funcRefId][pre.id] || 0) + 1;
         }
         return funcRefId;
      },
      VariableDeclarator: (pre, value, post, type, extraIds, areNew, extraValues) => {
         const rightData = value;
         // areNew[0] && this.pushEntry({id: extraIds[0]}, leftData, post, type);
         //f
         // console.log('trace vd',pre, value, post, type, extraIds, areNew, extraValues);
         areNew[1] && this.pushEntry({id: extraIds[0]}, rightData, post, type);
         //  return value;
      },
      // NewExpression: (ast, locationMap, getLocationId, path) => {
      // },
      // FunctionExpression: (ast, locationMap, getLocationId, path) => {
      // },
   };
   prev_ = null;
   this_ = null;
   autoLog = (pre, value, post, type, extraIds, areNew, extraValues) => {
      // let c = this.checkNonHaltingLoop(this.timeline.length>10);
      //  console.log(pre.id, value);
      // console.log(pre, value, post, type, extraIds, areNew, extraValues);
      let refId = null;
      let push = true;
      if (this.composedExpressions[type]) {
         // console.log(type, pre, value, post, type, extraIds, areNew, extraValues);
         refId = this.composedExpressions[type](pre, value, post, type, extraIds, areNew, extraValues);
      } else {
         if (type === 'BlockStatement') {
            const expression = this.locationMap[pre.id] || {};
            const e = pre.type === 'CatchClause' && expression.extraLocs ? {
               ...expression.extraLocs.tryLocs.e,
               data: this.stringifyE(extraIds[0], true)
            } : null;
            // console.log('b', e, pre, value, post, type, extraIds, areNew, extraValues);
            
            // console.log('e',expression, pre, this.locationMap[pre.secondaryId]);
            this.branches.push({
               ...pre,
               loc: expression.loc,
               blockLoc: expression.blockLoc,
               timelineI: this.timeline.length,
               expression,
               e
            });
            push = false;
            
            if (pre.navigationType === NavigationTypes.Local) {
               
               if (pre.startTimestamp - this.lastTickTimestamp > haltingTimeout) {
                  const confirmed =
                     window
                        .confirm(
                           `The script spent more than ${haltingTimeout} ms within a loop.
                                 Do you want to stop it?`
                        );
                  if (confirmed) {
                     throw  ClassFactory
                        .fromErrorClassName(
                           'HaltingError',
                           `The script spent more than ${haltingTimeout} ms within a loop.`,
                        );
                  } else {
                     this.lastTickTimestamp = Date.now();
                  }
               }
            }
         }
      }
      push && this.pushEntry(pre, value, post, type, refId);
      pre.pushArgs();
      
      // clearTimeout(this.fff);
      // this.fff = setTimeout(() => {
      //     console.log('t', this.timeline);
      // }, 1000);
      
      let fValue = value;
      this.prev_ =
         type === 'MemberExpression' && extraValues && extraValues.length > 1 && extraValues[0] ?
            extraValues[0] : this.prev_;
      if (isFunction(fValue)) {
         if (this.this_) {
            fValue = fValue.bind(this.this_);
            this.this_ = null;
         } else {
            fValue = fValue.bind(this.prev_);
            this.prev_ = null;
         }
      }
      
      if (type === 'MemberExpression' && !isFunction(fValue)) {
         this.this_ = value;
      }
      
      return {_: fValue};
   };
   
   preAutoLog = (id, type, secondaryId, navigationType, args, argsIds, blockName) => {
      const startTimestamp = Date.now();
      let calleeId = null;
      // console.log(id, type, blockName);
      if (type === 'CallExpression') {
         this.currentCallExpressionId = id;
      }
      
      let pushArgs = () => {
      };
      if (args) {
         calleeId = this.currentCallExpressionId;
         // console.log('c', calleeId);
         pushArgs = () => {
            argsIds.forEach((argsId, i) => {
               this.pushEntry({
                  id: argsId,
                  startTimestamp
               }, args[i]);
            });
            //console.log(id, type, secondaryId, navigationType, args, argsIds);
         };
      }
      
      this.currentExpressionId = id;
      this.currentScope = this.currentScope.enterScope(id);
      return {
         id,
         type,
         secondaryId,
         navigationType,
         calleeId,
         startTimestamp,
         blockName,
         pushArgs
      };
   };
   
   postAutoLog = (id) => {
      //console.log(id, JSAN.parse(JSAN.stringify(this.rootScope)));
      //this.locateStack(this.getCurrentStackIds());
      this.currentScope = this.currentScope.exitScope(id);
      return {id: id};
   };
   
   onMainLoaded = () => {
      this.mainLoadedTimelineI = this.timeline.length;
      const windowDispatcher = dispatcher;
      dispatcher = command => windowDispatcher(`window.scrLoader.moduleEval('${command}')`);
      this.lastTickTimestamp = Date.now();
      this.nextTick();
      
   };
   
   onError = (errors /*, isBundlingError*/) => {
      //todo runtime errors
      let expression = this.locationMap[this.currentExpressionId] || {};
      if (!isArray(errors)) {
         errors = [errors];
      }
      // if (!isBundlingError) {
      errors.reverse().forEach(error => {
         let depName = null;
         const neededByMatches = /needed by: (.+)/.exec(error.message);
         if (neededByMatches) {
            depName = neededByMatches[1];
         } else {
            const depMatches = /"(.+)"/.exec(error.message);
            if (depMatches) {
               depName = depMatches[1];
            }
         }
         const depInfo = this.deps.dependenciesInfo.find(dep => dep.name === depName);
         let errorEntry = null;
         let i = this.timeline.length;
         if (depInfo) {
            const depLocs = this.locationMap[depInfo.id];
            
            errorEntry = {
               i,
               reactKey: this.getReactKey(i),
               isError: true,
               id: depInfo.id,
               loc: depLocs.expressionLoc,
               expressionType: depInfo.expressionType,
               data: this.stringifyE(error),
               timestamp: Date.now(),
            }
         } else {
            errorEntry = {
               i,
               reactKey: this.getReactKey(i),
               isError: true,
               id: this.currentExpressionId,
               loc: expression.loc,
               expressionType: expression.expressionType,
               data: this.stringifyE(error),
               timestamp: Date.now(),
            }
         }
         
         this.timeline.unshift(errorEntry);
      });
      
      // } else {
      //     let i = this.timeline.length;
      //     errors = errors.map(this.stringifyE);
      //
      //     errors = errors.length === 1 ? errors[0] : errors;
      //
      //     this.timeline.unshift();
      // }
      // console.log('errors', errors, this.timeline[0]);
      
      
   };
   stringifyE = (error, isE) => {
      //  console.log(error);
      if (isE) {
         return ClassFactory
            .fromErrorClassName(error.name || error.constructor.name, error.message);
      }
      switch (error.requireType) {
         case 'require':
            return ClassFactory
               .fromErrorClassName(error.name || error.constructor.name, error.message);
         default:
            if (error.requireModules && error.requireModules.length) {
               return ClassFactory.fromErrorClassName('DependencyError',
                  `The following dependencies were not found online:
                                                     ${error.requireModules.toString()}.
                                                      Please check your code bundling configuration.`);
            } else {
               return ClassFactory.fromErrorClassName('undefined', JSON.stringify(error));
            }
      }
   };
   
   setConsoleLog = (/*log*/) => {
      let context = this;
      this.consoleLog = function (...params) {//type, info = {}, params = []
         let i = context.logs.length;
         let timelineI = context.timeline.length;
         const expression = context.locationMap[context.currentCallExpressionId] || {};
         context.logs.push({
            i,
            timelineI,
            traceAction: TraceActions.log,
            isLog: true,
            reactKey: context.getReactKey(i),
            id: context.currentCallExpressionId,
            loc: expression.loc,
            expressionType: expression.expressionType,
            data: params,
            timestamp: Date.now(),
         });
         // console.log(context.logs);
         // log(...params);
         // if (type === 'SCR_LOG' && info.location) {
         //     // store.dispatch();
         //     log(["SCR", ...arguments]);
         // } else {
         //     log(["clg", ...arguments]);
         // }
      };
   };
   
   // checkNonHaltingLoop = async (loopCount) => {
   //     console.log(loopCount);
   //     if (loopCount) {
   //         let cancel = await this.resolveAfter2Seconds(true);
   //         if (cancel) {
   //             throw 'Boom';
   //         }
   //     } else {
   //         console.log('noy');
   //
   //         await 0;
   //     }
   //     await 0;
   // };
   
}

export default Trace;
