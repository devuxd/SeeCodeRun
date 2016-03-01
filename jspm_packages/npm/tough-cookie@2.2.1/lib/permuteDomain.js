/* */ 
"use strict";
var pubsuffix = require('./pubsuffix');
function permuteDomain(domain) {
  var pubSuf = pubsuffix.getPublicSuffix(domain);
  if (!pubSuf) {
    return null;
  }
  if (pubSuf == domain) {
    return [domain];
  }
  var prefix = domain.slice(0, -(pubSuf.length + 1));
  var parts = prefix.split('.').reverse();
  var cur = pubSuf;
  var permutations = [cur];
  while (parts.length) {
    cur = parts.shift() + '.' + cur;
    permutations.push(cur);
  }
  return permutations;
}
exports.permuteDomain = permuteDomain;
