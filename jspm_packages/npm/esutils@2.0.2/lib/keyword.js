/* */ 
(function() {
  'use strict';
  var code = require('./code');
  function isStrictModeReservedWordES6(id) {
    switch (id) {
      case 'implements':
      case 'interface':
      case 'package':
      case 'private':
      case 'protected':
      case 'public':
      case 'static':
      case 'let':
        return true;
      default:
        return false;
    }
  }
  function isKeywordES5(id, strict) {
    if (!strict && id === 'yield') {
      return false;
    }
    return isKeywordES6(id, strict);
  }
  function isKeywordES6(id, strict) {
    if (strict && isStrictModeReservedWordES6(id)) {
      return true;
    }
    switch (id.length) {
      case 2:
        return (id === 'if') || (id === 'in') || (id === 'do');
      case 3:
        return (id === 'var') || (id === 'for') || (id === 'new') || (id === 'try');
      case 4:
        return (id === 'this') || (id === 'else') || (id === 'case') || (id === 'void') || (id === 'with') || (id === 'enum');
      case 5:
        return (id === 'while') || (id === 'break') || (id === 'catch') || (id === 'throw') || (id === 'const') || (id === 'yield') || (id === 'class') || (id === 'super');
      case 6:
        return (id === 'return') || (id === 'typeof') || (id === 'delete') || (id === 'switch') || (id === 'export') || (id === 'import');
      case 7:
        return (id === 'default') || (id === 'finally') || (id === 'extends');
      case 8:
        return (id === 'function') || (id === 'continue') || (id === 'debugger');
      case 10:
        return (id === 'instanceof');
      default:
        return false;
    }
  }
  function isReservedWordES5(id, strict) {
    return id === 'null' || id === 'true' || id === 'false' || isKeywordES5(id, strict);
  }
  function isReservedWordES6(id, strict) {
    return id === 'null' || id === 'true' || id === 'false' || isKeywordES6(id, strict);
  }
  function isRestrictedWord(id) {
    return id === 'eval' || id === 'arguments';
  }
  function isIdentifierNameES5(id) {
    var i,
        iz,
        ch;
    if (id.length === 0) {
      return false;
    }
    ch = id.charCodeAt(0);
    if (!code.isIdentifierStartES5(ch)) {
      return false;
    }
    for (i = 1, iz = id.length; i < iz; ++i) {
      ch = id.charCodeAt(i);
      if (!code.isIdentifierPartES5(ch)) {
        return false;
      }
    }
    return true;
  }
  function decodeUtf16(lead, trail) {
    return (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
  }
  function isIdentifierNameES6(id) {
    var i,
        iz,
        ch,
        lowCh,
        check;
    if (id.length === 0) {
      return false;
    }
    check = code.isIdentifierStartES6;
    for (i = 0, iz = id.length; i < iz; ++i) {
      ch = id.charCodeAt(i);
      if (0xD800 <= ch && ch <= 0xDBFF) {
        ++i;
        if (i >= iz) {
          return false;
        }
        lowCh = id.charCodeAt(i);
        if (!(0xDC00 <= lowCh && lowCh <= 0xDFFF)) {
          return false;
        }
        ch = decodeUtf16(ch, lowCh);
      }
      if (!check(ch)) {
        return false;
      }
      check = code.isIdentifierPartES6;
    }
    return true;
  }
  function isIdentifierES5(id, strict) {
    return isIdentifierNameES5(id) && !isReservedWordES5(id, strict);
  }
  function isIdentifierES6(id, strict) {
    return isIdentifierNameES6(id) && !isReservedWordES6(id, strict);
  }
  module.exports = {
    isKeywordES5: isKeywordES5,
    isKeywordES6: isKeywordES6,
    isReservedWordES5: isReservedWordES5,
    isReservedWordES6: isReservedWordES6,
    isRestrictedWord: isRestrictedWord,
    isIdentifierNameES5: isIdentifierNameES5,
    isIdentifierNameES6: isIdentifierNameES6,
    isIdentifierES5: isIdentifierES5,
    isIdentifierES6: isIdentifierES6
  };
}());
