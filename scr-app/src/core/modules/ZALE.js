import {
    getScopeUID,
    getSourceCode,
    isImportCallExpression, isImportOrRequireCallExpression,
    isRequireCallExpression
} from "../../utils/babelUtils";

import {
    isCollectionLikeExpression,
    isLoggableExpression,
    isLoggableExpressionBasedOnParent,
    isLoggableLiteral,
    isLoggableIdentifier,
    isLoggableMemberExpression,
    isLoggableScope,
    isLoggableStatement,
    isNonLoggableExpressionWithArgument,
    isStatementOrExpressionWithArgument,
    isUnInitializedVariableDeclarator,
    LiveZoneTypes, ScopeTypes, getPathScopeExits,
    getLoopScopeUID, isRegisterParameter,
} from "./ALE";

export class LocLiveZones {
    static cloneLoc(loc, altStart = null, altEnd = null) {
        const start = altStart ? {...altStart} : {...loc.start};
        const end = altEnd ? {...altEnd} : {...loc.end};
        return {
            ...loc,
            start,
            end,
        };
    }

    static locComparator(a, b) {

        if (a?.start?.line < b?.start?.line) {
            return -1;
        }

        if (a?.start?.line > b?.start?.line) {
            return 1;
        }

        if (a?.end?.line < b?.end?.line) {
            return -1;
        }

        if (a?.end?.line > b?.end?.line) {
            return 1;
        }

        if (a?.start?.column < b?.start?.column) {
            return -1;
        }

        if (a?.start?.column > b?.start?.column) {
            return 1;
        }

        if (a?.end?.column < b?.end?.column) {
            return -1;
        }

        if (a?.end?.column > b?.end?.column) {
            return 1;
        }

        return 0;
    }

    static locCompact(locArray) {
        const temp = locArray.sort(LocLiveZones.locComparator);
        const temp2 = temp.reduce((r, e) => {
            const current = r[r.length - 1];
            if (current && (
                current.end.line === e.start.line && (
                    current.end.column === e.start.column || (
                        current.end.line === e.end.line &&
                        current.end.column > e.start.column &&
                        current.end.column <= e.end.column
                    )
                )
            )) {
                current.end = e.end;
                // r[r.length - 1] =
                //    LocLiveZones.cloneLoc(current, null, e.end);

            } else {
                e && r.push(LocLiveZones.cloneLoc(e));
            }
            return r;
        }, []);

        console.log("locCompact", {temp, temp2});
        return temp2;
    }

    parent = null;
    mainAnchor = null;
    alternateAnchor = null;
    highlights = [];
    compactHighlights = null;
    alternateHighlights = [];
    alternateCompactHighlights = null;
    forceAlternativeAsMain = false;

    paramsLocs = [];
    paramsRestAnchor = null;

    isFunction() {
        return this.paramsLocs.length && this.paramsRestAnchor;
    }

    setFunctionParams(paramsLocs) {
        this.paramsLocs = paramsLocs;
    }

    setFunctionParamsRestAnchor(paramsRestAnchor) {
        this.paramsRestAnchor = paramsRestAnchor;
    }

    getFunctionParams() {
        return this.paramsLocs;
    }

    getFunctionParamsRestAnchor() {
        return this.paramsRestAnchor;
    }

    setParent(parent) {
        this.parent = parent;
    }

    setMainAnchor(anchor) {
        this.mainAnchor = anchor;
    }

    setMainAnchorIfNone(anchor) {
        this.mainAnchor = this.getMainAnchor() ?? anchor;
    }

    getMainAnchor() {
        if (this.forceAlternativeAsMain) {
            return this.getAlternateAnchor();
        }
        return this.parent?.getMainAnchor() ?? this.mainAnchor;
    }

    setAlternateAnchor(anchor, forceAlternativeAsMain) {
        this.alternateAnchor = anchor;
        this.forceAlternativeAsMain = forceAlternativeAsMain ?? false;
    }

    getAlternateAnchor() {
        return this.parent?.getAlternateAnchor() ?? this.alternateAnchor;
    }

    pushHighlights(...highlights) {
        this.highlights.push(...highlights);
        this.compactHighlights = null;
    }

    getHighlights() {
        this.compactHighlights =
            this.compactHighlights ??
            // LocLiveZones.locCompact(
            (this.parent ? [
                    ...this.parent.getHighlights(), ...this.highlights
                ]
                : this.highlights)
        // )
        ;
        return this.compactHighlights;
    }

    pushAlternateHighlights(...highlights) {
        this.alternateHighlights.push(...highlights);
        this.alternateCompactHighlights = null;
    }

    getAlternateHighlights() {
        this.alternateCompactHighlights =
            this.alternateCompactHighlights ??
            // LocLiveZones.locCompact(
            (this.parent ? [
                    ...this.parent.getAlternateHighlights(),
                    ...(
                        this.alternateHighlights.length ?
                            this.alternateHighlights :
                            this.highlights
                    )
                ]
                : this.highlights)
        // )
        ;
        return this.alternateCompactHighlights;
    }
}

// zones general start
// x ...;
function locPushXBlockStatement(path, locLiveZones) {
    const body = path?.node?.body;

    if (!body) {
        return false;
    }

    const xAndOpeningBracketLoc = {
        start: {...path.node.loc.start},
        end: {...body.loc.start},
    };

    const closingBracketLoc = {
        start: {...body.loc.end},
        end: {...path.node.loc.end},
    };

    xAndOpeningBracketLoc.end.column++;
    closingBracketLoc.start.column--;

    locLiveZones.pushHighlights(xAndOpeningBracketLoc, closingBracketLoc);
    locLiveZones.setMainAnchor(xAndOpeningBracketLoc);
    locLiveZones.setAlternateAnchor(closingBracketLoc);
    return true;
}

// ...;
function locPushStatementSemiColon(path, locLiveZones) {
    if (!(path.parentPath?.isExpressionStatement())) {
        return false;
    }

    const semiColonLoc = {
        start: {...path.node.loc.end},
        end: {...path.parentPath.node.loc.end},
    };

    if ((path.node.extra?.parenthesized)) {
        semiColonLoc.start.column++;
    }

    locLiveZones.pushHighlights(semiColonLoc);
    locLiveZones.setAlternateAnchor(semiColonLoc);
    return true;
}

// (...)
function locPushExpressionParentheses(path, locLiveZones) {
    if (!(path.node.extra?.parenthesized)) {
        return false;
    }
    const nodeLoc = path.node.loc;

    const openingParenthesis = {
        start: {...nodeLoc.start},
        end: {...nodeLoc.start},
    };
    openingParenthesis.start.column--;

    const closingParenthesis = {
        start: {...nodeLoc.end},
        end: {...nodeLoc.end},
    };
    closingParenthesis.end.column++;

    locLiveZones.pushHighlights(openingParenthesis, closingParenthesis);
    locLiveZones.setMainAnchor(openingParenthesis);
    locLiveZones.setAlternateAnchor(closingParenthesis);

    return true;
}

function locPushAssignmentPatternOrExpressionNode(node, locLiveZones) {
    if (!node ||
        !(
            node.type === 'AssignmentPattern' ||
            node.type === 'AssignmentExpression'
        )
    ) {
        return false;
    }

    const leftAndAssignmentLoc = {
        start: {...node.loc.start},
        end: {...node.right.loc.start},
    }

    locLiveZones.pushHighlights(leftAndAssignmentLoc);
    locLiveZones.setMainAnchor(leftAndAssignmentLoc);

    return true;
}

function locPushAssignmentPattern(path, locLiveZones) {
    if (!path.isAssignmentPattern()) {
        return false;
    }
    return locPushAssignmentPatternOrExpressionNode(path?.node, locLiveZones);
}


