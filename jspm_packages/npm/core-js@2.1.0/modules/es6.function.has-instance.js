/* */ 
'use strict';
var isObject = require('./_is-object'),
    getPrototypeOf = require('./_object-gpo'),
    HAS_INSTANCE = require('./_wks')('hasInstance'),
    FunctionProto = Function.prototype;
if (!(HAS_INSTANCE in FunctionProto))
  require('./_object-dp').f(FunctionProto, HAS_INSTANCE, {value: function(O) {
      if (typeof this != 'function' || !isObject(O))
        return false;
      if (!isObject(this.prototype))
        return O instanceof this;
      while (O = getPrototypeOf(O))
        if (this.prototype === O)
          return true;
      return false;
    }});
