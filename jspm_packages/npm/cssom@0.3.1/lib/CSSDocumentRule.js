/* */ 
var CSSOM = {
  CSSRule: require('./CSSRule').CSSRule,
  MatcherList: require('./MatcherList').MatcherList
};
CSSOM.CSSDocumentRule = function CSSDocumentRule() {
  CSSOM.CSSRule.call(this);
  this.matcher = new CSSOM.MatcherList();
  this.cssRules = [];
};
CSSOM.CSSDocumentRule.prototype = new CSSOM.CSSRule();
CSSOM.CSSDocumentRule.prototype.constructor = CSSOM.CSSDocumentRule;
CSSOM.CSSDocumentRule.prototype.type = 10;
Object.defineProperty(CSSOM.CSSDocumentRule.prototype, "cssText", {get: function() {
    var cssTexts = [];
    for (var i = 0,
        length = this.cssRules.length; i < length; i++) {
      cssTexts.push(this.cssRules[i].cssText);
    }
    return "@-moz-document " + this.matcher.matcherText + " {" + cssTexts.join("") + "}";
  }});
exports.CSSDocumentRule = CSSOM.CSSDocumentRule;
