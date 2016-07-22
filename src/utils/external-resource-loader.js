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

    instrument(scriptText, $scriptElement, element, containerDocument ){
        let scriptURL = $scriptElement.attr("src");
        let instrumentedScriptText = `/*Script source: ${scriptURL} */\n${scriptText}`;
        $scriptElement.remove();
        let scriptElement = this.createScriptElement(instrumentedScriptText, containerDocument);
        element.appendChild(scriptElement);
    }

    loadAndAttachJsScripts(element, containerDocument, publisher, eventName, instrumenter = this, timeout = 500){
        let status = {done: "done", fail: "fail"};
        let self = this;
        self.response = {status: status.done, responses: []};

        let $scripts = $(element).find("script");

        if(!$scripts.length){
            self.response.responses.push({ url: null, status: status.done, description: "No scripts found in element."  });
            publisher.publish(eventName, { response: self.response});
            return;
        }

        //options to override script attributes
        let options = {
            dataType: "text",
            cache: true,
        };
        jQuery.customScriptLoader = function( url, scriptAttributes) {
            options = $.extend( scriptAttributes || {}, options || {}, {
            url: url
            });
            return jQuery.ajax(options);
        };


        self.pendingUrlCount = $scripts.length;
        $scripts.each( function eachScriptDo() {
                let $scriptSelf = $(this);
                let scriptURL = $scriptSelf.attr("src");
                if(scriptURL){
                    let scriptAttributes = {
                        async: $scriptSelf.attr("async")
                    };
                    if(scriptAttributes.async){
                        self.pendingUrlCount--;
                    }

                    $.customScriptLoader( scriptURL, scriptAttributes).done(
                        function loadScriptDone( scriptText, textStatus ) {
                            clearTimeout(self.doneTimeout);
                            if(!scriptAttributes.async){
                                self.pendingUrlCount--;
                            }

                            let scriptResponse = { url: scriptURL, status: status.done,  description: textStatus};
                            self.response.responses.push(scriptResponse);

                            if(scriptText){
                                if(instrumenter){
                                    instrumenter.instrument(scriptText, $scriptSelf, element, containerDocument);
                                }else{
                                    $scriptSelf.text(scriptText);
                                    $scriptSelf.removeAttr("src");
                                }
                            }

                            if(self.pendingUrlCount){
                                self.doneTimeout = setTimeout( function loadScriptDoneTimeout(){
                                    publisher.publish(eventName, { response: self.response});
                                },
                                timeout);
                            }else{
                               publisher.publish(eventName, { response: self.response});
                            }
                        }
                    )
                    .fail(
                        function loadScriptFail( jqxhr, settings, exception ) {
                            clearTimeout(self.doneTimeout);
                            if(!scriptAttributes.async){
                                self.pendingUrlCount--;
                            }

                            self.response.status = status.fail;
                            let scriptResponse = { url: scriptURL, status: status.fail,  description: exception};
                            self.response.responses.push(scriptResponse);

                            if(self.pendingUrlCount){
                                self.doneTimeout = setTimeout( function loadScriptFailTimeout(){
                                    publisher.publish(eventName, { response: self.response});
                                },
                                timeout);
                            }else{
                               publisher.publish(eventName, { response: self.response});
                            }
                        }
                    );

                }
            }
        );
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