import {toReadableThrowable} from './bundleUtils';
import {isParse5Error, toReadableParse5Throwable} from "./parse5Utils";
import {isPostCssError, toReadablePostCssThrowable} from "./postCssUtils";
import {isBabelError, toReadableBabelThrowable} from "./babelUtils";

export function toThrowable(obj) {
    if (isPostCssError(obj)) {
        return toReadablePostCssThrowable(obj);
    }

    if (isParse5Error(obj)) {
        return toReadableParse5Throwable(obj);
    }

    if(isBabelError(obj)){
        return toReadableBabelThrowable(obj);
    }

    return toReadableThrowable(obj);
}
