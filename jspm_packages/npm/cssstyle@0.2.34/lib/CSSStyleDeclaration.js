/* */ 
"use strict";
var CSSOM = require('cssom');
var fs = require('fs');
var path = require('path');
var camelToDashed = require('./parsers').camelToDashed;
var dashedToCamelCase = require('./parsers').dashedToCamelCase;
var CSSStyleDeclaration = function CSSStyleDeclaration(onChangeCallback) {
  this._values = {};
  this._importants = {};
  this._length = 0;
  this._onChange = onChangeCallback || function() {
    return;
  };
};
CSSStyleDeclaration.prototype = {
  constructor: CSSStyleDeclaration,
  getPropertyValue: function(name) {
    if (!this._values.hasOwnProperty(name)) {
      return "";
    }
    return this._values[name].toString();
  },
  setProperty: function(name, value, priority) {
    if (value === undefined) {
      return;
    }
    if (value === null || value === '') {
      this.removeProperty(name);
      return;
    }
    var camel_case = dashedToCamelCase(name);
    this[camel_case] = value;
    this._importants[name] = priority;
  },
  _setProperty: function(name, value, priority) {
    if (value === undefined) {
      return;
    }
    if (value === null || value === '') {
      this.removeProperty(name);
      return;
    }
    if (this._values[name]) {
      var index = Array.prototype.indexOf.call(this, name);
      if (index < 0) {
        this[this._length] = name;
        this._length++;
      }
    } else {
      this[this._length] = name;
      this._length++;
    }
    this._values[name] = value;
    this._importants[name] = priority;
    this._onChange(this.cssText);
  },
  removeProperty: function(name) {
    if (!this._values.hasOwnProperty(name)) {
      return "";
    }
    var prevValue = this._values[name];
    delete this._values[name];
    var index = Array.prototype.indexOf.call(this, name);
    if (index < 0) {
      return prevValue;
    }
    Array.prototype.splice.call(this, index, 1);
    this._onChange(this.cssText);
    return prevValue;
  },
  getPropertyPriority: function(name) {
    return this._importants[name] || "";
  },
  getPropertyCSSValue: function() {
    return;
  },
  getPropertyShorthand: function() {
    return;
  },
  isPropertyImplicit: function() {
    return;
  },
  item: function(index) {
    index = parseInt(index, 10);
    if (index < 0 || index >= this._length) {
      return '';
    }
    return this[index];
  }
};
Object.defineProperties(CSSStyleDeclaration.prototype, {
  cssText: {
    get: function() {
      var properties = [];
      var i;
      var name;
      var value;
      var priority;
      for (i = 0; i < this._length; i++) {
        name = this[i];
        value = this.getPropertyValue(name);
        priority = this.getPropertyPriority(name);
        if (priority !== '') {
          priority = " !" + priority;
        }
        properties.push([name, ': ', value, priority, ';'].join(''));
      }
      return properties.join(' ');
    },
    set: function(value) {
      var i;
      this._values = {};
      Array.prototype.splice.call(this, 0, this._length);
      this._importants = {};
      var dummyRule;
      try {
        dummyRule = CSSOM.parse('#bogus{' + value + '}').cssRules[0].style;
      } catch (err) {
        return;
      }
      var rule_length = dummyRule.length;
      var name;
      for (i = 0; i < rule_length; ++i) {
        name = dummyRule[i];
        this.setProperty(dummyRule[i], dummyRule.getPropertyValue(name), dummyRule.getPropertyPriority(name));
      }
      this._onChange(this.cssText);
    },
    enumerable: true,
    configurable: true
  },
  parentRule: {
    get: function() {
      return null;
    },
    enumerable: true,
    configurable: true
  },
  length: {
    get: function() {
      return this._length;
    },
    set: function(value) {
      var i;
      for (i = value; i < this._length; i++) {
        delete this[i];
      }
      this._length = value;
    },
    enumerable: true,
    configurable: true
  },
  'float': {
    get: function() {
      return this.cssFloat;
    },
    set: function(value) {
      this.cssFloat = value;
    },
    enumerable: true,
    configurable: true
  }
});
require('./properties')(CSSStyleDeclaration.prototype);
exports.CSSStyleDeclaration = CSSStyleDeclaration;
