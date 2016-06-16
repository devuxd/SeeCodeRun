import {TraceService} from '../traceService/trace-service';

export class HtmlViewer {
    errors = "";

    constructor(eventAggregator, traceModel) {
        this.eventAggregator = eventAggregator;
        this.traceService = new TraceService(eventAggregator, traceModel);
        this.div = 'htmlView';
        this.subscribe();
    }
    
    pushError(errorRef){
      let error = "";
      if(errorRef){
        error = errorRef.toString();
      }
      this.errors = this.errors? this.errors + ", "  + error : error;
    }
    
    popErrors(){
      let poppedErrors = this.errors;
      this.errors = "";
      return poppedErrors;
    }
    
    attached() {
      this.addConsoleLogging(this.eventAggregator);
      this.addErrorLogging(this.eventAggregator);
    }
    
    subscribe() {
      let ea = this.eventAggregator;
      let traceService = this.traceService;
      
      ea.subscribe('onHtmlEditorChanged', payload => {
        this.html = payload;
        this.addHtml();
      });
      
      ea.subscribe('onCssEditorChanged', payload => {
        this.css = payload;
        this.addCss();
      });
      
      ea.subscribe('jsEditorChange', payload => {
        let editorText = payload.js;
        let instrumentationPayload = this.traceService.getInstrumentation(editorText);
        
        if (traceService.isValid(instrumentationPayload)) {
          this.js = instrumentationPayload.data;
        } else {
          this.js = editorText;
        }
        
        this.addJs();
      });
    }
    
    addJs() {
      let ea = this.eventAggregator;
      let traceService = this.traceService;
      let traceDataContainer = traceService.traceModel.traceDataContainer;
      
      let doc = this.getContentDocument();
      let script = doc.createElement('script');
      script.textContent = this.js;
        
      let result = {error: ""};
      
      try {
        ea.publish(traceService.executionEvents.running.event);
        
        doc.body.appendChild(script);
        
        result = JSON.parse(doc.getElementById(traceDataContainer).innerHTML);
        
        result.error = this.popErrors();
        
        ea.publish(
          traceService.executionEvents.finished.event, { 
            data: result 
        });
      } catch(e) {
        this.pushError(e);
        
        try {
          result = JSON.parse(doc.getElementById(traceDataContainer).innerHTML);
        } catch (jsonError) {
          if(e.toString() !== jsonError.toString()){
            this.pushError(jsonError);
          }
        }
        result.error = this.popErrors();
        ea.publish(
          traceService.executionEvents.finished.event, { 
            data: result 
          });
      }
    }
    
    addCss() {
      let doc = this.getContentDocument();
      
      if (!this.style) {
        this.style = doc.createElement('style');
        this.style.type = 'text/css';
      }
      
      this.style.textContent = this.css;
      
      doc.head.appendChild(this.style);
    }
    
    addHtml() {
      let doc = this.getContentDocument();
      doc.body.innerHTML = this.html;
    }
    
    getContentDocument() {
      return document.getElementById(this.div)
                     .contentDocument;
    }
    
    addErrorLogging(eventAggregator) {
      let self = this;
      let ea = eventAggregator;
      let window = this.getContentWindow();
                        
      window.onerror = function publishErrors(err) {
        self.pushError(err);
        ea.publish('iframeError', {
          err: err
        });
      };
    }
    
    addConsoleLogging(eventAggregator) {
      let ea = eventAggregator;
      let window = this.getContentWindow();
      
      window.console.log = function publishConsoleLog() {
        ea.publish('iframeConsoleLog', {
          log: Array.prototype.slice.call(arguments)[0]
        });
	    };
    }
    
    getContentWindow() {
      return document.getElementById(this.div)
                     .contentWindow;
    }
}