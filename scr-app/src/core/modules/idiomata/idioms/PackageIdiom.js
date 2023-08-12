import {SupportedApis} from "../Idiomata";

const map = {};

export class PackageIdiosyncrasy {
    apiName
    resolvePackageRef

    constructor(apiName, resolvePackageRef) {
        this.apiName = apiName;
        this.resolvePackageRef = resolvePackageRef;
    }
}


export class PackageIdiom {
    static idiosyncrasies() {
        return map;
    }

    static registerIdiosyncrasy(idiosyncrasyInstance) {
        const {apiName} = idiosyncrasyInstance;
        map[apiName] = idiosyncrasyInstance;
    }

    static resolvePackageRef(...p) {
        return Object.keys(SupportedApis).find(apiName => map[apiName]?.resolvePackageRef(...p));
    }
}