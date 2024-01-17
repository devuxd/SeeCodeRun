import update from "immutability-helper";
import isArrayLike from "lodash/isArrayLike";

export const immutableAutoUpdateObjectArray = (object, objectProperty, valueToAutoPushInObjectValue) => {
    // console.log("IM", {object, objectProperty, valueToAutoPushInObjectValue});
    if (!(objectProperty && valueToAutoPushInObjectValue)) {
        return object;
    }

    const autoArrayPush = {};

    autoArrayPush[objectProperty] = {
        $autoArray: {
            $push: isArrayLike(valueToAutoPushInObjectValue) ?
                valueToAutoPushInObjectValue : [valueToAutoPushInObjectValue]
        }
    };

    console.log("IM", {object, objectProperty, valueToAutoPushInObjectValue, autoArrayPush});
    return update(object, {
        $auto: autoArrayPush
    })
};
