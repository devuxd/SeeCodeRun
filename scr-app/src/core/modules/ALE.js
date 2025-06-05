import {parse} from "@babel/parser";
import generate from "@babel/generator";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

export * as babelTypes from "@babel/types";

import isString from 'lodash/isString';

import {monacoProps} from "../../utils/monacoUtils";
import BALE, {getAutoLogIdentifiers, preBALE} from './BALE'; // Babel transforms

import BranchNavigatorManager from './dale/BranchNavigatorManager'; // decorate editor
import WALE from './WALE'; // trace bindings
import ZALE from './ZALE'; // zone management

import './ALE.css';
import {getScopeUID} from "../../utils/babelUtils";
import {BehaviorSubject} from "rxjs";
// import {
//     updatePlaygroundInstrumentationFailure,
//     updatePlaygroundInstrumentationSuccess, updatePlaygroundLoadFailure, updatePlaygroundLoadSuccess
// } from "../../redux/modules/playground";

// https://babeljs.io/docs/en/babel-types
// All babel-types covered unless noticed here. Last visited March, 2021.
// > handled in related type
// variableDeclaration
// expressionStatement
// decorator
// bindExpression
// classBody
// classImplements

// > Unnecessary for now
// argumentPlaceholder
// debuggerStatement
// directive
// directiveLiteral
// doExpression
// exportAllDeclaration
// exportDefaultDeclaration
// exportDefaultSpecifier
// exportNamedDeclaration
// exportNamespaceSpecifier
// exportSpecifier
// file
// interpreterDirective
// metaProperty
// noop
// privateName
// withStatement //deprecated
// TS or Flow related (Aliases: Flow...)

// Aliases resolution:
// LVal:    isArrayPattern, isAssignmentPattern, isIdentifier,
//          isMemberExpression, isObjectPattern, isRestElement,
//          isTSParameterProperty (ignored)

const debounce = (callback, waitTime, options) => {
    const {maxWait, onTimeoutCleared, onTimeoutSet} = options ?? {};
    let tid = null;
    let lastCallTime = null;
    let lastBounceTime = null;
    const debounced = function () {
        clearTimeout(tid);
        lastCallTime = Date.now();

        if (!lastBounceTime) {
            lastBounceTime = Date.now();
        }

        onTimeoutCleared?.(tid, lastCallTime, lastBounceTime);

        if (maxWait && maxWait > lastCallTime - lastBounceTime) {
            callback();
            lastBounceTime = Date.now();
            return;
        }

        tid = setTimeout(
            () => {
                callback();
                lastBounceTime = Date.now();
            },
            waitTime
        );
        onTimeoutSet?.(tid, lastCallTime, lastBounceTime);
    };

    debounced.cancel = () => {
        clearTimeout(tid);
        lastBounceTime = null;
    };

    return debounced;
}

export const ScopeTypes = {
    N: "none",
    L: "locator",
    P: "program",
    F: "function",
    A: "any",
    C: "control",
    E: "exception",
    S: "class",
};

export const ScopeExitTypes = {
    T: "throw",
    R: "return",
    Y: "yield",
    C: "continue",
    B: "break",
    N: "normal",
};

export const TraceEvents = {
    R: "R", // runtime special cases
    E: "E", // error or exception
    P: "P", // package import
    L: "L", // expression log
    O: "O", // exit branch
    I: "I", // enter branch
    D: "D", // debugger console ...
};

export const ErrorTypes = {
    P: 'compile',    // JS, CSS, HTML compile-time
    B: 'bundle',   // Bundle: Babel AutoLogEverything, iframe append,
    R: 'run',   // Playground (runtime)
};

export const LiveZoneTypes = {
    B: 'branch', // control or function blocks
    P: "package", // package import,
    O: "omit", // omit zone
    L: 'log', // other expressions
    E: 'error', // error or exception
};


export const LiveZoneDecorationStyles = {
    default: 'normal',
    normal: 'normal',
    active: 'active',
    hover: 'hover',
};

// export const DECORATION_Z_INDEX = Object.keys(LiveZoneDecorationStyles).reduce(
//    (r, v, i)=>{
//       r[v] = i+1;
//       return r;
//    },
//    {}
// );

export const getZoneDataByExpressionId = (aleInstance, expressionId) => {
    return aleInstance?.zale?.getZoneData?.(
        expressionId
    );
}

export const getZoneDataLoc = (zoneData) => {
    return zoneData?.[2]?.node?.loc;
}


