export class AutoLogTracer{
    constructor(traceDataContainer){
        this.traceDataContainer = traceDataContainer;
    }
    
    wrapCodeInTryCatch(code){
        return `
            try{
                ${code}
            }catch(e){
                console.log(e);
                throw e;
            }
        `;
        
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
    getAutologCodeBoilerPlate(timeLimit){
        return `
        window.START_TIME = +new Date();
        window.TIME_LIMIT = ${timeLimit};
        
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
        Stack : [Syntax.FunctionDeclaration, Syntax.FunctionExpression, Syntax.BlockStatement, Syntax.SwitchCase],
        Expression: [
            Syntax.UnaryExpression,
            Syntax.UpdateExpression,
            Syntax.CallExpression,
            Syntax.Property,
            Syntax.VariableDeclarator,
            Syntax.AssignmentExpression,
            Syntax.BinaryExpression,
            Syntax.Identifier,
            Syntax.ReturnStatement,
            Syntax.ForStatement,
            Syntax.ForInStatement,
            Syntax.WhileStatement,
            Syntax.DoWhileStatement,
            Syntax.ExpressionStatement,
            Syntax.SwitchStatement
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
            hits: {}, data: {}, stack : [], stackIndex: [{path: [], scope: "program"}],  execution : [], variables: [], values : [], timeline: [], identifiers: [],
            autoLog: function autoLog(info) {
            
                if(this.hits.length < 1){
                    window.START_TIME = +new Date();
                }
                
                var duration = (+new Date()) - window.START_TIME ;
                if(duration > window.TIME_LIMIT){
                     throw "Trace Timeout. Running code exceeded " + window.TIME_LIMIT + " ms time limit.";
                }
                
                var key = info.indexRange[0]+ ':' + info.indexRange[1];
                var extra = info.extra;
                
                if(traceTypes.Stack.indexOf(info.type) > -1){
                
                    if(extra){
                        var extraValues = extra.split(":");
                        if(extraValues.length > 1){
                            var blockId = extraValues[0];
                            var isEnteringBlock = extraValues[1] === "Enter" ? true : false;
                            var stackKey = key + ":" + blockId;
                            key = key + ":" + extra;
                            
                            if(isEnteringBlock){
                                this.stackIndex.push({path: [this.stackIndex], scope: stackKey});
                                this.stack.push(key);
                            }else{
                              //  this.stackIndex = this.stackIndex.pop();
                            }
                        }
                        
                    }else{
                        this.stack.push(key);
                    }
    				
                }

                if(traceTypes.Expression.indexOf(info.type) > -1){
                    if(info.id){
                        this.values.push({id: info.id , value: JSON.stringify(info.value), range: info.range});
                    }else{
                        this.values.push({id: info.text , value: JSON.stringify(info.value), range: info.range});
                    }
                }

                this.timeline.push({ id: info.id , value: JSON.stringify(info.value), range: info.range, type: info.type, text: info.text});


                var stackTop =	this.stackIndex[ this.stackIndex.length - 1].scope;
                
				if (this.hits.hasOwnProperty(key)) {
                    this.hits[key] = this.hits[key] + 1;
                    this.data[key].hits[stackTop] = this.data[key].hits[stackTop] + 1;
                    this.data[key].values.push({ stackIndex : stackTop + ":" + this.data[key].hits[stackTop]  , value :JSON.stringify(info.value)});
                } else {
                    
                    if(info.type === Syntax.VariableDeclarator){
                       this.variables.push({id: info.id , range: info.range});
                    }
                    
                    this.identifiers.push({id: info.id , range: info.range});
                    
                    
                    this.hits[key] = 1;
                    this.execution.push(key);
                    this.data[key] = {
                        type : info.type,
                        id : info.id,
                        text : info.text,
                        values: [{stackIndex: stackTop + ":1", value :JSON.stringify(info.value)}],
                        range: info.range,
                        hits : [],
                        extra : info.extra
                    };
                    this.data[key].hits[stackTop] = 1;
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