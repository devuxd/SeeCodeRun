/* */ 
'use strict';
var global = require('./_global'),
    has = require('./_has'),
    cof = require('./_cof'),
    inheritIfRequired = require('./_inherit-if-required'),
    toPrimitive = require('./_to-primitive'),
    fails = require('./_fails'),
    gOPN = require('./_object-gopn').f,
    gOPD = require('./_object-gopd').f,
    dP = require('./_object-dp').f,
    $trim = require('./_string-trim').trim,
    NUMBER = 'Number',
    $Number = global[NUMBER],
    Base = $Number,
    proto = $Number.prototype,
    BROKEN_COF = cof(require('./_object-create')(proto)) == NUMBER,
    TRIM = 'trim' in String.prototype;
var toNumber = function(argument) {
  var it = toPrimitive(argument, false);
  if (typeof it == 'string' && it.length > 2) {
    it = TRIM ? it.trim() : $trim(it, 3);
    var first = it.charCodeAt(0),
        third,
        radix,
        maxCode;
    if (first === 43 || first === 45) {
      third = it.charCodeAt(2);
      if (third === 88 || third === 120)
        return NaN;
    } else if (first === 48) {
      switch (it.charCodeAt(1)) {
        case 66:
        case 98:
          radix = 2;
          maxCode = 49;
          break;
        case 79:
        case 111:
          radix = 8;
          maxCode = 55;
          break;
        default:
          return +it;
      }
      for (var digits = it.slice(2),
          i = 0,
          l = digits.length,
          code; i < l; i++) {
        code = digits.charCodeAt(i);
        if (code < 48 || code > maxCode)
          return NaN;
      }
      return parseInt(digits, radix);
    }
  }
  return +it;
};
if (!$Number(' 0o1') || !$Number('0b1') || $Number('+0x1')) {
  $Number = function Number(value) {
    var it = arguments.length < 1 ? 0 : value,
        that = this;
    return that instanceof $Number && (BROKEN_COF ? fails(function() {
      proto.valueOf.call(that);
    }) : cof(that) != NUMBER) ? inheritIfRequired(new Base(toNumber(it)), that, $Number) : toNumber(it);
  };
  for (var keys = require('./_descriptors') ? gOPN(Base) : ('MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' + 'EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,' + 'MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger').split(','),
      j = 0,
      key; keys.length > j; j++) {
    if (has(Base, key = keys[j]) && !has($Number, key)) {
      dP($Number, key, gOPD(Base, key));
    }
  }
  $Number.prototype = proto;
  proto.constructor = $Number;
  require('./_redefine')(global, NUMBER, $Number);
}
