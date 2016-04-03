import {TraceService} from '../traceService/traceService';

export class HtmlViewer {
    
    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
        this.traceService  = new TraceService(eventAggregator);
        this.subscribe();
    }
     
subscribe() {
      let ea = this.eventAggregator;
      
      ea.subscribe('onHtmlEditorChanged', payload => {
        this.html = payload;
        this.addJsAndHtml();
      });
      
      ea.subscribe('onCssEditorChanged', payload => {
        this.css = payload;
        this.populateCss();
      });
      
      ea.subscribe('onJsEditorChanged', payload => {
        let editorText = payload.js;
        
        let traceService  = this.traceService;
        let tracePayload = traceService.getInstrumentation(editorText);
        
        if(payload.status === traceService.traceEvents.instrumented.event){
        
            this.js = tracePayload.data;
        
        }else{
            console.log(JSON.stringify(tracePayload));
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
    }

    populateCss(){
        this.style.textContent = this.css;
        this.doc.head.appendChild(this.style);  
     }     
        
 
    
    addJsAndHtml() {
        let publisher = this.eventAggregator;
        let traceService = this.traceService;
        let doc = document.getElementById('htmlView')
                          .contentDocument;
                          
        doc.body.innerHTML = this.html;
  
        
        
        let script = doc.createElement('script');
        script.textContent = this.js;
        
        try{
            publisher.publish(traceService.executionEvents.running.event);
            doc.body.appendChild(script);
            publisher.publish(traceService.executionEvents.finished.event);
        }catch(e){
            publisher.publish(traceService.executionEvents.failed.event, e);
        }
        
    }
}