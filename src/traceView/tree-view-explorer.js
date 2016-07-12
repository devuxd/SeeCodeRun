export class TreeViewExplorer {
  constructor(element) {
    this.element = element;
    this.type = element.nodeName ? "dom" : "json";
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
    var children = getElements(parent.childNodes);
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
          html += " class=lastChild"
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
            + "</span><span class=sign>" + attr + "&gt;</span>"
            // + "..."
            // + "<span class=sign>&lt;/</span><span class=elementNode>"
            // + children[i].nodeName.toLowerCase()
            // + "</span><span class=sign>&gt;</span>";
        }

        html += generateDOMTree(children[i], false) + "</li>";
      }
      return html + "</ul>";
    }
    // else if(parent.innerHTML !== undefined){
    //   return html + "<ul><li class=lastChild>" + "\"" + parent.innerHTML + "\"" + "</li></ul>";
    // }
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
        html += "<ul class=collapsibleList>"
        flag = false;
      }
      else {
        html += "<ul>"
      }
      for(var i = 0; i < keys.length; i++) {
        if(i === keys.length - 1) {
          html += "<li class=lastChild>"
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

        key += "</span>"

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
        html += generateObjectTree(object[keys[i]], false) + "</li>";
      }
      return html + "</ul>";
    }
    else {
      return "";
    }
  }

  display() {
    if(this.type === "dom") {
      dispDOMNode();
    }
    else if(this.type === "json") {
      dispObject();
    }
  }

   dispDOMNode() {
    var a = "<ul class=treeView><li>" + "<span class=sign>&lt;</span>"
      + "<span class=elementNode>" + node.nodeName.toLowerCase() + "</span><span class=sign>&gt;</span>";
    a += this.generateDOMTree(this.element);
    a += "</li></ul>";
    printh(a);
    CollapsibleLists.apply();
  }

   dispObject() {
    var a = "<ul class=treeView><li>" + object.constructor.name;
    a += this.generateObjectTree(this.element);
    a += "</li></ul>";
    printh(a);
    CollapsibleLists.apply();
  }

   printh(tree) {
    var element = document.createElement("div");
    element.innerHTML = tree;
    document.body.appendChild(element);
  }
}
