import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';

//local imports
import {EsTracer} from './estracer';

@inject(EventAggregator)
export class TraceService {

    constructor(eventAggregator) {
      // inject code in the service. Dependencies failure happens here
      this.eventAggregator = eventAggregator;
      this.estracer = new EsTracer();
    }

    getTrace(code) {
        if(!code){
          return [];
        }
        let syntax = this.estracer.getEsAnalyzer().getEsprima().parse(code, { loc: true});
        
        let toReturn = [];
        
        if(!syntax.body){
          return [];
        }
        
        for(let node of syntax.body) {
          
        if(node.type === 'VariableDeclaration') {
          
        //  console.log(JSON.stringify(node));
          if(!node.declarations){
            return [];
          }
          let init = node.declarations[0].init;
          if(init.type === 'Literal') {
            let variableName = node.declarations[0].id.name;
            let content = `{ ${variableName}: ${init.value} }`;
            
            toReturn.push({
              location: {
                row: init.loc.start.line - 1,
                col: init.loc.start.col
              },
              content: content
            });  
          }
        }
      }
      
      return toReturn;
    }
    
    subscribe() {
    // let ea = this.eventAggregator;
    // let session = this.session;
    
    // ea.subscribe('on', payload => {
    //   let doc = session.doc;
      
    //   doc.removeLines(0, doc.getLength());
      
    //   // TODO: fix uncaught length error
    //   doc.insertLines(0, new Array(payload.length - 1));
      
    //   for(let result of payload.syntax) {
    //     doc.insertInLine({
    //       row: result.location.row,
    //       column: result.location.col
    //     }, result.content);
    //   }
    // });
  }
  publish(event, payload){
    //'onTraceServiceStart', 'onTraceServiceEnd', 'onTraceServiceBusy', 'onTraceServiceCancel', 'onTraceServiceError', 'onTraceServiceTimeout'
     this.eventAggregator.publish(event, payload);
  }
}