// needed when errors are passed by iframe. tghey are stringified before
export const makeError = (e, babelLoc = {}, augmentError) => {
    let {line: lineNumber = 1, column: columnNumber = 0} = babelLoc.start ?? {};
    columnNumber++;

    let name = '', message = '';
    if (isString(e)) {
        const [nameSpaced, ...rest] = e.split(":");
        name = nameSpaced.replace(/\s+/, "");
        message = rest.reduce((r, e) => `${r}${r ? ":" : ""}${e}`, "")?.trim();
    } else {
        name = e?.name;
        message = e?.message;
    }

    const error = {
        constructor: {name},
        name,
        message,
        lineNumber,
        columnNumber
    };

    augmentError?.(error);

    return error;
};

export const ALEError = makeError({
    name: 'ALEError',
    message: 'use constructor\'s onError to get details',
});

export const makeRIPRExplanation = (reach, infect, propagate, reveal) => {
    return {
        reach: {
            stateFacts: {}, // prior state likely to maximize the defect
            codeFragments: {}, // defect
        },
        infect: {
            stateFacts: {}, // corrupted state
            codeFragments: {}, // dataflow
        },
        propagate: {
            stateFacts: {}, // externalized corrupted state that may produce a failure
            codeFragments: {}, // exit points from methods and where may be used to reproduce the failure.
        },
        // the oracle
        reveal: { // test values, as informal as actions to navigate the program to formal in the form of code
            controllers: {}, // tests inputs that trigger the prior state and reach the defective code
            observables: {}, // tests outputs
        }
    };
};

// export const LiveDecoratorTypes ={
//
// };

export const parseOptions = {
    sourceFilename: "ale.js", // sourceMapChain 1/3
    sourceType: "module",
    allowImportExportEverywhere: true,
    errorRecovery: true,
    createParenthesizedExpressions: false, // node.extra.parenthesized: Boolean,
    presets: [
        [
            "@babel/preset-env",
            {
                "targets": {
                    "browsers": ["ie >= 11"]
                },
                "loose": false
            }
        ],
        "@babel/preset-react"
    ],
    plugins: [
        "jsx",
        "classProperties",
        "classPrivateProperties",
        "classPrivateMethods",
        "classStaticBlock",
        "throwExpressions",
        // "syntaxOptionalChainingAssign"
        // ["syntaxOptionalChainingAssign", {version: '2023-07'}]
        // ["syntax-optional-chaining-assign", {version: '2023-07'}]
    ]
};

export const generateOptions = {
    comments: false,
    compact: true,
    concise: true,
    jsonCompatibleStrings: true,
    minified: true,
    retainFunctionParens: true,
    retainLines: true,
    sourceMaps: true,  // sourceMapChain 2/3
    sourceFileName: "ale.js",  // sourceMapChain 2/3
};

export const handleExceptionAsRefProp = (refReturningCallback, ref) => {
    try {
        return refReturningCallback();
    } catch (exception) {
        ref.exceptions ??= [];
        ref.exceptions.push(exception);
        // console.log("babel Exception", {ref, exception});
    }
};

export const babelParse = (code, options = parseOptions, ref) => {
    return handleExceptionAsRefProp(
        () => {
            const parsed = parse(code, options);
            ref.errors ??= [];
            ref.errors.push(...(parsed.errors ?? []));
            ref.exceptions ??= [];
            ref.exceptions.push(...(parsed.exceptions ?? []));
            // console.log("babel Parse", {parsed, ref, });
            return parsed;
        },
        ref
    );

};

export const babelTraverse = (ast, visitor, ref) => {
    return handleExceptionAsRefProp(
        () => {
            traverse(ast, visitor);
            // console.log("babel Traverse", {ast, ref});
            return ast;
        },
        ref
    );
};

export const babelGenerate = (initialAst, code, ref) => {
    //todo: replace with Transform
    return handleExceptionAsRefProp(
        () => {
            return generate(initialAst, generateOptions, code);
        },
        ref
    );
};

const defaultMonacoEditorLiveExpressionClassName =
    'monaco-editor-live-expression';

const baseLiveEditorConstructionOptions = {
    lineHeight: 18 + monacoProps.lineOffSetHeight,
    // 18 is the default, sync with css: max-height:18px; and padding-top
    nativeContextMenu: false,
    folding: false,
    hover: false,
    glyphMargin: true,
};
export const MonacoOptions = {
    baseLiveEditorConstructionOptions,
    liveEditorConstructionOptions: {
        ...baseLiveEditorConstructionOptions,
        extraEditorClassName:
        defaultMonacoEditorLiveExpressionClassName,
    },
    defaultMonacoEditorLiveExpressionClassName,
};

const defaultOnContentChangeDebounceWait = 100;
const defaultOnTraceChangeDebounceWait = 100;

const defaultOnContentChangeDebounceOptions = {
    leading: false,
    trailing: true,
};
const defaultOnTraceChangeDebounceOptions = {
    leading: false,
    trailing: true,
    maxWait: 500,
};

