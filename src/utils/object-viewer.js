/* global Node, $*/
import {JsUtils} from "./js-utils";
export class ObjectViewer {
  static ObjectType = {JS: "JS", DOM: "DOM"};
  objectType = null;
  classType = null;
  nodeType = null;

  constructor(element, objectViewId, isParsable = true) {
    this.objectViewId = objectViewId;
    this.classType = JsUtils.type(element);
    if (element == null) {
      this.objectType = ObjectViewer.ObjectType.JS;
    } else {
      if (this.classType === "string" && isParsable) {
        try {
          element = JSON.parse(element);
          this.classType = JsUtils.type(element);
        } catch (e) {
          element = element.toString();
        }
      }

      if (JsUtils.isTypeInPrimitiveTypes(this.classType)) {
        this.objectType = ObjectViewer.ObjectType.JS;
      } else {
        if (element instanceof Node || JsUtils.type(element.nodeType) === "number") {
          this.objectType = ObjectViewer.ObjectType.DOM;
          this.classType = element.toString();
          this.nodeType = element.nodeType;
          this.nodeName = element.nodeType === 1 ? "tagName" : "nodeName";
        } else {
          this.objectType = ObjectViewer.ObjectType.JS;
        }
      }
    }
    this.element = element;
    this._$buffer = $(document.createElement('div'));

  }

  // createNode(node) {
  //   let node = null;
  //   if (node == null) {
  //     return node;
  //   }
  //
  //   if (node instanceof Node) {
  //
  //   } else {
  //     if (node) {
  //
  //     }
  //   }
  //   node = document.createElement(tag);
  //   return node;
  // }

  escapeHMTLString(aString) {
    if (aString && JsUtils.type(aString) !== "string") {
      aString = aString.toString();
    }
    return this._$buffer.text(aString).html();
  }

  stringifyHMTLString(aHTMLString) {
    return this._$buffer.html(aHTMLString).text();
  }

  //removes all child nodes that are not also elements or text
  getElements(childNodes) {
    let array = [];
    for (let i = 0; i < childNodes.length; i++) {
      if (childNodes[i] && (childNodes[i].nodeType === Node.ELEMENT_NODE || childNodes[i].data)) {
        array.push(childNodes[i]);
      }
    }
    return array;
  }

  makeAttributes(attributes) {
    let str = "";
    for (let i = 0; i < attributes.length; i++) {
      str += "<span class='treeObj attr'>" + attributes[i][this.nodeName] + "</span>"
        + "<span class='treeObj sign'>=\"</span><span class='treeObj attrValue'>" + this.escapeHMTLString(attributes[i].nodeValue)
        + "</span>" + "<span class='treeObj sign'>\"</span> ";
    }
    if (str.length > 1) {
      return " " + str;
    } else {
      return str.trim();
    }
  }

  // convert DOM tree into HTML collapsible list
  generateDOMTree(parent, flag = true) {
    let children = this.getElements(parent.childNodes);
    let html = "";
    if (children.length !== 0) {
      if (flag) {
        html += "<ul class=treeObj collapsibleList>";
        flag = false;
      }
      else {
        html += "<ul>";
      }
      for (let i = 0; i < children.length; i++) {

        html += "<li";

        if (i === children.length - 1) {
          html += " class='treeObj lastChild'";
        }

        html += ">";
        if (children[i].nodeType !== 1) {
          html += `<span class='treeObj textNode'>"${children[i].data.trim()}"</span>`;
        }
        else {
          let attr = this.makeAttributes(children[i].attributes).trim();
          if (attr.length > 1)
            attr = " " + attr;
          html += "<span class='treeObj sign'>&lt;</span>"
            + "<span class='treeObj elementNode'>"
            + children[i][this.nodeName].toLowerCase()
            + "</span><span class='treeObj sign'>" + attr + "&gt;</span>";
        }

        html += this.generateDOMTree(children[i], false) + "</li>";
      }
      return html + "</ul>";
    }
    else {
      return "";
    }
  }

  wrapInULTag(ulContent, classAttribute = "") {
    return `<ul ${classAttribute}>${ulContent}</ul>`;
  }

  wrapInLITag(liContent, classAttribute = "") {
    return `<li ${classAttribute}>${liContent}</li>`;
  }

