/* */ 
(function(Buffer, process) {
  var CombinedStream = require('combined-stream');
  var util = require('util');
  var path = require('path');
  var http = require('http');
  var https = require('https');
  var parseUrl = require('url').parse;
  var fs = require('fs');
  var mime = require('mime-types');
  var async = require('async');
  module.exports = FormData;
  function FormData() {
    this._overheadLength = 0;
    this._valueLength = 0;
    this._lengthRetrievers = [];
    CombinedStream.call(this);
  }
  util.inherits(FormData, CombinedStream);
  FormData.LINE_BREAK = '\r\n';
  FormData.DEFAULT_CONTENT_TYPE = 'application/octet-stream';
  FormData.prototype.append = function(field, value, options) {
    options = (typeof options === 'string') ? {filename: options} : options || {};
    var append = CombinedStream.prototype.append.bind(this);
    if (typeof value == 'number')
      value = '' + value;
    if (util.isArray(value)) {
      this._error(new Error('Arrays are not supported.'));
      return;
    }
    var header = this._multiPartHeader(field, value, options);
    var footer = this._multiPartFooter(field, value, options);
    append(header);
    append(value);
    append(footer);
    this._trackLength(header, value, options);
  };
  FormData.prototype._trackLength = function(header, value, options) {
    var valueLength = 0;
    if (options.knownLength != null) {
      valueLength += +options.knownLength;
    } else if (Buffer.isBuffer(value)) {
      valueLength = value.length;
    } else if (typeof value === 'string') {
      valueLength = Buffer.byteLength(value);
    }
    this._valueLength += valueLength;
    this._overheadLength += Buffer.byteLength(header) + FormData.LINE_BREAK.length;
    if (!value || (!value.path && !(value.readable && value.hasOwnProperty('httpVersion')))) {
      return;
    }
    if (!options.knownLength)
      this._lengthRetrievers.push(function(next) {
        if (value.hasOwnProperty('fd')) {
          if (value.end != undefined && value.end != Infinity && value.start != undefined) {
            next(null, value.end + 1 - (value.start ? value.start : 0));
          } else {
            fs.stat(value.path, function(err, stat) {
              var fileSize;
              if (err) {
                next(err);
                return;
              }
              fileSize = stat.size - (value.start ? value.start : 0);
              next(null, fileSize);
            });
          }
        } else if (value.hasOwnProperty('httpVersion')) {
          next(null, +value.headers['content-length']);
        } else if (value.hasOwnProperty('httpModule')) {
          value.on('response', function(response) {
            value.pause();
            next(null, +response.headers['content-length']);
          });
          value.resume();
        } else {
          next('Unknown stream');
        }
      });
  };
  FormData.prototype._multiPartHeader = function(field, value, options) {
    if (options.header != null) {
      return options.header;
    }
    var contents = '';
    var headers = {
      'Content-Disposition': ['form-data', 'name="' + field + '"'],
      'Content-Type': []
    };
    if (options.filename || value.path) {
      headers['Content-Disposition'].push('filename="' + path.basename(options.filename || value.path) + '"');
      headers['Content-Type'].push(options.contentType || mime.lookup(options.filename || value.path) || FormData.DEFAULT_CONTENT_TYPE);
    } else if (value.readable && value.hasOwnProperty('httpVersion')) {
      headers['Content-Disposition'].push('filename="' + path.basename(value.client._httpMessage.path) + '"');
      headers['Content-Type'].push(options.contentType || value.headers['content-type'] || FormData.DEFAULT_CONTENT_TYPE);
    } else if (Buffer.isBuffer(value)) {
      headers['Content-Type'].push(options.contentType || FormData.DEFAULT_CONTENT_TYPE);
    } else if (options.contentType) {
      headers['Content-Type'].push(options.contentType);
    }
    for (var prop in headers) {
      if (headers[prop].length) {
        contents += prop + ': ' + headers[prop].join('; ') + FormData.LINE_BREAK;
      }
    }
    return '--' + this.getBoundary() + FormData.LINE_BREAK + contents + FormData.LINE_BREAK;
  };
  FormData.prototype._multiPartFooter = function(field, value, options) {
    return function(next) {
      var footer = FormData.LINE_BREAK;
      var lastPart = (this._streams.length === 0);
      if (lastPart) {
        footer += this._lastBoundary();
      }
      next(footer);
    }.bind(this);
  };
  FormData.prototype._lastBoundary = function() {
    return '--' + this.getBoundary() + '--' + FormData.LINE_BREAK;
  };
  FormData.prototype.getHeaders = function(userHeaders) {
    var formHeaders = {'content-type': 'multipart/form-data; boundary=' + this.getBoundary()};
    for (var header in userHeaders) {
      formHeaders[header.toLowerCase()] = userHeaders[header];
    }
    return formHeaders;
  };
  FormData.prototype.getCustomHeaders = function(contentType) {
    contentType = contentType ? contentType : 'multipart/form-data';
    var formHeaders = {
      'content-type': contentType + '; boundary=' + this.getBoundary(),
      'content-length': this.getLengthSync()
    };
    return formHeaders;
  };
  FormData.prototype.getBoundary = function() {
    if (!this._boundary) {
      this._generateBoundary();
    }
    return this._boundary;
  };
  FormData.prototype._generateBoundary = function() {
    var boundary = '--------------------------';
    for (var i = 0; i < 24; i++) {
      boundary += Math.floor(Math.random() * 10).toString(16);
    }
    this._boundary = boundary;
  };
  FormData.prototype.getLengthSync = function(debug) {
    var knownLength = this._overheadLength + this._valueLength;
    if (this._streams.length) {
      knownLength += this._lastBoundary().length;
    }
    if (this._lengthRetrievers.length) {
      this._error(new Error('Cannot calculate proper length in synchronous way.'));
    }
    return knownLength;
  };
  FormData.prototype.getLength = function(cb) {
    var knownLength = this._overheadLength + this._valueLength;
    if (this._streams.length) {
      knownLength += this._lastBoundary().length;
    }
    if (!this._lengthRetrievers.length) {
      process.nextTick(cb.bind(this, null, knownLength));
      return;
    }
    async.parallel(this._lengthRetrievers, function(err, values) {
      if (err) {
        cb(err);
        return;
      }
      values.forEach(function(length) {
        knownLength += length;
      });
      cb(null, knownLength);
    });
  };
  FormData.prototype.submit = function(params, cb) {
    var request,
        options,
        defaults = {method: 'post'};
    if (typeof params == 'string') {
      params = parseUrl(params);
      options = populate({
        port: params.port,
        path: params.pathname,
        host: params.hostname
      }, defaults);
    } else {
      options = populate(params, defaults);
      if (!options.port) {
        options.port = options.protocol == 'https:' ? 443 : 80;
      }
    }
    options.headers = this.getHeaders(params.headers);
    if (options.protocol == 'https:') {
      request = https.request(options);
    } else {
      request = http.request(options);
    }
    this.getLength(function(err, length) {
      request.setHeader('Content-Length', length);
      this.pipe(request);
      if (cb) {
        request.on('error', cb);
        request.on('response', cb.bind(this, null));
      }
    }.bind(this));
    return request;
  };
  FormData.prototype._error = function(err) {
    if (this.error)
      return;
    this.error = err;
    this.pause();
    this.emit('error', err);
  };
  function populate(dst, src) {
    for (var prop in src) {
      if (!dst[prop])
        dst[prop] = src[prop];
    }
    return dst;
  }
})(require('buffer').Buffer, require('process'));
