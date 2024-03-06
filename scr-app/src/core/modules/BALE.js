import {
    ensureIfStatementBlock,
    isImportOrRequireCallExpression,
    getSourceCode,
    getScopeUID,
} from '../../utils/babelUtils';

import DiffMatchPathJs from "../../utils/DiffMatchPathJs";

import {
    babelParse,
    babelTraverse,
    babelGenerate,
    babelTypes as t,
    TraceEvents,
    ScopeTypes,
    isUnInitializedVariableDeclarator,
    isLoggableExpression,
    isLoggableExpressionBasedOnParent,
    isLoggableMemberExpression,
    isCollectionLikeExpression,
    JSXExpressionReplacementType,
    resolveJSXExpressionReplacementType,
    isLoggableScope,
    isLoggableStatement,
    isLoggableExpressionArgument,
    isStatementOrExpressionWithArgument,
    isSupportingContextOfExpression,
    isControlScope,
    getScopeExitType,
    getPathScopeExits, getPathScopeType, ScopeExitTypes, isScopeExitStatement, ErrorTypes,
} from "./ALE";

const blacklist = [
    "document.getElementById",
    "React.useState",
    "window.*",
    "useState"
];

function getCalleeFullName(path, parts = []) {
    if (path.isMemberExpression()) {
        const {object, property, computed} = path.node;

        getCalleeFullName(path.get('object'), parts); // Recursively get the object part

        if (computed) {
            // For computed properties, handle different types of property expressions
            if (path.get('property').isLiteral()) {
                parts.push(`[${property.value}]`); // For literals like obj['prop']
            } else if (path.get('property').isIdentifier()) {
                parts.push(`[${property.name}]`); // For identifiers used in a computed way like obj[propName]
            } else {
                // For more complex expressions, you might choose to simplify or handle specifically
                parts.push('[ComputedProperty]'); // Placeholder for complex computed properties
            }
        } else {
            parts.push(property.name); // For non-computed properties, directly use the property name
        }
    } else if (path.isIdentifier()) {
        parts.push(path.node.name); // Base case: add the identifier name
    } else if (path.isThisExpression()) {
        parts.push('this'); // Handle `this` expressions
    } else {
        // For other cases, you might choose to simplify or handle specifically
        parts.push('[ComplexExpression]'); // Placeholder for other complex expressions
    }

    return parts.join('.');
}


function isBlacklisted(calleeName, blacklist) {
    for (let pattern of blacklist) {
        if (pattern.endsWith(".*")) {
            const objectName = pattern.slice(0, -2);
            if (calleeName.startsWith(objectName + ".")) {
                return true; // Matches a pattern like "window.*"
            }
        } else if (pattern.includes(".")) {
            if (calleeName === pattern) {
                return true; // Matches a fully qualified name like "document.getElementById"
            }
        } else {
            const parts = calleeName.split('.');
            if (parts.includes(pattern)) {
                return true; // Matches a simple name that appears anywhere in the callee name
            }
        }
    }
    return false;
}


export function markPathAsVisited(path) {
    path.state = true;
}

export const sharedIdentifiers = {
    undefinedIdentifier: t.identifier('undefined'),
    jsxRefIdentifier: t.jsxIdentifier("ref"),
    reactIdentifier: t.identifier("React"),
};

export const undefinedIdentifier = () => sharedIdentifiers.undefinedIdentifier;
export const jsxRefIdentifier = () => sharedIdentifiers.jsxRefIdentifier;
export const reactIdentifier = () => sharedIdentifiers.reactIdentifier;

let makeAlIdentifier = (identifierName = 'l') => {
    const property = t.identifier(identifierName);
    if (globalObjectIdentifierName) {
        if (scrObjectIdentifierName) {
            const object = t.memberExpression(
                t.identifier(globalObjectIdentifierName),
                t.identifier(scrObjectIdentifierName)
            );
            return t.memberExpression(object, property);
        } else {
            const object = t.identifier(globalObjectIdentifierName);
            return t.memberExpression(object, property);
        }

    } else {
        if (scrObjectIdentifierName) {
            const object = t.identifier(scrObjectIdentifierName);
            return t.memberExpression(object, property);
        } else {
            return property;
        }
    }
};

let makeParamsIdentifier =
    (uid) => t.identifier(`${alParamsIdentifierName}${uid}`);

let makeAnonymousIdentifier =
    (uid) => t.identifier(`${alAnonymousIdentifierName}${uid}`);


let buildExceptionCallbackString = () => `${
    globalObjectIdentifierName ? `${globalObjectIdentifierName}.` : ''
}${
    scrObjectIdentifierName ? `${scrObjectIdentifierName}.` : ''}${
    alExceptionCallbackIdentifierName
}`;

let buildGlobalScrObjectString = () => `${
    globalObjectIdentifierName ?
        `${globalObjectIdentifierName}.` : ''
}${
    scrObjectIdentifierName
}`;

let alValueParamNumber = 3; // parameter number in 'alIdentifier' call
let globalObjectIdentifierName = 'window.top';
let scrObjectIdentifierName = 'scr';
let alIdentifierName = "_l";
let alPreIdentifierName = '_i';
let alPostIdentifierName = '_o';
let alLocatorIdentifierName = '_p';
let alParamsIdentifierName = `_$arguments$_`
let alAnonymousIdentifierName = `_$anonymous$_`;
let alExceptionCallbackIdentifierName = `_e`;

