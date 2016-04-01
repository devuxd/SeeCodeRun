import {EventAggregator} from 'aurelia-event-aggregator';
import {inject} from 'aurelia-framework';

@inject (EventAggregator)
export class HtmlViewer {
    
    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
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
        this.js = payload.js;
        this.addJsAndHtml();
      })
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
        let doc = document.getElementById('htmlView')
                          .contentDocument;
                          
        doc.body.innerHTML = this.html;
  
        
        
        let script = doc.createElement('script');
        script.textContent = this.js;
        
        
        doc.body.appendChild(script);
    }
}