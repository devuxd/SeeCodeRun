//local imports
import {EsAnalyzer} from './esanalyzer';
import {EsInstrumenter} from './esinstrumenter';

export class EsTracer {

    constructor(events) {
      this.esAnalyzer = new EsAnalyzer();
      this.esInstrumenter = new EsInstrumenter();
      this.events = events;
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
    onCodeEnded(){
        
    }
    getInstrumentation(sourceCode = "", timeLimit = 3000, publisher = undefined) {
        window.ISCANCELLED = false;
        let  code, timestamp;
        let payload = {'status' : 'NONE', 'description' : '', 'data' : {}};
        
        let timeOutCallback = function(){
                  throw `Execution time out. Excedeed ${timeLimit} ms`;
        };
        let timeOut;
        try {

            payload.status = this.events.started.event;
            payload.description = this.events.started.description;
                
            if(publisher){
                publisher.publish(payload.status, payload);
            }
                
            this.createTraceCollector();
            code = this.esInstrumenter.traceInstrument(sourceCode, this.esAnalyzer);
            
            payload.status = this.events.running.event;
            payload.description = this.events.running.description;
                
            if(publisher){
                publisher.publish(payload.status, payload);
            }
            
            timestamp = +new Date();
            

            timeOut =window.setTimeout(timeLimit, timeOutCallback);
            


            
            timestamp = (+new Date()) - timestamp;
            
            
            window.clearTimeout(timeOut);
            
            
            payload.status = this.events.finished.event;
            payload.description = `${this.events.finished.description} Trace completed in ${1 + timestamp} ms.`;
            //payload.data = window.TRACE.getExecutionTrace();
            payload.code = code;
                
            if(publisher){
                publisher.publish(payload.status, payload);
            }
            
            return payload;
    
        } catch (e) {
            this.CANTRACE = true;
            
            if(timeOut){
                window.clearTimeout(timeOut);
            }
            timestamp = (+new Date()) - timestamp;
            payload.status = this.events.failed.event;
            payload.description = `${this.events.failed.description} Trace completed in ${1 + timestamp} ms. Error: ${e.toString()}`;
           // payload.data = window.TRACE.getExecutionTrace();
                
            if(publisher){
                publisher.publish(payload.status, payload);
            }
            return payload;
          }
    }
    
  getTraceAnnotations(){
        var i, stackTrace, entry, text, row;

		stackTrace = this.TRACE.getStackTrace();
		var annotations = [];
        for (i = 0; i < stackTrace.length; i += 1) {
            entry = stackTrace[i];
            text = entry.text;
			row = entry.range.start.row;
			
			annotations.push({ type : "info", row: row, column: 0, raw: "y is called x times", text: `${text}  is called  ${this.count(entry.count, 'time', 'times')}`});
            
        }
        return annotations;
  }
  
  count(value, singular, plural) {
        return (value === 1) ? (`${value} ${singular}`) : (`${value} ${plural}`);
  }
  
  
}