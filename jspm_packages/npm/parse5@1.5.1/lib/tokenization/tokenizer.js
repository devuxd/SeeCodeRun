/* */ 
(function(process) {
  'use strict';
  var Preprocessor = require('./preprocessor'),
      LocationInfoMixin = require('./location_info_mixin'),
      UNICODE = require('../common/unicode'),
      NAMED_ENTITY_TRIE = require('./named_entity_trie');
  var $ = UNICODE.CODE_POINTS,
      $$ = UNICODE.CODE_POINT_SEQUENCES;
  var NUMERIC_ENTITY_REPLACEMENTS = {
    0x00: 0xFFFD,
    0x0D: 0x000D,
    0x80: 0x20AC,
    0x81: 0x0081,
    0x82: 0x201A,
    0x83: 0x0192,
    0x84: 0x201E,
    0x85: 0x2026,
    0x86: 0x2020,
    0x87: 0x2021,
    0x88: 0x02C6,
    0x89: 0x2030,
    0x8A: 0x0160,
    0x8B: 0x2039,
    0x8C: 0x0152,
    0x8D: 0x008D,
    0x8E: 0x017D,
    0x8F: 0x008F,
    0x90: 0x0090,
    0x91: 0x2018,
    0x92: 0x2019,
    0x93: 0x201C,
    0x94: 0x201D,
    0x95: 0x2022,
    0x96: 0x2013,
    0x97: 0x2014,
    0x98: 0x02DC,
    0x99: 0x2122,
    0x9A: 0x0161,
    0x9B: 0x203A,
    0x9C: 0x0153,
    0x9D: 0x009D,
    0x9E: 0x017E,
    0x9F: 0x0178
  };
  var DATA_STATE = 'DATA_STATE',
      CHARACTER_REFERENCE_IN_DATA_STATE = 'CHARACTER_REFERENCE_IN_DATA_STATE',
      RCDATA_STATE = 'RCDATA_STATE',
      CHARACTER_REFERENCE_IN_RCDATA_STATE = 'CHARACTER_REFERENCE_IN_RCDATA_STATE',
      RAWTEXT_STATE = 'RAWTEXT_STATE',
      SCRIPT_DATA_STATE = 'SCRIPT_DATA_STATE',
      PLAINTEXT_STATE = 'PLAINTEXT_STATE',
      TAG_OPEN_STATE = 'TAG_OPEN_STATE',
      END_TAG_OPEN_STATE = 'END_TAG_OPEN_STATE',
      TAG_NAME_STATE = 'TAG_NAME_STATE',
      RCDATA_LESS_THAN_SIGN_STATE = 'RCDATA_LESS_THAN_SIGN_STATE',
      RCDATA_END_TAG_OPEN_STATE = 'RCDATA_END_TAG_OPEN_STATE',
      RCDATA_END_TAG_NAME_STATE = 'RCDATA_END_TAG_NAME_STATE',
      RAWTEXT_LESS_THAN_SIGN_STATE = 'RAWTEXT_LESS_THAN_SIGN_STATE',
      RAWTEXT_END_TAG_OPEN_STATE = 'RAWTEXT_END_TAG_OPEN_STATE',
      RAWTEXT_END_TAG_NAME_STATE = 'RAWTEXT_END_TAG_NAME_STATE',
      SCRIPT_DATA_LESS_THAN_SIGN_STATE = 'SCRIPT_DATA_LESS_THAN_SIGN_STATE',
      SCRIPT_DATA_END_TAG_OPEN_STATE = 'SCRIPT_DATA_END_TAG_OPEN_STATE',
      SCRIPT_DATA_END_TAG_NAME_STATE = 'SCRIPT_DATA_END_TAG_NAME_STATE',
      SCRIPT_DATA_ESCAPE_START_STATE = 'SCRIPT_DATA_ESCAPE_START_STATE',
      SCRIPT_DATA_ESCAPE_START_DASH_STATE = 'SCRIPT_DATA_ESCAPE_START_DASH_STATE',
      SCRIPT_DATA_ESCAPED_STATE = 'SCRIPT_DATA_ESCAPED_STATE',
      SCRIPT_DATA_ESCAPED_DASH_STATE = 'SCRIPT_DATA_ESCAPED_DASH_STATE',
      SCRIPT_DATA_ESCAPED_DASH_DASH_STATE = 'SCRIPT_DATA_ESCAPED_DASH_DASH_STATE',
      SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN_STATE = 'SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN_STATE',
      SCRIPT_DATA_ESCAPED_END_TAG_OPEN_STATE = 'SCRIPT_DATA_ESCAPED_END_TAG_OPEN_STATE',
      SCRIPT_DATA_ESCAPED_END_TAG_NAME_STATE = 'SCRIPT_DATA_ESCAPED_END_TAG_NAME_STATE',
      SCRIPT_DATA_DOUBLE_ESCAPE_START_STATE = 'SCRIPT_DATA_DOUBLE_ESCAPE_START_STATE',
      SCRIPT_DATA_DOUBLE_ESCAPED_STATE = 'SCRIPT_DATA_DOUBLE_ESCAPED_STATE',
      SCRIPT_DATA_DOUBLE_ESCAPED_DASH_STATE = 'SCRIPT_DATA_DOUBLE_ESCAPED_DASH_STATE',
      SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH_STATE = 'SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH_STATE',
      SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN_STATE = 'SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN_STATE',
      SCRIPT_DATA_DOUBLE_ESCAPE_END_STATE = 'SCRIPT_DATA_DOUBLE_ESCAPE_END_STATE',
      BEFORE_ATTRIBUTE_NAME_STATE = 'BEFORE_ATTRIBUTE_NAME_STATE',
      ATTRIBUTE_NAME_STATE = 'ATTRIBUTE_NAME_STATE',
      AFTER_ATTRIBUTE_NAME_STATE = 'AFTER_ATTRIBUTE_NAME_STATE',
      BEFORE_ATTRIBUTE_VALUE_STATE = 'BEFORE_ATTRIBUTE_VALUE_STATE',
      ATTRIBUTE_VALUE_DOUBLE_QUOTED_STATE = 'ATTRIBUTE_VALUE_DOUBLE_QUOTED_STATE',
      ATTRIBUTE_VALUE_SINGLE_QUOTED_STATE = 'ATTRIBUTE_VALUE_SINGLE_QUOTED_STATE',
      ATTRIBUTE_VALUE_UNQUOTED_STATE = 'ATTRIBUTE_VALUE_UNQUOTED_STATE',
      CHARACTER_REFERENCE_IN_ATTRIBUTE_VALUE_STATE = 'CHARACTER_REFERENCE_IN_ATTRIBUTE_VALUE_STATE',
      AFTER_ATTRIBUTE_VALUE_QUOTED_STATE = 'AFTER_ATTRIBUTE_VALUE_QUOTED_STATE',
      SELF_CLOSING_START_TAG_STATE = 'SELF_CLOSING_START_TAG_STATE',
      BOGUS_COMMENT_STATE = 'BOGUS_COMMENT_STATE',
      MARKUP_DECLARATION_OPEN_STATE = 'MARKUP_DECLARATION_OPEN_STATE',
      COMMENT_START_STATE = 'COMMENT_START_STATE',
      COMMENT_START_DASH_STATE = 'COMMENT_START_DASH_STATE',
      COMMENT_STATE = 'COMMENT_STATE',
      COMMENT_END_DASH_STATE = 'COMMENT_END_DASH_STATE',
      COMMENT_END_STATE = 'COMMENT_END_STATE',
      COMMENT_END_BANG_STATE = 'COMMENT_END_BANG_STATE',
      DOCTYPE_STATE = 'DOCTYPE_STATE',
      BEFORE_DOCTYPE_NAME_STATE = 'BEFORE_DOCTYPE_NAME_STATE',
      DOCTYPE_NAME_STATE = 'DOCTYPE_NAME_STATE',
      AFTER_DOCTYPE_NAME_STATE = 'AFTER_DOCTYPE_NAME_STATE',
      AFTER_DOCTYPE_PUBLIC_KEYWORD_STATE = 'AFTER_DOCTYPE_PUBLIC_KEYWORD_STATE',
      BEFORE_DOCTYPE_PUBLIC_IDENTIFIER_STATE = 'BEFORE_DOCTYPE_PUBLIC_IDENTIFIER_STATE',
      DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED_STATE = 'DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED_STATE',
      DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED_STATE = 'DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED_STATE',
      AFTER_DOCTYPE_PUBLIC_IDENTIFIER_STATE = 'AFTER_DOCTYPE_PUBLIC_IDENTIFIER_STATE',
      BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS_STATE = 'BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS_STATE',
      AFTER_DOCTYPE_SYSTEM_KEYWORD_STATE = 'AFTER_DOCTYPE_SYSTEM_KEYWORD_STATE',
      BEFORE_DOCTYPE_SYSTEM_IDENTIFIER_STATE = 'BEFORE_DOCTYPE_SYSTEM_IDENTIFIER_STATE',
      DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE = 'DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE',
      DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE = 'DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE',
      AFTER_DOCTYPE_SYSTEM_IDENTIFIER_STATE = 'AFTER_DOCTYPE_SYSTEM_IDENTIFIER_STATE',
      BOGUS_DOCTYPE_STATE = 'BOGUS_DOCTYPE_STATE',
      CDATA_SECTION_STATE = 'CDATA_SECTION_STATE';
  function isWhitespace(cp) {
    return cp === $.SPACE || cp === $.LINE_FEED || cp === $.TABULATION || cp === $.FORM_FEED;
  }
  function isAsciiDigit(cp) {
    return cp >= $.DIGIT_0 && cp <= $.DIGIT_9;
  }
  function isAsciiUpper(cp) {
    return cp >= $.LATIN_CAPITAL_A && cp <= $.LATIN_CAPITAL_Z;
  }
  function isAsciiLower(cp) {
    return cp >= $.LATIN_SMALL_A && cp <= $.LATIN_SMALL_Z;
  }
  function isAsciiAlphaNumeric(cp) {
    return isAsciiDigit(cp) || isAsciiUpper(cp) || isAsciiLower(cp);
  }
  function isDigit(cp, isHex) {
    return isAsciiDigit(cp) || (isHex && ((cp >= $.LATIN_CAPITAL_A && cp <= $.LATIN_CAPITAL_F) || (cp >= $.LATIN_SMALL_A && cp <= $.LATIN_SMALL_F)));
  }
  function isReservedCodePoint(cp) {
    return cp >= 0xD800 && cp <= 0xDFFF || cp > 0x10FFFF;
  }
  function toAsciiLowerCodePoint(cp) {
    return cp + 0x0020;
  }
  function toChar(cp) {
    if (cp <= 0xFFFF)
      return String.fromCharCode(cp);
    cp -= 0x10000;
    return String.fromCharCode(cp >>> 10 & 0x3FF | 0xD800) + String.fromCharCode(0xDC00 | cp & 0x3FF);
  }
  function toAsciiLowerChar(cp) {
    return String.fromCharCode(toAsciiLowerCodePoint(cp));
  }
  var Tokenizer = module.exports = function(html, options) {
    this.disableEntitiesDecoding = false;
    this.preprocessor = new Preprocessor(html);
    this.tokenQueue = [];
    this.allowCDATA = false;
    this.state = DATA_STATE;
    this.returnState = '';
    this.consumptionPos = 0;
    this.tempBuff = [];
    this.additionalAllowedCp = void 0;
    this.lastStartTagName = '';
    this.currentCharacterToken = null;
    this.currentToken = null;
    this.currentAttr = null;
    if (options) {
      this.disableEntitiesDecoding = !options.decodeHtmlEntities;
      if (options.locationInfo)
        LocationInfoMixin.assign(this);
    }
  };
  Tokenizer.CHARACTER_TOKEN = 'CHARACTER_TOKEN';
  Tokenizer.NULL_CHARACTER_TOKEN = 'NULL_CHARACTER_TOKEN';
  Tokenizer.WHITESPACE_CHARACTER_TOKEN = 'WHITESPACE_CHARACTER_TOKEN';
  Tokenizer.START_TAG_TOKEN = 'START_TAG_TOKEN';
  Tokenizer.END_TAG_TOKEN = 'END_TAG_TOKEN';
  Tokenizer.COMMENT_TOKEN = 'COMMENT_TOKEN';
  Tokenizer.DOCTYPE_TOKEN = 'DOCTYPE_TOKEN';
  Tokenizer.EOF_TOKEN = 'EOF_TOKEN';
  Tokenizer.MODE = Tokenizer.prototype.MODE = {
    DATA: DATA_STATE,
    RCDATA: RCDATA_STATE,
    RAWTEXT: RAWTEXT_STATE,
    SCRIPT_DATA: SCRIPT_DATA_STATE,
    PLAINTEXT: PLAINTEXT_STATE
  };
  Tokenizer.getTokenAttr = function(token, attrName) {
    for (var i = token.attrs.length - 1; i >= 0; i--) {
      if (token.attrs[i].name === attrName)
        return token.attrs[i].value;
    }
    return null;
  };
  Tokenizer.prototype.getNextToken = function() {
    while (!this.tokenQueue.length)
      this[this.state](this._consume());
    return this.tokenQueue.shift();
  };
  Tokenizer.prototype._consume = function() {
    this.consumptionPos++;
    return this.preprocessor.advanceAndPeekCodePoint();
  };
  Tokenizer.prototype._unconsume = function() {
    this.consumptionPos--;
    this.preprocessor.retreat();
  };
  Tokenizer.prototype._unconsumeSeveral = function(count) {
    while (count--)
      this._unconsume();
  };
  Tokenizer.prototype._reconsumeInState = function(state) {
    this.state = state;
    this._unconsume();
  };
  Tokenizer.prototype._consumeSubsequentIfMatch = function(pattern, startCp, caseSensitive) {
    var rollbackPos = this.consumptionPos,
        isMatch = true,
        patternLength = pattern.length,
        patternPos = 0,
        cp = startCp,
        patternCp = void 0;
    for (; patternPos < patternLength; patternPos++) {
      if (patternPos > 0)
        cp = this._consume();
      if (cp === $.EOF) {
        isMatch = false;
        break;
      }
      patternCp = pattern[patternPos];
      if (cp !== patternCp && (caseSensitive || cp !== toAsciiLowerCodePoint(patternCp))) {
        isMatch = false;
        break;
      }
    }
    if (!isMatch)
      this._unconsumeSeveral(this.consumptionPos - rollbackPos);
    return isMatch;
  };
  Tokenizer.prototype._lookahead = function() {
    var cp = this.preprocessor.advanceAndPeekCodePoint();
    this.preprocessor.retreat();
    return cp;
  };
  Tokenizer.prototype.isTempBufferEqualToScriptString = function() {
    if (this.tempBuff.length !== $$.SCRIPT_STRING.length)
      return false;
    for (var i = 0; i < this.tempBuff.length; i++) {
      if (this.tempBuff[i] !== $$.SCRIPT_STRING[i])
        return false;
    }
    return true;
  };
  Tokenizer.prototype.buildStartTagToken = function(tagName) {
    return {
      type: Tokenizer.START_TAG_TOKEN,
      tagName: tagName,
      selfClosing: false,
      attrs: []
    };
  };
  Tokenizer.prototype.buildEndTagToken = function(tagName) {
    return {
      type: Tokenizer.END_TAG_TOKEN,
      tagName: tagName,
      ignored: false,
      attrs: []
    };
  };
  Tokenizer.prototype._createStartTagToken = function(tagNameFirstCh) {
    this.currentToken = this.buildStartTagToken(tagNameFirstCh);
  };
  Tokenizer.prototype._createEndTagToken = function(tagNameFirstCh) {
    this.currentToken = this.buildEndTagToken(tagNameFirstCh);
  };
  Tokenizer.prototype._createCommentToken = function() {
    this.currentToken = {
      type: Tokenizer.COMMENT_TOKEN,
      data: ''
    };
  };
  Tokenizer.prototype._createDoctypeToken = function(doctypeNameFirstCh) {
    this.currentToken = {
      type: Tokenizer.DOCTYPE_TOKEN,
      name: doctypeNameFirstCh || '',
      forceQuirks: false,
      publicId: null,
      systemId: null
    };
  };
  Tokenizer.prototype._createCharacterToken = function(type, ch) {
    this.currentCharacterToken = {
      type: type,
      chars: ch
    };
  };
  Tokenizer.prototype._createAttr = function(attrNameFirstCh) {
    this.currentAttr = {
      name: attrNameFirstCh,
      value: ''
    };
  };
  Tokenizer.prototype._isDuplicateAttr = function() {
    return Tokenizer.getTokenAttr(this.currentToken, this.currentAttr.name) !== null;
  };
  Tokenizer.prototype._leaveAttrName = function(toState) {
    this.state = toState;
    if (!this._isDuplicateAttr())
      this.currentToken.attrs.push(this.currentAttr);
  };
  Tokenizer.prototype._isAppropriateEndTagToken = function() {
    return this.lastStartTagName === this.currentToken.tagName;
  };
  Tokenizer.prototype._emitCurrentToken = function() {
    this._emitCurrentCharacterToken();
    if (this.currentToken.type === Tokenizer.START_TAG_TOKEN)
      this.lastStartTagName = this.currentToken.tagName;
    this.tokenQueue.push(this.currentToken);
    this.currentToken = null;
  };
  Tokenizer.prototype._emitCurrentCharacterToken = function() {
    if (this.currentCharacterToken) {
      this.tokenQueue.push(this.currentCharacterToken);
      this.currentCharacterToken = null;
    }
  };
  Tokenizer.prototype._emitEOFToken = function() {
    this._emitCurrentCharacterToken();
    this.tokenQueue.push({type: Tokenizer.EOF_TOKEN});
  };
  Tokenizer.prototype._appendCharToCurrentCharacterToken = function(type, ch) {
    if (this.currentCharacterToken && this.currentCharacterToken.type !== type)
      this._emitCurrentCharacterToken();
    if (this.currentCharacterToken)
      this.currentCharacterToken.chars += ch;
    else
      this._createCharacterToken(type, ch);
  };
  Tokenizer.prototype._emitCodePoint = function(cp) {
    var type = Tokenizer.CHARACTER_TOKEN;
    if (isWhitespace(cp))
      type = Tokenizer.WHITESPACE_CHARACTER_TOKEN;
    else if (cp === $.NULL)
      type = Tokenizer.NULL_CHARACTER_TOKEN;
    this._appendCharToCurrentCharacterToken(type, toChar(cp));
  };
  Tokenizer.prototype._emitSeveralCodePoints = function(codePoints) {
    for (var i = 0; i < codePoints.length; i++)
      this._emitCodePoint(codePoints[i]);
  };
  Tokenizer.prototype._emitChar = function(ch) {
    this._appendCharToCurrentCharacterToken(Tokenizer.CHARACTER_TOKEN, ch);
  };
  Tokenizer.prototype._consumeNumericEntity = function(isHex) {
    var digits = '',
        nextCp = void 0;
    do {
      digits += toChar(this._consume());
      nextCp = this._lookahead();
    } while (nextCp !== $.EOF && isDigit(nextCp, isHex));
    if (this._lookahead() === $.SEMICOLON)
      this._consume();
    var referencedCp = parseInt(digits, isHex ? 16 : 10),
        replacement = NUMERIC_ENTITY_REPLACEMENTS[referencedCp];
    if (replacement)
      return replacement;
    if (isReservedCodePoint(referencedCp))
      return $.REPLACEMENT_CHARACTER;
    return referencedCp;
  };
  Tokenizer.prototype._consumeNamedEntity = function(startCp, inAttr) {
    var referencedCodePoints = null,
        entityCodePointsCount = 0,
        cp = startCp,
        leaf = NAMED_ENTITY_TRIE[cp],
        consumedCount = 1,
        semicolonTerminated = false;
    for (; leaf && cp !== $.EOF; cp = this._consume(), consumedCount++, leaf = leaf.l && leaf.l[cp]) {
      if (leaf.c) {
        referencedCodePoints = leaf.c;
        entityCodePointsCount = consumedCount;
        if (cp === $.SEMICOLON) {
          semicolonTerminated = true;
          break;
        }
      }
    }
    if (referencedCodePoints) {
      if (!semicolonTerminated) {
        this._unconsumeSeveral(consumedCount - entityCodePointsCount);
        if (inAttr) {
          var nextCp = this._lookahead();
          if (nextCp === $.EQUALS_SIGN || isAsciiAlphaNumeric(nextCp)) {
            this._unconsumeSeveral(entityCodePointsCount);
            return null;
          }
        }
      }
      return referencedCodePoints;
    }
    this._unconsumeSeveral(consumedCount);
    return null;
  };
  Tokenizer.prototype._consumeCharacterReference = function(startCp, inAttr) {
    if (this.disableEntitiesDecoding || isWhitespace(startCp) || startCp === $.GREATER_THAN_SIGN || startCp === $.AMPERSAND || startCp === this.additionalAllowedCp || startCp === $.EOF) {
      this._unconsume();
      return null;
    } else if (startCp === $.NUMBER_SIGN) {
      var isHex = false,
          nextCp = this._lookahead();
      if (nextCp === $.LATIN_SMALL_X || nextCp === $.LATIN_CAPITAL_X) {
        this._consume();
        isHex = true;
      }
      nextCp = this._lookahead();
      if (nextCp !== $.EOF && isDigit(nextCp, isHex))
        return [this._consumeNumericEntity(isHex)];
      else {
        this._unconsumeSeveral(isHex ? 2 : 1);
        return null;
      }
    } else
      return this._consumeNamedEntity(startCp, inAttr);
  };
  var _ = Tokenizer.prototype;
  _[DATA_STATE] = function dataState(cp) {
    if (cp === $.AMPERSAND)
      this.state = CHARACTER_REFERENCE_IN_DATA_STATE;
    else if (cp === $.LESS_THAN_SIGN)
      this.state = TAG_OPEN_STATE;
    else if (cp === $.NULL)
      this._emitCodePoint(cp);
    else if (cp === $.EOF)
      this._emitEOFToken();
    else
      this._emitCodePoint(cp);
  };
  _[CHARACTER_REFERENCE_IN_DATA_STATE] = function characterReferenceInDataState(cp) {
    this.state = DATA_STATE;
    this.additionalAllowedCp = void 0;
    var referencedCodePoints = this._consumeCharacterReference(cp, false);
    if (referencedCodePoints)
      this._emitSeveralCodePoints(referencedCodePoints);
    else
      this._emitChar('&');
  };
  _[RCDATA_STATE] = function rcdataState(cp) {
    if (cp === $.AMPERSAND)
      this.state = CHARACTER_REFERENCE_IN_RCDATA_STATE;
    else if (cp === $.LESS_THAN_SIGN)
      this.state = RCDATA_LESS_THAN_SIGN_STATE;
    else if (cp === $.NULL)
      this._emitChar(UNICODE.REPLACEMENT_CHARACTER);
    else if (cp === $.EOF)
      this._emitEOFToken();
    else
      this._emitCodePoint(cp);
  };
  _[CHARACTER_REFERENCE_IN_RCDATA_STATE] = function characterReferenceInRcdataState(cp) {
    this.state = RCDATA_STATE;
    this.additionalAllowedCp = void 0;
    var referencedCodePoints = this._consumeCharacterReference(cp, false);
    if (referencedCodePoints)
      this._emitSeveralCodePoints(referencedCodePoints);
    else
      this._emitChar('&');
  };
  _[RAWTEXT_STATE] = function rawtextState(cp) {
    if (cp === $.LESS_THAN_SIGN)
      this.state = RAWTEXT_LESS_THAN_SIGN_STATE;
    else if (cp === $.NULL)
      this._emitChar(UNICODE.REPLACEMENT_CHARACTER);
    else if (cp === $.EOF)
      this._emitEOFToken();
    else
      this._emitCodePoint(cp);
  };
  _[SCRIPT_DATA_STATE] = function scriptDataState(cp) {
    if (cp === $.LESS_THAN_SIGN)
      this.state = SCRIPT_DATA_LESS_THAN_SIGN_STATE;
    else if (cp === $.NULL)
      this._emitChar(UNICODE.REPLACEMENT_CHARACTER);
    else if (cp === $.EOF)
      this._emitEOFToken();
    else
      this._emitCodePoint(cp);
  };
  _[PLAINTEXT_STATE] = function plaintextState(cp) {
    if (cp === $.NULL)
      this._emitChar(UNICODE.REPLACEMENT_CHARACTER);
    else if (cp === $.EOF)
      this._emitEOFToken();
    else
      this._emitCodePoint(cp);
  };
  _[TAG_OPEN_STATE] = function tagOpenState(cp) {
    if (cp === $.EXCLAMATION_MARK)
      this.state = MARKUP_DECLARATION_OPEN_STATE;
    else if (cp === $.SOLIDUS)
      this.state = END_TAG_OPEN_STATE;
    else if (isAsciiUpper(cp)) {
      this._createStartTagToken(toAsciiLowerChar(cp));
      this.state = TAG_NAME_STATE;
    } else if (isAsciiLower(cp)) {
      this._createStartTagToken(toChar(cp));
      this.state = TAG_NAME_STATE;
    } else if (cp === $.QUESTION_MARK) {
      this[BOGUS_COMMENT_STATE](cp);
    } else {
      this._emitChar('<');
      this._reconsumeInState(DATA_STATE);
    }
  };
  _[END_TAG_OPEN_STATE] = function endTagOpenState(cp) {
    if (isAsciiUpper(cp)) {
      this._createEndTagToken(toAsciiLowerChar(cp));
      this.state = TAG_NAME_STATE;
    } else if (isAsciiLower(cp)) {
      this._createEndTagToken(toChar(cp));
      this.state = TAG_NAME_STATE;
    } else if (cp === $.GREATER_THAN_SIGN)
      this.state = DATA_STATE;
    else if (cp === $.EOF) {
      this._reconsumeInState(DATA_STATE);
      this._emitChar('<');
      this._emitChar('/');
    } else {
      this[BOGUS_COMMENT_STATE](cp);
    }
  };
  _[TAG_NAME_STATE] = function tagNameState(cp) {
    if (isWhitespace(cp))
      this.state = BEFORE_ATTRIBUTE_NAME_STATE;
    else if (cp === $.SOLIDUS)
      this.state = SELF_CLOSING_START_TAG_STATE;
    else if (cp === $.GREATER_THAN_SIGN) {
      this.state = DATA_STATE;
      this._emitCurrentToken();
    } else if (isAsciiUpper(cp))
      this.currentToken.tagName += toAsciiLowerChar(cp);
    else if (cp === $.NULL)
      this.currentToken.tagName += UNICODE.REPLACEMENT_CHARACTER;
    else if (cp === $.EOF)
      this._reconsumeInState(DATA_STATE);
    else
      this.currentToken.tagName += toChar(cp);
  };
  _[RCDATA_LESS_THAN_SIGN_STATE] = function rcdataLessThanSignState(cp) {
    if (cp === $.SOLIDUS) {
      this.tempBuff = [];
      this.state = RCDATA_END_TAG_OPEN_STATE;
    } else {
      this._emitChar('<');
      this._reconsumeInState(RCDATA_STATE);
    }
  };
  _[RCDATA_END_TAG_OPEN_STATE] = function rcdataEndTagOpenState(cp) {
    if (isAsciiUpper(cp)) {
      this._createEndTagToken(toAsciiLowerChar(cp));
      this.tempBuff.push(cp);
      this.state = RCDATA_END_TAG_NAME_STATE;
    } else if (isAsciiLower(cp)) {
      this._createEndTagToken(toChar(cp));
      this.tempBuff.push(cp);
      this.state = RCDATA_END_TAG_NAME_STATE;
    } else {
      this._emitChar('<');
      this._emitChar('/');
      this._reconsumeInState(RCDATA_STATE);
    }
  };
  _[RCDATA_END_TAG_NAME_STATE] = function rcdataEndTagNameState(cp) {
    if (isAsciiUpper(cp)) {
      this.currentToken.tagName += toAsciiLowerChar(cp);
      this.tempBuff.push(cp);
    } else if (isAsciiLower(cp)) {
      this.currentToken.tagName += toChar(cp);
      this.tempBuff.push(cp);
    } else {
      if (this._isAppropriateEndTagToken()) {
        if (isWhitespace(cp)) {
          this.state = BEFORE_ATTRIBUTE_NAME_STATE;
          return;
        }
        if (cp === $.SOLIDUS) {
          this.state = SELF_CLOSING_START_TAG_STATE;
          return;
        }
        if (cp === $.GREATER_THAN_SIGN) {
          this.state = DATA_STATE;
          this._emitCurrentToken();
          return;
        }
      }
      this._emitChar('<');
      this._emitChar('/');
      this._emitSeveralCodePoints(this.tempBuff);
      this._reconsumeInState(RCDATA_STATE);
    }
  };
  _[RAWTEXT_LESS_THAN_SIGN_STATE] = function rawtextLessThanSignState(cp) {
    if (cp === $.SOLIDUS) {
      this.tempBuff = [];
      this.state = RAWTEXT_END_TAG_OPEN_STATE;
    } else {
      this._emitChar('<');
      this._reconsumeInState(RAWTEXT_STATE);
    }
  };
  _[RAWTEXT_END_TAG_OPEN_STATE] = function rawtextEndTagOpenState(cp) {
    if (isAsciiUpper(cp)) {
      this._createEndTagToken(toAsciiLowerChar(cp));
      this.tempBuff.push(cp);
      this.state = RAWTEXT_END_TAG_NAME_STATE;
    } else if (isAsciiLower(cp)) {
      this._createEndTagToken(toChar(cp));
      this.tempBuff.push(cp);
      this.state = RAWTEXT_END_TAG_NAME_STATE;
    } else {
      this._emitChar('<');
      this._emitChar('/');
      this._reconsumeInState(RAWTEXT_STATE);
    }
  };
  _[RAWTEXT_END_TAG_NAME_STATE] = function rawtextEndTagNameState(cp) {
    if (isAsciiUpper(cp)) {
      this.currentToken.tagName += toAsciiLowerChar(cp);
      this.tempBuff.push(cp);
    } else if (isAsciiLower(cp)) {
      this.currentToken.tagName += toChar(cp);
      this.tempBuff.push(cp);
    } else {
      if (this._isAppropriateEndTagToken()) {
        if (isWhitespace(cp)) {
          this.state = BEFORE_ATTRIBUTE_NAME_STATE;
          return;
        }
        if (cp === $.SOLIDUS) {
          this.state = SELF_CLOSING_START_TAG_STATE;
          return;
        }
        if (cp === $.GREATER_THAN_SIGN) {
          this._emitCurrentToken();
          this.state = DATA_STATE;
          return;
        }
      }
      this._emitChar('<');
      this._emitChar('/');
      this._emitSeveralCodePoints(this.tempBuff);
      this._reconsumeInState(RAWTEXT_STATE);
    }
  };
  _[SCRIPT_DATA_LESS_THAN_SIGN_STATE] = function scriptDataLessThanSignState(cp) {
    if (cp === $.SOLIDUS) {
      this.tempBuff = [];
      this.state = SCRIPT_DATA_END_TAG_OPEN_STATE;
    } else if (cp === $.EXCLAMATION_MARK) {
      this.state = SCRIPT_DATA_ESCAPE_START_STATE;
      this._emitChar('<');
      this._emitChar('!');
    } else {
      this._emitChar('<');
      this._reconsumeInState(SCRIPT_DATA_STATE);
    }
  };
  _[SCRIPT_DATA_END_TAG_OPEN_STATE] = function scriptDataEndTagOpenState(cp) {
    if (isAsciiUpper(cp)) {
      this._createEndTagToken(toAsciiLowerChar(cp));
      this.tempBuff.push(cp);
      this.state = SCRIPT_DATA_END_TAG_NAME_STATE;
    } else if (isAsciiLower(cp)) {
      this._createEndTagToken(toChar(cp));
      this.tempBuff.push(cp);
      this.state = SCRIPT_DATA_END_TAG_NAME_STATE;
    } else {
      this._emitChar('<');
      this._emitChar('/');
      this._reconsumeInState(SCRIPT_DATA_STATE);
    }
  };
  _[SCRIPT_DATA_END_TAG_NAME_STATE] = function scriptDataEndTagNameState(cp) {
    if (isAsciiUpper(cp)) {
      this.currentToken.tagName += toAsciiLowerChar(cp);
      this.tempBuff.push(cp);
    } else if (isAsciiLower(cp)) {
      this.currentToken.tagName += toChar(cp);
      this.tempBuff.push(cp);
    } else {
      if (this._isAppropriateEndTagToken()) {
        if (isWhitespace(cp)) {
          this.state = BEFORE_ATTRIBUTE_NAME_STATE;
          return;
        } else if (cp === $.SOLIDUS) {
          this.state = SELF_CLOSING_START_TAG_STATE;
          return;
        } else if (cp === $.GREATER_THAN_SIGN) {
          this._emitCurrentToken();
          this.state = DATA_STATE;
          return;
        }
      }
      this._emitChar('<');
      this._emitChar('/');
      this._emitSeveralCodePoints(this.tempBuff);
      this._reconsumeInState(SCRIPT_DATA_STATE);
    }
  };
  _[SCRIPT_DATA_ESCAPE_START_STATE] = function scriptDataEscapeStartState(cp) {
    if (cp === $.HYPHEN_MINUS) {
      this.state = SCRIPT_DATA_ESCAPE_START_DASH_STATE;
      this._emitChar('-');
    } else
      this._reconsumeInState(SCRIPT_DATA_STATE);
  };
  _[SCRIPT_DATA_ESCAPE_START_DASH_STATE] = function scriptDataEscapeStartDashState(cp) {
    if (cp === $.HYPHEN_MINUS) {
      this.state = SCRIPT_DATA_ESCAPED_DASH_DASH_STATE;
      this._emitChar('-');
    } else
      this._reconsumeInState(SCRIPT_DATA_STATE);
  };
  _[SCRIPT_DATA_ESCAPED_STATE] = function scriptDataEscapedState(cp) {
    if (cp === $.HYPHEN_MINUS) {
      this.state = SCRIPT_DATA_ESCAPED_DASH_STATE;
      this._emitChar('-');
    } else if (cp === $.LESS_THAN_SIGN)
      this.state = SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN_STATE;
    else if (cp === $.NULL)
      this._emitChar(UNICODE.REPLACEMENT_CHARACTER);
    else if (cp === $.EOF)
      this._reconsumeInState(DATA_STATE);
    else
      this._emitCodePoint(cp);
  };
  _[SCRIPT_DATA_ESCAPED_DASH_STATE] = function scriptDataEscapedDashState(cp) {
    if (cp === $.HYPHEN_MINUS) {
      this.state = SCRIPT_DATA_ESCAPED_DASH_DASH_STATE;
      this._emitChar('-');
    } else if (cp === $.LESS_THAN_SIGN)
      this.state = SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN_STATE;
    else if (cp === $.NULL) {
      this.state = SCRIPT_DATA_ESCAPED_STATE;
      this._emitChar(UNICODE.REPLACEMENT_CHARACTER);
    } else if (cp === $.EOF)
      this._reconsumeInState(DATA_STATE);
    else {
      this.state = SCRIPT_DATA_ESCAPED_STATE;
      this._emitCodePoint(cp);
    }
  };
  _[SCRIPT_DATA_ESCAPED_DASH_DASH_STATE] = function scriptDataEscapedDashDashState(cp) {
    if (cp === $.HYPHEN_MINUS)
      this._emitChar('-');
    else if (cp === $.LESS_THAN_SIGN)
      this.state = SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN_STATE;
    else if (cp === $.GREATER_THAN_SIGN) {
      this.state = SCRIPT_DATA_STATE;
      this._emitChar('>');
    } else if (cp === $.NULL) {
      this.state = SCRIPT_DATA_ESCAPED_STATE;
      this._emitChar(UNICODE.REPLACEMENT_CHARACTER);
    } else if (cp === $.EOF)
      this._reconsumeInState(DATA_STATE);
    else {
      this.state = SCRIPT_DATA_ESCAPED_STATE;
      this._emitCodePoint(cp);
    }
  };
  _[SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN_STATE] = function scriptDataEscapedLessThanSignState(cp) {
    if (cp === $.SOLIDUS) {
      this.tempBuff = [];
      this.state = SCRIPT_DATA_ESCAPED_END_TAG_OPEN_STATE;
    } else if (isAsciiUpper(cp)) {
      this.tempBuff = [];
      this.tempBuff.push(toAsciiLowerCodePoint(cp));
      this.state = SCRIPT_DATA_DOUBLE_ESCAPE_START_STATE;
      this._emitChar('<');
      this._emitCodePoint(cp);
    } else if (isAsciiLower(cp)) {
      this.tempBuff = [];
      this.tempBuff.push(cp);
      this.state = SCRIPT_DATA_DOUBLE_ESCAPE_START_STATE;
      this._emitChar('<');
      this._emitCodePoint(cp);
    } else {
      this._emitChar('<');
      this._reconsumeInState(SCRIPT_DATA_ESCAPED_STATE);
    }
  };
  _[SCRIPT_DATA_ESCAPED_END_TAG_OPEN_STATE] = function scriptDataEscapedEndTagOpenState(cp) {
    if (isAsciiUpper(cp)) {
      this._createEndTagToken(toAsciiLowerChar(cp));
      this.tempBuff.push(cp);
      this.state = SCRIPT_DATA_ESCAPED_END_TAG_NAME_STATE;
    } else if (isAsciiLower(cp)) {
      this._createEndTagToken(toChar(cp));
      this.tempBuff.push(cp);
      this.state = SCRIPT_DATA_ESCAPED_END_TAG_NAME_STATE;
    } else {
      this._emitChar('<');
      this._emitChar('/');
      this._reconsumeInState(SCRIPT_DATA_ESCAPED_STATE);
    }
  };
  _[SCRIPT_DATA_ESCAPED_END_TAG_NAME_STATE] = function scriptDataEscapedEndTagNameState(cp) {
    if (isAsciiUpper(cp)) {
      this.currentToken.tagName += toAsciiLowerChar(cp);
      this.tempBuff.push(cp);
    } else if (isAsciiLower(cp)) {
      this.currentToken.tagName += toChar(cp);
      this.tempBuff.push(cp);
    } else {
      if (this._isAppropriateEndTagToken()) {
        if (isWhitespace(cp)) {
          this.state = BEFORE_ATTRIBUTE_NAME_STATE;
          return;
        }
        if (cp === $.SOLIDUS) {
          this.state = SELF_CLOSING_START_TAG_STATE;
          return;
        }
        if (cp === $.GREATER_THAN_SIGN) {
          this._emitCurrentToken();
          this.state = DATA_STATE;
          return;
        }
      }
      this._emitChar('<');
      this._emitChar('/');
      this._emitSeveralCodePoints(this.tempBuff);
      this._reconsumeInState(SCRIPT_DATA_ESCAPED_STATE);
    }
  };
  _[SCRIPT_DATA_DOUBLE_ESCAPE_START_STATE] = function scriptDataDoubleEscapeStartState(cp) {
    if (isWhitespace(cp) || cp === $.SOLIDUS || cp === $.GREATER_THAN_SIGN) {
      this.state = this.isTempBufferEqualToScriptString() ? SCRIPT_DATA_DOUBLE_ESCAPED_STATE : SCRIPT_DATA_ESCAPED_STATE;
      this._emitCodePoint(cp);
    } else if (isAsciiUpper(cp)) {
      this.tempBuff.push(toAsciiLowerCodePoint(cp));
      this._emitCodePoint(cp);
    } else if (isAsciiLower(cp)) {
      this.tempBuff.push(cp);
      this._emitCodePoint(cp);
    } else
      this._reconsumeInState(SCRIPT_DATA_ESCAPED_STATE);
  };
  _[SCRIPT_DATA_DOUBLE_ESCAPED_STATE] = function scriptDataDoubleEscapedState(cp) {
    if (cp === $.HYPHEN_MINUS) {
      this.state = SCRIPT_DATA_DOUBLE_ESCAPED_DASH_STATE;
      this._emitChar('-');
    } else if (cp === $.LESS_THAN_SIGN) {
      this.state = SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN_STATE;
      this._emitChar('<');
    } else if (cp === $.NULL)
      this._emitChar(UNICODE.REPLACEMENT_CHARACTER);
    else if (cp === $.EOF)
      this._reconsumeInState(DATA_STATE);
    else
      this._emitCodePoint(cp);
  };
  _[SCRIPT_DATA_DOUBLE_ESCAPED_DASH_STATE] = function scriptDataDoubleEscapedDashState(cp) {
    if (cp === $.HYPHEN_MINUS) {
      this.state = SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH_STATE;
      this._emitChar('-');
    } else if (cp === $.LESS_THAN_SIGN) {
      this.state = SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN_STATE;
      this._emitChar('<');
    } else if (cp === $.NULL) {
      this.state = SCRIPT_DATA_DOUBLE_ESCAPED_STATE;
      this._emitChar(UNICODE.REPLACEMENT_CHARACTER);
    } else if (cp === $.EOF)
      this._reconsumeInState(DATA_STATE);
    else {
      this.state = SCRIPT_DATA_DOUBLE_ESCAPED_STATE;
      this._emitCodePoint(cp);
    }
  };
  _[SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH_STATE] = function scriptDataDoubleEscapedDashDashState(cp) {
    if (cp === $.HYPHEN_MINUS)
      this._emitChar('-');
    else if (cp === $.LESS_THAN_SIGN) {
      this.state = SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN_STATE;
      this._emitChar('<');
    } else if (cp === $.GREATER_THAN_SIGN) {
      this.state = SCRIPT_DATA_STATE;
      this._emitChar('>');
    } else if (cp === $.NULL) {
      this.state = SCRIPT_DATA_DOUBLE_ESCAPED_STATE;
      this._emitChar(UNICODE.REPLACEMENT_CHARACTER);
    } else if (cp === $.EOF)
      this._reconsumeInState(DATA_STATE);
    else {
      this.state = SCRIPT_DATA_DOUBLE_ESCAPED_STATE;
      this._emitCodePoint(cp);
    }
  };
  _[SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN_STATE] = function scriptDataDoubleEscapedLessThanSignState(cp) {
    if (cp === $.SOLIDUS) {
      this.tempBuff = [];
      this.state = SCRIPT_DATA_DOUBLE_ESCAPE_END_STATE;
      this._emitChar('/');
    } else
      this._reconsumeInState(SCRIPT_DATA_DOUBLE_ESCAPED_STATE);
  };
  _[SCRIPT_DATA_DOUBLE_ESCAPE_END_STATE] = function scriptDataDoubleEscapeEndState(cp) {
    if (isWhitespace(cp) || cp === $.SOLIDUS || cp === $.GREATER_THAN_SIGN) {
      this.state = this.isTempBufferEqualToScriptString() ? SCRIPT_DATA_ESCAPED_STATE : SCRIPT_DATA_DOUBLE_ESCAPED_STATE;
      this._emitCodePoint(cp);
    } else if (isAsciiUpper(cp)) {
      this.tempBuff.push(toAsciiLowerCodePoint(cp));
      this._emitCodePoint(cp);
    } else if (isAsciiLower(cp)) {
      this.tempBuff.push(cp);
      this._emitCodePoint(cp);
    } else
      this._reconsumeInState(SCRIPT_DATA_DOUBLE_ESCAPED_STATE);
  };
  _[BEFORE_ATTRIBUTE_NAME_STATE] = function beforeAttributeNameState(cp) {
    if (isWhitespace(cp))
      return;
    if (cp === $.SOLIDUS)
      this.state = SELF_CLOSING_START_TAG_STATE;
    else if (cp === $.GREATER_THAN_SIGN) {
      this.state = DATA_STATE;
      this._emitCurrentToken();
    } else if (isAsciiUpper(cp)) {
      this._createAttr(toAsciiLowerChar(cp));
      this.state = ATTRIBUTE_NAME_STATE;
    } else if (cp === $.NULL) {
      this._createAttr(UNICODE.REPLACEMENT_CHARACTER);
      this.state = ATTRIBUTE_NAME_STATE;
    } else if (cp === $.QUOTATION_MARK || cp === $.APOSTROPHE || cp === $.LESS_THAN_SIGN || cp === $.EQUALS_SIGN) {
      this._createAttr(toChar(cp));
      this.state = ATTRIBUTE_NAME_STATE;
    } else if (cp === $.EOF)
      this._reconsumeInState(DATA_STATE);
    else {
      this._createAttr(toChar(cp));
      this.state = ATTRIBUTE_NAME_STATE;
    }
  };
  _[ATTRIBUTE_NAME_STATE] = function attributeNameState(cp) {
    if (isWhitespace(cp))
      this._leaveAttrName(AFTER_ATTRIBUTE_NAME_STATE);
    else if (cp === $.SOLIDUS)
      this._leaveAttrName(SELF_CLOSING_START_TAG_STATE);
    else if (cp === $.EQUALS_SIGN)
      this._leaveAttrName(BEFORE_ATTRIBUTE_VALUE_STATE);
    else if (cp === $.GREATER_THAN_SIGN) {
      this._leaveAttrName(DATA_STATE);
      this._emitCurrentToken();
    } else if (isAsciiUpper(cp))
      this.currentAttr.name += toAsciiLowerChar(cp);
    else if (cp === $.QUOTATION_MARK || cp === $.APOSTROPHE || cp === $.LESS_THAN_SIGN)
      this.currentAttr.name += toChar(cp);
    else if (cp === $.NULL)
      this.currentAttr.name += UNICODE.REPLACEMENT_CHARACTER;
    else if (cp === $.EOF)
      this._reconsumeInState(DATA_STATE);
    else
      this.currentAttr.name += toChar(cp);
  };
  _[AFTER_ATTRIBUTE_NAME_STATE] = function afterAttributeNameState(cp) {
    if (isWhitespace(cp))
      return;
    if (cp === $.SOLIDUS)
      this.state = SELF_CLOSING_START_TAG_STATE;
    else if (cp === $.EQUALS_SIGN)
      this.state = BEFORE_ATTRIBUTE_VALUE_STATE;
    else if (cp === $.GREATER_THAN_SIGN) {
      this.state = DATA_STATE;
      this._emitCurrentToken();
    } else if (isAsciiUpper(cp)) {
      this._createAttr(toAsciiLowerChar(cp));
      this.state = ATTRIBUTE_NAME_STATE;
    } else if (cp === $.NULL) {
      this._createAttr(UNICODE.REPLACEMENT_CHARACTER);
      this.state = ATTRIBUTE_NAME_STATE;
    } else if (cp === $.QUOTATION_MARK || cp === $.APOSTROPHE || cp === $.LESS_THAN_SIGN) {
      this._createAttr(toChar(cp));
      this.state = ATTRIBUTE_NAME_STATE;
    } else if (cp === $.EOF)
      this._reconsumeInState(DATA_STATE);
    else {
      this._createAttr(toChar(cp));
      this.state = ATTRIBUTE_NAME_STATE;
    }
  };
  _[BEFORE_ATTRIBUTE_VALUE_STATE] = function beforeAttributeValueState(cp) {
    if (isWhitespace(cp))
      return;
    if (cp === $.QUOTATION_MARK)
      this.state = ATTRIBUTE_VALUE_DOUBLE_QUOTED_STATE;
    else if (cp === $.AMPERSAND)
      this._reconsumeInState(ATTRIBUTE_VALUE_UNQUOTED_STATE);
    else if (cp === $.APOSTROPHE)
      this.state = ATTRIBUTE_VALUE_SINGLE_QUOTED_STATE;
    else if (cp === $.NULL) {
      this.currentAttr.value += UNICODE.REPLACEMENT_CHARACTER;
      this.state = ATTRIBUTE_VALUE_UNQUOTED_STATE;
    } else if (cp === $.GREATER_THAN_SIGN) {
      this.state = DATA_STATE;
      this._emitCurrentToken();
    } else if (cp === $.LESS_THAN_SIGN || cp === $.EQUALS_SIGN || cp === $.GRAVE_ACCENT) {
      this.currentAttr.value += toChar(cp);
      this.state = ATTRIBUTE_VALUE_UNQUOTED_STATE;
    } else if (cp === $.EOF)
      this._reconsumeInState(DATA_STATE);
    else {
      this.currentAttr.value += toChar(cp);
      this.state = ATTRIBUTE_VALUE_UNQUOTED_STATE;
    }
  };
  _[ATTRIBUTE_VALUE_DOUBLE_QUOTED_STATE] = function attributeValueDoubleQuotedState(cp) {
    if (cp === $.QUOTATION_MARK)
      this.state = AFTER_ATTRIBUTE_VALUE_QUOTED_STATE;
    else if (cp === $.AMPERSAND) {
      this.additionalAllowedCp = $.QUOTATION_MARK;
      this.returnState = this.state;
      this.state = CHARACTER_REFERENCE_IN_ATTRIBUTE_VALUE_STATE;
    } else if (cp === $.NULL)
      this.currentAttr.value += UNICODE.REPLACEMENT_CHARACTER;
    else if (cp === $.EOF)
      this._reconsumeInState(DATA_STATE);
    else
      this.currentAttr.value += toChar(cp);
  };
  _[ATTRIBUTE_VALUE_SINGLE_QUOTED_STATE] = function attributeValueSingleQuotedState(cp) {
    if (cp === $.APOSTROPHE)
      this.state = AFTER_ATTRIBUTE_VALUE_QUOTED_STATE;
    else if (cp === $.AMPERSAND) {
      this.additionalAllowedCp = $.APOSTROPHE;
      this.returnState = this.state;
      this.state = CHARACTER_REFERENCE_IN_ATTRIBUTE_VALUE_STATE;
    } else if (cp === $.NULL)
      this.currentAttr.value += UNICODE.REPLACEMENT_CHARACTER;
    else if (cp === $.EOF)
      this._reconsumeInState(DATA_STATE);
    else
      this.currentAttr.value += toChar(cp);
  };
  _[ATTRIBUTE_VALUE_UNQUOTED_STATE] = function attributeValueUnquotedState(cp) {
    if (isWhitespace(cp))
      this.state = BEFORE_ATTRIBUTE_NAME_STATE;
    else if (cp === $.AMPERSAND) {
      this.additionalAllowedCp = $.GREATER_THAN_SIGN;
      this.returnState = this.state;
      this.state = CHARACTER_REFERENCE_IN_ATTRIBUTE_VALUE_STATE;
    } else if (cp === $.GREATER_THAN_SIGN) {
      this.state = DATA_STATE;
      this._emitCurrentToken();
    } else if (cp === $.NULL)
      this.currentAttr.value += UNICODE.REPLACEMENT_CHARACTER;
    else if (cp === $.QUOTATION_MARK || cp === $.APOSTROPHE || cp === $.LESS_THAN_SIGN || cp === $.EQUALS_SIGN || cp === $.GRAVE_ACCENT) {
      this.currentAttr.value += toChar(cp);
    } else if (cp === $.EOF)
      this._reconsumeInState(DATA_STATE);
    else
      this.currentAttr.value += toChar(cp);
  };
  _[CHARACTER_REFERENCE_IN_ATTRIBUTE_VALUE_STATE] = function characterReferenceInAttributeValueState(cp) {
    var referencedCodePoints = this._consumeCharacterReference(cp, true);
    if (referencedCodePoints) {
      for (var i = 0; i < referencedCodePoints.length; i++)
        this.currentAttr.value += toChar(referencedCodePoints[i]);
    } else
      this.currentAttr.value += '&';
    this.state = this.returnState;
  };
  _[AFTER_ATTRIBUTE_VALUE_QUOTED_STATE] = function afterAttributeValueQuotedState(cp) {
    if (isWhitespace(cp))
      this.state = BEFORE_ATTRIBUTE_NAME_STATE;
    else if (cp === $.SOLIDUS)
      this.state = SELF_CLOSING_START_TAG_STATE;
    else if (cp === $.GREATER_THAN_SIGN) {
      this.state = DATA_STATE;
      this._emitCurrentToken();
    } else if (cp === $.EOF)
      this._reconsumeInState(DATA_STATE);
    else
      this._reconsumeInState(BEFORE_ATTRIBUTE_NAME_STATE);
  };
  _[SELF_CLOSING_START_TAG_STATE] = function selfClosingStartTagState(cp) {
    if (cp === $.GREATER_THAN_SIGN) {
      this.currentToken.selfClosing = true;
      this.state = DATA_STATE;
      this._emitCurrentToken();
    } else if (cp === $.EOF)
      this._reconsumeInState(DATA_STATE);
    else
      this._reconsumeInState(BEFORE_ATTRIBUTE_NAME_STATE);
  };
  _[BOGUS_COMMENT_STATE] = function bogusCommentState(cp) {
    this._createCommentToken();
    while (true) {
      if (cp === $.GREATER_THAN_SIGN) {
        this.state = DATA_STATE;
        break;
      } else if (cp === $.EOF) {
        this._reconsumeInState(DATA_STATE);
        break;
      } else {
        this.currentToken.data += cp === $.NULL ? UNICODE.REPLACEMENT_CHARACTER : toChar(cp);
        cp = this._consume();
      }
    }
    this._emitCurrentToken();
  };
  _[MARKUP_DECLARATION_OPEN_STATE] = function markupDeclarationOpenState(cp) {
    if (this._consumeSubsequentIfMatch($$.DASH_DASH_STRING, cp, true)) {
      this._createCommentToken();
      this.state = COMMENT_START_STATE;
    } else if (this._consumeSubsequentIfMatch($$.DOCTYPE_STRING, cp, false))
      this.state = DOCTYPE_STATE;
    else if (this.allowCDATA && this._consumeSubsequentIfMatch($$.CDATA_START_STRING, cp, true))
      this.state = CDATA_SECTION_STATE;
    else {
      this[BOGUS_COMMENT_STATE](cp);
    }
  };
  _[COMMENT_START_STATE] = function commentStartState(cp) {
    if (cp === $.HYPHEN_MINUS)
      this.state = COMMENT_START_DASH_STATE;
    else if (cp === $.NULL) {
      this.currentToken.data += UNICODE.REPLACEMENT_CHARACTER;
      this.state = COMMENT_STATE;
    } else if (cp === $.GREATER_THAN_SIGN) {
      this.state = DATA_STATE;
      this._emitCurrentToken();
    } else if (cp === $.EOF) {
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else {
      this.currentToken.data += toChar(cp);
      this.state = COMMENT_STATE;
    }
  };
  _[COMMENT_START_DASH_STATE] = function commentStartDashState(cp) {
    if (cp === $.HYPHEN_MINUS)
      this.state = COMMENT_END_STATE;
    else if (cp === $.NULL) {
      this.currentToken.data += '-';
      this.currentToken.data += UNICODE.REPLACEMENT_CHARACTER;
      this.state = COMMENT_STATE;
    } else if (cp === $.GREATER_THAN_SIGN) {
      this.state = DATA_STATE;
      this._emitCurrentToken();
    } else if (cp === $.EOF) {
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else {
      this.currentToken.data += '-';
      this.currentToken.data += toChar(cp);
      this.state = COMMENT_STATE;
    }
  };
  _[COMMENT_STATE] = function commentState(cp) {
    if (cp === $.HYPHEN_MINUS)
      this.state = COMMENT_END_DASH_STATE;
    else if (cp === $.NULL)
      this.currentToken.data += UNICODE.REPLACEMENT_CHARACTER;
    else if (cp === $.EOF) {
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else
      this.currentToken.data += toChar(cp);
  };
  _[COMMENT_END_DASH_STATE] = function commentEndDashState(cp) {
    if (cp === $.HYPHEN_MINUS)
      this.state = COMMENT_END_STATE;
    else if (cp === $.NULL) {
      this.currentToken.data += '-';
      this.currentToken.data += UNICODE.REPLACEMENT_CHARACTER;
      this.state = COMMENT_STATE;
    } else if (cp === $.EOF) {
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else {
      this.currentToken.data += '-';
      this.currentToken.data += toChar(cp);
      this.state = COMMENT_STATE;
    }
  };
  _[COMMENT_END_STATE] = function commentEndState(cp) {
    if (cp === $.GREATER_THAN_SIGN) {
      this.state = DATA_STATE;
      this._emitCurrentToken();
    } else if (cp === $.EXCLAMATION_MARK)
      this.state = COMMENT_END_BANG_STATE;
    else if (cp === $.HYPHEN_MINUS)
      this.currentToken.data += '-';
    else if (cp === $.NULL) {
      this.currentToken.data += '--';
      this.currentToken.data += UNICODE.REPLACEMENT_CHARACTER;
      this.state = COMMENT_STATE;
    } else if (cp === $.EOF) {
      this._reconsumeInState(DATA_STATE);
      this._emitCurrentToken();
    } else {
      this.currentToken.data += '--';
      this.currentToken.data += toChar(cp);
      this.state = COMMENT_STATE;
    }
  };
  _[COMMENT_END_BANG_STATE] = function commentEndBangState(cp) {
    if (cp === $.HYPHEN_MINUS) {
      this.currentToken.data += '--!';
      this.state = COMMENT_END_DASH_STATE;
    } else if (cp === $.GREATER_THAN_SIGN) {
      this.state = DATA_STATE;
      this._emitCurrentToken();
    } else if (cp === $.NULL) {
      this.currentToken.data += '--!';
      this.currentToken.data += UNICODE.REPLACEMENT_CHARACTER;
      this.state = COMMENT_STATE;
    } else if (cp === $.EOF) {
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else {
      this.currentToken.data += '--!';
      this.currentToken.data += toChar(cp);
      this.state = COMMENT_STATE;
    }
  };
  _[DOCTYPE_STATE] = function doctypeState(cp) {
    if (isWhitespace(cp))
      this.state = BEFORE_DOCTYPE_NAME_STATE;
    else if (cp === $.EOF) {
      this._createDoctypeToken();
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else
      this._reconsumeInState(BEFORE_DOCTYPE_NAME_STATE);
  };
  _[BEFORE_DOCTYPE_NAME_STATE] = function beforeDoctypeNameState(cp) {
    if (isWhitespace(cp))
      return;
    if (isAsciiUpper(cp)) {
      this._createDoctypeToken(toAsciiLowerChar(cp));
      this.state = DOCTYPE_NAME_STATE;
    } else if (cp === $.GREATER_THAN_SIGN) {
      this._createDoctypeToken();
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this.state = DATA_STATE;
    } else if (cp === $.EOF) {
      this._createDoctypeToken();
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else if (cp === $.NULL) {
      this._createDoctypeToken(UNICODE.REPLACEMENT_CHARACTER);
      this.state = DOCTYPE_NAME_STATE;
    } else {
      this._createDoctypeToken(toChar(cp));
      this.state = DOCTYPE_NAME_STATE;
    }
  };
  _[DOCTYPE_NAME_STATE] = function doctypeNameState(cp) {
    if (isWhitespace(cp))
      this.state = AFTER_DOCTYPE_NAME_STATE;
    else if (cp === $.GREATER_THAN_SIGN) {
      this._emitCurrentToken();
      this.state = DATA_STATE;
    } else if (isAsciiUpper(cp))
      this.currentToken.name += toAsciiLowerChar(cp);
    else if (cp === $.NULL)
      this.currentToken.name += UNICODE.REPLACEMENT_CHARACTER;
    else if (cp === $.EOF) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else
      this.currentToken.name += toChar(cp);
  };
  _[AFTER_DOCTYPE_NAME_STATE] = function afterDoctypeNameState(cp) {
    if (isWhitespace(cp))
      return;
    if (cp === $.GREATER_THAN_SIGN) {
      this.state = DATA_STATE;
      this._emitCurrentToken();
    } else if (cp === $.EOF) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else if (this._consumeSubsequentIfMatch($$.PUBLIC_STRING, cp, false))
      this.state = AFTER_DOCTYPE_PUBLIC_KEYWORD_STATE;
    else if (this._consumeSubsequentIfMatch($$.SYSTEM_STRING, cp, false))
      this.state = AFTER_DOCTYPE_SYSTEM_KEYWORD_STATE;
    else {
      this.currentToken.forceQuirks = true;
      this.state = BOGUS_DOCTYPE_STATE;
    }
  };
  _[AFTER_DOCTYPE_PUBLIC_KEYWORD_STATE] = function afterDoctypePublicKeywordState(cp) {
    if (isWhitespace(cp))
      this.state = BEFORE_DOCTYPE_PUBLIC_IDENTIFIER_STATE;
    else if (cp === $.QUOTATION_MARK) {
      this.currentToken.publicId = '';
      this.state = DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED_STATE;
    } else if (cp === $.APOSTROPHE) {
      this.currentToken.publicId = '';
      this.state = DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED_STATE;
    } else if (cp === $.GREATER_THAN_SIGN) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this.state = DATA_STATE;
    } else if (cp === $.EOF) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else {
      this.currentToken.forceQuirks = true;
      this.state = BOGUS_DOCTYPE_STATE;
    }
  };
  _[BEFORE_DOCTYPE_PUBLIC_IDENTIFIER_STATE] = function beforeDoctypePublicIdentifierState(cp) {
    if (isWhitespace(cp))
      return;
    if (cp === $.QUOTATION_MARK) {
      this.currentToken.publicId = '';
      this.state = DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED_STATE;
    } else if (cp === $.APOSTROPHE) {
      this.currentToken.publicId = '';
      this.state = DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED_STATE;
    } else if (cp === $.GREATER_THAN_SIGN) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this.state = DATA_STATE;
    } else if (cp === $.EOF) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else {
      this.currentToken.forceQuirks = true;
      this.state = BOGUS_DOCTYPE_STATE;
    }
  };
  _[DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED_STATE] = function doctypePublicIdentifierDoubleQuotedState(cp) {
    if (cp === $.QUOTATION_MARK)
      this.state = AFTER_DOCTYPE_PUBLIC_IDENTIFIER_STATE;
    else if (cp === $.NULL)
      this.currentToken.publicId += UNICODE.REPLACEMENT_CHARACTER;
    else if (cp === $.GREATER_THAN_SIGN) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this.state = DATA_STATE;
    } else if (cp === $.EOF) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else
      this.currentToken.publicId += toChar(cp);
  };
  _[DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED_STATE] = function doctypePublicIdentifierSingleQuotedState(cp) {
    if (cp === $.APOSTROPHE)
      this.state = AFTER_DOCTYPE_PUBLIC_IDENTIFIER_STATE;
    else if (cp === $.NULL)
      this.currentToken.publicId += UNICODE.REPLACEMENT_CHARACTER;
    else if (cp === $.GREATER_THAN_SIGN) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this.state = DATA_STATE;
    } else if (cp === $.EOF) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else
      this.currentToken.publicId += toChar(cp);
  };
  _[AFTER_DOCTYPE_PUBLIC_IDENTIFIER_STATE] = function afterDoctypePublicIdentifierState(cp) {
    if (isWhitespace(cp))
      this.state = BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS_STATE;
    else if (cp === $.GREATER_THAN_SIGN) {
      this._emitCurrentToken();
      this.state = DATA_STATE;
    } else if (cp === $.QUOTATION_MARK) {
      this.currentToken.systemId = '';
      this.state = DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE;
    } else if (cp === $.APOSTROPHE) {
      this.currentToken.systemId = '';
      this.state = DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE;
    } else if (cp === $.EOF) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else {
      this.currentToken.forceQuirks = true;
      this.state = BOGUS_DOCTYPE_STATE;
    }
  };
  _[BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS_STATE] = function betweenDoctypePublicAndSystemIdentifiersState(cp) {
    if (isWhitespace(cp))
      return;
    if (cp === $.GREATER_THAN_SIGN) {
      this._emitCurrentToken();
      this.state = DATA_STATE;
    } else if (cp === $.QUOTATION_MARK) {
      this.currentToken.systemId = '';
      this.state = DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE;
    } else if (cp === $.APOSTROPHE) {
      this.currentToken.systemId = '';
      this.state = DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE;
    } else if (cp === $.EOF) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else {
      this.currentToken.forceQuirks = true;
      this.state = BOGUS_DOCTYPE_STATE;
    }
  };
  _[AFTER_DOCTYPE_SYSTEM_KEYWORD_STATE] = function afterDoctypeSystemKeywordState(cp) {
    if (isWhitespace(cp))
      this.state = BEFORE_DOCTYPE_SYSTEM_IDENTIFIER_STATE;
    else if (cp === $.QUOTATION_MARK) {
      this.currentToken.systemId = '';
      this.state = DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE;
    } else if (cp === $.APOSTROPHE) {
      this.currentToken.systemId = '';
      this.state = DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE;
    } else if (cp === $.GREATER_THAN_SIGN) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this.state = DATA_STATE;
    } else if (cp === $.EOF) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else {
      this.currentToken.forceQuirks = true;
      this.state = BOGUS_DOCTYPE_STATE;
    }
  };
  _[BEFORE_DOCTYPE_SYSTEM_IDENTIFIER_STATE] = function beforeDoctypeSystemIdentifierState(cp) {
    if (isWhitespace(cp))
      return;
    if (cp === $.QUOTATION_MARK) {
      this.currentToken.systemId = '';
      this.state = DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE;
    } else if (cp === $.APOSTROPHE) {
      this.currentToken.systemId = '';
      this.state = DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE;
    } else if (cp === $.GREATER_THAN_SIGN) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this.state = DATA_STATE;
    } else if (cp === $.EOF) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else {
      this.currentToken.forceQuirks = true;
      this.state = BOGUS_DOCTYPE_STATE;
    }
  };
  _[DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE] = function doctypeSystemIdentifierDoubleQuotedState(cp) {
    if (cp === $.QUOTATION_MARK)
      this.state = AFTER_DOCTYPE_SYSTEM_IDENTIFIER_STATE;
    else if (cp === $.GREATER_THAN_SIGN) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this.state = DATA_STATE;
    } else if (cp === $.NULL)
      this.currentToken.systemId += UNICODE.REPLACEMENT_CHARACTER;
    else if (cp === $.EOF) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else
      this.currentToken.systemId += toChar(cp);
  };
  _[DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE] = function doctypeSystemIdentifierSingleQuotedState(cp) {
    if (cp === $.APOSTROPHE)
      this.state = AFTER_DOCTYPE_SYSTEM_IDENTIFIER_STATE;
    else if (cp === $.GREATER_THAN_SIGN) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this.state = DATA_STATE;
    } else if (cp === $.NULL)
      this.currentToken.systemId += UNICODE.REPLACEMENT_CHARACTER;
    else if (cp === $.EOF) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else
      this.currentToken.systemId += toChar(cp);
  };
  _[AFTER_DOCTYPE_SYSTEM_IDENTIFIER_STATE] = function afterDoctypeSystemIdentifierState(cp) {
    if (isWhitespace(cp))
      return;
    if (cp === $.GREATER_THAN_SIGN) {
      this._emitCurrentToken();
      this.state = DATA_STATE;
    } else if (cp === $.EOF) {
      this.currentToken.forceQuirks = true;
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    } else
      this.state = BOGUS_DOCTYPE_STATE;
  };
  _[BOGUS_DOCTYPE_STATE] = function bogusDoctypeState(cp) {
    if (cp === $.GREATER_THAN_SIGN) {
      this._emitCurrentToken();
      this.state = DATA_STATE;
    } else if (cp === $.EOF) {
      this._emitCurrentToken();
      this._reconsumeInState(DATA_STATE);
    }
  };
  _[CDATA_SECTION_STATE] = function cdataSectionState(cp) {
    while (true) {
      if (cp === $.EOF) {
        this._reconsumeInState(DATA_STATE);
        break;
      } else if (this._consumeSubsequentIfMatch($$.CDATA_END_STRING, cp, true)) {
        this.state = DATA_STATE;
        break;
      } else {
        this._emitCodePoint(cp);
        cp = this._consume();
      }
    }
  };
})(require('process'));
