/* */ 
"use strict";
const util = require('util');
const ErrorEvent = require('../generated/ErrorEvent');
const errorReportingMode = Symbol("error reporting mode");
function reportAnError(line, col, target, errorObject, message, location) {
  if (errorReportingMode in target) {
    return false;
  }
  target[errorReportingMode] = true;
  const event = ErrorEvent.createImpl(["error", {
    bubbles: false,
    cancelable: true,
    message,
    filename: location,
    lineno: line,
    colno: col,
    error: errorObject
  }]);
  target.dispatchEvent(event);
  delete target[errorReportingMode];
  return event.defaultPrevented;
}
module.exports = function reportException(window, error, filenameHint) {
  const stack = error && error.stack;
  const lines = stack && stack.split("\n");
  let pieces;
  if (lines) {
    for (let i = 1; i < lines.length && !pieces; ++i) {
      pieces = lines[i].match(/at (?:(.+)\s+)?\(?(?:(.+?):(\d+):(\d+)|([^)]+))\)?/);
    }
  }
  const fileName = pieces && pieces[2] || filenameHint || window._document.URL;
  const lineNumber = pieces && parseInt(pieces[3]) || 0;
  const columnNumber = pieces && parseInt(pieces[4]) || 0;
  const handled = reportAnError(lineNumber, columnNumber, window, error, error.message, fileName);
  if (!handled) {
    const jsdomError = new Error(`Uncaught ${util.inspect(error)}`);
    jsdomError.detail = error;
    window._virtualConsole.emit("jsdomError", jsdomError);
  }
};
