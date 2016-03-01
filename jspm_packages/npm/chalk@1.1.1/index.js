/* */ 
(function(process) {
  'use strict';
  var escapeStringRegexp = require('escape-string-regexp');
  var ansiStyles = require('ansi-styles');
  var stripAnsi = require('strip-ansi');
  var hasAnsi = require('has-ansi');
  var supportsColor = require('supports-color');
  var defineProps = Object.defineProperties;
  var isSimpleWindowsTerm = process.platform === 'win32' && !/^xterm/i.test(process.env.TERM);
  function Chalk(options) {
    this.enabled = !options || options.enabled === undefined ? supportsColor : options.enabled;
  }
  if (isSimpleWindowsTerm) {
    ansiStyles.blue.open = '\u001b[94m';
  }
  var styles = (function() {
    var ret = {};
    Object.keys(ansiStyles).forEach(function(key) {
      ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');
      ret[key] = {get: function() {
          return build.call(this, this._styles.concat(key));
        }};
    });
    return ret;
  })();
  var proto = defineProps(function chalk() {}, styles);
  function build(_styles) {
    var builder = function() {
      return applyStyle.apply(builder, arguments);
    };
    builder._styles = _styles;
    builder.enabled = this.enabled;
    builder.__proto__ = proto;
    return builder;
  }
  function applyStyle() {
    var args = arguments;
    var argsLen = args.length;
    var str = argsLen !== 0 && String(arguments[0]);
    if (argsLen > 1) {
      for (var a = 1; a < argsLen; a++) {
        str += ' ' + args[a];
      }
    }
    if (!this.enabled || !str) {
      return str;
    }
    var nestedStyles = this._styles;
    var i = nestedStyles.length;
    var originalDim = ansiStyles.dim.open;
    if (isSimpleWindowsTerm && (nestedStyles.indexOf('gray') !== -1 || nestedStyles.indexOf('grey') !== -1)) {
      ansiStyles.dim.open = '';
    }
    while (i--) {
      var code = ansiStyles[nestedStyles[i]];
      str = code.open + str.replace(code.closeRe, code.open) + code.close;
    }
    ansiStyles.dim.open = originalDim;
    return str;
  }
  function init() {
    var ret = {};
    Object.keys(styles).forEach(function(name) {
      ret[name] = {get: function() {
          return build.call(this, [name]);
        }};
    });
    return ret;
  }
  defineProps(Chalk.prototype, init());
  module.exports = new Chalk();
  module.exports.styles = ansiStyles;
  module.exports.hasColor = hasAnsi;
  module.exports.stripColor = stripAnsi;
  module.exports.supportsColor = supportsColor;
})(require('process'));
