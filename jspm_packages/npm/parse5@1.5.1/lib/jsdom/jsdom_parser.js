/* */ 
(function(process) {
  'use strict';
  var Parser = require('../tree_construction/parser'),
      ParsingUnit = require('./parsing_unit');
  exports.parseDocument = function(html, treeAdapter) {
    var parser = new Parser(treeAdapter),
        parsingUnit = new ParsingUnit(parser);
    parser._runParsingLoop = function() {
      parsingUnit.parsingLoopLock = true;
      while (!parsingUnit.suspended && !this.stopped)
        this._iterateParsingLoop();
      parsingUnit.parsingLoopLock = false;
      if (this.stopped)
        parsingUnit.callback(this.document);
    };
    process.nextTick(function() {
      parser.parse(html);
    });
    return parsingUnit;
  };
  exports.parseInnerHtml = function(innerHtml, contextElement, treeAdapter) {
    var parser = new Parser(treeAdapter);
    return parser.parseFragment(innerHtml, contextElement);
  };
})(require('process'));
