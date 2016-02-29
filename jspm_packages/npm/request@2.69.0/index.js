/* */ 
'use strict';
var extend = require('extend'),
    cookies = require('./lib/cookies'),
    helpers = require('./lib/helpers');
var isFunction = helpers.isFunction,
    paramsHaveRequestBody = helpers.paramsHaveRequestBody;
function initParams(uri, options, callback) {
  if (typeof options === 'function') {
    callback = options;
  }
  var params = {};
  if (typeof options === 'object') {
    extend(params, options, {uri: uri});
  } else if (typeof uri === 'string') {
    extend(params, {uri: uri});
  } else {
    extend(params, uri);
  }
  params.callback = callback;
  return params;
}
function request(uri, options, callback) {
  if (typeof uri === 'undefined') {
    throw new Error('undefined is not a valid uri or options object.');
  }
  var params = initParams(uri, options, callback);
  if (params.method === 'HEAD' && paramsHaveRequestBody(params)) {
    throw new Error('HTTP HEAD requests MUST NOT include a request body.');
  }
  return new request.Request(params);
}
function verbFunc(verb) {
  var method = verb === 'del' ? 'DELETE' : verb.toUpperCase();
  return function(uri, options, callback) {
    var params = initParams(uri, options, callback);
    params.method = method;
    return request(params, params.callback);
  };
}
request.get = verbFunc('get');
request.head = verbFunc('head');
request.post = verbFunc('post');
request.put = verbFunc('put');
request.patch = verbFunc('patch');
request.del = verbFunc('del');
request.jar = function(store) {
  return cookies.jar(store);
};
request.cookie = function(str) {
  return cookies.parse(str);
};
function wrapRequestMethod(method, options, requester, verb) {
  return function(uri, opts, callback) {
    var params = initParams(uri, opts, callback);
    var target = {};
    extend(true, target, options, params);
    target.pool = params.pool || options.pool;
    if (verb) {
      target.method = (verb === 'del' ? 'DELETE' : verb.toUpperCase());
    }
    if (isFunction(requester)) {
      method = requester;
    }
    return method(target, target.callback);
  };
}
request.defaults = function(options, requester) {
  var self = this;
  options = options || {};
  if (typeof options === 'function') {
    requester = options;
    options = {};
  }
  var defaults = wrapRequestMethod(self, options, requester);
  var verbs = ['get', 'head', 'post', 'put', 'patch', 'del'];
  verbs.forEach(function(verb) {
    defaults[verb] = wrapRequestMethod(self[verb], options, requester, verb);
  });
  defaults.cookie = wrapRequestMethod(self.cookie, options, requester);
  defaults.jar = self.jar;
  defaults.defaults = self.defaults;
  return defaults;
};
request.forever = function(agentOptions, optionsArg) {
  var options = {};
  if (optionsArg) {
    extend(options, optionsArg);
  }
  if (agentOptions) {
    options.agentOptions = agentOptions;
  }
  options.forever = true;
  return request.defaults(options);
};
module.exports = request;
request.Request = require('./request');
request.initParams = initParams;
Object.defineProperty(request, 'debug', {
  enumerable: true,
  get: function() {
    return request.Request.debug;
  },
  set: function(debug) {
    request.Request.debug = debug;
  }
});
