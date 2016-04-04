<<<<<<< HEAD
=======
import {TraceService} from '../traceService/trace-service';

>>>>>>> master
export class HtmlViewer {
    
    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
        this.traceService  = new TraceService(eventAggregator);
        this.subscribe();
    }
    
    attached() {
      this.addErrorAndConsoleLogging(this.eventAggregator);
    }
    
    subscribe() {
      let ea = this.eventAggregator;
      let traceService  = this.traceService;
      
      ea.subscribe('onHtmlEditorChanged', payload => {
        this.html = payload;
        this.addJsAndCss();
      });
      
      ea.subscribe('onCssEditorChanged', payload => {
        this.css = payload;
        this.addJsAndCss();
      });
      
      ea.subscribe('onJsEditorChanged', payload => {
<<<<<<< HEAD
        this.js = payload.js;
        this.addJsAndCss();
      });
=======
        let editorText = payload.js;
        
        
        let instrumentationPayload = traceService.getInstrumentation(editorText);
        
        if(traceService.isValid(instrumentationPayload)){
            this.js = instrumentationPayload.data;
        
        }else{
            console.log(JSON.stringify(instrumentationPayload));
            this.js = editorText;
        }
        
        this.addJsAndHtml();
      });
    }
    
    attached() {  
     this.doc = document.getElementById('htmlView')
                          .contentDocument;

        this.style = this.doc.createElement('style');
        this.style.type = 'text/css';
        this.subscribe();
>>>>>>> master
    }
    
<<<<<<< HEAD
    addJsAndCss() {
        let doc = document.getElementById('htmlView')
                          .contentDocument;
                          
        doc.body.innerHTML = this.html;
  
        let style = doc.createElement('style');
        style.textContent = this.css;
        
        let script = doc.createElement('script');
=======
    addJsAndHtml() {
        let publisher = this.eventAggregator;
        let traceService = this.traceService;
        let traceDataContainer = traceService.traceModel.traceDataContainer;
        let doc = document.getElementById("htmlView").contentDocument;
                          
        doc.body.innerHTML = this.html;

        let script = doc.createElement("script");

>>>>>>> master
        script.textContent = this.js;
        let result = undefined;
        try{
            publisher.publish(traceService.executionEvents.running.event);
            
            doc.body.appendChild(script);
            result = JSON.parse(doc.getElementById(traceDataContainer).innerHTML);
            
            publisher.publish(traceService.executionEvents.finished.event, {data: result});
        }catch(e){
            let error = e.toString();
            try{
                result = JSON.parse(doc.getElementById(traceDataContainer).innerHTML);
            }catch(jsonError){
                error += " "+ jsonError.toString();
            }
            publisher.publish(traceService.executionEvents.failed.event, {data: result, error: error});
        }
        
<<<<<<< HEAD
        doc.head.appendChild(style);
        
        doc.body.appendChild(script);
=======
>>>>>>> master
    }
    
    addErrorAndConsoleLogging(eventAggregator) {
      let ea = eventAggregator;
      let window = document.getElementById('htmlView')
                           .contentWindow;
                        
      window.onerror = function publishErrors(err) {
        ea.publish('iframeError', {
          err: err
        });
      }
      
      window.console.log = function publishConsoleLog() {
	        ea.publish('iframeConsoleLog', {
	          log: Array.prototype.slice.call(arguments)[0]
	        });
	    };
    }
}