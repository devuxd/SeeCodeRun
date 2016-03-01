/* */ 
"use strict";
const DocumentImpl = require('./nodes/Document-impl');
const mappings = {
  HTMLElement: {
    file: require('./generated/HTMLElement'),
    tags: []
  },
  HTMLAnchorElement: {
    file: require('./generated/HTMLAnchorElement'),
    tags: ["a"]
  },
  HTMLAppletElement: {
    file: require('./generated/HTMLAppletElement'),
    tags: ["applet"]
  },
  HTMLAreaElement: {
    file: require('./generated/HTMLAreaElement'),
    tags: ["area"]
  },
  HTMLAudioElement: {
    file: require('./generated/HTMLAudioElement'),
    tags: ["audio"]
  },
  HTMLBaseElement: {
    file: require('./generated/HTMLBaseElement'),
    tags: ["base"]
  },
  HTMLBodyElement: {
    file: require('./generated/HTMLBodyElement'),
    tags: ["body"]
  },
  HTMLBRElement: {
    file: require('./generated/HTMLBRElement'),
    tags: ["br"]
  },
  HTMLButtonElement: {
    file: require('./generated/HTMLButtonElement'),
    tags: ["button"]
  },
  HTMLCanvasElement: {
    file: require('./generated/HTMLCanvasElement'),
    tags: ["canvas"]
  },
  HTMLDataElement: {
    file: require('./generated/HTMLDataElement'),
    tags: ["data"]
  },
  HTMLDataListElement: {
    file: require('./generated/HTMLDataListElement'),
    tags: ["datalist"]
  },
  HTMLDialogElement: {
    file: require('./generated/HTMLDialogElement'),
    tags: ["dialog"]
  },
  HTMLDirectoryElement: {
    file: require('./generated/HTMLDirectoryElement'),
    tags: ["dir"]
  },
  HTMLDivElement: {
    file: require('./generated/HTMLDivElement'),
    tags: ["div"]
  },
  HTMLDListElement: {
    file: require('./generated/HTMLDListElement'),
    tags: ["dl"]
  },
  HTMLEmbedElement: {
    file: require('./generated/HTMLEmbedElement'),
    tags: ["embed"]
  },
  HTMLFieldSetElement: {
    file: require('./generated/HTMLFieldSetElement'),
    tags: ["fieldset"]
  },
  HTMLFontElement: {
    file: require('./generated/HTMLFontElement'),
    tags: ["font"]
  },
  HTMLFormElement: {
    file: require('./generated/HTMLFormElement'),
    tags: ["form"]
  },
  HTMLFrameElement: {
    file: require('./generated/HTMLFrameElement'),
    tags: ["frame"]
  },
  HTMLFrameSetElement: {
    file: require('./generated/HTMLFrameSetElement'),
    tags: ["frameset"]
  },
  HTMLHeadingElement: {
    file: require('./generated/HTMLHeadingElement'),
    tags: ["h1", "h2", "h3", "h4", "h5", "h6"]
  },
  HTMLHeadElement: {
    file: require('./generated/HTMLHeadElement'),
    tags: ["head"]
  },
  HTMLHRElement: {
    file: require('./generated/HTMLHRElement'),
    tags: ["hr"]
  },
  HTMLHtmlElement: {
    file: require('./generated/HTMLHtmlElement'),
    tags: ["html"]
  },
  HTMLIFrameElement: {
    file: require('./generated/HTMLIFrameElement'),
    tags: ["iframe"]
  },
  HTMLImageElement: {
    file: require('./generated/HTMLImageElement'),
    tags: ["img"]
  },
  HTMLInputElement: {
    file: require('./generated/HTMLInputElement'),
    tags: ["input"]
  },
  HTMLLabelElement: {
    file: require('./generated/HTMLLabelElement'),
    tags: ["label"]
  },
  HTMLLegendElement: {
    file: require('./generated/HTMLLegendElement'),
    tags: ["legend"]
  },
  HTMLLIElement: {
    file: require('./generated/HTMLLIElement'),
    tags: ["li"]
  },
  HTMLLinkElement: {
    file: require('./generated/HTMLLinkElement'),
    tags: ["link"]
  },
  HTMLMapElement: {
    file: require('./generated/HTMLMapElement'),
    tags: ["map"]
  },
  HTMLMediaElement: {
    file: require('./generated/HTMLMediaElement'),
    tags: []
  },
  HTMLMenuElement: {
    file: require('./generated/HTMLMenuElement'),
    tags: ["menu"]
  },
  HTMLMetaElement: {
    file: require('./generated/HTMLMetaElement'),
    tags: ["meta"]
  },
  HTMLMeterElement: {
    file: require('./generated/HTMLMeterElement'),
    tags: ["meter"]
  },
  HTMLModElement: {
    file: require('./generated/HTMLModElement'),
    tags: ["del", "ins"]
  },
  HTMLObjectElement: {
    file: require('./generated/HTMLObjectElement'),
    tags: ["object"]
  },
  HTMLOListElement: {
    file: require('./generated/HTMLOListElement'),
    tags: ["ol"]
  },
  HTMLOptGroupElement: {
    file: require('./generated/HTMLOptGroupElement'),
    tags: ["optgroup"]
  },
  HTMLOptionElement: {
    file: require('./generated/HTMLOptionElement'),
    tags: ["option"]
  },
  HTMLOutputElement: {
    file: require('./generated/HTMLOutputElement'),
    tags: ["output"]
  },
  HTMLParagraphElement: {
    file: require('./generated/HTMLParagraphElement'),
    tags: ["p"]
  },
  HTMLParamElement: {
    file: require('./generated/HTMLParamElement'),
    tags: ["param"]
  },
  HTMLPreElement: {
    file: require('./generated/HTMLPreElement'),
    tags: ["pre"]
  },
  HTMLProgressElement: {
    file: require('./generated/HTMLProgressElement'),
    tags: ["progress"]
  },
  HTMLQuoteElement: {
    file: require('./generated/HTMLQuoteElement'),
    tags: ["blockquote", "q"]
  },
  HTMLScriptElement: {
    file: require('./generated/HTMLScriptElement'),
    tags: ["script"]
  },
  HTMLSelectElement: {
    file: require('./generated/HTMLSelectElement'),
    tags: ["select"]
  },
  HTMLSourceElement: {
    file: require('./generated/HTMLSourceElement'),
    tags: ["source"]
  },
  HTMLSpanElement: {
    file: require('./generated/HTMLSpanElement'),
    tags: ["span"]
  },
  HTMLStyleElement: {
    file: require('./generated/HTMLStyleElement'),
    tags: ["style"]
  },
  HTMLTableCaptionElement: {
    file: require('./generated/HTMLTableCaptionElement'),
    tags: ["caption"]
  },
  HTMLTableCellElement: {
    file: require('./generated/HTMLTableCellElement'),
    tags: []
  },
  HTMLTableColElement: {
    file: require('./generated/HTMLTableColElement'),
    tags: ["col", "colgroup"]
  },
  HTMLTableDataCellElement: {
    file: require('./generated/HTMLTableDataCellElement'),
    tags: ["td"]
  },
  HTMLTableElement: {
    file: require('./generated/HTMLTableElement'),
    tags: ["table"]
  },
  HTMLTableHeaderCellElement: {
    file: require('./generated/HTMLTableHeaderCellElement'),
    tags: ["th"]
  },
  HTMLTimeElement: {
    file: require('./generated/HTMLTimeElement'),
    tags: ["time"]
  },
  HTMLTitleElement: {
    file: require('./generated/HTMLTitleElement'),
    tags: ["title"]
  },
  HTMLTableRowElement: {
    file: require('./generated/HTMLTableRowElement'),
    tags: ["tr"]
  },
  HTMLTableSectionElement: {
    file: require('./generated/HTMLTableSectionElement'),
    tags: ["thead", "tbody", "tfoot"]
  },
  HTMLTemplateElement: {
    file: require('./generated/HTMLTemplateElement'),
    tags: ["template"]
  },
  HTMLTextAreaElement: {
    file: require('./generated/HTMLTextAreaElement'),
    tags: ["textarea"]
  },
  HTMLTrackElement: {
    file: require('./generated/HTMLTrackElement'),
    tags: ["track"]
  },
  HTMLUListElement: {
    file: require('./generated/HTMLUListElement'),
    tags: ["ul"]
  },
  HTMLUnknownElement: {
    file: require('./generated/HTMLUnknownElement'),
    tags: []
  },
  HTMLVideoElement: {
    file: require('./generated/HTMLVideoElement'),
    tags: ["video"]
  }
};
module.exports = (core) => {
  for (const interfaceName of Object.keys(mappings)) {
    const file = mappings[interfaceName].file;
    const tags = mappings[interfaceName].tags;
    core[interfaceName] = file.interface;
    for (const tagName of tags) {
      DocumentImpl.implementation.prototype._elementBuilders[tagName] = (document, elName) => {
        return file.create([], {
          core,
          ownerDocument: document,
          localName: elName || tagName.toUpperCase()
        });
      };
    }
  }
};