// <JSX jsx={...}>{...}</JSX>
function locPushJSXExpressionContainerOrSpreadChild(path, locLiveZones) {
    if (!(path.isJSXExpressionContainer() || path.isJSXSpreadChild())) {
        return false;
    }
    const nodeLoc = path.node.loc;
    const expressionLoc = path.node.expression.loc;

    const openingBracketLoc = {
        start: {...nodeLoc.start},
        end: {...expressionLoc.start},
    };

    const closingBracketLoc = {
        start: {...expressionLoc.end},
        end: {...nodeLoc.end},
    };

    locLiveZones.pushHighlights(openingBracketLoc, closingBracketLoc);

    locLiveZones.setMainAnchor(openingBracketLoc);
    locLiveZones.setAlternateAnchor(closingBracketLoc);

    return true;
}

function pushLocAllPath(path, locLiveZones) {
    let nodeLoc = path?.node?.loc;
    if (!nodeLoc) {
        return false;
    }
    nodeLoc = makeLocSnapshot(nodeLoc);
    locLiveZones.pushHighlights(nodeLoc);
    locLiveZones.setMainAnchorIfNone(nodeLoc);
    return true;
}

function locPushDecorators(path, locLiveZones) {
    const decorators = path?.node?.decorators;
    if (!decorators) {
        return false;
    }
    // does not need anchoring
    return decorators.reduce((r, decorator) => {
            return (
                locPushLiteralOrIdentifierOrRestElementNode(
                    decorator, locLiveZones
                ) ||
                r
            );
        },
        false
    );
}

function locPushBindExpressionOperator(path, locLiveZones) {
    const parentPath = path.parentPath;
    if (!(path.key === 'callee' && parentPath?.isBindExpression())) {
        return false;
    }

    const operatorLoc = {
        start: {
            ...(parentPath.node.object?.loc.end ?? parentPath.node.loc.start)
        },
        end: {...path.node.loc.start}
    };

    locLiveZones.pushHighlights(operatorLoc);
    locLiveZones.setMainAnchor(operatorLoc);
    return true;
}

// zones general end


// ALE compliant path zones start:

// isLoggableScope start

// path.isFunction()
function locPushFunction(path, locLiveZones) {
    if (!path.isFunction()) {
        return false;
    }

    const params = path.node.params;
    const body = path.node.body;

    let defAndOpeningParenthesisLoc = null;
    let closingParenthesisLoc = null;
    const commasLoc = [];

    const paramsLocs = [];

    if (params.length) {
        defAndOpeningParenthesisLoc = {
            start: {...path.node.loc.start},
            end: {...params[0].loc.start},
        };

        closingParenthesisLoc = {
            start: {...params[path.node.params.length - 1].loc.end},
            end: {...body.loc.start},
        };

        let previousParam = null;
        params.forEach((param) => {
            if (!locPushLiteralOrIdentifierOrRestElementNode(param, locLiveZones)) {
                if (param.type === 'AssignmentPattern') {
                    locLiveZones.pushHighlights({
                        start: {...param.loc.start},
                        end: {...param.right.loc.start}
                    });
                } else {
                    // todo: ({...}, [...])=>{} AssignmentPatterns are a whole
                    locLiveZones.pushHighlights(makeLocSnapshot(param.loc));
                }
            }

            if (previousParam) {
                const comma = {
                    start: {...previousParam.loc.end},
                    end: {...param.loc.start},
                };

                commasLoc.push(comma);
            }
            previousParam = param;
        });
    } else {

        let anchorPos = null;

        if (path.isArrowFunctionExpression()) {
            anchorPos = {...path.node.loc.start};
        } else {
            anchorPos = {
                ...(
                    (path.node.id?.loc.end ?? path.node.id?.loc.end) ??
                    path.node.loc.start
                )
            };
        }

        defAndOpeningParenthesisLoc = {
            start: {...path.node.loc.start},
            end: anchorPos,
        };

        closingParenthesisLoc = {
            start: anchorPos,
            end: {...body.loc.start},
        };

    }

    const idAndParams = {
        start: {...path.node.loc.start},
        end: {...body.loc.start},
    };

    const openingBracketLoc = {
        start: {...body.loc.start},
        end: {...body.loc.start},
    };

    const closingBracketLoc = {
        start: {...body.loc.end},
        end: {...path.node.loc.end},
    };

    if (body.type === 'BlockStatement') {
        openingBracketLoc.end.column++;
        closingBracketLoc.start.column--;
    } else {
        locPushLiteralOrIdentifierOrRestElementNode(body, locLiveZones);
    }

    locLiveZones.pushHighlights(
        defAndOpeningParenthesisLoc,
        ...commasLoc,
        closingParenthesisLoc,
        openingBracketLoc,
        closingBracketLoc
    );

    locLiveZones.pushAlternateHighlights(
        defAndOpeningParenthesisLoc,
        closingParenthesisLoc,
        openingBracketLoc,
        closingBracketLoc
    );

    locLiveZones.setMainAnchor(closingParenthesisLoc);
    locLiveZones.setAlternateAnchor(idAndParams);

    return true;
}

// (path.isClassDeclaration() || path.isClassExpression())
function locPushClassDeclarationOrExpression(path, locLiveZones) {
    if (!(path.isClassDeclaration() || path.isClassExpression())) {
        return false;
    }
    return locPushXBlockStatement(path, locLiveZones);
}

// path.isLoop() start
function pushLocLoop(path, locLiveZones) {
    if (!path.isLoop()) {
        return false;
    }

    if (locPushForXStatement(path, locLiveZones)) {
        return true;
    }

    if (locPushDoWhileStatement(path, locLiveZones)) {
        return true;
    }

    if (locPushForOrWhileStatement(path, locLiveZones)) {
        return true;
    }
    //undesired
}

// path.isForXStatement()
function locPushForXStatement(path, locLiveZones) {
    if (!path.isForXStatement()) {
        return false;
    }
    const forToXLoc = {
        start: {...path.node.loc.start},
        end: {...path.node.right.loc.start},
    };

    locPushLiteralOrIdentifierOrRestElementNode(path.node.right, locLiveZones);

    const closingParenthesisAndOpeningBracketLoc = {
        start: {...path.node.right.loc.end},
        end: {...path.node.body.loc.start},
    };


    const closingBracketLoc = {
        start: {...path.node.body.loc.end},
        end: {...path.node.loc.end},
    };

    if (path.node.body.type === 'BlockStatement') {
        closingParenthesisAndOpeningBracketLoc.end.column++;
        closingBracketLoc.start.column--;
    }

    locLiveZones.pushHighlights(
        forToXLoc, closingParenthesisAndOpeningBracketLoc, closingBracketLoc
    );

    locLiveZones.setMainAnchor(forToXLoc);
    locLiveZones.setAlternateAnchor(closingParenthesisAndOpeningBracketLoc);
    return true;
}

// path.isDoWhileStatement()
function locPushDoWhileStatement(path, locLiveZones) {
    if (!path.isDoWhileStatement()) {
        return false;
    }

    const test = path.node.test;

    const openingBracketLoc = {
        start: {...path.node.loc.start},
        end: {...path.node.body.loc.start},
    };

    const closingBracketToLoopOpeningParenthesisLoc = {
        start: {...path.node.body.loc.end},
        end: {...test.loc.start},
    };

    const loopClosingParenthesisLoc = {
        start: {...test.loc.end},
        end: {...path.node.loc.end},
    };

    if (path.node.body.type === 'BlockStatement') {
        closingBracketToLoopOpeningParenthesisLoc.start.column--;
        openingBracketLoc.end.column++;
    }


    locLiveZones.pushHighlights(
        openingBracketLoc,
        closingBracketToLoopOpeningParenthesisLoc,
        loopClosingParenthesisLoc
    );

    locLiveZones.setMainAnchor(closingBracketToLoopOpeningParenthesisLoc);
    locLiveZones.setAlternateAnchor(loopClosingParenthesisLoc);

    return true
}