let exceptionCallbackString = buildExceptionCallbackString();
let alIdentifier = makeAlIdentifier(alIdentifierName);
let alPreIdentifier = makeAlIdentifier(alPreIdentifierName);
let alPostIdentifier = makeAlIdentifier(alPostIdentifierName);
let alLocatorIdentifier = makeAlIdentifier(alLocatorIdentifierName);

let globalScrObjectString = buildGlobalScrObjectString();

export const setAutoLogIdentifiers = (
    identifiers = {}
) => {
    makeAlIdentifier =
        identifiers.makeAlIdentifier ?? makeAlIdentifier;
    makeParamsIdentifier =
        identifiers.makeParamsIdentifier ?? makeParamsIdentifier;
    makeAnonymousIdentifier =
        identifiers.makeAnonymousIdentifier ?? makeAnonymousIdentifier;
    buildExceptionCallbackString =
        identifiers.buildExceptionCallbackString ??
        buildExceptionCallbackString;
    buildGlobalScrObjectString =
        identifiers.buildGlobalScrObjectString ??
        buildGlobalScrObjectString;

    alValueParamNumber =
        identifiers.alValueParamNumber ?? alValueParamNumber;
    globalObjectIdentifierName =
        identifiers.globalObjectIdentifierName ?? globalObjectIdentifierName;
    scrObjectIdentifierName =
        identifiers.scrObjectIdentifierName ?? scrObjectIdentifierName;
    alIdentifierName =
        identifiers.alIdentifierName ?? alIdentifierName;
    alPreIdentifierName =
        identifiers.alPreIdentifierName ?? alPreIdentifierName;
    alPostIdentifierName =
        identifiers.alPostIdentifierName ?? alPostIdentifierName;
    alLocatorIdentifierName =
        identifiers.alLocatorIdentifierName ?? alLocatorIdentifierName;
    alExceptionCallbackIdentifierName =
        identifiers.alExceptionCallbackIdentifierName ??
        alExceptionCallbackIdentifierName;

    exceptionCallbackString = buildExceptionCallbackString();
    alIdentifier = makeAlIdentifier(alIdentifierName);
    alPreIdentifier = makeAlIdentifier(alPreIdentifierName);
    alPostIdentifier = makeAlIdentifier(alPostIdentifierName);
    alLocatorIdentifier = makeAlIdentifier(alLocatorIdentifierName);
    globalScrObjectString = buildGlobalScrObjectString();
};

export const getAutoLogIdentifiers = () => ({
    makeAlIdentifier,
    makeParamsIdentifier,
    makeAnonymousIdentifier,
    buildExceptionCallbackString,
    alValueParamNumber,
    globalObjectIdentifierName,
    scrObjectIdentifierName,
    alIdentifierName,
    alPreIdentifierName,
    alPostIdentifierName,
    alLocatorIdentifierName,
    alExceptionCallbackIdentifierName,
    globalScrObjectString,
    exceptionCallbackString,
    alIdentifier,
    alPreIdentifier,
    alPostIdentifier,
    alLocatorIdentifier,
});


export function isAlNode(node) {
    return (
        node &&
        node.type === "CallExpression" &&
        (
            (
                (node.callee.type === 'Identifier'
                    && node.callee.name === alIdentifierName) ||
                (node.callee.type === "MemberExpression"
                    && node.callee.property.name === alIdentifierName))
            &&
            (
                !scrObjectIdentifierName ||
                (
                    (node.callee.object.type === 'Identifier' &&
                        node.callee.object.name === scrObjectIdentifierName) ||
                    (node.callee.object.type === "MemberExpression" &&
                        node.callee.object.property.name === scrObjectIdentifierName)
                )
            ) &&
            (!globalObjectIdentifierName ||
                (node.callee.object.object.type === 'Identifier'
                    && node.callee.object.object.name === globalObjectIdentifierName)
            )
        )
    )
}

export function getOriginalNode(node) {
    if (!isAlNode(node)) {
        return node;
    }

    do {
        node = node?.arguments?.[alValueParamNumber];
    } while (isAlNode(node));

    return (node);
}


function makeAlPreCall(id, ...rest) {
    return t.callExpression(alPreIdentifier, [
        t.stringLiteral(`${id}`),
        ...rest
    ]);
}

function makeAlPostCall(id, ...rest) {
    return t.callExpression(alPostIdentifier, [
        t.stringLiteral(`${id}`),
        ...rest
    ]);
}

function makeAlCall(uid, ...rest) {
    return t.callExpression(alIdentifier, [
        t.stringLiteral(`${uid}`),
        t.stringLiteral(TraceEvents.L),
        ...rest
    ]);
}

function makeAlSpecialCall(uid, ...rest) {
    return t.callExpression(alIdentifier, [
        t.stringLiteral(`${uid}`),
        t.stringLiteral(TraceEvents.R),
        ...rest
    ]);
}

function makeEnterCall(uid, scopeType, ...rest) {
    return t.callExpression(alIdentifier, [
        t.stringLiteral(`${uid}`),
        t.stringLiteral(TraceEvents.I),
        t.stringLiteral(scopeType),
        t.thisExpression(),
        ...rest
    ]);
}

