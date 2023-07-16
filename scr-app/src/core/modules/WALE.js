import {
    TraceEvents,
    makeError,
    ScopeTypes,
    ALEObject,
    getZoneDataByExpressionId,
    getZoneDataLoc,
    JSXExpressionReplacementType
} from "./ALE";
import JSEN from "../../utils/JSEN";
import isNil from "lodash/isNil";
import isString from "lodash/isString";
import isObject from "lodash/isObject";
import {isArrayLikeObject, isObjectLike} from "lodash";

import isFunction from "lodash/isFunction";
import {copifyDOMNode, findStateInState, isNode, nativeFunctionStringName, stateToRefArray} from "../../utils/scrUtils";

import {GraphicalIdiom, SupportedApis} from "./RALE/IdiomaticInspector";

class Diff {
    diff;
    og;
    ng;
    eq;

    constructor(og, ng) {
        this.eq = og === ng;
        this.og = og;
        this.ng = ng;
    }
}

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
    _domNodesApiNames = []; // sync with _domNodes
    _domNodesExpressionIds = [];
    _domNodesObs = [];
    _functions = [];
    _objects = [];
    _windowRoots = {};
    _usedWindowRootsValues = [];
    _usedWindowRootsKeys = [];
    _imports = [];
    _importsKeys = [];
    _importsMap = {};

    onDomNodeAdded = (domNodeAdded, domNodes, domNodesApiNames) => {
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

    domNodesApiNames = () => {
        return this._domNodesApiNames;
    };

    domNodesExpressionIds = () => {
        return this._domNodesExpressionIds;
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

        // if (shared === this._functions) {
        //     console.log("_functions", shared, {i, j, value});
        // }

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
            const it = text.substring(tagOffset, tagI);
            tagOffset = tagI + ALEJSEN.MAGIC_TAG.length;
            tagI = text.indexOf(ALEJSEN.MAGIC_TAG, tagOffset);
            const jt = text.substring(tagOffset, tagI);
            console.log(">>", {it, jt});

            const i = parseInt(it);
            const j = parseInt(jt);
            // console.log(">>", {i, j});

            if (i >= 0 && j >= 0) {
                const ref = result[`${prop}Refs`][j];
                result.addLiveRef(ref, prop);
                if (prop === 'domNodes') {
                    const domRef = ref?.getSnapshot();
                    result.addDomLiveRef(domRef);
                    return domRef;
                }

                return ref;
            } else {
                const ja = jt?.split(":");
                const refs = [];
                for (let k = 1; k < ja?.length; k++) {
                    const ref = result[`${prop}Refs`][ja[k]];
                    result.addLiveRef(ref, prop);
                    if (prop === 'domNodes') {
                        const domRef = ref?.getSnapshot();
                        result.addDomLiveRef(domRef);
                        refs.push(domRef);
                    } else {
                        refs.push(ref);
                    }
                }

                return refs;

            }

        }
        return JSEN.parse(text, reviver);
    };

    onCopyChild = (child, i, children) => {
        return child;
    };

    magicReplace = (prop, i, j) => {
        // console.log("domNodeReplacer", {prop, i, j});
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
            domNodesApiNames,
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
        const _domNodesApiNames = domNodesApiNames();
        // const _domNodesObs = domNodesObs();

        const registerDomNode = (_value, apiName) => {
            // console.log("registerDomNode I", _value);
            const prop = 'domNodes';
            let i = _domNodes.indexOf(_value);

            if (i < 0) {
                i = _domNodes.push(_value) - 1;
                // Create an observer instance linked to the callback function
                // const observer = new MutationObserver(MutationObserverCallback);
                // // Start observing the target node for configured mutations
                // observer.observe(_value, MutationObserverConfig);
                // _domNodesObs.push(observer);
                _domNodesApiNames[i] = apiName;
                // if (apiName == SupportedApis.React) {
                // const f = _domNodes.reverse().find(d => d !== _value && d._owner === _value._owner && d.type === _value.type &&(_value._owner?.child === d._owner?.child )) ?? {};

                //
                // const diffVisitor = (og, ng, diff, key = "root", memo = []) => {
                //
                //     try {
                //         if (memo.indexOf(og) > -1 || memo.indexOf(ng) > -1) {
                //             const kl = `${key}:LOOP`;
                //             diff[kl] = new Diff(og, ng);
                //         }
                //         memo.push(og, ng);
                //         // if(key){
                //         //     diff = diff[key];
                //         // }
                //
                //         [...Object.keys(og), ...Object.keys(ng)].forEach(k => {
                //             const l = og?.[k];
                //             const r = ng?.[k];
                //             if (l || r) {
                //
                //                 diff[k] = new Diff(l, r);
                //                 //   diffVisitor(l, r, diff, `${key}:${k}`, memo);
                //             }
                //         });
                //
                //     } catch (e) {
                //         const ke = `${key}:ERRR`;
                //         diff[ke] = new Diff(og, ng);
                //     }
                // }
                //
                // const diff = {};
                // diffVisitor(_value, f, diff);
                //
                // const diffOwner = {};
                // diffVisitor(_value._owner, f._owner, diffOwner);
                //
                //
                // console.log(
                //     "registerDomNode", diff, diffOwner,); //?.memoizedProps  _value._owner, f._owner
                // //     (_value._owner?.memoizedProps && (_value._owner?.memoizedProps === f._owner?.memoizedProps)), _value._owner?.memoizedProps, f._owner?.memoizedProps,); //{p:f.props===_value.props, s: f===_value, f, _value, apiName});
                // //jsxReplacementType
                // }
                // console.log("onDomNodeAdded", {onDomNodeAdded, _value, _domNodes, _domNodesApiNames});
                onDomNodeAdded?.(_value, _domNodes, _domNodesApiNames);
            }


            // console.log("registerDomNode S",_value);
            // try {
            const val = copifyDOMNode(_value, this, apiName);
            //fix children: log dom refs for ids only, check native everywhere;
            const valString = this.stringify(val, null, space, domCopyDepth);
            const j = result[`${prop}Refs`].push(
                valString
            ) - 1;

            if (apiName == SupportedApis.standard && _value === value && !result.isOutput) {
                result.isOutput = !ignoreTags.includes(
                    (_value.tagName || '').toLowerCase()
                );

            }

            if (apiName == SupportedApis.React) {
                result.isOutput = true;
                // console.log("f", val, _value === value, !result.isOutput,  _value, value, result);
            }

            if (result.isOutput) {
                result.outputRefs.push(_value);
                result.graphicalId = i;

                if (result.graphicalIds?.indexOf(i) < 0) {
                    result.graphicalIds?.push(i);
                }
                // if (apiName == SupportedApis.React) {
                //     result.isOutput = true;
                //     // console.log("f", val, _value === value, !result.isOutput,  _value, value, result);
                // }
            }


            // } catch (e) {
            //     console.log("registerDomNode E", _value, e);
            // }
            // console.log("registerDomNode O",_value, result);
            return [i, j];
        };

        const domNodeReplacer = (_value, apiName) => {
            // console.log("domNodeReplacer",_value, apiName);
            result.isDOM = true;
            const prop = 'domNodes';
            let ia = "", ja = "";
            switch (apiName) {
                case SupportedApis.jQuery:
                    for (let k = 0; k < _value.length; k++) {
                        const [i, j] = registerDomNode(_value[k], apiName);
                        ia += ":" + i;
                        ja += ":" + j;
                    }
                    break;
                case SupportedApis.standard:
                case SupportedApis.React:
                    // default:
                    const [i, j] = registerDomNode(_value, apiName);
                    ia = i;
                    ja = j;
            }
            // console.log("domNodeReplacer E", {ia, ja});

            return magicReplace(prop, ia, ja);
        };

        this._replacer = replacer = replacer ?? ((_key, _value) => {

            // if (isFunction(_value)) {
            //     console.log("_replacer", {_key, _value});
            // }

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
                // if (isNativeCaught(_value)) {
                //     const prop = 'natives';
                //     const {i, j} = registerValue(_value, prop, result);
                //     return magicReplace(prop, i, j);
                // }

                if (isFunction(_value)) {
                    // console.log("_replacer", {_key, _value});
                    const prop = 'functions';
                    const {i, j} = registerValue(_value, prop, result);
                    return magicReplace(prop, i, j);
                }

                if (isObject(_value)) {
                    const prop = 'objects';
                    // const {i, j}= //todo track serialized
                    registerValue(_value, prop, result);
                }

                const apiName = GraphicalIdiom.isNode(_value, scrObject.contentWindow);
                // apiName && console.log(apiName, _value);

                if (apiName) {//isNode(_value, scrObject.contentWindow)
                    return domNodeReplacer(_value, apiName);
                }
            }
            return JSEN.replacer(_key, _value);
        });


        try {

            // if(isFunction(value)){
            //     console.log("serialized", {value});
            // }
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
    _graphicalAPIName = null;
    _graphicalObject = null;

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
        this.importZoneExpressionData = importZoneExpressionData;

    }

    graphicalAPIName = (graphicalAPIName = undefined) => {
        if (graphicalAPIName !== undefined) {
            this._graphicalAPIName = graphicalAPIName;
        }
        return this._graphicalAPIName;
    }

    graphicalObject = (graphicalObject = undefined) => {
        if (graphicalObject !== undefined) {
            this._graphicalObject = graphicalObject;
        }
        return this._graphicalObject?.();
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
        nativeRootState: null,
        natives: {},
        importZoneExpressionDataArray: [],
        importsStates: [],
    };

    scrObject.registerNatives = (iFrame) => {
        scrObject.nativeRootState = iFrame.contentWindow;
        scrObject.natives = stateToRefArray(scrObject.nativeRootState, [global, scrObject], undefined, scrObject.nativeRootState);
        //  console.log("registerNatives", iFrame.contentWindow.document.getElementById, scrObject.natives, scrObject.natives.visitedStates.indexOf(iFrame.contentWindow.document.getElementById));
    };

    scrObject.nativeStateInfo = (aState) => {
        const nativeFunctionName = nativeFunctionStringName(aState);
        const rootState = scrObject.nativeRootState;
        let native = false;
        let path = null;
        // console.log("scrObject.natives", scrObject.natives);

        const i = scrObject.natives?.visitedStates?.indexOf(aState);

        if (i > -1) {
            native = true;
            path = scrObject.natives.paths[i];
        }

        return {
            native,
            path,
            rootState,
            nativeFunctionName
        };
    };

    scrObject.registerImportState = (importRef, importZoneExpressionData) => {
        if (!importRef || !importZoneExpressionData) {
            throw new Error("invalid params");
        }

        let i = scrObject.importZoneExpressionDataArray?.indexOf(importZoneExpressionData);
        if (i < 0) {
            i = scrObject.importZoneExpressionDataArray.push(importZoneExpressionData) - 1;
        }

        scrObject.importsStates[i] = stateToRefArray(importRef, [global, scrObject], undefined, scrObject.nativeRootState);
        importRef.FFFFFFF = "FFFDEFDFDFDF"
        // console.log("registerImportState",
        //     {importRef, importZoneExpressionData, importsState: scrObject.importsStates[i]}
        // );
    };

    scrObject.importStateInfo = (aState) => {
        let imported = false;
        let path = null;
        let importZoneExpressionData = null;
        let importRef = null;

        let j = -1;
        let i = -1;
        const importState = scrObject.importsStates?.find((is, isi) => {
            j = is.visitedStates.indexOf(aState);

            if (j > -1) {
                i = isi;
                return true;
            }

            return false;
        });

        if (i > -1) {
            imported = true;
            importRef = importState.rootState;
            path = importState.paths[j];
            importZoneExpressionData = scrObject.importZoneExpressionDataArray[i];
        }

        return {
            imported,
            importState,
            importRef,
            path,
            importZoneExpressionData
        };
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

    scrObject.inspectorsStates = [];
    scrObject.inspectorsInfo = [];

    scrObject.resolveStateInfo = (obj) => {
        const i = scrObject.inspectorsStates.indexOf(obj);
        const inspectorInfo = scrObject.inspectorsInfo[i];

        if (inspectorInfo) {
            if (inspectorInfo.stateType === "rejected") {
                return null;
            } else {
                return inspectorInfo;
            }
        }


        let isFunctionType = false;
        let stateType = "rejected";
        let location = null;


        if (isFunction(obj)) {
            isFunctionType = true;
            location = scrObject.getFunctionLocation(obj);
            if (location) {
                stateType = "local";
            } else {
                stateType = "unknown";
            }
        }

        let info = scrObject.importStateInfo(obj);
        if (info?.imported) {
            stateType = "import";
        } else {
            info = scrObject.nativeStateInfo(obj);
            if (info?.native || info?.nativeFunctionName) {
                stateType = "native";
            } else {
                info = null;
            }
        }

        const j = scrObject.inspectorsStates.push(obj) - 1;
        return scrObject.inspectorsInfo[j] = {
            stateType,
            isFunctionType,
            location,
            info,
        };
    }


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
        expressionId,
        calleeExpressionId,
        calleeObjectExpressionId,
        calleePropertyExpressionId,
        ...preExtra
    ) => {
        scrObject.lastExpressionId = expressionId;
        aleInstance?.onTraceChange?.();
        return {
            expressionId, calleeExpressionId, calleeObjectExpressionId,
            calleePropertyExpressionId,
            preExtra
        };
    };

    scrObject[alPostIdentifierName] = ( // handles BALE's makeAlPostCall calls
        expressionId, ...postExtra
    ) => {
        aleInstance?.onTraceChange?.();
        return {
            expressionId, postExtra
        };
    };

    const findEntriesWithLatestExpressionIdsInTimeLine =
        (expressionIds = []) => {
            let pending = expressionIds.length;
            const _expressionIds = expressionIds.map(v => `${v}`);
            const latestEntries = {};
            for (let i = scrObject.timeline.length; i > -1 && pending > 0; i--) {
                const entry = scrObject.timeline[i];
                const expressionId = entry?.pre?.expressionId;

                if (expressionId) {
                    const _expressionId = `${expressionId}`;
                    if (_expressionIds.includes(_expressionId)) {
                        if (!latestEntries[_expressionId]) {
                            latestEntries[_expressionId] = entry;
                            pending--;
                        }
                    }
                }
            }
            return latestEntries;
        };

    scrObject.currentCallers = [];
    scrObject.currentFunctionRefs = [];
    scrObject.currentFunctionEntries = [];
    scrObject.currentFunctionFirstEntries = [];
    scrObject.registerCurrentFunction = (functionRef, timelineEntry) => {
        let i = scrObject.currentFunctionRefs.indexOf(functionRef);
        if (i < 0) {
            i = scrObject.currentFunctionRefs.push(functionRef) - 1;
            scrObject.currentFunctionFirstEntries[i] = timelineEntry;
        }
        scrObject.currentFunctionEntries[i] ??= [];
        scrObject.currentFunctionEntries[i].push(timelineEntry);
    };

    scrObject.getCurrentFunctionRefFirstEntry = (functionRef) => {
        const i = scrObject.currentFunctionRefs.indexOf(functionRef);
        if (i < 0) {
            return null;
        }
        return scrObject.currentFunctionFirstEntries[i];
    };

    scrObject.getFunctionLocation = (functionRef) => {
        const location = {
            type: "unknown",
            expressionId: null,
        };

        // const result = findStateInState(scrObject.contentWindow.document.getElementById, scrObject.contentWindow, [scrObject]);
        // if (result.found) {
        //     entry.callerType = "native";
        //     console.log("native", {functionRef, result});
        // }
        // console.log("native", {functionRef: scrObject.contentWindow.document.getElementById, result});

        const entry = scrObject.getCurrentFunctionRefFirstEntry(functionRef);

        if (entry) {
            switch (entry.callerType) {
                case  "local":
                    location.type = entry.callerType;
                    // console.log("e", entry);
                    location.expressionId = entry.calleeEntry?.uid;
                    break;
                case "native":
                    // const result = findStateInState(functionRef, scrObject.contentWindow);
                    // if (result.found) {
                    //     console.log("native", {entry, functionRef, result});
                    // }

                    break;
                case "import":
                    break;
                default:
                //const result = findStateInState(functionRef, scrObject.contentWindow, [scrObject]);
                // if (result.found) {
                //     entry.callerType = "native";
                //     console.log("native", {functionRef, result});
                // }

            }

        } else {
            //todo:
            // console.log("NF", {functionRef, location});
        }


        return location;
    };

    scrObject[alIdentifierName] = (
        uid, traceEventType, ...rest
    ) => {
        // console.log("windowRoots", stateToRefArray(scrObject.contentWindow));//

        // console.log("ref", {uid, traceEventType, rest});
        if (traceEventType === TraceEvents.P) {
            const [importSourceName, importSourceIndex, importRef] = rest;
            const importZoneExpressionData = scrObject.aleJSEN?.registerImportRef(importSourceName, importSourceIndex, importRef, aleInstance);
            const {expressionId, ...ex} = importZoneExpressionData ?? {};
            scrObject.registerImportState(importRef, importZoneExpressionData);
            // console.log("IMP", expressionId, ex);

            const entry = new TimelineEntry(
                traceEventType, uid,
                null, null, null,
                null, null, expressionId, null,
                true, false, false, false,
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
            //  console.log("API REGISTER", [uid, traceEventType,...rest]);
            // handles BALE's makeAlCall calls
            // alValueParamNumber = 3 := value
            const [pre, val, post, ...extra] = rest;

            let value = val;


            const {
                expressionId,
                calleeExpressionId,
                calleeObjectExpressionId,
                calleePropertyExpressionId,
                preExtra
            } = pre;


            // preExtra.length && console.log("REF",preExtra); //[uid, traceEventType,...rest, preExtra]

            const [jsxReplacementType, reactApiObj] = preExtra;

            let isReactObject = false;

            switch (jsxReplacementType) {
                case JSXExpressionReplacementType.refAppend:
                case JSXExpressionReplacementType.refIntercept:
                    value = value ?? reactApiObj?.createRef?.();
                    isReactObject = true;
                    break;

            }
            // jsxReplacementType && console.log("JSX", {jsxReplacementType, val, value});


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

            // if (isReactObject) {
            //     entry.graphicalAPIName(SupportedApis.React);
            //     entry.graphicalObject(() => value?.current);
            //
            // }

            if (isFunction(value)) {
                // console.log("TraceEvents.L isFunction", {value, rest});
                entry._func = value;
                scrObject.currentCallers.push(entry);
                scrObject.registerCurrentFunction(value, entry);

            }

            scrObject.timeline.push(entry);
            aleInstance?.onTraceChange?.();

            return value;
        } else {

            if (traceEventType === TraceEvents.I) {
                // handles BALE's makeEnterCall calls
                const [scopeType, scopeThis, ...more] = rest;
                //console.log("traceEventType", {traceEventType, rest, f: scrObject.currentCallers});


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
                let callerTimeLineEntry = null;
                switch (scopeType) {
                    case ScopeTypes.P:
                        const contentWindow = more[0];
                        scrObject.contentWindow = contentWindow;
                        aleJSEN.windowRoots(contentWindow);

                        // console.log("windowRoots", more, aleJSEN, stateToRefArray(contentWindow));
                        break;
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
                        callerTimeLineEntry = scrObject.currentCallers.pop();
                        // console.log("ScopeTypes.F", {rest, value, functionIdNode,
                        //     expressionIdNode,
                        //     uid, paramsValue});
                        //
                        // if(isFunction(value)){
                        //     console.log("ScopeTypes.F f", {value});
                        // }

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

                if (callerTimeLineEntry) {
                    entry.calleeType = "local";
                    entry.callerTimeLineEntry = callerTimeLineEntry;
                    callerTimeLineEntry.callerType = "local";
                    callerTimeLineEntry.calleeEntry = entry;
                }


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
        // console.log("lastExpressionId", lastExpressionId);
        if (lastExpressionId) {
            const zoneData = getZoneDataByExpressionId(aleInstance, lastExpressionId);
            const babelLoc = getZoneDataLoc(zoneData);

            if (babelLoc) {
                let entry = null;

                const errorObject = makeError(e, babelLoc);
                // console.log("lastExpressionId", {lastExpressionId, zoneData, errorObject});
                //todo: on trace change trigger notification via updateplaygorund failure: done
                if (scrObject) {
                    const traceEventType = TraceEvents.E;
                    const expressionId = lastExpressionId;

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
