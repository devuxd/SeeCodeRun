import {EsTracer} from './es-tracer';

export class TraceService {

    constructor(eventAggregator, traceModel) {
      this.eventAggregator = eventAggregator;
      this.traceModel = traceModel;
      this.executionEvents = this.traceModel.executionEvents;
      this.esTracer = new EsTracer(this.traceModel, eventAggregator);
      this.subscribe();
    }
    
    isValid(tracePayload){
        return tracePayload.status === this.traceModel.traceEvents.instrumented.event;
    }

    getInstrumentation(code) {
        if(!code){ 
          return this.traceModel.makeEmptyPayload();
        }
        return this.esTracer.getInstrumentation(code,  this.eventAggregator);
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

}