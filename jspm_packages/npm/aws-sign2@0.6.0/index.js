/* */ 
var crypto = require('crypto'),
    parse = require('url').parse;
;
var keys = ['acl', 'location', 'logging', 'notification', 'partNumber', 'policy', 'requestPayment', 'torrent', 'uploadId', 'uploads', 'versionId', 'versioning', 'versions', 'website'];
function authorization(options) {
  return 'AWS ' + options.key + ':' + sign(options);
}
module.exports = authorization;
module.exports.authorization = authorization;
function hmacSha1(options) {
  return crypto.createHmac('sha1', options.secret).update(options.message).digest('base64');
}
module.exports.hmacSha1 = hmacSha1;
function sign(options) {
  options.message = stringToSign(options);
  return hmacSha1(options);
}
module.exports.sign = sign;
function signQuery(options) {
  options.message = queryStringToSign(options);
  return hmacSha1(options);
}
module.exports.signQuery = signQuery;
function stringToSign(options) {
  var headers = options.amazonHeaders || '';
  if (headers)
    headers += '\n';
  var r = [options.verb, options.md5, options.contentType, options.date ? options.date.toUTCString() : '', headers + options.resource];
  return r.join('\n');
}
module.exports.queryStringToSign = stringToSign;
function queryStringToSign(options) {
  return 'GET\n\n\n' + options.date + '\n' + options.resource;
}
module.exports.queryStringToSign = queryStringToSign;
function canonicalizeHeaders(headers) {
  var buf = [],
      fields = Object.keys(headers);
  ;
  for (var i = 0,
      len = fields.length; i < len; ++i) {
    var field = fields[i],
        val = headers[field],
        field = field.toLowerCase();
    ;
    if (0 !== field.indexOf('x-amz'))
      continue;
    buf.push(field + ':' + val);
  }
  return buf.sort().join('\n');
}
module.exports.canonicalizeHeaders = canonicalizeHeaders;
function canonicalizeResource(resource) {
  var url = parse(resource, true),
      path = url.pathname,
      buf = [];
  ;
  Object.keys(url.query).forEach(function(key) {
    if (!~keys.indexOf(key))
      return;
    var val = '' == url.query[key] ? '' : '=' + encodeURIComponent(url.query[key]);
    buf.push(key + val);
  });
  return path + (buf.length ? '?' + buf.sort().join('&') : '');
}
module.exports.canonicalizeResource = canonicalizeResource;
