import {TraceEvents, makeError, ScopeTypes, ALEObject} from "./ALE";
import JSEN from "../../utils/JSEN";
import isNil from "lodash/isNil";
import isString from "lodash/isString";
import isObject from "lodash/isObject";

import isFunction from "lodash/isFunction";
import {copifyDOMNode, isNativeCaught, isNode} from "../../utils/scrUtils";
import {createALEObjectNodeRenderer} from "../../components/ObjectExplorer";
import {isArrayLikeObject, isObjectLike} from "lodash";

const MutationObserver =
   global.MutationObserver ?? global.WebKitMutationObserver ?? global.MozMutationObserver;

const MutationObserverConfig = {
   attributes: true, childList: true, subtree: false
};

// Callback function to execute when mutations are observed
const MutationObserverCallback = function (mutationsList) {
   for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
         //   console.log('A child node has been added or removed.');
      } else if (mutation.type === 'attributes') {
         //     console.log('The '
         //     + mutation.attributeName + ' attribute was modified.');
      }
   }
};

// export const liveStringify = (value, testFunc, prop, globalRefs, localRefs) => {
//    if (!(testFunc && prop && globalRefs && localRefs && testFunc(value))) {
//       return null;
//    }
//
//    let i = globalRefs.indexOf(value);
//    if (i < 0) {
//       i = globalRefs.push(value) - 1;
//    }
//    const j = localRefs.push(value) - 1;
//    return JSEN.replacer(
//       null,
//       `${
//          ALEJSEN.MAGIC_TAG
//       }${prop}${ALEJSEN.MAGIC_TAG}${i}${ALEJSEN.MAGIC_TAG}${j}`
//    );
// };
//
// let liveReplacer = liveStringify(_value, isScrObject, prop, _scrObject, result[`${prop}Refs`]);

export class ALEJSEN {
   static MAGIC_TAG = `@$.@`;
   timestamp = null;
   _scrObject = null;
   _scrObjectRef = null;
   isIgnoreObjectPrivateProperties = false;
   ignoreTags = false;
   
   _replacer = null;
   _reviver = null;
   
   _natives = [];
   _domNodes = [];
   _domNodesObs = [];
   _functions = [];
   _objects = [];
   _windowRoots = {};
   
   onDomNodeAdded = (domNodeAdded, domNodes) => {};
   
   scrObject = () => {
      return this._scrObject;
   };
   
   isScrObject = (ref) => {
      return !!this._scrObjectRef && this._scrObjectRef === ref;
   };
   
   windowRoots = (windowRoots) => {
      if (windowRoots) {
         this._windowRoots = {...this._windowRoots, ...windowRoots};
      }
      return this._windowRoots;
   };
   
   natives = () => {
      return this._natives;
   };
   
   functions = () => {
      return this._functions;
   };
   
   objects = () => {
      return this._objects;
   };
   
   domNodes = () => {
      return this._domNodes;
   };
   
   domNodesObs = () => {
      return this._domNodesObs;
   };
   
   replacer = () => {
      return this._replacer;
   };
   
   reviver = () => {
      return this._reviver;
   };
   
   constructor(
      scrObject,
      isIgnoreObjectPrivateProperties = true,
      ignoreTags = ['style'],
   ) {
      this._scrObject = [scrObject];
      this._scrObjectRef = scrObject;
      this.isIgnoreObjectPrivateProperties = isIgnoreObjectPrivateProperties;
      this.ignoreTags = ignoreTags;
      this.timestamp = Date.now();
   }
   
   parse = (text, reviver, result) => {
      this._reviver = reviver = reviver ?? ((key, value) => {
         if (typeof value === "string" && value.startsWith(ALEJSEN.MAGIC_TAG)) {
            const [, prop, i, j] = value.split(ALEJSEN.MAGIC_TAG);
            const ref = result[`${prop}Refs`][j];
            const liveRefI = result.addLiveRef(ref);
            if (prop === 'domNodes') {
               const domRef = ref?.getSnapshot();
               result.addDomLiveRef(domRef, liveRefI);
               return domRef;
            }
            return ref;
         }
         return JSEN.reviver(key, value);
      });
      
      if (typeof text === "string" && text.startsWith(ALEJSEN.MAGIC_TAG)) {
         let tagOffset = ALEJSEN.MAGIC_TAG.length;
         let tagI = text.indexOf(ALEJSEN.MAGIC_TAG, tagOffset);
         const prop = text.substring(tagOffset, tagI);
         tagOffset = tagI + ALEJSEN.MAGIC_TAG.length;
         tagI = text.indexOf(ALEJSEN.MAGIC_TAG, tagOffset);
         const i = text.substring(tagOffset, tagI);
         tagOffset = tagI + ALEJSEN.MAGIC_TAG.length;
         tagI = text.indexOf(ALEJSEN.MAGIC_TAG, tagOffset);
         const j = text.substring(tagOffset, tagI);
         
         const ref = result[`${prop}Refs`][j];
         result.addLiveRef(ref);
         if (prop === 'domNodes') {
            const domRef = ref?.getSnapshot();
            result.addDomLiveRef(domRef);
            return domRef;
         }
         return ref;
      }
      return JSEN.parse(text, reviver);
   };
   
