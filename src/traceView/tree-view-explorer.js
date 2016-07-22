
export class TreeViewExplorer {
  viewType = {HTML: "HTML", JSON: "JSON", PRIMITIVE: "PRIMITIVE"};
  constructor(element) {
    try{
     element = JSON.parse(element);
    }catch(e){
      element = element;
    }
    if(element == null){
      this.type = this.viewType.PRIMITIVE;
    }else{
      let elementType = typeof element;
      if(elementType === "object"){
        this.type = element.nodeName ? this.viewType.HTML : this.viewType.JSON;
      }else{
        this.type = this.viewType.PRIMITIVE;
      }
    }
    this.element = element;
  }
  //removes all child nodes that are not also elements or text
  getElements(childNodes) {
    let array = [];
    for(let i = 0; i < childNodes.length; i++) {
      if(childNodes[i].nodeType === 1 || childNodes[i].data.trim() !== "") {
        array.push(childNodes[i]);
      }
    }
    return array;
  }

   makeAttributes(attributes) {
    let str = "";
    for(let i = 0; i < attributes.length; i++) {
      str += "<span class='treeObj attr'>" + attributes[i].nodeName + "</span>"
        + "<span class='treeObj sign'>=\"</span><span class='treeObj attrValue'>" + attributes[i].nodeValue
        + "</span>" + "<span class='treeObj sign'>\"</span> ";
    }
    if(str.length > 1)
      return " " + str;
    else
      return str.trim();
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
          html += "<span class='treeObj textNode'>\"" +  children[i].data.trim() + "\"</span>";
        }
        else {
          let attr = this.makeAttributes(children[i].attributes).trim();
          if(attr.length > 1)
            attr = " " + attr;
          html += "<span class='treeObj sign'>&lt;</span>"
            + "<span class='treeObj elementNode'>"
            + children[i].nodeName.toLowerCase()
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
    let typeofObject = typeof object;
    if(typeofObject === "undefined"){
      return "<span class='treeObj undefined'>undefined</span>";
    }

    if(object == null){
      return "<span class='treeObj null'>null</span>";
    }

    if(typeofObject === "string"){
      return `<span class='treeObj stringLiteral'>"${object}"</span>`;
    }

    if(typeofObject === "number"){
      return `<span class='treeObj literal'>${object}</span>`;
    }

    if(typeofObject === "function"){
      return `<span class='treeObj function'>${object}</span>`;
    }

    // if(typeofObject !== "object"){
    //   return `<span class='treeObj undefined'>"${object}"</span>`;
    // }
    return null;
  }
  // convert object tree into HTML collapsible list
   generateObjectTree(object, isCollapsable = true) {
    let leafNode = this.generateLeafNode(object);
    if(leafNode){
      return this.wrapInULTag(this.wrapInLITag(leafNode));
    }
    let keys = Object.keys(object);
    let html = "";
    // leafNode handled object == null && typeof object !== "object"
    if(keys.length) {
      if(isCollapsable) {
        html += "<ul class='treeObj collapsibleList'>";
      }
      else {
        html += "<ul>";
      }
      for(let i = 0; i < keys.length; i++) {
        if(i === keys.length - 1) {
          html += "<li class='treeObj lastChild'>";
        }
        else {
          html += "<li>";
        }
        let key = "<span class='treeObj key'>";
        let value;

        if(typeof keys[i] === "object") {
          key += keys[i].constructor.name;// can this happen?
        }
        else {
          key += keys[i];
        }

        key += "</span>";
        let leafNodeValue = this.generateLeafNode(object[keys[i]]);
        if(leafNodeValue){
         value = leafNodeValue;
        }else{
          value = object[keys[i]].constructor.name;
          if(object[keys[i]] instanceof Array){
            value += "[" + object[keys[i]].length + "]";
          }
          value += this.generateObjectTree(object[keys[i]], false);
        }

        html += key + ": " + value;
        html +="</li>";
      }
      return html + "</ul>";
    }else{
      return this.wrapInULTag(this.wrapInLITag("<span class='treeObj key'>{}</span>"));
    }
  }

  getPopoverElementContent($popover) {
    let content;
    if(this.type === this.viewType.HTML) {
      content = this.dispDOMNode();
    }
    else {
      if(this.type === this.viewType.JSON) {
        content = this.dispObject();
      }else {
        content = this.dispObject();
      }
  		return {type: this.type, content: content};
    }
  }

  isObjectEmpty(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object || obj.constructor === Array && obj.length === 0;
  }

  dispDOMNode() {
    let tree;
    if(!this.isObjectEmpty(this.element)) {
      tree = "<ul class='treeObj treeView'><li>" + "<span class='treeObj sign'>&lt;</span>" +
        "<span class='treeObj elementNode'>" + this.element.nodeName.toLowerCase() +
        "</span><span class='treeObj sign'>&gt;</span>" +
        this.generateDOMTree(this.element) +
        "</li></ul>";
    }
    else {
      tree = "<ul class='treeObj treeView'>" + "<span class='treeObj sign'>&lt;</span>" +
        "<span class='treeObj elementNode'>" + this.element.nodeName.toLowerCase() +
        "</span><span class='treeObj sign'>&gt;</span>" + "</ul>";
    }
    return tree;
  }

  dispObject() {
    let tree;
    let leafNode = this.generateLeafNode(this.element);
    if(leafNode){
      return leafNode;
    }

    if(!this.isObjectEmpty(this.element)) {
      tree = "<ul class='treeObj treeView'><li>" + this.element.constructor.name +
        (this.element instanceof Array ? "[" + this.element.length + "]" : "") +
        this.generateObjectTree(this.element) +
        "</li></ul>";
    }
    else {
      tree = "<ul class='treeObj treeView'>" + this.element.constructor.name +
        (this.element instanceof Array ? "[" + this.element.length + "]" : "{}") +
        "</ul>";
    }
    return tree;
  }

}
