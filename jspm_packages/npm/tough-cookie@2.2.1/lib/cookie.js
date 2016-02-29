/* */ 
'use strict';
var net = require('net');
var urlParse = require('url').parse;
var pubsuffix = require('./pubsuffix');
var Store = require('./store').Store;
var MemoryCookieStore = require('./memstore').MemoryCookieStore;
var pathMatch = require('./pathMatch').pathMatch;
var VERSION = require('../package.json!systemjs-json').version;
var punycode;
try {
  punycode = require('punycode');
} catch (e) {
  console.warn("cookie: can't load punycode; won't use punycode for domain normalization");
}
var DATE_DELIM = /[\x09\x20-\x2F\x3B-\x40\x5B-\x60\x7B-\x7E]/;
var COOKIE_OCTET = /[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]/;
var COOKIE_OCTETS = new RegExp('^' + COOKIE_OCTET.source + '+$');
var CONTROL_CHARS = /[\x00-\x1F]/;
var COOKIE_PAIR = /^(([^=;]+))\s*=\s*(("?)[^\n\r\0]*\3)/;
var LOOSE_COOKIE_PAIR = /^((?:=)?([^=;]*)\s*=\s*)?(("?)[^\n\r\0]*\3)/;
var PATH_VALUE = /[\x20-\x3A\x3C-\x7E]+/;
var TRAILING_SEMICOLON = /;+$/;
var DAY_OF_MONTH = /^(\d{1,2})[^\d]*$/;
var TIME = /^(\d{1,2})[^\d]*:(\d{1,2})[^\d]*:(\d{1,2})[^\d]*$/;
var MONTH = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
var MONTH_TO_NUM = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11
};
var NUM_TO_MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var NUM_TO_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var YEAR = /^(\d{2}|\d{4})$/;
var MAX_TIME = 2147483647000;
var MIN_TIME = 0;
function parseDate(str) {
  if (!str) {
    return;
  }
  var tokens = str.split(DATE_DELIM);
  if (!tokens) {
    return;
  }
  var hour = null;
  var minutes = null;
  var seconds = null;
  var day = null;
  var month = null;
  var year = null;
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i].trim();
    if (!token.length) {
      continue;
    }
    var result;
    if (seconds === null) {
      result = TIME.exec(token);
      if (result) {
        hour = parseInt(result[1], 10);
        minutes = parseInt(result[2], 10);
        seconds = parseInt(result[3], 10);
        if (hour > 23 || minutes > 59 || seconds > 59) {
          return;
        }
        continue;
      }
    }
    if (day === null) {
      result = DAY_OF_MONTH.exec(token);
      if (result) {
        day = parseInt(result, 10);
        if (day < 1 || day > 31) {
          return;
        }
        continue;
      }
    }
    if (month === null) {
      result = MONTH.exec(token);
      if (result) {
        month = MONTH_TO_NUM[result[1].toLowerCase()];
        continue;
      }
    }
    if (year === null) {
      result = YEAR.exec(token);
      if (result) {
        year = parseInt(result[0], 10);
        if (70 <= year && year <= 99) {
          year += 1900;
        } else if (0 <= year && year <= 69) {
          year += 2000;
        }
        if (year < 1601) {
          return;
        }
      }
    }
  }
  if (seconds === null || day === null || month === null || year === null) {
    return;
  }
  return new Date(Date.UTC(year, month, day, hour, minutes, seconds));
}
function formatDate(date) {
  var d = date.getUTCDate();
  d = d >= 10 ? d : '0' + d;
  var h = date.getUTCHours();
  h = h >= 10 ? h : '0' + h;
  var m = date.getUTCMinutes();
  m = m >= 10 ? m : '0' + m;
  var s = date.getUTCSeconds();
  s = s >= 10 ? s : '0' + s;
  return NUM_TO_DAY[date.getUTCDay()] + ', ' + d + ' ' + NUM_TO_MONTH[date.getUTCMonth()] + ' ' + date.getUTCFullYear() + ' ' + h + ':' + m + ':' + s + ' GMT';
}
function canonicalDomain(str) {
  if (str == null) {
    return null;
  }
  str = str.trim().replace(/^\./, '');
  if (punycode && /[^\u0001-\u007f]/.test(str)) {
    str = punycode.toASCII(str);
  }
  return str.toLowerCase();
}
function domainMatch(str, domStr, canonicalize) {
  if (str == null || domStr == null) {
    return null;
  }
  if (canonicalize !== false) {
    str = canonicalDomain(str);
    domStr = canonicalDomain(domStr);
  }
  if (str == domStr) {
    return true;
  }
  if (net.isIP(str)) {
    return false;
  }
  var idx = str.indexOf(domStr);
  if (idx <= 0) {
    return false;
  }
  if (str.length !== domStr.length + idx) {
    return false;
  }
  if (str.substr(idx - 1, 1) !== '.') {
    return false;
  }
  return true;
}
function defaultPath(path) {
  if (!path || path.substr(0, 1) !== "/") {
    return "/";
  }
  if (path === "/") {
    return path;
  }
  var rightSlash = path.lastIndexOf("/");
  if (rightSlash === 0) {
    return "/";
  }
  return path.slice(0, rightSlash);
}
function parse(str, options) {
  if (!options || typeof options !== 'object') {
    options = {};
  }
  str = str.trim();
  var semiColonCheck = TRAILING_SEMICOLON.exec(str);
  if (semiColonCheck) {
    str = str.slice(0, semiColonCheck.index);
  }
  var firstSemi = str.indexOf(';');
  var pairRe = options.loose ? LOOSE_COOKIE_PAIR : COOKIE_PAIR;
  var result = pairRe.exec(firstSemi === -1 ? str : str.substr(0, firstSemi));
  if (!result) {
    return;
  }
  var c = new Cookie();
  if (result[1]) {
    c.key = result[2].trim();
  } else {
    c.key = '';
  }
  c.value = result[3].trim();
  if (CONTROL_CHARS.test(c.key) || CONTROL_CHARS.test(c.value)) {
    return;
  }
  if (firstSemi === -1) {
    return c;
  }
  var unparsed = str.slice(firstSemi).replace(/^\s*;\s*/, '').trim();
  if (unparsed.length === 0) {
    return c;
  }
  var cookie_avs = unparsed.split(/\s*;\s*/);
  while (cookie_avs.length) {
    var av = cookie_avs.shift();
    var av_sep = av.indexOf('=');
    var av_key,
        av_value;
    if (av_sep === -1) {
      av_key = av;
      av_value = null;
    } else {
      av_key = av.substr(0, av_sep);
      av_value = av.substr(av_sep + 1);
    }
    av_key = av_key.trim().toLowerCase();
    if (av_value) {
      av_value = av_value.trim();
    }
    switch (av_key) {
      case 'expires':
        if (av_value) {
          var exp = parseDate(av_value);
          if (exp) {
            c.expires = exp;
          }
        }
        break;
      case 'max-age':
        if (av_value) {
          if (/^-?[0-9]+$/.test(av_value)) {
            var delta = parseInt(av_value, 10);
            c.setMaxAge(delta);
          }
        }
        break;
      case 'domain':
        if (av_value) {
          var domain = av_value.trim().replace(/^\./, '');
          if (domain) {
            c.domain = domain.toLowerCase();
          }
        }
        break;
      case 'path':
        c.path = av_value && av_value[0] === "/" ? av_value : null;
        break;
      case 'secure':
        c.secure = true;
        break;
      case 'httponly':
        c.httpOnly = true;
        break;
      default:
        c.extensions = c.extensions || [];
        c.extensions.push(av);
        break;
    }
  }
  return c;
}
function jsonParse(str) {
  var obj;
  try {
    obj = JSON.parse(str);
  } catch (e) {
    return e;
  }
  return obj;
}
function fromJSON(str) {
  if (!str) {
    return null;
  }
  var obj;
  if (typeof str === 'string') {
    obj = jsonParse(str);
    if (obj instanceof Error) {
      return null;
    }
  } else {
    obj = str;
  }
  var c = new Cookie();
  for (var i = 0; i < Cookie.serializableProperties.length; i++) {
    var prop = Cookie.serializableProperties[i];
    if (obj[prop] === undefined || obj[prop] === Cookie.prototype[prop]) {
      continue;
    }
    if (prop === 'expires' || prop === 'creation' || prop === 'lastAccessed') {
      if (obj[prop] === null) {
        c[prop] = null;
      } else {
        c[prop] = obj[prop] == "Infinity" ? "Infinity" : new Date(obj[prop]);
      }
    } else {
      c[prop] = obj[prop];
    }
  }
  return c;
}
function cookieCompare(a, b) {
  var cmp = 0;
  var aPathLen = a.path ? a.path.length : 0;
  var bPathLen = b.path ? b.path.length : 0;
  cmp = bPathLen - aPathLen;
  if (cmp !== 0) {
    return cmp;
  }
  var aTime = a.creation ? a.creation.getTime() : MAX_TIME;
  var bTime = b.creation ? b.creation.getTime() : MAX_TIME;
  cmp = aTime - bTime;
  if (cmp !== 0) {
    return cmp;
  }
  cmp = a.creationIndex - b.creationIndex;
  return cmp;
}
function permutePath(path) {
  if (path === '/') {
    return ['/'];
  }
  if (path.lastIndexOf('/') === path.length - 1) {
    path = path.substr(0, path.length - 1);
  }
  var permutations = [path];
  while (path.length > 1) {
    var lindex = path.lastIndexOf('/');
    if (lindex === 0) {
      break;
    }
    path = path.substr(0, lindex);
    permutations.push(path);
  }
  permutations.push('/');
  return permutations;
}
function getCookieContext(url) {
  if (url instanceof Object) {
    return url;
  }
  try {
    url = decodeURI(url);
  } catch (err) {}
  return urlParse(url);
}
function Cookie(options) {
  options = options || {};
  Object.keys(options).forEach(function(prop) {
    if (Cookie.prototype.hasOwnProperty(prop) && Cookie.prototype[prop] !== options[prop] && prop.substr(0, 1) !== '_') {
      this[prop] = options[prop];
    }
  }, this);
  this.creation = this.creation || new Date();
  Object.defineProperty(this, 'creationIndex', {
    configurable: false,
    enumerable: false,
    writable: true,
    value: ++Cookie.cookiesCreated
  });
}
Cookie.cookiesCreated = 0;
Cookie.parse = parse;
Cookie.fromJSON = fromJSON;
Cookie.prototype.key = "";
Cookie.prototype.value = "";
Cookie.prototype.expires = "Infinity";
Cookie.prototype.maxAge = null;
Cookie.prototype.domain = null;
Cookie.prototype.path = null;
Cookie.prototype.secure = false;
Cookie.prototype.httpOnly = false;
Cookie.prototype.extensions = null;
Cookie.prototype.hostOnly = null;
Cookie.prototype.pathIsDefault = null;
Cookie.prototype.creation = null;
Cookie.prototype.lastAccessed = null;
Object.defineProperty(Cookie.prototype, 'creationIndex', {
  configurable: true,
  enumerable: false,
  writable: true,
  value: 0
});
Cookie.serializableProperties = Object.keys(Cookie.prototype).filter(function(prop) {
  return !(Cookie.prototype[prop] instanceof Function || prop === 'creationIndex' || prop.substr(0, 1) === '_');
});
Cookie.prototype.inspect = function inspect() {
  var now = Date.now();
  return 'Cookie="' + this.toString() + '; hostOnly=' + (this.hostOnly != null ? this.hostOnly : '?') + '; aAge=' + (this.lastAccessed ? (now - this.lastAccessed.getTime()) + 'ms' : '?') + '; cAge=' + (this.creation ? (now - this.creation.getTime()) + 'ms' : '?') + '"';
};
Cookie.prototype.toJSON = function() {
  var obj = {};
  var props = Cookie.serializableProperties;
  for (var i = 0; i < props.length; i++) {
    var prop = props[i];
    if (this[prop] === Cookie.prototype[prop]) {
      continue;
    }
    if (prop === 'expires' || prop === 'creation' || prop === 'lastAccessed') {
      if (this[prop] === null) {
        obj[prop] = null;
      } else {
        obj[prop] = this[prop] == "Infinity" ? "Infinity" : this[prop].toISOString();
      }
    } else if (prop === 'maxAge') {
      if (this[prop] !== null) {
        obj[prop] = (this[prop] == Infinity || this[prop] == -Infinity) ? this[prop].toString() : this[prop];
      }
    } else {
      if (this[prop] !== Cookie.prototype[prop]) {
        obj[prop] = this[prop];
      }
    }
  }
  return obj;
};
Cookie.prototype.clone = function() {
  return fromJSON(this.toJSON());
};
Cookie.prototype.validate = function validate() {
  if (!COOKIE_OCTETS.test(this.value)) {
    return false;
  }
  if (this.expires != Infinity && !(this.expires instanceof Date) && !parseDate(this.expires)) {
    return false;
  }
  if (this.maxAge != null && this.maxAge <= 0) {
    return false;
  }
  if (this.path != null && !PATH_VALUE.test(this.path)) {
    return false;
  }
  var cdomain = this.cdomain();
  if (cdomain) {
    if (cdomain.match(/\.$/)) {
      return false;
    }
    var suffix = pubsuffix.getPublicSuffix(cdomain);
    if (suffix == null) {
      return false;
    }
  }
  return true;
};
Cookie.prototype.setExpires = function setExpires(exp) {
  if (exp instanceof Date) {
    this.expires = exp;
  } else {
    this.expires = parseDate(exp) || "Infinity";
  }
};
Cookie.prototype.setMaxAge = function setMaxAge(age) {
  if (age === Infinity || age === -Infinity) {
    this.maxAge = age.toString();
  } else {
    this.maxAge = age;
  }
};
Cookie.prototype.cookieString = function cookieString() {
  var val = this.value;
  if (val == null) {
    val = '';
  }
  if (this.key === '') {
    return val;
  }
  return this.key + '=' + val;
};
Cookie.prototype.toString = function toString() {
  var str = this.cookieString();
  if (this.expires != Infinity) {
    if (this.expires instanceof Date) {
      str += '; Expires=' + formatDate(this.expires);
    } else {
      str += '; Expires=' + this.expires;
    }
  }
  if (this.maxAge != null && this.maxAge != Infinity) {
    str += '; Max-Age=' + this.maxAge;
  }
  if (this.domain && !this.hostOnly) {
    str += '; Domain=' + this.domain;
  }
  if (this.path) {
    str += '; Path=' + this.path;
  }
  if (this.secure) {
    str += '; Secure';
  }
  if (this.httpOnly) {
    str += '; HttpOnly';
  }
  if (this.extensions) {
    this.extensions.forEach(function(ext) {
      str += '; ' + ext;
    });
  }
  return str;
};
Cookie.prototype.TTL = function TTL(now) {
  if (this.maxAge != null) {
    return this.maxAge <= 0 ? 0 : this.maxAge * 1000;
  }
  var expires = this.expires;
  if (expires != Infinity) {
    if (!(expires instanceof Date)) {
      expires = parseDate(expires) || Infinity;
    }
    if (expires == Infinity) {
      return Infinity;
    }
    return expires.getTime() - (now || Date.now());
  }
  return Infinity;
};
Cookie.prototype.expiryTime = function expiryTime(now) {
  if (this.maxAge != null) {
    var relativeTo = now || this.creation || new Date();
    var age = (this.maxAge <= 0) ? -Infinity : this.maxAge * 1000;
    return relativeTo.getTime() + age;
  }
  if (this.expires == Infinity) {
    return Infinity;
  }
  return this.expires.getTime();
};
Cookie.prototype.expiryDate = function expiryDate(now) {
  var millisec = this.expiryTime(now);
  if (millisec == Infinity) {
    return new Date(MAX_TIME);
  } else if (millisec == -Infinity) {
    return new Date(MIN_TIME);
  } else {
    return new Date(millisec);
  }
};
Cookie.prototype.isPersistent = function isPersistent() {
  return (this.maxAge != null || this.expires != Infinity);
};
Cookie.prototype.cdomain = Cookie.prototype.canonicalizedDomain = function canonicalizedDomain() {
  if (this.domain == null) {
    return null;
  }
  return canonicalDomain(this.domain);
};
function CookieJar(store, options) {
  if (typeof options === "boolean") {
    options = {rejectPublicSuffixes: options};
  } else if (options == null) {
    options = {};
  }
  if (options.rejectPublicSuffixes != null) {
    this.rejectPublicSuffixes = options.rejectPublicSuffixes;
  }
  if (options.looseMode != null) {
    this.enableLooseMode = options.looseMode;
  }
  if (!store) {
    store = new MemoryCookieStore();
  }
  this.store = store;
}
CookieJar.prototype.store = null;
CookieJar.prototype.rejectPublicSuffixes = true;
CookieJar.prototype.enableLooseMode = false;
var CAN_BE_SYNC = [];
CAN_BE_SYNC.push('setCookie');
CookieJar.prototype.setCookie = function(cookie, url, options, cb) {
  var err;
  var context = getCookieContext(url);
  if (options instanceof Function) {
    cb = options;
    options = {};
  }
  var host = canonicalDomain(context.hostname);
  var loose = this.enableLooseMode;
  if (options.loose != null) {
    loose = options.loose;
  }
  if (!(cookie instanceof Cookie)) {
    cookie = Cookie.parse(cookie, {loose: loose});
  }
  if (!cookie) {
    err = new Error("Cookie failed to parse");
    return cb(options.ignoreError ? null : err);
  }
  var now = options.now || new Date();
  if (this.rejectPublicSuffixes && cookie.domain) {
    var suffix = pubsuffix.getPublicSuffix(cookie.cdomain());
    if (suffix == null) {
      err = new Error("Cookie has domain set to a public suffix");
      return cb(options.ignoreError ? null : err);
    }
  }
  if (cookie.domain) {
    if (!domainMatch(host, cookie.cdomain(), false)) {
      err = new Error("Cookie not in this host's domain. Cookie:" + cookie.cdomain() + " Request:" + host);
      return cb(options.ignoreError ? null : err);
    }
    if (cookie.hostOnly == null) {
      cookie.hostOnly = false;
    }
  } else {
    cookie.hostOnly = true;
    cookie.domain = host;
  }
  if (!cookie.path || cookie.path[0] !== '/') {
    cookie.path = defaultPath(context.pathname);
    cookie.pathIsDefault = true;
  }
  if (options.http === false && cookie.httpOnly) {
    err = new Error("Cookie is HttpOnly and this isn't an HTTP API");
    return cb(options.ignoreError ? null : err);
  }
  var store = this.store;
  if (!store.updateCookie) {
    store.updateCookie = function(oldCookie, newCookie, cb) {
      this.putCookie(newCookie, cb);
    };
  }
  function withCookie(err, oldCookie) {
    if (err) {
      return cb(err);
    }
    var next = function(err) {
      if (err) {
        return cb(err);
      } else {
        cb(null, cookie);
      }
    };
    if (oldCookie) {
      if (options.http === false && oldCookie.httpOnly) {
        err = new Error("old Cookie is HttpOnly and this isn't an HTTP API");
        return cb(options.ignoreError ? null : err);
      }
      cookie.creation = oldCookie.creation;
      cookie.creationIndex = oldCookie.creationIndex;
      cookie.lastAccessed = now;
      store.updateCookie(oldCookie, cookie, next);
    } else {
      cookie.creation = cookie.lastAccessed = now;
      store.putCookie(cookie, next);
    }
  }
  store.findCookie(cookie.domain, cookie.path, cookie.key, withCookie);
};
CAN_BE_SYNC.push('getCookies');
CookieJar.prototype.getCookies = function(url, options, cb) {
  var context = getCookieContext(url);
  if (options instanceof Function) {
    cb = options;
    options = {};
  }
  var host = canonicalDomain(context.hostname);
  var path = context.pathname || '/';
  var secure = options.secure;
  if (secure == null && context.protocol && (context.protocol == 'https:' || context.protocol == 'wss:')) {
    secure = true;
  }
  var http = options.http;
  if (http == null) {
    http = true;
  }
  var now = options.now || Date.now();
  var expireCheck = options.expire !== false;
  var allPaths = !!options.allPaths;
  var store = this.store;
  function matchingCookie(c) {
    if (c.hostOnly) {
      if (c.domain != host) {
        return false;
      }
    } else {
      if (!domainMatch(host, c.domain, false)) {
        return false;
      }
    }
    if (!allPaths && !pathMatch(path, c.path)) {
      return false;
    }
    if (c.secure && !secure) {
      return false;
    }
    if (c.httpOnly && !http) {
      return false;
    }
    if (expireCheck && c.expiryTime() <= now) {
      store.removeCookie(c.domain, c.path, c.key, function() {});
      return false;
    }
    return true;
  }
  store.findCookies(host, allPaths ? null : path, function(err, cookies) {
    if (err) {
      return cb(err);
    }
    cookies = cookies.filter(matchingCookie);
    if (options.sort !== false) {
      cookies = cookies.sort(cookieCompare);
    }
    var now = new Date();
    cookies.forEach(function(c) {
      c.lastAccessed = now;
    });
    cb(null, cookies);
  });
};
CAN_BE_SYNC.push('getCookieString');
CookieJar.prototype.getCookieString = function() {
  var args = Array.prototype.slice.call(arguments, 0);
  var cb = args.pop();
  var next = function(err, cookies) {
    if (err) {
      cb(err);
    } else {
      cb(null, cookies.sort(cookieCompare).map(function(c) {
        return c.cookieString();
      }).join('; '));
    }
  };
  args.push(next);
  this.getCookies.apply(this, args);
};
CAN_BE_SYNC.push('getSetCookieStrings');
CookieJar.prototype.getSetCookieStrings = function() {
  var args = Array.prototype.slice.call(arguments, 0);
  var cb = args.pop();
  var next = function(err, cookies) {
    if (err) {
      cb(err);
    } else {
      cb(null, cookies.map(function(c) {
        return c.toString();
      }));
    }
  };
  args.push(next);
  this.getCookies.apply(this, args);
};
CAN_BE_SYNC.push('serialize');
CookieJar.prototype.serialize = function(cb) {
  var type = this.store.constructor.name;
  if (type === 'Object') {
    type = null;
  }
  var serialized = {
    version: 'tough-cookie@' + VERSION,
    storeType: type,
    rejectPublicSuffixes: !!this.rejectPublicSuffixes,
    cookies: []
  };
  if (!(this.store.getAllCookies && typeof this.store.getAllCookies === 'function')) {
    return cb(new Error('store does not support getAllCookies and cannot be serialized'));
  }
  this.store.getAllCookies(function(err, cookies) {
    if (err) {
      return cb(err);
    }
    serialized.cookies = cookies.map(function(cookie) {
      cookie = (cookie instanceof Cookie) ? cookie.toJSON() : cookie;
      delete cookie.creationIndex;
      return cookie;
    });
    return cb(null, serialized);
  });
};
CookieJar.prototype.toJSON = function() {
  return this.serializeSync();
};
CAN_BE_SYNC.push('_importCookies');
CookieJar.prototype._importCookies = function(serialized, cb) {
  var jar = this;
  var cookies = serialized.cookies;
  if (!cookies || !Array.isArray(cookies)) {
    return cb(new Error('serialized jar has no cookies array'));
  }
  function putNext(err) {
    if (err) {
      return cb(err);
    }
    if (!cookies.length) {
      return cb(err, jar);
    }
    var cookie;
    try {
      cookie = fromJSON(cookies.shift());
    } catch (e) {
      return cb(e);
    }
    if (cookie === null) {
      return putNext(null);
    }
    jar.store.putCookie(cookie, putNext);
  }
  putNext();
};
CookieJar.deserialize = function(strOrObj, store, cb) {
  if (arguments.length !== 3) {
    cb = store;
    store = null;
  }
  var serialized;
  if (typeof strOrObj === 'string') {
    serialized = jsonParse(strOrObj);
    if (serialized instanceof Error) {
      return cb(serialized);
    }
  } else {
    serialized = strOrObj;
  }
  var jar = new CookieJar(store, serialized.rejectPublicSuffixes);
  jar._importCookies(serialized, function(err) {
    if (err) {
      return cb(err);
    }
    cb(null, jar);
  });
};
CookieJar.deserializeSync = function(strOrObj, store) {
  var serialized = typeof strOrObj === 'string' ? JSON.parse(strOrObj) : strOrObj;
  var jar = new CookieJar(store, serialized.rejectPublicSuffixes);
  if (!jar.store.synchronous) {
    throw new Error('CookieJar store is not synchronous; use async API instead.');
  }
  jar._importCookiesSync(serialized);
  return jar;
};
CookieJar.fromJSON = CookieJar.deserializeSync;
CAN_BE_SYNC.push('clone');
CookieJar.prototype.clone = function(newStore, cb) {
  if (arguments.length === 1) {
    cb = newStore;
    newStore = null;
  }
  this.serialize(function(err, serialized) {
    if (err) {
      return cb(err);
    }
    CookieJar.deserialize(newStore, serialized, cb);
  });
};
function syncWrap(method) {
  return function() {
    if (!this.store.synchronous) {
      throw new Error('CookieJar store is not synchronous; use async API instead.');
    }
    var args = Array.prototype.slice.call(arguments);
    var syncErr,
        syncResult;
    args.push(function syncCb(err, result) {
      syncErr = err;
      syncResult = result;
    });
    this[method].apply(this, args);
    if (syncErr) {
      throw syncErr;
    }
    return syncResult;
  };
}
CAN_BE_SYNC.forEach(function(method) {
  CookieJar.prototype[method + 'Sync'] = syncWrap(method);
});
module.exports = {
  CookieJar: CookieJar,
  Cookie: Cookie,
  Store: Store,
  MemoryCookieStore: MemoryCookieStore,
  parseDate: parseDate,
  formatDate: formatDate,
  parse: parse,
  fromJSON: fromJSON,
  domainMatch: domainMatch,
  defaultPath: defaultPath,
  pathMatch: pathMatch,
  getPublicSuffix: pubsuffix.getPublicSuffix,
  cookieCompare: cookieCompare,
  permuteDomain: require('./permuteDomain').permuteDomain,
  permutePath: permutePath,
  canonicalDomain: canonicalDomain
};
