import * as t from "@babel/types";

import {
    ReadableThrowable, snakeCaseToSpaceCase, camelOrPascalCaseToSpaceCase, removeLocFromMessage
} from "./bundleUtils"

export function replaceExpressionWithBlock(
    path, property, node
) {
    if (!path?.node || !property) {
        return;
    }

    node = node ?? path.node[property];

    if (!node || t.isBlockStatement(node)) {
        return;
    }

    const {key, listKey, extra, data, directives, loc} = node;
    const blockStatement = t.blockStatement([node]);
    blockStatement.key = key;
    blockStatement.listKey = listKey;
    blockStatement.extra = extra;
    blockStatement.data = data;
    blockStatement.directives = directives;
    blockStatement.loc = loc;
    blockStatement.blockEnsured = true;
    path.node[property] = blockStatement;
}

export function ensureIfStatementBlock(path) {
    const node = path?.node;
    if (!node || !path.isIfStatement()) {
        return;
    }
    replaceExpressionWithBlock(path, "consequent");
    replaceExpressionWithBlock(path, "alternate");
}

export function isRequireCallExpression(pathOrNode) {
    return (
        pathOrNode?.node?.callee?.name === 'require' ||
        pathOrNode?.callee?.name === 'require'
    );
}

export function isImportCallExpression(pathOrNode) {
    return (
        t.isImport(pathOrNode?.node?.callee) || t.isImport(pathOrNode?.callee)
    );
}

export function isImportOrRequireCallExpression(pathOrNode) {
    return (
        isImportCallExpression(pathOrNode) ||
        isRequireCallExpression(pathOrNode)
    );
}

export function getSourceCode(pathOrNode, code = '') {
    const node = pathOrNode.node ?? pathOrNode;
    return node ? code.slice(node.start, node.end) : '';
}

export function getScopeUID(path) {
    const uid = path?.scope?.uid ?? null;
    return uid === null ? uid : `${uid}`;
}

export const babelLoc2MonacoPosition = (loc = {}) => {
    const {line, column} = loc;
    return {
        lineNumber: line,
        column
    };
};

export const babelLoc2MonacoRange = (loc = {}) => {
    const {line, column} = loc;
    return {
        startLineNumber: line,
        startColumn: column + 1,
        endLineNumber: line,
        endColumn: column + 2,
    };
};

export const isBabelError = (obj) => {
    switch (obj?.code) {
        case 'BABEL_PARSER_SYNTAX_ERROR':
        case 'BABEL_PARSE_ERROR':
            return true;
        default:
            return false;
    }
};

class ReadableBabelThrowable extends ReadableThrowable {
    constructor(obj) {
        super(obj);
        const {
            constructor,
            name, message,
            // cause, fileName, stack,
            code, reasonCode, loc
        } = obj;

        this.code = code;
        this.reasonCode = reasonCode;
        this.loc = loc;
        this.name = constructor?.name;
        this.message = reasonCode;
    }

    getReadableCode = () => {
        return snakeCaseToSpaceCase(this.code.replace(/^BABEL_PARSER_/, ""));
    };

    getReadableReasonCode = () => {
        return camelOrPascalCaseToSpaceCase(this.reasonCode);
    };

    getReadableName = () => {
        return camelOrPascalCaseToSpaceCase(this.name);
    };

    getReadableMessage = () => {
        return camelOrPascalCaseToSpaceCase(this.message);
    };

    getMonacoPosition = () => {
        return babelLoc2MonacoPosition(this.loc);
    };
    getMonacoRange = (monaco = global.monaco) => {
        if (!monaco || !this.loc) {
            return null;
        }

        const range = babelLoc2MonacoRange(this.loc);
        return new monaco.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
    };
};

export function toReadableBabelThrowable(obj = {}) {
    return new ReadableBabelThrowable(obj);
}
