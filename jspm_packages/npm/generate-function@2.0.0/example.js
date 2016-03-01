/* */ 
var genfun = require('./index');
var multiply = function(a, b) {
  return a * b;
};
var addAndMultiplyNumber = function(val) {
  var fn = genfun()('function(n) {')('if (typeof n !== "number") {')('throw new Error("argument should be a number")')('}')('var result = multiply(%d, n+%d)', val, val)('return result')('}');
  return fn.toFunction({multiply: multiply});
};
var addAndMultiply2 = addAndMultiplyNumber(2);
console.log(addAndMultiply2.toString());
console.log('(3 + 2) * 2 =', addAndMultiply2(3));
