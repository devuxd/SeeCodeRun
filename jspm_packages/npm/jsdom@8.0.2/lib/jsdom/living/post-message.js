/* */ 
"use strict";
const isValidTargetOrigin = require('../utils').isValidTargetOrigin;
const DOMException = require('../web-idl/DOMException');
module.exports = function(message, targetOrigin) {
  if (arguments.length < 2) {
    throw new TypeError("'postMessage' requires 2 arguments: 'message' and 'targetOrigin'");
  }
  targetOrigin = String(targetOrigin);
  if (!isValidTargetOrigin(targetOrigin)) {
    throw new DOMException(DOMException.SYNTAX_ERR, "Failed to execute 'postMessage' on 'Window': " + "Invalid target origin '" + targetOrigin + "' in a call to 'postMessage'.");
  }
  if (targetOrigin !== "*" && targetOrigin !== this.origin) {
    return;
  }
  const event = new this.MessageEvent("message", {data: message});
  event.initEvent("message", false, false);
  setTimeout(() => {
    this.dispatchEvent(event);
  }, 0);
};
