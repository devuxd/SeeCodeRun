import escodegen from 'escodegen';
import {EsprimaNodeFactory} from './external/esprima-node-factory';
import {AutoLogTracer} from './external/auto-log-tracer';
export class EsInstrumenter {
  
  constructor(traceModel) {
      this.traceModel = traceModel;
      this.escodegen = escodegen;
      this.esprimaNodeFactory = new EsprimaNodeFactory();
      this.autoLogTracer = new AutoLogTracer(traceModel.traceDataContainer);
      this.Syntax = this.traceModel.traceSyntax;
      this.TraceParameters = this.traceModel.traceParameters;
      this.blockCounter = 0;
      this.programCounter = 0;
    
  }

  getTextRange(code, range){
       if(!range){
           return undefined;
       }
       
       if(range.length < 2){
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
         
         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.expression.type} );
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
  
    
    instrumentBlockStatement(node, code, self = this){
        let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
        let TraceParameters = self.TraceParameters,
            getDefaultAutoLogNode= self.getDefaultAutoLogNode,
            setNodeValue = self.setNodeValue,
            setNodeTextValue = self.setNodeTextValue,
            getLocationDataNode = self.getLocationDataNode,
            getTextRange = self.getTextRange,
            wrapInExpressionStatementNode = self.wrapInExpressionStatementNode,
            blockCounter = self.blockCounter;
            
        if(!(node.body)){
            return undefined;
        }


        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : "null"} );
        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.range)} );
        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : getTextRange(code, node.range)} );
        locationData = getLocationDataNode(node.loc, node.range, self);
        if(locationData){
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
        }
        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.extra, 'value' : `Block${blockCounter}:Enter`} );
        
        node.body.unshift(wrapInExpressionStatementNode(autoLogNode));

        autoLogNode = getDefaultAutoLogNode(self);
        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.type} );
        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value' : "null"} );
        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value' : getTextRange(code, node.range)} );
        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value' : getTextRange(code, node.range)} );
        locationData = getLocationDataNode(node.loc, node.range, self);
        if(locationData){
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.range, 'value' : locationData.location});
            setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.indexRange, 'value' : locationData.range});
        }
        setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.extra, 'value' : `Block${blockCounter}:Exit`} );
        
        node.body.push(wrapInExpressionStatementNode(autoLogNode));
        
        self.blockCounter++;
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
         
         setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value' : node.expression.type} );
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
  
    instrumentTracer(sourceCode, esanalyzer) {
        var self = this;
        let  instrumentedCode, instrumenter, tree;
        let Syntax = self.Syntax,
            instrumentVariableDeclarator = self.instrumentVariableDeclarator,
            instrumentCallExpression = self.instrumentCallExpression,
            instrumentAssignmentExpression = self.instrumentAssignmentExpression,
            instrumentReturnStatement = self.instrumentReturnStatement,
            instrumentBinaryExpression = self.instrumentBinaryExpression,
            instrumentFunctionDeclaration = self.instrumentFunctionDeclaration,
            instrumentBlockStatement = self.instrumentBlockStatement,
            instrumentProperty = self.instrumentProperty,
            instrumentExpressionStatement = self.instrumentExpressionStatement,
            instrumentControlStatementWithTest = self.instrumentControlStatementWithTest,
            instrumentForStatement = self.instrumentForStatement,
            instrumentForInStatement = self.instrumentForInStatement,
            instrumentFunctionExpression = self.instrumentFunctionExpression;
            

        instrumenter = function instrumenter(ref){
            let isForwardAnalysis = true;
            let node = ref.node, code = ref.code, path = ref.path;
            
            if(!Syntax.hasOwnProperty(node.type)){
                return undefined;
            }
            if(!node.range){
                return undefined;
            }

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
                    
                case Syntax.BlockStatement:
                    instrumentBlockStatement(node, code, self);
                    break;
                    
                case Syntax.BinaryExpression:
                    instrumentBinaryExpression(node, code, self);
                    break;
    
                case Syntax.FunctionDeclaration:
                    instrumentFunctionDeclaration(node, code, self);
                    break;
                    
                case Syntax.Program:
                    instrumentBlockStatement(node, code, self);
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
                
              
            if(!path){
                return;
            }   
    
            let parent = path[0] ;
    
            switch(node.type){
                case Syntax.FunctionExpression:
                    instrumentFunctionExpression(node, parent, code);
                    break;
                    
                default:
            }
        };
        
        tree = esanalyzer.traceAllAutoLog(sourceCode, instrumenter);
        
        instrumentedCode = self.escodegen.generate(tree);

        instrumentedCode = `
            ${this.autoLogTracer.getTraceDataContainerCodeBoilerPlate()}
            ${this.autoLogTracer.getAutologCodeBoilerPlate()}
            ${this.autoLogTracer.wrapCodeInTimeOut(instrumentedCode, this.traceModel.timeLimit)}
            ${this.autoLogTracer.getTraceDataCodeBoilerPlate()}
        `;

        return instrumentedCode;
    }

}