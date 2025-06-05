const jspmErrorsRegExs = [
    /Unable to resolve .+:(.+)\@?.+ to a valid version imported from (.+)/,
    /Unable to determine an alias for target package (.+)/,
    /Invalid package name (.+)/,
    /Invalid package target (.+)/,
    /Resolved dependency (.+)/,
    /Unable to determine an alias for target package (.+) with error: (.+)/,
    /Unable to request the JSPM API for a build of (.+), with error: (.+)/,
    /Timed out waiting for the build of (.+) to be ready on the JSPM .+/,
    /Unable to resolve (.+) to be ready on the JSPM to a valid version.+/,
    /Invalid status code .+ looking up (.+) from .+/,
    /Invalid status code .+ reading package config for (.+)\..+/,
    /No provider named (.+) has been defined\./,
];

export const resolvePackageName = (jspmErrorObj) => {
    if (!jspmErrorObj) {
        return null;
    }

    const {jspmError, message} = jspmErrorObj;

    if (!jspmError) {
        return null;
    }

    for (let regEx of jspmErrorsRegExs) {
        let m;
        if ((m = regEx.exec(message)) !== null) {
            const f = m.find((match, groupIndex) => {
                if (groupIndex === 1) {
                    return match;
                }
                // console.log(`updatePlaygroundLoadFailure Found match, group ${groupIndex}: ${match}`);
            });
            if (f) {
                return f;
            }
        }
    }
    return null;
}

export const resolveErrorLoc = (jspmErrorObj, aleInstance) => {
    const pn = resolvePackageName(jspmErrorObj);
    const importZone = aleInstance?.zale.getImportZoneData(pn);
    const loc = importZone?.[2]?.parentSnapshot?.node.loc.end;
    const {line: lineNumber = 1, column: columnNumber = 1} = loc ?? {};
    jspmErrorObj.loc = {lineNumber, columnNumber};
    jspmErrorObj.prototype = {name: "ImportError"};
    return jspmErrorObj;
}
