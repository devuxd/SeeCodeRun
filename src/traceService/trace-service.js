import {EsTracer} from './es-tracer';

export class TraceService {

    constructor(eventAggregator) {
      this.eventAggregator = eventAggregator;
      
      this.executionEvents = {
        running : {  event :'codeRunning'   , description : 'Tracing Code...' },
        finished: {  event :'codeFinished'  , description : 'Trace built successfully.' },
        failed  : {  event :'codeFailed'    , description : 'Code failed (Runtime error).' }
      };
      
      this.traceEvents = {
        instrumented    : {  event :'traceInstrumented'   , description : 'Code Instrumented successfully.' },
        changed         : {  event :'traceChanged'   , description : 'Trace results obtained succesfully.' },
        failed          : {  event :'instrumentationFailed'    , description : 'Code rewriting failed (Compilation error).' }
      };
      
      this.timeLimit = 3000; 
      this.esTracer = new EsTracer(this.traceEvents, this.timeLimit, eventAggregator);
      this.subscribe();
    }

    getTimeLimit(){
       return this.timeLimit; 
    }
    setTimeLimit(timeLimit){
       this.timeLimit = timeLimit; 
    }

    
    getInstrumentation(code, timeLimit = this.timeLimit,  publisher = this) {
        if(!code){ // standard result object across the service
          return {status: undefined, description : undefined , data : undefined};
        }
        return this.esTracer.getInstrumentation(code, this.timeLimit,  publisher);
    }
    
    subscribe() {
     let ea = this.eventAggregator;
     if(ea){
        ea.subscribe(this.executionEvents.running.event, payload =>{
            this.esTracer.onCodeRunning();
        });
        ea.subscribe(this.executionEvents.finished.event, payload =>{
            this.esTracer.onCodeFinished(payload);
        }); 
        ea.subscribe(this.executionEvents.failed.event, payload =>{
            this.esTracer.onCodeFailed(payload);
        });
     }else{
         throw "An EventAggregator is required to listen for code execution events";
     }
     
    }
  
  publish(event, payload){
     let ea = this.eventAggregator;
     if(ea){
        ea.publish(event, payload);
     }else{
         console.log(`Event "${event}" contains this payload "${JSON.stringify(payload)}"`);
     }
  }
}