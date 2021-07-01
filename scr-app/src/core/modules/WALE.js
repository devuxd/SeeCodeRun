import {TraceEvents, makeError, ScopeTypes, TALE} from "./ALE";
import JSEN from "../../utils/JSEN";


export const stringifyValue = (
   value,
   scrObject,
   res = {isDOM: false, isOutput: false, outputRefs: []}
) => {
   try {
      return ({
         live: value,
         serialized: JSEN.stringify(value, TALE.getReplacer(
            res,
            scrObject.getWindowRoots,
            scrObject.domNodes,
            scrObject.domNodesObs,
            scrObject.onDomNodeAdded,
            scrObject
         ), null, true),
         serializedError: null,
         isDOM: res.isDOM,
         isOutput: res.isOutput,
         outputRefs: res.outputRefs,
         objectType: JSEN.getObjectType(value),
         objectClassName: JSEN.getObjectClassName(value),
      });
      
   } catch (serializedError) {
      return ({
         live: value,
         serialized: null,
         serializedError,
         isDOM: res.isDOM,
         isOutput: res.isOutput,
         outputRefs: res.outputRefs,
         objectType: JSEN.getObjectType(value),
         objectClassName: JSEN.getObjectClassName(value),
      });
   }
};

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
      alExceptionCallbackIdentifierName,
   } = ids;
   
   
   const scrObject = globalObject[scrObjectIdentifierName] = {
      ids,
      errorHandler,
      lastExpressionId: null,
      errorsData: [],
      timeline: [],
      stringifyValue,
      getWindowRoots: () => ({}),
      onDomNodeAdded: () => {},
      domNodes: [],
      domNodesObs: [],
   };
   
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
         scrObject.timeline.push({
            uid, traceEventType, pre,
            logValue: scrObject.stringifyValue(value, scrObject),
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
            switch (scopeType) {
               case ScopeTypes.F:
                  paramsIdentifier = more[0];
                  paramsValue = scrObject.stringifyValue(
                     paramsIdentifier, scrObject
                  );
                  break;
               case ScopeTypes.A:
                  extraExpressionId = more[0];
                  break;
               case ScopeTypes.C:
                  idValue = scrObject.stringifyValue(more[0], scrObject);
                  forOfValue = scrObject.stringifyValue(more[1], scrObject);
                  break;
               case ScopeTypes.E:
                  tryBlockType = more[0];
                  exceptionValue = scrObject.stringifyValue(more[1], scrObject);
                  break;
               case ScopeTypes.S:
               default:
            }
            scrObject.timeline.push({
               uid, traceEventType,
               scopeType, scopeThis,
               extraExpressionId,
               paramsValue,
               idValue,
               forOfValue,
               tryBlockType,
               exceptionValue,
               paramsIdentifier,
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
                  returnValue: scrObject.stringifyValue(value, scrObject),
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
