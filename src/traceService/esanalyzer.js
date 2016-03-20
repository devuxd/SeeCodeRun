import esprima from 'esprima';
import estraverse from 'estraverse';
export class EsAnalyzer {

  constructor() {
    this.esprima = esprima;
    this.estraverse = estraverse;
    this.init();
  }
  init(){
    this.Syntax = {
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
  }
  
  getEsprima(){
    return this.esprima;
  }
  
  // Executes visitor on the object and its children (recursively). Added key to modify object (repercusion?) path[0][objectKey] = new node...
  traverse(object, visitor, master, objectKey) {
        var key, child, parent, path, isLeaf = true;

        parent = (typeof master === 'undefined') ? [] : master;

        if (visitor.call(null, object, parent, objectKey) === false) {
            return;
        }
        
        for (key in object) {
            if (object.hasOwnProperty(key)) {
                child = object[key];
                path = [ object ];
                path.push(parent);
                
                if (typeof child === 'object' && child !== null) {
                        this.traverse(child, visitor, path, key);
                        isLeaf = false;
                }
                    
            }
        }
        // if (isLeaf) { 
        //     // end of path action        
        // }
        
    }
    
  // from root to current node
  collectPath( nodePath ){
        var path =[];
        
        while (typeof nodePath !== 'undefined'){
            if(nodePath.length>1){
                path.unshift(nodePath[0]);
                nodePath = nodePath[1];
                
            }else if(nodePath.length>0){
                path.unshift(nodePath[0]);
                nodePath = undefined;
            }else{ // [] case
                nodePath = undefined;
            }
        }
        return path;
  }
  
  beautifyPathSyntaxTypesOnly (path){
        var beautifulString = "path: {";
        for( var i in path){
            var node = path[i];
            if(node.type){
                beautifulString  += node.type;
                beautifulString  += ", ";
            }
             
        }
        beautifulString  += " }";
        return beautifulString; // create a clipboard visualizer overlay plugin for windows
  }
    


  getTextRange(code, indexRange){//todo move to utils
       if(!indexRange){
           return "";
       }
       let from = indexRange[0];
       let till = indexRange[1];
       return code.substring(from, till);
  }
    

  traceAllAutoLog(code, autoLogTracer) {
 
            
            var tree = esprima.parse(code, { range: true, loc: true });


            this.traverse(tree, function traceVisitor(node, path, nodeKey) {
               // var parent;
                // Catching the expressions
            //     if (node.type === Syntax.VariableDeclarator) {
            //         autoLogTracer({'node' :node, 'code' : code});
                        
            //     }else if (node.type === Syntax.CallExpression) {
            //         autoLogTracer({'node' :node, 'code' : code});
               
            //     }else if(node.type === Syntax.AssignmentExpression){
            //             autoLogTracer({'node' :node, 'code' : code});
                    
            //     }else if(node.type === Syntax.BinaryExpression){
            //             node=autoLogTracer({'node' :node, 'code' : code});
                        
            //     }else if (node.type === Syntax.FunctionDeclaration) {
			         //   autoLogTracer({'node' :node, 'code' : code});
                    
            //     } else if (node.type === Syntax.FunctionExpression) {
            //         // requires backward analysis
            //         //parent = path[0];
            //         //console.log(beautifyPathSintaxTypesOnly(collectPath(path)));
            //         autoLogTracer({'node' :node, 'code' : code, 'path' :path});

            //     }
                
            // all logic moved to autoLogTracer in execution trace
            autoLogTracer({'node' :node, 'code' : code, 'path' :path, 'nodeKey' :nodeKey});
				
            });
            
          return tree;
        
    }
   
}