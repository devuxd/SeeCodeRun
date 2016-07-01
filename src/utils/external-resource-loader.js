/* global jQuery $ */
export class ExternalResourceLoader{

    loadJsScripts(urls, publisher, eventName, timeout = 500){
        let self = this;
        self.scripts = [];
        jQuery.cachedScript = function( url, options ) {
            // Allow user to set any option except for dataType, cache, and url
            options = $.extend( options || {}, {
            dataType: "text",
            cache: true,
            url: url
            });

            // Use $.ajax() since it is more flexible than $.getScript
            // Return the jqXHR object so we can chain callbacks
            return jQuery.ajax( options );
        };
        self.pendingUrlCount = urls.length;
        for(let urlIndex in urls){
            let url = urls[urlIndex];
            $.cachedScript( url ).done(
                function loadScriptDone( text, textStatus ) {
                    self.pendingUrlCount--;
                    clearTimeout(self.doneTimeout);
                    self.scripts[url] = text;
                    if(self.pendingUrlCount){
                    self.doneTimeout = setTimeout( function loadScriptDoneTimeout(){
                        publisher.publish(eventName, { status: textStatus, scripts: self.scripts });
                    },
                    timeout);
                    }else{
                        publisher.publish(eventName, { status: textStatus, scripts: self.scripts });
                    }
                }
            )
            .fail(
                function loadScriptFail( jqxhr, settings, exception ) {
                    throw exception;
                }
            );
        }

    }

    insertScriptsInElement(scriptTexts, element){
        $(element).find("script").each( function eachScriptDo() {
                let scriptURL = $(this).attr("src");
                if(scriptURL){
                    let scriptText = scriptTexts[scriptURL];
                    if(scriptText){
                        $(this).text(scriptText);
                    }
                }
            }
        );
    }

    replaceScriptsInElement(scriptTexts, element, containerDocument){
        let self = this;
        $(element).find("script").each( function eachScriptDo() {
                let scriptURL = $(this).attr("src");
                if(scriptURL){
                    let scriptText = scriptTexts[scriptURL];
                    scriptText = `/*Script source: ${scriptURL} */\n${scriptText}`;
                    if(scriptText){
                        $(this).remove();
                        let scriptElement =self.createScriptElement(scriptText, containerDocument);
                        element.appendChild(scriptElement);
                    }
                }
            }
        );
    }

    appendScriptsToElement(scriptTexts, element, containerDocument){
        for(let scriptIndex in scriptTexts){
            let scriptText = scriptTexts[scriptIndex];
            let script = this.createScriptElement(scriptText, containerDocument);
            element.appendChild(script);
        }
    }

    createScriptElement(scriptText, containerDocument){
      let script = containerDocument.createElement('script');
      script.type = "text/javascript";
      script.textContent = scriptText;
      return script;
    }

    createStyleElement(scriptText, containerDocument){
      let script = containerDocument.createElement('style');
      script.type = "text/css";
      script.textContent = scriptText;
      return script;
    }
}