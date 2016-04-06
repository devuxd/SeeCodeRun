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

    var Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        // ArrayExpression: 'ArrayExpression',
        // BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression', // whole expression catch as part of expression statement, call expression and control flow ones
        // BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        // CatchClause: 'CatchClause',
        // ConditionalExpression: 'ConditionalExpression',// solves Unary and Update Expressions
        // ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',// solves Unary and Update Expressions
        // DebuggerStatement: 'DebuggerStatement',
        // EmptyStatement: 'EmptyStatement',
        ExpressionStatement: 'ExpressionStatement', // solves Unary and Update Expressions
        ForStatement: 'ForStatement', // solves Unary and Update Expressions
        ForInStatement: 'ForInStatement', // solves Unary and Update Expressions
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        // Identifier: 'Identifier',
        IfStatement: 'IfStatement', // solves Unary and Update Expressions
        // Literal: 'Literal',
        // LabeledStatement: 'LabeledStatement',
        // LogicalExpression: 'LogicalExpression',
        // MemberExpression: 'MemberExpression',
        NewExpression: 'NewExpression',
        // ObjectExpression: 'ObjectExpression',
        // Program: 'Program',
        Property: 'Property',
        ReturnStatement: 'ReturnStatement',
        // SequenceExpression: 'SequenceExpression',
        // SwitchStatement: 'SwitchStatement',
        // SwitchCase: 'SwitchCase',
        // ThisExpression: 'ThisExpression',
        // ThrowStatement: 'ThrowStatement',
        // TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression', // done in parent
        UpdateExpression: 'UpdateExpression', // done in parent
        VariableDeclaration: 'VariableDeclaration', // done in children and parent
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        // WithStatement: 'WithStatement'
    };
     var TraceParameters = {
        type : 0,
        id : 1,
        text : 2,
        value : 3,
        range : 4,
        indexRange : 5,
        extra : 6
        
    };
    var TraceTypes = {
        LocalStack : [Syntax.FunctionDeclaration, Syntax.FunctionExpression],
        Expression: [
            Syntax.UnaryExpression,
            Syntax.UpdateExpression,
            Syntax.CallExpression,
            Syntax.Property,
            Syntax.VariableDeclarator,
            Syntax.AssignmentExpression,
            Syntax.BinaryExpression,
            Syntax.ReturnStatement,
            Syntax.ForStatement,
            Syntax.ForInStatement,
            Syntax.WhileStatement,
            Syntax.DoWhileStatement,
            Syntax.ExpressionStatement
            ],
        ExpressionStatement : [
            Syntax.ExpressionStatement
            ],
        ControlFlow : [],
        Condition: [],
        Loop: [Syntax.WhileStatement],
        exception: []
        
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
        
        var  instrumentedCode, autoLogTracer;      // var code caused a 2 hours delay

        
        autoLogTracer = function (ref){
        //uncomment  implemented types in Syntax to allow analysis
            var node = ref.node, code = ref.code, path = ref.path, nodeKey = ref.nodeKey;
            if(!Syntax.hasOwnProperty(node.type)){
                return undefined;
            }
            if(!node.range){
                return undefined;
            }
            //FORWARD ANALYSIS
            
            var autoLogNode = getDefaultAutoLogNode(), locationData;
            if(node.type === Syntax.VariableDeclarator){
                if(!node.init){
                    return undefined;
                }
                if(node.init.type === Syntax.FunctionExpression){
                    return undefined;// Backward Analysis
                     
                }else{
                     setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
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
                }
               
            }else if(node.type === Syntax.CallExpression){
                if(!node.callee || !node.range){ //range is not present in instrumented nodes, it prevents infinite traverse() recursion
                    return undefined;
                }
                     setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
                     setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.callee.range)} );
                     setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.range)} );
                     setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : 
                         {
                            "type": Syntax.CallExpression,
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
                if(node.right.type === Syntax.FunctionExpression){
                    return undefined;// Backward Analysis
                    
                }else{
                     setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
                     setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.left.range)} );
                     setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.right.range)} );
                     setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.right});
                     locationData = getLocationDataNode(node.right.loc, node.right.range);
                     if(typeof locationData !== 'undefined'){
                        setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                        setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                     }
                     node.right = autoLogNode;
                }
                
