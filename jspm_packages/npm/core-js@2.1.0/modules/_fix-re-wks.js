/* */ 
'use strict';
var hide = require('./_hide'),
    redefine = require('./_redefine'),
    fails = require('./_fails'),
    defined = require('./_defined'),
    wks = require('./_wks');
module.exports = function(KEY, length, exec) {
  var SYMBOL = wks(KEY),
      fns = exec(defined, SYMBOL, ''[KEY]),
      strfn = fns[0],
      rxfn = fns[1];
  if (fails(function() {
    var O = {};
    O[SYMBOL] = function() {
      return 7;
    };
    return ''[KEY](O) != 7;
  })) {
    redefine(String.prototype, KEY, strfn);
    hide(RegExp.prototype, SYMBOL, length == 2 ? function(string, arg) {
      return rxfn.call(string, this, arg);
    } : function(string) {
      return rxfn.call(string, this);
    });
  }
};
