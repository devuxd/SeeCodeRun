/* */ 
var anObject = require('./_an-object'),
    dPs = require('./_object-dps'),
    enumBugKeys = require('./_enum-bug-keys'),
    IE_PROTO = require('./_shared-key')('IE_PROTO'),
    Empty = function() {},
    PROTOTYPE = 'prototype';
var createDict = function() {
  var iframe = require('./_dom-create')('iframe'),
      i = enumBugKeys.length,
      gt = '>',
      iframeDocument;
  iframe.style.display = 'none';
  require('./_html').appendChild(iframe);
  iframe.src = 'javascript:';
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write('<script>document.F=Object</script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (i--)
    delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};
module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty;
    Empty[PROTOTYPE] = null;
    result[IE_PROTO] = O;
  } else
    result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};
