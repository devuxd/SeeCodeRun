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

    function getTextRange(code, indexRange){
       if(!indexRange){
           return undefined;
       }
       var from = indexRange[0];
       var till = indexRange[1];
       return code.substring(from, till);
   }

    function traceInstrument(sourceCode) {
        var tracer, code, signature, autoLogTracer;      // var code caused a 2 hours delay
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
        
        autoLogTracer = function (node, code){
            var autoLogNode = node, isStatement = false;
            if(node.type === 'VariableDeclarator'){
                autoLogNode = {
                    "type": "CallExpression",
                    "callee": {
                        "type": "MemberExpression",
                        "computed": false,
                        "object": {
                            "type": "MemberExpression",
                            "computed": false,
                            "object": {
                                "type": "Identifier",
                                "name": "window"
                            },
                            "property": {
                                "type": "Identifier",
                                "name": "TRACE"
                            }
                        },
                        "property": {
                            "type": "Identifier",
                            "name": "autoLog"
                        }
                    },
                    "arguments": [
                        {
                            "type": "ObjectExpression",
                            "properties": [
                                {
                                    "type": "Property",
                                    "key": {
                                        "type": "Literal",
                                        "value": "type",
                                        "raw": "\"type\""
                                    },
                                    "computed": false,
                                    "value": {
                                        "type": "Literal",
                                        "value": node.init.type,
                                        "raw": node.init.type
                                    },
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": false
                                },
                                {
                                    "type": "Property",
                                    "key": {
                                        "type": "Literal",
                                        "value": "id",
                                        "raw": "\"id\""
                                    },
                                    "computed": false,
                                    "value": {
                                        "type": "Literal",
                                        "value": getTextRange(code, node.id.range),
                                        "raw": getTextRange(code, node.id.range)
                                    },
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": false
                                },
                                {
                                    "type": "Property",
                                    "key": {
                                        "type": "Literal",
                                        "value": "text",
                                        "raw": "\"text\""
                                    },
                                    "computed": false,
                                    "value": {
                                        "type": "Literal",
                                        "value": getTextRange(code, node.init.range),
                                        "raw": getTextRange(code, node.init.range)
                                    },
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": false
                                },
                                {
                                    "type": "Property",
                                    "key": {
                                        "type": "Literal",
                                        "value": "value",
                                        "raw": "\"value\""
                                    },
                                    "computed": false,
                                    "value": node.init,
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": false
                                },
                                {
                                    "type": "Property",
                                    "key": {
                                        "type": "Literal",
                                        "value": "range",
                                        "raw": "\"range\""
                                    },
                                    "computed": false,
                                    "value": {
                                        "type": "ObjectExpression",
                                        "properties": [
                                            {
                                                "type": "Property",
                                                "key": {
                                                    "type": "Literal",
                                                    "value": "start",
                                                    "raw": "\"start\""
                                                },
                                                "computed": false,
                                                "value": {
                                                    "type": "ObjectExpression",
                                                    "properties": [
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Literal",
                                                                "value": "row",
                                                                "raw": "\"row\""
                                                            },
                                                            "computed": false,
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": node.init.loc.start.line -1,
                                                                "raw": "\""+ (node.init.loc.start.line -1)+"\""
                                                            },
                                                            "kind": "init",
                                                            "method": false,
                                                            "shorthand": false
                                                        },
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Literal",
                                                                "value": "column",
                                                                "raw": "\"column\""
                                                            },
                                                            "computed": false,
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": node.init.loc.start.column,
                                                                "raw": "\""+ node.init.loc.start.column+"\""
                                                            },
                                                            "kind": "init",
                                                            "method": false,
                                                            "shorthand": false
                                                        }
                                                    ]
                                                },
                                                "kind": "init",
                                                "method": false,
                                                "shorthand": false
                                            },
                                            {
                                                "type": "Property",
                                                "key": {
                                                    "type": "Literal",
                                                    "value": "end",
                                                    "raw": "\"end\""
                                                },
                                                "computed": false,
                                                "value": {
                                                    "type": "ObjectExpression",
                                                    "properties": [
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Literal",
                                                                "value": "row",
                                                                "raw": "\"row\""
                                                            },
                                                            "computed": false,
                                                            "value": {
                                                                "type": "Literal",
                                                                "value":  node.init.loc.end.line -1,
                                                                "raw": "\""+ (node.init.loc.end.line -1)+"\""
                                                            },
                                                            "kind": "init",
                                                            "method": false,
                                                            "shorthand": false
                                                        },
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Literal",
                                                                "value": "column",
                                                                "raw": "\"column\""
                                                            },
                                                            "computed": false,
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": node.init.loc.end.column,
                                                                "raw": "\""+ node.init.loc.end.column+"\""
                                                            },
                                                            "kind": "init",
                                                            "method": false,
                                                            "shorthand": false
                                                        }
                                                    ]
                                                },
                                                "kind": "init",
                                                "method": false,
                                                "shorthand": false
                                            }
                                        ]
                                    },
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": false
                                },
                                {
                                    "type": "Property",
                                    "key": {
                                        "type": "Identifier",
                                        "name": "indexRange"
                                    },
                                    "computed": false,
                                    "value": {
                                        "type": "ArrayExpression",
                                        "elements": [
                                            {
                                                "type": "Literal",
                                                "value": node.init.range[0],
                                                "raw": "\""+ node.init.range[0]+"\""
                                            },
                                            {
                                                "type": "Literal",
                                                "value": node.init.range[1],
                                                "raw": "\""+ node.init.range[1]+"\""
                                            }
                                        ]
                                    },
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": false
                                }
                            ]
                        }
                    ]
                };
               
            }else if(node.type === 'CallExpression'){
               // isStatement = true;
               autoLogNode = {
                    "type": "CallExpression",
                    "callee": {
                        "type": "MemberExpression",
                        "computed": false,
                        "object": {
                            "type": "MemberExpression",
                            "computed": false,
                            "object": {
                                "type": "Identifier",
                                "name": "window"
                            },
                            "property": {
                                "type": "Identifier",
                                "name": "TRACE"
                            }
                        },
                        "property": {
                            "type": "Identifier",
                            "name": "autoLog"
                        }
                    },
                    "arguments": [
                        {
                            "type": "ObjectExpression",
                            "properties": [
                                {
                                    "type": "Property",
                                    "key": {
                                        "type": "Literal",
                                        "value": "type",
                                        "raw": "\"type\""
                                    },
                                    "computed": false,
                                    "value": {
                                        "type": "Literal",
                                        "value": node.type,
                                        "raw": node.type
                                    },
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": false
                                },
                                {
                                    "type": "Property",
                                    "key": {
                                        "type": "Literal",
                                        "value": "id",
                                        "raw": "\"id\""
                                    },
                                    "computed": false,
                                    "value": {
                                        "type": "Literal",
                                        "value": getTextRange(code, node.range),
                                        "raw": getTextRange(code, node.range)
                                    },
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": false
                                },
                                {
                                    "type": "Property",
                                    "key": {
                                        "type": "Literal",
                                        "value": "text",
                                        "raw": "\"text\""
                                    },
                                    "computed": false,
                                    "value": {
                                        "type": "Literal",
                                        "value": getTextRange(code, node.range),
                                        "raw": getTextRange(code, node.range)
                                    },
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": false
                                },
                                {
                                    "type": "Property",
                                    "key": {
                                        "type": "Literal",
                                        "value": "value",
                                        "raw": "\"value\""
                                    },
                                    "computed": false,
                                    "value":  {
                                        "type": "CallExpression",
                                            "callee": node.callee,
                                            "arguments": node.arguments},
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": false
                                },
                                {
                                    "type": "Property",
                                    "key": {
                                        "type": "Literal",
                                        "value": "range",
                                        "raw": "\"range\""
                                    },
                                    "computed": false,
                                    "value": {
                                        "type": "ObjectExpression",
                                        "properties": [
                                            {
                                                "type": "Property",
                                                "key": {
                                                    "type": "Literal",
                                                    "value": "start",
                                                    "raw": "\"start\""
                                                },
                                                "computed": false,
                                                "value": {
                                                    "type": "ObjectExpression",
                                                    "properties": [
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Literal",
                                                                "value": "row",
                                                                "raw": "\"row\""
                                                            },
                                                            "computed": false,
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": node.loc.start.line -1,
                                                                "raw": "\""+ (node.loc.start.line -1)+"\""
                                                            },
                                                            "kind": "init",
                                                            "method": false,
                                                            "shorthand": false
                                                        },
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Literal",
                                                                "value": "column",
                                                                "raw": "\"column\""
                                                            },
                                                            "computed": false,
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": node.loc.start.column,
                                                                "raw": "\""+ node.loc.start.column+"\""
                                                            },
                                                            "kind": "init",
                                                            "method": false,
                                                            "shorthand": false
                                                        }
                                                    ]
                                                },
                                                "kind": "init",
                                                "method": false,
                                                "shorthand": false
                                            },
                                            {
                                                "type": "Property",
                                                "key": {
                                                    "type": "Literal",
                                                    "value": "end",
                                                    "raw": "\"end\""
                                                },
                                                "computed": false,
                                                "value": {
                                                    "type": "ObjectExpression",
                                                    "properties": [
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Literal",
                                                                "value": "row",
                                                                "raw": "\"row\""
                                                            },
                                                            "computed": false,
                                                            "value": {
                                                                "type": "Literal",
                                                                "value":  node.loc.end.line -1,
                                                                "raw": "\""+ (node.loc.end.line -1)+"\""
                                                            },
                                                            "kind": "init",
                                                            "method": false,
                                                            "shorthand": false
                                                        },
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Literal",
                                                                "value": "column",
                                                                "raw": "\"column\""
                                                            },
                                                            "computed": false,
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": node.loc.end.column,
                                                                "raw": "\""+ node.loc.end.column+"\""
                                                            },
                                                            "kind": "init",
                                                            "method": false,
                                                            "shorthand": false
                                                        }
                                                    ]
                                                },
                                                "kind": "init",
                                                "method": false,
                                                "shorthand": false
                                            }
                                        ]
                                    },
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": false
                                },
                                {
                                    "type": "Property",
                                    "key": {
                                        "type": "Identifier",
                                        "name": "indexRange"
                                    },
                                    "computed": false,
                                    "value": {
                                        "type": "ArrayExpression",
                                        "elements": [
                                            {
                                                "type": "Literal",
                                                "value": node.range[0],
                                                "raw": "\""+ node.range[0]+"\""
                                            },
                                            {
                                                "type": "Literal",
                                                "value": node.range[1],
                                                "raw": "\""+ node.range[1]+"\""
                                            }
                                        ]
                                    },
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": false
                                }
                            ]
                        }
                    ]
                };
            }
            else if(node.type === 'FunctionDeclaration'){
                isStatement = true;
               autoLogNode = {
                    "type": "CallExpression",
                    "callee": {
                        "type": "MemberExpression",
                        "computed": false,
                        "object": {
                            "type": "MemberExpression",
                            "computed": false,
                            "object": {
                                "type": "Identifier",
                                "name": "window"
                            },
                            "property": {
                                "type": "Identifier",
                                "name": "TRACE"
                            }
                        },
                        "property": {
                            "type": "Identifier",
                            "name": "autoLog"
                        }
                    },
                    "arguments": [
                        {
                            "type": "ObjectExpression",
                            "properties": [
                                {
                                    "type": "Property",
                                    "key": {
                                        "type": "Literal",
                                        "value": "type",
                                        "raw": "\"type\""
                                    },
                                    "computed": false,
                                    "value": {
                                        "type": "Literal",
                                        "value": node.type,
                                        "raw": node.type
                                    },
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": false
                                },
                                {
                                    "type": "Property",
                                    "key": {
                                        "type": "Literal",
                                        "value": "id",
                                        "raw": "\"id\""
                                    },
                                    "computed": false,
                                    "value": {
                                        "type": "Literal",
                                        "value": node.id.name,
                                        "raw": node.id.name
                                    },
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": false
                                },
                                {
                                    "type": "Property",
                                    "key": {
                                        "type": "Literal",
                                        "value": "text",
                                        "raw": "\"text\""
                                    },
                                    "computed": false,
                                    "value": {
                                        "type": "Literal",
                                        "value": node.id.name,
                                        "raw": node.id.name
                                    },
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": false
                                },
                                {
                                    "type": "Property",
                                    "key": {
                                        "type": "Literal",
                                        "value": "value",
                                        "raw": "\"value\""
                                    },
                                    "computed": false,
                                    "value":  {
                                        "type": "Literal",
                                        "value": node.id.name,
                                        "raw": node.id.name
                                    },
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": false
                                },
                                {
                                    "type": "Property",
                                    "key": {
                                        "type": "Literal",
                                        "value": "range",
                                        "raw": "\"range\""
                                    },
                                    "computed": false,
                                    "value": {
                                        "type": "ObjectExpression",
                                        "properties": [
                                            {
                                                "type": "Property",
                                                "key": {
                                                    "type": "Literal",
                                                    "value": "start",
                                                    "raw": "\"start\""
                                                },
                                                "computed": false,
                                                "value": {
                                                    "type": "ObjectExpression",
                                                    "properties": [
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Literal",
                                                                "value": "row",
                                                                "raw": "\"row\""
                                                            },
                                                            "computed": false,
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": node.loc.start.line -1,
                                                                "raw": "\""+ (node.loc.start.line -1)+"\""
                                                            },
                                                            "kind": "init",
                                                            "method": false,
                                                            "shorthand": false
                                                        },
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Literal",
                                                                "value": "column",
                                                                "raw": "\"column\""
                                                            },
                                                            "computed": false,
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": node.loc.start.column,
                                                                "raw": "\""+ node.loc.start.column+"\""
                                                            },
                                                            "kind": "init",
                                                            "method": false,
                                                            "shorthand": false
                                                        }
                                                    ]
                                                },
                                                "kind": "init",
                                                "method": false,
                                                "shorthand": false
                                            },
                                            {
                                                "type": "Property",
                                                "key": {
                                                    "type": "Literal",
                                                    "value": "end",
                                                    "raw": "\"end\""
                                                },
                                                "computed": false,
                                                "value": {
                                                    "type": "ObjectExpression",
                                                    "properties": [
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Literal",
                                                                "value": "row",
                                                                "raw": "\"row\""
                                                            },
                                                            "computed": false,
                                                            "value": {
                                                                "type": "Literal",
                                                                "value":  node.loc.end.line -1,
                                                                "raw": "\""+ (node.loc.end.line -1)+"\""
                                                            },
                                                            "kind": "init",
                                                            "method": false,
                                                            "shorthand": false
                                                        },
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Literal",
                                                                "value": "column",
                                                                "raw": "\"column\""
                                                            },
                                                            "computed": false,
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": node.loc.end.column,
                                                                "raw": "\""+ node.loc.end.column+"\""
                                                            },
                                                            "kind": "init",
                                                            "method": false,
                                                            "shorthand": false
                                                        }
                                                    ]
                                                },
                                                "kind": "init",
                                                "method": false,
                                                "shorthand": false
                                            }
                                        ]
                                    },
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": false
                                },
                                {
                                    "type": "Property",
                                    "key": {
                                        "type": "Identifier",
                                        "name": "indexRange"
                                    },
                                    "computed": false,
                                    "value": {
                                        "type": "ArrayExpression",
                                        "elements": [
                                            {
                                                "type": "Literal",
                                                "value": node.range[0],
                                                "raw": "\""+ node.range[0]+"\""
                                            },
                                            {
                                                "type": "Literal",
                                                "value": node.range[1],
                                                "raw": "\""+ node.range[1]+"\""
                                            }
                                        ]
                                    },
                                    "kind": "init",
                                    "method": false,
                                    "shorthand": false
                                }
                            ]
                        }
                    ]
                };
            }
            if(isStatement){
                    autoLogNode = { "type": "ExpressionStatement",
                        "expression": 
                            autoLogNode
                        
                    };
            }
            return autoLogNode;
        };
        
        
        var newCode =window.esmorph.Tracer.TraceAll(sourceCode, autoLogTracer);

        code = window.esmorph.modify(sourceCode, tracer); // instrumented code

        // Enclose in IIFE.
       // code = '(function() {\n' + code + '\n}())';
        code = '(function() {\n' + newCode + '\n}())';

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
                
                if(info.type === 'FunctionDeclaration'){
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
                var entry,
                    stackData = [];
                    var i = 0;
                for (var key in this.data) {
                    if (this.data.hasOwnProperty(key)) {
                        entry = this.data[key];
                        stackData.push({ index: i++, text: entry.text + ":" + entry.values, range: entry.range,  count: this.hits[key]});
                    }
                }
                return stackData;

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
       // try {
            eventListener({'status' : 'Running' , 'description': 'Building Tracer'});
            
            createTraceCollector();
            code = traceInstrument(sourceCode);
            
            eventListener({'status' : 'Running' , 'description': 'Executing Code'});
            
            timestamp = +new Date();
            eval(code);
            timestamp = (+new Date()) - timestamp;
            
            eventListener({'status' : 'Finished' , 'description': 'Tracing completed in ' + (1 + timestamp) + ' ms.'});

       // } catch (e) {
       //     eventListener({'status' : 'Error' , 'description': e.toString()});
        //}
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
