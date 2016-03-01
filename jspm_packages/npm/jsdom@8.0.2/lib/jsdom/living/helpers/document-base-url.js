/* */ 
"use strict";
const internalQuerySelector = require('./selectors').querySelector;
const internalGetAttr = require('../attributes').getAttributeValue;
const whatwgURL = require('whatwg-url');
const idlUtils = require('../generated/utils');
exports.documentBaseURL = (document) => {
  let firstBase = internalQuerySelector(document, "base[href]");
  if (firstBase) {
    firstBase = idlUtils.implForWrapper(firstBase);
  }
  const fallbackBaseURL = exports.fallbackBaseURL(document);
  if (firstBase === null) {
    return fallbackBaseURL;
  }
  return exports.frozenBaseURL(firstBase, fallbackBaseURL);
};
exports.fallbackBaseURL = (document) => {
  if (document.URL === "about:blank" && document._defaultView && document._defaultView._parent !== document._defaultView) {
    return exports.documentBaseURL(document._defaultView._parent._document);
  }
  return document.URL;
};
exports.frozenBaseURL = (baseElement, fallbackBaseURL) => {
  const baseHrefAttribute = internalGetAttr(baseElement, "href");
  try {
    return whatwgURL.serializeURL(whatwgURL.parseURL(baseHrefAttribute, {baseURL: whatwgURL.parseURL(fallbackBaseURL)}));
  } catch (e) {
    return fallbackBaseURL;
  }
};
exports.resolveURLToResultingParsedURL = (url, absoluteURLOrElement) => {
  const base = typeof absoluteURLOrElement === "string" ? absoluteURLOrElement : exports.documentBaseURL(absoluteURLOrElement._ownerDocument);
  const baseURLRecord = whatwgURL.parseURL(base);
  return whatwgURL.parseURL(url, {baseURL: baseURLRecord});
};