// (path.isForStatement() || path.isWhileStatement())
function locPushForOrWhileStatement(path, locLiveZones) {
    if (!(path.isForStatement() || path.isWhileStatement())) {
        return false;
    }

    const left = path.node.init || path.node.test || path.node.update;
    const right = path.node.update || path.node.test || path.node.init;

    if (left) {
        const loopLoc = {
            start: {...path.node.loc.start},
            end: {...left.loc.start},
        };

        locLiveZones.pushHighlights(loopLoc);
        locLiveZones.setMainAnchor(loopLoc);
    }


    if (path.node.init && (path.node.test || path.node.update)) {
        const nextNode = path.node.test || path.node.update;
        const colonLoc = {
            start: {...left.loc.end},
            end: {...nextNode.loc.start},
        };
        locLiveZones.pushHighlights(colonLoc);
    }

    if (path.node.test && path.node.update) {
        const nextNode = path.node.test;
        const colonLoc = {
            start: {...nextNode.loc.end},
            end: {...right.loc.start},
        };
        locLiveZones.pushHighlights(colonLoc);
    }

    if (right) {
        const closingParenthesisAndOpeningBracketLoc = {
            start: {...right.loc.end},
            end: {...path.node.body.loc.start},
        };

        if (path.node.body.type === 'BlockStatement') {
            closingParenthesisAndOpeningBracketLoc.end.column++;
        }

        locLiveZones.pushHighlights(closingParenthesisAndOpeningBracketLoc);
        locLiveZones.setAlternateAnchor(closingParenthesisAndOpeningBracketLoc);
    }

    if (!left && !right) {
        const loopAndOpeningBracketLoc = {
            start: {...path.node.loc.start},
            end: {...path.node.body.loc.start},
        };

        if (path.node.body.type === 'BlockStatement') {
            loopAndOpeningBracketLoc.end.column++;
        }

        locLiveZones.pushHighlights(loopAndOpeningBracketLoc);
        locLiveZones.setMainAnchor(loopAndOpeningBracketLoc);
        locLiveZones.setAlternateAnchor(loopAndOpeningBracketLoc);
    }

    const closingBracketLoc = {
        start: {...path.node.body.loc.end},
        end: {...path.node.loc.end},
    };

    if (path.node.body.type === 'BlockStatement') {
        closingBracketLoc.start.column--;
    }

    locLiveZones.pushHighlights(closingBracketLoc);

    return true;
}

// path.isLoop() end

// isIfStatement start
function locPushIfStatement(path, locLiveZones) {
    if (!path.isIfStatement()) {
        return false;
    }

    const test = path.node.test;
    const consequent = path.node.consequent;

    const ifAndIfOpeningParenthesisLoc = {
        start: {...path.node.loc.start},
        end: {...test.loc.start},
    };

    const ifClosingParenthesisLoc = {
        start: {...test.loc.end},
        end: {...consequent.loc.start},
    };

    locLiveZones.pushHighlights(
        ifAndIfOpeningParenthesisLoc,
        ifClosingParenthesisLoc,
    );

    locLiveZones.setMainAnchor(ifAndIfOpeningParenthesisLoc);
    locLiveZones.setAlternateAnchor(ifClosingParenthesisLoc);

    return true;
}

// (path.parentPath?.isIfStatement() && path.key !== 'test')
function locPushIfStatementBlock(path, locLiveZones) {
    if (!(path.parentPath?.isIfStatement() && path.key !== 'test')) {
        return false;
    }

    const container = path.parentPath.node;
    const consequent = container.consequent;
    const alternate = container.alternate;

    let openingBracketLoc = null;
    let closingBracketLoc = null;

    if (path.key === 'consequent') {
        openingBracketLoc = {
            start: {...consequent.loc.start},
            end: {...consequent.loc.start},
        };

        closingBracketLoc = {
            start: {...consequent.loc.end},
            end: {...consequent.loc.end},
        };

        if (consequent.type === 'BlockStatement' && !consequent.blockEnsured) {
            openingBracketLoc.end.column++;
            closingBracketLoc.start.column--;
        }

    } else {
        openingBracketLoc = {
            start: {...consequent.loc.end},
            end: {...alternate.loc.start},
        };

        closingBracketLoc = {
            start: {...alternate.loc.end},
            end: {...alternate.loc.end},
        };

        if (alternate.type === 'BlockStatement' && !alternate.blockEnsured) {
            openingBracketLoc.end.column++;
            closingBracketLoc.start.column--;
        }

    }

    locLiveZones.pushHighlights(
        openingBracketLoc,
        closingBracketLoc
    );

    // does not need anchoring
    return true;
}

// isIfStatement end

// path.isSwitchStatement()
function locPushSwitchStatement(path, locLiveZones) {
    if (!path.isSwitchStatement()) {
        return false;
    }
    const discriminant = path.node.discriminant;
    const switchAndOpeningParenthesisLoc = {
        start: {...path.node.loc.start},
        end: {...discriminant.loc.start},
    };

    let closingParenthesisAndOpeningBracketLoc = null;
    let closingBracketLoc = null
    const switchCasesCount = path.node.cases.length;
    if (switchCasesCount) {
        closingParenthesisAndOpeningBracketLoc = {
            start: {...discriminant.loc.end},
            end: {...path.node.cases[0].loc.start},
        };

        closingBracketLoc = {
            start: {...path.node.cases[switchCasesCount - 1].loc.end},
            end: {...path.node.loc.end},
        };

    } else {
        closingParenthesisAndOpeningBracketLoc = {
            start: {...discriminant.loc.end},
            end: {...path.node.loc.end},
        };

        closingBracketLoc = {
            start: {...path.node.loc.end},
            end: {...path.node.loc.end},
        };
    }

    locLiveZones.pushHighlights(
        switchAndOpeningParenthesisLoc,
        closingParenthesisAndOpeningBracketLoc,
        closingBracketLoc
    );

    locLiveZones.setMainAnchor(switchAndOpeningParenthesisLoc);
    locLiveZones.setAlternateAnchor(closingParenthesisAndOpeningBracketLoc);

    return true;
}

// path.isSwitchCase()
function locPushSwitchCase(path, locLiveZones) {
    if (!(path.isSwitchCase() && path.parentPath)) {
        return false;
    }
    const test = path.node.test;
    const consequent = path.node.consequent[0];

    let caseLoc = null;
    let colonLoc = null;

    if (test) {
        caseLoc = {
            start: {...path.node.loc.start},
            end: {...test.loc.start},
        };

        if (consequent) {
            colonLoc = {
                start: {...test.loc.end},
                end: {...consequent.loc.start},
            };
        } else {
            colonLoc = {
                start: {...test.loc.end},
                end: {...path.node.loc.end},
            };
        }

    } else {
        if (consequent) {
            caseLoc = {
                start: {...path.node.loc.start},
                end: {...consequent.loc.start},
            };

            colonLoc = {
                start: {...consequent.loc.start},
                end: {...consequent.loc.start},
            };
        } else {
            caseLoc = {
                start: {...path.node.loc.start},
                end: {...path.node.loc.end},
            };
            colonLoc = {
                start: {...path.node.loc.end},
                end: {...path.node.loc.end},
            };
        }
    }

    locLiveZones.pushHighlights(caseLoc, colonLoc);
    // does not need anchoring
    return true;
}

// path.isLabeledStatement()
function locPushLabeledStatement(path, locLiveZones) {
    if (!(path.isLabeledStatement())) {
        return false;
    }
    const label = path.node.label;
    const body = path.node.body;

    const labelLoc = {
        start: {...path.node.loc.start},
        end: {...label.loc.end},
    };
    const colonLoc = {
        start: {...label.loc.end},
        end: {...body.loc.start},
    };


    locLiveZones.pushHighlights(labelLoc, colonLoc);
    // does not need anchoring
    return true;
}

