import {TraceHelper} from './trace-helper';
import {EsAnalyzer} from './es-analyzer';
import {EsInstrumenter} from './es-instrumenter';

export class EsTracer {

    constructor(traceModel, publisher) {
      this.esAnalyzer = new EsAnalyzer(traceModel);
      this.esInstrumenter = new EsInstrumenter(traceModel);
      this.traceModel = traceModel;
      this.publisher = publisher;
    }
    
    onCodeRunning(){
        let timeLimit = this.traceModel.timeLimit;
        let timeOutCallback = function timeOutCallback(){
                  throw `Execution time out. Excedeed ${timeLimit} ms`;
        };
        
        if(this.timeOut){
            window.clearTimeout(this.timeOut);
        }
        this.timeOut = window.setTimeout(this.traceModel.timeLimit, timeOutCallback);
        
        window.ISCANCELLED = false;
        this.startTimestamp = +new Date();
    }
    
    onCodeFinished(payload){
        let event = this.traceModel.traceEvents.changed;
        this.traceChanged(event, payload.data);
    }
    
    onCodeFailed(payload){
        let event = this.traceModel.traceEvents.changed;
        this.traceChanged(event, payload.data,  `Error: ${payload.error}`);
    }
    
    traceChanged(event, results, error = ""){
        if(this.timeOut){
            window.clearTimeout(this.timeOut);
        }

        if(!results){
          //  console.log("No trace results found");
            return;
        }

        let duration = (+new Date()) - this.startTimestamp ;
        let description = `${event.description} Trace completed in ${1 + duration} ms.${error.toString()}`;
        
        let traceHelper = new TraceHelper(results);
        let payload = this.traceModel.makePayload(event.event, description, traceHelper);
        
        if(this.publisher){
            this.publisher.publish(payload.status, payload);
        }
    }
    
    getInstrumentation(sourceCode = "", timeLimit = 3000) {

        this.timeLimit = timeLimit;
        let  instrumentedCode;
        let payload = this.traceModel.makeEmptyPayload();
        
        try {
            instrumentedCode = this.esInstrumenter.instrumentTracer(sourceCode, this.esAnalyzer);
            
            payload.status = this.traceModel.traceEvents.instrumented.event;
            payload.description = this.traceModel.traceEvents.instrumented.description;
            payload.data = instrumentedCode;
                
            return payload;
    
        } catch (e) {
            payload.status = this.traceModel.traceEvents.failed.event;
            payload.description = `${this.traceModel.traceEvents.failed.description}. Error: ${e.toString()}`;
            return payload;
        }
    }
}