import escodegen from 'escodegen';

export class EsInstrumenter {
  
  constructor() {
      this.escodegen = escodegen;
      this.init();
  }
    
  init(){
      let Syntax = {
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
    this.Syntax = Syntax;
    this.TraceParameters = {
        type : 0,
        id : 1,
        text : 2,
        value : 3,
        range : 4,
        indexRange : 5,
        extra : 6
        
    };
    
    }
    
  getTextRange(code, range){
       if(typeof range === 'undefined'){
           return undefined;
       }else if(range.length < 2){
           return undefined;
       }
       let from = range[0];
       let till = range[1];
       return code.substring(from, till);
   }
 
  wrapInExpressionStatementNode(autoLogNode){
        return { 
            "type": "ExpressionStatement",
            "expression": autoLogNode
        };
   }
  
  getDefaultAutoLogNode(){
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
  getLocationDataNode(loc, range){
       let aceRange, indexRange;

       if(loc && range){
            aceRange = {
                'start'     : {'row' : ((loc.start && loc.start.line>0)? loc.start.line-1: 0), 'column' : (loc.start? loc.start.column: 0) } ,
                'end'       : {'row' : ((loc.end && loc.end.line>0)? loc.end.line-1: 0), 'column' : (loc.end? loc.end.column: 0) }
            };
            indexRange = [
                (range.length>0? range[0]: 0)   ,
                (range.length>1? range[1]: 0) 
                ];
            
       let data = {
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
  
  setNodeValue(ref){
     ref.autoLogNode.arguments[0].properties[ref.propertyIndex].value = ref.value;
  }
    
  setNodeTextValue(ref){
        ref.autoLogNode.arguments[0].properties[ref.propertyIndex].value = {
                        "type": "Literal",
                        "value": ref.value,
                        "raw": ref.value
                    };
  }
  
  instrumentVariableDeclarator(node, code){
      let autoLogNode = this.getDefaultAutoLogNode(), locationData;
      let Syntax = this.Syntax,
            TraceParameters = this.TraceParameters,
            setNodeValue = this.setNodeValue,
            setNodeTextValue = this.setNodeTextValue,
            getLocationDataNode = this.getLocationDataNode,
            getTextRange = this.getTextRange;
     if(!node.init){
                return undefined;
            }
            if(node.init.type === Syntax.FunctionExpression){
                return undefined;// Backward Analysis
                 
            }else{
                 setNodeTextValue({autoLogNode: autoLogNode, propertyIndex: TraceParameters.type, value : node.type} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.id.range)} );
                 setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.init.range)} );
                 setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.init});
                 locationData = getLocationDataNode(node.loc, node.range);
                 if(typeof locationData !== 'undefined'){
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                 }
                //setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.extra, 'value' : JSON.stringify(value)});
                
