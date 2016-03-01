/* */ 
"use strict";
var dh = require('./lib/dh');
var eddsa = require('./lib/eddsa');
var curve255 = require('./lib/curve255');
var utils = require('./lib/utils');
var ns = {};
ns.VERSION = '0.7.1';
ns.dh = dh;
ns.eddsa = eddsa;
ns.curve255 = curve255;
ns.utils = utils;
module.exports = ns;