/*ReturnStatement */  
            }else if(node.type === Syntax.ReturnStatement){
                if(!node.argument){
                    return undefined;
                }
                if(node.argument.type === Syntax.FunctionExpression){
                    return undefined;// Backward Analysis
                    
                }else{
                     setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
                     setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.argument.range)} );
                     setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.argument.range)} );
                     setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.argument});
                     locationData = getLocationDataNode(node.argument.loc, node.argument.range);
                     if(typeof locationData !== 'undefined'){
                        setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                        setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                     }
                     node.argument = autoLogNode;
                }
                
/*BinaryExpression */   // the whole expression is handle in others cases such test, expression. that is, is element of something 
            }else if(node.type === Syntax.BinaryExpression){
                if(!(node.right && node.left)){
                    return undefined;
                }


                setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.right.type} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.right.range)} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.right.range)} );
                 setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.right});
                 locationData = getLocationDataNode(node.right.loc, node.right.range);
                 if(typeof locationData !== 'undefined'){
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                 }
               
               node.right = autoLogNode;

               autoLogNode = getDefaultAutoLogNode();
               
                setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.left.type} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.left.range)} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.left.range)} );
                 setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.left});
                 locationData = getLocationDataNode(node.left.loc, node.left.range);
                 if(typeof locationData !== 'undefined'){
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                 }
               
               node.left = autoLogNode;
               
