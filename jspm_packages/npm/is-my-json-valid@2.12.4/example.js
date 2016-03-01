/* */ 
var validator = require('./index');
var validate = validator({
  type: 'object',
  properties: {hello: {
      required: true,
      type: 'string'
    }}
});
console.log('should be valid', validate({hello: 'world'}));
console.log('should not be valid', validate({}));
console.log('the errors were:', validate.errors);