// path.parentPath.isTryStatement() start
function locPushTryStatementBlock(path, locLiveZones) {
    if (!path.parentPath?.isTryStatement()) {
        return false;
    }
    if (locPushTryBlockStatement(path, locLiveZones)) {
        return true;
    }

    if (locPushTryHandlerStatement(path, locLiveZones)) {
        return true;
    }

    if (locPushTryFinalizerStatement(path, locLiveZones)) {
        return true;
    }
    //undesired
}

// path.key === 'block'
function locPushTryBlockStatement(path, locLiveZones) {
    if (path.key !== 'block') {
        return false;
    }
    const body = path.node;

    const tryAndOpeningBracketLoc = {
        start: {...path.parentPath.node.loc.start},
        end: {...body.loc.start},
    };

    const closingBracketLoc = {
        start: {...body.loc.end},
        end: {...body.loc.end},
    };

    tryAndOpeningBracketLoc.end.column++;
    closingBracketLoc.start.column--;

    locLiveZones.setMainAnchor(tryAndOpeningBracketLoc);
    locLiveZones.pushHighlights(tryAndOpeningBracketLoc, closingBracketLoc);

    // does not need anchoring
    return true;
}

// path.key === 'handler'
function locPushTryHandlerStatement(path, locLiveZones) {
    if (path.key !== 'handler') {
        return false;
    }
    return locPushXBlockStatement(path, locLiveZones);
}

// path.key === 'finalizer'
function locPushTryFinalizerStatement(path, locLiveZones) {
    if (path.key !== 'finalizer') {
        return false;
    }
    const previousBlock =
        path.parentPath.node.handler || path.parentPath.node.block;
    const body = path.node;

    const finallyAndOpeningBracketLoc = {
        start: {...previousBlock.loc.end},
        end: {...body.loc.start},
    };

    const closingBracketLoc = {
        start: {...body.loc.end},
        end: {...body.loc.end},
    };

    finallyAndOpeningBracketLoc.end.column++;
    closingBracketLoc.start.column--;

    locLiveZones.setMainAnchor(finallyAndOpeningBracketLoc);
    locLiveZones.pushHighlights(finallyAndOpeningBracketLoc, closingBracketLoc);

    // does not need anchoring
    return true;
}

// path.parentPath.isTryStatement() end

// isLoggableScope end

// isStatementOrExpressionWithArgument start
function locPushStatementOrExpressionWithArgument(path, locLiveZones) {
    if (!isStatementOrExpressionWithArgument(path)) {
        return false;
    }

    const nodeLoc = path.node.loc;
    const argumentLoc = path.node.argument?.loc;

    if (argumentLoc && !isNonLoggableExpressionWithArgument(path)) {
        const preArgumentLoc = {
            start: {...nodeLoc.start},
            end: {...argumentLoc.start},
        };

        const postArgumentLoc = {
            start: {...argumentLoc.end},
            end: {...nodeLoc.end},
        }
        locLiveZones.pushHighlights(preArgumentLoc);

        locPushLiteralOrIdentifierOrRestElementNode(
            path.node.argument, locLiveZones
        );

        locLiveZones.pushHighlights(postArgumentLoc);

        locLiveZones.setMainAnchor(preArgumentLoc);
        locLiveZones.setAlternateAnchor(postArgumentLoc);
    } else {
        pushLocAllPath(path, locLiveZones);
    }

    return true;
}

// isStatementOrExpressionWithArgument end

// isLoggableExpression start
function locPushLoggableExpression(path, locLiveZones) {
    if (!isLoggableExpression(path)) {
        return false;
    }
    // path.isArrayExpression() || // isCollectionLikeExpression

    // path.isAssignmentExpression() // resolved generally, used by right side

    // path.isAwaitExpression() || // isStatementOrExpressionWithArgument

    if (locPushBinary(path, locLiveZones)) {
        return true;
    }

    if (locPushCallExpression(path, locLiveZones)) {
        return true;
    }

    if (locPushConditionalExpression(path, locLiveZones)) {
        return true;
    }

    if (locPushLoggableIdentifier(path, locLiveZones)) {
        return true;
    }

    if (locPushLoggableLiteral(path, locLiveZones)) {
        return true;
    }

    if (locPushNewExpression(path, locLiveZones)) {
        return true;
    }

    if (locPushThisOrEmptyExpressionOrCalleeIdentifier(path, locLiveZones)) {
        return true;
    }
    //todo: keys

    // path.isObjectExpression() || // isStatementOrExpressionWithArgument
    // path.isUnaryExpression() || // isStatementOrExpressionWithArgument
    // path.isUpdateExpression() || // isStatementOrExpressionWithArgument

}

function locPushAssignmentExpression(path, locLiveZones) {
    if (!path.isAssignmentExpression()) {
        return false;
    }

    return locPushAssignmentPatternOrExpressionNode(path?.node, locLiveZones);

}

function locPushBinary(path, locLiveZones) {
    if (!path.isBinary()) {
        return false;
    }

    const operatorLoc = {
        start: {...path.node.left.loc.end},
        end: {...path.node.right.loc.start},
    };

    locLiveZones.setMainAnchor(operatorLoc);
    locLiveZones.pushHighlights(operatorLoc);
    locLiveZones.setAlternateAnchor(operatorLoc, true);

    return true;
}

function locPushConditionalExpression(path, locLiveZones) {
    // children append conditionally
    if (!path.isConditionalExpression()) {
        return false;
    }

    const questionLoc = {
        start: {...path.node.test.loc.end},
        end: {...path.node.consequent.loc.start},
    };

    const colonLoc = {
        start: {...path.node.consequent.loc.end},
        end: {...path.node.alternate.loc.start},
    };

    locLiveZones.pushHighlights(questionLoc, colonLoc);

    // does not need anchoring
    return true;

}

function locPushLoggableIdentifier(path, locLiveZones) {
    if (!isLoggableIdentifier(path)) {
        return false;
    }

    pushLocAllPath(path, locLiveZones);

    return true;
}

function locPushTemplateLiteral(path, locLiveZones) {
    if (!(
        !path.parentPath?.isTaggedTemplateExpression() &&
        path.isTemplateLiteral()
    )) {
        return false;
    }
    return locPushTemplateLiteralNode(path.node, locLiveZones);
}

function locPushTemplateLiteralNode(node, locLiveZones) {
    if (node.type !== 'TemplateLiteral') {
        return false;
    }

    node.quasis.forEach((quasi, i) => {
        const expression = node.expressions[i];
        if (expression) {
            const quasiAndOpeningBracketLoc = {
                start: {...quasi.loc.start},
                end: {...expression.loc.start},
            };

            const closingBracketLoc = {
                start: {...expression.loc.end},
                end: {...node.quasis[i + 1].loc.start},
            };

            locLiveZones.pushHighlights(
                quasiAndOpeningBracketLoc, closingBracketLoc
            );

            if (i === 0) {
                locLiveZones.setMainAnchor(quasiAndOpeningBracketLoc);
            }
        } else {
            const quasiLoc = makeLocSnapshot(quasi.loc);
            locLiveZones.pushHighlights(quasiLoc);

            if (i === 0) {
                locLiveZones.setMainAnchor(quasiLoc);
            }
        }
    });

    return true;
}

function locPushLoggableLiteral(path, locLiveZones) {
    if (!isLoggableLiteral(path)) {
        return false;
    }

    return pushLocAllPath(path, locLiveZones);
}


