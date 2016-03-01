/* */ 
'use strict';
var global = require('./_global'),
    core = require('./_core'),
    has = require('./_has'),
    DESCRIPTORS = require('./_descriptors'),
    $export = require('./_export'),
    redefine = require('./_redefine'),
    META = require('./_meta').KEY,
    $fails = require('./_fails'),
    shared = require('./_shared'),
    setToStringTag = require('./_set-to-string-tag'),
    uid = require('./_uid'),
    wks = require('./_wks'),
    keyOf = require('./_keyof'),
    enumKeys = require('./_enum-keys'),
    isArray = require('./_is-array'),
    anObject = require('./_an-object'),
    toIObject = require('./_to-iobject'),
    toPrimitive = require('./_to-primitive'),
    createDesc = require('./_property-desc'),
    _create = require('./_object-create'),
    gOPNExt = require('./_object-gopn-ext'),
    $GOPD = require('./_object-gopd'),
    $DP = require('./_object-dp'),
    gOPD = $GOPD.f,
    dP = $DP.f,
    gOPN = gOPNExt.f,
    $Symbol = global.Symbol,
    $JSON = global.JSON,
    _stringify = $JSON && $JSON.stringify,
    setter = false,
    HIDDEN = wks('_hidden'),
    isEnum = {}.propertyIsEnumerable,
    SymbolRegistry = shared('symbol-registry'),
    AllSymbols = shared('symbols'),
    ObjectProto = Object.prototype,
    USE_NATIVE = typeof $Symbol == 'function';
var setSymbolDesc = DESCRIPTORS && $fails(function() {
  return _create(dP({}, 'a', {get: function() {
      return dP(this, 'a', {value: 7}).a;
    }})).a != 7;
}) ? function(it, key, D) {
  var protoDesc = gOPD(ObjectProto, key);
  if (protoDesc)
    delete ObjectProto[key];
  dP(it, key, D);
  if (protoDesc && it !== ObjectProto)
    dP(ObjectProto, key, protoDesc);
} : dP;
var wrap = function(tag) {
  var sym = AllSymbols[tag] = _create($Symbol.prototype);
  sym._k = tag;
  DESCRIPTORS && setter && setSymbolDesc(ObjectProto, tag, {
    configurable: true,
    set: function(value) {
      if (has(this, HIDDEN) && has(this[HIDDEN], tag))
        this[HIDDEN][tag] = false;
      setSymbolDesc(this, tag, createDesc(1, value));
    }
  });
  return sym;
};
var isSymbol = function(it) {
  return typeof it == 'symbol';
};
var $defineProperty = function defineProperty(it, key, D) {
  anObject(it);
  key = toPrimitive(key, true);
  anObject(D);
  if (has(AllSymbols, key)) {
    if (!D.enumerable) {
      if (!has(it, HIDDEN))
        dP(it, HIDDEN, createDesc(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if (has(it, HIDDEN) && it[HIDDEN][key])
        it[HIDDEN][key] = false;
      D = _create(D, {enumerable: createDesc(0, false)});
    }
    return setSymbolDesc(it, key, D);
  }
  return dP(it, key, D);
};
var $defineProperties = function defineProperties(it, P) {
  anObject(it);
  var keys = enumKeys(P = toIObject(P)),
      i = 0,
      l = keys.length,
      key;
  while (l > i)
    $defineProperty(it, key = keys[i++], P[key]);
  return it;
};
var $create = function create(it, P) {
  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
};
var $propertyIsEnumerable = function propertyIsEnumerable(key) {
  var E = isEnum.call(this, key = toPrimitive(key, true));
  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
};
var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key) {
  var D = gOPD(it = toIObject(it), key = toPrimitive(key, true));
  if (D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key]))
    D.enumerable = true;
  return D;
};
var $getOwnPropertyNames = function getOwnPropertyNames(it) {
  var names = gOPN(toIObject(it)),
      result = [],
      i = 0,
      key;
  while (names.length > i)
    if (!has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META)
      result.push(key);
  return result;
};
var $getOwnPropertySymbols = function getOwnPropertySymbols(it) {
  var names = gOPN(toIObject(it)),
      result = [],
      i = 0,
      key;
  while (names.length > i)
    if (has(AllSymbols, key = names[i++]))
      result.push(AllSymbols[key]);
  return result;
};
var $stringify = function stringify(it) {
  if (it === undefined || isSymbol(it))
    return;
  var args = [it],
      i = 1,
      replacer,
      $replacer;
  while (arguments.length > i)
    args.push(arguments[i++]);
  replacer = args[1];
  if (typeof replacer == 'function')
    $replacer = replacer;
  if ($replacer || !isArray(replacer))
    replacer = function(key, value) {
      if ($replacer)
        value = $replacer.call(this, key, value);
      if (!isSymbol(value))
        return value;
    };
  args[1] = replacer;
  return _stringify.apply($JSON, args);
};
var BUGGY_JSON = $fails(function() {
  var S = $Symbol();
  return _stringify([S]) != '[null]' || _stringify({a: S}) != '{}' || _stringify(Object(S)) != '{}';
});
if (!USE_NATIVE) {
  $Symbol = function Symbol() {
    if (isSymbol(this))
      throw TypeError('Symbol is not a constructor');
    return wrap(uid(arguments.length > 0 ? arguments[0] : undefined));
  };
  redefine($Symbol.prototype, 'toString', function toString() {
    return this._k;
  });
  isSymbol = function(it) {
    return it instanceof $Symbol;
  };
  $GOPD.f = $getOwnPropertyDescriptor;
  $DP.f = $defineProperty;
  require('./_object-gopn').f = gOPNExt.f = $getOwnPropertyNames;
  require('./_object-pie').f = $propertyIsEnumerable;
  require('./_object-gops').f = $getOwnPropertySymbols;
  if (DESCRIPTORS && !require('./_library')) {
    redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
  }
}
$export($export.G + $export.W + $export.F * !USE_NATIVE, {Symbol: $Symbol});
for (var symbols = ('hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables').split(','),
    i = 0; symbols.length > i; ) {
  var key = symbols[i++],
      Wrapper = core.Symbol,
      sym = wks(key);
  if (!(key in Wrapper))
    dP(Wrapper, key, {value: USE_NATIVE ? sym : wrap(sym)});
}
;
setter = true;
$export($export.S + $export.F * !USE_NATIVE, 'Symbol', {
  'for': function(key) {
    return has(SymbolRegistry, key += '') ? SymbolRegistry[key] : SymbolRegistry[key] = $Symbol(key);
  },
  keyFor: function keyFor(key) {
    return keyOf(SymbolRegistry, key);
  },
  useSetter: function() {
    setter = true;
  },
  useSimple: function() {
    setter = false;
  }
});
$export($export.S + $export.F * !USE_NATIVE, 'Object', {
  create: $create,
  defineProperty: $defineProperty,
  defineProperties: $defineProperties,
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
  getOwnPropertyNames: $getOwnPropertyNames,
  getOwnPropertySymbols: $getOwnPropertySymbols
});
$JSON && $export($export.S + $export.F * (!USE_NATIVE || BUGGY_JSON), 'JSON', {stringify: $stringify});
setToStringTag($Symbol, 'Symbol');
setToStringTag(Math, 'Math', true);
setToStringTag(global.JSON, 'JSON', true);
