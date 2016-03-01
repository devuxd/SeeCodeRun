/* */ 
var $keys = require('./_object-keys-internal'),
    hiddenKeys = require('./_enum-bug-keys').concat('length', 'prototype');
exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return $keys(O, hiddenKeys);
};
