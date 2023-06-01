import {kebabCaseToSpaceCase, camelOrPascalCaseToSpaceCase, ReadableThrowable} from "./bundleUtils";

export const POST_HTML_DEFAULT_ERROR_CODE = 'html';

export const parse5Loc2MonacoPosition = (loc = {}) => {
    const {startLine, startCol} = loc;
    return {
        lineNumber: startLine,
        column: startCol
    };
};

export const parse5Loc2MonacoRange = (loc = {}) => {
    const {
        startLine,
        startCol: startColumn,
        endLine,
        endCol: endColumn,
    } = loc;

    return {
        startLineNumber: startLine,
        startColumn: startColumn,
        endLineNumber: endLine,
        endColumn: endColumn,
    };
};

class ReadableParse5Throwable extends ReadableThrowable {
    constructor(obj) {
        super();
        const {
            name,
            code
        } = obj;

        this.code = code ?? POST_HTML_DEFAULT_ERROR_CODE;
        this.reasonCode = code;
        this.loc = obj;
        this.name = name;
        this.message = code;
    }

    getReadableCode = () => {
        return kebabCaseToSpaceCase(this.code);
    };

    getReadableReasonCode = () => {
        return kebabCaseToSpaceCase(this.reasonCode);
    };

    getReadableName = () => {
        return camelOrPascalCaseToSpaceCase(this.name);
    };

    getReadableMessage = () => {
        return kebabCaseToSpaceCase(this.message);
    };

    getMonacoPosition = () => {
        return parse5Loc2MonacoPosition(this.loc);
    };
    getMonacoRange = (monaco = global.monaco) => {
        if (!monaco || !this.loc) {
            return null;
        }

        const range = parse5Loc2MonacoRange(this.loc);
        return new monaco.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
    };
}

export const isParse5Error = (obj) => {
    return obj?.name === 'ParserError';
};

export function toReadableParse5Throwable(obj = {}) {
    return new ReadableParse5Throwable(obj);
}
