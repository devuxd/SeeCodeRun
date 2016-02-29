/* */ 
var crypto = require('crypto'),
    qs = require('querystring');
;
function sha1(key, body) {
  return crypto.createHmac('sha1', key).update(body).digest('base64');
}
function rsa(key, body) {
  return crypto.createSign("RSA-SHA1").update(body).sign(key, 'base64');
}
function rfc3986(str) {
  return encodeURIComponent(str).replace(/!/g, '%21').replace(/\*/g, '%2A').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/'/g, '%27');
  ;
}
function map(obj) {
  var key,
      val,
      arr = [];
  for (key in obj) {
    val = obj[key];
    if (Array.isArray(val))
      for (var i = 0; i < val.length; i++)
        arr.push([key, val[i]]);
    else if (typeof val === "object")
      for (var prop in val)
        arr.push([key + '[' + prop + ']', val[prop]]);
    else
      arr.push([key, val]);
  }
  return arr;
}
function compare(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
}
function generateBase(httpMethod, base_uri, params) {
  var normalized = map(params).map(function(p) {
    return [rfc3986(p[0]), rfc3986(p[1] || '')];
  }).sort(function(a, b) {
    return compare(a[0], b[0]) || compare(a[1], b[1]);
  }).map(function(p) {
    return p.join('=');
  }).join('&');
  var base = [rfc3986(httpMethod ? httpMethod.toUpperCase() : 'GET'), rfc3986(base_uri), rfc3986(normalized)].join('&');
  return base;
}
function hmacsign(httpMethod, base_uri, params, consumer_secret, token_secret) {
  var base = generateBase(httpMethod, base_uri, params);
  var key = [consumer_secret || '', token_secret || ''].map(rfc3986).join('&');
  return sha1(key, base);
}
function rsasign(httpMethod, base_uri, params, private_key, token_secret) {
  var base = generateBase(httpMethod, base_uri, params);
  var key = private_key || '';
  return rsa(key, base);
}
function plaintext(consumer_secret, token_secret) {
  var key = [consumer_secret || '', token_secret || ''].map(rfc3986).join('&');
  return key;
}
function sign(signMethod, httpMethod, base_uri, params, consumer_secret, token_secret) {
  var method;
  var skipArgs = 1;
  switch (signMethod) {
    case 'RSA-SHA1':
      method = rsasign;
      break;
    case 'HMAC-SHA1':
      method = hmacsign;
      break;
    case 'PLAINTEXT':
      method = plaintext;
      skipArgs = 4;
      break;
    default:
      throw new Error("Signature method not supported: " + signMethod);
  }
  return method.apply(null, [].slice.call(arguments, skipArgs));
}
exports.hmacsign = hmacsign;
exports.rsasign = rsasign;
exports.plaintext = plaintext;
exports.sign = sign;
exports.rfc3986 = rfc3986;
exports.generateBase = generateBase;
