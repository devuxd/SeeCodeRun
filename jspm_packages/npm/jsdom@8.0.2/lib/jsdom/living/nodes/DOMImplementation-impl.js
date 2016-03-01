/* */ 
(function(process) {
  "use strict";
  const vm = require('../../vm-shim');
  const validateNames = require('../helpers/validate-names');
  const DocumentType = require('../generated/DocumentType');
  const Document = require('../generated/Document');
  class DOMImplementationImpl {
    constructor(args, privateData) {
      this.core = privateData.core;
      this._ownerDocument = privateData.ownerDocument;
      this._features = Object.create(null);
    }
    hasFeature() {
      return true;
    }
    createDocumentType(qualifiedName, publicId, systemId) {
      validateNames.qname(qualifiedName);
      return DocumentType.createImpl([], {
        core: this.core,
        ownerDocument: this._ownerDocument,
        name: qualifiedName,
        publicId,
        systemId
      });
    }
    createDocument(namespace, qualifiedName, doctype) {
      namespace = namespace !== null ? String(namespace) : namespace;
      qualifiedName = qualifiedName === null ? "" : String(qualifiedName);
      if (doctype === undefined) {
        doctype = null;
      }
      const document = Document.createImpl([], {core: this.core});
      let element = null;
      if (qualifiedName !== "") {
        element = document.createElementNS(namespace, qualifiedName);
      }
      if (doctype !== null) {
        document.appendChild(doctype);
      }
      if (element !== null) {
        document.appendChild(element);
      }
      return document;
    }
    createHTMLDocument(title) {
      const document = Document.createImpl([], {
        core: this.core,
        options: {parsingMode: "html"}
      });
      const doctype = DocumentType.createImpl([], {
        core: this.core,
        ownerDocument: this,
        name: "html",
        publicId: "",
        systemId: ""
      });
      document.appendChild(doctype);
      const htmlElement = document.createElementNS("http://www.w3.org/1999/xhtml", "html");
      document.appendChild(htmlElement);
      const headElement = document.createElement("head");
      htmlElement.appendChild(headElement);
      if (title !== undefined) {
        const titleElement = document.createElement("title");
        headElement.appendChild(titleElement);
        titleElement.appendChild(document.createTextNode(title));
      }
      htmlElement.appendChild(document.createElement("body"));
      return document;
    }
    _removeFeature(feature, version) {
      feature = feature.toLowerCase();
      if (this._features[feature]) {
        if (version) {
          const versions = this._features[feature];
          for (let j = 0; j < versions.length; j++) {
            if (versions[j] === version) {
              versions.splice(j, 1);
              return;
            }
          }
        } else {
          delete this._features[feature];
        }
      }
    }
    _addFeature(feature, version) {
      feature = feature.toLowerCase();
      if (version) {
        if (!this._features[feature]) {
          this._features[feature] = [];
        }
        if (version instanceof Array) {
          Array.prototype.push.apply(this._features[feature], version);
        } else {
          this._features[feature].push(version);
        }
        if (feature === "processexternalresources" && (version === "script" || (version.indexOf && version.indexOf("script") !== -1)) && !vm.isContext(this._ownerDocument._global)) {
          vm.createContext(this._ownerDocument._global);
          this._ownerDocument._defaultView._globalProxy = vm.runInContext("this", this._ownerDocument._global);
          this._ownerDocument._defaultView = this._ownerDocument._defaultView._globalProxy;
        }
      }
    }
    _hasFeature(feature, version) {
      feature = feature ? feature.toLowerCase() : "";
      const versions = this._features[feature] || false;
      if (!version && versions.length && versions.length > 0) {
        return true;
      } else if (typeof versions === "string") {
        return versions === version;
      } else if (versions.indexOf && versions.length > 0) {
        for (let i = 0; i < versions.length; i++) {
          const found = versions[i] instanceof RegExp ? versions[i].test(version) : versions[i] === version;
          if (found) {
            return true;
          }
        }
        return false;
      }
      return false;
    }
  }
  module.exports = {implementation: DOMImplementationImpl};
})(require('process'));
