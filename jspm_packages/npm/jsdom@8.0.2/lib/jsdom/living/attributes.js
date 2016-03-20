/* */ 
"use strict";
const DOMException = require('../web-idl/DOMException');
const defineGetter = require('../utils').defineGetter;
const idlUtils = require('./generated/utils');
const attrGenerated = require('./generated/Attr');
const changeAttributeImpl = require('./attributes/Attr-impl').changeAttributeImpl;
const getAttrImplQualifiedName = require('./attributes/Attr-impl').getAttrImplQualifiedName;
const INTERNAL = Symbol("NamedNodeMap internal");
const reservedNames = new Set();
function NamedNodeMap() {
  throw new TypeError("Illegal constructor");
}
defineGetter(NamedNodeMap.prototype, "length", function() {
  return this[INTERNAL].attributeList.length;
});
NamedNodeMap.prototype.item = function(index) {
  if (arguments.length < 1) {
    throw new TypeError("Not enough arguments to NamedNodeMap.prototype.item");
  }
  index = Number(index);
  return this[index] || null;
};
NamedNodeMap.prototype.getNamedItem = function(name) {
  if (arguments.length < 1) {
    throw new TypeError("Not enough arguments to NamedNodeMap.prototype.getNamedItem");
  }
  name = String(name);
  return idlUtils.wrapperForImpl(exports.getAttributeByName(this[INTERNAL].element, name));
};
NamedNodeMap.prototype.getNamedItemNS = function(namespace, localName) {
  if (arguments.length < 2) {
    throw new TypeError("Not enough arguments to NamedNodeMap.prototype.getNamedItemNS");
  }
  if (namespace === undefined || namespace === null) {
    namespace = null;
  } else {
    namespace = String(namespace);
  }
  localName = String(localName);
  return idlUtils.wrapperForImpl(exports.getAttributeByNameNS(this[INTERNAL].element, namespace, localName));
};
NamedNodeMap.prototype.setNamedItem = function(attr) {
  if (!attrGenerated.is(attr)) {
    throw new TypeError("First argument to NamedNodeMap.prototype.setNamedItem must be an Attr");
  }
  return idlUtils.wrapperForImpl(exports.setAttribute(this[INTERNAL].element, idlUtils.implForWrapper(attr)));
};
NamedNodeMap.prototype.setNamedItemNS = function(attr) {
  if (!attrGenerated.is(attr)) {
    throw new TypeError("First argument to NamedNodeMap.prototype.setNamedItemNS must be an Attr");
  }
  return idlUtils.wrapperForImpl(exports.setAttribute(this[INTERNAL].element, idlUtils.implForWrapper(attr)));
};
NamedNodeMap.prototype.removeNamedItem = function(name) {
  if (arguments.length < 1) {
    throw new TypeError("Not enough arguments to NamedNodeMap.prototype.getNamedItem");
  }
  name = String(name);
  const attr = exports.removeAttributeByName(this[INTERNAL].element, name);
  if (attr === null) {
    throw new DOMException(DOMException.NOT_FOUND_ERR, "Tried to remove an attribute that was not present");
  }
  return idlUtils.wrapperForImpl(attr);
};
NamedNodeMap.prototype.removeNamedItemNS = function(namespace, localName) {
  if (arguments.length < 2) {
    throw new TypeError("Not enough arguments to NamedNodeMap.prototype.removeNamedItemNS");
  }
  if (namespace === undefined || namespace === null) {
    namespace = null;
  } else {
    namespace = String(namespace);
  }
  localName = String(localName);
  const attr = exports.removeAttributeByNameNS(this[INTERNAL].element, namespace, localName);
  if (attr === null) {
    throw new DOMException(DOMException.NOT_FOUND_ERR, "Tried to remove an attribute that was not present");
  }
  return idlUtils.wrapperForImpl(attr);
};
exports.NamedNodeMap = NamedNodeMap;
{
  let prototype = NamedNodeMap.prototype;
  while (prototype) {
    for (const name of Object.getOwnPropertyNames(prototype)) {
      reservedNames.add(name);
    }
    prototype = Object.getPrototypeOf(prototype);
  }
}
exports.createNamedNodeMap = function(element) {
  const nnm = Object.create(NamedNodeMap.prototype);
  nnm[INTERNAL] = {
    element,
    attributeList: [],
    attributesByNameMap: new Map()
  };
  return nnm;
};
exports.hasAttribute = function(element, A) {
  const attributesNNM = element._attributes;
  const attributeList = attributesNNM[INTERNAL].attributeList;
  return attributeList.indexOf(A) !== -1;
};
exports.hasAttributeByName = function(element, name) {
  const attributesNNM = element._attributes;
  const attributesByNameMap = attributesNNM[INTERNAL].attributesByNameMap;
  return attributesByNameMap.has(name);
};
exports.hasAttributeByNameNS = function(element, namespace, localName) {
  const attributesNNM = element._attributes;
  const attributeList = attributesNNM[INTERNAL].attributeList;
  return attributeList.some((attribute) => {
    return attribute._localName === localName && attribute._namespace === namespace;
  });
};
exports.changeAttribute = function(element, attribute, value) {
  changeAttributeImpl(element, attribute, value);
};
exports.appendAttribute = function(element, attribute) {
  const attributesNNM = element._attributes;
  const attributeList = attributesNNM[INTERNAL].attributeList;
  attributeList.push(attribute);
  attribute._element = element;
  attributesNNM[attributeList.length - 1] = idlUtils.wrapperForImpl(attribute);
  const name = getAttrImplQualifiedName(attribute);
  if (!reservedNames.has(name)) {
    attributesNNM[name] = idlUtils.wrapperForImpl(attribute);
  }
  const cache = attributesNNM[INTERNAL].attributesByNameMap;
  let entry = cache.get(name);
  if (!entry) {
    entry = [];
    cache.set(name, entry);
  }
  entry.push(attribute);
  element._attrModified(name, attribute._value, null);
};
exports.removeAttribute = function(element, attribute) {
  const attributesNNM = element._attributes;
  const attributeList = attributesNNM[INTERNAL].attributeList;
  for (let i = 0; i < attributeList.length; ++i) {
    if (attributeList[i] === attribute) {
      attributeList.splice(i, 1);
      attribute._element = null;
      for (let j = i; j < attributeList.length; ++j) {
        attributesNNM[j] = idlUtils.wrapperForImpl(attributeList[j]);
      }
      delete attributesNNM[attributeList.length];
      const name = getAttrImplQualifiedName(attribute);
      if (!reservedNames.has(name)) {
        delete attributesNNM[name];
      }
      const cache = attributesNNM[INTERNAL].attributesByNameMap;
      const entry = cache.get(name);
      entry.splice(entry.indexOf(attribute), 1);
      if (entry.length === 0) {
        cache.delete(name);
      }
      element._attrModified(name, null, attribute._value);
      return;
    }
  }
};
exports.getAttributeByName = function(element, name) {
  if (element._namespaceURI === "http://www.w3.org/1999/xhtml" && element._ownerDocument._parsingMode === "html") {
    name = name.toLowerCase();
  }
  const cache = element._attributes[INTERNAL].attributesByNameMap;
  const entry = cache.get(name);
  if (!entry) {
    return null;
  }
  return entry[0];
};
exports.getAttributeValue = function(element, name) {
  const attr = exports.getAttributeByName(element, name);
  if (!attr) {
    return null;
  }
  return attr._value;
};
exports.getAttributeByNameNS = function(element, namespace, localName) {
  if (namespace === "") {
    namespace = null;
  }
  const attributeList = element._attributes[INTERNAL].attributeList;
  for (let i = 0; i < attributeList.length; ++i) {
    const attr = attributeList[i];
    if (attr._namespace === namespace && attr._localName === localName) {
      return attr;
    }
  }
  return null;
};
exports.getAttributeValueByNameNS = function(element, namespace, localName) {
  const attr = exports.getAttributeByNameNS(element, namespace, localName);
  if (!attr) {
    return null;
  }
  return attr._value;
};
exports.setAttribute = function(element, attr) {
  if (attr._element !== null && attr._element !== element) {
    throw new DOMException(DOMException.INUSE_ATTRIBUTE_ERR);
  }
  const oldAttr = exports.getAttributeByNameNS(element, attr._namespace, attr._localName);
  if (oldAttr === attr) {
    return attr;
  }
  if (oldAttr !== null) {
    exports.removeAttribute(element, oldAttr);
  }
  exports.appendAttribute(element, attr);
  return oldAttr;
};
exports.setAttributeValue = function(element, localName, value, prefix, namespace) {
  if (prefix === undefined) {
    prefix = null;
  }
  if (namespace === undefined) {
    namespace = null;
  }
  const attribute = exports.getAttributeByNameNS(element, namespace, localName);
  if (attribute === null) {
    const newAttribute = attrGenerated.createImpl([], {
      namespace,
      namespacePrefix: prefix,
      localName,
      value
    });
    exports.appendAttribute(element, newAttribute);
    return;
  }
  exports.changeAttribute(element, attribute, value);
};
exports.removeAttributeByName = function(element, name) {
  const attr = exports.getAttributeByName(element, name);
  if (attr !== null) {
    exports.removeAttribute(element, attr);
  }
  return attr;
};
exports.removeAttributeByNameNS = function(element, namespace, localName) {
  const attr = exports.getAttributeByNameNS(element, namespace, localName);
  if (attr !== null) {
    exports.removeAttribute(element, attr);
  }
  return attr;
};
exports.copyAttributeList = function(sourceElement, destElement) {
  for (const sourceAttr of sourceElement._attributes[INTERNAL].attributeList) {
    const destAttr = attrGenerated.createImpl([], {
      namespace: sourceAttr._namespace,
      prefix: sourceAttr._prefix,
      localName: sourceAttr._localName,
      value: sourceAttr._value
    });
    exports.appendAttribute(destElement, destAttr);
  }
};
exports.attributeListsEqual = function(elementA, elementB) {
  const listA = elementA._attributes[INTERNAL].attributeList;
  const listB = elementB._attributes[INTERNAL].attributeList;
  if (listA.length !== listB.length) {
    return false;
  }
  for (let i = 0; i < listA.length; ++i) {
    const attrA = listA[i];
    if (!listB.some((attrB) => equalsA(attrB))) {
      return false;
    }
    function equalsA(attrB) {
      return attrA._namespace === attrB._namespace && attrA._localName === attrB._localName && attrA._value === attrB._value;
    }
  }
  return true;
};
exports.hasAttributes = function(element) {
  return element._attributes[INTERNAL].attributeList.length > 0;
};