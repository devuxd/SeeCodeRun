export class VisViewer {
    
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
        let doc = document.getElementById('visView')
                          .contentDocument;
  
        //doc.body.innerHTML = this.html + '<script src="jspm_packages/npm/d3@3.5.16/d3.js"></script>';
        doc.body.innerHTML = this.html;// + '<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.16/d3.min.js"></script>';
        
        
        let style = doc.createElement('style');
        style.textContent = this.css;
        
        let script = doc.createElement('script');
        script.textContent = this.js;
        
        let d3script = doc.createElement('script');
        d3script.src = '/jspm_packages/npm/d3@3.5.16/d3.js';
        
        doc.head.appendChild(style);
        doc.body.appendChild(script);
        doc.body.appendChild(d3script);
    }
    
    formatData(data) {
      // columns = ["col1","col2",...,"colN"]
      // data = [{col1: val1, col2: val1},{col1: val2, col2: val2},...{}]
      let columns = [];
      for(let v of data) {
        columns.push(v.variableName);
      }
      
      let values = [];
      
      for(let i = 0; i < data.length; i++) {
          for(let j = 0; j < data[i].values.length; j++) {
              values.push({value: data[i].values[j]})
          }
      }
    }
    
    getMockTableTrace() {
      return [{
        variableName: 'x',
        values: [{value: '25'},{value: '25'},{value: '500'}]
      }, 
      {
        variableName: 'y',
        values: [{value: 'undefined'},{value: '75'},{value: '75'}]
      }];
    }
}