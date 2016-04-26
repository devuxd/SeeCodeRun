import {TraceService} from '../traceService/trace-service';

export class HtmlViewer {

    constructor(eventAggregator, traceModel) {
        this.eventAggregator = eventAggregator;
        this.traceService = new TraceService(eventAggregator, traceModel);
        this.div = 'htmlView';
        this.subscribe();
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
      
      ea.subscribe('onJsEditorChanged', payload => {
        let editorText = payload.js;
        let instrumentationPayload = this.traceService.getInstrumentation(editorText);
        
        if (traceService.isValid(instrumentationPayload)) {
          this.js = instrumentationPayload.data;
        } else {
          console.log(JSON.stringify(instrumentationPayload));
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
        
      let result = undefined;
      
      try {
        ea.publish(traceService.executionEvents.running.event);
        
        doc.body.appendChild(script);
        
        result = JSON.parse(doc.getElementById(traceDataContainer).innerHTML);
        
        ea.publish(
          traceService.executionEvents.finished.event, { 
            data: result 
        });
      } catch(e) {
        let error = e.toString();
        
        try {
          result = JSON.parse(doc.getElementById(traceDataContainer).innerHTML);
        } catch (jsonError) {
          error += " " + jsonError.toString();
        }
        
        ea.publish(
          traceService.executionEvents.failed.event, { 
            data: result, 
            error: error 
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
      let ea = eventAggregator;
      let window = this.getContentWindow();
                        
      window.onerror = function publishErrors(err) {
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