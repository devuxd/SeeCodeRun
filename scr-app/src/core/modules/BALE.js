import {
    ensureIfStatementBlock,
    isImportOrRequireCallExpression,
    getSourceCode,
    getScopeUID,
} from '../../utils/babelUtils';

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
    resolveJSXExpressionReplacementType,
    isLoggableScope,
    isLoggableStatement,
    isLoggableExpressionArgument,
    isStatementOrExpressionWithArgument,
    isSupportingContextOfExpression,
    isControlScope,
    getScopeExitType,
    getPathScopeExits, getPathScopeType, ScopeExitTypes, isScopeExitStatement, ErrorTypes
} from "./ALE";

export function markPathAsVisited(path) {
    path.state = true;
}

export const undefinedIdentifier = t.identifier('undefined');

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
            : undefinedIdentifier;
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
export default function BabeAutoLogEverything(
    code,
    zale,
    customTraverseEnter = null,
    customTraverseExit = null,
    options = {},
    key = 0,
) {
    const disableConsoleWarnings =
        options === true || options.disableProgramScopeExit;
    const disableProgramScopeExit =
        options === true || options.disableProgramScopeExit;
    const enableDynamicImportDynamicSources =
        !options === true || options.enableDynamicImportDynamicSources;
    const _this = this;

    const scopesMaps = {};

    const exceptions = [];
    //throwable change is bale object and refs
    const throwables = {
        exceptions,
    };
    const ast = babelParse(code, undefined, throwables);
    throwables.errors = ast?.errors ?? [];
    const {errors} = throwables;

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

    bale.visitor = {
        enter: (path) => {
            customTraverseEnter && customTraverseEnter(path, _this);

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
                    path, null, null, jsxReplacementType
                );
                return;
            } else {
                if (path.isJSXElement()) {
                    logExpression(path);
                    return;
                }
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
                node.argument ?? undefinedIdentifier,
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
                                undefinedIdentifier,
                                undefinedIdentifier
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

    function logExpression(path, jsxReplacementType) {
        const {node} = path;
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

        const i = registerExpression(path);

        if (jsxReplacementType === "valueAppend") {
            path.node.value = t.jsxExpressionContainer(
                makeAlCall(
                    containingScope.uid,
                    makeAlPreCall(i),
                    t.booleanLiteral(true),
                    makeAlPostCall(i)
                )
            );
            return;
        }

        const isNonInitVariableDeclarator =
            isUnInitializedVariableDeclarator(path);

        const preExtra = [];

        const nodeLoc = path.node.loc;
        let calleeType = 'none';
        let isUndefinedNode = false;

        const nodeType =
            isNonInitVariableDeclarator ? 'isNonInitVariableDeclarator' : node.type;


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

                    preExtra.push(
                        t.stringLiteral(`${j}`),
                        t.stringLiteral(`${objectExpressionId}`),
                        t.stringLiteral(`${propertyExpressionId}`),
                    );

                    break;

                default:
                    if (!isAlNode(node.callee)) {
                        node.callee = makeAlCall(
                            containingScope.uid, // 0
                            makeAlPreCall(j), // 2
                            calleePath.node, // alValueParamNumber = 3
                            makeAlPostCall(j),
                        );

                        preExtra.push(t.stringLiteral(`${j}`));
                    }

            }
        }

        let replacement = makeAlCall(
            containingScope.uid, // 0
            makeAlPreCall(i, ...preExtra), // 2
            isUndefinedNode ?
                undefinedIdentifier : node, // alValueParamNumber = 3
            makeAlPostCall(i),
            ...extra // imports
        );


        if (isNonInitVariableDeclarator) {
            replacement = t.variableDeclarator(path.node.id, replacement);
        }

        if (jsxReplacementType === "containerWrap") {
            replacement = t.jsxExpressionContainer(replacement);
        }

        path.replaceWith(replacement);
        markPathAsVisited(path);

        path.node.loc = path.node.loc ?? nodeLoc;


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
                    : undefinedIdentifier;
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

            console.log("makeImportLogCall", {importSourceName});

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