/*FunctionDeclaration */
            }else if(node.type === Syntax.FunctionDeclaration){
                if(!(node.body && node.body.body)){
                    return undefined;
                }
                 
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : node.id.name} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : node.id.name} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.id.name});
                 locationData = getLocationDataNode(node.loc, node.range);
                 if(typeof locationData !== 'undefined'){
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                 }
                 
                 autoLogNode = wrapInExpressionStatementNode(autoLogNode);
                 node.body.body.unshift(autoLogNode);
                 
                 
 /*Property */}else if(node.type === Syntax.Property){
                if(!(node.key && node.value)){
                    return undefined;
                }
                if(!node.value.range){
                    return undefined;
                }
                 
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.key.range)} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.value.range)} );
                 setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.value});
                 locationData = getLocationDataNode(node.loc, node.range);
                 
                 if(typeof locationData !== 'undefined'){
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                 }
                 node.value = autoLogNode;
                 
 /*ExpressionStatement */}else if(node.type === Syntax.ExpressionStatement){ 
     
                if(!node.expression){
                    return undefined;
                }
                if(!node.expression.range){ 
                    return undefined;
                }
                 if(!(node.expression.type === Syntax.UnaryExpression || node.expression.type === Syntax.UpdateExpression)){ 
                    return undefined;
                }
                 
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.expression.range)} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.expression.range)} );
                 setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.expression});
                 locationData = getLocationDataNode(node.loc, node.range);
                 
                 if(typeof locationData !== 'undefined'){
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                 }
                node.expression = autoLogNode;
                 
 /* Cond Statements */}else if(node.type === Syntax.IfStatement ||node.type === Syntax.DoWhileStatement ||node.type === Syntax.WhileStatement ){ 
     
                if(!node.test){
                    return undefined;
                }
                if(!node.test.range){ 
                    return undefined;
                }

                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.test.range)} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.test.range)} );
                 setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.test});
                 locationData = getLocationDataNode(node.loc, node.range);
                 
                 if(typeof locationData !== 'undefined'){
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                 }
                node.test = autoLogNode;
                 
 /*For */    }else if(node.type === Syntax.ForStatement){ 
     
                if(!node.init ||!node.test ||!node.update ){
                    return undefined;
                }
                if(!node.init.range ||!node.test.range ||!node.update.range ){ 
                    return undefined;
                }
                
                
                
                if(node.init.type !== Syntax.VariableDeclaration){
                    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
                     setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.init.range)} );
                     setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.init.range)} );
                     setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.init});
                     locationData = getLocationDataNode(node.loc, node.range);
                     
                     if(typeof locationData !== 'undefined'){
                        setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                        setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                     }
                    node.init = autoLogNode;
                    autoLogNode = getDefaultAutoLogNode();
                }

                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.test.range)} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.test.range)} );
                 setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.test});
                 locationData = getLocationDataNode(node.loc, node.range);
                 
                 if(typeof locationData !== 'undefined'){
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                 }
                node.test = autoLogNode;
                autoLogNode = getDefaultAutoLogNode();
                 
                
                
                
                setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.update.range)} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.update.range)} );
                 setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.update});
                 locationData = getLocationDataNode(node.loc, node.range);
                 
                 if(typeof locationData !== 'undefined'){
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                 }
                node.update = autoLogNode;
                
 /*For In */    }else if(node.type === Syntax.ForInStatement){ 
     
                if(!node.left ||!node.right ){
                    return undefined;
                }
                if(!node.left.range ||!node.right.range ){ 
                    return undefined;
                }

                 if(node.left.type !== Syntax.VariableDeclaration){
                    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
                     setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.left.range)} );
                     setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.left.range)} );
                     setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.left});
                     locationData = getLocationDataNode(node.loc, node.range);
                     
                     if(typeof locationData !== 'undefined'){
                        setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                        setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                     }
                    node.left = autoLogNode;
                    autoLogNode = getDefaultAutoLogNode();
                }

                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.right.range)} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.right.range)} );
                 setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.right});
                 locationData = getLocationDataNode(node.loc, node.range);
                 
                 if(typeof locationData !== 'undefined'){
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                 }
                node.right = autoLogNode;
                 
 /*BW */    }else if(path){//BACKWARD ANALYSIS, requires path to be defined
                var parent = path[0] ;
                //path[1] contains reference to parent array and ... check collectPath()
                // learn that references are treoublesome in JS. fixing elements only in context
                
/*FunctionExpression */
                if (node.type === Syntax.FunctionExpression) { 
                    
                    var identifier;
                    
                    if (parent.type === Syntax.AssignmentExpression) {
                        if (typeof parent.left.range !== 'undefined') {
                            identifier = code.slice(parent.left.range[0], parent.left.range[1]).replace(/"/g, '\\"');
                        }
                    } else if (parent.type === Syntax.VariableDeclarator) {
                        identifier = parent.id.name;
                        
                    } else if (parent.type === Syntax.CallExpression) {
                        identifier =  parent.id ? parent.id.name : '[Anonymous]';
                            
                    } else if (typeof parent.length === 'number') {
                        identifier =  parent.id ? parent.id.name : '[Anonymous]';
                        
                    } else if (typeof parent.key !== 'undefined') {
                        if (parent.key.type === 'Identifier') {
                            if (parent.value === node && parent.key.name) {
                                    identifier =  parent.key.name;
                            }
                        }
                    }
                    
                    if(identifier){
                        if(!(node.body && node.body.body)){
                            return undefined;
                        }
                         
                         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
                         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : identifier} );
                         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : identifier} );
                         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : identifier});
                         locationData = getLocationDataNode(node.loc, node.range);
                         if(typeof locationData !== 'undefined'){
                            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                         }
                         
                         autoLogNode = wrapInExpressionStatementNode(autoLogNode);
                         node.body.body.unshift(autoLogNode);
                        
                    }
                    
                }else if(node.type){
                
            
               
                }
            }
           
            return autoLogNode;
        };
        
        
        instrumentedCode = window.esmorph.Tracer.TraceAll(sourceCode, autoLogTracer);
        // Enclose in IIFE.
        instrumentedCode = '(function() {\n' + instrumentedCode + '\n}())';

        return instrumentedCode;
    }

    function count(x, s, p) {
        return (x === 1) ? (x + ' ' + s) : (x + ' ' + p);
    }

    
