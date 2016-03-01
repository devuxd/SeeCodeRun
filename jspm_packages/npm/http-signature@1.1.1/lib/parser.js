/* */ 
var assert = require('assert-plus');
var util = require('util');
var utils = require('./utils');
var HASH_ALGOS = utils.HASH_ALGOS;
var PK_ALGOS = utils.PK_ALGOS;
var HttpSignatureError = utils.HttpSignatureError;
var InvalidAlgorithmError = utils.InvalidAlgorithmError;
var validateAlgorithm = utils.validateAlgorithm;
var State = {
  New: 0,
  Params: 1
};
var ParamsState = {
  Name: 0,
  Quote: 1,
  Value: 2,
  Comma: 3
};
function ExpiredRequestError(message) {
  HttpSignatureError.call(this, message, ExpiredRequestError);
}
util.inherits(ExpiredRequestError, HttpSignatureError);
function InvalidHeaderError(message) {
  HttpSignatureError.call(this, message, InvalidHeaderError);
}
util.inherits(InvalidHeaderError, HttpSignatureError);
function InvalidParamsError(message) {
  HttpSignatureError.call(this, message, InvalidParamsError);
}
util.inherits(InvalidParamsError, HttpSignatureError);
function MissingHeaderError(message) {
  HttpSignatureError.call(this, message, MissingHeaderError);
}
util.inherits(MissingHeaderError, HttpSignatureError);
function StrictParsingError(message) {
  HttpSignatureError.call(this, message, StrictParsingError);
}
util.inherits(StrictParsingError, HttpSignatureError);
module.exports = {parseRequest: function parseRequest(request, options) {
    assert.object(request, 'request');
    assert.object(request.headers, 'request.headers');
    if (options === undefined) {
      options = {};
    }
    if (options.headers === undefined) {
      options.headers = [request.headers['x-date'] ? 'x-date' : 'date'];
    }
    assert.object(options, 'options');
    assert.arrayOfString(options.headers, 'options.headers');
    assert.optionalNumber(options.clockSkew, 'options.clockSkew');
    if (!request.headers.authorization)
      throw new MissingHeaderError('no authorization header present in ' + 'the request');
    options.clockSkew = options.clockSkew || 300;
    var i = 0;
    var state = State.New;
    var substate = ParamsState.Name;
    var tmpName = '';
    var tmpValue = '';
    var parsed = {
      scheme: '',
      params: {},
      signingString: '',
      get algorithm() {
        return this.params.algorithm.toUpperCase();
      },
      get keyId() {
        return this.params.keyId;
      }
    };
    var authz = request.headers.authorization;
    for (i = 0; i < authz.length; i++) {
      var c = authz.charAt(i);
      switch (Number(state)) {
        case State.New:
          if (c !== ' ')
            parsed.scheme += c;
          else
            state = State.Params;
          break;
        case State.Params:
          switch (Number(substate)) {
            case ParamsState.Name:
              var code = c.charCodeAt(0);
              if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) {
                tmpName += c;
              } else if (c === '=') {
                if (tmpName.length === 0)
                  throw new InvalidHeaderError('bad param format');
                substate = ParamsState.Quote;
              } else {
                throw new InvalidHeaderError('bad param format');
              }
              break;
            case ParamsState.Quote:
              if (c === '"') {
                tmpValue = '';
                substate = ParamsState.Value;
              } else {
                throw new InvalidHeaderError('bad param format');
              }
              break;
            case ParamsState.Value:
              if (c === '"') {
                parsed.params[tmpName] = tmpValue;
                substate = ParamsState.Comma;
              } else {
                tmpValue += c;
              }
              break;
            case ParamsState.Comma:
              if (c === ',') {
                tmpName = '';
                substate = ParamsState.Name;
              } else {
                throw new InvalidHeaderError('bad param format');
              }
              break;
            default:
              throw new Error('Invalid substate');
          }
          break;
        default:
          throw new Error('Invalid substate');
      }
    }
    if (!parsed.params.headers || parsed.params.headers === '') {
      if (request.headers['x-date']) {
        parsed.params.headers = ['x-date'];
      } else {
        parsed.params.headers = ['date'];
      }
    } else {
      parsed.params.headers = parsed.params.headers.split(' ');
    }
    if (!parsed.scheme || parsed.scheme !== 'Signature')
      throw new InvalidHeaderError('scheme was not "Signature"');
    if (!parsed.params.keyId)
      throw new InvalidHeaderError('keyId was not specified');
    if (!parsed.params.algorithm)
      throw new InvalidHeaderError('algorithm was not specified');
    if (!parsed.params.signature)
      throw new InvalidHeaderError('signature was not specified');
    parsed.params.algorithm = parsed.params.algorithm.toLowerCase();
    try {
      validateAlgorithm(parsed.params.algorithm);
    } catch (e) {
      if (e instanceof InvalidAlgorithmError)
        throw (new InvalidParamsError(parsed.params.algorithm + ' is not ' + 'supported'));
      else
        throw (e);
    }
    for (i = 0; i < parsed.params.headers.length; i++) {
      var h = parsed.params.headers[i].toLowerCase();
      parsed.params.headers[i] = h;
      if (h === 'request-line') {
        if (!options.strict) {
          parsed.signingString += request.method + ' ' + request.url + ' HTTP/' + request.httpVersion;
        } else {
          throw (new StrictParsingError('request-line is not a valid header ' + 'with strict parsing enabled.'));
        }
      } else if (h === '(request-target)') {
        parsed.signingString += '(request-target): ' + request.method.toLowerCase() + ' ' + request.url;
      } else {
        var value = request.headers[h];
        if (value === undefined)
          throw new MissingHeaderError(h + ' was not in the request');
        parsed.signingString += h + ': ' + value;
      }
      if ((i + 1) < parsed.params.headers.length)
        parsed.signingString += '\n';
    }
    var date;
    if (request.headers.date || request.headers['x-date']) {
      if (request.headers['x-date']) {
        date = new Date(request.headers['x-date']);
      } else {
        date = new Date(request.headers.date);
      }
      var now = new Date();
      var skew = Math.abs(now.getTime() - date.getTime());
      if (skew > options.clockSkew * 1000) {
        throw new ExpiredRequestError('clock skew of ' + (skew / 1000) + 's was greater than ' + options.clockSkew + 's');
      }
    }
    options.headers.forEach(function(hdr) {
      if (parsed.params.headers.indexOf(hdr) < 0)
        throw new MissingHeaderError(hdr + ' was not a signed header');
    });
    if (options.algorithms) {
      if (options.algorithms.indexOf(parsed.params.algorithm) === -1)
        throw new InvalidParamsError(parsed.params.algorithm + ' is not a supported algorithm');
    }
    return parsed;
  }};