function locPushNewExpression(path, locLiveZones) {
    if (!path.isNewExpression()) {
        return false;
    }

    const newLoc = {
        start: {...path.node.loc.start},
        end: {...path.node.callee.loc.start},
    };

    locLiveZones.pushHighlights(newLoc);

    const result = locPushNodeWithCalleeAndArguments(
        path.node, path.node.callee,
        path.node.arguments, locLiveZones, false
    );


    // Overrides anchor at the end
    locLiveZones.setMainAnchor(newLoc);

    return result;

}

function locPushThisOrEmptyExpressionOrCalleeIdentifier(path, locLiveZones) {
    if (!(
        path.isThisExpression() ||
        path.isEmptyStatement() ||
        (path.key === 'callee' && path.isIdentifier())
    )) {
        return false;
    }

    return pushLocAllPath(path, locLiveZones);

}

function locPushNodeWithCalleeAndArguments(
    node, callee, args, locLiveZones, allParams
) {
    if (!node || !callee || !args) {
        return false;
    }

    let openingParenthesisLoc = null;
    let closingParenthesisLoc = null;

    const commas = [];

    if (args.length && !allParams) {
        openingParenthesisLoc = {
            start: {...callee.loc.end},
            end: {...args[0].loc.start},
        };

        closingParenthesisLoc = {
            start: {...args[args.length - 1].loc.end},
            end: {...node.loc.end},
        };

        let previousArgument = null;
        args.forEach((argument) => {
            if (previousArgument) {
                const comma = {
                    start: {...previousArgument.loc.end},
                    end: {...argument.loc.start},
                };

                commas.push(comma);
            }
            previousArgument = argument;
        });

    } else {
        openingParenthesisLoc = {
            start: {...callee.loc.end},
            end: {...callee.loc.end},
        };

        closingParenthesisLoc = {
            start: {...callee.loc.end},
            end: {...node.loc.end},
        };
    }

    locLiveZones.pushHighlights(
        openingParenthesisLoc,
        ...commas,
        closingParenthesisLoc
    );

    locLiveZones.setMainAnchor(closingParenthesisLoc);

    return true;
}

function locPushMemberExpressionNode(node, locLiveZones) {
    if (node.type !== 'MemberExpression' &&
        node.type !== 'OptionalMemberExpression') {
        return false;
    }

    const dotAndPropertyLoc = {
        start: {...node.object.loc.end},
        end: {...node.property.loc.end},
    };

    if (node.computed) {
        dotAndPropertyLoc.end.column++;
    }

    locLiveZones.pushHighlights(
        dotAndPropertyLoc
    );
    // does not need anchoring
    return true;
}

function locPushCallExpression(path, locLiveZones) {
    if (!(path.isCallExpression() || path.isOptionalCallExpression())) {
        return false;
    }

    let allCallee = false;
    let allParams = false;

    if (isImportOrRequireCallExpression(path)) {
        allCallee = true;
        allParams = true;
    }

    const callee = path.node.callee;

    if (!allCallee) {
        locPushMemberExpressionNode(callee, locLiveZones);
    } else {
        const calleeLoc = {
            start: {...path.node.loc.start},
            end: {...callee.loc.end},
        };

        if (callee.computed) {
            calleeLoc.end.column++;
        }

        locLiveZones.pushHighlights(
            calleeLoc
        );
    }

    return locPushNodeWithCalleeAndArguments(
        path.node, callee, path.node.arguments, locLiveZones, allParams
    );
}

// isLoggableExpression end

// isLoggableExpressionBasedOnParent start

function locPushLoggableExpressionBasedOnParent(
    path, locLiveZones, parentSnapshot
) {
    if (!isLoggableExpressionBasedOnParent(path)) {
        return false;
    }

    let copyLocLiveZonesFromParent = false;

    if (
        path.parentPath.isJSXExpressionContainer() ||
        path.parentPath.isJSXSpreadChild()) {
        copyLocLiveZonesFromParent = true;
    }

    if (path.key === "left" && path.parentPath.isBinary()) {
        copyLocLiveZonesFromParent = true;
    }

    if (path.key === "test" && path.parentPath.isConditionalExpression()) {
        copyLocLiveZonesFromParent = true;
    }

    if (path.key === "init" && path.parentPath.isVariableDeclarator()) {
        copyLocLiveZonesFromParent = true;
    }

    if (path.key === 'argument' &&
        isStatementOrExpressionWithArgument(path.parentPath) &&
        !isLoggableStatement(path.parentPath)
    ) {
        copyLocLiveZonesFromParent = true;
    }

    if ( // todo: relax condition?
        !path.parentPath.parentPath?.isArrayPattern() &&
        !path.parentPath.parentPath?.isObjectPattern() &&
        path.parentPath.isProperty() &&
        path.key === "value" &&
        !path.isAssignmentPattern()
    ) {
        copyLocLiveZonesFromParent = true;
    }

    if (
        path.parentPath.isTaggedTemplateExpression() &&
        path.key === "tag"
    ) {
        copyLocLiveZonesFromParent = true;
    }

    if (
        (
            path.parentPath.isAssignmentExpression() ||
            path.parentPath.isAssignmentPattern() ||
            path.parentPath.isForXStatement()
        ) &&
        path.key === "right"
    ) {
        copyLocLiveZonesFromParent = true;
    }

    const isObjectOfMemberExpression = path.key === 'object' &&
        isLoggableMemberExpression(path.parentPath);


    if (copyLocLiveZonesFromParent || isObjectOfMemberExpression) {
        parentSnapshot && locLiveZones.setParent(parentSnapshot.locLiveZones);
        // locLiveZones.pushHighlights(
        //    ...parentSnapshot.locLiveZones.getHighlights()
        // );
    }


    if (isObjectOfMemberExpression) {
        return pushLocAllPath(path, locLiveZones);
    }

    if (locPushUnInitializedVariableDeclarator(path, locLiveZones)) {
        return true;
    }

    if (
        locPushLiteralOrIdentifierOrRestElementOrThisExpression(path, locLiveZones)
    ) {
        return true;
    }

}


function locPushTaggedTemplateExpression(path, locLiveZones) {
    if (!path.isTaggedTemplateExpression()) {
        return false;
    }

    locPushTemplateLiteralNode(path.node.quasi, locLiveZones);

    return true;

}

// JSX start

function locPushJSXElement(path, locLiveZones) {
    if (!path.isJSXElement()) {
        return false;
    }
    const openingElement = path.node.openingElement;
    const closingElement = path.node.closingElement;


    const startLoc = {
        start: {...openingElement.loc.start},
        end: {...openingElement.name.loc.end}
    };

    const endLoc = {
        start: {...openingElement.loc.end},
        end: {...openingElement.loc.end}
    };
    endLoc.start.column--;

    if (openingElement.selfClosing) {
        endLoc.start.column--;
    }

    locLiveZones.pushHighlights(startLoc, endLoc);
    locLiveZones.setMainAnchor(startLoc);


    if (closingElement) {
        const closingElementLoc = makeLocSnapshot(closingElement.loc);
        locLiveZones.pushHighlights(closingElementLoc);
        locLiveZones.setAlternateAnchor(closingElementLoc);
    } else {
        locLiveZones.setAlternateAnchor(endLoc);
    }

    return true;
}

function locPushJSXFragment(path, locLiveZones) {
    if (!path.isJSXFragment()) {
        return false;
    }

    const startLoc = makeLocSnapshot(path.node.openingFragment.loc);
    const endLoc = makeLocSnapshot(path.node.closingFragment.loc);

    locLiveZones.pushHighlights(startLoc, endLoc);
    locLiveZones.setMainAnchor(startLoc);
    locLiveZones.setAlternateAnchor(endLoc);

    return true;
}

