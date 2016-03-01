/* */ 
"use strict";
const cssom = require('cssom');
const HTMLElementImpl = require('./HTMLElement-impl').implementation;
const LinkStyleImpl = require('./LinkStyle-impl').implementation;
const idlUtils = require('../generated/utils');
const domSymbolTree = require('../helpers/internal-constants').domSymbolTree;
const NODE_TYPE = require('../node-type');
const resourceLoader = require('../../browser/resource-loader');
const resolveHref = require('../../utils').resolveHref;
function fetchStylesheet(url, sheet) {
  resourceLoader.load(this, url, (data) => {
    url = sheet.href = resourceLoader.resolveResourceUrl(this.ownerDocument, url);
    evaluateStylesheet.call(this, data, sheet, url);
  });
}
function evaluateStylesheet(data, sheet, baseUrl) {
  const newStyleSheet = cssom.parse(data);
  const spliceArgs = newStyleSheet.cssRules;
  spliceArgs.unshift(0, sheet.cssRules.length);
  Array.prototype.splice.apply(sheet.cssRules, spliceArgs);
  scanForImportRules.call(this, sheet.cssRules, baseUrl);
  this.ownerDocument.styleSheets.push(sheet);
}
function scanForImportRules(cssRules, baseUrl) {
  if (!cssRules) {
    return;
  }
  for (let i = 0; i < cssRules.length; ++i) {
    if (cssRules[i].cssRules) {
      scanForImportRules.call(this, cssRules[i].cssRules, baseUrl);
    } else if (cssRules[i].href) {
      fetchStylesheet.call(this, resolveHref(baseUrl, cssRules[i].href), this.sheet);
    }
  }
}
class HTMLStyleElementImpl extends HTMLElementImpl {
  constructor(args, privateData) {
    super(args, privateData);
    this.addEventListener("DOMNodeInsertedIntoDocument", () => {
      if (this.type && this.type !== "text/css") {
        return;
      }
      let content = "";
      for (const child of domSymbolTree.childrenIterator(this)) {
        if (child.nodeType === NODE_TYPE.TEXT_NODE) {
          content += child.nodeValue;
        }
      }
      evaluateStylesheet.call(this, content, this.sheet, this._ownerDocument.URL);
    });
  }
}
idlUtils.mixin(HTMLStyleElementImpl.prototype, LinkStyleImpl.prototype);
module.exports = {implementation: HTMLStyleElementImpl};
