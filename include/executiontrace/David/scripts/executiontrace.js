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
            signature += 'name: "' + fn.name + '", ';
            signature += 'lineNumber: ' + fn.loc.start.line + ', ';
            signature += 'columnNumber: ' + fn.loc.start.column + ', ';
            signature += 'range: [' + fn.range[0] + ',' + fn.range[1] + ']' + ', ';
            signature += ' });';
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
            hits: {}, data: {}, stack : {}, stackSize : 0,
            autoLog: function (info) {
                
                var key = info.name + ':' + info.range[0];
				this.stack[this.stackSize] = key;
				this.stackSize = this.stackSize + 1;
				
                if (this.hits.hasOwnProperty(key)) {
                    this.hits[key] = this.hits[key] + 1;					
                } else {
                    this.hits[key] = 1;
					this.data[key] = info;

                }
            },
            getStackTrace: function () {
                var entry,
                    stackData = [];
                for (entry in this.stack) {
                    if (this.stack.hasOwnProperty(entry)) {
                        stackData.push({ index: entry, name: this.stack[entry], count: this.hits[this.stack[entry]], data : this.data[this.stack[entry]]});
                    }
                }
                return stackData;
            }
        };
    }

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
            eventListener({'status' : 'Error' , 'description': e});
        }
    };
    global.getTraceAnnotations = function(){
        var i, stackTrace, entry, name, row, column;

		stackTrace = window.TRACE.getStackTrace();
		var annotations = [];
        for (i = 0; i < stackTrace.length; i += 1) {
            entry = stackTrace[i];
            name = entry.name.split(':')[0];
			row = entry.data.lineNumber -1;
			column = entry.data.columnNumber;
			
			annotations.push({type: "info", "row": row, "column": column, "raw": " y is called x times", "text": name + ' is called ' + count(entry.count, 'time', 'times')});
            
        }
        return annotations;
    };
}(window));