function locPushJSXAttributeName(path, locLiveZones) {
    const _path = (
        path.parentPath?.isJSXAttribute() &&
        path.key === "value"
    ) ? path.parentPath
        : (path.isJSXAttribute() && !path.node.value) ? path
            : null;

    if (!_path) {
        return false;
    }

    let nameLoc = null;

    if (_path.node.value) {
        nameLoc = {
            start: {..._path.node.loc.start},
            end: {..._path.node.value.loc.start},
        };
    } else {
        nameLoc = makeLocSnapshot(_path.node.loc);
    }

    locLiveZones.pushHighlights(nameLoc);
    locLiveZones.setMainAnchor(nameLoc);

    return true;
}


// JSX end

function locPushMemberExpression(path, locLiveZones) {
    if (!(path.isMemberExpression() || path.isOptionalMemberExpression())) {
        return false;
    }

    const nodeLoc = makeLocSnapshot(path.node.loc);
    locLiveZones.setMainAnchor(nodeLoc);

    if (isLoggableMemberExpression(path)) {
        return locPushMemberExpressionNode(path.node, locLiveZones);
    }

    return pushLocAllPath(path, locLiveZones);
}

function locPushProperty(path, locLiveZones) {
    if (!path.isProperty()) {
        return false;
    }

    if (path.node.value) {
        const keyAndColonLoc = {
            start: {...path.node.loc.start},
            end: {...path.node.value.loc.start},
        };

        const optionalSemiColon = {
            start: {...path.node.value.loc.end},
            end: {...path.node.loc.end},
        };

        locLiveZones.pushHighlights(keyAndColonLoc, optionalSemiColon);
        locLiveZones.setMainAnchor(keyAndColonLoc);

    } else {
        const nodeLoc = makeLocSnapshot(path.node.loc);
        locLiveZones.pushHighlights(nodeLoc);
        locLiveZones.setMainAnchor(nodeLoc);
    }

    return true;

}

function locPushLiteralOrIdentifierOrRestElementNode(node, locLiveZones) {
    if (!node) {
        return false;
    }

    let forceAnchor = false;
    switch (node.type) {
        case 'TemplateLiteral':
            return locPushTemplateLiteralNode(node, locLiveZones);
        case 'BigIntLiteral':
        case 'BooleanLiteral':
        case 'NullLiteral':
        case 'NumericLiteral':
        case 'RegExpLiteral':
        case 'StringLiteral':
        case 'Identifier':
            break;
        case 'RestElement':
            forceAnchor = true;
            break;
        default:
            return false;
    }
    const nodeLoc = makeLocSnapshot(node.loc);
    locLiveZones.pushHighlights(nodeLoc);

    if (forceAnchor) {
        locLiveZones.setMainAnchor(nodeLoc);
    } else {
        locLiveZones.setMainAnchorIfNone(nodeLoc);
    }

    return true;
}

function locPushLiteralOrIdentifierOrRestElementOrThisExpression(
    path, locLiveZones
) {
    if (locPushTemplateLiteral(path, locLiveZones)) {
        return true;
    }

    if (
        path.isThisExpression() &&
        !path.isLVal() && !path.parentPath.isLVal()
    ) {
        return pushLocAllPath(path, locLiveZones);
    }

    return locPushLiteralOrIdentifierOrRestElementNode(path.node, locLiveZones)
}

function locPushUnInitializedVariableDeclarator(path, locLiveZones) {
    if (!isUnInitializedVariableDeclarator(path)) {
        return false;
    }

    return pushLocAllPath(path, locLiveZones);

}

function locPushVariableDeclarator(path, locLiveZones) {
    if (path.listKey !== 'declarations') {
        return false;
    }

    const declarationLength = path.parentPath.node.declarations.length;

    const idLoc = {
        start: path.key ?
            {...path.parentPath.node.declarations[path.key - 1].loc?.end}
            : {...path.parentPath.node.loc.start},
        end: path.node.init ?
            {...path.node.init.loc.start} : {...path.node.loc.end}
    };


    if (path.key) {
        idLoc.start.column++;
    }

    locLiveZones.pushHighlights(idLoc);
    locLiveZones.setMainAnchor(idLoc);

    if (declarationLength - 1 === path.key) {
        const semiColonLoc = {
            start: {...path.node.loc.end},
            end: {...path.parentPath.node.loc.end},
        };

        locLiveZones.pushHighlights(semiColonLoc);
    }

    return true;
}

// isLoggableExpressionBasedOnParent end

function locPushCollectionLikeExpression(path, locLiveZones) {
    if (!isCollectionLikeExpression(path)) {
        return false;
    }
    let collectionName = (path.isArrayPattern() || path.isArrayExpression()) ?
        'elements'
        : (path.isObjectPattern() || path.isObjectExpression()) ?
            'properties' : 'expressions';

    let collection = path.node[collectionName];

    let openingSymbol = null;
    let closingSymbol = null;
    let commas = [];
    let entries = [];
    const entriesCount = collection?.length;

    if (entriesCount) {
        openingSymbol = {
            start: {...path.node.loc.start},
            end: {...collection[0].loc.start},
        };
        closingSymbol = {
            start: {...collection[entriesCount - 1].loc.end},
            end: {...path.node.loc.end},
        };

        let prevEntry = null;

        collection.forEach(entry => {
            locPushLiteralOrIdentifierOrRestElementNode(entry, locLiveZones);

            if (prevEntry) {
                const comma = {
                    start: {...prevEntry.loc.end},
                    end: {...entry.loc.start},
                };
                commas.push(comma);
            }
            prevEntry = entry;
        });
    } else {
        openingSymbol = {
            start: {...path.node.loc.start},
            end: {...path.node.loc.end},
        };


        closingSymbol = {
            start: {...path.node.loc.end},
            end: {...path.node.loc.end},
        };

        if (collectionName !== 'expressions') { // expressions handled as (...)
            openingSymbol.end.column++;
            closingSymbol.start.column--;
        }

    }

    locLiveZones.pushHighlights(
        openingSymbol, closingSymbol, ...commas, ...entries
    );

    locLiveZones.setAlternateAnchor(
        entriesCount ? closingSymbol : openingSymbol,
        true // collectionName === 'expressions'
    );

    return true;
}


function locPushAndResolveLoggableScope(path, locLiveZones, parentSnapshot, code) {
    if (!isLoggableScope(path)) {
        return {
            isBranch: false,
            scopeType: ScopeTypes.N,
            loopScopeUID: null,
        };
    }

    const loopScopeUID = getLoopScopeUID(path);

    const result = {
        isBranch: true,
        scopeType: ScopeTypes.C,
        loopScopeUID,
    };

    // loopScopeUID && console.log("A:", loopScopeUID);

    if (locPushFunction(path, locLiveZones)) {
        result.scopeType = ScopeTypes.F;
        return result;
    }

    if (locPushClassDeclarationOrExpression(path, locLiveZones)) {
        result.scopeType = ScopeTypes.S;
        return result;
    }

    //isLoop start (done before block is modified by ensureBlock)
    if (
        pushLocLoop(path, locLiveZones) ||
        locPushIfStatement(path, locLiveZones) ||
        locPushSwitchStatement(path, locLiveZones)
    ) {
        return result;
    }

    if (
        locPushLabeledStatement(path, locLiveZones) ||
        locPushSwitchCase(path, locLiveZones)
    ) {
        // locLiveZones.pushHighlights(
        //    ...parentSnapshot.locLiveZones.getHighlights()
        // );
        parentSnapshot && locLiveZones.setParent(parentSnapshot.locLiveZones);
        return result;
    }

    if (path.key !== 'test' && path.parentPath) {
        result.scopeType = ScopeTypes.N;

        if (path.parentPath.isLoop() || path.parentPath.isFunction()) {
            // loopScopeUID && console.log("B:", loopScopeUID);
            parentSnapshot && locLiveZones.setParent(parentSnapshot.locLiveZones);

            const classXSnapshot = parentSnapshot?.parentSnapshot?.parentSnapshot;
            if (
                classXSnapshot &&
                (classXSnapshot.type === 'ClassDeclaration' ||
                    classXSnapshot.type === 'ClassExpression')
            ) {
                locLiveZones.setParent(classXSnapshot.locLiveZones);
            }
            return result;
        }

        if (locPushIfStatementBlock(path, locLiveZones)) {
            parentSnapshot && locLiveZones.setParent(parentSnapshot.locLiveZones);
            return result;
        }

        if (locPushTryStatementBlock(path, locLiveZones)) {
            return result;
        }
    }

    // reaching here is undesired
    return {
        isBranch: false,
        scopeType: ScopeTypes.N,
        loopScopeUID: null,
    };
}