function makeExitCall(uid, scopeType, scopeExitType, ...rest) {
    const paramsIdentifier =
        (scopeType === ScopeTypes.F ||
            scopeExitType === ScopeExitTypes.R ||
            scopeExitType === ScopeExitTypes.Y
        ) ? makeParamsIdentifier(uid)
            : undefinedIdentifier();
    return t.callExpression(alIdentifier, [
        t.stringLiteral(`${uid}`),
        t.stringLiteral(TraceEvents.O),
        t.stringLiteral(scopeType),
        t.thisExpression(),
        paramsIdentifier,
        t.stringLiteral(`${scopeExitType}`),
        ...rest
    ]);
}

function makeImportLogCall(id, ...rest) {
    return (
        t.callExpression(alIdentifier, [
            t.stringLiteral(`${id}`),
            t.stringLiteral(TraceEvents.P),
            ...rest
        ])
    );
}

function makeImportLogStatement(...rest) {
    return t.expressionStatement(makeImportLogCall(...rest));
}


// BABEL AUTO LOG EVERYTHING
let c = 0;
let previousCode = null;


export const doCale = (ast, cale) => {
    if (!(ast && cale)) {
        return;
    }

    if (!ast.comments) {
        return
    }

    ast.comments.forEach((comment, id) => {
        const commentHandler = (getCommentCheck) => {

            const codeCommentCheck = getCommentCheck(comment, comment.value);
            //
            if (codeCommentCheck) {
                //console.log("codeCommentCheck", comment.value, codeCommentCheck);
                return codeCommentCheck;
            }
            return null;
        };
        cale.onCodeComment(commentHandler);
    });
};


export function preBALE(code, options) {
    const disableConsoleWarnings =
        options === true || options.disableProgramScopeExit;
    const disableProgramScopeExit =
        options === true || options.disableProgramScopeExit;
    const enableDynamicImportDynamicSources =
        !options === true || options.enableDynamicImportDynamicSources;


    const exceptions = [];
    const errors = [];
    //throwable change is bale object and refs
    const throwables = {
        exceptions,
        errors,
    };

    const ast = babelParse(code, undefined, throwables);

    // const commentsText = ast?.comments?.reduce((r, e) => {
    //     return `${r}:${e.value}`;
    // }, "") ?? "";

    const commentsText = JSON.stringify(ast?.comments?.map(c => c.value) ?? []);
    const commentsLocs = ast?.comments?.map(c => ({...(c.loc ?? {})})) ?? [];

    return {
        preBALE,
        commentsText,
        commentsLocs,
        disableConsoleWarnings, disableProgramScopeExit, enableDynamicImportDynamicSources,
        throwables,
        ast
    };
}