const defaultOptions = {
    onContentChangeDebounceOptions: [
        defaultOnContentChangeDebounceWait,
        defaultOnContentChangeDebounceOptions
    ],
    onTraceChangeDebounceOptions: [
        defaultOnTraceChangeDebounceWait,
        defaultOnTraceChangeDebounceOptions
    ],
};

const defaultOnError = () => {
};
// Bridge for Redux
const makeStoreActions = () => {
    return {
        updateBundle: () => {
        }, // system shows edit detected, rerun scheduled.
        updateBundleSuccess: () => {
        }, // system shows accepted code rerun in progress, only moment visualization style indicates they are obsolete.
        updateBundleFailure: () => {
        },   // Any parse errors, exceptions (JS, HTML, CSS ) and appending the iframe
        updatePlaygroundInstrumentationSuccess: () => {
        }, // web app loaded, rerunning code
        updatePlaygroundInstrumentationFailure: () => {
        }, // ALE errors coming from unsupported expressions, broken or missing execution, pre-visualization data generation
        updatePlaygroundLoadSuccess: () => {
        }, // code running, only moment visualization content is updated.
        updatePlaygroundLoadFailure: () => {
        }, // Runtime errors and exceptions are listed in editors, and system.
    }
};

export const isCollectionLikeExpression = (path) => {
    // Post processable: get values from parent to show live expressions
    return (
        // elements
        (path.isArrayPattern() || path.isArrayExpression()) ||
        // properties
        (path.isObjectPattern() || path.isObjectExpression()) ||
        // expressions
        path.isSequenceExpression()
    );
};


export const getScopeExitType = (path) => {
    if (!path) {
        return null;
    }

    if (path.isThrowStatement()) {
        return ScopeExitTypes.T;
    }

    if (path.isReturnStatement()) {
        return ScopeExitTypes.R;
    }

    if (path.isYieldExpression()) {
        return ScopeExitTypes.Y;
    }

    if (path.isContinueStatement()) {
        return ScopeExitTypes.C;
    }


    if (path.isBreakStatement()) {
        return ScopeExitTypes.B;
    }

    return null;
};

export const isScopeExitStatement = (path) => {
    return !!getScopeExitType(path);
};

export const isControlScope = (path) => {
    return (path && (
            // isDoWhileStatement, isForStatement, isWhileStatement
            path.isLoop() ||  // body
            path.isLabeledStatement() ||  // body
            path.isIfStatement() ||// consequent, alternate
            path.isSwitchStatement() // cases
        )
    )
};

export const isFunctionScope = (path) => {
    return (path && (
        // isArrowFunctionExpression, isClassMethod,
        // isFunctionDeclaration, isFunctionExpression, isObjectMethod
        path.isFunction()  // body
    ))
};

export const isExceptionalScope = (path) => {
    return (path && path.isTryStatement());
};

export const isContinuableScope = (path) => {
    return (path &&
        (
            path.isLabeledStatement() ||
            path.isLoop()
        )
    );
};

export const isBreakableScope = (path) => {
    return (path &&
        (
            path.isSwitchStatement() ||
            isContinuableScope(path)
        )
    );
};


export const isLoggableScopeBlockKey = (path) => {
    return (
        // handled in isLoggableExpression
        path &&
        path.key !== 'test' &&
        path.key !== 'update' &&
        path.key !== 'right' &&
        path.key !== "discriminant"
    );
};

export const isLoggableFunctionBlock = (path) => {
    return (
        isLoggableScopeBlockKey(path) &&
        isFunctionScope(path.parentPath)
    );
};

export const isLoggableControlBlock = (path) => {
    return (
        isLoggableScopeBlockKey(path) &&
        isControlScope(path.parentPath)
    );
};

export const isLoggableExceptionalBlock = (path) => {
    return (
        // block, handler (isCatchClause), finalizer
        isLoggableScopeBlockKey(path) &&
        isExceptionalScope(path.parentPath)
    );
};

export const isLoggableScopeBlock = (path) => {
    return (
        isLoggableFunctionBlock(path) ||
        isLoggableControlBlock(path) ||
        isLoggableExceptionalBlock(path)
    );

};

export const isLoggableScope = (path) => {
    // Complies with isScopable, it only omits isProgram.
    return (
        isFunctionScope(path) ||
        path.isClass() ||  //path.isClassDeclaration(), path.isClassExpression()
        isControlScope(path) || // only to ensure block statements and zones
        path.isSwitchCase() || //path.parentPath.isSwitchStatement - discriminant
        // isExceptionalScope(path) ||
        isLoggableScopeBlock(path)
        // path.listKey === ?
    );
};


