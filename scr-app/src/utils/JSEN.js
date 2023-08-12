import jsan from "jsan";

export const getObjectClassName = (object) => {
    let objectConstructorName = null;
    try {
        objectConstructorName = Symbol(object)?.toString() ?? "";
        const regex = /Symbol\(\[([^\s]+)\s+([^\s]+)\]\)/gm;
        const match = regex.exec(objectConstructorName);
        // console.log("getObjectClassName", object, objectConstructorName, match, match?.[2]);
        objectConstructorName = match?.[2];
        if (objectConstructorName === "Object") {
            objectConstructorName = null;
        }
    } catch (e) {
        // objectConstructorName =
        //     object?.constructor?.name;
    }
    return objectConstructorName ?? object?.constructor?.name;
}

export default class JSEN {
    static MAGIC_TAG = "$@.$";

    static getObjectType = (object) => {
        const type = typeof object;
        switch (type) {
            case "bigint":
            case "number":
            case "string":
            case "boolean":
            case "undefined":
                return type;
            case "object":
                if (object === null) {
                    return "null";
                }
                if (object instanceof Date) {
                    return "Date";
                }
                if (object instanceof RegExp) {
                    return "RegExp";
                }
                if (Array.isArray(object)) {
                    return "Array";
                }

                const objectConstructorName = getObjectClassName(object);

                if (object.constructor) {
                    //     if (objectConstructorName === "Object") {
                    //         return "Object";
                    //     }
                    // } else {
                    if (
                        typeof object.constructor.isBuffer === "function" &&
                        object.constructor.isBuffer(object)
                    ) {
                        return "Buffer";
                    }
                }
                // console.log("objectConstructorName", objectConstructorName, object);

                return objectConstructorName;
            case "function":
                return "function";
            case "symbol":
                return "symbol";
            default:
                return "unknown";
        }
    };

    static getObjectClassName = (object) => {
        return typeof object === "object" ? JSEN.getObjectType(object) : null;
    };

    static isObjectTypeNative = (object) => {
        const objectConstructorName = JSEN.getObjectClassName(object) ?? "null";
        switch (objectConstructorName) {
            case "null":
            case "Date":
            case "RegExp":
            case "Array":
            case "Object":
            case "Buffer":
                return true;
            default:
                return false;
        }
    };

    static replacer = (key, value) => {
        if ((key ?? false) && !JSEN.isObjectTypeNative(value)) {
            // const objectConstructorName = JSEN.getObjectClassName(value) ?? "null";
            // if (objectConstructorName === "console") {
            //     console.log("JSEN replacer", value, objectConstructorName, getObjectClassName(value));
            // }
            return `${JSEN.MAGIC_TAG}${JSEN.getObjectClassName(value)}${
                JSEN.MAGIC_TAG
            }${jsan.stringify(value, JSEN.replacer, null, true)}`;
        }
        return value;
    };

    static reviver = (key, value) => {
        if (typeof value === "string" && value.startsWith(JSEN.MAGIC_TAG)) {
            const [, objectClassName, val] = value.split(JSEN.MAGIC_TAG);

            try {
                const ref = jsan.parse(val);
                ref.constructor = {name: objectClassName};
                return ref;
            } catch (e) {
                return e;
            }

        }
        return value;
    };

    static stringify(
        obj, replacer = JSEN.replacer, space, options = true
    ) {
        if (!JSEN.isObjectTypeNative(obj)) {
            // const objectConstructorName =  JSEN.getObjectClassName(obj)?? "null";
            // //if (objectConstructorName === "console") {
            // console.log("JSEN stringify", obj, objectConstructorName, getObjectClassName(obj));
            // //}
            return `${JSEN.MAGIC_TAG}${JSEN.getObjectClassName(obj)}${
                JSEN.MAGIC_TAG
            }${jsan.stringify(obj, replacer, space, options)}`;
        }
        return jsan.stringify(obj, replacer, space, options);
    }

    static parse(str, reviver = JSEN.reviver) {
        if (typeof str === "string" && str.startsWith(JSEN.MAGIC_TAG)) {
            const tagI = str.indexOf(JSEN.MAGIC_TAG, JSEN.MAGIC_TAG.length);
            const objectClassName = str.substring(JSEN.MAGIC_TAG.length, tagI);
            try {
                const ref = jsan.parse(str.substring(tagI + JSEN.MAGIC_TAG.length), reviver);
                if (ref?.constructor?.name) {
                    ref.constructor = {name: objectClassName};
                }

                return ref;
            } catch (e) {
                return e;
            }
        }

        try {
            return jsan.parse(str, reviver);
        } catch (e) {
            return e;
        }

    }
}