export default function BabeAutoLogEverything(
    code,
    zale,
    cale,
    customTraverseEnter = null,
    customTraverseExit = null,
    options = {},
    key = 0,
) {
    const {
        disableConsoleWarnings, disableProgramScopeExit,
        enableDynamicImportDynamicSources, throwables,
        ast
    } = preBALE === code?.preBALE ? code : preBALE(code, options);

    const _this = this;
    const scopesMaps = {};

    // if (previousCode) {
    //     const diffMatchPathJs =new DiffMatchPathJs();
    //     const diff = diffMatchPathJs.diff_main(previousCode, code);
    //     const ast0 = babelParse(code, undefined, throwables);
    //     console.log("BALE", {diff, ast0, ast});
    // }
    //
    // previousCode = code;

    // throwables.errors.push(...(ast?.errors ?? []));
    const {errors, exceptions} = throwables;

    let error = {
        errorType: ErrorTypes.P,
        errorCase: 'bale',
        exceptions,
        errors,
    };

    const throws = () => {
        if (error.exceptions?.length > 0 || error.errors?.length > 0) {
            return true;
        }
        return false;
    };


    const bale = {
        ast,
        output: null,
        visitor: null,
        scopesMaps,
        error: null,
        throws
    };


    if (bale.throws()) {
        bale.error = error;
        return bale;
    }

    if (!zale) {
        bale.error = {
            ...error,
            errorType: ErrorTypes.B,
            errorCase: 'zale',
        };
        return bale;
    }

    const {
        expressions, registerExpression, registerImport, zones
    } = zale;

    let lastImportStatement = null;
    let importsContainer = null;
    let makeImportLogStatements = [];

    c++;

    bale.uidOffset = -1;

    bale.uidOnset = (uid) => {
        if (bale.uidOffset < 0) {
            return uid;
        }

        return uid - bale.uidOffset;
    };

    doCale(ast, cale);
    const codeCommentChecks = cale?.commentChecksByType();

    bale.visitor = {
        enter: (path) => {
            customTraverseEnter && customTraverseEnter(path, _this);

            // if (path.isFile()) {
            //     console.log("isComment", path);
            // }

            if (codeCommentChecks) {
                const line = (path.node?.loc?.start?.line) ?? -1;
                if (line > 0) {
                    // console.log(">>", {path, line,  codeCommentChecks});
                    const m = codeCommentChecks.find(c => c.afterLineNumber + 1 === line);
                    if (m) {

                        path.state = true;
                        return;
                    }

                }
            }

            if (bale.uidOffset < 0) {
                // console.log("bale.visitor", path);
                bale.uidOffset = path.scope?.uid ?? -1;
            }

            if (path.state) {
                return;
            }


            if (path.key === 'left' && path.parentPath?.isAssignmentExpression()) {
                markPathAsVisited(path);
            }

            if (path.parentPath?.state) {
                markPathAsVisited(path);
            }

            if (path.isProgram()) {
                addScope(path);
                return;
            }

            if (
                isCollectionLikeExpression(path) ||
                isLoggableExpression(path) ||
                isLoggableExpressionBasedOnParent(path) ||
                isStatementOrExpressionWithArgument(path) ||
                isSupportingContextOfExpression(path) ||
                isScopeExitStatement(path)
            ) {
                registerExpression(path);
            }

            if (isLoggableScope(path)) {
                const expressionId = registerExpression(path);

                const scopeType = getPathScopeType(path);

                switch (scopeType) {
                    case ScopeTypes.N:
                        break;
                    case ScopeTypes.P:
                    case ScopeTypes.S:
                    case ScopeTypes.C:
                        addScope(path, scopeType, expressionId);
                        if (path.isLoop()) {
                            path.ensureBlock();
                            return;
                        }

                        if (path.isIfStatement()) {
                            ensureIfStatementBlock(path);
                            return;
                        }
                        return;
                    case ScopeTypes.F:
                        addScope(path, scopeType, expressionId);
                        path.ensureBlock();
                        return;
                    case ScopeTypes.E:
                        addScope(path, scopeType, expressionId);
                        if (path.isCatchClause()) {
                            path.ensureBlock();
                        }
                        return;
                    default:
                }
            }
        },
        exit: (path) => {
            customTraverseExit && customTraverseExit(path, _this);

            if (path.state) {
                return;
            }

            if (path.isProgram()) {
                wrapProgramScope(path);
            }

            if (isLoggableScope(path)) {

                const scopeType = getPathScopeType(path);

                switch (scopeType) {
                    case ScopeTypes.N:
                        break;
                    case ScopeTypes.S:
                        wrapClassScope(path);
                        break;
                    case ScopeTypes.F:
                        wrapFunctionScope(path);
                        break;
                    case ScopeTypes.E:
                        wrapExceptionScope(path);
                        break;
                    case ScopeTypes.P:
                    case ScopeTypes.C:
                    default:

                        if (// enter's ensureBlock guarantees isBlockStatement
                            path.isBlockStatement() &&
                            isControlScope(path.parentPath)
                        ) {
                            wrapControlScope(path);
                        }

                        // isSwitchStatement not needed
                        if (path.isSwitchCase()) {
                            wrapSwitchCaseScope(path);
                        }
                }

                return;

            }

            // isStatementOrExpressionWithArgument
            if (isLoggableStatement(path)) {
                if (addScopeExit(path)) {
                    return;
                }
            }

            const jsxReplacementType = resolveJSXExpressionReplacementType(path);
            if (jsxReplacementType) {
                logExpression(
                    path, jsxReplacementType //null, null,
                );
                return;
            }

            if (isLoggableExpression(path)) {
                if (isImportOrRequireCallExpression(path)) {
                    logImportDeclaration(path);
                } else {
                    logExpression(path);
                }
                return;
            }

            if (isLoggableExpressionBasedOnParent(path)) {
                if (isImportOrRequireCallExpression(path.parentPath)) {
                    // enableDynamicImportDynamicSources:false
                    // prevents logging imports or require call parameters
                    enableDynamicImportDynamicSources && logExpression(path);
                } else {
                    logExpression(path);
                }
                return;
            }

            if (isLoggableMemberExpression(path)) {
                //not reachable
                if (isImportOrRequireCallExpression(path.parentPath)) {
                    // enableDynamicImportDynamicSources:false
                    // prevents logging imports or require call parameters
                    enableDynamicImportDynamicSources && logExpression(path);
                } else {
                    // !isAlNode(path.parentPath?.node) &&
                    logExpression(path);
                }
                return;
            }

            // isStatementOrExpressionWithArgument with lower precedence
            if (isLoggableExpressionArgument(path)) {
                logExpression(path);
                return;
            }

            if (path.isImportDeclaration()) {
                logImportDeclaration(path);
                //return;
            }
        }
    };
    // babelTraverse(babelParse(code, undefined, throwables), bale.visitor, throwables);
    babelTraverse(bale.ast, bale.visitor, throwables);

    if (bale.throws()) {
        bale.error = {
            ...error,
            errorCase: 'traverse',
        };
        return bale;
    }

    wrapLogImportDeclarations();

    bale.output = babelGenerate(bale.ast, code, throwables);

    if (!bale.output) {
        bale.error = {
            ...error,
            errorCase: 'generate',
        };

        return bale;
    }

    return bale;

    function track(path, ...rest) {
        console.log(key, getSourceCode(path, code), path, ...rest);
    }

    function trackWarn(path, ...rest) {
        (
            !disableConsoleWarnings &&
            console.warn(key, getSourceCode(path, code), path, ...rest)
        );
    }

    function trackOnly(onlyForKey, path, ...rest) {
        onlyForKey === key && track(path, ...rest);
    }


    function resolveContainingScope(path) {
        return scopesMaps[addScope(path)];
    }

    function addScope(path, scopeType, expressionId) {
        expressionId = expressionId ?? registerExpression(path);
        scopeType = scopeType ?? getPathScopeType(path);
        const uid = getScopeUID(path);

        if (uid && !scopesMaps[uid]) {
            scopesMaps[uid] = {
                uid,
                scopeType,
                path,
                expressionId,
                parentPath: path.parentPath, // in case context changes
                node: {...path.node},
                loc: {...path.node.loc},
                parentLoc: path.parentPath ? {...path.parentPath.node.loc} : null,
                exits: [],
                scopeExits: getPathScopeExits(path, registerExpression)
            };
        }

        return uid;
    }

    function addScopeExit(path) {
        const scopeExitType = getScopeExitType(path);
        const containingScope = resolveContainingScope(path);

        if (!scopeExitType || !containingScope) {
            return false;
        }
        const scopeType = containingScope.scopeType;
        const scopeExitId =
            containingScope.scopeExits[scopeExitType].uid ?? (
                scopeExitType === ScopeExitTypes.T ?
                    containingScope.scopeExits[ScopeExitTypes.R].uid
                    : containingScope.scopeExits[ScopeExitTypes.N].uid
            );

        const expressionId = registerExpression(path);
        const expressionIdNode = t.stringLiteral(`${expressionId}`);

        containingScope.exits.push(expressionId);
        markPathAsVisited(path);
        // scopeExitType === ScopeExitTypes.N is handled in default block wrapping

        if (
            scopeExitType === ScopeExitTypes.T ||
            scopeExitType === ScopeExitTypes.R ||
            scopeExitType === ScopeExitTypes.Y
        ) {
            const node = path.node;
            node.argument = makeExitCall(
                scopeExitId, //0
                scopeType,
                scopeExitType,
                expressionIdNode, // 2
                node.argument ?? undefinedIdentifier(),
            );
        } else {
            if (
                scopeExitType === ScopeExitTypes.C ||
                scopeExitType === ScopeExitTypes.B
            ) {
                const i = path.container?.indexOf(path.node);
                if (i > -1) {
                    path.container.splice(
                        i,
                        0,
                        t.expressionStatement(
                            makeExitCall(
                                scopeExitId,
                                scopeType,
                                scopeExitType,
                                expressionIdNode,
                                undefinedIdentifier(),
                                undefinedIdentifier()
                                // 3 alValueParamNumber
                            )
                        )
                    );
                } else {
                    trackWarn(
                        path,
                        "! (p) => p.isSwitchCase()||p.isBlockStatement()"
                    );
                }
            }
        }


        return true;
    }

    function getOriginalNodeExpressionIndex(_node) {
        const ogNode = getOriginalNode(_node);
        return expressions.findIndex(
            p => getOriginalNode(p.node) === ogNode
        );
    }

    function logMemberExpression(path) {
        const {node} = path;
        const containingScope = resolveContainingScope(path);
        const {uid} = containingScope;

        const objectPath = path.get("object");
        let k = getOriginalNodeExpressionIndex(objectPath.node);
        if (k < 0) {
            k = registerExpression(objectPath);
        }

        const propertyPath = path.get("property");
        let l = getOriginalNodeExpressionIndex(propertyPath.node);
        if (l < 0) {
            l = registerExpression(propertyPath);
        }

        let propertyNode = node.property;//propertyPath.node;
        let isLog = true;
        if (!node.computed) {
            if (!propertyNode.decorators &&
                !propertyNode.optional &&
                !propertyNode.typeAnnotation
            ) {
                node.computed = true;
                const propertyLoc = propertyNode.loc;
                propertyNode = t.stringLiteral(propertyNode.name);
                propertyNode.loc = propertyLoc;

            } else {
                isLog = false;
            }
        }

        // resolves duplicate logging: ((a).b).((c))) as expressions are logged as node.property
        if (isLog && !isAlNode(node.property)) {
            node.property = makeAlSpecialCall(
                uid, // 0
                makeAlPreCall(l), // 2
                propertyNode, // alValueParamNumber = 3
                makeAlPostCall(l),
            );
        }

        // resolves duplicate logging: (((a.b)).(c)) as memberExpressions are logged as node.object
        if (!isAlNode(node.object)) {
            node.object = makeAlSpecialCall(
                uid, // 0
                makeAlPreCall(k), // 2
                node.object,//objectPath.node, // alValueParamNumber = 3
                makeAlPostCall(k),
            );
        }

        return {objectExpressionId: k, propertyExpressionId: l};

    }

    function logExpression(path, jsxReplacementType = undefined) {
        try {
            // jsxReplacementType && console.log( "jsxReplacementType", jsxReplacementType, path);

            // path?.parentPath?.isJSXExpressionContainer()

            // jsxReplacementType && console.log("isJSXExpressionContainer", jsxReplacementType, path);

            // path?.parentPath?.isJSXSpreadAttribute() && console.log( "isJSXSpreadAttribute", jsxReplacementType, path);

            const containingScope = resolveContainingScope(path);


            if (!containingScope) {
                trackWarn(
                    path,
                    "!containingScope"
                );
            }

            if (path.isSuper()) { // imports?
                console.log("S", path);
            }

            const i = registerExpression(path);

            const {node} = path;
            const nodeLoc = node.loc;

            const isNonInitVariableDeclarator =
                isUnInitializedVariableDeclarator(path);


            let calleeType = 'none';
            let isUndefinedNode = false;

            const nodeType =
                isNonInitVariableDeclarator ? 'isNonInitVariableDeclarator' : node.type;

            // handled at WALE's scrObject[alPreIdentifierName]
            const preCallParams = [
                i, // 0    expressionId,
                undefinedIdentifier(), // 1     calleeExpressionId,
                undefinedIdentifier(), // 2        calleeObjectExpressionId,
                undefinedIdentifier(), // 3        calleePropertyExpressionId,
                //...preExtra => [...]
                undefinedIdentifier(),  // 4 0 jsxReplacementTypeNode
                undefinedIdentifier(), // 5 1 reactIdentifier()
            ];

            if (jsxReplacementType) {
                preCallParams[4] = t.stringLiteral(`${jsxReplacementType}`);
                preCallParams[5] = reactIdentifier();
            }


            // if(path.isAssignmentExpression() && isAlNode(path.node.right)){
            //    console.log("AS", path);
            // }

            const extra = [];
            if (enableDynamicImportDynamicSources &&
                isImportOrRequireCallExpression(path)
            ) {
                path.node.arguments.forEach(argument => {
                    const j = getOriginalNodeExpressionIndex(argument);
                    if (j < 0) {
                        trackWarn(
                            path,
                            '! getOriginalNode found in expressions'
                        );
                    }

                    extra.push(t.stringLiteral(`${j}`));

                });
            }

            if (jsxReplacementType === JSXExpressionReplacementType.refIntercept) {
                //todo: consider ref rerender du to new ref every time
                let valueNode = path.node.value ?? undefinedIdentifier();
                const contained = t.isJSXExpressionContainer(valueNode);
                valueNode = contained ? valueNode.expression : valueNode;

                //console.log(JSXExpressionReplacementType.refIntercept, path, path.node.value?.type, path.node.value?.expression?.type);

                const interceptor = makeAlCall(
                    containingScope.uid,
                    makeAlPreCall(
                        ...preCallParams
                    ),
                    valueNode,
                    makeAlPostCall(i)
                );

                if (contained) {
                    path.node.value.expression = interceptor;
                } else {
                    path.node.value = t.jsxExpressionContainer(interceptor);
                }

                return;

            }


            if (jsxReplacementType === JSXExpressionReplacementType.valueAppend) {
                path.node.value = t.jsxExpressionContainer(
                    makeAlCall(
                        containingScope.uid,
                        makeAlPreCall(...preCallParams),
                        t.booleanLiteral(true),
                        makeAlPostCall(i)
                    )
                );

                return;
            }

            if (jsxReplacementType === JSXExpressionReplacementType.refAppend) {
                // try {
                path.node.attributes.push(
                    t.jsxAttribute(
                        jsxRefIdentifier(),
                        t.jsxExpressionContainer(
                            makeAlCall(
                                containingScope.uid,
                                makeAlPreCall(
                                    ...preCallParams
                                ),
                                undefinedIdentifier(),
                                makeAlPostCall(i)
                            )
                        )
                    )
                );
                // } catch (e) {
                //     console.log("ss", e);
                // }
                return;
            }


            switch (nodeType) {
                case 'CallExpression':
                case 'OptionalCallExpression':
                    if (!path.isSuper()) { // imports?
                        calleeType = node.callee.type;
                    } else {
                        track(path, "S",);
                    }
                    break;

                case 'MemberExpression':
                case 'OptionalMemberExpression':
                    const calleeFullName = getCalleeFullName(path.get('callee'));

                    if (!isBlacklisted(calleeFullName, blacklist)) {
                        // This CallExpression is whitelisted; you can process it here
                        // console.log("Whitelisted call: " + calleeFullName);
                    } else {
                        // This CallExpression is blacklisted; you might want to skip or handle differently
                        // console.log("Blacklisted call: " + calleeFullName);
                        return;
                    }
                    const parent = path.parentPath;
                    // safeguard: if isLoggableExpressionBasedOnParent() check ommited
                    const needLogging = !parent ||
                        !(
                            parent.isCallExpression() || parent.isOptionalCallExpression()
                            // ||parent.isMemberExpression() || parent.isOptionalMemberExpression()
                            // || isAlNode(parent.node) not feasible
                        );

                    if (needLogging) {
                        logMemberExpression(path);
                    } // else: handled below at logMemberExpression call

                    break;

                case 'JSXEmptyExpression':
                case 'isNonInitVariableDeclarator':
                    isUndefinedNode = true;
                    break;
            }

            if (calleeType !== "none") {
                const calleePath = path.get("callee");
                let j = getOriginalNodeExpressionIndex(calleePath.node);
                if (j < 0) {
                    j = registerExpression(calleePath);
                }

                switch (calleeType) {
                    case 'MemberExpression':
                    case 'OptionalMemberExpression':
                        const {
                            objectExpressionId, propertyExpressionId
                        } = logMemberExpression(calleePath);
                        preCallParams[1] = t.stringLiteral(`${j}`);
                        preCallParams[2] = t.stringLiteral(`${objectExpressionId}`);
                        preCallParams[3] = t.stringLiteral(`${propertyExpressionId}`);
                        break;

                    default:
                        if (!isAlNode(node.callee)) {
                            node.callee = makeAlCall(
                                containingScope.uid, // 0
                                makeAlPreCall(j), // 2
                                calleePath.node, // alValueParamNumber = 3
                                makeAlPostCall(j),
                            );
                            preCallParams[1] = t.stringLiteral(`${j}`);
                        }

                }
            }


            let replacement = makeAlCall(
                containingScope.uid, // 0
                makeAlPreCall(...preCallParams), // 2
                isUndefinedNode ?
                    undefinedIdentifier() : node, // alValueParamNumber = 3
                makeAlPostCall(i),
                ...extra // imports
            );


            if (isNonInitVariableDeclarator) {
                replacement = t.variableDeclarator(path.node.id, replacement);
            }

            if (jsxReplacementType === JSXExpressionReplacementType.containerWrap
                || jsxReplacementType === JSXExpressionReplacementType.valueWrap) {
                // console.log( "containerWrap", path);
                replacement = t.jsxExpressionContainer(replacement);
            }


            path.replaceWith(replacement);
            path.node.loc = path.node.loc ?? nodeLoc;
            markPathAsVisited(path);

        } catch (e) {
            console.log("e", e);
        }
    }

    function wrapProgramScope(path) {
        const uid = getScopeUID(path);
        const paramsIdentifier = makeParamsIdentifier(uid);
        path.node.body.unshift(
            t.variableDeclaration("const", [
                t.variableDeclarator(
                    paramsIdentifier, t.identifier('window'),
                )
            ]),
            t.expressionStatement(makeEnterCall(uid, ScopeTypes.P, paramsIdentifier))
        );
        !disableProgramScopeExit &&   // alValueParamNumber
        path.node.body.push(t.expressionStatement(
            makeExitCall(uid, ScopeTypes.P, ScopeExitTypes.N))
        );
    }

    function wrapFunctionParams(path, paramsIdentifier) {
        path.node.body.body.unshift(
            t.variableDeclaration("let", [
                t.variableDeclarator(
                    t.arrayPattern(path.node.params), paramsIdentifier
                )
            ])
        );
        path.node.params = [t.spreadElement(paramsIdentifier)];
    }

    function wrapFunctionScope(path) {
        const expressionIdNode = t.stringLiteral(`${registerExpression(path)}`);
        const uid = getScopeUID(path);
        const paramsIdentifier = makeParamsIdentifier(uid);
        const functionIdNode =
            path.isFunctionDeclaration() ?
                path.node.id
                : path.isMethod() ?
                    t.memberExpression(t.thisExpression(), path.node.key)
                    : undefinedIdentifier();
        //console.log("F", functionIdNode, path, uid, path);
        wrapFunctionParams(path, paramsIdentifier);
        let superI = -1;
        if (path.isClassMethod() && path.scope.block.kind === "constructor") {
            path.traverse({
                enter: (p) => {
                    if (superI < 0) {
                        if (p.isSuper() && p.parentPath?.isCallExpression()) {
                            const stmnt = p.getStatementParent();
                            if (stmnt?.container === path.node.body.body) {
                                superI = stmnt.container.indexOf(stmnt.node);
                            } else {
                                trackWarn(
                                    path,
                                    "! stmnt?.container === path.node.body.body"
                                );
                            }
                        }
                    } else {
                        p.stop();
                    }
                }
            });
        }

        const enterCallStatement = t.expressionStatement(
            makeEnterCall(
                uid, ScopeTypes.F, paramsIdentifier, functionIdNode, expressionIdNode
            )
        );

        const enterIfStatement = t.ifStatement(
            t.binaryExpression(
                "===",
                alLocatorIdentifier,
                t.memberExpression(
                    paramsIdentifier,
                    t.stringLiteral("0"),
                    true,
                    false
                )
            ),
            t.returnStatement(
                makeEnterCall(
                    uid, ScopeTypes.L, paramsIdentifier, functionIdNode, expressionIdNode
                )
            ),
            enterCallStatement,
        );

        if (superI < 0) {
            path.node.body.body.unshift(
                enterIfStatement //enterCallStatement
            );
        } else {
            path.node.body.body.splice(
                superI + 1,
                0,
                enterIfStatement //enterCallStatement
            );
        }

        path.node.body.body.push(
            t.expressionStatement(
                makeExitCall(uid, ScopeTypes.F, ScopeExitTypes.N)
            )
        );
    }

    function wrapControlScope(path) {
        const uid = resolveContainingScope(path).uid;
        if (path.parentPath.isForXStatement()) {
            const idNode =
                path.container.left?.type === "Identifier"
                    ? path.container.left
                    : path.container.left?.declarations?.[0]?.id;
            const ofIdNode =
                path.container.right?.type === "Identifier" ||
                (path.container.right?.type?.includes("Literal") &&
                    !path.container.right?.type?.includes("Template"))
                    ? path.container.right
                    : null;
            if (idNode) {
                if (ofIdNode) {
                    path.node.body.unshift(
                        t.expressionStatement(makeEnterCall(
                                uid, ScopeTypes.C, idNode, ofIdNode
                            )
                        )
                    );
                } else {
                    path.node.body.unshift(
                        t.expressionStatement(makeEnterCall(
                                uid, ScopeTypes.C, idNode
                            )
                        )
                    );
                }
            }
        } else {
            path.node.body.unshift(t.expressionStatement(makeEnterCall(
                uid, ScopeTypes.C
            )));
        }
        path.node.body.push(t.expressionStatement(
            makeExitCall(uid, ScopeTypes.C, ScopeExitTypes.N))
        );
        // alValueParamNumber

    }

    function wrapSwitchCaseScope(path) {
        const uid = resolveContainingScope(path).uid;

        const expressionId = registerExpression(path);
        const expressionIdNode = t.stringLiteral(`${expressionId}`);
        const l = path.node.consequent.length;
        const needsExit = l < 1 || !!path.node.consequent[l - 1].state;
        path.node.consequent.unshift(
            t.expressionStatement(
                makeEnterCall(
                    uid, ScopeTypes.A, expressionIdNode
                )
            )
        );

        if (needsExit) {
            path.node.consequent.push(
                t.expressionStatement(
                    makeExitCall(uid, ScopeTypes.C, ScopeExitTypes.N, expressionIdNode)
                ) // alValueParamNumber
            );
        }
    }

    function wrapExceptionScope(path) {
        const uid = resolveContainingScope(path)?.uid;
        const tryBlockType = t.stringLiteral(`${path.key}`);
        const isHandler = path.key === 'handler';
        const body = isHandler ? path.node.body.body : path.node.body;

        if (isHandler) {
            body.unshift(
                t.expressionStatement(
                    makeEnterCall(uid, ScopeTypes.E, tryBlockType, path.node.param)
                )
            );
        } else {
            body.unshift(
                t.expressionStatement(makeEnterCall(uid, ScopeTypes.E, tryBlockType))
            );
        }

        body.push(
            t.expressionStatement(makeExitCall(uid, ScopeTypes.E, ScopeExitTypes.N))
        ); //alValueParamNumber
    }

    //todo: super and scr object befoere available

    function wrapClassScope(path) {
        const i = registerExpression(path);
        const containingScope = resolveContainingScope(path);
        if (path.isClassDeclaration()) {
            const ib = path.container?.indexOf?.(path.node);
            if (ib > -1) {
                path.container.splice(
                    ib + 1,
                    0,
                    t.expressionStatement(
                        makeAlCall(
                            containingScope.uid,
                            makeAlPreCall(i),
                            path.node.id,
                            makeAlPostCall(i)
                        )
                    )
                );
            } else {
                trackWarn(
                    path,
                    "! path.container?.indexOf?.(path.node)"
                );
            }
        } else {
            logExpression(path);
        }
    }

    function logImportDeclaration(path) {
        if (isImportOrRequireCallExpression(path)) {

            const importSourceName = (
                t.isStringLiteral(path.node.arguments?.[0]) &&
                path.node.arguments[0].value
            );

            if (!importSourceName) {
                if (enableDynamicImportDynamicSources) {
                    logExpression(path);
                } else {
                    trackWarn(
                        path,
                        '! isStringLiteral: import/require source '
                    );
                }
                return;
            }


            const nodeLoc = path.node.loc;
            const i = registerExpression(path);

            const uid = getScopeUID(path);
            const uidParent = getScopeUID(path.parentPath);
            const j = registerImport(
                importSourceName, path, i, uid, uidParent
            );

            path.replaceWith(
                t.parenthesizedExpression(
                    t.logicalExpression("||", makeImportLogCall(
                            i,
                            path.node.arguments[0],
                            t.stringLiteral(`${j}`),
                        ),
                        path.node
                    )
                )
            );

            // console.log("makeImportLogCall", {importSourceName});

            markPathAsVisited(path);
            path.node.loc = path.node.loc ?? nodeLoc;
            return;
        }

        const i = registerExpression(path);
        markPathAsVisited(path);

        // console.log("logImportDeclaration B", path, i);

        if (importsContainer) {
            if (importsContainer !== path.container) {
                trackWarn(
                    path,
                    "! importsContainer === path.container"
                );
                lastImportStatement = null;
            } else {
                lastImportStatement = path.node;
            }
        } else {
            importsContainer = path.container;
            lastImportStatement = path.node;
        }

        const importSourceName = path.node.source.value;
        const uid = getScopeUID(path);
        const uidParent = getScopeUID(path.parentPath);

        if (!path.node.specifiers.length) {
            registerImport(
                importSourceName, path.node, i, uid, uidParent
            );
            return;
        }

        path.node.specifiers.forEach((s) => {
            const j = registerImport(
                importSourceName, s, i, uid, uidParent
            );
            // console.log("makeImportLogCall", {importSourceName}, s.local?.name,  s.imported?.name);
            //local vs imported?

            if (s.local?.name === s.imported?.name) {
                // makeImportLogStatements.push(
                //     makeImportLogStatement(
                //         i,
                //         path.node.source,
                //         t.stringLiteral(`${j}`),
                //         s.local
                //     )
                // );
            } else {
                const lId = s.local;
                // console.log("makeImportLogCall", {importSourceName}, s.local?.name,  s.local, lId);
                // const lId =
                //     s.local?.name === s.imported?.name
                //         ? s.local
                //         : t.identifier(`${s.local.name}${getScopeUID(path)}`);
                makeImportLogStatements.push(
                    makeImportLogStatement(
                        i,
                        path.node.source,
                        t.stringLiteral(`${j}`),
                        lId
                    )
                    // ,
                    // t.variableDeclaration(
                    //     "let",
                    //     [t.variableDeclarator(s.local, lId)]
                    // )
                );
                // s.local = lId;
            }
        });
    }

    function wrapLogImportDeclarations() {
        if (lastImportStatement && importsContainer) {
            const afterLastImportI =
                importsContainer.indexOf(lastImportStatement) + 1;
            if (afterLastImportI) {
                importsContainer.splice(
                    afterLastImportI,
                    0,
                    ...makeImportLogStatements
                );
            } else {
                !disableConsoleWarnings && console.warn("! no import block");
            }
        }
    }
}
