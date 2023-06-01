import {TraceEvents, makeError, ScopeTypes, ALEObject} from "./ALE";
import JSEN from "../../utils/JSEN";
import isNil from "lodash/isNil";
import isString from "lodash/isString";
import isObject from "lodash/isObject";

import isFunction from "lodash/isFunction";
import {copifyDOMNode, isNativeCaught, isNode} from "../../utils/scrUtils";
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
    _usedWindowRootsValues = [];
    _usedWindowRootsKeys = [];
    _imports = [];
    _importsKeys = [];
    _importsMap = {};

    onDomNodeAdded = (domNodeAdded, domNodes) => {
    };

    scrObject = () => {
        return this._scrObject;
    };

    isScrObject = (ref) => {
        return !!this._scrObjectRef && this._scrObjectRef === ref;
    };

    windowRoots = (windowRoots) => {
        if (windowRoots) {
            this._windowRoots = windowRoots;//{...this._windowRoots, ...windowRoots};
            this._usedWindowRootsValues = [];
            this._usedWindowRootsKeys = [];
        }
        return this._windowRoots;
    };

    registerUsedWindowRootValue = (value) => {
        let j = this._usedWindowRootsValues.indexOf(value);
        if (j < 0) {
            const i = Object.values(this._windowRoots).indexOf(value);
            const type = i < 0 && Object.prototype.toString.call(value);

            if (i > -1 ||
                type === "[object Window]" ||
                type === "[object HTMLDocument]" ||
                type === "[object HTMLBodyElement]"
            ) {
                j = this._usedWindowRootsValues.push(value) - 1;
                this._usedWindowRootsKeys[j] =
                    i > -1 ? Object.keys(this._windowRoots)[i] : type;
            }
        }
        return j;
    };

    bindSharedData = (aleObject) => {
        aleObject.windowRootsRefs = this._usedWindowRootsValues;
        aleObject.windowRootsKeysRefs = this._usedWindowRootsKeys;
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

    registerValue = (value, prop, result) => {
        const shared = this[`_${prop}`];
        let i = shared.indexOf(value);
        if (i < 0) {
            i = shared.push(value) - 1;
        }
        const j = result[`${prop}Refs`].push(value) - 1;

        return {i, j};
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
                const liveRefI = result.addLiveRef(ref, prop);
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
            result.addLiveRef(ref, prop);
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

    magicReplace = (prop, i, j) => {
        return JSEN.replacer(
            null,
            `${
                ALEJSEN.MAGIC_TAG
            }${prop}${ALEJSEN.MAGIC_TAG}${i}${ALEJSEN.MAGIC_TAG}${j}`
        );
    };

    stringify = (
        value, replacer, space, domCopyDepth = 0, domCopyDepthMax = 1
    ) => {
        let snapshotValue = null;
        let serialized = null;
        let isCached = false;
        let error = null;

        const {
            magicReplace,
            parse,
            scrObject,
            //   isScrObject,
            registerValue,
            registerUsedWindowRootValue,
            bindSharedData,
            natives,
            domNodes,
            domNodesObs,
            functions,
            objects,
            onDomNodeAdded,
            isIgnoreObjectPrivateProperties,
            ignoreTags
        } = this;

        const result = new ALEObject(value, bindSharedData);
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
        // const _natives = natives();
        // const _functions = functions();
        // const _objects = objects();
        const _domNodes = domNodes();
        const _domNodesObs = domNodesObs();

        this._replacer = replacer = replacer ?? ((_key, _value) => {

            if (isIgnoreObjectPrivateProperties &&
                isString(_key) &&
                _key.startsWith('_')) {
                return undefined;// ignoring libraries private data
            }


            let i = _scrObject && _scrObject === _value ? 0 : -1;

            if (i > -1) {
                const prop = 'scrObject';
                const j = result[`${prop}Refs`].push(_value) - 1;
                return magicReplace(prop, i, j);
            }

            i = (
                isNil(_value) || isString(_value) || !isObject(_value) ||
                isNode(_value, scrObject.contentWindow)
            ) ? -1 : registerUsedWindowRootValue(_value);

            if (i > -1) {
                const prop = 'windowRoots';
                const j = i;
                return magicReplace(prop, i, j);
            }

            if (!isNil(_value)) {
                if (isNativeCaught(_value)) {
                    const prop = 'natives';
                    const {i, j} = registerValue(_value, prop, result);
                    return magicReplace(prop, i, j);
                }

                if (isFunction(_value)) {
                    const prop = 'functions';
                    const {i, j} = registerValue(_value, prop, result);
                    return magicReplace(prop, i, j);
                }

                if (isObject(_value)) {
                    const prop = 'objects';
                    // const {i, j}= //todo track serialized
                    registerValue(_value, prop, result);
                }

                if (isNode(_value, scrObject.contentWindow)) {
                    const prop = 'domNodes';
                    i = _domNodes.indexOf(_value);
                    result.isDOM = true;

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

                    return magicReplace(prop, i, j);
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

    registerImportRef = (importSourceName, importSourceIndex, importRef, aleInstance) => {
        const [expressionId, sourceText, zone, expression] = aleInstance.zale?.getImportZoneData(importSourceName, importSourceIndex);

        const importZoneExpressionData = {
            importSourceName, importSourceIndex, importRef,
            expressionId, sourceText, zone, expression
        };
        this._importsMap[importSourceName] = this._importsMap[importSourceName] ?? {};
        this._importsMap[importSourceName][sourceText] = importZoneExpressionData;
        this._imports.push(importRef);
        this._importsKeys.push([importSourceName, sourceText]);

        // console.log("IMPORT API REGISTER", this.getImportRef(importRef));//
        return importZoneExpressionData;
    };

    getImportRef = (importRef) => {
        const i = this._imports.indexOf(importRef);
        const [importSourceName, sourceText] = this._importsKeys[i] ?? [];
        return this._importsMap[importSourceName]?.[sourceText];
    };
}

export class TimelineEntry {
    constructor(
        traceEventType, uid, pre, logValue, post,
        scopeType, scopeThis,
        expressionId, extraExpressionId,
        isImport, isCall, isConsole, isError,
        extra,
        paramsValue,
        functionIdNode,
        idValue,
        forOfValue,
        tryBlockType,
        exceptionValue,
        paramsIdentifier,
        expressionIdNode,
        scopeExitType,
        returnValue,
        errorObject,
        zoneData,
        rawError,
        importZoneExpressionData
    ) {
        this.traceEventType = traceEventType;
        this.uid = uid;
        this.pre = pre;
        this.logValue = logValue;
        this.post = post;
        this.scopeType = scopeType;
        this.scopeThis = scopeThis;
        this.expressionId = expressionId;
        this.extraExpressionId = extraExpressionId;
        this.isImport = isImport;
        this.isCall = isCall;
        this.isConsole = isConsole;
        this.isError = isError;
        this.extra = extra;
        this.paramsValue = paramsValue;
        this.functionIdNode = functionIdNode;
        this.idValue = idValue;
        this.forOfValue = forOfValue;
        this.tryBlockType = tryBlockType;
        this.exceptionValue = exceptionValue;
        this.paramsIdentifier = paramsIdentifier;
        this.expressionIdNode = expressionIdNode;
        this.scopeExitType = scopeExitType;
        this.returnValue = returnValue;
        this.errorObject = errorObject;
        this.zoneData = zoneData;
        this.rawError = rawError;
        this.importZoneExpressionData =importZoneExpressionData;

    }
}

export default function wireGlobalObjectToALE(
    aleInstance, globalObject, errorActions
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
        errorActions,
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

        scrObject.functions[fString] ??= [];
        scrObject.expressionFunctions[expressionId] ??= [];

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
        return () => {
            scrObject.aleJSEN.onDomNodeAdded = null;
        };
    }

    scrObject[alLocatorIdentifierName] = {};

    scrObject[alPreIdentifierName] = ( // handles BALE's makeAlPreCall calls
        expressionId, calleeExpressionId, calleeObjectExpressionId,
        calleePropertyExpressionId, ...extra
    ) => {
        scrObject.lastExpressionId = expressionId;
        aleInstance?.onTraceChange?.();
        return {
            expressionId, calleeExpressionId, calleeObjectExpressionId,
            calleePropertyExpressionId,
            extra
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

    const findEntriesWithLatestExpressionIdsInTimeLine =
        (expressionIds = []) => {
            let pending = expressionIds.length;
            const _expressionIds = expressionIds.map(v => `${v}`);
            const result = {};
            for (let i = scrObject.timeline.length; i > -1 && pending > 0; i--) {
                const entry = scrObject.timeline[i];
                const expressionId = entry?.pre?.expressionId;

                if (expressionId) {
                    const _expressionId = `${expressionId}`;
                    if (_expressionIds.includes(_expressionId)) {
                        if (!result[_expressionId]) {
                            result[_expressionId] = entry;
                            pending--;
                        }
                    }
                }
            }
            return result;
        };

    scrObject[alIdentifierName] = (
        uid, traceEventType, ...rest
    ) => {
        if (traceEventType === TraceEvents.P) {
            const [importSourceName, importSourceIndex, importRef] = rest;
            const importZoneExpressionData = scrObject.aleJSEN?.registerImportRef(importSourceName, importSourceIndex, importRef, aleInstance);

            const {expressionId, ...ex} = importZoneExpressionData ?? {};
            // console.log("IMP", expressionId, ex);

            const entry = new TimelineEntry(
                traceEventType, uid,
                null, null, null,
                null, null, expressionId, null,
                true, false, false, true,
                null,
                null, null, null, null,
                null, null,
                null, null,
                null, null,
                null, null, null,
                importZoneExpressionData,
            );
            // console.log("IMP", expressionId, entry);
            scrObject.timeline.push(entry);
            aleInstance?.onTraceChange?.();
            return;

        }
        if (traceEventType === TraceEvents.L || traceEventType === TraceEvents.R) {
            // console.log("API REGISTER", [uid, traceEventType,...rest]);
            // handles BALE's makeAlCall calls
            // alValueParamNumber = 3 := value
            const [pre, value, post, ...extra] = rest;
            const {
                expressionId,
                calleeExpressionId,
                calleeObjectExpressionId,
                calleePropertyExpressionId
            } = pre;

            const isMethodCall =
                !!calleeObjectExpressionId && !!calleePropertyExpressionId;

            const isCall = isMethodCall || !!calleeExpressionId;

            let isConsole = false;

            if (isCall) {
                // console.log("WALE is mc ", pre);
                const expressionIds = isMethodCall ? [
                    calleeObjectExpressionId,
                    calleePropertyExpressionId
                ] : [
                    calleeExpressionId
                ];

                const prevEntries = findEntriesWithLatestExpressionIdsInTimeLine(
                    expressionIds);

                const funcRef = isMethodCall ?
                    prevEntries[calleeObjectExpressionId]?.logValue?.live?.[
                        prevEntries[calleePropertyExpressionId]?.logValue?.live
                        ]
                    : prevEntries[calleeExpressionId]?.logValue?.live;

                const hasValue = funcRef ?? false;

                isConsole =
                    hasValue && scrObject.getWindowRef()?.console?.log === funcRef;

                hasValue &&
                scrObject.registerFunction(funcRef, expressionId, uid);
            }

            const logValue = aleJSEN.stringify(value);

            const entry = new TimelineEntry(
                traceEventType, uid,
                pre, logValue, post,
                null, null, null, null,
                false, isCall, isConsole, false,
                extra,
            );

            scrObject.timeline.push(entry);
            aleInstance?.onTraceChange?.();

            return value;
        } else {

            if (traceEventType === TraceEvents.I) {
                // handles BALE's makeEnterCall calls
                const [scopeType, scopeThis, ...more] = rest;

                let value = null;

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
                    // console.log("windowRoots", more, aleJSEN);
                    case ScopeTypes.F:
                        paramsIdentifier = more[0];
                        functionIdNode = more[1];
                        expressionIdNode = more[2];
                        value = functionIdNode;
                        scrObject.registerFunction(
                            functionIdNode,
                            expressionIdNode,
                            uid
                        );
                        paramsValue = aleJSEN.stringify(paramsIdentifier);

                        // console.log("FFF", rest, {
                        //    zone:aleInstance.zale?.getZoneData(expressionIdNode),
                        //    functionIdNode,
                        //    expressionIdNode,
                        //    uid,
                        //    paramsValue}
                        // );
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

                const isConsole =
                    value && scrObject.getWindowRef()?.console?.log === value;

                const isCall = false; //todo

                isConsole && console.log("MATCH I");

                const entry = new TimelineEntry(
                    traceEventType, uid,
                    null, null, null,
                    scopeType, scopeThis, null, extraExpressionId,
                    false, isCall, isConsole, false,
                    null,
                    paramsValue, functionIdNode, idValue, forOfValue,
                    tryBlockType, exceptionValue,
                    paramsIdentifier, expressionIdNode,
                    null, null,
                    null, null, null,
                );

                scrObject.timeline.push(entry);

                aleInstance?.onTraceChange?.();

                return undefined;
            } else {
                if (traceEventType === TraceEvents.O) {
                    // handles BALE's makeExitCall calls
                    const [
                        scopeType, scopeThis, paramsIdentifier,
                        scopeExitType, extraExpressionId, value,
                    ] = rest;

                    const isConsole =
                        value && scrObject.getWindowRef()?.console?.log === value;

                    isConsole && console.log("MATCH O");

                    const isCall = false; //todo

                    const returnValue = aleJSEN.stringify(value);

                    const entry = new TimelineEntry(
                        traceEventType, uid,
                        null, null, null,
                        scopeType, scopeThis, null, extraExpressionId,
                        false, isCall, isConsole, false,
                        null,
                        null, null, null, null,
                        null, null,
                        paramsIdentifier, null,
                        scopeExitType, returnValue,
                        null, null, null,
                    );

                    scrObject.timeline.push(entry);

                    aleInstance?.onTraceChange?.();

                    return value;
                }
            }
        }
    };

    scrObject[alExceptionCallbackIdentifierName] = (e, ...rest) => {
        const lastExpressionId = scrObject?.lastExpressionId;
        //console.log("lastExpressionId", lastExpressionId);
        if (lastExpressionId) {
            const eData = aleInstance?.zale?.getZoneData?.(
                lastExpressionId
            );

            if (eData) {
                const errorObject = makeError(e);
                let entry = null;
                if (scrObject) {
                    const traceEventType = TraceEvents.E;
                    const expressionId = lastExpressionId;
                    const zoneData = eData;
                    const rawError = e;
                    entry = new TimelineEntry(
                        traceEventType, null,
                        null, null, null,
                        null, null, expressionId, null,
                        false, false, false, true,
                        null,
                        null, null, null, null,
                        null, null,
                        null, null,
                        null, null,
                        errorObject, zoneData, rawError,
                    );

                    scrObject.errorsData.push(entry);

                    scrObject.timeline.push(entry);
                }
                // done: uncaught errors are strings when passed to log (ifra,?)
                // console.log("scrError obj is not created", entry, errorObject, ""+e, rest);
                aleInstance?.onTraceChange?.();
                return errorObject;
            }

        }
        throw e;
    };

    return scrObject;
}
