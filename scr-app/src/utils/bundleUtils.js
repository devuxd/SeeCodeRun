
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

export class ReadableThrowable {
    loc;
    code;
    reasonCode;

    name;
    message;


    getReadableCode = () => {
        return null;
    };

    getReadableReasonCode = () => {
        return null;
    };

    getReadableName = () => {
        return null;
    };

    getReadableMessage = () => {
        return null;
    };

    getMonacoPosition = ()=>{
        return null;
    };
    getMonacoRange = (monaco)=>{
        return null;
    };
};