   onCopyChild = (child, i, children) => {
      return child;
   };
   
   stringify = (
      value, replacer, space, domCopyDepth = 0, domCopyDepthMax = 1
   ) => {
      let snapshotValue = null;
      let serialized = null;
      let isCached = false;
      let error = null;
      
      const {
         parse,
         scrObject,
         //   isScrObject,
         windowRoots,
         natives,
         domNodes,
         domNodesObs,
         functions,
         objects,
         onDomNodeAdded,
         isIgnoreObjectPrivateProperties,
         ignoreTags
      } = this;
      
      const result = new ALEObject(value);
      result.objectType = JSEN.getObjectType(value);
      result.objectClassName = JSEN.getObjectClassName(value);
      result.isIterable = isArrayLikeObject(value) || isObjectLike(value);
      
      result.getSnapshot = () => {
         if (!isCached) {
            snapshotValue = parse(serialized, null, result);
            isCached = true;
         }
         return snapshotValue;
      };
      
      const _scrObject = scrObject();
      const _windowRootsValues = Object.values(windowRoots());
      const _natives = natives();
      const _functions = functions();
      const _objects = objects();
      const _domNodes = domNodes();
      const _domNodesObs = domNodesObs();
      
      this._replacer = replacer = replacer ?? ((_key, _value) => {
         
         if (isIgnoreObjectPrivateProperties &&
            isString(_key) &&
            _key.startsWith('_')) {
            return undefined;// ignoring libraries private data
         }
         
         let i = _scrObject && _scrObject === _value ? 0 : -1;
         let prop = 'scrObject';
         if (i > -1) {
            const j = result[`${prop}Refs`].push(_value) - 1;
            return JSEN.replacer(
               null,
               `${
                  ALEJSEN.MAGIC_TAG
               }${prop}${ALEJSEN.MAGIC_TAG}${i}${ALEJSEN.MAGIC_TAG}${j}`
            );
            
         }
         
         i = (
            isNil(_value) || isString(_value) || !isObject(_value) ||
            isNode(_value, scrObject.contentWindow)
         ) ? -1 : _windowRootsValues.indexOf(_value);
         prop = 'windowRoots';
         if (i > -1) {
            const j = result[`${prop}Refs`].push(_value) - 1;
            return JSEN.replacer(
               null,
               `${
                  ALEJSEN.MAGIC_TAG
               }${prop}${ALEJSEN.MAGIC_TAG}${i}${ALEJSEN.MAGIC_TAG}${j}`
            );
         }
         
         const type = Object.prototype.toString.call(_value);
         
         if (
            type === "[object Window]" ||
            type === "[object HTMLDocument]" ||
            type === "[object HTMLBodyElement]"
         ) {
            i = _windowRootsValues.indexOf(_value);
            if (i < 0) {
               i = _windowRootsValues.push(_value) - 1;
            }
            
            const j = result[`${prop}Refs`].push(_value) - 1;
            return JSEN.replacer(
               null,
               `${
                  ALEJSEN.MAGIC_TAG
               }${prop}${ALEJSEN.MAGIC_TAG}${i}${ALEJSEN.MAGIC_TAG}${j}`
            );
         }
         
         if (!isNil(_value)) {
            if (isNativeCaught(_value)) {
               i = _natives.indexOf(_value);
               prop = 'natives';
               if (i < 0) {
                  i = _natives.push(_value) - 1;
               }
               const j = result[`${prop}Refs`].push(_value) - 1;
               return JSEN.replacer(
                  null,
                  `${
                     ALEJSEN.MAGIC_TAG
                  }${prop}${ALEJSEN.MAGIC_TAG}${i}${ALEJSEN.MAGIC_TAG}${j}`
               );
            }
            
            if (isFunction(_value)) {
               i = _functions.indexOf(_value);
               prop = 'functions';
               if (i < 0) {
                  i = _functions.push(_value) - 1;
               }
               const j = result[`${prop}Refs`].push(_value) - 1;
               return JSEN.replacer(
                  null,
                  `${
                     ALEJSEN.MAGIC_TAG
                  }${prop}${ALEJSEN.MAGIC_TAG}${i}${ALEJSEN.MAGIC_TAG}${j}`
               );
            }
            
            if (isObject(_value)) {
               i = _objects.indexOf(_value);
               prop = 'objects';
               if (i < 0) {
                  _objects.push(_value);
               }
               //todo track serialized
               result[`${prop}Refs`].push(_value);
            }
            
            
            if (isNode(_value, scrObject.contentWindow)) {
               result.isDOM = true;
               
               i = _domNodes.indexOf(_value);
               prop = 'domNodes';
               if (i < 0) {
                  i = _domNodes.push(_value) - 1;
                  // Create an observer instance linked to the callback function
                  const observer = new MutationObserver(MutationObserverCallback);
                  // Start observing the target node for configured mutations
                  observer.observe(_value, MutationObserverConfig);
                  _domNodesObs.push(observer);
                  onDomNodeAdded?.(_value, _domNodes);
               }
               
               const val = copifyDOMNode(_value, this);
               //fix children: log dom refs for ids only, check native everywhere;
               const valString = this.stringify(val, null, space, domCopyDepth);
               const j = result[`${prop}Refs`].push(
                  valString
               ) - 1;
               
               if (_value === value && !result.isOutput) {
                  result.isOutput = !ignoreTags.includes(
                     (_value.tagName || '').toLowerCase()
                  );
                  
                  if (result.isOutput) {
                     result.outputRefs.push(_value);
                     result.graphicalId = i;
                  }
               }
               
               return JSEN.replacer(
                  null,
                  `${
                     ALEJSEN.MAGIC_TAG
                  }${prop}${ALEJSEN.MAGIC_TAG}${i}${ALEJSEN.MAGIC_TAG}${j}`
               );
            }
         }
         return JSEN.replacer(_key, _value);
      });
      
      
      try {
         serialized = JSEN.stringify(
            value, replacer, space, true
         );
         result.serialized = serialized
         // result.snapshot = result.getSnapshot();
         // if (result.isDOM) {
         //    const fs = (Object.values(result.snapshot.listeners)).map(f => f.toString());
         //    const allfs = this.functions().map(f => f.toString())
         //    console.log('>>',
         //       value,
         //       result,
         //       fs,
         //       allfs,
         //       allfs.filter(f => fs.includes(f))
         //    );
         // }
         return result;
         
      } catch (_error) {
         error = _error;
         result.error = error;
         isCached = true;
         return result;
      }
   };
}

