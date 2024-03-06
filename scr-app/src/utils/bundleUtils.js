import {POST_HTML_DEFAULT_ERROR_CODE} from "./parse5Utils";
import {babelLoc2MonacoRange} from "./babelUtils";

export const camelOrPascalCaseToSpaceCase = (camelOrPascalCaseString = "") => {
    return camelOrPascalCaseString
        .replace(/([A-Z])/g, ' $1').replace(/^ /, "");
};
export const snakeCaseToSpaceCase = (snakeCaseString = "") => {
    return snakeCaseString.replace(/_/g, " ");
};

export const kebabCaseToSpaceCase = (snakeCaseString = "") => {
    return snakeCaseString.replace(/-/g, " ");
};


export const removeLocFromMessage = (message) => {
    return message.replace(/\(\d+:\d+\)/g, "");
};

//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
export const errorLoc2MonacoRange = (loc = {}) => {
    const {lineNumber: line, columnNumber: column} = loc;
    return {
        startLineNumber: line,
        startColumn: column,
        endLineNumber: line,
        endColumn: column + 1,
    };
};

const DEFAULT_ERROR_CODE = "Browser"
const DEFAULT_ERROR_NAME = "ParseError"

export class ReadableThrowable {
    loc;
    code;
    reasonCode;

    name;
    message;

    constructor(obj) {
        const {
            constructor,
            prototype,
            message,
            loc
        } = obj;

        this.code = DEFAULT_ERROR_CODE;
        this.reasonCode = DEFAULT_ERROR_CODE;
        this.loc = loc ?? obj;
        this.name = prototype?.name ?? (constructor?.name ?? DEFAULT_ERROR_NAME);
        this.message = message;
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
        return this.getMonacoRange?.getStartPosition();
    };
    getMonacoRange = (monaco = global.monaco) => {
        if (!monaco || !this.loc) {
            return null;
        }

        const range = errorLoc2MonacoRange(this.loc);
        return new monaco.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
    };
};

export const toReadableThrowable = (obj) => {
    // console.log("updatePlaygroundLoadFailure", obj)
    return new ReadableThrowable(obj);
}
