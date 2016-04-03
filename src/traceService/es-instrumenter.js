import escodegen from 'escodegen';
import {EsprimaNodeFactory} from './models/esprima-node-factory';
export class EsInstrumenter {
  
  constructor() {
      this.escodegen = escodegen;
      this.init();
      this.esprimaNodeFactory = new EsprimaNodeFactory();
  }
    
  init(){
      let Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        BinaryExpression: 'BinaryExpression', 
        CallExpression: 'CallExpression',
        DoWhileStatement: 'DoWhileStatement',
        ExpressionStatement: 'ExpressionStatement', 
        ForStatement: 'ForStatement', 
        ForInStatement: 'ForInStatement', 
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        IfStatement: 'IfStatement', 
        NewExpression: 'NewExpression',
        Property: 'Property',
        ReturnStatement: 'ReturnStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression', 
        VariableDeclaration: 'VariableDeclaration', 
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement'
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
  
  getDefaultAutoLogNode(self = this){
       return self.esprimaNodeFactory.getDefaultAutoLogNode();
   }
  
  getLocationDataNode(loc, range, self = this){
      return self.esprimaNodeFactory.getLocationDataNode(loc, range);
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
  
  instrumentVariableDeclarator(node, code, self = this){
      let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
      let Syntax = self.Syntax,
            TraceParameters = self.TraceParameters,
            setNodeValue = self.setNodeValue,
            setNodeTextValue = self.setNodeTextValue,
            getLocationDataNode = self.getLocationDataNode,
            getTextRange = self.getTextRange;
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
                 locationData = getLocationDataNode(node.loc, node.range, self);
                 if(typeof locationData !== 'undefined'){
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
                 }
                
                node.init = autoLogNode;
            } 
  }
  
  instrumentCallExpression(node, code, self = this){
        let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
        let Syntax = self.Syntax,
            TraceParameters = self.TraceParameters,
            setNodeValue = self.setNodeValue,
            setNodeTextValue = self.setNodeTextValue,
            getLocationDataNode = self.getLocationDataNode,
            getTextRange = self.getTextRange;
                
        if(!node.callee || !node.range){
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
         locationData = getLocationDataNode(node.loc, node.range, self);
         if(typeof locationData !== 'undefined'){
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
         }
         
        node.callee = autoLogNode.callee;
        node.arguments= autoLogNode.arguments;
  }
  
  instrumentAssignmentExpression(node, code, self = this){
    let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
    let Syntax = self.Syntax,
            TraceParameters = self.TraceParameters,
            setNodeValue = self.setNodeValue,
            setNodeTextValue = self.setNodeTextValue,
            getLocationDataNode = self.getLocationDataNode,
            getTextRange = self.getTextRange;
    
    if(!node.right){
        return undefined;
    }
    
    if(node.right.type === Syntax.FunctionExpression){
        return undefined;
        
    }else{
         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.left.range)} );
         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.right.range)} );
         setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.right});
         locationData = getLocationDataNode(node.right.loc, node.right.range, self);
         if(typeof locationData !== 'undefined'){
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
         }
         node.right = autoLogNode;
    }
     
  }
  
    instrumentReturnStatement(node, code, self = this){
        let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
        let Syntax = self.Syntax,
                TraceParameters = self.TraceParameters,
                setNodeValue = self.setNodeValue,
                setNodeTextValue = self.setNodeTextValue,
                getLocationDataNode = self.getLocationDataNode,
                getTextRange = self.getTextRange;
                
        if(!node.argument){
            return undefined;
        }
        
        if(node.argument.type === Syntax.FunctionExpression){
            return undefined;
            
        }else{
             setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
             setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.argument.range)} );
             setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.argument.range)} );
             setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.argument});
             locationData = getLocationDataNode(node.argument.loc, node.argument.range, self);
             if(typeof locationData !== 'undefined'){
                setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
             }
             node.argument = autoLogNode;
        }
     
    }
  
    instrumentBinaryExpression(node, code, self = this){
        let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
        let TraceParameters = self.TraceParameters,
            getDefaultAutoLogNode= self.getDefaultAutoLogNode,
            setNodeValue = self.setNodeValue,
            setNodeTextValue = self.setNodeTextValue,
            getLocationDataNode = self.getLocationDataNode,
            getTextRange = self.getTextRange;
            
        if(!(node.right && node.left)){
            return undefined;
        }


        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.right.type} );
        
        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : "null"} );
        
        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.right.range)} );
        setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.right});
        locationData = getLocationDataNode(node.right.loc, node.right.range, self);
        if(typeof locationData !== 'undefined'){
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
        }
       
        node.right = autoLogNode;

        autoLogNode = getDefaultAutoLogNode(self);
       
        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.left.type} );
        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.left.range)} );
        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.left.range)} );
        setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.left});
        locationData = getLocationDataNode(node.left.loc, node.left.range, self);
        if(typeof locationData !== 'undefined'){
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
        }
       
        node.left = autoLogNode;
     
  }
  
  instrumentFunctionDeclaration(node, code, self = this){
      let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
      let   TraceParameters = self.TraceParameters,
            setNodeValue = self.setNodeValue,
            setNodeTextValue = self.setNodeTextValue,
            getLocationDataNode = self.getLocationDataNode,
            wrapInExpressionStatementNode = self.wrapInExpressionStatementNode;
      
        if(!(node.body && node.body.body)){
            return undefined;
        }
         
         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : node.id.name} );
         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : node.id.name} );
         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.id.name});
         locationData = getLocationDataNode(node.loc, node.range, self);
         if(typeof locationData !== 'undefined'){
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
         }
         
         autoLogNode = wrapInExpressionStatementNode(autoLogNode);
         node.body.body.unshift(autoLogNode);
                 
     
  }
  
    instrumentProperty(node, code, self = this){
      let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
      let TraceParameters = self.TraceParameters,
            setNodeValue = self.setNodeValue,
            setNodeTextValue = self.setNodeTextValue,
            getLocationDataNode = self.getLocationDataNode,
            getTextRange = self.getTextRange;
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
         locationData = getLocationDataNode(node.loc, node.range, self);
         
         if(typeof locationData !== 'undefined'){
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
         }
         node.value = autoLogNode;
     
    }
  
    instrumentExpressionStatement(node, code, self = this){
        let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
        let Syntax = self.Syntax,
            TraceParameters = self.TraceParameters,
            setNodeValue = self.setNodeValue,
            setNodeTextValue = self.setNodeTextValue,
            getLocationDataNode = self.getLocationDataNode,
            getTextRange = self.getTextRange;
        
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
         locationData = getLocationDataNode(node.loc, node.range, self);
         
         if(typeof locationData !== 'undefined'){
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
         }
        node.expression = autoLogNode;
    }
  
    instrumentControlStatementWithTest(node, code, self = this){
        let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
        let TraceParameters = self.TraceParameters,
            setNodeValue = self.setNodeValue,
            setNodeTextValue = self.setNodeTextValue,
            getLocationDataNode = self.getLocationDataNode,
            getTextRange = self.getTextRange;
        
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
         locationData = getLocationDataNode(node.loc, node.range, self);
         
         if(typeof locationData !== 'undefined'){
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
         }
        node.test = autoLogNode;
     
    }
  
    instrumentForStatement(node, code, self = this){
        let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
        let Syntax = self.Syntax,
            TraceParameters = self.TraceParameters,
            getDefaultAutoLogNode= self.getDefaultAutoLogNode,
            setNodeValue = self.setNodeValue,
            setNodeTextValue = self.setNodeTextValue,
            getLocationDataNode = self.getLocationDataNode,
            getTextRange = self.getTextRange;
            
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
             locationData = getLocationDataNode(node.loc, node.range, self);
             
             if(typeof locationData !== 'undefined'){
                setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
             }
            node.init = autoLogNode;
            autoLogNode = getDefaultAutoLogNode(self);
        }

         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.test.range)} );
         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.test.range)} );
         setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.test});
         locationData = getLocationDataNode(node.loc, node.range, self);
         
         if(typeof locationData !== 'undefined'){
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
         }
        node.test = autoLogNode;
        autoLogNode = getDefaultAutoLogNode(self);
         
        
        
        
        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.update.range)} );
         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.update.range)} );
         setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.update});
         locationData = getLocationDataNode(node.loc, node.range, self);
         
         if(typeof locationData !== 'undefined'){
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
         }
        node.update = autoLogNode;
        
     
    }
  
    instrumentForInStatement(node, code, self = this){
        let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
        let Syntax = self.Syntax,
            TraceParameters = self.TraceParameters,
            getDefaultAutoLogNode= self.getDefaultAutoLogNode,
            setNodeValue = self.setNodeValue,
            setNodeTextValue = self.setNodeTextValue,
            getLocationDataNode = self.getLocationDataNode,
            getTextRange = self.getTextRange;
        
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
             locationData = getLocationDataNode(node.loc, node.range, self);
             
             if(typeof locationData !== 'undefined'){
                setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
             }
            node.left = autoLogNode;
            autoLogNode = getDefaultAutoLogNode(self);
        }

         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : getTextRange(code, node.right.range)} );
         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.right.range)} );
         setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : node.right});
         locationData = getLocationDataNode(node.loc, node.range, self);
         
         if(typeof locationData !== 'undefined'){
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
         }
        node.right = autoLogNode;
     
    }
  
    instrumentFunctionExpression(node, code, self = this){
        let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
        let Syntax = self.Syntax,
            TraceParameters = self.TraceParameters,
            setNodeValue = self.setNodeValue,
            setNodeTextValue = self.setNodeTextValue,
            getLocationDataNode = self.getLocationDataNode,
            wrapInExpressionStatementNode = self.wrapInExpressionStatementNode;
        
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
             locationData = getLocationDataNode(node.loc, node.range, self);
             if(typeof locationData !== 'undefined'){
                setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
                setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
             }
             
             autoLogNode = wrapInExpressionStatementNode(autoLogNode);
             node.body.body.unshift(autoLogNode);
            
        }
    }
  
    traceInstrument(sourceCode, esanalyzer) {
        var self = this;
        let  instrumentedCode, autoLogTracer, tree;
        let Syntax = self.Syntax,
            instrumentVariableDeclarator = self.instrumentVariableDeclarator,
            instrumentCallExpression = self.instrumentCallExpression,
            instrumentAssignmentExpression = self.instrumentAssignmentExpression,
            instrumentReturnStatement = self.instrumentReturnStatement,
            instrumentBinaryExpression = self.instrumentBinaryExpression,
            instrumentFunctionDeclaration = self.instrumentFunctionDeclaration,
            instrumentProperty = self.instrumentProperty,
            instrumentExpressionStatement = self.instrumentExpressionStatement,
            instrumentControlStatementWithTest = self.instrumentControlStatementWithTest,
            instrumentForStatement = self.instrumentForStatement,
            instrumentForInStatement = self.instrumentForInStatement,
            instrumentFunctionExpression = self.instrumentFunctionExpression;
            

        autoLogTracer = function autoLogTracer(ref){
            let isForwardAnalysis = true;
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
                    instrumentVariableDeclarator(node, code, self);
                    break;
                    
                case Syntax.CallExpression:
                    instrumentCallExpression(node, code, self);
                    break;
    
                case Syntax.AssignmentExpression:
                    instrumentAssignmentExpression(node, code, self);
                    break;
    
                case Syntax.ReturnStatement:
                    instrumentReturnStatement(node, code, self);
                    break;
                    
                case Syntax.BinaryExpression:
                    instrumentBinaryExpression(node, code, self);
                    break;
    
                case Syntax.FunctionDeclaration:
                    instrumentFunctionDeclaration(node, code, self);
                    break;
    
                case Syntax.Property:
                    instrumentProperty(node, code, self);
                    break;
    
                case Syntax.ExpressionStatement:
                    instrumentExpressionStatement(node, code, self);
                    break;
    
                case Syntax.IfStatement:
                    instrumentControlStatementWithTest(node, code, self);
                    break;
    
                case Syntax.DoWhileStatement:
                    instrumentControlStatementWithTest(node, code, self);
                    break;
    
                case Syntax.WhileStatement:
                    instrumentControlStatementWithTest(node, code, self);
                    break;
    
                case Syntax.ForStatement:
                    instrumentForStatement(node, code, self);
                    break;
    
                case Syntax.ForInStatement:
                    instrumentForInStatement(node, code, self);
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
                    instrumentFunctionExpression(node, parent, code);
                    break;
                    
                default:
            }
        };
        
        tree = esanalyzer.traceAllAutoLog(sourceCode, autoLogTracer);
        
        instrumentedCode = self.escodegen.generate(tree);

        instrumentedCode = `
            ${this.getAutologCodeBoilerPlate()}
            ${instrumentedCode}
            document.getElementById("trace_results").innerHTML= JSON.stringify(window.TRACE.getExpressions());
        `;

        return instrumentedCode;
    }
    
    getAutologCodeBoilerPlate(){
        return `
        var Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        ArrayExpression: 'ArrayExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        Program: 'Program',
        Property: 'Property',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement'
    };
    var traceTypes = {
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
                
                if(window.ISCANCELLED){
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
        
        `;
    }
  
    

}