import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';

import {EsTracer} from './estracer';

@inject(EventAggregator)
export class TraceService {

    constructor(eventAggregator) {
      this.eventAggregator = eventAggregator;

      this.eventsToSubscribe = {
        started : {  event :'traceServiceStarted'   , description : 'Tracer built succesfully....' },
        running : {  event :'traceServiceRunning'   , description : 'Tracing...' },
        finished: {  event :'traceServiceFinished'  , description : 'Trace built successfully.' },
        failed  : {  event :'traceServiceFailed'    , description : 'Tracer ended with a failure.' }
      };
      
      this.eventsToPublish = {
        instrumented : {  event :'traceInstrumented'   , description : 'Code Instrumented successfully.' },
        changed : {  event :'traceChanged'   , description : 'Trace results obtained succesfully.' }
      };
      
      this.timeLimit = 3000; //default timeout
      

      this.esTracer = new EsTracer(this.eventsToSubscribe);

    }

    getTimeLimit(){
       return this.timeLimit; 
    }
    setTimeLimit(timeLimit){
       this.timeLimit = timeLimit; 
    }
    cancelTrace(){
        window.ISCANCELLED = true;
    }
    
    getInstrumentation(code, publisher) { //optional publisher
        if(!code){
          return {status: undefined, description : undefined , data : {}};
        }
        
        if(!publisher){
            publisher = this;
        }
        
        return this.esTracer.getInstrumentation(code, this.timeLimit,  publisher);
        
    }
    
    subscribe() {
     let ea = this.eventAggregator;
     ea.publish(this.eventsToSubscribe.running, this.esTracer.onCodeRunning());
     ea.publish(this.eventsToSubscribe.finished, this.esTracer.onCodeRunning()); 

    }
  
  publish(event, payload){
     let ea = this.eventAggregator;
     if(ea){
        ea.publish(event, payload);
     }
  }
}