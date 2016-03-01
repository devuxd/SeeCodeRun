/* */ 
var CSSOM = {};
CSSOM.CSSStyleDeclaration = function CSSStyleDeclaration() {
  this.length = 0;
  this.parentRule = null;
  this._importants = {};
};
CSSOM.CSSStyleDeclaration.prototype = {
  constructor: CSSOM.CSSStyleDeclaration,
  getPropertyValue: function(name) {
    return this[name] || "";
  },
  setProperty: function(name, value, priority) {
    if (this[name]) {
      var index = Array.prototype.indexOf.call(this, name);
      if (index < 0) {
        this[this.length] = name;
        this.length++;
      }
    } else {
      this[this.length] = name;
      this.length++;
    }
    this[name] = value;
    this._importants[name] = priority;
  },
  removeProperty: function(name) {
    if (!(name in this)) {
      return "";
    }
    var index = Array.prototype.indexOf.call(this, name);
    if (index < 0) {
      return "";
    }
    var prevValue = this[name];
    this[name] = "";
    Array.prototype.splice.call(this, index, 1);
    return prevValue;
  },
  getPropertyCSSValue: function() {},
  getPropertyPriority: function(name) {
    return this._importants[name] || "";
  },
  getPropertyShorthand: function() {},
  isPropertyImplicit: function() {},
  get cssText() {
    var properties = [];
    for (var i = 0,
        length = this.length; i < length; ++i) {
      var name = this[i];
      var value = this.getPropertyValue(name);
      var priority = this.getPropertyPriority(name);
      if (priority) {
        priority = " !" + priority;
      }
      properties[i] = name + ": " + value + priority + ";";
    }
    return properties.join(" ");
  },
  set cssText(text) {
    var i,
        name;
    for (i = this.length; i--; ) {
      name = this[i];
      this[name] = "";
    }
    Array.prototype.splice.call(this, 0, this.length);
    this._importants = {};
    var dummyRule = CSSOM.parse('#bogus{' + text + '}').cssRules[0].style;
    var length = dummyRule.length;
    for (i = 0; i < length; ++i) {
      name = dummyRule[i];
      this.setProperty(dummyRule[i], dummyRule.getPropertyValue(name), dummyRule.getPropertyPriority(name));
    }
  }
};
exports.CSSStyleDeclaration = CSSOM.CSSStyleDeclaration;
CSSOM.parse = require('./parse').parse;