/**
 * Readme(Chat/Doc/Misc anchor to piece of code) to Team in code. Interesting idea like wht the professor proposed in paper.
 * Venkat : add a timer to the last while  entrance and clear if hit again (use a timeout callback), otherwise offer to stop trace
 * Han :  the stack index is already added to the values  every time a expression is evaluated. Look in the this.data[expression].values array
 * Dana: Yep. Once you find elements in the stack of type "CallExpression" and the name is like document.* then show it the API should look like this tool (don't look a the code, only the functionality) https://github.com/estools/esquery
 * David: add timeout handling as valid
 */
    function createTraceCollector() {
        global.TRACE = {
            hits: {}, data: {}, stack : [], execution : [], variables: [], values : [], timeline: [], identifiers: [],  
            autoLog: function (info) {
                var key = info.text + ':' + info.indexRange[0]+':' + info.indexRange[1];
                
                if(TraceTypes.LocalStack.indexOf(info.type)>-1){
    				this.stack.push(key) ;
                }
                //variables
                if(info.type === Syntax.VariableDeclarator || info.type === Syntax.AssignmentExpression){
                   this.values.push({'id': info.id , 'value': JSON.stringify(info.value), 'range': info.range}); 
                }
                
                
                //timeline
                this.timeline.push({ id: info.id , value: JSON.stringify(info.value), range: info.range, type: info.type, text: info.text});

                var stackTop =	this.stack.length - 1;
                
				if (this.hits.hasOwnProperty(key)) {
                    this.hits[key] = this.hits[key] + 1;
                    this.data[key].hits = this.hits[key] + 1;
                    this.data[key].values.push({'stackIndex': stackTop, 'value' :JSON.stringify(info.value)});
                } else {
                    
                    //variables
                    if(info.type === Syntax.VariableDeclarator){
                       this.variables.push({'id': info.id , 'range': info.range});
                    }
                    
                    //timeline
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
                let result = [];
                for (let i in this.execution) {
                    let entry = this.execution[i];
                    if (this.data.hasOwnProperty(entry)) {
                        result.push(this.data[entry]);
                    }
                }
                return result;
            },// timeline
            getExpressions: function () {
                return {variables : this.identifiers, timeline: this.timeline};
            },
            getVariables: function () {
                return {variables : this.variables, values: this.values};
            },
            getExecutionTrace: function () {// getValues
                var i, entry, data, stackData = [];
                for (i in this.execution) {
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
    global.CANTRACE= true; // should note be handled here =[ ... too sleepy ... I do not compile PENDING TIMEOUT
    global.traceExecution = function (sourceCode, eventListener) {
        var code, timestamp;
        if(!window.CANTRACE){
            eventListener({'status' : 'Busy' , 'description': 'a previous trace is running'});
            return;
        }
        window.CANTRACE =false;
        // try {
                eventListener({'status' : 'Running' , 'description': 'Building Tracer'});
                
                createTraceCollector();
                code = traceInstrument(sourceCode);
                
                eventListener({'status' : 'Running' , 'description': 'Executing Code'});
                
                timestamp = +new Date();
                console.log(code);
                eval(code);
                timestamp = (+new Date()) - timestamp;
                
                eventListener({'status' : 'Finished' , 'description': 'Tracing completed in ' + (1 + timestamp) + ' ms.'});
                window.CANTRACE = true;
    
        //   } catch (e) {
        //       eventListener({'status' : 'Error' , 'description': e.toString()});
        //       window.CANTRACE = true;
        //   }
    };
    global.getTraceAnnotations = function(){
        var i, stackTrace, entry, text, row;

		stackTrace = window.TRACE.getStackTrace();
		var annotations = [];
        for (i = 0; i < stackTrace.length; i += 1) {
            entry = stackTrace[i];
            text = entry.text;
			row = entry.range.start.row;
			
			annotations.push({"type": "info", "row": row, "column": 0, "raw": " y is called x times", "text": text + ' is called ' + count(entry.count, 'time', 'times')});
            
        }
        return annotations;
    };
    global.testGetDefaultFunction = function(){
        return 1;
    }
}(window));
