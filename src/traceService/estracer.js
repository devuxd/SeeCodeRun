//local imports
import {EsAnalyzer} from './esanalyzer';
import {EsInstrumenter} from './esinstrumenter';

export class EsTracer {

    constructor(events, timeLimit = 3000, publisher) {
      this.esAnalyzer = new EsAnalyzer();
      this.esInstrumenter = new EsInstrumenter();
      this.events = events;
      this.timeLimit = timeLimit;
      this.publisher = publisher;
    }
    
    getEsAnalyzer(){
      return this.esAnalyzer;
    }
    
    getEsInstrumenter(){
      return this.esInstrumenter;
    }
    getTrace(code, callback) {
      this.esInstrumenter.traceInstrument(code, this.esAnalyzer);
    }
    

  createTraceCollector() {
        let traceTypes = this.esAnalyzer.traceTypes, Syntax = this.esAnalyzer.Syntax;
        window.CANTRACE = true;
        window.ISCANCELLED = false;
        window.TRACE = {
            hits: {}, data: {}, stack : [], execution : [], variables: [], values : [], timeline: [], identifiers: [], 
            autoLog: function autoLog(info) {
                var key = info.text + ':' + info.indexRange[0]+':' + info.indexRange[1];
                
                if(traceTypes.LocalStack.indexOf(info.type)>-1){
    				this.stack.push(key) ;
                }

                if(info.type === Syntax.VariableDeclarator || info.type === Syntax.AssignmentExpression){
                   this.values.push({'id': info.id , 'value': JSON.stringify(info.value), 'range': info.range}); 
                }

                this.timeline.push({ id: info.id , value: JSON.stringify(info.value), range: info.range, type: info.type, text: info.text});


                var stackTop =	this.stack.length - 1;
                
				if (this.hits.hasOwnProperty(key)) {
                    this.hits[key] = this.hits[key] + 1;
                    this.data[key].hits = this.hits[key] + 1;
                    this.data[key].values.push({'stackIndex': stackTop, 'value' :JSON.stringify(info.value)});
                } else {
                    
                    if(info.type === Syntax.VariableDeclarator){
                       this.variables.push({'id': info.id , 'range': info.range});
                    }
                    
                    this.identifiers.push({'id': info.id , 'range': info.range});
                    
                    
                    this.hits[key] = 1;
                    this.execution.push(key);
                    this.data[key] = {
                        'type' : info.type,
                        'id' : info.id,
                        'text' : info.text,
                        'values': [{'stackIndex': stackTop, 'value' :JSON.stringify(info.value)}],
                        'range': info.range,
                        'hits' : 1,
                        'extra' : info.extra
                    };
                }
                
                if(window.ISCANCELLED){ // Allow external cancel
                    throw "Trace Cancelled.";
                }
                
                return info.value;
            },
            getStackTrace: function getStackTrace () {
                var entry,
                    stackData = [];
                for (var i in this.stack) {
                    if (this.stack.hasOwnProperty(i)) {
                        entry = this.stack[i];
                        stackData.push({ index: i, text: entry.split(':')[0], range: this.data[entry].range,  count: this.hits[entry]});
                    }
                }
                return stackData;
            },
            getExecutionTraceAll: function getExecutionTraceAll() {
                let result = [];
                for (let i in this.execution) {
                    let entry = this.execution[i];
                    if (this.data.hasOwnProperty(entry)) {
                        result.push(this.data[entry]);
                    }
                }
                return result;
            },
            getExpressions: function getExpressions() {
                return {variables : this.identifiers, timeline: this.timeline};
            },
            getVariables: function getVariables() {
                return {variables : this.variables, values: this.values};
            },
            getExecutionTrace: function getExecutionTrace() {// getValues
                var i, entry, data, stackData = [];
                for (i in this.execution) {
                    entry = this.execution[i];
                    if (this.data.hasOwnProperty(entry)) {
                        data =this.data[entry];
                        if(traceTypes.Expression.indexOf(data.type) > -1  ){
                            stackData.push(this.data[entry]);
                        }
                     }
                }
                return stackData;
            }
        };
        
  }
  
/**
 * description
 *  Usage: traceExecution( sourceCode, eventListener)
 *      @parameter sourceCode: a string with the source code
 *      @paremeter timeLimit : a integer value for the timeout in ms
 *      @parameter publisher : if more detailed information is required during execution
 *                              (e.g. UI updates), all the events are verbose there. it sends {event, payload} parameters.
 * Details: 1. Calls createTraceCollector() as the callback instrumented in the original code.
 *          2. traceInstrument() will analyze the original code, find the element types we need and append calls to the trace collector.
 *          3. traceInstrument() returns the instrumented code(rewritten code with added functionality) than is then executed with the eval()
 *          4. When the execution finishes, the eventListener callback will return status 'Finished' and the object this.TRACE will
 *          allow to obtain the execution trace data with the getExecutionTrace() call (i.e this.TRACE.getExecutionTrace())
 *
 **/
    cancelTrace(){
        window.ISCANCELLED = true;
    }
    
    onCancelTrace(){
         this.cancelTrace();
    }
    
    onCodeRunning(){
        let timeLimit = this.timeLimit;
        let timeOutCallback = function timeOutCallback(){
                  throw `Execution time out. Excedeed ${timeLimit} ms`;
        };
        
        if(this.timeOut){
            window.clearTimeout(this.timeOut);
        }
        this.timeOut = window.setTimeout(timeLimit, timeOutCallback);
        
        window.ISCANCELLED = false;
        this.startTimestamp = +new Date();
    }
    
    onCodeFinished(){
        let event = this.events.changed;
        this.traceChanged(event);
    }
    
    onCodeFailed(error){
        let event = this.events.changed;
        this.traceChanged(event, error);
    }
    
    traceChanged(event, error = ""){
        window.clearTimeout(this.timeOut);
        
        let publisher = this.publisher;

        let data = window.TRACE.getExecutionTrace();
        
        let timestamp = (+new Date()) - this.startTimestamp ;
        let description = `${event.description} Trace completed in ${1 + timestamp} ms. Error: ${error.toString()}`;
        
        let payload = { status : event.event, description : description, data : data};
        
        if(publisher){
            publisher.publish(payload.status, payload);
        }
    }
    
    getInstrumentation(sourceCode = "", timeLimit = 3000) {

        this.timeLimit = timeLimit;
        let  instrumentedCode;
        let payload = {'status' : 'NONE', 'description' : '', 'data' : {}};
        
        try {
            payload.status = this.events.started.event;
            payload.description = this.events.started.description;

                
            this.createTraceCollector();
            instrumentedCode = this.esInstrumenter.traceInstrument(sourceCode, this.esAnalyzer);
            
            payload.status = this.events.running.event;
            payload.description = this.events.running.description;
            payload.data = instrumentedCode;
                
            return payload;
    
        } catch (e) {
            
            payload.status = this.events.failed.event;
            payload.description = `${this.events.failed.description}. Error: ${e.toString()}`;
            return payload;
        }
    }
}