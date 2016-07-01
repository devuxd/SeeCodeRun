/* global $ */
/** HtmlParser extract elements within an html string, specially. */
export class HtmlParser{
    exceptionMalformedHTML = "Parsing Malformed HTML String";

    parseHtmlRemoveTags(htmlString){
        let head = this.parseUniqueElement(htmlString, "head");
        let body = this.parseUniqueElement(htmlString, "body");
        return {
            head: this.removeTags(head, "head"), headAttributes: this.parseElementAttributes(head, "head"),
            body: this.removeTags(body, "body"), bodyAttributes: this.parseElementAttributes(body, "body")
        };
    }

    parseHtml(htmlString){
        let head = this.parseUniqueElement(htmlString, "head");
        let body = this.parseUniqueElement(htmlString, "body");
        return {head: head, body: body};
    }
    parseElementAttributes(elementString, tag, flags = "gi"){
        let attributes = [];
        let startTagRegExp = new RegExp(`\\s*<\\s*${tag}([^>]*)>`, flags);
        let match = startTagRegExp.exec(elementString);
        let attributesString = match && match.length > 1 ? match[1] : null;
        if(attributesString){
            let $tempDiv = $(`<div ${attributesString}></div>`);
            attributes = this.getAttributes($tempDiv);
        }

        return attributes;
    }

    parseUniqueElement(htmlString, tag, flags){
        let elements = this.parseElementByTag(htmlString, tag, flags);

        if(elements && elements.length){
            if(elements.length > 1){
                throw {name: this.exceptionMalformedHTML , message: `More than one ${tag} element found`};
            }
            return elements[0];
        }
         throw {name: this.exceptionMalformedHTML , message: `No ${tag} element found`};
    }

    parseElementByTag(htmlString, tag, flags = "gi"){
        let tagRegExp = new RegExp(`\\s*<\\s*${tag}[^>]*>[\\s\\S]*<\\s*\\/\\s*${tag}\\s*>\\s*`, flags);
        return htmlString.match(tagRegExp);
    }

    removeTags(elementString, tag, flags = "gi"){
        let startTagRegExp = new RegExp(`\\s*<\\s*${tag}[^>]*>`, flags);
        let endTagRegExp = new RegExp(`<\\s*\\/\\s*${tag}\\s*>\\s*`, flags);
        elementString = elementString.replace(startTagRegExp, "");
        elementString = elementString.replace(endTagRegExp, "");
        return elementString;
    }

    parseJsScripts(elementString){
        let sources = [];
         let elements = this.parseElementByTag(elementString, "script");
         for(let elementIndex in elements){
             let srcRegExp = /\s*src\s*=\s*\"([^\"]+)\"\s*/gi;
             let match = srcRegExp.exec(elements[elementIndex]);
             let source = match && match.length > 1 ? match[1] : null;
             if(source){
                sources.push(source);
             }
         }
         return sources;
    }

    replaceScriptElements(element, containerDocument) {
        if ( element.tagName.toLoweCase().indexOf('script') > -1) {
            element.parentNode.replaceChild( this.createScriptElementCopy(element, containerDocument) , element);
        }
        else {
            let children = element.childNodes;
            for(let childIndex = 0; childIndex < children.length; childIndex++ ) {
                this.replaceScriptElements( children[childIndex] , containerDocument);
            }
        }
        return element;
    }

    createScriptElementCopy(scriptElement, containerDocument){
        let script  = containerDocument.createElement("script");
        script.textContent = scriptElement.textContent;
        for(let attributeIndex = 0; attributeIndex < scriptElement.attributes.length; attributeIndex++ ) {
            script.setAttribute( scriptElement.attributes[attributeIndex].name, scriptElement.attributes[attributeIndex].value );
        }
        return script;
    }

    createElementCopy(element, containerDocument){
        let elementCopy  = containerDocument.createElement(element.tagName);
        elementCopy.innerHTML = element.innerHTML;
        for(let attributeIndex = 0; attributeIndex < element.attributes.length; attributeIndex++ ) {
            elementCopy.setAttribute( element.attributes[attributeIndex].name, element.attributes[attributeIndex].value );
        }
        return elementCopy;
    }

    copyAttributes($from, $to){
        let attributes = $from.prop("attributes");
        $.each(attributes, function copyingAttributes() {
            $to.attr(this.name, this.value);
        });
    }

    getAttributes($from){
        return $from.prop("attributes");
    }

    setAttributes($to, attributes){
        $.each(attributes, function settingAttributes() {
            $to.attr(this.name, this.value);
        });
    }

    parseCSSScripts(){
// todo: <LINK href="special.css" rel="stylesheet" type="text/css">
    }
}