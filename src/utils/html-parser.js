/** HtmlParser extract elements within an html string, specially. */
export class HtmlParser{
    exceptionMalformedHTML = "Parsing Malformed HTML String"
    parseHtml(htmlString){
        let head = this.parseUniqueElement(htmlString, "head");
        let body = this.parseUniqueElement(htmlString, "body");
        return {head: this.removeTags(head, "head"), body: this.removeTags(body, "body")};
    }

    parseHtmlKeepTags(htmlString){
        let head = this.parseHead(htmlString);
        let body = this.parseBody(htmlString);
        return {head: head, body: body};
    }
    parseHead(htmlString){
        let head = htmlString.match(/<head[^>]*>([\s\S]*)<\/head>/gi);
        if(head.length){
            if(head.length > 1){
                throw {name: this.exceptionMalformedHTML , message: "More than one head element found"};
            }
            return head[0];
        }
         throw {name: this.exceptionMalformedHTML , message: "No head element found"};
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

    parseCSSScripts(){
// todo: <LINK href="special.css" rel="stylesheet" type="text/css">
    }
}