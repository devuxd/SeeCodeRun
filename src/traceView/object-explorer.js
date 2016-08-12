/* global Node, $*/
export class ObjectExplorer {
  static ObjectType = {JS: "JS", DOM: "DOM"};
  objectType = null;
  classType = null;
  nodeType =null;
  constructor(jsUtils, element, treeViewId, isParsable = true) {
    this.jsUtils = jsUtils;
    this.treeViewId = treeViewId;
    this.classType = jsUtils.type(element);
    if(element == null){
      this.objectType = ObjectExplorer.ObjectType.JS;
    }else{
      if(this.classType === "string" && isParsable){
        try{
         element = JSON.parse(element);
         this.classType = jsUtils.type(element);
        }catch(e){
          element = element.toString();
        }
      }

      if(jsUtils.isTypeInPrimitiveTypes(this.classType)){
        this.objectType = ObjectExplorer.ObjectType.JS;
      }else{
        if(element instanceof Node){
          this.objectType = ObjectExplorer.ObjectType.DOM;
          this.classType = element.toString();
          this.nodeType = element.nodeType;
        }else{
          this.objectType = ObjectExplorer.ObjectType.JS;
        }
      }
    }
    this.element = element;
    this._$buffer = $(document.createElement('div'));

  }

  escapeHMTLString(aString){
    return this._$buffer.text(aString).html();
  }
  //removes all child nodes that are not also elements or text
  getElements(childNodes) {
    let array = [];
    for(let i = 0; i < childNodes.length; i++) {
      if(childNodes[i] && (childNodes[i].nodeType === 1 || (childNodes[i].data && childNodes[i].data.trim()))) {
        array.push(childNodes[i]);
      }
    }
    return array;
  }

   makeAttributes(attributes) {
    let str = "";
    for(let i = 0; i < attributes.length; i++) {
      str += "<span class='treeObj attr'>" + attributes[i].tagName + "</span>"
        + "<span class='treeObj sign'>=\"</span><span class='treeObj attrValue'>" + attributes[i].nodeValue
        + "</span>" + "<span class='treeObj sign'>\"</span> ";
    }
    if(str.length > 1){
      return " " + str;
    }else{
      return str.trim();
    }
  }

  // convert DOM tree into HTML collapsible list
   generateDOMTree(parent, flag=true) {
    let children = this.getElements(parent.childNodes);
    let html = "";
    if(children.length !== 0) {
      if(flag) {
        html += "<ul class=treeObj collapsibleList>";
        flag = false;
      }
      else {
        html += "<ul>";
      }
      for(let i = 0; i < children.length; i++) {

        html += "<li";

        if(i === children.length - 1) {
          html += " class='treeObj lastChild'";
        }

        html += ">";
        if(children[i].nodeType !== 1) {
          html += `<span class='treeObj textNode'>"${children[i].data.trim()}"</span>`;
        }
        else {
          let attr = this.makeAttributes(children[i].attributes).trim();
          if(attr.length > 1)
            attr = " " + attr;
          html += "<span class='treeObj sign'>&lt;</span>"
            + "<span class='treeObj elementNode'>"
            + children[i].tagName.toLowerCase()
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

  wrapInULTag(ulContent, classAttribute = ""){
    return `<ul ${classAttribute}>${ulContent}</ul>`;
  }

  wrapInLITag(liContent, classAttribute = ""){
    return `<li ${classAttribute}>${liContent}</li>`;
  }

  generateLeafNode(object){
    let objectType = this.jsUtils.type(object);
    if(objectType === "string"){
      let escapedHMTLString =  this.escapeHMTLString(object);
      return `<span class='treeObj string' data-toggle="tooltip" data-placement="top" data-container = '#editorTooltipContent' title= '${escapedHMTLString}' >"${escapedHMTLString}"</span>`;
    }else{
      return `<span class='treeObj ${objectType}'>${object}</span>`;
    }

  }
  // convert object tree into HTML collapsible list
   generateObjectTree(object, isCollapsable = true) {

    if(this.jsUtils.isPrimitiveType(object)){
      let leafNode = this.generateLeafNode(object);
      return this.wrapInULTag(this.wrapInLITag(leafNode));
    }

    let keys = Object.keys(object);

    let html = "";
    if(keys.length) {
      for(let i = 0; i < keys.length; i++) {
        html += "<li>";

        let key = "<span class='treeObj key'>";
        let value;

        if(typeof keys[i] === "object") {
          key += keys[i].constructor.name;
        }
        else {
          key += keys[i];
        }

        key += "</span>";
        if(this.jsUtils.isPrimitiveType(object[keys[i]])){
         value = this.generateLeafNode(object[keys[i]]);
        }else{
          value = object[keys[i]].constructor.name;
          if(this.jsUtils.type(object[keys[i]]) === "array"){
            value += "[" + object[keys[i]].length + "]";
          }
          value += this.generateObjectTree(object[keys[i]], false);
        }

        html += key + ": " + value;
        html +="</li>";
      }
      return this.wrapInULTag(html, isCollapsable? "class='treeObj collapsibleList'" : "");
    }else{
      let emptyObject = this.jsUtils.type(object) === "array"? "[]" : "{}";
      return this.wrapInULTag(this.wrapInLITag(`<span class='treeObj key'>${emptyObject}</span>`));
    }
  }

  generatePopoverTreeViewContent($popover) {
    let content;
    if(this.objectType === ObjectExplorer.ObjectType.DOM) {
      content = this.generateDOMTreeViewHTMLString();
    }
    else {
      content = this.generateJSONTreeViewHTMLString();
    }
    return {objectType: this.objectType, classType: this.classType, nodeType: this.nodeType, content: content};
  }

  isObjectEmpty(obj) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object || obj.constructor === Array && obj.length === 0;
  }

  generateDOMTreeViewHTMLString() {
    let tree;
    if(!this.isObjectEmpty(this.element)) {
      tree = "<ul id = '"+this.treeViewId+"' class='treeObj treeView'><li>" + "<span class='treeObj sign'>&lt;</span>" +
        "<span class='treeObj elementNode'>" + this.element.tagName.toLowerCase() +
        "</span><span class='treeObj sign'>&gt;</span>" +
        this.generateDOMTree(this.element) +
        "</li></ul>";
    }
    else {
      tree = "<ul  id = '"+this.treeViewId+"' class='treeObj treeView'>" + "<span class='treeObj sign'>&lt;</span>" +
        "<span class='treeObj elementNode'>" + this.element.tagName.toLowerCase() +
        "</span><span class='treeObj sign'>&gt;</span>" + "</ul>";
    }
    return tree;
  }

  generateJSONTreeViewHTMLString() {
    if(this.jsUtils.isTypeInPrimitiveTypes(this.classType)){
      return `<div id = '${this.treeViewId}'> ${this.generateLeafNode(this.element)}</div>`;
    }
    let tree;
    let classType = this.classType;
    if(!this.isObjectEmpty(this.element)) {
      tree = `<ul  id = '${this.treeViewId}' class='treeObj treeView'>
            <li>${this.element.constructor.name}${classType === "array" ? "[" + this.element.length + "]" : ""}
              ${this.generateObjectTree(this.element)}
            </li>
          </ul>`;
    }
    else {
      tree = `<ul  id = '${this.treeViewId}' class = 'treeObj treeView' >${classType === "array" ? "[]" : "{}"}</ul>`;
    }
    return tree;
  }

}
