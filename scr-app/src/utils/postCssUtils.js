import {ReadableThrowable, camelOrPascalCaseToSpaceCase} from "./bundleUtils";

export const POST_CSS_DEFAULT_ERROR_CODE = 'css';

export const postCssLoc2MonacoPosition = (loc = {}) => {
    const {line, column} = loc;
    return {
        lineNumber: line,
        column
    };
};

export const postCssLoc2MonacoRange = (loc = {}) => {
    const {
        line: startLine,
        column: startColumn,
        endLine,
        endColumn,
    } = loc;

    return {
        startLineNumber: startLine,
        startColumn: startColumn,
        endLineNumber: endLine,
        endColumn: endColumn,
    };
};

class ReadablePostCssThrowable extends ReadableThrowable {
    constructor(obj) {
        super();
        const {
            name,
            plugin,
            reason,
        } = obj;

        this.code = plugin ?? POST_CSS_DEFAULT_ERROR_CODE;
        this.reasonCode = reason;
        this.loc = obj;
        this.name = name;
        this.message = reason;
    }

    getReadableCode = () => {
        return this.code;
    };

    getReadableReasonCode = () => {
        return this.reasonCode;
    };

    getReadableName = () => {
        return camelOrPascalCaseToSpaceCase(this.name);
    };

    getReadableMessage = () => {
        return this.message;
    };

    getMonacoPosition = () => {
        return postCssLoc2MonacoPosition(this.loc);
    };
    getMonacoRange = (monaco = global.monaco) => {
        if (!monaco || !this.loc) {
            return null;
        }

        const range = postCssLoc2MonacoRange(this.loc);
        return new monaco.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
    };
}

export const isPostCssError = (obj) => {
    return obj?.name === 'CssSyntaxError';
};

export function toReadablePostCssThrowable(obj = {}) {
    return new ReadablePostCssThrowable(obj);
}