// ALE compliant path zones end

export function makePathSnapshot(path, code, expressions, zones, expressionId) {
    let snapshot = expressionId >= 0 ? zones[expressionId] : null;
    if (snapshot) {
        return snapshot;
    }

    const nodeSnapshot = makeNodeSnapshot(path.node);

    if (!nodeSnapshot) {
        return null;
    }

    const registerExpression = (p, prop = 'i') => (_registerExpression(
        p, code, expressions, zones,
    )[prop]);

    const functionParams =
        path.isFunction() ? path.get("params").map(paramPath => {
                    // if (isRegisterParameter(p)) {
                    //     registerExpression(p);//
                    // }
                    let paramPathI = expressions.indexOf(paramPath);
                    if (paramPathI < 0) {
                        paramPathI = registerExpression(paramPath);
                    }
                    //console.log("fp", path, paramPathI, [...expressions]);//.find(e => e.listKey=== p.listKey)

                    return {paramPathI, zone: expressions[paramPathI]};//makeNodeSnapshot(p.node);
                }
            ) :
            null;

    // path.isFunction() ?console.log("functionParams", functionParams):null;


    let liveZoneType = LiveZoneTypes.O;

    let parentPathI = path.parentPath ? expressions.indexOf(path.parentPath) : -1;
    if (path.parentPath && parentPathI < 0) {
        parentPathI = registerExpression(path.parentPath);
        // console.log("parentPathI", parentPathI);
    }

    const parentSnapshot = zones[parentPathI];

    const container = {};
    makePathContainerSnapshot(path, container);

    const locLiveZones = new LocLiveZones();
    const {isBranch, scopeType, loopScopeUID} = locPushAndResolveLoggableScope(
        path, locLiveZones, parentSnapshot, code
    );

    locPushStatementOrExpressionWithArgument(path, locLiveZones);
    locPushCollectionLikeExpression(path, locLiveZones);
    (
        locPushLoggableExpression(path, locLiveZones) ||

        locPushVariableDeclarator(path, locLiveZones)
    );

    if (isBranch && !path.isClass()) {
        liveZoneType = LiveZoneTypes.B;
    }

    if (path.parentPath && !path.parentPath.isBinary()) {
        locPushLoggableExpressionBasedOnParent(
            path, locLiveZones, parentSnapshot
        );
    }

    // console.log(getSourceCode(path, code));
    locPushTaggedTemplateExpression(path, locLiveZones);
    locPushProperty(path, locLiveZones);
    locPushMemberExpression(path, locLiveZones);
    locPushJSXExpressionContainerOrSpreadChild(path, locLiveZones);
    locPushJSXElement(path, locLiveZones);
    locPushJSXFragment(path, locLiveZones);
    locPushJSXAttributeName(path, locLiveZones);
    locPushTemplateLiteral(path, locLiveZones);
    locPushBindExpressionOperator(path, locLiveZones);
    locPushExpressionParentheses(path, locLiveZones);
    locPushAssignmentPattern(path, locLiveZones);


    // if (!locPushAssignmentExpression(path, locLiveZones)) {
    //    path.parentPath && locPushAssignmentExpression(path.parentPath, locLiveZones);
    // }
    //
    locPushAssignmentExpression(path, locLiveZones)
    locPushStatementSemiColon(path, locLiveZones);
    locPushDecorators(path, locLiveZones);

    const type = path.type;
    const parentType = path.parentPath?.type;

    if (parentType === 'VariableDeclarator') {
        // console.log("Pending sync syntax highlight", parentType);
        //locLiveZones.setParent(parentSnapshot.locLiveZones);
    }

    const isLiteral = path.isLiteral();
    const isStrictLiteral = isLiteral && !path.isTemplateLiteral();
    snapshot = {
        expressionId,
        type,
        parentType,
        scopeType,
        liveZoneType,
        isLiteral,
        isStrictLiteral,
        functionParams,
        isRequireCall: false,
        isImportCall: false,
        importType: null,
        node: nodeSnapshot,
        uid: getScopeUID(path),
        uidParent: getScopeUID(path.parentPath),
        parentPathI,
        parentSnapshot,
        container,
        sourceText: getSourceCode(path, code),
        locLiveZones,
        scopeExits: getPathScopeExits(path, registerExpression),
        loopScopeUID,
    };

    makePathShallowPropsSnapshot(path, snapshot);


    // expressionId == "4" && console.log("S", snapshot);

    return snapshot;
}

export function makeImportSnapshot(
    pathOrNode, code, parentPathI, parentSnapshot,
    uid, uidParent, expressions, importSourceName
) {
    const isRequireCall = isRequireCallExpression(pathOrNode);
    const isImportCall = isImportCallExpression(pathOrNode);
    const isCall = (isImportCall || isRequireCall);

    const locLiveZones = new LocLiveZones();

    const container = {};

    const snapshot = {
        importSourceName,
        liveZoneType: LiveZoneTypes.P,
        isRequireCall,
        isImportCall,
        importType: pathOrNode.type,
        isBranch: false,
        node: makeNodeSnapshot(isCall ? pathOrNode.node : pathOrNode),
        uid,
        uidParent,
        parentPathI,
        parentSnapshot,
        container,
        sourceText: getSourceCode(pathOrNode, code),
        locLiveZones,
        scopeExits: getPathScopeExits(null),
        loopScopeUID: null,
    }

    const importDeclarationPath = expressions[parentPathI];
    // console.log("makeImportSnapshot",   {pathOrNode, code, parentPathI, parentSnapshot,
    //     uid, uidParent, expressions, importDeclarationPath});

    if (importDeclarationPath?.type === 'ImportDeclaration') {
        const loc = makeLocSnapshot(importDeclarationPath.node?.loc);

        pushLocAllPath(importDeclarationPath, locLiveZones);
        locLiveZones.pushHighlights(loc);
        snapshot.TAINTED = true;
        // used via importZoneExpressionData
        // console.log("ImportDeclaration New", {snapshot, importDeclarationPath, parentPathI, loc, locLiveZones});
    }

    if (isCall) {
        makePathContainerSnapshot(pathOrNode, container);
        makePathShallowPropsSnapshot(pathOrNode, snapshot);
        locPushCallExpression(pathOrNode, locLiveZones);
    } else {
        // on hold
        // const importDeclarationPath = expressions[parentPathI];
        //
        //
        // if (pathOrNode.type === 'ImportDeclaration') {
        //     // console.log("ImportDeclaration", pathOrNode);
        //     // pushLocAllPath(importDeclarationPath, locLiveZones);
        // } else {
        //     // console.log("ImportDeclaration nodes", pathOrNode);
        //
        //     const isFirst = importDeclarationPath.node.specifiers[0] === pathOrNode;
        //     if (isFirst) {
        //         let previous = null;
        //         const parts = [{
        //             start: {...importDeclarationPath.node.loc.start},
        //             end: {...importDeclarationPath.node.specifiers[0].loc.end}
        //         }];
        //         importDeclarationPath.node.specifiers.forEach(s => {
        //             if (previous) {
        //                 parts.push({
        //                     start: {...previous.loc.end},
        //                     end: {...s.loc.start}
        //                 });
        //             }
        //             previous = s;
        //
        //         });
        //         parts.push({
        //             start: {
        //                 ...importDeclarationPath.node.specifiers[
        //                 importDeclarationPath.node.specifiers.length - 1
        //                     ].loc.end
        //             },
        //             end: {...importDeclarationPath.node.loc.end}
        //         });
        //         locLiveZones.pushHighlights(...parts);
        //     } else {
        //         locLiveZones.pushHighlights(makeLocSnapshot(pathOrNode.loc));
        //     }
        //
        // }
    }

    return snapshot;

}

