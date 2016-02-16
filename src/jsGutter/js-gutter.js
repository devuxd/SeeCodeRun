import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import '../../mode-javascript';
import '../../theme-chrome';

@inject(EventAggregator)
export class JsGutter {
  
  constructor(eventAggregator) {
    this.eventAggregator = eventAggregator;
  }
  
  activate() {}
  
  attached() {
    let gutter = ace.edit('gutterDiv');
    this.configureGutter(gutter);
    
    let session = gutter.getSession();
    
    this.gutter = gutter;
    this.session = session;
    this.subscribe();
  }
  
  configureGutter(gutter) {
    gutter.setTheme('ace/theme/chrome');
    gutter.setShowFoldWidgets(false);
    gutter.renderer.setShowGutter(false);
    gutter.renderer.$cursorLayer.element.style.display = 'none';
    gutter.setReadOnly(true);
  }
  
  subscribe() {
    let ea = this.eventAggregator;
    let session = this.session;
    
    ea.subscribe('onEditorChanged', payload => {
      let doc = session.doc;
      let results = [];
      
      for(let node of payload.syntax.body) {
        if(node.type === "VariableDeclaration") {
          let init = node.declarations[0].init;
          console.log(node);
          
          console.log(init);
          
          if(init.type === "Literal") {
            results.push({
              location: {
                row: init.loc.start.line - 1,
                col: init.loc.start.col
              },
              content: init.value
            });  
          }
        }
      }
      
      doc.removeLines(0, doc.getLength());
      
      // TODO: fix uncaught length error
      doc.insertLines(0, new Array(payload.length - 1));
      
      for(let result of results) {
        doc.insertInLine({
          row: result.location.row,
          column: result.location.col
        }, result.content);
      }
    });
  }
  
  updateGutter(lineNo, content) {
    
  }
}

