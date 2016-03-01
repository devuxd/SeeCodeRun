/* */ 
"use strict";
const inheritFrom = require('../utils').inheritFrom;
const addConstants = require('../utils').addConstants;
const table = require('./dom-exception-table.json!systemjs-json');
const namesWithCodes = Object.keys(table).filter((name) => "legacyCodeValue" in table[name]);
const codesToNames = Object.create(null);
for (const name of namesWithCodes) {
  codesToNames[table[name].legacyCodeValue] = name;
}
module.exports = DOMException;
function DOMException(code, message) {
  const name = codesToNames[code];
  if (message === undefined) {
    message = table[name].description;
  }
  Error.call(this, message);
  Object.defineProperty(this, "name", {
    value: name,
    writable: true,
    configurable: true,
    enumerable: false
  });
  Object.defineProperty(this, "code", {
    value: code,
    writable: true,
    configurable: true,
    enumerable: false
  });
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, DOMException);
  }
}
inheritFrom(Error, DOMException);
const constants = Object.create(null);
for (const name of namesWithCodes) {
  constants[table[name].legacyCodeName] = table[name].legacyCodeValue;
}
addConstants(DOMException, constants);
