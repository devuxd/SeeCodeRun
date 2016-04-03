import {EsTracer} from './estracer';

export class TraceService {

    constructor(eventAggregator) {
      this.eventAggregator = eventAggregator;
    // TraceService listens to these events
      this.executionEvents = {
        running : {  event :'codeRunning'   , description : 'Tracing Code...' },
        finished: {  event :'codeFinished'  , description : 'Trace built successfully.' },
        failed  : {  event :'codeFailed'    , description : 'Code failed (Runtime error).' }
      };
    // TraceService emits these events  
      this.traceEvents = {
        instrumented    : {  event :'traceInstrumented'   , description : 'Code Instrumented successfully.' },
        changed         : {  event :'traceChanged'   , description : 'Trace results obtained succesfully.' },
        failed          : {  event :'instrumentationFailed'    , description : 'Code rewriting failed (Compilation error).' }
      };
      
      this.timeLimit = 3000; //default timeout
      this.esTracer = new EsTracer(this.traceEvents, this.timeLimit, eventAggregator);
      this.subscribe();
    }
    /**
     * @desc This method should be called by Pastebin
     * 
     * */
    // onEditorChanged(editor, publisher) {
    //         let traceService  = new TraceService(publisher);
    //         let payload = traceService.getInstrumentation(editor.getValue());
    //         publisher.publish(payload.status, payload);
    // }

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
            this.esTracer.onCodeFinished();
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