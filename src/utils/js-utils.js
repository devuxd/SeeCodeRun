export class JsUtils{
    //from JQuery: https://github.com/jquery/jquery/blob/master/src/core.js
    constructor(){
        let objectClasses = "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " );
        let class2type = [];
        for(let classIndex = 0; classIndex < objectClasses.length; classIndex++ ){
            let name = objectClasses[classIndex];
    	    class2type[ "[object " + name + "]" ] = name.toLowerCase();
        }
        this.class2type = class2type;
        this.getProto = Object.getPrototypeOf;
        this.isArray = Array.isArray;
    }

    isWindow( obj ) {
		return obj != null && obj === obj.window;
	}

	isEmptyObject( obj ) {

		/* eslint-disable no-unused-vars */
		// See https://github.com/eslint/eslint/issues/6125
		let name;

		for ( name in obj ) {
			return false;
		}
		return true;
	}

    type( obj ) {
		if ( obj == null ) {
			return obj + "";
		}
		// Support: Android <=2.3 only (functionish RegExp)
		return typeof obj === "object" || typeof obj === "function" ?
			this.class2type[ toString.call( obj ) ] || "object" :
			typeof obj;
	}

	isFunction( obj ) {
		return this.type( obj ) === "function";
	}

	isArrayLike( obj ) {

    	// Support: real iOS 8.2 only (not reproducible in simulator)
    	// `in` check used to prevent JIT error (gh-2145)
    	// hasOwn isn't used here due to false negatives
    	// regarding Nodelist length in IE
    	var length = !!obj && "length" in obj && obj.length,
    		type = this.type( obj );

    	if ( type === "function" || this.isWindow( obj ) ) {
    		return false;
    	}

    	return type === "array" || length === 0 ||
    		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
    }

    isNumeric( obj ) {

		// As of jQuery 3.0, isNumeric is limited to
		// strings and numbers (primitives or objects)
		// that can be coerced to finite numbers (gh-2662)
		let type = this.type( obj );
		return ( type === "number" || type === "string" ) &&

			// parseFloat NaNs numeric-cast false positives ("")
			// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
			// subtraction forces infinities to NaN
			!isNaN( obj - parseFloat( obj ) );
	}

	each( obj, callback ) {
		let length, i = 0;

		if ( this.isArrayLike( obj ) ) {
			length = obj.length;
			for ( ; i < length; i++ ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		} else {
			for ( i in obj ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		}

		return obj;
	}
}