export const getPathScopeType = (path) => {

    if (!path) {
        return ScopeTypes.N;
    }

    if (path.isProgram()) {
        return ScopeTypes.P;
    }

    if (isFunctionScope(path)) {
        return ScopeTypes.F;
    }

    if (path.isClass()) {
        return ScopeTypes.S;
    }

    if (
        isControlScope(path) ||
        path.isSwitchCase() ||
        isLoggableControlBlock(path)
    ) {
        return ScopeTypes.C;
    }

    if (isLoggableExceptionalBlock(path)) {
        return ScopeTypes.E;
    }

    return ScopeTypes.A;
};


export const getPathScopeExits = (path, registerExpression = i => i) => {
    const exits = {
        [ScopeTypes.C]: {
            uid: null,
            zoneI: null,
        },
        [ScopeExitTypes.T]: {
            uid: null,
            zoneI: null,
        },
        [ScopeExitTypes.R]: {
            uid: null,
            zoneI: null,
        },
        [ScopeExitTypes.Y]: {
            uid: null,
            zoneI: null,
        },
        [ScopeExitTypes.C]: {
            uid: null,
            zoneI: null,
        },
        [ScopeExitTypes.B]: {
            uid: null,
            zoneI: null,
        },
        [ScopeExitTypes.N]: {
            uid: null,
            zoneI: null,
        },
    };

    if (!path) {
        return exits;
    }

    const ancestry = [path, ...path.getAncestry()];

    let exceptionalBlockExitPath = null;
    let functionBlockExitPath = null;
    let functionGeneratorBlockExitPath = null;
    let continuableBlockExitPath = null;
    let breakableBlockExitPath = null;

    let controlBlockExitPath = null;

    ancestry.forEach(
        parent => {

            if (!exceptionalBlockExitPath && isExceptionalScope(parent)) {
                exceptionalBlockExitPath = parent;
            }

            if (isFunctionScope(parent)) {
                if (!functionBlockExitPath) {
                    functionBlockExitPath = parent;
                }

                if (!functionGeneratorBlockExitPath && parent.node.generator) {
                    functionGeneratorBlockExitPath = parent;
                }
            }

            if (!continuableBlockExitPath && isContinuableScope(parent)) {
                continuableBlockExitPath = parent;
            }

            if (!breakableBlockExitPath && isBreakableScope(parent)) {
                breakableBlockExitPath = parent;
            }

            if (!controlBlockExitPath && isControlScope(parent)) {
                controlBlockExitPath = parent;
            }

        });


    exits[ScopeExitTypes.T] = {
        uid: getScopeUID(exceptionalBlockExitPath),
        zoneI: registerExpression(exceptionalBlockExitPath),
    };

    exits[ScopeExitTypes.R] = {
        uid: getScopeUID(functionBlockExitPath),
        zoneI: registerExpression(functionBlockExitPath),
    };

    exits[ScopeExitTypes.Y] = {
        uid: getScopeUID(functionGeneratorBlockExitPath),
        zoneI: registerExpression(functionGeneratorBlockExitPath),
    };

    exits[ScopeExitTypes.C] = {
        uid: getScopeUID(continuableBlockExitPath),
        zoneI: registerExpression(continuableBlockExitPath),
    };

    exits[ScopeExitTypes.B] = {
        uid: getScopeUID(breakableBlockExitPath),
        zoneI: registerExpression(breakableBlockExitPath),
    };

    exits[ScopeExitTypes.N] = {
        uid: getScopeUID(path),
        zoneI: registerExpression(path),
    };


    return exits;
};

// isStatementOrExpressionWithArgument start
// subsumes isLoggableStatement
export const isStatementOrExpressionWithArgument = (path) => {
    return (path && ( // 11 cases total
        path.isBreakStatement() || path.isContinueStatement() ||
        path.isReturnStatement() || path.isThrowStatement() ||
        path.isAwaitExpression() || path.isJSXSpreadAttribute() ||
        path.isRestElement() || path.isSpreadElement() ||
        path.isUnaryExpression() ||
        path.isUpdateExpression() || // *argument not logged
        path.isYieldExpression()
    ));
};

export const isLoggableStatement = (path) => {
    return (path && ( // 5 cases
            (path.isBreakStatement() || path.isContinueStatement()) ||
            (path.isReturnStatement() || path.isYieldExpression()) ||
            path.isThrowStatement()
        )
    );
};

export const isNonLoggableExpressionWithArgument = (path) => {
    return (path && ( // 2 cases
        // Only Lvals are allowed
        path.isRestElement() ||
        // Avoids Invalid left-hand side expression in postfix operation
        path.isUpdateExpression()
    ));
};

export const isLoggableExpressionArgument = (path) => {
    return (
        path &&
        path.key === 'argument' &&
        path.parentPath && ( // 4 cases
            path.parentPath.isUnaryExpression() ||
            path.parentPath.isAwaitExpression() ||
            path.parentPath.isJSXSpreadAttribute() ||
            path.parentPath.isSpreadElement()
        )
    );
};

