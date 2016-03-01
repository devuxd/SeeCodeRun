/* */ 
var CSSOM = {CSSValue: require('./CSSValue').CSSValue};
CSSOM.CSSValueExpression = function CSSValueExpression(token, idx) {
  this._token = token;
  this._idx = idx;
};
CSSOM.CSSValueExpression.prototype = new CSSOM.CSSValue();
CSSOM.CSSValueExpression.prototype.constructor = CSSOM.CSSValueExpression;
CSSOM.CSSValueExpression.prototype.parse = function() {
  var token = this._token,
      idx = this._idx;
  var character = '',
      expression = '',
      error = '',
      info,
      paren = [];
  for (; ; ++idx) {
    character = token.charAt(idx);
    if (character === '') {
      error = 'css expression error: unfinished expression!';
      break;
    }
    switch (character) {
      case '(':
        paren.push(character);
        expression += character;
        break;
      case ')':
        paren.pop(character);
        expression += character;
        break;
      case '/':
        if ((info = this._parseJSComment(token, idx))) {
          if (info.error) {
            error = 'css expression error: unfinished comment in expression!';
          } else {
            idx = info.idx;
          }
        } else if ((info = this._parseJSRexExp(token, idx))) {
          idx = info.idx;
          expression += info.text;
        } else {
          expression += character;
        }
        break;
      case "'":
      case '"':
        info = this._parseJSString(token, idx, character);
        if (info) {
          idx = info.idx;
          expression += info.text;
        } else {
          expression += character;
        }
        break;
      default:
        expression += character;
        break;
    }
    if (error) {
      break;
    }
    if (paren.length === 0) {
      break;
    }
  }
  var ret;
  if (error) {
    ret = {error: error};
  } else {
    ret = {
      idx: idx,
      expression: expression
    };
  }
  return ret;
};
CSSOM.CSSValueExpression.prototype._parseJSComment = function(token, idx) {
  var nextChar = token.charAt(idx + 1),
      text;
  if (nextChar === '/' || nextChar === '*') {
    var startIdx = idx,
        endIdx,
        commentEndChar;
    if (nextChar === '/') {
      commentEndChar = '\n';
    } else if (nextChar === '*') {
      commentEndChar = '*/';
    }
    endIdx = token.indexOf(commentEndChar, startIdx + 1 + 1);
    if (endIdx !== -1) {
      endIdx = endIdx + commentEndChar.length - 1;
      text = token.substring(idx, endIdx + 1);
      return {
        idx: endIdx,
        text: text
      };
    } else {
      var error = 'css expression error: unfinished comment in expression!';
      return {error: error};
    }
  } else {
    return false;
  }
};
CSSOM.CSSValueExpression.prototype._parseJSString = function(token, idx, sep) {
  var endIdx = this._findMatchedIdx(token, idx, sep),
      text;
  if (endIdx === -1) {
    return false;
  } else {
    text = token.substring(idx, endIdx + sep.length);
    return {
      idx: endIdx,
      text: text
    };
  }
};
CSSOM.CSSValueExpression.prototype._parseJSRexExp = function(token, idx) {
  var before = token.substring(0, idx).replace(/\s+$/, ""),
      legalRegx = [/^$/, /\($/, /\[$/, /\!$/, /\+$/, /\-$/, /\*$/, /\/\s+/, /\%$/, /\=$/, /\>$/, /<$/, /\&$/, /\|$/, /\^$/, /\~$/, /\?$/, /\,$/, /delete$/, /in$/, /instanceof$/, /new$/, /typeof$/, /void$/];
  var isLegal = legalRegx.some(function(reg) {
    return reg.test(before);
  });
  if (!isLegal) {
    return false;
  } else {
    var sep = '/';
    return this._parseJSString(token, idx, sep);
  }
};
CSSOM.CSSValueExpression.prototype._findMatchedIdx = function(token, idx, sep) {
  var startIdx = idx,
      endIdx;
  var NOT_FOUND = -1;
  while (true) {
    endIdx = token.indexOf(sep, startIdx + 1);
    if (endIdx === -1) {
      endIdx = NOT_FOUND;
      break;
    } else {
      var text = token.substring(idx + 1, endIdx),
          matched = text.match(/\\+$/);
      if (!matched || matched[0] % 2 === 0) {
        break;
      } else {
        startIdx = endIdx;
      }
    }
  }
  var nextNewLineIdx = token.indexOf('\n', idx + 1);
  if (nextNewLineIdx < endIdx) {
    endIdx = NOT_FOUND;
  }
  return endIdx;
};
exports.CSSValueExpression = CSSOM.CSSValueExpression;
