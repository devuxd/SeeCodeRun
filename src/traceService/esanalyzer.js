import esprima from 'esprima';
import estraverse from 'estraverse';
export class EsAnalyzer {

  constructor() {
    this.esprima = esprima;
    this.estraverse = estraverse;
    this.init();
  }
  init(){
        let Syntax = {
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
    this.traceTypes = {
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
    this.Syntax = Syntax; 
  }
  
  getEsprima(){
    return this.esprima;
  }
  
  // Executes visitor on the object and its children (recursively). Added key to modify object (repercusion?) path[0][objectKey] = new node...
  traverse(object, visitor, master, objectKey) {
        var key, child, parent, path;

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
                }
                    
            }
        }

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
        return beautifulString;
  }
    

  traceAllAutoLog(code, autoLogTracer) {
 
            
            let tree = esprima.parse(code, { range: true, loc: true });


            this.traverse(tree, function traceVisitor(node, path, nodeKey) {
                autoLogTracer({'node' :node, 'code' : code, 'path' :path, 'nodeKey' :nodeKey});
            });
            
          return tree;
        
    }
   
}