// isStatementOrExpressionWithArgument end 11 = 5 + 4 + 2 (OK)

export const isLoggableLiteral = (path) => {
    // requires JSX attribute handling before
    // isStringLiteral, isRegExpLiteral, isNumericLiteral, isNullLiteral,
    // isBooleanLiteral, isBigIntLiteral
    return (
        path && path.isLiteral() && !path.isTemplateLiteral() &&
        path.key !== 'source' && path.key !== 'local' &&
        path.key !== 'imported'
    );
};

export const isLoggableExpressionBasedOnKey = (path) => {
    return (
        path && (
            //  last resort, locPush isIdentifier only
            path.key === "discriminant" ||
            path.key === "test" ||
            path.key === "update" ||
            path.listKey === "expressions"// templateLiteral, sequenceExpression
        )
    );
};

export const isPureLoggableExpression = (path) => {
    return (
        path &&
        !path.isEmptyStatement() && // fixes breaking change babel 2022
        (
            path.isArrayExpression() || // isCollectionLikeExpression
            path.isAssignmentExpression() ||
            path.isAwaitExpression() || // isStatementOrExpressionWithArgument
            path.isBinary() || // isBinaryExpression, isLogicalExpression
            path.isConditionalExpression() ||
            // path.isEmptyStatement() || moved out (see above)
            path.isNewExpression() ||
            path.isObjectExpression() || // isStatementOrExpressionWithArgument
            path.isUnaryExpression() || // isStatementOrExpressionWithArgument
            path.isUpdateExpression() || // isStatementOrExpressionWithArgument
            path.isSequenceExpression() || // isCollectionLikeExpression
            path.isThisExpression() ||
            path.isCallExpression() ||
            path.isOptionalCallExpression()
        )
    );
};


export const isLoggableExpression = (path) => {
    return (
        path && (
            isLoggableLiteral(path) ||
            isPureLoggableExpression(path) ||
            isLoggableExpressionBasedOnKey(path) || (
                path.key === 'callee' && path.isIdentifier()
            )
        )
    );
};

export const isLoggableIdentifier = (path) => {
    return (
        path && (
            path.isIdentifier() &&
            isLoggableExpressionBasedOnKey(path)
        )
    );
};

export const isRegisterParameter = (path) => {
    return (
        path && (
            path.listKey === "params" && path.key >= 0
        )
    );
};

// isLoggableExpressionBasedOnParent start
export const isUnInitializedVariableDeclarator = (path) => (
    path.isVariableDeclarator() &&
    !path.node.init &&
    path.parentPath.isVariableDeclaration() &&
    !path.parentPath.parentPath?.isForXStatement()
);

export const isPathOrNodeLoggableCallExpressionCallee = (pathOrNode) => {
    // prevents DOM illegal invocation at runtime
    // (e.g. var doc = document; doc?.getX?.(y))
    const node = pathOrNode.node ?? pathOrNode;
    return (
        !t.isImport(node) &&
        !t.isSuper(node) &&
        (
            !(
                t.isMemberExpression(node) ||
                t.isOptionalMemberExpression(node)
            ) || (
                node && (
                    node.property.type === 'MemberExpression' ||
                    node.property.type === 'OptionalMemberExpression'
                )
            )
        )
    );
};

export const isLoggableMemberExpression = (path) => {
    // prevents DOM illegal invocation at runtime
    // (e.g. var doc = document; doc?.getX?.(y))
    return (
        path &&
        (
            path.isMemberExpression() ||
            path.isOptionalMemberExpression()
        )
        &&
        (!path.parentPath ||
            !(
                path.parentPath.isCallExpression() ||
                path.parentPath.isOptionalCallExpression() ||
                // avoids Invalid left-hand side expression in prefix operation
                path.parentPath.isUpdateExpression()
            )
        )
    );
};

export const isLoggableExpressionBasedOnParent = (path) => {
    return ( // parentPath-dependent
        isLoggableMemberExpression(path) ||
        (path.parentPath &&

            (isUnInitializedVariableDeclarator(path) ||
                path.parentPath.isJSXSpreadChild() ||
                path.parentPath.isJSXExpressionContainer() ||
                path.parentPath.isBinary() ||
                path.parentPath.isConditionalExpression() ||
                path.listKey === "arguments" ||
                (
                    path.key === "init" &&
                    path.parentPath.isVariableDeclarator()

                ) ||
                (
                    path.key === "value" &&
                    !path.parentPath.parentPath?.isArrayPattern() &&
                    !path.parentPath.parentPath?.isObjectPattern() &&
                    // classPrivateProperty, classProperty, objectProperty
                    path.parentPath.isProperty() &&
                    !path.isAssignmentPattern()
                ) ||
                (
                    path.key === "tag" &&
                    path.parentPath.isTaggedTemplateExpression()

                ) ||
                (
                    path.isTemplateLiteral() &&
                    !path.parentPath.isTaggedTemplateExpression()

                ) ||
                (
                    path.parentPath.isExpressionStatement() &&
                    path.isIdentifier()
                ) ||
                (
                    path.key === "right" &&
                    (
                        path.parentPath.isAssignmentExpression() ||
                        path.parentPath.isAssignmentPattern() ||
                        path.parentPath.isForXStatement()
                    )
                )
            )
        )
    );
}