  generateLeafNode(object) {
    let objectType = JsUtils.type(object);
    let escapedHMTLString = object == null ? object : this.escapeHMTLString(object);
    if (objectType === "string") {
      let escapedHMTLString1 = escapedHMTLString.length > 32 ? escapedHMTLString.substring(0, 32) : escapedHMTLString;
      let escapedHMTLString2 = escapedHMTLString.length > 32 ? escapedHMTLString.substring(32) : "";

      return `<span class='treeObj string' data-toggle="tooltip"  data-placement="bottom" title= '${escapedHMTLString}' >"${escapedHMTLString1}</span><span class='treeObj string'>${escapedHMTLString2}"</span>`;
      // return `<span class='treeObj string' data-tooltip = '${escapedHMTLString === ""? " " : escapedHMTLString}' data-tooltip-position = 'top left'>"${escapedHMTLString}"</span>`;
      // data-viewport = '#editorTooltipContent'
    } else {
      return `<span class='treeObj ${objectType}'>${escapedHMTLString}</span>`;
    }

  }

  generateLeaf(object) {
    let objectType = JsUtils.type(object);
    let escapedHMTLString = object == null ? object : this.escapeHMTLString(object);
    if (objectType === "string") {
      return `<span class='lineObj string'>"${escapedHMTLString}"</span>`;
    } else {
      return `<span class='lineObj ${objectType}'>${escapedHMTLString}</span>`;
    }

  }

  // convert object tree into HTML collapsible list
  generateObjectTree(object, isCollapsable = true, visited, visitedValue) {
    let result = null;
    visited = visited ? visited : [];
    visitedValue = visitedValue ? visitedValue : {};

    let visitedIndex = visited.indexOf(object);
    if (visitedIndex > -1) {
      return visitedValue[visitedIndex];
    } else {
      visited.push(object);
      visitedIndex = visited.length - 1;
    }

    if (JsUtils.isPrimitiveType(object)) {
      let leafNode = this.generateLeafNode(object);
      result = this.wrapInULTag(this.wrapInLITag(leafNode));
      visitedValue[visitedIndex] = result;
      return result;
    }
    let keys = Object.keys(object);

    let html = "";
    if (keys.length) {
      for (let i = 0; i < keys.length; i++) {
        html += "<li>";

        let key = "<span class='treeObj key'>";
        let value = "";

        if (typeof keys[i] === "object") {
          key += keys[i].constructor.name;
        }
        else {
          key += keys[i];
        }

        key += "</span>";
        if (JsUtils.isPrimitiveType(object[keys[i]])) {
          value += this.generateLeafNode(object[keys[i]]);
        } else {
          if (object[keys[i]].constructor) {
            value += object[keys[i]].constructor.name;
            if (JsUtils.type(object[keys[i]]) === "array") {
              value += "[" + object[keys[i]].length + "]";
            }
            value += this.generateObjectTree(object[keys[i]], false, visited, visitedValue);
          } else {
            value += JsUtils.type(object[keys[i]]);
          }
        }

        html += key + ": " + value;
        // if (html.length> 1000){
        // //   console.log(key, value);
        // html +="</li>";
        // break;
        // }
        html += "</li>";
      }
      result = this.wrapInULTag(html, isCollapsable ? "class='treeObj collapsibleList'" : "");
      visitedValue[visitedIndex] = result;
      return result;
    } else {
      let emptyObject = JsUtils.type(object) === "array" ? "[]" : "{}";
      result = this.wrapInULTag(this.wrapInLITag(`<span class='treeObj key'>${emptyObject}</span>`));
      visitedValue[visitedIndex] = result;
      return result;
    }
  }

  generatePopoverTreeViewContent() {
    let content;
    if (this.objectType === ObjectViewer.ObjectType.DOM) {
      content = this.generateDOMTreeViewHTMLString();
    }
    else {
      content = this.generateJSONTreeViewHTMLString();
    }
    return {
      objectType: this.objectType,
      classType: this.classType,
      nodeType: this.nodeType,
      content: "<div id='treeViewContainer'>" + content + "</div>"
    };
  }

  generateLineViewContent() {
    let content;
    if (this.objectType === ObjectViewer.ObjectType.DOM) {
      content = this.generateDOMLineViewHTMLString();
    }
    else {
      content = this.generateJSONLineViewHTMLString();
    }
    return {objectType: this.objectType, classType: this.classType, nodeType: this.nodeType, content: content};
  }

