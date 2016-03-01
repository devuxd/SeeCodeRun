/* */ 
"use strict";
const cssom = require('cssom');
const HTMLElementImpl = require('./HTMLElement-impl').implementation;
const LinkStyleImpl = require('./LinkStyle-impl').implementation;
const idlUtils = require('../generated/utils');
const internalConstants = require('../helpers/internal-constants');
const accept = internalConstants.accept;
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
class HTMLLinkElementImpl extends HTMLElementImpl {
  constructor(args, privateData) {
    super(args, privateData);
    this.addEventListener("DOMNodeInsertedIntoDocument", () => {
      const wrapper = idlUtils.wrapperForImpl(this);
      if (!/(?:[ \t\n\r\f]|^)stylesheet(?:[ \t\n\r\f]|$)/i.test(wrapper.rel)) {
        return;
      }
      if (this.href) {
        fetchStylesheet.call(this, this.href, this.sheet);
      }
    });
  }
  get [accept]() {
    return "text/css,*/*;q=0.1";
  }
  get href() {
    return resourceLoader.resolveResourceUrl(this._ownerDocument, this.getAttribute("href"));
  }
  set href(value) {
    this.setAttribute("href", value);
  }
}
idlUtils.mixin(HTMLLinkElementImpl.prototype, LinkStyleImpl.prototype);
module.exports = {implementation: HTMLLinkElementImpl};
