/* */ 
(function(Buffer, process) {
  "use strict";
  const path = require('path');
  const URL = require('whatwg-url').URL;
  const domSymbolTree = require('./living/helpers/internal-constants').domSymbolTree;
  const SYMBOL_TREE_POSITION = require('symbol-tree').TreePosition;
  exports.toFileUrl = function(fileName) {
    let pathname = path.resolve(process.cwd(), fileName).replace(/\\/g, "/");
    if (pathname[0] !== "/") {
      pathname = "/" + pathname;
    }
    return "file://" + encodeURI(pathname);
  };
  exports.defineSetter = function defineSetter(object, property, setterFn) {
    const descriptor = Object.getOwnPropertyDescriptor(object, property) || {
      configurable: true,
      enumerable: true
    };
    descriptor.set = setterFn;
    Object.defineProperty(object, property, descriptor);
  };
  exports.defineGetter = function defineGetter(object, property, getterFn) {
    const descriptor = Object.getOwnPropertyDescriptor(object, property) || {
      configurable: true,
      enumerable: true
    };
    descriptor.get = getterFn;
    Object.defineProperty(object, property, descriptor);
  };
  exports.createFrom = function createFrom(prototype, properties) {
    properties = properties || {};
    const descriptors = {};
    for (const name of Object.getOwnPropertyNames(properties)) {
      descriptors[name] = Object.getOwnPropertyDescriptor(properties, name);
    }
    for (const symbol of Object.getOwnPropertySymbols(properties)) {
      descriptors[symbol] = Object.getOwnPropertyDescriptor(properties, symbol);
    }
    return Object.create(prototype, descriptors);
  };
  exports.inheritFrom = function inheritFrom(Superclass, Subclass, properties) {
    properties = properties || {};
    Object.defineProperty(properties, "constructor", {
      value: Subclass,
      writable: true,
      configurable: true
    });
    Subclass.prototype = exports.createFrom(Superclass.prototype, properties);
  };
  exports.define = function define(object, properties) {
    for (const name of Object.getOwnPropertyNames(properties)) {
      const propDesc = Object.getOwnPropertyDescriptor(properties, name);
      Object.defineProperty(object, name, propDesc);
    }
  };
  exports.addConstants = function addConstants(Constructor, propertyMap) {
    for (const property in propertyMap) {
      const value = propertyMap[property];
      addConstant(Constructor, property, value);
      addConstant(Constructor.prototype, property, value);
    }
  };
  function addConstant(object, property, value) {
    Object.defineProperty(object, property, {
      configurable: false,
      enumerable: true,
      writable: false,
      value
    });
  }
  let memoizeQueryTypeCounter = 0;
  exports.memoizeQuery = function memoizeQuery(fn) {
    if (fn.length > 2) {
      return fn;
    }
    const type = memoizeQueryTypeCounter++;
    return function() {
      if (!this._memoizedQueries) {
        return fn.apply(this, arguments);
      }
      if (!this._memoizedQueries[type]) {
        this._memoizedQueries[type] = Object.create(null);
      }
      let key;
      if (arguments.length === 1 && typeof arguments[0] === "string") {
        key = arguments[0];
      } else if (arguments.length === 2 && typeof arguments[0] === "string" && typeof arguments[1] === "string") {
        key = arguments[0] + "::" + arguments[1];
      } else {
        return fn.apply(this, arguments);
      }
      if (!(key in this._memoizedQueries[type])) {
        this._memoizedQueries[type][key] = fn.apply(this, arguments);
      }
      return this._memoizedQueries[type][key];
    };
  };
  exports.resolveHref = function resolveHref(baseUrl, href) {
    try {
      return new URL(href, baseUrl).href;
    } catch (e) {
      return href;
    }
  };
  exports.mapper = function(parent, filter, recursive) {
    function skipRoot(node) {
      return node !== parent && (!filter || filter(node));
    }
    return () => {
      if (recursive !== false) {
        return domSymbolTree.treeToArray(parent, {filter: skipRoot});
      }
      return domSymbolTree.childrenToArray(parent, {filter});
    };
  };
  function isValidAbsoluteURL(str) {
    try {
      new URL(str);
      return true;
    } catch (e) {
      return false;
    }
  }
  exports.isValidTargetOrigin = function(str) {
    return str === "*" || str === "/" || isValidAbsoluteURL(str);
  };
  exports.simultaneousIterators = function*(first, second) {
    for (; ; ) {
      const firstResult = first.next();
      const secondResult = second.next();
      if (firstResult.done && secondResult.done) {
        return;
      }
      yield [firstResult.done ? null : firstResult.value, secondResult.done ? null : secondResult.value];
    }
  };
  exports.treeOrderSorter = function(a, b) {
    const compare = domSymbolTree.compareTreePosition(a, b);
    if (compare & SYMBOL_TREE_POSITION.PRECEDING) {
      return 1;
    }
    if (compare & SYMBOL_TREE_POSITION.FOLLOWING) {
      return -1;
    }
    return 0;
  };
  exports.lengthFromProperties = function(arrayLike) {
    let max = -1;
    const keys = Object.keys(arrayLike);
    const highestKeyIndex = keys.length - 1;
    if (highestKeyIndex == keys[highestKeyIndex]) {
      return keys.length;
    }
    for (let i = highestKeyIndex; i >= 0; --i) {
      const asNumber = Number(keys[i]);
      if (!Number.isNaN(asNumber) && asNumber > max) {
        max = asNumber;
      }
    }
    return max + 1;
  };
  const base64Regexp = /^(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=|[A-Z0-9+\/]{4})$/i;
  exports.parseDataUrl = function parseDataUrl(url) {
    const urlParts = url.match(/^data:(.+?)(?:;(base64))?,(.*)$/);
    let buffer;
    if (urlParts[2] === "base64") {
      if (urlParts[3] && !base64Regexp.test(urlParts[3])) {
        throw new Error("Not a base64 string");
      }
      buffer = new Buffer(urlParts[3], "base64");
    } else {
      buffer = new Buffer(urlParts[3]);
    }
    return {
      buffer,
      type: urlParts[1]
    };
  };
})(require('buffer').Buffer, require('process'));