export default function wireGlobalObjectToALE(
   aleInstance, globalObject, errorHandler
) {
   const {getAutoLogIdentifiers} = aleInstance;
   const ids = getAutoLogIdentifiers();
   const {
      scrObjectIdentifierName,
      // alValueParamNumber,
      alPreIdentifierName,
      alPostIdentifierName,
      alIdentifierName,
      alLocatorIdentifierName,
      alExceptionCallbackIdentifierName,
   } = ids;
   
   const previous = globalObject[scrObjectIdentifierName];
   const scrObject = globalObject[scrObjectIdentifierName] = {
      previous,
      ids,
      errorHandler,
      lastExpressionId: null,
      errorsData: [],
      timeline: [],
      functions: {},
      expressionFunctions: {},
      contentWindow: null,
   };
   
   scrObject.getWindowRef = () => scrObject.contentWindow;
   
   // scrObject.objectNodeRenderer = createALEObjectNodeRenderer(
   //    aleInstance,
   //    scrObject.getWindowRef,
   // );
   
   scrObject.registerFunction = (functionRef, expressionId, uid) => {
      if (!isFunction(functionRef)) {
         return;
      }
      
      const fString = functionRef.toString();
      if (!scrObject.functions[fString]) {
         scrObject.functions[fString] = [];
      }
      
      if (!scrObject.expressionFunctions[expressionId]) {
         scrObject.expressionFunctions[expressionId] = [];
      }
      
      const entry = {
         functionRef,
         expressionId,
         uid,
      };
      
      scrObject.functions[fString].push(entry);
      scrObject.expressionFunctions[expressionId].push(entry);
   };
   
   const aleJSEN = new ALEJSEN(scrObject);
   scrObject.aleJSEN = aleJSEN;
   
   scrObject.setOnDomNodeAdded = (callback) => {
      scrObject.aleJSEN.onDomNodeAdded = callback;
      return () => {scrObject.aleJSEN.onDomNodeAdded = null;};
   }
   
   scrObject[alLocatorIdentifierName] = {};
   
   scrObject[alPreIdentifierName] = ( // handles BALE's makeAlPreCall calls
      expressionId, calleeExpressionId, calleeObjectExpressionId, ...extra
   ) => {
      scrObject.lastExpressionId = expressionId;
      aleInstance?.onTraceChange?.();
      return {
         expressionId, calleeExpressionId, calleeObjectExpressionId, extra
      };
   };
   
   scrObject[alPostIdentifierName] = ( // handles BALE's makeAlPostCall calls
      expressionId, ...extra
   ) => {
      aleInstance?.onTraceChange?.();
      return {
         expressionId, extra
      };
   };
   
   scrObject[alIdentifierName] = (
      uid, traceEventType, ...rest
   ) => {
      
      if (traceEventType === TraceEvents.L) {
         // handles BALE's makeAlCall calls
         // alValueParamNumber = 3 := value
         const [pre, value, post, ...extra] = rest;
         scrObject.registerFunction(value, pre.expressionId, uid);
         const logValue = aleJSEN.stringify(value);
         
         scrObject.timeline.push({
            uid, traceEventType, pre,
            logValue,
            post, extra
         });
         
         return value;
      } else {
         if (traceEventType === TraceEvents.I) {
            // handles BALE's makeEnterCall calls
            const [scopeType, scopeThis, ...more] = rest;
            
            let extraExpressionId = null;
            let paramsValue = null;
            let idValue = null;
            let forOfValue = null;
            let exceptionValue = null;
            let tryBlockType = null;
            let paramsIdentifier = null;
            let functionIdNode = null;
            let expressionIdNode = null;
            switch (scopeType) {
               case ScopeTypes.P:
                  const contentWindow = more[0];
                  scrObject.contentWindow = contentWindow;
                  aleJSEN.windowRoots(contentWindow);
               case ScopeTypes.F:
                  paramsIdentifier = more[0];
                  functionIdNode = more[1];
                  expressionIdNode = more[2];
                  scrObject.registerFunction(
                     functionIdNode,
                     expressionIdNode,
                     uid
                  );
                  paramsValue = aleJSEN.stringify(paramsIdentifier);
                  break;
               case ScopeTypes.A:
                  extraExpressionId = more[0];
                  break;
               case ScopeTypes.C:
                  idValue = aleJSEN.stringify(more[0]);
                  forOfValue = aleJSEN.stringify(more[1]);
                  break;
               case ScopeTypes.E:
                  tryBlockType = more[0];
                  exceptionValue = aleJSEN.stringify(more[1]);
                  break;
               case ScopeTypes.S:
               default:
            }
            scrObject.timeline.push({
               uid, traceEventType,
               scopeType, scopeThis,
               extraExpressionId,
               paramsValue,
               functionIdNode,
               idValue,
               forOfValue,
               tryBlockType,
               exceptionValue,
               paramsIdentifier,
               expressionIdNode,
            });
            return undefined;
         } else {
            if (traceEventType === TraceEvents.O) {
               // handles BALE's makeExitCall calls
               const [
                  scopeType, scopeThis, paramsIdentifier,
                  scopeExitType, extraExpressionId, value,
               ] = rest;
               
               scrObject.timeline.push({
                  uid, traceEventType,
                  scopeType,
                  scopeExitType,
                  scopeThis, extraExpressionId,
                  returnValue: aleJSEN.stringify(value),
                  paramsIdentifier
               });
               return value;
            }
         }
      }
   };
   
   scrObject[alExceptionCallbackIdentifierName] = (e) => {
      const lastExpressionId = scrObject?.lastExpressionId;
      if (lastExpressionId) {
         const eData = aleInstance?.zale?.getZoneData?.(
            lastExpressionId
         );
         
         if (eData) {
            const errorObject = makeError(e);
            if (scrObject) {
               const scrError = {
                  uid: null,
                  traceEventType: TraceEvents.E,
                  scopeType: null,
                  scopeThis: null,
                  extraExpressionId: null,
                  paramsValue: null,
                  idValue: null,
                  forOfValue: null,
                  exceptionValue: null,
                  expressionId: lastExpressionId,
                  errorObject,
                  zoneData: eData,
                  rawError: e,
               }
               scrObject.errorsData.push(scrError);
               scrObject.timeline.push(scrError);
            }
            aleInstance?.onTraceChange?.();
            return errorObject;
         }
         
      }
      throw e;
   };
   
   return scrObject;
}
