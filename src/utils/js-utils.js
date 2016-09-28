
export class JsUtils{
  //from JQuery: https://github.com/jquery/jquery/blob/master/src/core.js
  static getProto = Object.getPrototypeOf;
  static isArray = Array.isArray;
  static primitiveTypes = ["undefined", "null", "boolean", "number", "string", "function", "symbol"];
  static objectClasses = [];

  static class2type = (function mapClass2Type() {
    JsUtils.objectClasses = "Boolean Number String Function Array Date RegExp Object Error Symbol".split(" ");
    let class2type = [];
    for (let classIndex = 0; classIndex < JsUtils.objectClasses.length; classIndex++) {
      let name = JsUtils.objectClasses[classIndex];
      class2type["[object " + name + "]"] = name.toLowerCase();
    }
    return class2type;
  })();

  static isWindow(obj) {
		return obj != null && obj === obj.window;
	}

  static isPrimitiveType(obj) {
    return JsUtils.primitiveTypes.indexOf(JsUtils.type(obj)) > -1;
	}

  static isTypeInPrimitiveTypes(objType) {
    return JsUtils.primitiveTypes.indexOf(objType) > -1;
	}

  static isEmptyObject(obj) {

		/* eslint-disable no-unused-vars */
		// See https://github.com/eslint/eslint/issues/6125
		let name;

		for ( name in obj ) {
			return false;
		}
		return true;
	}

  static type(obj) {
		if ( obj == null ) {
			return obj + "";
		}
		// Support: Android <=2.3 only (functionish RegExp)
		return typeof obj === "object" || typeof obj === "function" ?
    JsUtils.class2type[toString.call(obj)] || "object" :
			typeof obj;
	}

  static isFunction(obj) {
    return JsUtils.type(obj) === "function";
	}

  static isArrayLike(obj) {
    	// Support: real iOS 8.2 only (not reproducible in simulator)
    	// `in` check used to prevent JIT error (gh-2145)
    	// hasOwn isn't used here due to false negatives
    	// regarding Nodelist length in IE
    	var length = !!obj && "length" in obj && obj.length,
        type = JsUtils.type(obj);

    if (type === "function" || JsUtils.isWindow(obj)) {
    		return false;
    	}

    	return type === "array" || length === 0 ||
    		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
    }

  static isNumeric(obj) {
		// As of jQuery 3.0, isNumeric is limited to
		// strings and numbers (primitives or objects)
		// that can be coerced to finite numbers (gh-2662)
    let type = JsUtils.type(obj);
		return ( type === "number" || type === "string" ) &&

			// parseFloat NaNs numeric-cast false positives ("")
			// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
			// subtraction forces infinities to NaN
			!isNaN( obj - parseFloat( obj ) );
	}

  //source: http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
  //Returns true if it is a DOM node
  static isNode(o) {
    return (
      typeof Node === "object" ? o instanceof Node :
      o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string"
    );
  }

//Returns true if it is a DOM element
  static isElement(o) {
    return (
      typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
      o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName === "string"
    );
  }

  static each(obj, callback) {
		let length, i = 0;
    if (JsUtils.isArrayLike(obj)) {
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

  static toJSON(node) {
  //https://gist.github.com/sstur/7379870
    var obj = {
      nodeType: node.nodeType
    };
    if (node.tagName) {
      obj.tagName = node.tagName.toLowerCase();
    } else
    if (node.nodeName) {
      obj.nodeName = node.nodeName;
    }
    if (node.nodeValue) {
      obj.nodeValue = node.nodeValue;
    }
    var attrs = node.attributes;
    if (attrs) {
      var length = attrs.length;
      var arr = obj.attributes = new Array(length);
      for (var i = 0; i < length; i++) {
        var attr = attrs[i];
        arr[i] = [attr.nodeName, attr.nodeValue];
      }
    }
    var childNodes = node.childNodes;
    if (childNodes) {
      length = childNodes.length;
      arr = obj.childNodes = new Array(length);
      for (i = 0; i < length; i++) {
        arr[i] = JsUtils.toJSON(childNodes[i]);
      }
    }
    return obj;
  }

  static toDOM(obj) {
      // https://gist.github.com/sstur/7379870
    if (typeof obj == 'string') {
      obj = JSON.parse(obj);
    }
    var node, nodeType = obj.nodeType;
    switch (nodeType) {
      case 1: //ELEMENT_NODE
        node = document.createElement(obj.tagName);
        var attributes = obj.attributes || [];
        for (var i = 0, len = attributes.length; i < len; i++) {
          var attr = attributes[i];
          node.setAttribute(attr[0], attr[1]);
        }
        break;
      case 3: //TEXT_NODE
        node = document.createTextNode(obj.nodeValue);
        break;
      case 8: //COMMENT_NODE
        node = document.createComment(obj.nodeValue);
        break;
      case 9: //DOCUMENT_NODE
        node = document.implementation.createDocument();
        break;
      case 10: //DOCUMENT_TYPE_NODE
        node = document.implementation.createDocumentType(obj.nodeName);
        break;
      case 11: //DOCUMENT_FRAGMENT_NODE
        node = document.createDocumentFragment();
        break;
      default:
        return node;
    }
    if (nodeType == 1 || nodeType == 11) {
      var childNodes = obj.childNodes || [];
      for (i = 0, len = childNodes.length; i < len; i++) {
        node.appendChild(JsUtils.toDOM(childNodes[i]));
      }
    }
    return node;
  }

  static stringify(obj, replacer, spaces, cycleReplacer) {
    return JSON.stringify(obj, JsUtils.serializer(replacer, cycleReplacer), spaces);
  }

  static serializer(replacer, cycleReplacer) {
    var stack = [], keys = [];

    if (cycleReplacer == null){
        cycleReplacer = function(key, value) {
          if (stack[0] === value) return "[Circular ~]";
          return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]";
        };
    }

    return function(key, value) {
      if(stack.length > 0){
        var thisPos = stack.indexOf(JsUtils);
        ~thisPos ? stack.splice(thisPos + 1) : stack.push(this);
        ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key);
        if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value);
      }else{
          stack.push(value);
      }
      return replacer == null ? value : replacer.call(this, key, value);
    };
  }

  static toReadableString(referenceInput, maxDepth = 2, depth = 0, isParsable = true) {
	    let readableString = null;
    if (JsUtils.isPrimitiveType(referenceInput) && JsUtils.type(referenceInput) !== "string") {
	      return  `${referenceInput}`;
	    }

    if (JsUtils.type(referenceInput) === "string") {
	      if(isParsable){
  	    	try{
            return JsUtils.toReadableString(JSON.parse(referenceInput), maxDepth, depth, false);
  	        }catch(e){}
	      }else{
	        return `"${referenceInput}"`;
	      }
	    }
    let isArrayLike = JsUtils.isArrayLike(referenceInput);
    JsUtils.each(referenceInput, function (key, value) {
	      let eachContent;
	      if (isArrayLike) {
          eachContent = depth === maxDepth ? JsUtils.type(value) : JsUtils.toReadableString(value, maxDepth, depth + 1, false);
	      }
	      else {
          eachContent = depth === maxDepth ? key + ": " + JsUtils.type(value) : key + ": " + JsUtils.toReadableString(value, maxDepth, depth + 1, false);
	      }
	      readableString = readableString == null ? eachContent : readableString + ", " + eachContent;
	    });

	    if (depth) {
	      if (isArrayLike) {
	        readableString = "[" + readableString + "]";
	      }
	      else {
	        if (readableString !== "null") {
	          readableString = "{" + readableString + "}";
	        }
	      }
	    }
	    return readableString;
  }
}
