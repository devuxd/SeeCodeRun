/* */ 
var mod_assert = require('assert');
var mod_util = require('util');
var mod_extsprintf = require('extsprintf');
exports.VError = VError;
exports.WError = WError;
exports.MultiError = MultiError;
function VError(options) {
  var args,
      causedBy,
      ctor,
      tailmsg;
  if (options instanceof Error || typeof(options) === 'object') {
    args = Array.prototype.slice.call(arguments, 1);
  } else {
    args = Array.prototype.slice.call(arguments, 0);
    options = undefined;
  }
  tailmsg = args.length > 0 ? mod_extsprintf.sprintf.apply(null, args) : '';
  this.jse_shortmsg = tailmsg;
  this.jse_summary = tailmsg;
  if (options) {
    causedBy = options.cause;
    if (!causedBy || !(options.cause instanceof Error))
      causedBy = options;
    if (causedBy && (causedBy instanceof Error)) {
      this.jse_cause = causedBy;
      this.jse_summary += ': ' + causedBy.message;
    }
  }
  this.message = this.jse_summary;
  Error.call(this, this.jse_summary);
  if (Error.captureStackTrace) {
    ctor = options ? options.constructorOpt : undefined;
    ctor = ctor || arguments.callee;
    Error.captureStackTrace(this, ctor);
  }
}
mod_util.inherits(VError, Error);
VError.prototype.name = 'VError';
VError.prototype.toString = function ve_toString() {
  var str = (this.hasOwnProperty('name') && this.name || this.constructor.name || this.constructor.prototype.name);
  if (this.message)
    str += ': ' + this.message;
  return (str);
};
VError.prototype.cause = function ve_cause() {
  return (this.jse_cause);
};
function MultiError(errors) {
  mod_assert.ok(errors.length > 0);
  this.ase_errors = errors;
  VError.call(this, errors[0], 'first of %d error%s', errors.length, errors.length == 1 ? '' : 's');
}
mod_util.inherits(MultiError, VError);
function WError(options) {
  Error.call(this);
  var args,
      cause,
      ctor;
  if (typeof(options) === 'object') {
    args = Array.prototype.slice.call(arguments, 1);
  } else {
    args = Array.prototype.slice.call(arguments, 0);
    options = undefined;
  }
  if (args.length > 0) {
    this.message = mod_extsprintf.sprintf.apply(null, args);
  } else {
    this.message = '';
  }
  if (options) {
    if (options instanceof Error) {
      cause = options;
    } else {
      cause = options.cause;
      ctor = options.constructorOpt;
    }
  }
  Error.captureStackTrace(this, ctor || this.constructor);
  if (cause)
    this.cause(cause);
}
mod_util.inherits(WError, Error);
WError.prototype.name = 'WError';
WError.prototype.toString = function we_toString() {
  var str = (this.hasOwnProperty('name') && this.name || this.constructor.name || this.constructor.prototype.name);
  if (this.message)
    str += ': ' + this.message;
  if (this.we_cause && this.we_cause.message)
    str += '; caused by ' + this.we_cause.toString();
  return (str);
};
WError.prototype.cause = function we_cause(c) {
  if (c instanceof Error)
    this.we_cause = c;
  return (this.we_cause);
};
