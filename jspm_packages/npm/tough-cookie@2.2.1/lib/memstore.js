/* */ 
'use strict';
var Store = require('./store').Store;
var permuteDomain = require('./permuteDomain').permuteDomain;
var pathMatch = require('./pathMatch').pathMatch;
var util = require('util');
function MemoryCookieStore() {
  Store.call(this);
  this.idx = {};
}
util.inherits(MemoryCookieStore, Store);
exports.MemoryCookieStore = MemoryCookieStore;
MemoryCookieStore.prototype.idx = null;
MemoryCookieStore.prototype.synchronous = true;
MemoryCookieStore.prototype.inspect = function() {
  return "{ idx: " + util.inspect(this.idx, false, 2) + ' }';
};
MemoryCookieStore.prototype.findCookie = function(domain, path, key, cb) {
  if (!this.idx[domain]) {
    return cb(null, undefined);
  }
  if (!this.idx[domain][path]) {
    return cb(null, undefined);
  }
  return cb(null, this.idx[domain][path][key] || null);
};
MemoryCookieStore.prototype.findCookies = function(domain, path, cb) {
  var results = [];
  if (!domain) {
    return cb(null, []);
  }
  var pathMatcher;
  if (!path) {
    pathMatcher = function matchAll(domainIndex) {
      for (var curPath in domainIndex) {
        var pathIndex = domainIndex[curPath];
        for (var key in pathIndex) {
          results.push(pathIndex[key]);
        }
      }
    };
  } else {
    pathMatcher = function matchRFC(domainIndex) {
      Object.keys(domainIndex).forEach(function(cookiePath) {
        if (pathMatch(path, cookiePath)) {
          var pathIndex = domainIndex[cookiePath];
          for (var key in pathIndex) {
            results.push(pathIndex[key]);
          }
        }
      });
    };
  }
  var domains = permuteDomain(domain) || [domain];
  var idx = this.idx;
  domains.forEach(function(curDomain) {
    var domainIndex = idx[curDomain];
    if (!domainIndex) {
      return;
    }
    pathMatcher(domainIndex);
  });
  cb(null, results);
};
MemoryCookieStore.prototype.putCookie = function(cookie, cb) {
  if (!this.idx[cookie.domain]) {
    this.idx[cookie.domain] = {};
  }
  if (!this.idx[cookie.domain][cookie.path]) {
    this.idx[cookie.domain][cookie.path] = {};
  }
  this.idx[cookie.domain][cookie.path][cookie.key] = cookie;
  cb(null);
};
MemoryCookieStore.prototype.updateCookie = function(oldCookie, newCookie, cb) {
  this.putCookie(newCookie, cb);
};
MemoryCookieStore.prototype.removeCookie = function(domain, path, key, cb) {
  if (this.idx[domain] && this.idx[domain][path] && this.idx[domain][path][key]) {
    delete this.idx[domain][path][key];
  }
  cb(null);
};
MemoryCookieStore.prototype.removeCookies = function(domain, path, cb) {
  if (this.idx[domain]) {
    if (path) {
      delete this.idx[domain][path];
    } else {
      delete this.idx[domain];
    }
  }
  return cb(null);
};
MemoryCookieStore.prototype.getAllCookies = function(cb) {
  var cookies = [];
  var idx = this.idx;
  var domains = Object.keys(idx);
  domains.forEach(function(domain) {
    var paths = Object.keys(idx[domain]);
    paths.forEach(function(path) {
      var keys = Object.keys(idx[domain][path]);
      keys.forEach(function(key) {
        if (key !== null) {
          cookies.push(idx[domain][path][key]);
        }
      });
    });
  });
  cookies.sort(function(a, b) {
    return (a.creationIndex || 0) - (b.creationIndex || 0);
  });
  cb(null, cookies);
};
