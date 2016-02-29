/* */ 
var CSSOM = {CSSRule: require('./CSSRule').CSSRule};
CSSOM.CSSKeyframesRule = function CSSKeyframesRule() {
  CSSOM.CSSRule.call(this);
  this.name = '';
  this.cssRules = [];
};
CSSOM.CSSKeyframesRule.prototype = new CSSOM.CSSRule();
CSSOM.CSSKeyframesRule.prototype.constructor = CSSOM.CSSKeyframesRule;
CSSOM.CSSKeyframesRule.prototype.type = 8;
Object.defineProperty(CSSOM.CSSKeyframesRule.prototype, "cssText", {get: function() {
    var cssTexts = [];
    for (var i = 0,
        length = this.cssRules.length; i < length; i++) {
      cssTexts.push("  " + this.cssRules[i].cssText);
    }
    return "@" + (this._vendorPrefix || '') + "keyframes " + this.name + " { \n" + cssTexts.join("\n") + "\n}";
  }});
exports.CSSKeyframesRule = CSSOM.CSSKeyframesRule;
