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

        for(let urlIndex in urls){
            let url = urls[urlIndex];
            let $script = $.cachedScript( url ).done(
                function loadScriptDone( text, textStatus ) {
                    clearTimeout(self.doneTimeout);
                    self.scripts.push(text);
                    self.doneTimeout = setTimeout(publisher.publish(eventName, { status: textStatus, scripts: self.scripts }),
                    timeout);
                }
            )
            .fail(
                function loadScriptFail( jqxhr, settings, exception ) {
                    throw exception;
                }
            );
        }

    }

    loadCSSScripts(){

    }
}