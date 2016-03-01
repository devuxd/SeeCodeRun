/* */ 
"format cjs";
if (typeof define !== 'function') {
  var define = require('amdefine')(module, require);
}
define(function(require, exports, module) {
  var util = require('./util');
  function SourceMapConsumer(aSourceMap) {
    var sourceMap = aSourceMap;
    if (typeof aSourceMap === 'string') {
      sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
    }
    if (sourceMap.sections != null) {
      var indexedSourceMapConsumer = require('./indexed-source-map-consumer');
      return new indexedSourceMapConsumer.IndexedSourceMapConsumer(sourceMap);
    } else {
      var basicSourceMapConsumer = require('./basic-source-map-consumer');
      return new basicSourceMapConsumer.BasicSourceMapConsumer(sourceMap);
    }
  }
  SourceMapConsumer.fromSourceMap = function(aSourceMap) {
    var basicSourceMapConsumer = require('./basic-source-map-consumer');
    return basicSourceMapConsumer.BasicSourceMapConsumer.fromSourceMap(aSourceMap);
  };
  SourceMapConsumer.prototype._version = 3;
  SourceMapConsumer.prototype.__generatedMappings = null;
  Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {get: function() {
      if (!this.__generatedMappings) {
        this.__generatedMappings = [];
        this.__originalMappings = [];
        this._parseMappings(this._mappings, this.sourceRoot);
      }
      return this.__generatedMappings;
    }});
  SourceMapConsumer.prototype.__originalMappings = null;
  Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {get: function() {
      if (!this.__originalMappings) {
        this.__generatedMappings = [];
        this.__originalMappings = [];
        this._parseMappings(this._mappings, this.sourceRoot);
      }
      return this.__originalMappings;
    }});
  SourceMapConsumer.prototype._nextCharIsMappingSeparator = function SourceMapConsumer_nextCharIsMappingSeparator(aStr) {
    var c = aStr.charAt(0);
    return c === ";" || c === ",";
  };
  SourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    throw new Error("Subclasses must implement _parseMappings");
  };
  SourceMapConsumer.GENERATED_ORDER = 1;
  SourceMapConsumer.ORIGINAL_ORDER = 2;
  SourceMapConsumer.prototype.eachMapping = function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
    var context = aContext || null;
    var order = aOrder || SourceMapConsumer.GENERATED_ORDER;
    var mappings;
    switch (order) {
      case SourceMapConsumer.GENERATED_ORDER:
        mappings = this._generatedMappings;
        break;
      case SourceMapConsumer.ORIGINAL_ORDER:
        mappings = this._originalMappings;
        break;
      default:
        throw new Error("Unknown order of iteration.");
    }
    var sourceRoot = this.sourceRoot;
    mappings.map(function(mapping) {
      var source = mapping.source;
      if (source != null && sourceRoot != null) {
        source = util.join(sourceRoot, source);
      }
      return {
        source: source,
        generatedLine: mapping.generatedLine,
        generatedColumn: mapping.generatedColumn,
        originalLine: mapping.originalLine,
        originalColumn: mapping.originalColumn,
        name: mapping.name
      };
    }).forEach(aCallback, context);
  };
  SourceMapConsumer.prototype.allGeneratedPositionsFor = function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
    var needle = {
      source: util.getArg(aArgs, 'source'),
      originalLine: util.getArg(aArgs, 'line'),
      originalColumn: Infinity
    };
    if (this.sourceRoot != null) {
      needle.source = util.relative(this.sourceRoot, needle.source);
    }
    var mappings = [];
    var index = this._findMapping(needle, this._originalMappings, "originalLine", "originalColumn", util.compareByOriginalPositions);
    if (index >= 0) {
      var mapping = this._originalMappings[index];
      while (mapping && mapping.originalLine === needle.originalLine) {
        mappings.push({
          line: util.getArg(mapping, 'generatedLine', null),
          column: util.getArg(mapping, 'generatedColumn', null),
          lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
        });
        mapping = this._originalMappings[--index];
      }
    }
    return mappings.reverse();
  };
  exports.SourceMapConsumer = SourceMapConsumer;
});
