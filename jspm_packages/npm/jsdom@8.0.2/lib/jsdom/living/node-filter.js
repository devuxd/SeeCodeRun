/* */ 
"use strict";
const addConstants = require('../utils').addConstants;
module.exports = function(core) {
  core.NodeFilter = function() {
    throw new TypeError("Illegal constructor");
  };
  core.NodeFilter.acceptNode = function() {
    throw new Error("This method is expected to be written by the user of a NodeFilter.");
  };
  addConstants(core.NodeFilter, {
    SHOW_ALL: 0xFFFFFFFF,
    SHOW_ELEMENT: 0x00000001,
    SHOW_ATTRIBUTE: 0x00000002,
    SHOW_TEXT: 0x00000004,
    SHOW_CDATA_SECTION: 0x00000008,
    SHOW_ENTITY_REFERENCE: 0x00000010,
    SHOW_ENTITY: 0x00000020,
    SHOW_PROCESSING_INSTRUCTION: 0x00000040,
    SHOW_COMMENT: 0x00000080,
    SHOW_DOCUMENT: 0x00000100,
    SHOW_DOCUMENT_TYPE: 0x00000200,
    SHOW_DOCUMENT_FRAGMENT: 0x00000400,
    SHOW_NOTATION: 0x00000800,
    FILTER_ACCEPT: 1,
    FILTER_REJECT: 2,
    FILTER_SKIP: 3
  });
};
