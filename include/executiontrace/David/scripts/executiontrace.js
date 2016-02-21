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
    // must match autoLogNode.arguments[0].properties order of properties
    var TraceParameters = {
        type : 0,
        id : 1,
        text : 2,
        value : 3,
        range : 4,
        indexRange : 5,
        extra : 6
        
    };
    var Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        // ArrayExpression: 'ArrayExpression',
        // BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        // BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        // CatchClause: 'CatchClause',
        // ConditionalExpression: 'ConditionalExpression',
        // ContinueStatement: 'ContinueStatement',
        // DoWhileStatement: 'DoWhileStatement',
        // DebuggerStatement: 'DebuggerStatement',
        // EmptyStatement: 'EmptyStatement',
        // ExpressionStatement: 'ExpressionStatement',
        // ForStatement: 'ForStatement',
        // ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        // FunctionExpression: 'FunctionExpression',
        // Identifier: 'Identifier',
        // IfStatement: 'IfStatement',
        // Literal: 'Literal',
        // LabeledStatement: 'LabeledStatement',
        // LogicalExpression: 'LogicalExpression',
        // MemberExpression: 'MemberExpression',
        // NewExpression: 'NewExpression',
        // ObjectExpression: 'ObjectExpression',
        // Program: 'Program',
        // Property: 'Property',
        // ReturnStatement: 'ReturnStatement',
        // SequenceExpression: 'SequenceExpression',
        // SwitchStatement: 'SwitchStatement',
        // SwitchCase: 'SwitchCase',
        // ThisExpression: 'ThisExpression',
        // ThrowStatement: 'ThrowStatement',
        // TryStatement: 'TryStatement',
        // UnaryExpression: 'UnaryExpression',
        // UpdateExpression: 'UpdateExpression',
        // VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        // WhileStatement: 'WhileStatement',
        // WithStatement: 'WithStatement'
    };

    function getTextRange(code, range){
       if(typeof range === 'undefined'){
           return undefined;
       }else if(range.length < 2){
           return undefined;
       }
       var from = range[0];
       var till = range[1];
       return code.substring(from, till);
   }
   function wrapInExpressionStatementNode(autoLogNode){
        return { 
            "type": "ExpressionStatement",
            "expression": autoLogNode
        };
   }
   function getDefaultAutoLogNode(){
       return {
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
                                    "raw": "'type'"
                                },
                                "computed": false,
                                "value": {
                                    "type": "Literal",
                                    "value": "",
                                    "raw": "''"
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
                                    "raw": "'id'"
                                },
                                "computed": false,
                                "value": {
                                    "type": "Literal",
                                    "value": "",
                                    "raw": "''"
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
                                    "raw": "'text'"
                                },
                                "computed": false,
                                "value": {
                                    "type": "Literal",
                                    "value": "",
                                    "raw": "''"
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
                                    "raw": "'value'"
                                },
                                "computed": false,
                                "value": {
                                    "type": "Literal",
                                    "value": "",
                                    "raw": "''"
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
                                    "raw": "'range'"
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
                                                "raw": "'start'"
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
                                                            "raw": "'row'"
                                                        },
                                                        "computed": false,
                                                        "value": {
                                                            "type": "Literal",
                                                            "value": 0,
                                                            "raw": "0"
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
                                                            "raw": "'column'"
                                                        },
                                                        "computed": false,
                                                        "value": {
                                                            "type": "Literal",
                                                            "value": 0,
                                                            "raw": "0"
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
                                                "raw": "'end'"
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
                                                            "raw": "'row'"
                                                        },
                                                        "computed": false,
                                                        "value": {
                                                            "type": "Literal",
                                                            "value": 0,
                                                            "raw": "0"
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
                                                            "raw": "'column'"
                                                        },
                                                        "computed": false,
                                                        "value": {
                                                            "type": "Literal",
                                                            "value": 0,
                                                            "raw": "0"
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
                                            "value": 0,
                                            "raw": "0"
                                        },
                                        {
                                            "type": "Literal",
                                            "value": 0,
                                            "raw": "0"
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
                                    "value": "extra",
                                    "raw": "'extra'"
                                },
                                "computed": false,
                                "value": {
                                    "type": "Literal",
                                    "value": "",
                                    "raw": "''"
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
   /*
     validates if location and range from esprima nodes have values

     post:  if location and range are undefined, returns undefined  otherwise
            returns an AST nodes (Esprima format) in properties location and range, any undefined properties in inputs loc and range value are zeros 
   */
   function getLocationDataNode(loc, range){
       var aceRange, indexRange;

       if(loc && range){
            aceRange = {
                'start'     : {'row' : ((loc.start && loc.start.line>0)? loc.start.line-1: 0), 'column' : (loc.start? loc.start.column: 0) } ,
                'end'       : {'row' : ((loc.end && loc.end.line>0)? loc.end.line-1: 0), 'column' : (loc.end? loc.end.column: 0) }
            };
            indexRange = [
                (range.length>0? range[0]: 0)   ,
                (range.length>1? range[1]: 0) 
                ];
            
       var data = {
          'location' : {
                                    "type": "ObjectExpression",
                                    "properties": [
                                        {
                                            "type": "Property",
                                            "key": {
                                                "type": "Literal",
                                                "value": "start",
                                                "raw": "'start'"
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
                                                            "raw": "'row'"
                                                        },
                                                        "computed": false,
                                                        "value": {
                                                            "type": "Literal",
                                                            "value": aceRange.start.row,
                                                            "raw": ""+aceRange.start.row
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
                                                            "raw": "'column'"
                                                        },
                                                        "computed": false,
                                                        "value": {
                                                            "type": "Literal",
                                                            "value": aceRange.start.column,
                                                            "raw": ""+aceRange.start.column
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
                                                "raw": "'end'"
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
                                                            "raw": "'row'"
                                                        },
                                                        "computed": false,
                                                        "value": {
                                                            "type": "Literal",
                                                            "value": aceRange.end.row,
                                                            "raw": ""+aceRange.end.row
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
                                                            "raw": "'column'"
                                                        },
                                                        "computed": false,
                                                        "value": {
                                                            "type": "Literal",
                                                            "value": aceRange.end.column,
                                                            "raw": ""+aceRange.end.column
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
                      'range'  :           {
                                    "type": "ArrayExpression",
                                    "elements": [
                                        {
                                            "type": "Literal",
                                            "value": indexRange[0],
                                            "raw": ""+ indexRange[0]
                                        },
                                        {
                                            "type": "Literal",
                                            "value": indexRange[1],
                                            "raw": ""+ indexRange[1]
                                        }
                                    ]
                                }
       };
       return data;
       } else {
           return undefined;
       }
       
   }
    function setNodeValue(ref){
        ref.autoLogNode.arguments[0].properties[ref.propertyIndex].value = ref.value;
    }
    function setNodeTextValue(ref){
        ref.autoLogNode.arguments[0].properties[ref.propertyIndex].value = {
                        "type": "Literal",
                        "value": ref.value,
                        "raw": ref.value
                    };
    }
    function traceInstrument(sourceCode) {
        var  code, autoLogTracer;      // var code caused a 2 hours delay

        
        autoLogTracer = function (ref){
            var node = ref.node, code = ref.code;
            if(!Syntax.hasOwnProperty(node.type)){
                return undefined;
            }
            
            var autoLogNode = getDefaultAutoLogNode(), isStatement = false, locationData;
            if(node.type === Syntax.VariableDeclarator){
                if(!node.init){
                    return undefined;
                }
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.init.type} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.id.range)} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.init.range)} );
                 setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.init});
                 locationData = getLocationDataNode(node.init.loc, node.init.range);
                 if(typeof locationData !== 'undefined'){
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                 }
                //setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.extra, 'value' : JSON.stringify(value)});
                
                node.init = autoLogNode;
               
            }else if(node.type === Syntax.CallExpression){
                if(!node.callee || !node.range){ //range is not present in instrumented nodes, it prevents infinite traverse() recursion
                    return undefined;
                }
                     setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
                     setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.callee.range)} );
                     setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.range)} );
                     setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : 
                         {
                            "type": "CallExpression",
                            "callee": node.callee,
                            "arguments": node.arguments
                         }
                     });
                     locationData = getLocationDataNode(node.loc, node.range);
                     if(typeof locationData !== 'undefined'){
                        setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                        setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                     }
                     
                    node.callee = autoLogNode.callee;
                    node.arguments= autoLogNode.arguments;
                
            }else if(node.type === Syntax.AssignmentExpression){
                if(!node.right){
                    return undefined;
                }
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.right.type} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.left.range)} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.right.range)} );
                 setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.right});
                 locationData = getLocationDataNode(node.right.loc, node.right.range);
                 if(typeof locationData !== 'undefined'){
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                 }
                node.right = autoLogNode;
               
            }else if(node.type === Syntax.BinaryExpression){
                if(!(node.right && node.left)){
                    return undefined;
                }
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.range)} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.range)} );
                 setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node});
                 locationData = getLocationDataNode(node.loc, node.range);
                 if(typeof locationData !== 'undefined'){
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                 }
                node = autoLogNode;
               
            }else if(node.type === Syntax.FunctionDeclaration){
                if(!(node.body && node.body.body)){
                    return undefined;
                }
                 autoLogNode = wrapInExpressionStatementNode(autoLogNode);
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : node.id.name} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : node.id.name} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.id.name});
                 locationData = getLocationDataNode(node.loc, node.range);
                 if(typeof locationData !== 'undefined'){
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                 }
                 
                 node.body.body.unshift(autoLogNode);
            }
           
            return autoLogNode;
        };
        
        
        var newCode =window.esmorph.Tracer.TraceAll(sourceCode, autoLogTracer);

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
