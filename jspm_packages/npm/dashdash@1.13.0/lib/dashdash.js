/* */ 
(function(process) {
  var assert = require('assert-plus');
  var format = require('util').format;
  var fs = require('fs');
  var path = require('path');
  var DEBUG = true;
  if (DEBUG) {
    var debug = console.warn;
  } else {
    var debug = function() {};
  }
  function renderTemplate(s, d) {
    return s.replace(/{{([a-zA-Z]+)}}/g, function(match, key) {
      return d.hasOwnProperty(key) ? d[key] : match;
    });
  }
  function shallowCopy(obj) {
    if (!obj) {
      return (obj);
    }
    var copy = {};
    Object.keys(obj).forEach(function(k) {
      copy[k] = obj[k];
    });
    return (copy);
  }
  function space(n) {
    var s = '';
    for (var i = 0; i < n; i++) {
      s += ' ';
    }
    return s;
  }
  function makeIndent(arg, deflen, name) {
    if (arg === null || arg === undefined)
      return space(deflen);
    else if (typeof(arg) === 'number')
      return space(arg);
    else if (typeof(arg) === 'string')
      return arg;
    else
      assert.fail('invalid "' + name + '": not a string or number: ' + arg);
  }
  function textwrap(s, width) {
    var words = s.trim().split(/\s+/);
    var lines = [];
    var line = '';
    words.forEach(function(w) {
      var newLength = line.length + w.length;
      if (line.length > 0)
        newLength += 1;
      if (newLength > width) {
        lines.push(line);
        line = '';
      }
      if (line.length > 0)
        line += ' ';
      line += w;
    });
    lines.push(line);
    return lines;
  }
  function optionKeyFromName(name) {
    return name.replace(/-/g, '_');
  }
  function parseBool(option, optstr, arg) {
    return Boolean(arg);
  }
  function parseString(option, optstr, arg) {
    assert.string(arg, 'arg');
    return arg;
  }
  function parseNumber(option, optstr, arg) {
    assert.string(arg, 'arg');
    var num = Number(arg);
    if (isNaN(num)) {
      throw new Error(format('arg for "%s" is not a number: "%s"', optstr, arg));
    }
    return num;
  }
  function parseInteger(option, optstr, arg) {
    assert.string(arg, 'arg');
    var num = Number(arg);
    if (!/^[0-9-]+$/.test(arg) || isNaN(num)) {
      throw new Error(format('arg for "%s" is not an integer: "%s"', optstr, arg));
    }
    return num;
  }
  function parsePositiveInteger(option, optstr, arg) {
    assert.string(arg, 'arg');
    var num = Number(arg);
    if (!/^[0-9]+$/.test(arg) || isNaN(num) || num === 0) {
      throw new Error(format('arg for "%s" is not a positive integer: "%s"', optstr, arg));
    }
    return num;
  }
  function parseDate(option, optstr, arg) {
    assert.string(arg, 'arg');
    var date;
    if (/^\d+$/.test(arg)) {
      date = new Date(Number(arg) * 1000);
    } else if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/i.test(arg)) {
      date = new Date(arg);
    } else {
      throw new Error(format('arg for "%s" is not a valid date format: "%s"', optstr, arg));
    }
    if (date.toString() === 'Invalid Date') {
      throw new Error(format('arg for "%s" is an invalid date: "%s"', optstr, arg));
    }
    return date;
  }
  var optionTypes = {
    bool: {
      takesArg: false,
      parseArg: parseBool
    },
    string: {
      takesArg: true,
      helpArg: 'ARG',
      parseArg: parseString
    },
    number: {
      takesArg: true,
      helpArg: 'NUM',
      parseArg: parseNumber
    },
    integer: {
      takesArg: true,
      helpArg: 'INT',
      parseArg: parseInteger
    },
    positiveInteger: {
      takesArg: true,
      helpArg: 'INT',
      parseArg: parsePositiveInteger
    },
    date: {
      takesArg: true,
      helpArg: 'DATE',
      parseArg: parseDate
    },
    arrayOfBool: {
      takesArg: false,
      array: true,
      parseArg: parseBool
    },
    arrayOfString: {
      takesArg: true,
      helpArg: 'ARG',
      array: true,
      parseArg: parseString
    },
    arrayOfNumber: {
      takesArg: true,
      helpArg: 'NUM',
      array: true,
      parseArg: parseNumber
    },
    arrayOfInteger: {
      takesArg: true,
      helpArg: 'INT',
      array: true,
      parseArg: parseInteger
    },
    arrayOfPositiveInteger: {
      takesArg: true,
      helpArg: 'INT',
      array: true,
      parseArg: parsePositiveInteger
    },
    arrayOfDate: {
      takesArg: true,
      helpArg: 'INT',
      array: true,
      parseArg: parseDate
    }
  };
  function Parser(config) {
    assert.object(config, 'config');
    assert.arrayOfObject(config.options, 'config.options');
    assert.optionalBool(config.interspersed, 'config.interspersed');
    var self = this;
    this.interspersed = (config.interspersed !== undefined ? config.interspersed : true);
    this.allowUnknown = (config.allowUnknown !== undefined ? config.allowUnknown : false);
    this.options = config.options.map(function(o) {
      return shallowCopy(o);
    });
    this.optionFromName = {};
    this.optionFromEnv = {};
    for (var i = 0; i < this.options.length; i++) {
      var o = this.options[i];
      if (o.group !== undefined && o.group !== null) {
        assert.optionalString(o.group, format('config.options.%d.group', i));
        continue;
      }
      assert.ok(optionTypes[o.type], format('invalid config.options.%d.type: "%s" in %j', i, o.type, o));
      assert.optionalString(o.name, format('config.options.%d.name', i));
      assert.optionalArrayOfString(o.names, format('config.options.%d.names', i));
      assert.ok((o.name || o.names) && !(o.name && o.names), format('exactly one of "name" or "names" required: %j', o));
      assert.optionalString(o.help, format('config.options.%d.help', i));
      var env = o.env || [];
      if (typeof(env) === 'string') {
        env = [env];
      }
      assert.optionalArrayOfString(env, format('config.options.%d.env', i));
      assert.optionalString(o.helpGroup, format('config.options.%d.helpGroup', i));
      assert.optionalBool(o.helpWrap, format('config.options.%d.helpWrap', i));
      assert.optionalBool(o.hidden, format('config.options.%d.hidden', i));
      if (o.name) {
        o.names = [o.name];
      } else {
        assert.string(o.names[0], format('config.options.%d.names is empty', i));
      }
      o.key = optionKeyFromName(o.names[0]);
      o.names.forEach(function(n) {
        if (self.optionFromName[n]) {
          throw new Error(format('option name collision: "%s" used in %j and %j', n, self.optionFromName[n], o));
        }
        self.optionFromName[n] = o;
      });
      env.forEach(function(n) {
        if (self.optionFromEnv[n]) {
          throw new Error(format('option env collision: "%s" used in %j and %j', n, self.optionFromEnv[n], o));
        }
        self.optionFromEnv[n] = o;
      });
    }
  }
  Parser.prototype.optionTakesArg = function optionTakesArg(option) {
    return optionTypes[option.type].takesArg;
  };
  Parser.prototype.parse = function parse(inputs) {
    var self = this;
    if (Array.isArray(arguments[0])) {
      inputs = {
        argv: arguments[0],
        slice: arguments[1]
      };
    }
    assert.optionalObject(inputs, 'inputs');
    if (!inputs) {
      inputs = {};
    }
    assert.optionalArrayOfString(inputs.argv, 'inputs.argv');
    var argv = inputs.argv || process.argv;
    var slice = inputs.slice !== undefined ? inputs.slice : 2;
    var args = argv.slice(slice);
    var env = inputs.env || process.env;
    var opts = {};
    var _order = [];
    function addOpt(option, optstr, key, val, from) {
      var type = optionTypes[option.type];
      var parsedVal = type.parseArg(option, optstr, val);
      if (type.array) {
        if (!opts[key]) {
          opts[key] = [];
        }
        if (type.arrayFlatten && Array.isArray(parsedVal)) {
          for (var i = 0; i < parsedVal.length; i++) {
            opts[key].push(parsedVal[i]);
          }
        } else {
          opts[key].push(parsedVal);
        }
      } else {
        opts[key] = parsedVal;
      }
      var item = {
        key: key,
        value: parsedVal,
        from: from
      };
      _order.push(item);
    }
    var _args = [];
    var i = 0;
    outer: while (i < args.length) {
      var arg = args[i];
      if (arg === '--') {
        i++;
        break;
      } else if (arg.slice(0, 2) === '--') {
        var name = arg.slice(2);
        var val = null;
        var idx = name.indexOf('=');
        if (idx !== -1) {
          val = name.slice(idx + 1);
          name = name.slice(0, idx);
        }
        var option = this.optionFromName[name];
        if (!option) {
          if (!this.allowUnknown)
            throw new Error(format('unknown option: "--%s"', name));
          else if (this.interspersed)
            _args.push(arg);
          else
            break outer;
        } else {
          var takesArg = this.optionTakesArg(option);
          if (val !== null && !takesArg) {
            throw new Error(format('argument given to "--%s" option ' + 'that does not take one: "%s"', name, arg));
          }
          if (!takesArg) {
            addOpt(option, '--' + name, option.key, true, 'argv');
          } else if (val !== null) {
            addOpt(option, '--' + name, option.key, val, 'argv');
          } else if (i + 1 >= args.length) {
            throw new Error(format('do not have enough args for "--%s" ' + 'option', name));
          } else {
            addOpt(option, '--' + name, option.key, args[i + 1], 'argv');
            i++;
          }
        }
      } else if (arg[0] === '-' && arg.length > 1) {
        var j = 1;
        var allFound = true;
        while (j < arg.length) {
          var name = arg[j];
          var option = this.optionFromName[name];
          if (!option) {
            allFound = false;
            if (this.allowUnknown) {
              if (this.interspersed) {
                _args.push(arg);
                break;
              } else
                break outer;
            } else if (arg.length > 2) {
              throw new Error(format('unknown option: "-%s" in "%s" group', name, arg));
            } else {
              throw new Error(format('unknown option: "-%s"', name));
            }
          } else if (this.optionTakesArg(option)) {
            break;
          }
          j++;
        }
        j = 1;
        while (allFound && j < arg.length) {
          var name = arg[j];
          var val = arg.slice(j + 1);
          var option = this.optionFromName[name];
          var takesArg = this.optionTakesArg(option);
          if (!takesArg) {
            addOpt(option, '-' + name, option.key, true, 'argv');
          } else if (val) {
            addOpt(option, '-' + name, option.key, val, 'argv');
            break;
          } else {
            if (i + 1 >= args.length) {
              throw new Error(format('do not have enough args ' + 'for "-%s" option', name));
            }
            addOpt(option, '-' + name, option.key, args[i + 1], 'argv');
            i++;
            break;
          }
          j++;
        }
      } else if (this.interspersed) {
        _args.push(arg);
      } else {
        break outer;
      }
      i++;
    }
    _args = _args.concat(args.slice(i));
    Object.keys(this.optionFromEnv).forEach(function(envname) {
      var val = env[envname];
      if (val === undefined)
        return;
      var option = self.optionFromEnv[envname];
      if (opts[option.key] !== undefined)
        return;
      var takesArg = self.optionTakesArg(option);
      if (takesArg) {
        addOpt(option, envname, option.key, val, 'env');
      } else if (val !== '') {
        addOpt(option, envname, option.key, (val !== '0'), 'env');
      }
    });
    this.options.forEach(function(o) {
      if (opts[o.key] === undefined) {
        if (o.default !== undefined) {
          opts[o.key] = o.default;
        } else if (o.type && optionTypes[o.type].default !== undefined) {
          opts[o.key] = optionTypes[o.type].default;
        }
      }
    });
    opts._order = _order;
    opts._args = _args;
    return opts;
  };
  Parser.prototype.help = function help(config) {
    config = config || {};
    assert.object(config, 'config');
    var indent = makeIndent(config.indent, 4, 'config.indent');
    var headingIndent = makeIndent(config.headingIndent, Math.round(indent.length / 2), 'config.headingIndent');
    assert.optionalString(config.nameSort, 'config.nameSort');
    var nameSort = config.nameSort || 'length';
    assert.ok(~['length', 'none'].indexOf(nameSort), 'invalid "config.nameSort"');
    assert.optionalNumber(config.maxCol, 'config.maxCol');
    assert.optionalNumber(config.maxHelpCol, 'config.maxHelpCol');
    assert.optionalNumber(config.minHelpCol, 'config.minHelpCol');
    assert.optionalNumber(config.helpCol, 'config.helpCol');
    assert.optionalBool(config.includeEnv, 'config.includeEnv');
    assert.optionalBool(config.includeDefault, 'config.includeDefault');
    assert.optionalBool(config.helpWrap, 'config.helpWrap');
    var maxCol = config.maxCol || 80;
    var minHelpCol = config.minHelpCol || 20;
    var maxHelpCol = config.maxHelpCol || 40;
    var lines = [];
    var maxWidth = 0;
    this.options.forEach(function(o) {
      if (o.hidden) {
        return;
      }
      if (o.group !== undefined && o.group !== null) {
        lines.push(null);
        return;
      }
      var type = optionTypes[o.type];
      var arg = o.helpArg || type.helpArg || 'ARG';
      var line = '';
      var names = o.names.slice();
      if (nameSort === 'length') {
        names.sort(function(a, b) {
          if (a.length < b.length)
            return -1;
          else if (b.length < a.length)
            return 1;
          else
            return 0;
        });
      }
      names.forEach(function(name, i) {
        if (i > 0)
          line += ', ';
        if (name.length === 1) {
          line += '-' + name;
          if (type.takesArg)
            line += ' ' + arg;
        } else {
          line += '--' + name;
          if (type.takesArg)
            line += '=' + arg;
        }
      });
      maxWidth = Math.max(maxWidth, line.length);
      lines.push(line);
    });
    var helpCol = config.helpCol;
    if (!helpCol) {
      helpCol = maxWidth + indent.length + 2;
      helpCol = Math.min(Math.max(helpCol, minHelpCol), maxHelpCol);
    }
    var i = -1;
    this.options.forEach(function(o) {
      if (o.hidden) {
        return;
      }
      i++;
      if (o.group !== undefined && o.group !== null) {
        if (o.group === '') {
          lines[i] = '';
        } else {
          lines[i] = (i === 0 ? '' : '\n') + headingIndent + o.group + ':';
        }
        return;
      }
      var helpDefault;
      if (config.includeDefault) {
        if (o.default !== undefined) {
          helpDefault = format('Default: %j', o.default);
        } else if (o.type && optionTypes[o.type].default !== undefined) {
          helpDefault = format('Default: %j', optionTypes[o.type].default);
        }
      }
      var line = lines[i] = indent + lines[i];
      if (!o.help && !(config.includeEnv && o.env) && !helpDefault) {
        return;
      }
      var n = helpCol - line.length;
      if (n >= 0) {
        line += space(n);
      } else {
        line += '\n' + space(helpCol);
      }
      var helpEnv = '';
      if (o.env && o.env.length && config.includeEnv) {
        helpEnv += 'Environment: ';
        var type = optionTypes[o.type];
        var arg = o.helpArg || type.helpArg || 'ARG';
        var envs = (Array.isArray(o.env) ? o.env : [o.env]).map(function(e) {
          if (type.takesArg) {
            return e + '=' + arg;
          } else {
            return e + '=1';
          }
        });
        helpEnv += envs.join(', ');
      }
      var help = (o.help || '').trim();
      if (o.helpWrap !== false && config.helpWrap !== false) {
        if (help.length && !~'.!?"\''.indexOf(help.slice(-1))) {
          help += '.';
        }
        if (help.length) {
          help += ' ';
        }
        help += helpEnv;
        if (helpDefault) {
          if (helpEnv) {
            help += '. ';
          }
          help += helpDefault;
        }
        line += textwrap(help, maxCol - helpCol).join('\n' + space(helpCol));
      } else {
        var helpLines = help.split('\n').filter(function(ln) {
          return ln.length;
        });
        if (helpEnv !== '') {
          helpLines.push(helpEnv);
        }
        if (helpDefault) {
          helpLines.push(helpDefault);
        }
        line += helpLines.join('\n' + space(helpCol));
      }
      lines[i] = line;
    });
    var rv = '';
    if (lines.length > 0) {
      rv = lines.join('\n') + '\n';
    }
    return rv;
  };
  Parser.prototype.bashCompletion = function bashCompletion(args) {
    assert.object(args, 'args');
    assert.string(args.name, 'args.name');
    assert.optionalString(args.specExtra, 'args.specExtra');
    assert.optionalArrayOfString(args.argtypes, 'args.argtypes');
    return bashCompletionFromOptions({
      name: args.name,
      specExtra: args.specExtra,
      argtypes: args.argtypes,
      options: this.options
    });
  };
  const BASH_COMPLETION_TEMPLATE_PATH = path.join(__dirname, '../etc/dashdash.bash_completion.in');
  function bashCompletionSpecFromOptions(args) {
    assert.object(args, 'args');
    assert.object(args.options, 'args.options');
    assert.optionalString(args.context, 'args.context');
    assert.optionalBool(args.includeHidden, 'args.includeHidden');
    assert.optionalArrayOfString(args.argtypes, 'args.argtypes');
    var context = args.context || '';
    var includeHidden = (args.includeHidden === undefined ? false : args.includeHidden);
    var spec = [];
    var shortopts = [];
    var longopts = [];
    var optargs = [];
    (args.options || []).forEach(function(o) {
      if (o.group) {
        return;
      }
      var optNames = o.names || [o.name];
      var optType = getOptionType(o.type);
      if (optType.takesArg) {
        var completionType = o.completionType || optType.completionType || o.type;
        optNames.forEach(function(optName) {
          if (optName.length === 1) {
            if (includeHidden || !o.hidden) {
              shortopts.push('-' + optName);
            }
            optargs.push('-' + optName + '=' + completionType);
          } else {
            if (includeHidden || !o.hidden) {
              longopts.push('--' + optName);
            }
            optargs.push('--' + optName + '=' + completionType);
          }
        });
      } else {
        optNames.forEach(function(optName) {
          if (includeHidden || !o.hidden) {
            if (optName.length === 1) {
              shortopts.push('-' + optName);
            } else {
              longopts.push('--' + optName);
            }
          }
        });
      }
    });
    spec.push(format('local cmd%s_shortopts="%s"', context, shortopts.sort().join(' ')));
    spec.push(format('local cmd%s_longopts="%s"', context, longopts.sort().join(' ')));
    spec.push(format('local cmd%s_optargs="%s"', context, optargs.sort().join(' ')));
    if (args.argtypes) {
      spec.push(format('local cmd%s_argtypes="%s"', context, args.argtypes.join(' ')));
    }
    return spec.join('\n');
  }
  function bashCompletionFromOptions(args) {
    assert.object(args, 'args');
    assert.object(args.options, 'args.options');
    assert.string(args.name, 'args.name');
    assert.optionalString(args.specExtra, 'args.specExtra');
    assert.optionalArrayOfString(args.argtypes, 'args.argtypes');
    var data = {
      name: args.name,
      date: new Date(),
      spec: bashCompletionSpecFromOptions({
        options: args.options,
        argtypes: args.argtypes
      })
    };
    if (args.specExtra) {
      data.spec += '\n\n' + args.specExtra;
    }
    var template = fs.readFileSync(BASH_COMPLETION_TEMPLATE_PATH, 'utf8');
    return renderTemplate(template, data);
  }
  function createParser(config) {
    return new Parser(config);
  }
  function parse(config) {
    assert.object(config, 'config');
    assert.optionalArrayOfString(config.argv, 'config.argv');
    assert.optionalObject(config.env, 'config.env');
    var config = shallowCopy(config);
    var argv = config.argv;
    delete config.argv;
    var env = config.env;
    delete config.env;
    var parser = new Parser(config);
    return parser.parse({
      argv: argv,
      env: env
    });
  }
  function addOptionType(optionType) {
    assert.object(optionType, 'optionType');
    assert.string(optionType.name, 'optionType.name');
    assert.bool(optionType.takesArg, 'optionType.takesArg');
    if (optionType.takesArg) {
      assert.string(optionType.helpArg, 'optionType.helpArg');
    }
    assert.func(optionType.parseArg, 'optionType.parseArg');
    assert.optionalBool(optionType.array, 'optionType.array');
    assert.optionalBool(optionType.arrayFlatten, 'optionType.arrayFlatten');
    optionTypes[optionType.name] = {
      takesArg: optionType.takesArg,
      helpArg: optionType.helpArg,
      parseArg: optionType.parseArg,
      array: optionType.array,
      arrayFlatten: optionType.arrayFlatten,
      default: optionType.default
    };
  }
  function getOptionType(name) {
    assert.string(name, 'name');
    return optionTypes[name];
  }
  module.exports = {
    createParser: createParser,
    Parser: Parser,
    parse: parse,
    addOptionType: addOptionType,
    getOptionType: getOptionType,
    BASH_COMPLETION_TEMPLATE_PATH: BASH_COMPLETION_TEMPLATE_PATH,
    bashCompletionFromOptions: bashCompletionFromOptions,
    bashCompletionSpecFromOptions: bashCompletionSpecFromOptions,
    parseBool: parseBool,
    parseString: parseString,
    parseNumber: parseNumber,
    parseInteger: parseInteger,
    parsePositiveInteger: parsePositiveInteger,
    parseDate: parseDate
  };
})(require('process'));
