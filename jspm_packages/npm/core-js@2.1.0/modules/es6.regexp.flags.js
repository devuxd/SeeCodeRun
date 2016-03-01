/* */ 
if (require('./_descriptors') && /./g.flags != 'g')
  require('./_object-dp').f(RegExp.prototype, 'flags', {
    configurable: true,
    get: require('./_flags')
  });
