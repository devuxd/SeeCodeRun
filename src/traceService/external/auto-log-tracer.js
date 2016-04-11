export class AutoLogTracer{
    constructor(traceDataContainer){
        this.traceDataContainer = traceDataContainer;
    }
    
    getTraceDataContainerCodeBoilerPlate(){
        return `
        var  out = document.getElementById("${this.traceDataContainer}");
        if(!out){
            out = document.createElement("div");
            out.id = "${this.traceDataContainer}";
        }
        out.style.display = "none";
        document.body.appendChild(out);
        `;
    }
    getTraceDataCodeBoilerPlate(){
        return `
        out.innerHTML= JSON.stringify(window.TRACE.getTraceData());
        `;
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
        window.ISCANCELLED = false;
        window.TRACE = {
            hits: {}, data: {}, stack : [], execution : [], variables: [], values : [], timeline: [], identifiers: [], 
            autoLog: function autoLog(info) {
                var key = info.text + ':' + info.indexRange[0]+':' + info.indexRange[1];
                
                if(traceTypes.LocalStack.indexOf(info.type)>-1){
    				this.stack.push(key);
                }

                if(info.type === Syntax.VariableDeclarator || info.type === Syntax.AssignmentExpression||info.type === Syntax.UpdateExpression){
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
            getTraceData: function getTraceData() {
                return {
                    hits        : this.hits,
                    data        : this.data,
                    stack       : this.stack,
                    execution   : this.execution,
                    variables   : this.variables,
                    values      : this.values,
                    timeline    : this.timeline,
                    identifiers : this.identifiers
                };
            }
        };
        `;
    }
}