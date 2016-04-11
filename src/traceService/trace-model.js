import {Trace} from './trace';
export class TraceModel{
    constructor(){
        this.traceSearchfilters = {
			any: "Any",
			id: "ID",
			type: "Type",
			text: "Text",
			value: "Value"
		};
       	
		let traceParameters = {
            type : 0,
            id : 1,
            text : 2,
            value : 3,
            range : 4,
            indexRange : 5,
            extra : 6
            
        };
        
        this.traceParameters = traceParameters;
        
        this.traceSearchFilterToParameter = {
			any: [traceParameters.type],
			id: [traceParameters.id],
			type: [traceParameters.type],
			text: [traceParameters.text],
			value: [traceParameters.value]
		};
		
        this.traceDataContainer = "SeeCodeRunTraceDataResults";
        this.traceSyntax = {
            AssignmentExpression: 'AssignmentExpression',
            BinaryExpression: 'BinaryExpression', 
            BlockStatement: 'BlockStatement',
            CallExpression: 'CallExpression',
            DoWhileStatement: 'DoWhileStatement',
            ExpressionStatement: 'ExpressionStatement', 
            ForStatement: 'ForStatement', 
            ForInStatement: 'ForInStatement', 
            FunctionDeclaration: 'FunctionDeclaration',
            FunctionExpression: 'FunctionExpression',
            IfStatement: 'IfStatement', 
            NewExpression: 'NewExpression',
            Program: 'Program',
            Property: 'Property',
            ReturnStatement: 'ReturnStatement',
            UnaryExpression: 'UnaryExpression',
            UpdateExpression: 'UpdateExpression', 
            VariableDeclaration: 'VariableDeclaration', 
            VariableDeclarator: 'VariableDeclarator',
            WhileStatement: 'WhileStatement'
        };
        
        let Syntax = {
            AssignmentExpression: 'AssignmentExpression',
            ArrayExpression: 'ArrayExpression',
            BinaryExpression: 'BinaryExpression',
            BlockStatement: 'BlockStatement',
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
        
        this.esSyntax = Syntax;
        
        
        this.executionEvents = {
            running : {  event :'codeRunning'   , description : 'Tracing Code...' },
            finished: {  event :'codeFinished'  , description : 'Trace built successfully.' },
            failed  : {  event :'codeFailed'    , description : 'Code failed (Runtime error).' }
        };
          
        this.traceEvents = {
            instrumented    : {  event :'traceInstrumented'   , description : 'Code Instrumented successfully.' },
            changed         : {  event :'traceChanged'   , description : 'Trace results obtained succesfully.' },
            failed          : {  event :'instrumentationFailed'    , description : 'Code rewriting failed (Compilation error).' }
         };
      
        this.timeLimit = 3000; 
        
    }
    
    makeTrace(trace){
        return new Trace(trace);
    }
    
    makeEmptyPayload(){
        return {status: "", description : "" , data : []};
    }
    makePayload(status, description, data){
        return {status: status, description : description , data : data};
    }
}