  isObjectEmpty(obj) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object || obj.constructor === Array && obj.length === 0;
  }

  generateDOMTreeViewHTMLString() {
    let tree;
    if (!this.isObjectEmpty(this.element)) {
      // console.log(this.element);
      tree = "<ul id = '" + this.objectViewId + "' class='treeObj treeView'><li>" + "<span class='treeObj sign'>&lt;</span>" +
        "<span class='treeObj elementNode'>" + this.element[this.nodeName].toLowerCase() +
        "</span><span class='treeObj sign'>&gt;</span>" +
        this.generateDOMTree(this.element) +
        "</li></ul>";
    }
    else {
      tree = "<ul  id = '" + this.objectViewId + "' class='treeObj treeView'>" + "<span class='treeObj sign'>&lt;</span>" +
        "<span class='treeObj elementNode'>" + this.element[this.nodeName].toLowerCase() +
        "</span><span class='treeObj sign'>&gt;</span>" + "</ul>";
    }
    return tree;
  }

  generateJSONTreeViewHTMLString() {
    if (JsUtils.isTypeInPrimitiveTypes(this.classType)) {
      return `<div id = '${this.objectViewId}'> ${this.generateLeafNode(this.element)}</div>`;
    }
    let tree;
    let classType = this.classType;
    if (!this.isObjectEmpty(this.element)) {
      tree = `<ul  id = '${this.objectViewId}' class='treeObj treeView'>
            <li>${this.element.constructor.name}${classType === "array" ? "[" + this.element.length + "]" : ""}
              ${this.generateObjectTree(this.element)}
            </li>
          </ul>`;
    }
    else {
      tree = `<ul  id = '${this.objectViewId}' class = 'treeObj treeView' >${classType === "array" ? "[]" : "{}"}</ul>`;
    }
    return tree;
  }

  generateJSONLineViewHTMLString() {
    if (JsUtils.isTypeInPrimitiveTypes(this.classType)) {
      return `<span id = '${this.objectViewId}'> ${this.generateLeaf(this.element)}</span>`;
    }
    let line;
    let classType = this.classType;
    if (!this.isObjectEmpty(this.element)) {
      line = `<span  id = '${this.objectViewId}' class='lineObj key'>${this.element.constructor.name}${classType === "array" ? "[" + this.element.length + "]" : ""}</span>`;
    }
    else {
      line = `<span  id = '${this.objectViewId}' class = 'lineObj key' >${classType === "array" ? "[]" : "{}"}</span>`;
    }
    return line;
  }

  // generateDOMLineViewHTMLString() {
  //   let tree;
  //   // console.log(this.element);
  //   tree = "<span id = '"+this.objectViewId+"' class='elementNode'>" + this.element[this.nodeName].toLowerCase() +"</span>";
  //   return tree;
  // }

  generateDOMLineViewHTMLString() {
    return $("<span id = '" + this.objectViewId + "' class='elementNode'>" + this.element[this.nodeName].toLowerCase() + "</span>");
  }

  // tabify(){
  //   let tabbedContent =`<ul id = "reviewTabs" class = "nav nav-tabs" role = "tablist">
  //           <li id = "previewTab" class = "active" role = "tab" aria-controls = "preview">
  //             <a href = "#preview" data-toggle = "tab">
  //               Output
  //             </a>
  //           </li>
  //           <li id = "visualizationTab" role = "tab" aria-controls = "visualization-container">
  //             <a href = "#visualization-container"  data-toggle = "tab">
  //               Debug
  //             </a>
  //           </li>
  //         </ul>
  //         <div  class = "tab-content">
  //           <div id = "preview" class = "tab-pane fade in active" role = "tabpanel" aria-labelledby="previewTab">
  //             <html-viewer></html-viewer>
  //           </div>
  //           <div id = "visualization-container" class = "tab-pane fade"  role = "tabpanel" aria-labelledby="visualizationTab">
  //             <trace-player tracePlayer.bind = "traceViewController.tracePlayer"></trace-player>
  //             <vis-viewer vis-viewer.bind = "visViewer"></vis-viewer>
  //             <trace-search trace-search.bind = "traceSearch"></trace-search>
  //           </div>
  //         </div>
  //       </div>`;
  // }

}
