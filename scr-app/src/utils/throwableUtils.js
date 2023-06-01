import {isParse5Error, toReadableParse5Throwable} from "./parse5Utils";
import {isPostCssError, toReadablePostCssThrowable} from "./postCssUtils";
import {toReadableBabelThrowable} from "./babelUtils";

export function toReadableThrowable(obj) {
    if (isPostCssError(obj)) {
        return toReadablePostCssThrowable(obj);
    }

    if (isParse5Error(obj)) {
        return toReadableParse5Throwable(obj);
    }

    return toReadableBabelThrowable(obj);
}