// isLoggableExpressionBasedOnParent end

export const isSupportingContextOfExpression = (path) => {
    // Post processable: get values from parent to show live expressions
    return (
        path.listKey ||
        path.key ||
        path.key === 0
    );
};

export const JSXExpressionReplacementType = {
    containerWrap: "containerWrap", //
    valueWrap: "valueWrap", //
    valueAppend: "valueAppend", //
    logExpression: "logExpression",//
    spreadAttribute: "spreadAttribute",
    refIntercept: "refIntercept",//
    refAppend: "refAppend",
};

export const isJSXAttributeRef = (node) => {
    return !!node && (!node.name?.namespace && node.name?.name === "ref");
};

export const resolveJSXExpressionReplacementType = (path) => {
    if ((path.isJSXAttribute())) { // chck if container exp
        const {node} = path;

        if (isJSXAttributeRef(node)) {
            // console.log("refIntercept", {path, node});
            return JSXExpressionReplacementType.refIntercept;
        }

        if ((node && !node.value)) { // chck if container exp
            return JSXExpressionReplacementType.valueAppend;
        }

    }

    if ((
        (
            (path.isJSXElement() || path.isJSXFragment())
            && path.parentPath
            && (path.parentPath.isJSXElement() || path.parentPath.isJSXFragment())
        )
    )) {
        return JSXExpressionReplacementType.containerWrap;
    }

    if (
        (
            path.parentPath?.isJSXAttribute()
            && !isJSXAttributeRef(path.parentPath?.node)
            && path.key === "value"
            && !path.isJSXExpressionContainer()
        )
    ) {
        return JSXExpressionReplacementType.valueWrap;
    }

    if (path.isJSXElement() && (!path?.parentPath?.isJSXElement())) {
        return JSXExpressionReplacementType.logExpression;
    }

    if (path.isJSXOpeningElement()) {
        const {attributes = []} = path.node;
// console.log("attributes", {path, attributes, attribute});
        const refAttribute = attributes.find(attribute => attribute?.name?.name === "ref");

        if (refAttribute) {
            return null;
        }

        return JSXExpressionReplacementType.refAppend;

        // console.log("jsxReplacementType", jsxReplacementType, {path, attributes});
    }


    if ((path?.parentPath?.isJSXSpreadAttribute())) {
        return JSXExpressionReplacementType.spreadAttribute;
    }


    return null;
};

export const isLoopBlockStatement = (path) => {
    if (!path) {
        return false;
    }

    if (!path?.isBlockStatement() || !path.parentPath) {
        return false;
    }

    return path.parentPath.isLoop?.();
};

export const getLoopScopeUID = (path) => {
    if (!isLoopBlockStatement(path)) {
        return null;
    }

    return getScopeUID(path.parentPath);
};


class ALEManager {
    firecoPad = null;
    editorId = null;
    prevModel = null;
    ids = null;
    original = null;
    code = null;
    output = null;
    zale = null;
    scr = null; // set by WALE
    branchNavigatorManager = null; // used by rale, set by activateTraceChanges
    onTraceChange = null; // used by WALE, set by DALE
    // onOutputChange = null;
    onTraceChangeError = null;
    onContentChangeDebounceOptions = null;
    onTraceChangeDebounceOptions = null;
    customTraverseEnter = null;
    customTraverseExit = null;
    globalObject
    options = null;
    key = null;
    // handleChangeContent = null;
    // storeActions = makeStoreActions();
    traceProvider = {
        trace: {
            window: null,
            parseLiveRefs: null,
        },
    };

