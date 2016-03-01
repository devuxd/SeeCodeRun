/* */ 
(function(process) {
  'use strict';
  function formatHostname(hostname) {
    return hostname.replace(/^\.*/, '.').toLowerCase();
  }
  function parseNoProxyZone(zone) {
    zone = zone.trim().toLowerCase();
    var zoneParts = zone.split(':', 2),
        zoneHost = formatHostname(zoneParts[0]),
        zonePort = zoneParts[1],
        hasPort = zone.indexOf(':') > -1;
    return {
      hostname: zoneHost,
      port: zonePort,
      hasPort: hasPort
    };
  }
  function uriInNoProxy(uri, noProxy) {
    var port = uri.port || (uri.protocol === 'https:' ? '443' : '80'),
        hostname = formatHostname(uri.hostname),
        noProxyList = noProxy.split(',');
    return noProxyList.map(parseNoProxyZone).some(function(noProxyZone) {
      var isMatchedAt = hostname.indexOf(noProxyZone.hostname),
          hostnameMatched = (isMatchedAt > -1 && (isMatchedAt === hostname.length - noProxyZone.hostname.length));
      if (noProxyZone.hasPort) {
        return (port === noProxyZone.port) && hostnameMatched;
      }
      return hostnameMatched;
    });
  }
  function getProxyFromURI(uri) {
    var noProxy = process.env.NO_PROXY || process.env.no_proxy || '';
    if (noProxy === '*') {
      return null;
    }
    if (noProxy !== '' && uriInNoProxy(uri, noProxy)) {
      return null;
    }
    if (uri.protocol === 'http:') {
      return process.env.HTTP_PROXY || process.env.http_proxy || null;
    }
    if (uri.protocol === 'https:') {
      return process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || null;
    }
    return null;
  }
  module.exports = getProxyFromURI;
})(require('process'));
