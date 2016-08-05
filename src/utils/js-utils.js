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
}