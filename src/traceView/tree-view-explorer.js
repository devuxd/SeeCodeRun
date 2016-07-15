/* global CollapsibleLists */
export class TreeViewExplorer {
  viewType = {HTML: "HTML", JSON: "JSON", PRIMITIVE: "PRIMITIVE"}
  constructor(element) {
    console.log(element);
    this.element = element;
    if(element !== null && typeof element === "object")
      this.type = element.nodeName ? this.viewType.HTML : this.viewType.JSON;
    else
      this.type = this.viewType.PRIMITIVE;
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

        html += ">"
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

  // convert object tree into HTML collapsible list
   generateObjectTree(object, flag=true) {
    let keys = Object.keys(object);
    let html = "";
    if(typeof object === "object" && keys.length !== 0) {
      if(flag) {
        html += "<ul class='treeObj collapsibleList'>";
        flag = false;
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
          key += keys[i].constructor.name;
        }
        else {
          key += keys[i];
        }

        key += "</span>";

        if(typeof object[keys[i]] === "object") {
          value = object[keys[i]].constructor.name;
          if(object[keys[i]] instanceof Array)
            value += "[" + object[keys[i]].length + "]";
        }
        else if(typeof object[keys[i]] === "string") {
          value = "<span class='treeObj stringLiteral'> \"" + object[keys[i]] + "\" </span>";
        }
        else {
          value = "<span class='treeObj literal'>" + object[keys[i]] + "</span>";
        }

        html += key + ": " + value;
        html += this.generateObjectTree(object[keys[i]], false) + "</li>";
      }
      return html + "</ul>";
    }
    else {
      return "";
    }
  }

  appendTo$PopoverElement($popover) {
    let content;
    if(this.type === this.viewType.HTML) {
      content = this.dispDOMNode();
    }
    else if(this.type === this.viewType.JSON) {
      content = this.dispObject();
    }

    else {
      let text = typeof this.element === "string" ? "\"" + this.element + "\"" : this.element;
      content = "<ul class='treeObj treeView'>" + text + "</ul>";
    }

		// $popover.attr("title", "Exploring "+this.type);
		$popover.attr("data-content", '<div class="custom-popover-title">Exploring '+this.type+' Element</div>'+content);
    setTimeout(function() {CollapsibleLists.apply();}, 50)
  }

  appendContent(container) {
    let content;
    if(this.type === "dom") {
      content = this.dispDOMNode();
    }
    else if(this.type === "json") {
      content = this.dispObject();
    }
    this.appendHtml(container, content);
    CollapsibleLists.apply();
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

  appendHtml(container, tree) {
    container.innerHTML = tree;
  }
}
