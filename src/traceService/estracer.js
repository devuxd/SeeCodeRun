//local imports
import {EsAnalyzer} from './esanalyzer';
import {EsInstrumenter} from './esinstrumenter';

export class EsTracer {

    constructor(events) { //todo: send the sandbox
      this.esanalyzer = new EsAnalyzer();
      this.esinstrumenter = new EsInstrumenter();
      this.events = events;
    }
    
    getEsAnalyzer(){
      return this.esanalyzer;
    }
    
    getEsInstrumenter(){
      return this.esinstrumenter;
    }
    getTrace(code, callback) {
      this.esinstrumenter.traceInstrument(code, this.esanalyzer);
    }
    
     /**
 * Readme(Chat/Doc/Misc anchor to piece of code) to Team in code. Interesting idea like wht the professor proposed in paper.
 * Venkat : add a timer to the last while  entrance and clear if hit again (use a timeout callback), otherwise offer to stop trace
 * Han :  the stack index is already added to the values  every time a expression is evaluated. Look in the this.data[expression].values array
 * Dana: Yep. Once you find elements in the stack of type "CallExpression" and the name is like document.* then show it the API should look like this tool (don't look a the code, only the functionality) https://github.com/estools/esquery
 * David: add timeout handling as valid
 */
  createTraceCollector() {
        var TraceTypes = this.TraceTypes;
        window.CANTRACE = true;
        window.ISCANCELLED = false;
        window.TRACE = {
            hits: {}, data: {}, stack : [], execution : [], values : {}, 
            autoLog: function (info) {
                // let returnValue = info.value; // does execute more than once? yep
                // if(returnValue instanceof Function){
                //     returnValue = info.value();
                // }
                
                var key = info.text + ':' + info.indexRange[0]+':' + info.indexRange[1];
                
                if(TraceTypes.LocalStack.indexOf(info.type)>-1){
    				this.stack.push(key) ;
                }

                var stackTop =	this.stack.length - 1;
                
				if (this.hits.hasOwnProperty(key)) {
                    this.hits[key] = this.hits[key] + 1;
                    this.data[key].hits = this.hits[key] + 1;
                    this.data[key].values.push({'stackIndex': stackTop, 'value' :JSON.stringify(info.value)});
                } else {
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
            getStackTrace: function () {
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
            getExecutionTraceAll: function () {
                var i, entry, stackData = [];
                for (var i in this.execution) {
                    entry = this.execution[i];
                    if (this.data.hasOwnProperty(entry)) {
                        stackData.push(this.data[entry]);
                    }
                }
                return stackData;
            },
            getExecutionTrace: function () {// getValues
                var i, entry, data, stackData = [];
                for (var i in this.execution) {
                    entry = this.execution[i];
                    if (this.data.hasOwnProperty(entry)) {
                        data =this.data[entry];
                        if(TraceTypes.Expression.indexOf(data.type) > -1  ){
                            stackData.push(this.data[entry]);
                        }
                     }
                }
                return stackData;
            },
            getExecutionTable: function () {
              //  var row = {'type': '', 'text' : '', 'values' : [], 'range' : {}};// properties
                var row, groupType;
                // var i, entry, stackData = [];
                // for (var i in this.execution) {
                //     entry = this.execution[i];
                //     if (this.data.hasOwnProperty(entry)) {
                //         if(){
                            
                //         }
                        
                //         var row = {'type': '', 'text' : '', 'values' : [], 'range' : {}};
                        
                //         stackData.push(this.data[entry]);
                //     }
                // }
                // return stackData;
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
 */

    traceExecution (sourceCode, timeLimit, publisher) {
        window.ISCANCELLED = false;
        let  code, timestamp;
        let payload = {'status' : 'NONE', 'description' : '', 'data' : {}};
        
        // if(!this.CANTRACE){
        //     payload.status = this.events.onTraceServiceBusy.event;
        //     payload.description = this.events.onTraceServiceBusy.description;
        //     if(publisher){
        //         publisher.publish(payload.status, payload);
        //     }
        //     return payload;
        // }
        
        let timeOutCallback = function(){
                  throw "Execution time out. Excedeed " + timeLimit +" ms";
        };
        let timeOut;
        // try {
            window.CANTRACE = false;
            
            payload.status = this.events.started.event;
            payload.description = this.events.started.description;
                
            if(publisher){
                publisher.publish(payload.status, payload);
            }
                
            this.createTraceCollector();
            code = this.esinstrumenter.traceInstrument(sourceCode, this.esanalyzer);
            
            payload.status = this.events.running.event;
            payload.description = this.events.running.description;
                
            if(publisher){
                publisher.publish(payload.status, payload);
            }
            
            timestamp = +new Date();
            

            timeOut =window.setTimeout(timeLimit, timeOutCallback);
            
            //TODO: what about async code?
            //console.log(sourceCode);
          // console.log("-------------------------------------------------");
          // console.log(code);
           //this.shadowEditor = ace.edit('sandBoxDiv');
           //.shadowEditor.setValue(code);
           eval(code);
            window.CANTRACE = true;
            
            timestamp = (+new Date()) - timestamp;
            
            
            window.clearTimeout(timeOut);
            
            
            payload.status = this.events.finished.event;
            payload.description = this.events.finished.description + 'Completed in ' + (1 + timestamp) + ' ms.';
            //payload.data = window.TRACE.getExecutionTrace();
            payload.code = code;
                
            if(publisher){
                publisher.publish(payload.status, payload);
            }
            
            return payload;
    
        // } catch (e) {
        //     this.CANTRACE = true;
            
        //     if(timeOut){
        //         window.clearTimeout(timeOut);
        //     }
        //     timestamp = (+new Date()) - timestamp;
        //     payload.status = this.events.failed.event;
        //     payload.description = this.events.failed.description + ' Trace completed in ' + (1 + timestamp) + ' ms. Error: ' + e.toString();
        //     payload.data = window.TRACE.getExecutionTrace();
                
        //     if(publisher){
        //         publisher.publish(payload.status, payload);
        //     }
        //     return payload;
        //   }
    }
    
  getTraceAnnotations(){
        var i, stackTrace, entry, text, row;

		stackTrace = this.TRACE.getStackTrace();
		var annotations = [];
        for (i = 0; i < stackTrace.length; i += 1) {
            entry = stackTrace[i];
            text = entry.text;
			row = entry.range.start.row;
			
			annotations.push({"type": "info", "row": row, "column": 0, "raw": " y is called x times", "text": text + ' is called ' + this.count(entry.count, 'time', 'times')});
            
        }
        return annotations;
  }
  
  count(x, s, p) {
        return (x === 1) ? (x + ' ' + s) : (x + ' ' + p);
  }
  
  evalIframe(iframe, command) {
    if (!iframe.eval && iframe.execScript) {
        iframe.execScript("null");
    }
    iframe.eval(command);
}
  
}