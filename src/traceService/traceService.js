import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';

//local imports
import {EsTracer} from './estracer';

@inject(EventAggregator)
export class TraceService {

    constructor(eventAggregator) {
      // inject code in the service. Dependencies failure happens here
      this.eventAggregator = eventAggregator;

      this.events = {
        onTraceServiceStart: {  event :'onTraceServiceStart', description : 'Building Tracer...' },
        onTraceServiceRunning: {  event :'onTraceServiceRunning', description : 'Tracing...' },
        onTraceServiceEnd :{  event :'onTraceServiceEnd', description : 'Trace built successfully.' },
        onTraceServiceBusy : {  event :'onTraceServiceBusy', description : 'A previous trace is running.' },
        onTraceServiceException: {  event :'onTraceServiceException', description : 'Trace ended due to an exception.' }
      };
      
      this.timeLimit = 3000; //default timeout
      

      this.estracer = new EsTracer(this.events);

    }
// exec-viz suscribe to the onTraceChanged event
//   onTraceChanged(result){
//         let traceHelper = new TraceHelper(result); 
//         traceHelper.getLine();
//   }
  
//paste-bin
// onDocumentChanged(){
//   let code =  ace.getText();
//   let traceresults = new TraceService().getTrace(code);
//   // do your magic
//   this.publish('onTraceChanged', traceresults);
// }
    getTimeLimit(){
       return this.timeLimit; 
    }
    setTimeLimit(timeLimit){
       this.timeLimit = timeLimit; 
    }
    cancelTrace(){
        window.ISCANCELLED = true;
    }
    
    getTrace(code, publisher) { //optional publisher
        if(!code){
          return {status: undefined, description : undefined , data : {}};
        }
        
        if(!publisher){
            publisher = this;
        }
        
        return this.estracer.traceExecution(code, this.timeLimit,  publisher);
        
    }
    
    subscribe() {
    // move this logic to the gutter
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
     let ea = this.eventAggregator;
     if(ea){
        ea.publish(event, payload);
     }
  }
}