    constructor(
        aleFirecoPad,
        cale,
        dale,
        customTraverseEnter,
        customTraverseExit,
        globalObject,
        options,
        // storeActions,
        key,
    ) {
        this.firecoPad = aleFirecoPad;
        this.editorId = aleFirecoPad.id;
        this.cale = cale;
        this.dale = dale;
        this.ids = getAutoLogIdentifiers();
        this.customTraverseEnter = customTraverseEnter;
        this.customTraverseExit = customTraverseExit;
        this.globalObject = globalObject;
        this.options = options;
        this.key = key;
        // this.storeActions = storeActions ?? this.storeActions;
        // const {updateBundle, onBundleError, onRunError} = storeActions;
        const onContentChangeDebounceOptions =
            options === true ? defaultOptions.onContentChangeDebounceOptions
                : (
                    options.onContentChangeDebounceOptions ??
                    defaultOptions.onContentChangeDebounceOptions
                );
        const onTraceChangeDebounceOptions =
            options === true ? defaultOptions.onTraceChangeDebounceOptions
                : (
                    options.onTraceChangeDebounceOptions ??
                    defaultOptions.onTraceChangeDebounceOptions
                );
        this.onContentChangeDebounceOptions = onContentChangeDebounceOptions;
        this.onTraceChangeDebounceOptions = onTraceChangeDebounceOptions;

        // this.handleChangeContent = debounce(
        //     () => {
        //         return this._handleContentChange();
        //     },
        //     ...this.onContentChangeDebounceOptions
        // );
    }

    getModel = () => ({
        firecoPad: this.firecoPad,
        code: this.code,
        zale: this.zale,
        bale: this.bale,
        cale: this.cale,
        dale: this.dale,
        output: this.bale?.output,
        scr: this.scr,
        afterTraceChange: this.afterTraceChange,
        resetTimelineChange: this.resetTimelineChange,
        branchNavigatorManager: this.branchNavigatorManager,
    });

    setModel = (code, zale, bale, scr, afterTraceChange) => {
        this.code = code;
        this.zale = zale;
        this.bale = bale;
        this.output = bale?.output;
        this.scr = scr;
        this.afterTraceChange = afterTraceChange;
    };

    setOriginalCode = (code) => {
        this.original = code;
        this._handleContentChange();
    };

    afterTraceChange = null;

    setAfterTraceChange = (afterTraceChange) => {
        this.afterTraceChange = afterTraceChange;
    }

    resetTimelineChange = () => {
        this._traceReset?.();
    };

    activateTraceChanges = () => {
        this.branchNavigatorManager = new BranchNavigatorManager(this);
        this.setOnTraceChange(this.branchNavigatorManager.handleTimelineChange);
    }

    deactivateTraceChanges = () => {
        this.setOnTraceChange(null);
    }

    attachDALE = () => {
        this._handleContentChange();
    };

    getAutoLogIdentifiers = () => this.ids;

    getCode = () => {
        if (this.dale) {
            return this.dale.getCode();
        }
        return this.original;
    };


    preBaleObj = null;

    doPreBALE() {
        this.preBaleObj = preBALE(this.getCode(), this.options);
        const {cale, dale} = this;
        if (cale && dale) {
            cale.commentDecorator = dale.createCommentDecorator(cale.commentDecorator);
            cale.commentDecorator.update(this.preBaleObj.commentsLocs);
            //console.log("dale", {dale, ccs});
        }
        return this.preBaleObj;
    }

    undoPreBALE() {
        this.preBaleObj = null;
    }

    aleRxSubject = null;
    onALEChange = () => {
        // report bundle change via store!
        const code = this.getCode();
        const zale = (code ?? '') ? ZALE(code) : null;
        const {cale, dale} = this;
        const preBaleObj = this.preBaleObj ?? preBALE(code, this.options);
        // console.log("preBaleObj", preBaleObj, {cale, dale});
        // pass down the trigger for calling update and success as well
        const bale = BALE(
            preBaleObj,
            zale,
            cale,
            this.customTraverseEnter,
            this.customTraverseExit,
            this.options,
            this.key,
        );

        this.preBaleObj = null;

        this.prevModel = this.getModel();

        //ok: needs to happen before bundling
        this.aleRxSubject?.complete();
        this.aleRxSubject ??= new BehaviorSubject({});
        const scrObject = !bale.error ? WALE(this, this.globalObject, this.storeActions) : null;

        // console.log("B", scrObject);

        this.setModel(code, zale, bale, scrObject, this.afterTraceChange);

        if (dale) {
            dale.onContentChange();
            cale.update(dale);
        }

    };

    _handleContentChange = () => {
        // this.onALEChange();
        // this._onOutputChange();
    };

    // _onOutputChange = () => {
    //     return this.onOutputChange?.(this);
    // };

    setOnOutputChange = (onOutputChange) => {
        this.onOutputChange = onOutputChange;
    };

    setOnTraceChange = (onTraceChange) => {
        if (this._traceCallback !== onTraceChange) {
            this.onTraceChange?.cancel();
            this._traceCallback = onTraceChange;
        }

        if (onTraceChange) {
            this.onTraceChange = debounce(
                onTraceChange, ...this.onTraceChangeDebounceOptions
            );
        }
    };

