/* */ 
"use strict";
const idlUtils = require('../generated/utils');
const nwmatcher = require('nwmatcher/src/nwmatcher-noqsa');
const domSymbolTree = require('./internal-constants').domSymbolTree;
exports.querySelector = function(parentNode, selectors) {
  if (!domSymbolTree.hasChildren(parentNode) || (parentNode === parentNode._ownerDocument && !parentNode._documentElement)) {
    return null;
  }
  return addNwmatcher(parentNode).first(selectors, idlUtils.wrapperForImpl(parentNode));
};
function addNwmatcher(parentNode) {
  const document = parentNode._ownerDocument;
  if (!document._nwmatcher) {
    document._nwmatcher = nwmatcher({document});
    document._nwmatcher.configure({UNIQUE_ID: false});
  }
  return document._nwmatcher;
}
