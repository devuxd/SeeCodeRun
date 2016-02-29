/* */ 
var CSSOM = {
  CSSRule: require('./CSSRule').CSSRule,
  MediaList: require('./MediaList').MediaList
};
CSSOM.CSSMediaRule = function CSSMediaRule() {
  CSSOM.CSSRule.call(this);
  this.media = new CSSOM.MediaList();
  this.cssRules = [];
};
CSSOM.CSSMediaRule.prototype = new CSSOM.CSSRule();
CSSOM.CSSMediaRule.prototype.constructor = CSSOM.CSSMediaRule;
CSSOM.CSSMediaRule.prototype.type = 4;
Object.defineProperty(CSSOM.CSSMediaRule.prototype, "cssText", {get: function() {
    var cssTexts = [];
    for (var i = 0,
        length = this.cssRules.length; i < length; i++) {
      cssTexts.push(this.cssRules[i].cssText);
    }
    return "@media " + this.media.mediaText + " {" + cssTexts.join("") + "}";
  }});
exports.CSSMediaRule = CSSOM.CSSMediaRule;
