/* */ 
(function(process) {
  var mod_assert = require('assert');
  var mod_util = require('util');
  var mod_extsprintf = require('extsprintf');
  var mod_verror = require('verror');
  var mod_jsonschema = require('json-schema');
  exports.deepCopy = deepCopy;
  exports.deepEqual = deepEqual;
  exports.isEmpty = isEmpty;
  exports.forEachKey = forEachKey;
  exports.pluck = pluck;
  exports.flattenObject = flattenObject;
  exports.flattenIter = flattenIter;
  exports.validateJsonObject = validateJsonObjectJS;
  exports.validateJsonObjectJS = validateJsonObjectJS;
  exports.randElt = randElt;
  exports.extraProperties = extraProperties;
  exports.mergeObjects = mergeObjects;
  exports.startsWith = startsWith;
  exports.endsWith = endsWith;
  exports.iso8601 = iso8601;
  exports.rfc1123 = rfc1123;
  exports.parseDateTime = parseDateTime;
  exports.hrtimediff = hrtimeDiff;
  exports.hrtimeDiff = hrtimeDiff;
  exports.hrtimeAccum = hrtimeAccum;
  exports.hrtimeAdd = hrtimeAdd;
  exports.hrtimeNanosec = hrtimeNanosec;
  exports.hrtimeMicrosec = hrtimeMicrosec;
  exports.hrtimeMillisec = hrtimeMillisec;
  function deepCopy(obj) {
    var ret,
        key;
    var marker = '__deepCopy';
    if (obj && obj[marker])
      throw (new Error('attempted deep copy of cyclic object'));
    if (obj && obj.constructor == Object) {
      ret = {};
      obj[marker] = true;
      for (key in obj) {
        if (key == marker)
          continue;
        ret[key] = deepCopy(obj[key]);
      }
      delete(obj[marker]);
      return (ret);
    }
    if (obj && obj.constructor == Array) {
      ret = [];
      obj[marker] = true;
      for (key = 0; key < obj.length; key++)
        ret.push(deepCopy(obj[key]));
      delete(obj[marker]);
      return (ret);
    }
    return (obj);
  }
  function deepEqual(obj1, obj2) {
    if (typeof(obj1) != typeof(obj2))
      return (false);
    if (obj1 === null || obj2 === null || typeof(obj1) != 'object')
      return (obj1 === obj2);
    if (obj1.constructor != obj2.constructor)
      return (false);
    var k;
    for (k in obj1) {
      if (!obj2.hasOwnProperty(k))
        return (false);
      if (!deepEqual(obj1[k], obj2[k]))
        return (false);
    }
    for (k in obj2) {
      if (!obj1.hasOwnProperty(k))
        return (false);
    }
    return (true);
  }
  function isEmpty(obj) {
    var key;
    for (key in obj)
      return (false);
    return (true);
  }
  function forEachKey(obj, callback) {
    for (var key in obj)
      callback(key, obj[key]);
  }
  function pluck(obj, key) {
    mod_assert.equal(typeof(key), 'string');
    return (pluckv(obj, key));
  }
  function pluckv(obj, key) {
    if (obj === null || typeof(obj) !== 'object')
      return (undefined);
    if (obj.hasOwnProperty(key))
      return (obj[key]);
    var i = key.indexOf('.');
    if (i == -1)
      return (undefined);
    var key1 = key.substr(0, i);
    if (!obj.hasOwnProperty(key1))
      return (undefined);
    return (pluckv(obj[key1], key.substr(i + 1)));
  }
  function flattenIter(data, depth, callback) {
    doFlattenIter(data, depth, [], callback);
  }
  function doFlattenIter(data, depth, accum, callback) {
    var each;
    var key;
    if (depth === 0) {
      each = accum.slice(0);
      each.push(data);
      callback(each);
      return;
    }
    mod_assert.ok(data !== null);
    mod_assert.equal(typeof(data), 'object');
    mod_assert.equal(typeof(depth), 'number');
    mod_assert.ok(depth >= 0);
    for (key in data) {
      each = accum.slice(0);
      each.push(key);
      doFlattenIter(data[key], depth - 1, each, callback);
    }
  }
  function flattenObject(data, depth) {
    if (depth === 0)
      return ([data]);
    mod_assert.ok(data !== null);
    mod_assert.equal(typeof(data), 'object');
    mod_assert.equal(typeof(depth), 'number');
    mod_assert.ok(depth >= 0);
    var rv = [];
    var key;
    for (key in data) {
      flattenObject(data[key], depth - 1).forEach(function(p) {
        rv.push([key].concat(p));
      });
    }
    return (rv);
  }
  function startsWith(str, prefix) {
    return (str.substr(0, prefix.length) == prefix);
  }
  function endsWith(str, suffix) {
    return (str.substr(str.length - suffix.length, suffix.length) == suffix);
  }
  function iso8601(d) {
    if (typeof(d) == 'number')
      d = new Date(d);
    mod_assert.ok(d.constructor === Date);
    return (mod_extsprintf.sprintf('%4d-%02d-%02dT%02d:%02d:%02d.%03dZ', d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()));
  }
  var RFC1123_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var RFC1123_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function rfc1123(date) {
    return (mod_extsprintf.sprintf('%s, %02d %s %04d %02d:%02d:%02d GMT', RFC1123_DAYS[date.getUTCDay()], date.getUTCDate(), RFC1123_MONTHS[date.getUTCMonth()], date.getUTCFullYear(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()));
  }
  function parseDateTime(str) {
    var numeric = +str;
    if (!isNaN(numeric)) {
      return (new Date(numeric));
    } else {
      return (new Date(str));
    }
  }
  function validateJsonObjectJS(schema, input) {
    var report = mod_jsonschema.validate(input, schema);
    if (report.errors.length === 0)
      return (null);
    var error = report.errors[0];
    var propname = error['property'];
    var reason = error['message'].toLowerCase();
    var i,
        j;
    if ((i = reason.indexOf('the property ')) != -1 && (j = reason.indexOf(' is not defined in the schema and the ' + 'schema does not allow additional properties')) != -1) {
      i += 'the property '.length;
      if (propname === '')
        propname = reason.substr(i, j - i);
      else
        propname = propname + '.' + reason.substr(i, j - i);
      reason = 'unsupported property';
    }
    var rv = new mod_verror.VError('property "%s": %s', propname, reason);
    rv.jsv_details = error;
    return (rv);
  }
  function randElt(arr) {
    mod_assert.ok(Array.isArray(arr) && arr.length > 0, 'randElt argument must be a non-empty array');
    return (arr[Math.floor(Math.random() * arr.length)]);
  }
  function assertHrtime(a) {
    mod_assert.ok(a[0] >= 0 && a[1] >= 0, 'negative numbers not allowed in hrtimes');
    mod_assert.ok(a[1] < 1e9, 'nanoseconds column overflow');
  }
  function hrtimeDiff(a, b) {
    assertHrtime(a);
    assertHrtime(b);
    mod_assert.ok(a[0] > b[0] || (a[0] == b[0] && a[1] >= b[1]), 'negative differences not allowed');
    var rv = [a[0] - b[0], 0];
    if (a[1] >= b[1]) {
      rv[1] = a[1] - b[1];
    } else {
      rv[0]--;
      rv[1] = 1e9 - (b[1] - a[1]);
    }
    return (rv);
  }
  function hrtimeNanosec(a) {
    assertHrtime(a);
    return (Math.floor(a[0] * 1e9 + a[1]));
  }
  function hrtimeMicrosec(a) {
    assertHrtime(a);
    return (Math.floor(a[0] * 1e6 + a[1] / 1e3));
  }
  function hrtimeMillisec(a) {
    assertHrtime(a);
    return (Math.floor(a[0] * 1e3 + a[1] / 1e6));
  }
  function hrtimeAccum(a, b) {
    assertHrtime(a);
    assertHrtime(b);
    a[1] += b[1];
    if (a[1] >= 1e9) {
      a[0]++;
      a[1] -= 1e9;
    }
    a[0] += b[0];
    return (a);
  }
  function hrtimeAdd(a, b) {
    assertHrtime(a);
    var rv = [a[0], a[1]];
    return (hrtimeAccum(rv, b));
  }
  function extraProperties(obj, allowed) {
    mod_assert.ok(typeof(obj) === 'object' && obj !== null, 'obj argument must be a non-null object');
    mod_assert.ok(Array.isArray(allowed), 'allowed argument must be an array of strings');
    for (var i = 0; i < allowed.length; i++) {
      mod_assert.ok(typeof(allowed[i]) === 'string', 'allowed argument must be an array of strings');
    }
    return (Object.keys(obj).filter(function(key) {
      return (allowed.indexOf(key) === -1);
    }));
  }
  function mergeObjects(provided, overrides, defaults) {
    var rv,
        k;
    rv = {};
    if (defaults) {
      for (k in defaults)
        rv[k] = defaults[k];
    }
    if (provided) {
      for (k in provided)
        rv[k] = provided[k];
    }
    if (overrides) {
      for (k in overrides)
        rv[k] = overrides[k];
    }
    return (rv);
  }
})(require('process'));
