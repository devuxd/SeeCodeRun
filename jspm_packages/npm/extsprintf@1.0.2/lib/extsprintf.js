/* */ 
var mod_assert = require('assert');
var mod_util = require('util');
exports.sprintf = jsSprintf;
function jsSprintf(fmt) {
  var regex = ['([^%]*)', '%', '([\'\\-+ #0]*?)', '([1-9]\\d*)?', '(\\.([1-9]\\d*))?', '[lhjztL]*?', '([diouxXfFeEgGaAcCsSp%jr])'].join('');
  var re = new RegExp(regex);
  var args = Array.prototype.slice.call(arguments, 1);
  var flags,
      width,
      precision,
      conversion;
  var left,
      pad,
      sign,
      arg,
      match;
  var ret = '';
  var argn = 1;
  mod_assert.equal('string', typeof(fmt));
  while ((match = re.exec(fmt)) !== null) {
    ret += match[1];
    fmt = fmt.substring(match[0].length);
    flags = match[2] || '';
    width = match[3] || 0;
    precision = match[4] || '';
    conversion = match[6];
    left = false;
    sign = false;
    pad = ' ';
    if (conversion == '%') {
      ret += '%';
      continue;
    }
    if (args.length === 0)
      throw (new Error('too few args to sprintf'));
    arg = args.shift();
    argn++;
    if (flags.match(/[\' #]/))
      throw (new Error('unsupported flags: ' + flags));
    if (precision.length > 0)
      throw (new Error('non-zero precision not supported'));
    if (flags.match(/-/))
      left = true;
    if (flags.match(/0/))
      pad = '0';
    if (flags.match(/\+/))
      sign = true;
    switch (conversion) {
      case 's':
        if (arg === undefined || arg === null)
          throw (new Error('argument ' + argn + ': attempted to print undefined or null ' + 'as a string'));
        ret += doPad(pad, width, left, arg.toString());
        break;
      case 'd':
        arg = Math.floor(arg);
      case 'f':
        sign = sign && arg > 0 ? '+' : '';
        ret += sign + doPad(pad, width, left, arg.toString());
        break;
      case 'j':
        if (width === 0)
          width = 10;
        ret += mod_util.inspect(arg, false, width);
        break;
      case 'r':
        ret += dumpException(arg);
        break;
      default:
        throw (new Error('unsupported conversion: ' + conversion));
    }
  }
  ret += fmt;
  return (ret);
}
function doPad(chr, width, left, str) {
  var ret = str;
  while (ret.length < width) {
    if (left)
      ret += chr;
    else
      ret = chr + ret;
  }
  return (ret);
}
function dumpException(ex) {
  var ret;
  if (!(ex instanceof Error))
    throw (new Error(jsSprintf('invalid type for %%r: %j', ex)));
  ret = 'EXCEPTION: ' + ex.constructor.name + ': ' + ex.stack;
  if (ex.cause && typeof(ex.cause) === 'function') {
    var cex = ex.cause();
    if (cex) {
      ret += '\nCaused by: ' + dumpException(cex);
    }
  }
  return (ret);
}
