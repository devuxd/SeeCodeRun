
export class HtmlViewer {
    
    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
        this.subscribe();
    }
    
    subscribe() {
      let ea = this.eventAggregator;
      
      ea.subscribe('onHtmlEditorChanged', payload => {
        this.html = payload;
        this.addJsAndCss();
      });
      
      ea.subscribe('onCssEditorChanged', payload => {
        this.css = payload;
        this.addJsAndCss();
      });
      
      ea.subscribe('onJsEditorChanged', payload => {
        this.js = payload.js;
        this.addJsAndCss();
      })
    }
    
    addJsAndCss() {
        let doc = document.getElementById('htmlView')
                          .contentDocument;
                          
        doc.body.innerHTML = this.html;
  
        let style = doc.createElement('style');
        style.textContent = this.css;
        
        let script = doc.createElement('script');
        script.textContent = this.js;
        
        doc.head.appendChild(style);
        
        doc.body.appendChild(script);
    }
}