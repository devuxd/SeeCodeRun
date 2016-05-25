/* global Firebase */
/* global Firepad */
export class FirebaseManager{
    baseURL = "https://seecoderun.firebaseio.com";
    pastebinId = undefined;
    
    activate(pastebinId){
        if(pastebinId){
            this.pastebinId = pastebinId;
        }else{
            this.pastebinId = new Firebase(this.baseURL).push().key();
        }
    }
    
    makeTraceSearchHistoryFirebase(){
        return new Firebase(`${this.baseURL}/${this.pastebinId}/content/search`);
    }
    
    makeChatFirebase(){
        return new Firebase(`${this.baseURL}/${this.pastebinId}/content/chat`);
    }
    
    makeJsEditorFirepad(jsEditor){
        let defaultText = '\ngo(); \n\nfunction go() {\n  var message = "Hello, world.";\n  console.log(message);\n}';
        return this.makeFirepad("js", jsEditor, defaultText);
    }
    
    makeHtmlEditorFirepad(htmlEditor){
        let defaultText = '<!DOCTYPE html>\n<html>\n<head>\n\t<meta charset="utf-8">\n\t<title>Coode</title>\n</head>\n<body>\n\n</body>\n</html>';
        return this.makeFirepad("html", htmlEditor, defaultText);
    }
    
    makeCssEditorFirepad(cssEditor){
        let defaultText = 'h1 { font-weight: bold; }';
        return this.makeFirepad("css", cssEditor, defaultText);
    }
    
    makeFirepad(subject, editor, defaultText){
        let subjectURL = `${this.baseURL}/${this.pastebinId}/content/${subject}`;
        let firebase = new Firebase(subjectURL);

        return Firepad.fromACE(
          firebase,
          editor, {
            defaultText: defaultText
          });
    }
}