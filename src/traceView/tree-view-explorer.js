/* global CollapsibleLists */
export class TreeViewExplorer {
  viewType = {HTML: "HTML", JSON: "JSON" }
  constructor(element) {
    if(element) {
      this.element = element;
      this.type = element.nodeName ? this.viewType.HTML : this.viewType.JSON;
    }
  }
  //removes all child nodes that are not also elements or text
  getElements(childNodes) {
    var array = [];
    for(var i = 0; i < childNodes.length; i++) {
      if(childNodes[i].nodeType === 1 || childNodes[i].data.trim() !== "") {
        array.push(childNodes[i]);
      }
    }
    return array;
  }

   makeAttributes(attributes) {
    var str = "";
    for(var i = 0; i < attributes.length; i++) {
      str += "<span class=attr>" + attributes[i].nodeName + "</span>"
        + "<span class=sign>=\"</span><span class=attrValue>" + attributes[i].nodeValue
        + "</span>" + "<span class=sign>\"</span> ";
    }
    if(str.length > 1)
      return " " + str;
    else
      return str.trim();
  }

  // convert DOM tree into HTML collapsible list
   generateDOMTree(parent, flag=true) {
    var children = this.getElements(parent.childNodes);
    var html = "";
    if(children.length !== 0) {
      if(flag) {
        html += "<ul class=collapsibleList>";
        flag = false;
      }
      else {
        html += "<ul>";
      }
      for(var i = 0; i < children.length; i++) {

        html += "<li";

        if(i === children.length - 1) {
          html += " class=lastChild";
        }

        html += ">"
        if(children[i].nodeType !== 1) {
          html += "<span class=textNode>\"" +  children[i].data.trim() + "\"</span>";
        }
        else {
          var attr = this.makeAttributes(children[i].attributes).trim();
          if(attr.length > 1)
            attr = " " + attr;
          html += "<span class=sign>&lt;</span>"
            + "<span class=elementNode>"
            + children[i].nodeName.toLowerCase()
            + "</span><span class=sign>" + attr + "&gt;</span>";
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
    var keys = Object.keys(object);
    var html = "";
    if(typeof object === "object" && keys.length !== 0) {
      if(flag) {
        html += "<ul class=collapsibleList>";
        flag = false;
      }
      else {
        html += "<ul>";
      }
      for(var i = 0; i < keys.length; i++) {
        if(i === keys.length - 1) {
          html += "<li class=lastChild>";
        }
        else {
          html += "<li>";
        }
        var key = "<span class=key>";
        var value;

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
          value = "<span class=stringLiteral> \"" + object[keys[i]] + "\" </span>";
        }
        else {
          value = "<span class=literal>" + object[keys[i]] + "</span>";
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

		// $popover.attr("title", "Exploring "+this.type);
		$popover.attr("data-content", '<div class="custom-popover-title">Exploring '+this.type+' Element</div>'+content);
    CollapsibleLists.apply();
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

   dispDOMNode() {
    var tree = "<ul class=treeView><li>" + "<span class=sign>&lt;</span>"
      + "<span class=elementNode>" + this.element.nodeName.toLowerCase() + "</span><span class=sign>&gt;</span>";
    tree += this.generateDOMTree(this.element);
    tree += "</li></ul>";
    return tree;
  }

   dispObject() {
    var tree = "<ul class=treeView><li>" + this.element.constructor.name;
    tree += this.generateObjectTree(this.element);
    tree += "</li></ul>";
    return tree;
  }

   appendHtml(container, tree) {
    container.innerHTML = tree;
  }
}
