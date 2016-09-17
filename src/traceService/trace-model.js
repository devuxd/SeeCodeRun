import {Trace} from "./trace";
export class TraceModel{
    constructor(){
        this.traceSearchEvents = {
            searchBoxChanged : {  event :"searchBoxChanged"   , description : "User changed the search box parameters..." },
            searchStateUpdated : {  event :"searchStateChanged"   , description : "Updated search parameters in Firebase..." },
            aceMarkersChanged : {  event :"aceMarkersChanged"   , description : "Trace results updated. Update Ace markers" }
        };
        this.traceSearchfilters = {
            functions: "functions",
			none: "none",
			any: "any",
			id: "id",
//TODO 		dom: "DOM",
// 			text: "Text",
			value: "value"
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
            AssignmentExpression: "AssignmentExpression",
            BinaryExpression: "BinaryExpression",
            BlockStatement: "BlockStatement",
            BreakStatement: "BreakStatement",
            CallExpression: "CallExpression",
            ContinueStatement: "ContinueStatement",
            DoWhileStatement: "DoWhileStatement",
            ExpressionStatement: "ExpressionStatement",
            ForStatement: "ForStatement",
            ForInStatement: "ForInStatement",
            FunctionDeclaration: "FunctionDeclaration",
            FunctionExpression: "FunctionExpression",
            Identifier: "Identifier",
            IfStatement: "IfStatement",
            LogicalExpression: "LogicalExpression",
            MemberExpression: "MemberExpression",
            NewExpression: "NewExpression",
            Program: "Program",
            Property: "Property",
            ReturnStatement: "ReturnStatement",
            SwitchStatement: "SwitchStatement",
            SwitchCase: "SwitchCase",
            ThrowStatement: "ThrowStatement",
            UnaryExpression: "UnaryExpression",
            UpdateExpression: "UpdateExpression",
            VariableDeclaration: "VariableDeclaration",
            VariableDeclarator: "VariableDeclarator",
            WhileStatement: "WhileStatement"
        };

        let Syntax = {
            AssignmentExpression: "AssignmentExpression",
            ArrayExpression: "ArrayExpression",
            BinaryExpression: "BinaryExpression",
            BlockStatement: "BlockStatement",
            BreakStatement: "BreakStatement",
            CallExpression: "CallExpression",
            CatchClause: "CatchClause",
            ConditionalExpression: "ConditionalExpression",
            ContinueStatement: "ContinueStatement",
            DoWhileStatement: "DoWhileStatement",
            DebuggerStatement: "DebuggerStatement",
            EmptyStatement: "EmptyStatement",
            ExpressionStatement: "ExpressionStatement",
            ForStatement: "ForStatement",
            ForInStatement: "ForInStatement",
            FunctionDeclaration: "FunctionDeclaration",
            FunctionExpression: "FunctionExpression",
            Identifier: "Identifier",
            IfStatement: "IfStatement",
            Literal: "Literal",
            LabeledStatement: "LabeledStatement",
            LogicalExpression: "LogicalExpression",
            MemberExpression: "MemberExpression",
            NewExpression: "NewExpression",
            ObjectExpression: "ObjectExpression",
            Program: "Program",
            Property: "Property",
            ReturnStatement: "ReturnStatement",
            SequenceExpression: "SequenceExpression",
            SwitchStatement: "SwitchStatement",
            SwitchCase: "SwitchCase",
            ThisExpression: "ThisExpression",
            ThrowStatement: "ThrowStatement",
            TryStatement: "TryStatement",
            UnaryExpression: "UnaryExpression",
            UpdateExpression: "UpdateExpression",
            VariableDeclaration: "VariableDeclaration",
            VariableDeclarator: "VariableDeclarator",
            WhileStatement: "WhileStatement",
            WithStatement: "WithStatement"
        };

      this.customTypes = {
        BlockStatementExit: "BlockStatementExit"
      };

        this.traceTypes = {
            Function: [
                Syntax.FunctionDeclaration,
                Syntax.FunctionExpression
                ],
            Stack: [
                Syntax.FunctionDeclaration,
                Syntax.FunctionExpression,
                Syntax.BlockStatement,
              Syntax.LabeledStatement,
                Syntax.SwitchCase
                ],
            Expression: [
                Syntax.UnaryExpression,
                Syntax.UpdateExpression,
                Syntax.CallExpression,
                Syntax.Property,
                Syntax.VariableDeclarator,
                Syntax.AssignmentExpression,
                Syntax.BinaryExpression,
                Syntax.LogicalExpression,
                Syntax.Identifier,
                Syntax.ReturnStatement,
                Syntax.ForStatement,
                Syntax.ForInStatement,
                Syntax.WhileStatement,
                Syntax.DoWhileStatement,
                Syntax.ExpressionStatement,
                Syntax.SwitchStatement
                ],
            ExpressionStatement: [
                Syntax.ExpressionStatement
                ],
            ObjectOriented: [
                Syntax.NewExpression,
                Syntax.ObjectExpression,
                Syntax.MemberExpression,
                Syntax.ArrayExpression,
                Syntax.Property
                ],
            CallFlow: [
                Syntax.CallExpression
                ],
            ControlFlow: [
                Syntax.IfStatement,
                Syntax.WhileStatement,
                Syntax.DoWhileStatement,
                Syntax.ForStatement,
                Syntax.ForInStatement,
                Syntax.SwitchStatement,
                Syntax.SwitchCase,
                Syntax.TryStatement,
                Syntax.CatchClause
                ],
            Condition: [
                Syntax.IfStatement,
                Syntax.SwitchStatement,
                Syntax.SwitchCase
                ],
            Loop: [
                Syntax.WhileStatement,
                Syntax.DoWhileStatement,
                Syntax.ForStatement,
                Syntax.ForInStatement
                ],
            Exception: [
                Syntax.TryStatement,
              Syntax.CatchClause,
                ],
            FlowExit: [
                Syntax.ThrowStatement,
                Syntax.ReturnStatement,
              Syntax.BreakStatement,
              Syntax.ContinueStatement,
              this.customTypes.BlockStatementExit
                ]
        };

        this.esSyntax = Syntax;

        this.executionEvents = {
            running : {  event :"codeRunning"   , description : "Tracing Code..." },
            finished: {  event :"codeFinished"  , description : "Trace built successfully." },
            failed  : {  event :"codeFailed"    , description : "Code failed (Runtime error)." }
        };

        this.traceEvents = {
            instrumented    : {  event :"traceInstrumented"   , description : "Code Instrumented successfully." },
            changed         : {  event :"traceChanged"   , description : "Trace results obtained succesfully." },
            failed          : {  event :"instrumentationFailed"    , description : "Code rewriting failed (Compilation error)." }
         };

         this.traceViewEvents = {
             expressionHovered    : {  event :"expressionHovered"   , description : "An expression[code] from an editor with trace values was hovered." },
             gutterHovered    : {  event :"gutterHovered"   , description : "A block[code] from an editor that was executed was hovered." }
         };

        this.traceRuntimeTypes = {
          PreCallExpression: "PreCallExpression",
          FunctionData: "FunctionData",
          Parameter: "Parameter",
          Exception: "Exception"
        };

        this.expressionMatcherIgnoreTypeList = ["Program", "FunctionDeclaration", "FunctionExpression", "FunctionData", "BlockStatement"];
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