                node.init = autoLogNode;
            } 
  }
  
  instrumentCallExpression(node, code){
        let autoLogNode = this.getDefaultAutoLogNode(), locationData;
        let Syntax = this.Syntax,
            TraceParameters = this.TraceParameters,
            setNodeValue = this.setNodeValue,
            setNodeTextValue = this.setNodeTextValue,
            getLocationDataNode = this.getLocationDataNode,
            getTextRange = this.getTextRange;
                
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
  }
  
  instrumentAssignmentExpression(node, code){
    let autoLogNode = this.getDefaultAutoLogNode(), locationData;
    let Syntax = this.Syntax,
            TraceParameters = this.TraceParameters,
            setNodeValue = this.setNodeValue,
            setNodeTextValue = this.setNodeTextValue,
            getLocationDataNode = this.getLocationDataNode,
            getTextRange = this.getTextRange;
    
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
     
  }
  
    instrumentReturnStatement(node, code){
        let autoLogNode = this.getDefaultAutoLogNode(), locationData;
        let Syntax = this.Syntax,
                TraceParameters = this.TraceParameters,
                setNodeValue = this.setNodeValue,
                setNodeTextValue = this.setNodeTextValue,
                getLocationDataNode = this.getLocationDataNode,
                getTextRange = this.getTextRange;
                
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
     
    }
  
    instrumentBinaryExpression(node, code){
        let autoLogNode = this.getDefaultAutoLogNode(), locationData;
        let TraceParameters = this.TraceParameters,
            getDefaultAutoLogNode= this.getDefaultAutoLogNode,
            setNodeValue = this.setNodeValue,
            setNodeTextValue = this.setNodeTextValue,
            getLocationDataNode = this.getLocationDataNode,
            getTextRange = this.getTextRange;
            
        if(!(node.right && node.left)){
            return undefined;
        }


        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.right.type} );
        
        // setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.right.range)} );
        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : "null"} );
        
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
     
  }
  
  instrumentFunctionDeclaration(node, code){
      let autoLogNode = this.getDefaultAutoLogNode(), locationData;
      let   TraceParameters = this.TraceParameters,
            setNodeValue = this.setNodeValue,
            setNodeTextValue = this.setNodeTextValue,
            getLocationDataNode = this.getLocationDataNode,
            wrapInExpressionStatementNode = this.wrapInExpressionStatementNode;
      
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
                 
     
  }
  
    instrumentProperty(node, code){
      let autoLogNode = this.getDefaultAutoLogNode(), locationData;
      let TraceParameters = this.TraceParameters,
            setNodeValue = this.setNodeValue,
            setNodeTextValue = this.setNodeTextValue,
            getLocationDataNode = this.getLocationDataNode,
            getTextRange = this.getTextRange;
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
     
    }
  
    instrumentExpressionStatement(node, code){
        let autoLogNode = this.getDefaultAutoLogNode(), locationData;
        let Syntax = this.Syntax,
            TraceParameters = this.TraceParameters,
            getDefaultAutoLogNode= this.getDefaultAutoLogNode,
            setNodeValue = this.setNodeValue,
            setNodeTextValue = this.setNodeTextValue,
            getLocationDataNode = this.getLocationDataNode,
            getTextRange = this.getTextRange,
            wrapInExpressionStatementNode = this.wrapInExpressionStatementNode;
        
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
    }
  
    instrumentControlStatementWithTest(node, code){
        let autoLogNode = this.getDefaultAutoLogNode(), locationData;
        let TraceParameters = this.TraceParameters,
            setNodeValue = this.setNodeValue,
            setNodeTextValue = this.setNodeTextValue,
            getLocationDataNode = this.getLocationDataNode,
            getTextRange = this.getTextRange;
        
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
     
    }
  
    instrumentForStatement(node, code){
        let autoLogNode = this.getDefaultAutoLogNode(), locationData;
        let Syntax = this.Syntax,
            TraceParameters = this.TraceParameters,
            getDefaultAutoLogNode= this.getDefaultAutoLogNode,
            setNodeValue = this.setNodeValue,
            setNodeTextValue = this.setNodeTextValue,
            getLocationDataNode = this.getLocationDataNode,
            getTextRange = this.getTextRange;
            
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
        
     
    }
  
    instrumentForInStatement(node, code){
        let autoLogNode = this.getDefaultAutoLogNode(), locationData;
        let Syntax = this.Syntax,
            TraceParameters = this.TraceParameters,
            getDefaultAutoLogNode= this.getDefaultAutoLogNode,
            setNodeValue = this.setNodeValue,
            setNodeTextValue = this.setNodeTextValue,
            getLocationDataNode = this.getLocationDataNode,
            getTextRange = this.getTextRange,
            wrapInExpressionStatementNode = this.wrapInExpressionStatementNode;
        
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
     
    }
  
    instrumentFunctionExpression(node, code){
        let autoLogNode = this.getDefaultAutoLogNode(), locationData;
        let Syntax = this.Syntax,
            TraceParameters = this.TraceParameters,
            setNodeValue = this.setNodeValue,
            setNodeTextValue = this.setNodeTextValue,
            getLocationDataNode = this.getLocationDataNode,
            wrapInExpressionStatementNode = this.wrapInExpressionStatementNode;
        
        let identifier;
                    
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
    }
  
    traceInstrument(sourceCode, esanalyzer) {
        let  instrumentedCode, autoLogTracer, tree;      

        autoLogTracer = this.autoLogTracer ;
        
        tree = esanalyzer.traceAllAutoLog(sourceCode, autoLogTracer);
        
        instrumentedCode = this.escodegen.generate(tree);
        // Enclose in IIFE.
        instrumentedCode = '(function() {\n' + instrumentedCode + '\n}())';

        return instrumentedCode;
    }
  
    autoLogTracer(ref){
        let Syntax = this.Syntax, isForwardAnalysis = true;
        let node = ref.node, code = ref.code, path = ref.path;
        
        if(!Syntax.hasOwnProperty(node.type)){
            return undefined;
        }
        if(!node.range){
            return undefined;
        }
        //TODO: uncomment implemented types in Syntax to allow analysis. When finished, all types should have been implemented.
        
        //FORWARD ANALYSIS
        
        switch(node.type){
            case Syntax.VariableDeclarator:
                this.instrumentVariableDeclarator(node, code);
                break;
                
            case Syntax.CallExpression:
                this.instrumentCallExpression(node, code);
                break;

            case Syntax.AssignmentExpression:
                this.instrumentAssignmentExpression(node, code);
                break;

            case Syntax.ReturnStatement:
                this.instrumentReturnStatement(node, code);
                break;
                
            case Syntax.BinaryExpression:
                this.instrumentBinaryExpression(node, code);
                break;

            case Syntax.FunctionDeclaration:
                this.instrumentFunctionDeclaration(node, code);
                break;

            case Syntax.Property:
                this.instrumentProperty(node, code);
                break;

            case Syntax.ExpressionStatement:
                this.instrumentExpressionStatement(node, code);
                break;

            case Syntax.IfStatement:
                this.instrumentControlStatementWithTest(node, code);
                break;

            case Syntax.DoWhileStatement:
                this.instrumentControlStatementWithTest(node, code);
                break;

            case Syntax.WhileStatement:
                this.instrumentControlStatementWithTest(node, code);
                break;

            case Syntax.ForStatement:
                this.instrumentForStatement(node, code);
                break;

            case Syntax.ForInStatement:
                this.instrumentForInStatement(node, code);
                break;
                
            default:
                isForwardAnalysis = false;
        }
        
        if(isForwardAnalysis){
            return;
        }
            
       //BACKWARD ANALYSIS, requires path to be defined        
        if(!path){
            return;
        }   

        let parent = path[0] ;
        //path[1] contains reference to parent array and ... check collectPath()
        // learn that references are treoublesome in JS. fixing elements only in context

        switch(node.type){
            case Syntax.FunctionExpression:
                this.instrumentFunctionExpression(node, parent, code);
                break;
                
            default:
        }
    }

}