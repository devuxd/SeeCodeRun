/* */ 
var CSSOM = {
  StyleSheet: require('./StyleSheet').StyleSheet,
  CSSStyleRule: require('./CSSStyleRule').CSSStyleRule
};
CSSOM.CSSStyleSheet = function CSSStyleSheet() {
  CSSOM.StyleSheet.call(this);
  this.cssRules = [];
};
CSSOM.CSSStyleSheet.prototype = new CSSOM.StyleSheet();
CSSOM.CSSStyleSheet.prototype.constructor = CSSOM.CSSStyleSheet;
CSSOM.CSSStyleSheet.prototype.insertRule = function(rule, index) {
  if (index < 0 || index > this.cssRules.length) {
    throw new RangeError("INDEX_SIZE_ERR");
  }
  var cssRule = CSSOM.parse(rule).cssRules[0];
  cssRule.parentStyleSheet = this;
  this.cssRules.splice(index, 0, cssRule);
  return index;
};
CSSOM.CSSStyleSheet.prototype.deleteRule = function(index) {
  if (index < 0 || index >= this.cssRules.length) {
    throw new RangeError("INDEX_SIZE_ERR");
  }
  this.cssRules.splice(index, 1);
};
CSSOM.CSSStyleSheet.prototype.toString = function() {
  var result = "";
  var rules = this.cssRules;
  for (var i = 0; i < rules.length; i++) {
    result += rules[i].cssText + "\n";
  }
  return result;
};
exports.CSSStyleSheet = CSSOM.CSSStyleSheet;
CSSOM.parse = require('./parse').parse;
