import {TraceService} from '../traceService/trace-service';

export class HtmlViewer {
    
    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
        this.traceService  = new TraceService(eventAggregator);
        this.subscribe();
    }
     
subscribe() {
      let ea = this.eventAggregator;
      let traceService  = this.traceService;
      
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
        
        
        let tracePayload = traceService.getInstrumentation(editorText);
        
        if(tracePayload.status === traceService.traceEvents.instrumented.event){
        
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
  
        let out = doc.createElement('div');
        out.style.display = 'none';
        out.id = "trace_results";
        doc.body.appendChild(out);
        
        let script = doc.createElement('script');

        script.textContent = this.js;
        let result = undefined;
        try{
            publisher.publish(traceService.executionEvents.running.event);
            doc.body.appendChild(script);
            result = JSON.parse(out.innerHTML);
            publisher.publish(traceService.executionEvents.finished.event, {data: result});
        }catch(e){
            result = JSON.parse(out.innerHTML);
            publisher.publish(traceService.executionEvents.failed.event, {data: result, error: e});
        }
        
    }
}