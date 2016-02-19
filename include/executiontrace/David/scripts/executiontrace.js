/*
  Copyright (C) 2016 David Gonzalez <luminaxster@gmail.com>
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com> (functiontrace.js)
  [FreeBSD License]
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those
of the authors and should not be interpreted as representing official policies,
either expressed or implied, of the SeeCodeRun Project.
*/

// REQUIRES ESPRIMA AND ESMORPH (ASSUMED TO BE IN INVOKER'S HMTL)

(function (global) {
    'use strict';

    function id(i) {
        return document.getElementById(i);
    }

    function traceInstrument(sourceCode) {
        var tracer, code, signature;      // var code caused a 2 hours delay
        tracer = window.esmorph.Tracer.FunctionEntrance(function (fn) {
            signature = 'window.TRACE.autoLog({ ';
            signature += '"type": "' + fn.type + '", ';
            signature += '"text": "' + fn.name + '", ';
            signature += '"value": ' + fn.expression + ', ';
            signature += '"range": {'+
                             '"start" : { "row" : '+(fn.loc.start.line - 1) + ', "column" : ' + fn.loc.start.column + '}, '+
                             '"end" : { "row" : '+(fn.loc.end.line - 1) + ', "column" : ' + fn.loc.end.column + '}'+
                        '} , ';  // range in column-row format used in ACE
            signature += 'indexRange: [' + fn.range[0] + ',' + fn.range[1] + ']';
            signature += '})';
            
            return signature;
            
        });
        
        

        code = window.esmorph.modify(sourceCode, tracer); // instrumented code

        // Enclose in IIFE.
        code = '(function() {\n' + code + '\n}())';

        return code;
    }

    function count(x, s, p) {
        return (x === 1) ? (x + ' ' + s) : (x + ' ' + p);
    }

    

    function createTraceCollector() {
        global.TRACE = {
            hits: {}, data: {}, stack : [],
            autoLog: function (info) {
                var key = info.text + ':' + info.indexRange[0];
                
                if(info.type === 'Call'){
    				this.stack.push(key) ;
                }
                
                var stackTop =	this.stack.length - 1 ;
                
				if (this.hits.hasOwnProperty(key)) {
                    this.hits[key] = this.hits[key] + 1;
                    this.data[key].values.push({'stackIndex': stackTop, 'value' :JSON.stringify(info.value)});
                } else {
                    this.hits[key] = 1;
                    this.data[key] = {
                        'type' : info.type,
                        'text' : info.text,
                        'values': [{'stackIndex': stackTop, 'value' :JSON.stringify(info.value)}],
                        'range': info.range
                        //{'start' : {'row' : info.loc[0], 'column' : info.loc[1]}, 'end' : {'row' : info.range[2], 'column' : info.range[3]}}
                    };
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
            getExecutionTrace: function () {

            }
        };
    }

/**
 * description
 *  Usage: window.traceRun( sourceCode, eventListener)
 *      @parameter sourceCode: a string with the source code
 *      @parameter eventListener: a callback function that responds with status(Running, Finished, Error) and
 *      description of them.
 * Details: 1. Calls createTraceCollector() as the callback instrumented in the original code.
 *          2. traceInstrument() will analyze the original code, find the element types we need and append calls to the trace collector.
 *          3. traceInstrument() returns the instrumented code(rewritten code with added functionality) than is then executed with the eval()
 *          4. When the execution finishes, the eventListener callback will return status 'Finished' and the object window.TRACE wil
 *          allow to obtain the execution trace data with the getExecutionTrace() call (i.e window.TRACE.getExecutionTrace())
 *
 */
    global.traceExecution = function (sourceCode, eventListener) {
        var code, timestamp;
        try {
            eventListener({'status' : 'Running' , 'description': 'Building Tracer'});
            
            createTraceCollector();
            code = traceInstrument(sourceCode);
            
            eventListener({'status' : 'Running' , 'description': 'Executing Code'});
            
            timestamp = +new Date();
            eval(code);
            timestamp = (+new Date()) - timestamp;
            
            eventListener({'status' : 'Finished' , 'description': 'Tracing completed in ' + (1 + timestamp) + ' ms.'});

        } catch (e) {
            eventListener({'status' : 'Error' , 'description': e.toString()});
        }
    };
    global.getTraceAnnotations = function(){
        var i, stackTrace, entry, text, row;

		stackTrace = window.TRACE.getStackTrace();
		var annotations = [];
        for (i = 0; i < stackTrace.length; i += 1) {
            entry = stackTrace[i];
            text = entry.text;
			row = entry.range.start.row;
			
			annotations.push({"type": "info", "row": row, "raw": " y is called x times", "text": text + ' is called ' + count(entry.count, 'time', 'times')});
            
        }
        return annotations;
    };
}(window));
