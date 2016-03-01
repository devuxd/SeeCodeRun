/* */ 
(function(Buffer, process) {
  'use strict';
  var http = require('http'),
      https = require('https'),
      url = require('url'),
      util = require('util'),
      stream = require('stream'),
      zlib = require('zlib'),
      bl = require('bl'),
      hawk = require('hawk'),
      aws2 = require('aws-sign2'),
      httpSignature = require('http-signature'),
      mime = require('mime-types'),
      stringstream = require('stringstream'),
      caseless = require('caseless'),
      ForeverAgent = require('forever-agent'),
      FormData = require('form-data'),
      extend = require('extend'),
      isTypedArray = require('is-typedarray').strict,
      helpers = require('./lib/helpers'),
      cookies = require('./lib/cookies'),
      getProxyFromURI = require('./lib/getProxyFromURI'),
      Querystring = require('./lib/querystring').Querystring,
      Har = require('./lib/har').Har,
      Auth = require('./lib/auth').Auth,
      OAuth = require('./lib/oauth').OAuth,
      Multipart = require('./lib/multipart').Multipart,
      Redirect = require('./lib/redirect').Redirect,
      Tunnel = require('./lib/tunnel').Tunnel;
  var safeStringify = helpers.safeStringify,
      isReadStream = helpers.isReadStream,
      toBase64 = helpers.toBase64,
      defer = helpers.defer,
      copy = helpers.copy,
      version = helpers.version,
      globalCookieJar = cookies.jar();
  var globalPool = {};
  function filterForNonReserved(reserved, options) {
    var object = {};
    for (var i in options) {
      var notReserved = (reserved.indexOf(i) === -1);
      if (notReserved) {
        object[i] = options[i];
      }
    }
    return object;
  }
  function filterOutReservedFunctions(reserved, options) {
    var object = {};
    for (var i in options) {
      var isReserved = !(reserved.indexOf(i) === -1);
      var isFunction = (typeof options[i] === 'function');
      if (!(isReserved && isFunction)) {
        object[i] = options[i];
      }
    }
    return object;
  }
  function connectionErrorHandler(error) {
    var socket = this;
    if (socket.res) {
      if (socket.res.request) {
        socket.res.request.emit('error', error);
      } else {
        socket.res.emit('error', error);
      }
    } else {
      socket._httpMessage.emit('error', error);
    }
  }
  function requestToJSON() {
    var self = this;
    return {
      uri: self.uri,
      method: self.method,
      headers: self.headers
    };
  }
  function responseToJSON() {
    var self = this;
    return {
      statusCode: self.statusCode,
      body: self.body,
      headers: self.headers,
      request: requestToJSON.call(self.request)
    };
  }
  function Request(options) {
    var self = this;
    if (options.har) {
      self._har = new Har(self);
      options = self._har.options(options);
    }
    stream.Stream.call(self);
    var reserved = Object.keys(Request.prototype);
    var nonReserved = filterForNonReserved(reserved, options);
    extend(self, nonReserved);
    options = filterOutReservedFunctions(reserved, options);
    self.readable = true;
    self.writable = true;
    if (options.method) {
      self.explicitMethod = true;
    }
    self._qs = new Querystring(self);
    self._auth = new Auth(self);
    self._oauth = new OAuth(self);
    self._multipart = new Multipart(self);
    self._redirect = new Redirect(self);
    self._tunnel = new Tunnel(self);
    self.init(options);
  }
  util.inherits(Request, stream.Stream);
  Request.debug = process.env.NODE_DEBUG && /\brequest\b/.test(process.env.NODE_DEBUG);
  function debug() {
    if (Request.debug) {
      console.error('REQUEST %s', util.format.apply(util, arguments));
    }
  }
  Request.prototype.debug = debug;
  Request.prototype.init = function(options) {
    var self = this;
    if (!options) {
      options = {};
    }
    self.headers = self.headers ? copy(self.headers) : {};
    for (var headerName in self.headers) {
      if (typeof self.headers[headerName] === 'undefined') {
        delete self.headers[headerName];
      }
    }
    caseless.httpify(self, self.headers);
    if (!self.method) {
      self.method = options.method || 'GET';
    }
    if (!self.localAddress) {
      self.localAddress = options.localAddress;
    }
    self._qs.init(options);
    debug(options);
    if (!self.pool && self.pool !== false) {
      self.pool = globalPool;
    }
    self.dests = self.dests || [];
    self.__isRequestRequest = true;
    if (!self._callback && self.callback) {
      self._callback = self.callback;
      self.callback = function() {
        if (self._callbackCalled) {
          return;
        }
        self._callbackCalled = true;
        self._callback.apply(self, arguments);
      };
      self.on('error', self.callback.bind());
      self.on('complete', self.callback.bind(self, null));
    }
    if (!self.uri && self.url) {
      self.uri = self.url;
      delete self.url;
    }
    if (self.baseUrl) {
      if (typeof self.baseUrl !== 'string') {
        return self.emit('error', new Error('options.baseUrl must be a string'));
      }
      if (typeof self.uri !== 'string') {
        return self.emit('error', new Error('options.uri must be a string when using options.baseUrl'));
      }
      if (self.uri.indexOf('//') === 0 || self.uri.indexOf('://') !== -1) {
        return self.emit('error', new Error('options.uri must be a path when using options.baseUrl'));
      }
      var baseUrlEndsWithSlash = self.baseUrl.lastIndexOf('/') === self.baseUrl.length - 1;
      var uriStartsWithSlash = self.uri.indexOf('/') === 0;
      if (baseUrlEndsWithSlash && uriStartsWithSlash) {
        self.uri = self.baseUrl + self.uri.slice(1);
      } else if (baseUrlEndsWithSlash || uriStartsWithSlash) {
        self.uri = self.baseUrl + self.uri;
      } else if (self.uri === '') {
        self.uri = self.baseUrl;
      } else {
        self.uri = self.baseUrl + '/' + self.uri;
      }
      delete self.baseUrl;
    }
    if (!self.uri) {
      return self.emit('error', new Error('options.uri is a required argument'));
    }
    if (typeof self.uri === 'string') {
      self.uri = url.parse(self.uri);
    }
    if (!self.uri.href) {
      self.uri.href = url.format(self.uri);
    }
    if (self.uri.protocol === 'unix:') {
      return self.emit('error', new Error('`unix://` URL scheme is no longer supported. Please use the format `http://unix:SOCKET:PATH`'));
    }
    if (self.uri.host === 'unix') {
      self.enableUnixSocket();
    }
    if (self.strictSSL === false) {
      self.rejectUnauthorized = false;
    }
    if (!self.uri.pathname) {
      self.uri.pathname = '/';
    }
    if (!(self.uri.host || (self.uri.hostname && self.uri.port)) && !self.uri.isUnix) {
      var faultyUri = url.format(self.uri);
      var message = 'Invalid URI "' + faultyUri + '"';
      if (Object.keys(options).length === 0) {
        message += '. This can be caused by a crappy redirection.';
      }
      self.abort();
      return self.emit('error', new Error(message));
    }
    if (!self.hasOwnProperty('proxy')) {
      self.proxy = getProxyFromURI(self.uri);
    }
    self.tunnel = self._tunnel.isEnabled();
    if (self.proxy) {
      self._tunnel.setup(options);
    }
    self._redirect.onRequest(options);
    self.setHost = false;
    if (!self.hasHeader('host')) {
      var hostHeaderName = self.originalHostHeaderName || 'host';
      self.setHeader(hostHeaderName, self.uri.hostname);
      if (self.uri.port) {
        if (!(self.uri.port === 80 && self.uri.protocol === 'http:') && !(self.uri.port === 443 && self.uri.protocol === 'https:')) {
          self.setHeader(hostHeaderName, self.getHeader('host') + (':' + self.uri.port));
        }
      }
      self.setHost = true;
    }
    self.jar(self._jar || options.jar);
    if (!self.uri.port) {
      if (self.uri.protocol === 'http:') {
        self.uri.port = 80;
      } else if (self.uri.protocol === 'https:') {
        self.uri.port = 443;
      }
    }
    if (self.proxy && !self.tunnel) {
      self.port = self.proxy.port;
      self.host = self.proxy.hostname;
    } else {
      self.port = self.uri.port;
      self.host = self.uri.hostname;
    }
    if (options.form) {
      self.form(options.form);
    }
    if (options.formData) {
      var formData = options.formData;
      var requestForm = self.form();
      var appendFormValue = function(key, value) {
        if (value.hasOwnProperty('value') && value.hasOwnProperty('options')) {
          requestForm.append(key, value.value, value.options);
        } else {
          requestForm.append(key, value);
        }
      };
      for (var formKey in formData) {
        if (formData.hasOwnProperty(formKey)) {
          var formValue = formData[formKey];
          if (formValue instanceof Array) {
            for (var j = 0; j < formValue.length; j++) {
              appendFormValue(formKey, formValue[j]);
            }
          } else {
            appendFormValue(formKey, formValue);
          }
        }
      }
    }
    if (options.qs) {
      self.qs(options.qs);
    }
    if (self.uri.path) {
      self.path = self.uri.path;
    } else {
      self.path = self.uri.pathname + (self.uri.search || '');
    }
    if (self.path.length === 0) {
      self.path = '/';
    }
    if (options.aws) {
      self.aws(options.aws);
    }
    if (options.hawk) {
      self.hawk(options.hawk);
    }
    if (options.httpSignature) {
      self.httpSignature(options.httpSignature);
    }
    if (options.auth) {
      if (Object.prototype.hasOwnProperty.call(options.auth, 'username')) {
        options.auth.user = options.auth.username;
      }
      if (Object.prototype.hasOwnProperty.call(options.auth, 'password')) {
        options.auth.pass = options.auth.password;
      }
      self.auth(options.auth.user, options.auth.pass, options.auth.sendImmediately, options.auth.bearer);
    }
    if (self.gzip && !self.hasHeader('accept-encoding')) {
      self.setHeader('accept-encoding', 'gzip');
    }
    if (self.uri.auth && !self.hasHeader('authorization')) {
      var uriAuthPieces = self.uri.auth.split(':').map(function(item) {
        return self._qs.unescape(item);
      });
      self.auth(uriAuthPieces[0], uriAuthPieces.slice(1).join(':'), true);
    }
    if (!self.tunnel && self.proxy && self.proxy.auth && !self.hasHeader('proxy-authorization')) {
      var proxyAuthPieces = self.proxy.auth.split(':').map(function(item) {
        return self._qs.unescape(item);
      });
      var authHeader = 'Basic ' + toBase64(proxyAuthPieces.join(':'));
      self.setHeader('proxy-authorization', authHeader);
    }
    if (self.proxy && !self.tunnel) {
      self.path = (self.uri.protocol + '//' + self.uri.host + self.path);
    }
    if (options.json) {
      self.json(options.json);
    }
    if (options.multipart) {
      self.multipart(options.multipart);
    }
    if (options.time) {
      self.timing = true;
      self.elapsedTime = self.elapsedTime || 0;
    }
    function setContentLength() {
      if (isTypedArray(self.body)) {
        self.body = new Buffer(self.body);
      }
      if (!self.hasHeader('content-length')) {
        var length;
        if (typeof self.body === 'string') {
          length = Buffer.byteLength(self.body);
        } else if (Array.isArray(self.body)) {
          length = self.body.reduce(function(a, b) {
            return a + b.length;
          }, 0);
        } else {
          length = self.body.length;
        }
        if (length) {
          self.setHeader('content-length', length);
        } else {
          self.emit('error', new Error('Argument error, options.body.'));
        }
      }
    }
    if (self.body) {
      setContentLength();
    }
    if (options.oauth) {
      self.oauth(options.oauth);
    } else if (self._oauth.params && self.hasHeader('authorization')) {
      self.oauth(self._oauth.params);
    }
    var protocol = self.proxy && !self.tunnel ? self.proxy.protocol : self.uri.protocol,
        defaultModules = {
          'http:': http,
          'https:': https
        },
        httpModules = self.httpModules || {};
    self.httpModule = httpModules[protocol] || defaultModules[protocol];
    if (!self.httpModule) {
      return self.emit('error', new Error('Invalid protocol: ' + protocol));
    }
    if (options.ca) {
      self.ca = options.ca;
    }
    if (!self.agent) {
      if (options.agentOptions) {
        self.agentOptions = options.agentOptions;
      }
      if (options.agentClass) {
        self.agentClass = options.agentClass;
      } else if (options.forever) {
        var v = version();
        if (v.major === 0 && v.minor <= 10) {
          self.agentClass = protocol === 'http:' ? ForeverAgent : ForeverAgent.SSL;
        } else {
          self.agentClass = self.httpModule.Agent;
          self.agentOptions = self.agentOptions || {};
          self.agentOptions.keepAlive = true;
        }
      } else {
        self.agentClass = self.httpModule.Agent;
      }
    }
    if (self.pool === false) {
      self.agent = false;
    } else {
      self.agent = self.agent || self.getNewAgent();
    }
    self.on('pipe', function(src) {
      if (self.ntick && self._started) {
        self.emit('error', new Error('You cannot pipe to this stream after the outbound request has started.'));
      }
      self.src = src;
      if (isReadStream(src)) {
        if (!self.hasHeader('content-type')) {
          self.setHeader('content-type', mime.lookup(src.path));
        }
      } else {
        if (src.headers) {
          for (var i in src.headers) {
            if (!self.hasHeader(i)) {
              self.setHeader(i, src.headers[i]);
            }
          }
        }
        if (self._json && !self.hasHeader('content-type')) {
          self.setHeader('content-type', 'application/json');
        }
        if (src.method && !self.explicitMethod) {
          self.method = src.method;
        }
      }
    });
    defer(function() {
      if (self._aborted) {
        return;
      }
      var end = function() {
        if (self._form) {
          if (!self._auth.hasAuth) {
            self._form.pipe(self);
          } else if (self._auth.hasAuth && self._auth.sentAuth) {
            self._form.pipe(self);
          }
        }
        if (self._multipart && self._multipart.chunked) {
          self._multipart.body.pipe(self);
        }
        if (self.body) {
          setContentLength();
          if (Array.isArray(self.body)) {
            self.body.forEach(function(part) {
              self.write(part);
            });
          } else {
            self.write(self.body);
          }
          self.end();
        } else if (self.requestBodyStream) {
          console.warn('options.requestBodyStream is deprecated, please pass the request object to stream.pipe.');
          self.requestBodyStream.pipe(self);
        } else if (!self.src) {
          if (self._auth.hasAuth && !self._auth.sentAuth) {
            self.end();
            return;
          }
          if (self.method !== 'GET' && typeof self.method !== 'undefined') {
            self.setHeader('content-length', 0);
          }
          self.end();
        }
      };
      if (self._form && !self.hasHeader('content-length')) {
        self.setHeader(self._form.getHeaders(), true);
        self._form.getLength(function(err, length) {
          if (!err && !isNaN(length)) {
            self.setHeader('content-length', length);
          }
          end();
        });
      } else {
        end();
      }
      self.ntick = true;
    });
  };
  Request.prototype.getNewAgent = function() {
    var self = this;
    var Agent = self.agentClass;
    var options = {};
    if (self.agentOptions) {
      for (var i in self.agentOptions) {
        options[i] = self.agentOptions[i];
      }
    }
    if (self.ca) {
      options.ca = self.ca;
    }
    if (self.ciphers) {
      options.ciphers = self.ciphers;
    }
    if (self.secureProtocol) {
      options.secureProtocol = self.secureProtocol;
    }
    if (self.secureOptions) {
      options.secureOptions = self.secureOptions;
    }
    if (typeof self.rejectUnauthorized !== 'undefined') {
      options.rejectUnauthorized = self.rejectUnauthorized;
    }
    if (self.cert && self.key) {
      options.key = self.key;
      options.cert = self.cert;
    }
    if (self.pfx) {
      options.pfx = self.pfx;
    }
    if (self.passphrase) {
      options.passphrase = self.passphrase;
    }
    var poolKey = '';
    if (Agent !== self.httpModule.Agent) {
      poolKey += Agent.name;
    }
    var proxy = self.proxy;
    if (typeof proxy === 'string') {
      proxy = url.parse(proxy);
    }
    var isHttps = (proxy && proxy.protocol === 'https:') || this.uri.protocol === 'https:';
    if (isHttps) {
      if (options.ca) {
        if (poolKey) {
          poolKey += ':';
        }
        poolKey += options.ca;
      }
      if (typeof options.rejectUnauthorized !== 'undefined') {
        if (poolKey) {
          poolKey += ':';
        }
        poolKey += options.rejectUnauthorized;
      }
      if (options.cert) {
        if (poolKey) {
          poolKey += ':';
        }
        poolKey += options.cert.toString('ascii') + options.key.toString('ascii');
      }
      if (options.pfx) {
        if (poolKey) {
          poolKey += ':';
        }
        poolKey += options.pfx.toString('ascii');
      }
      if (options.ciphers) {
        if (poolKey) {
          poolKey += ':';
        }
        poolKey += options.ciphers;
      }
      if (options.secureProtocol) {
        if (poolKey) {
          poolKey += ':';
        }
        poolKey += options.secureProtocol;
      }
      if (options.secureOptions) {
        if (poolKey) {
          poolKey += ':';
        }
        poolKey += options.secureOptions;
      }
    }
    if (self.pool === globalPool && !poolKey && Object.keys(options).length === 0 && self.httpModule.globalAgent) {
      return self.httpModule.globalAgent;
    }
    poolKey = self.uri.protocol + poolKey;
    if (!self.pool[poolKey]) {
      self.pool[poolKey] = new Agent(options);
      if (self.pool.maxSockets) {
        self.pool[poolKey].maxSockets = self.pool.maxSockets;
      }
    }
    return self.pool[poolKey];
  };
  Request.prototype.start = function() {
    var self = this;
    if (self._aborted) {
      return;
    }
    self._started = true;
    self.method = self.method || 'GET';
    self.href = self.uri.href;
    if (self.src && self.src.stat && self.src.stat.size && !self.hasHeader('content-length')) {
      self.setHeader('content-length', self.src.stat.size);
    }
    if (self._aws) {
      self.aws(self._aws, true);
    }
    var reqOptions = copy(self);
    delete reqOptions.auth;
    debug('make request', self.uri.href);
    self.req = self.httpModule.request(reqOptions);
    if (self.timing) {
      self.startTime = new Date().getTime();
    }
    if (self.timeout && !self.timeoutTimer) {
      var timeout = self.timeout < 0 ? 0 : self.timeout;
      self.timeoutTimer = setTimeout(function() {
        var connectTimeout = self.req.socket && self.req.socket.readable === false;
        self.abort();
        var e = new Error('ETIMEDOUT');
        e.code = 'ETIMEDOUT';
        e.connect = connectTimeout;
        self.emit('error', e);
      }, timeout);
      if (self.req.setTimeout) {
        self.req.setTimeout(timeout, function() {
          if (self.req) {
            self.req.abort();
            var e = new Error('ESOCKETTIMEDOUT');
            e.code = 'ESOCKETTIMEDOUT';
            e.connect = false;
            self.emit('error', e);
          }
        });
      }
    }
    self.req.on('response', self.onRequestResponse.bind(self));
    self.req.on('error', self.onRequestError.bind(self));
    self.req.on('drain', function() {
      self.emit('drain');
    });
    self.req.on('socket', function(socket) {
      self.emit('socket', socket);
    });
    self.on('end', function() {
      if (self.req.connection) {
        self.req.connection.removeListener('error', connectionErrorHandler);
      }
    });
    self.emit('request', self.req);
  };
  Request.prototype.onRequestError = function(error) {
    var self = this;
    if (self._aborted) {
      return;
    }
    if (self.req && self.req._reusedSocket && error.code === 'ECONNRESET' && self.agent.addRequestNoreuse) {
      self.agent = {addRequest: self.agent.addRequestNoreuse.bind(self.agent)};
      self.start();
      self.req.end();
      return;
    }
    if (self.timeout && self.timeoutTimer) {
      clearTimeout(self.timeoutTimer);
      self.timeoutTimer = null;
    }
    self.emit('error', error);
  };
  Request.prototype.onRequestResponse = function(response) {
    var self = this;
    debug('onRequestResponse', self.uri.href, response.statusCode, response.headers);
    response.on('end', function() {
      if (self.timing) {
        self.elapsedTime += (new Date().getTime() - self.startTime);
        debug('elapsed time', self.elapsedTime);
        response.elapsedTime = self.elapsedTime;
      }
      debug('response end', self.uri.href, response.statusCode, response.headers);
    });
    if (response.connection && response.connection.listeners('error').indexOf(connectionErrorHandler) === -1) {
      response.connection.setMaxListeners(0);
      response.connection.once('error', connectionErrorHandler);
    }
    if (self._aborted) {
      debug('aborted', self.uri.href);
      response.resume();
      return;
    }
    self.response = response;
    response.request = self;
    response.toJSON = responseToJSON;
    if (self.httpModule === https && self.strictSSL && (!response.hasOwnProperty('socket') || !response.socket.authorized)) {
      debug('strict ssl error', self.uri.href);
      var sslErr = response.hasOwnProperty('socket') ? response.socket.authorizationError : self.uri.href + ' does not support SSL';
      self.emit('error', new Error('SSL Error: ' + sslErr));
      return;
    }
    self.originalHost = self.getHeader('host');
    if (!self.originalHostHeaderName) {
      self.originalHostHeaderName = self.hasHeader('host');
    }
    if (self.setHost) {
      self.removeHeader('host');
    }
    if (self.timeout && self.timeoutTimer) {
      clearTimeout(self.timeoutTimer);
      self.timeoutTimer = null;
    }
    var targetCookieJar = (self._jar && self._jar.setCookie) ? self._jar : globalCookieJar;
    var addCookie = function(cookie) {
      try {
        targetCookieJar.setCookie(cookie, self.uri.href, {ignoreError: true});
      } catch (e) {
        self.emit('error', e);
      }
    };
    response.caseless = caseless(response.headers);
    if (response.caseless.has('set-cookie') && (!self._disableCookies)) {
      var headerName = response.caseless.has('set-cookie');
      if (Array.isArray(response.headers[headerName])) {
        response.headers[headerName].forEach(addCookie);
      } else {
        addCookie(response.headers[headerName]);
      }
    }
    if (self._redirect.onResponse(response)) {
      return;
    } else {
      response.on('close', function() {
        if (!self._ended) {
          self.response.emit('end');
        }
      });
      response.on('end', function() {
        self._ended = true;
      });
      var responseContent;
      if (self.gzip) {
        var contentEncoding = response.headers['content-encoding'] || 'identity';
        contentEncoding = contentEncoding.trim().toLowerCase();
        if (contentEncoding === 'gzip') {
          responseContent = zlib.createGunzip();
          response.pipe(responseContent);
        } else {
          if (contentEncoding !== 'identity') {
            debug('ignoring unrecognized Content-Encoding ' + contentEncoding);
          }
          responseContent = response;
        }
      } else {
        responseContent = response;
      }
      if (self.encoding) {
        if (self.dests.length !== 0) {
          console.error('Ignoring encoding parameter as this stream is being piped to another stream which makes the encoding option invalid.');
        } else if (responseContent.setEncoding) {
          responseContent.setEncoding(self.encoding);
        } else {
          responseContent = responseContent.pipe(stringstream(self.encoding));
        }
      }
      if (self._paused) {
        responseContent.pause();
      }
      self.responseContent = responseContent;
      self.emit('response', response);
      self.dests.forEach(function(dest) {
        self.pipeDest(dest);
      });
      responseContent.on('data', function(chunk) {
        self._destdata = true;
        self.emit('data', chunk);
      });
      responseContent.on('end', function(chunk) {
        self.emit('end', chunk);
      });
      responseContent.on('error', function(error) {
        self.emit('error', error);
      });
      responseContent.on('close', function() {
        self.emit('close');
      });
      if (self.callback) {
        self.readResponseBody(response);
      } else {
        self.on('end', function() {
          if (self._aborted) {
            debug('aborted', self.uri.href);
            return;
          }
          self.emit('complete', response);
        });
      }
    }
    debug('finish init function', self.uri.href);
  };
  Request.prototype.readResponseBody = function(response) {
    var self = this;
    debug('reading response\'s body');
    var buffer = bl(),
        strings = [];
    self.on('data', function(chunk) {
      if (Buffer.isBuffer(chunk)) {
        buffer.append(chunk);
      } else {
        strings.push(chunk);
      }
    });
    self.on('end', function() {
      debug('end event', self.uri.href);
      if (self._aborted) {
        debug('aborted', self.uri.href);
        return;
      }
      if (buffer.length) {
        debug('has body', self.uri.href, buffer.length);
        if (self.encoding === null) {
          response.body = buffer.slice();
        } else {
          response.body = buffer.toString(self.encoding);
        }
      } else if (strings.length) {
        if (self.encoding === 'utf8' && strings[0].length > 0 && strings[0][0] === '\uFEFF') {
          strings[0] = strings[0].substring(1);
        }
        response.body = strings.join('');
      }
      if (self._json) {
        try {
          response.body = JSON.parse(response.body, self._jsonReviver);
        } catch (e) {
          debug('invalid JSON received', self.uri.href);
        }
      }
      debug('emitting complete', self.uri.href);
      if (typeof response.body === 'undefined' && !self._json) {
        response.body = self.encoding === null ? new Buffer(0) : '';
      }
      self.emit('complete', response, response.body);
    });
  };
  Request.prototype.abort = function() {
    var self = this;
    self._aborted = true;
    if (self.req) {
      self.req.abort();
    } else if (self.response) {
      self.response.destroy();
    }
    self.emit('abort');
  };
  Request.prototype.pipeDest = function(dest) {
    var self = this;
    var response = self.response;
    if (dest.headers && !dest.headersSent) {
      if (response.caseless.has('content-type')) {
        var ctname = response.caseless.has('content-type');
        if (dest.setHeader) {
          dest.setHeader(ctname, response.headers[ctname]);
        } else {
          dest.headers[ctname] = response.headers[ctname];
        }
      }
      if (response.caseless.has('content-length')) {
        var clname = response.caseless.has('content-length');
        if (dest.setHeader) {
          dest.setHeader(clname, response.headers[clname]);
        } else {
          dest.headers[clname] = response.headers[clname];
        }
      }
    }
    if (dest.setHeader && !dest.headersSent) {
      for (var i in response.headers) {
        if (!self.gzip || i !== 'content-encoding') {
          dest.setHeader(i, response.headers[i]);
        }
      }
      dest.statusCode = response.statusCode;
    }
    if (self.pipefilter) {
      self.pipefilter(response, dest);
    }
  };
  Request.prototype.qs = function(q, clobber) {
    var self = this;
    var base;
    if (!clobber && self.uri.query) {
      base = self._qs.parse(self.uri.query);
    } else {
      base = {};
    }
    for (var i in q) {
      base[i] = q[i];
    }
    var qs = self._qs.stringify(base);
    if (qs === '') {
      return self;
    }
    self.uri = url.parse(self.uri.href.split('?')[0] + '?' + qs);
    self.url = self.uri;
    self.path = self.uri.path;
    if (self.uri.host === 'unix') {
      self.enableUnixSocket();
    }
    return self;
  };
  Request.prototype.form = function(form) {
    var self = this;
    if (form) {
      if (!/^application\/x-www-form-urlencoded\b/.test(self.getHeader('content-type'))) {
        self.setHeader('content-type', 'application/x-www-form-urlencoded');
      }
      self.body = (typeof form === 'string') ? self._qs.rfc3986(form.toString('utf8')) : self._qs.stringify(form).toString('utf8');
      return self;
    }
    self._form = new FormData();
    self._form.on('error', function(err) {
      err.message = 'form-data: ' + err.message;
      self.emit('error', err);
      self.abort();
    });
    return self._form;
  };
  Request.prototype.multipart = function(multipart) {
    var self = this;
    self._multipart.onRequest(multipart);
    if (!self._multipart.chunked) {
      self.body = self._multipart.body;
    }
    return self;
  };
  Request.prototype.json = function(val) {
    var self = this;
    if (!self.hasHeader('accept')) {
      self.setHeader('accept', 'application/json');
    }
    self._json = true;
    if (typeof val === 'boolean') {
      if (self.body !== undefined) {
        if (!/^application\/x-www-form-urlencoded\b/.test(self.getHeader('content-type'))) {
          self.body = safeStringify(self.body);
        } else {
          self.body = self._qs.rfc3986(self.body);
        }
        if (!self.hasHeader('content-type')) {
          self.setHeader('content-type', 'application/json');
        }
      }
    } else {
      self.body = safeStringify(val);
      if (!self.hasHeader('content-type')) {
        self.setHeader('content-type', 'application/json');
      }
    }
    if (typeof self.jsonReviver === 'function') {
      self._jsonReviver = self.jsonReviver;
    }
    return self;
  };
  Request.prototype.getHeader = function(name, headers) {
    var self = this;
    var result,
        re,
        match;
    if (!headers) {
      headers = self.headers;
    }
    Object.keys(headers).forEach(function(key) {
      if (key.length !== name.length) {
        return;
      }
      re = new RegExp(name, 'i');
      match = key.match(re);
      if (match) {
        result = headers[key];
      }
    });
    return result;
  };
  Request.prototype.enableUnixSocket = function() {
    var unixParts = this.uri.path.split(':'),
        host = unixParts[0],
        path = unixParts[1];
    this.socketPath = host;
    this.uri.pathname = path;
    this.uri.path = path;
    this.uri.host = host;
    this.uri.hostname = host;
    this.uri.isUnix = true;
  };
  Request.prototype.auth = function(user, pass, sendImmediately, bearer) {
    var self = this;
    self._auth.onRequest(user, pass, sendImmediately, bearer);
    return self;
  };
  Request.prototype.aws = function(opts, now) {
    var self = this;
    if (!now) {
      self._aws = opts;
      return self;
    }
    if (opts.sign_version == 4 || opts.sign_version == '4') {
      var aws4 = require('aws4');
      var options = {
        host: self.uri.host,
        path: self.uri.path,
        method: self.method,
        headers: {'content-type': self.getHeader('content-type') || ''},
        body: self.body
      };
      var signRes = aws4.sign(options, {
        accessKeyId: opts.key,
        secretAccessKey: opts.secret
      });
      self.setHeader('authorization', signRes.headers.Authorization);
      self.setHeader('x-amz-date', signRes.headers['X-Amz-Date']);
    } else {
      var date = new Date();
      self.setHeader('date', date.toUTCString());
      var auth = {
        key: opts.key,
        secret: opts.secret,
        verb: self.method.toUpperCase(),
        date: date,
        contentType: self.getHeader('content-type') || '',
        md5: self.getHeader('content-md5') || '',
        amazonHeaders: aws2.canonicalizeHeaders(self.headers)
      };
      var path = self.uri.path;
      if (opts.bucket && path) {
        auth.resource = '/' + opts.bucket + path;
      } else if (opts.bucket && !path) {
        auth.resource = '/' + opts.bucket;
      } else if (!opts.bucket && path) {
        auth.resource = path;
      } else if (!opts.bucket && !path) {
        auth.resource = '/';
      }
      auth.resource = aws2.canonicalizeResource(auth.resource);
      self.setHeader('authorization', aws2.authorization(auth));
    }
    return self;
  };
  Request.prototype.httpSignature = function(opts) {
    var self = this;
    httpSignature.signRequest({
      getHeader: function(header) {
        return self.getHeader(header, self.headers);
      },
      setHeader: function(header, value) {
        self.setHeader(header, value);
      },
      method: self.method,
      path: self.path
    }, opts);
    debug('httpSignature authorization', self.getHeader('authorization'));
    return self;
  };
  Request.prototype.hawk = function(opts) {
    var self = this;
    self.setHeader('Authorization', hawk.client.header(self.uri, self.method, opts).field);
  };
  Request.prototype.oauth = function(_oauth) {
    var self = this;
    self._oauth.onRequest(_oauth);
    return self;
  };
  Request.prototype.jar = function(jar) {
    var self = this;
    var cookies;
    if (self._redirect.redirectsFollowed === 0) {
      self.originalCookieHeader = self.getHeader('cookie');
    }
    if (!jar) {
      cookies = false;
      self._disableCookies = true;
    } else {
      var targetCookieJar = (jar && jar.getCookieString) ? jar : globalCookieJar;
      var urihref = self.uri.href;
      if (targetCookieJar) {
        cookies = targetCookieJar.getCookieString(urihref);
      }
    }
    if (cookies && cookies.length) {
      if (self.originalCookieHeader) {
        self.setHeader('cookie', self.originalCookieHeader + '; ' + cookies);
      } else {
        self.setHeader('cookie', cookies);
      }
    }
    self._jar = jar;
    return self;
  };
  Request.prototype.pipe = function(dest, opts) {
    var self = this;
    if (self.response) {
      if (self._destdata) {
        self.emit('error', new Error('You cannot pipe after data has been emitted from the response.'));
      } else if (self._ended) {
        self.emit('error', new Error('You cannot pipe after the response has been ended.'));
      } else {
        stream.Stream.prototype.pipe.call(self, dest, opts);
        self.pipeDest(dest);
        return dest;
      }
    } else {
      self.dests.push(dest);
      stream.Stream.prototype.pipe.call(self, dest, opts);
      return dest;
    }
  };
  Request.prototype.write = function() {
    var self = this;
    if (self._aborted) {
      return;
    }
    if (!self._started) {
      self.start();
    }
    return self.req.write.apply(self.req, arguments);
  };
  Request.prototype.end = function(chunk) {
    var self = this;
    if (self._aborted) {
      return;
    }
    if (chunk) {
      self.write(chunk);
    }
    if (!self._started) {
      self.start();
    }
    self.req.end();
  };
  Request.prototype.pause = function() {
    var self = this;
    if (!self.responseContent) {
      self._paused = true;
    } else {
      self.responseContent.pause.apply(self.responseContent, arguments);
    }
  };
  Request.prototype.resume = function() {
    var self = this;
    if (!self.responseContent) {
      self._paused = false;
    } else {
      self.responseContent.resume.apply(self.responseContent, arguments);
    }
  };
  Request.prototype.destroy = function() {
    var self = this;
    if (!self._ended) {
      self.end();
    } else if (self.response) {
      self.response.destroy();
    }
  };
  Request.defaultProxyHeaderWhiteList = Tunnel.defaultProxyHeaderWhiteList.slice();
  Request.defaultProxyHeaderExclusiveList = Tunnel.defaultProxyHeaderExclusiveList.slice();
  Request.prototype.toJSON = requestToJSON;
  module.exports = Request;
})(require('buffer').Buffer, require('process'));