function makePathContainerSnapshot(path, container) {
    if (path.container) {
        for (const prop in path.container) {
            if (path.container.hasOwnProperty(prop)) {
                const cNode = makeNodeSnapshot(path.container[prop]);
                if (cNode) {
                    container[prop] = cNode;
                }
            }
        }
    }
}

function makePathShallowPropsSnapshot(path, snapshot) {
    for (const prop in path) {
        const value = path[prop];
        if (
            prop === 'extra' ||
            prop === 'data' ||
            !isNaN(value) ||
            typeof value === 'string' ||
            value === true ||
            value === false

        ) {
            snapshot[prop] = value;
        }
    }
}

export const arrayRegisterStrategy = (el, findElI, accessI, addEl) => {
    let i = findElI(el);
    let registeredEl = null;
    let isNew = true;
    if (i >= 0) {
        registeredEl = accessI(i);
        isNew = false;
    } else {
        registeredEl = el;
        i = addEl(el);
    }

    return [registeredEl, i, isNew];
};

export const nodeSnapshots = [];
export const nodeSnapshotsFindIndex = (snapshot) => {
    return nodeSnapshots.findIndex(({type, loc}) => snapshot.type === type && snapshot.loc === loc);
};
export const nodeSnapshotsAccessIndex = (i) => {
    return nodeSnapshots[i];
};
export const nodeSnapshotsAdd = (snapshot) => {
    return nodeSnapshots.push(snapshot) - 1;
};


export const registerNodeSnapshot = (snapshot) => {
    return arrayRegisterStrategy(snapshot, nodeSnapshotsFindIndex, nodeSnapshotsAccessIndex, nodeSnapshotsAdd);
};

function makeNodeSnapshot(node) {
    const {type, loc: nodeLoc} = node ?? {};

    if (!node || !type || !nodeLoc) {
        return null;
    }

    const loc = makeLocSnapshot(nodeLoc);

    if (!loc) {
        return null;
    }

    return registerNodeSnapshot({type, loc})?.[0];
}

export const nodeLocSnapshots = [];
export const nodeLocSnapshotsFindIndex = (locSnapshot) => {
    return nodeLocSnapshots.findIndex(l => LocLiveZones.locComparator(l, locSnapshot) === 0);
};
export const nodeLocSnapshotsAccessIndex = (i) => {
    return nodeLocSnapshots[i]
};
export const nodeLocSnapshotsAdd = (locSnapshot) => {
    return nodeLocSnapshots.push(locSnapshot) - 1;
};


export const registerNodeLocSnapshots = (locSnapshot) => {
    return arrayRegisterStrategy(locSnapshot, nodeLocSnapshotsFindIndex, nodeLocSnapshotsAccessIndex, nodeLocSnapshotsAdd);
};

function makeLocSnapshot(loc) {
    if (!loc || !loc.start || !loc.end) {
        return null;
    }

    const locSnapshot = {
        start: {...loc.start},
        end: {...loc.end}
    };

    return registerNodeLocSnapshots(locSnapshot)?.[0];
}

function _registerExpression(path, code, expressions, zones) {
    if (!path) {
        return {
            i: -1,
            zone: null,
        };
    }

    let i = expressions.indexOf(path);
    let zone = null;
    if (i < 0) {
        i = expressions.push(path) - 1;
        // zones[i] = {};
        // i = expressions.length;
        // expressions[i] = path;
        try {
            zone = makePathSnapshot(path, code, expressions, zones, i);
            // i = expressions.push(path) - 1;

            // console.log("_registerExpression", zone);
        } catch (e) {
            console.log("_registerExpression !", e);
        }

        // !zone && path.isReturnStatement() && console.log(">>", path.node.type, path.node.argument.type, path.node.argument, path.node.argument.loc, path.node?.loc);
        if (zone) {
            zones[i] = zone;
        } else {
            //console.log(">>", path, path.node?.loc);
            // path.parentPath === null := root reached.
        }

        // if(i ==1){
        //     console.log("_registerExpression", zone, zone.locLiveZones.getHighlights(), path, path.node?.loc);
        // }
    } else {
        zone = zones[i];
    }

    return {
        i,
        zone,
    };
}

function _registerImport(
    importSourceName, pathOrNode, code,
    parentPathI, parentSnapshot, uid,
    uidParent, importZones, expressions
) {
    // if (pathOrNode.type === 'ImportDeclaration') {
    //     console.log("ImportDeclaration _registerImport", pathOrNode);
    // pushLocAllPath(importDeclarationPath, locLiveZones);
    // }
    // used via importZoneExpressionData
    // console.log("_registerImport", { importSourceName, pathOrNode, code,
    //     parentPathI, parentSnapshot, uid,
    //     uidParent, importZones, expressions});
    const importSnapshot = makeImportSnapshot(
        pathOrNode, code,
        parentPathI, parentSnapshot, uid,
        uidParent, expressions,
        importSourceName
    );

    if (importZones[importSourceName]) {
        return importZones[importSourceName].push(importSnapshot) - 1;
    } else {
        importZones[importSourceName] = [importSnapshot];
        return 0;
    }
}

export default function zoneALE(code) {
    const expressions = [];
    const zones = [];
    const importZones = {};

    const getPathZone = (path) => {
        return zones[expressions.indexOf(path)];
    }

    const registerExpression = (p, prop = 'i') => (_registerExpression(
        p, code, expressions, zones,
    )[prop]);

    const registerImport =
        (
            importSourceName, pathOrNode, parentPathI, uid, uidParent
        ) => _registerImport(
            importSourceName,
            pathOrNode, code, parentPathI, zones[parentPathI],
            uid, uidParent, importZones, expressions
        );

    const getScopeUIDs = (path) => {
        const scopeUIDs = [];
        let zone;
        for (
            let currentPath = path;
            zone = getPathZone(path);
            currentPath = path.parentPath
        ) {
            if (!scopeUIDs.indexOf(zone.uid)) {
                scopeUIDs.push(zone.uid);
            }
        }
        return scopeUIDs;
    }

    const getZoneData = (i) => {
        const zone = zones[i];
        return [
            i,
            zone?.sourceText,
            zone,
            expressions[i],
        ];
    }

    const lookupZoneParentByType = (zone, type) => {
        let current = zone?.parentSnapshot;

        while (current) {
            if (current.type === type) {
                return current;
            }
            current = current?.parentSnapshot;
        }

        return null;
    };

    const lookupZoneParentByTypes = (zone, types) => {
        let current = zone?.parentSnapshot;

        while (current) {
            if (types.includes(current.type)) {
                return current;
            }
            current = current?.parentSnapshot;
        }

        return null;
    };

    const getImportZoneData = (importSourceName, importSourceIndex) => {
        const importSource = importZones[importSourceName];
        const zone = importSource?.[importSourceIndex];
        return [
            zone?.parentPathI,
            zone?.sourceText,
            zone,
            expressions[zone?.parentPathI],
        ];
    }

    return {
        expressions,
        zones,
        importZones,
        getPathZone,
        registerExpression,
        registerImport,
        getScopeUIDs,
        getZoneData,
        lookupZoneParentByType,
        lookupZoneParentByTypes,
        getImportZoneData
    };
}