    dispose = () => {
        // this.handleChangeContent?.cancel();
        this.onTraceChange?.cancel();
        this.dale?.dispose?.();
    };

    static wrapCode = (code) => {
        return (`${code}`);
    };

    //  static wrapCode = (code, exceptionCallbackString ) => {
    //      return (`
    // try{
    // ${code}
    // }catch(e){
    // ${exceptionCallbackString ? `${exceptionCallbackString}(e);` : "throw e;"}
    // }`);
    //  };


    getALECode = () => {
        return this.getModel().output?.code ?? this.getCode();
    }

    hasALECode = () => {
        return this.getCode() !== this.getALECode();
    }

    getALECodeOutput = () => {
        return this.getModel().output;
    }

    getImportsCode = () => {
        return this.getModel().output?.importsCode ?? '';
    }

    getWrappedCode = () => {
        return ALEManager.wrapCode(this.getCode());
    };

    getWrappedALECode = (isActivateTraceChanges) => {
        // const {
        //     exceptionCallbackString,
        //     globalObjectIdentifierName,
        // } = this.getAutoLogIdentifiers();
        if (isActivateTraceChanges) {

            this.activateTraceChanges();
            this.onALEChange();
        }

        if (this.hasALECode()) {
            return ALEManager.wrapCode(
                this.getALECode(),
                // exceptionCallbackString,
                // globalObjectIdentifierName
            );
        } else {
            return this.getWrappedCode();
        }
    };

    resolveCallPointByFunctionRef = (functionRef) => {
        aleInstance.scr.aleJSEN.functions()
    }

}

const ALE = (
    aleFirecoPad,
    cale,
    dale,
    customTraverseEnter = null,
    customTraverseExit = null,
    globalObject = global.top ?? global,
    options = defaultOptions,
    key = 0,
) => {

    return new ALEManager(
        aleFirecoPad,
        cale,
        dale,
        customTraverseEnter, customTraverseExit, globalObject,
        options, key
    );

};

export default ALE;

export class ALEObject {
    live = null;
    serialized = null;
    objectType = null;
    objectClassName = null;
    error = null;
    isIterable = false;
    isDOM = false;
    isOutput = false;
    graphicalId = -1;
    graphicalIds = [];
    outputRefs = [];
    scrObjectRefs = [];
    windowRootsRefs = [];
    nativesRefs = [];
    objectsRefs = [];
    functionsRefs = [];
    domNodesRefs = [];
    liveRefs = [];
    liveRefsProps = [];
    domLiveRefs = [];
    domLiveRefsToLiveRef = {};
    idiomKnowledge = null;


    constructor(value, bindSharedData) {
        this.live = value;
        bindSharedData(this);
    }

    getValue = () => {
        return this.live;
    };

    isIterable = () => {
        return this.isIterable;
    };

    isGraphical = () => {
        return this.isOutput;
    };

    getGraphicalId = () => {
        return this.graphicalId;
    };

    getOutputRefs = () => {
        return this.outputRefs;
    };

    addLiveRef = (ref, prop) => {
        let i = this.liveRefs.indexOf(ref);
        if (i > -1) {
            return i;
        }
        i = this.liveRefs.push(ref) - 1;
        this.liveRefsProps[i] = prop;
        return i;
    };

    liveRefIndex = (ref) => {
        return this.liveRefs.indexOf(ref);
    };

    isLiveRef = (ref) => {
        return this.liveRefIndex(ref) > -1;
    };

    liveRefProp = (ref) => {
        return this.liveRefsProps[this.liveRefIndex(ref)];
    };

    liveRefPropByIndex = (index) => {
        return this.liveRefsProps[index];
    };

    addDomLiveRef = (domLiveRef, liveRefI) => {
        const j = this.domLiveRefs.push(domLiveRef) - 1;
        this.domLiveRefsToLiveRef[j] = liveRefI;
        return j;
    };

    indexOfDomLiveRef = (ref) => {
        return this.domLiveRefs.indexOf(ref);
    };

    getLiveRefOfDomLiveRef = (ref) => {
        return this.liveRefs[
            this.domLiveRefsToLiveRef[
                this.indexOfDomLiveRef(ref)
                ]
            ];
    };

    isDomLiveRef = (ref) => {
        return this.indexOfDomLiveRef(ref) > -1;
    };
}

export {
    default as BALE,
    setAutoLogIdentifiers,
    getAutoLogIdentifiers,
    getOriginalNode,
} from './BALE';

export {
    default as CALE,
} from './cale/CALE';

export {
    default as DALE,
} from './dale/DALE';

export {
    RALE,
    VALE,
    ALEContext,
    GraphicalQueryBase
} from './rale';

export {
    default as WALE,
} from './WALE';

export {
    default as TALE,
} from './TALE';

export {
    default as ZALE,
} from './ZALE';
