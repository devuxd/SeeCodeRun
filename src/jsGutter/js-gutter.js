/* global Firepad */
/* global Firebase */
/* global ace */
import '../mode-javascript';
import '../theme-chrome';

export class JsGutter {
  
  constructor(eventAggregator) {
    this.eventAggregator = eventAggregator;
  }
  
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
    
    ea.subscribe('onJsEditorChanged', payload => {
      let doc = session.doc;
      
      doc.removeLines(0, doc.getLength());
      
      // TODO: fix uncaught length error
      doc.insertLines(0, new Array(payload.length - 1));
      
      for(let result of payload.syntax) {
        doc.insertInLine({
          row: result.location.row,
          column: result.location.col
        }, result.content);
      }
    });
  }
}

