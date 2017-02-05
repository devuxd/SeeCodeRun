// David: I did not see this post. Is tnot being used in my solution (Similar though)
//Copied from execution trace channel, source: Dr. Thomas LaToza

function Debugger(){}

Debugger.init = function(data){
    Debugger.functions = {};
    Debugger.stubs = {};
    Debugger.setFunctions( data.functions ? data.functions : {} );
    Debugger.setStubs( data.stubs ? data.stubs : {} );
    Debugger.resetLogs();
};


Debugger.resetLogs = function(){
    Debugger.logs = {
        values: {},
        calls: {}
    };
};

Debugger.run = function(testCode, callsLogs) {
    Debugger.resetLogs();

    if( callsLogs !== undefined )
        Debugger.logs.calls = callsLogs;

    var functCode = '';
    for( var functionName in Debugger.functions ){
        functCode += Debugger.functions[functionName].compiled + '\n';
        // if( functionName == 'loggingFunction')
        //     console.log(Debugger.functions[functionName].compiled );
    }

    var evalCode = functCode + '\n' 
                 + testCode;

    // console.log( JSON.stringify(Debugger.logs) );
    console.log(evalCode);
    
    var _testResult = {};
    try {
        eval( evalCode );
        _testResult.passed = true;
    } 
    catch( e ){
        console.log(e);
        if( e instanceof chai.AssertionError ){
            _testResult = e;
        }
        _testResult.passed = false;
    }
    return _testResult;
};


Debugger.setFunctions = function(functions){
    Debugger.functions = {};
    Debugger.functionsName = [];
    // parse all the functions 
    for( var functionName in functions ){
        Debugger.setFunction(functionName, functions[functionName]);
    }
}

Debugger.setFunction = function(functName, functObj, trace) {
    Debugger.functions[functName] = functObj;
    if( Debugger.functionsName.indexOf(functName) == -1 )
        Debugger.functionsName.push(functName);

    // create the abstract syntax tree
    console.log(JSON.stringify(functObj));
    var bodyNode = esprima.parse( functObj.code, {loc:true} ).body[0];

    // if it's not a function declaration throw exception
    if( bodyNode.type !== 'FunctionDeclaration' ) 
        throw new Error('This is not a function declaration!');

    // if the function has to be traced
    // keep the body in the array of the 
    if( trace !== undefined && trace) {
        bodyNode = Debugger.instrumentFunction( bodyNode, functName );
        functObj.compiled = escodegen.generate(bodyNode);
    }

    // if not, replace the function body with a mocked version
    // that returns the stubbed value if found or executes the 
    // function in the real implementation 
    else {
        functObj.compiled = Debugger.mockFunction( bodyNode );
    }
}

Debugger.setStubs = function(stubs){
     // merge the function stubs in the main stubs container
    Debugger.stubs = stubs;
}

Debugger.instrumentFunction = function(fNode){
    // initialize scope pushing the parameters
    var scope  = new Scope(fNode.id.name);
    fNode.params.map(function(param){
        scope.variables.push( param.name );
    });

    estraverse.replace( fNode.body, {
        enter: function(node,parent){

            console.log(node.type,escodegen.generate(node));
            if (node.type === 'UpdateExpression') {
                node = Debugger.instrumentTreeNode(node,scope);
                this.skip();
            }
            else if( parent.type === 'AssignmentExpression' && node === parent.left ){
                this.skip();
            }
            else if( ['WhileStatement','ForStatement'].indexOf( node.type ) > -1 ){

                scope.loop ++ ;
            } 
            else if( ['WhileStatement','ForStatement'].indexOf( parent.type ) > -1 && node.type !== 'BlockStatement'){
                this.skip();
            }
            else if( node.type === 'FunctionExpression' ) {
                this.skip();
            } 

            return node;
        },
        leave: function(node,parent){
            
            // in case of a variable declaration we should add 
            // the variable name to the current scope
            if( node.type === 'VariableDeclarator' ){
                scope.declare( node.id.name );
            } 
            
            if( node.type === 'BinaryExpression'){
                node = Debugger.instrumentTreeNode(node,scope);
            }
            else if( node.type === 'Identifier' && scope.variables.indexOf(node.name) > -1 ){
                if( parent.type !== 'AssignmentExpression' && parent.type !== 'VariableDeclarator' ) {
                    node = Debugger.instrumentTreeNode(node,scope);
                }
                else if ( node === parent.right ) {
                    node = Debugger.instrumentTreeNode(node,scope); 
                }
            } 
            else if( node.type === 'ObjectExpression' ){
                node = Debugger.instrumentTreeNode(node,scope);
            }
            else if( node.type === 'Identifier' && parent.type === 'AssignmentExpression' && scope.isDeclared(node.name) > -1 ){
                node = Debugger.instrumentTreeNode(node,scope);
            }
            else if( ['WhileStatement','ForStatement'].indexOf( node.type ) > -1 ){
                scope.loop -- ;
            }
            else if( node.type === 'CallExpression' && !( node.callee.type === 'MemberExpression' && node.callee.object.name === 'Debugger' ) ) {
                node = Debugger.instrumentTreeNode(node,scope);
            }
            

            return node;
        }
    });
    return fNode;
};

Debugger.mockFunction = function(fNode){
    var name = fNode.id.name;
    
    var cutFrom = Debugger.mockBody.toString().search('{');
    var mockBody = Debugger.mockBody.toString().substr(cutFrom);

    var mockBody = 'function '+name+'('
                 + fNode.params.map(function(param){ return param.name; }).join(',')
                 + ')'
                 + mockBody
                   .replace(/'%functionName%'/g, name )
                   .replace(/'%functionNameStr%'/g, "'" + name + "'")
                   .replace(/'%functionMockName%'/g, name + 'Implementation');

    var callBody = 'function '+name+'Implementation('
                 + fNode.params.map(function(param){ return param.name; })
                   .join(',')
                 + ')'
                 + escodegen.generate(fNode.body);

    return mockBody + callBody ;
};
   


Debugger.instrumentTreeNode = function(node,scope){
    var logObject = {
        type : node.type,
        start: { row: node.loc.start.line-1, col: node.loc.start.column },
        end: { row: node.loc.end.line-1, col: node.loc.end.column },
    };

    var isCallee = '';
    if( node.type === 'CallExpression' && node.callee.type !== 'MemberExpression' && Debugger.functionsName.indexOf(node.callee.name) > -1 ){
        logObject.callee = node.callee.name; 
    }

    var innerCode = escodegen.generate(node,{indent:false});
    var outerCode = 'Debugger.logValue('+innerCode+','+JSON.stringify(logObject)+',\''+scope.context+'\');';
    var newNode = esprima.parse(outerCode);
    return newNode.body[0].expression;
};
 
Debugger.logValue = function(value,logObject,context,isCallee){
    if( logObject.callee ){
        logObject.inputsKey = value.inputsKey;
        value  = value.output;
    }

    logObject.value = value;

    // add the log object to the logs of the current context
    if( !Debugger.logs.values[context] )
        Debugger.logs.values[context] = [];
    
    Debugger.logs.values[context].push( logObject );

    return value;
};

Debugger.getStub = function(functName,inputsKey) {
    var stubs = Debugger.stubs;

    if( !stubs.hasOwnProperty(functName) )
        stubs[functName] = {};

    // console.log('searching stub for',functName,inputsKey,JSON.stringify(stubs));
    if( stubs[functName].hasOwnProperty(inputsKey) ){
       return stubs[functName][inputsKey];
    }

    return -1;
};

Debugger.getAllStubs = function(){
    return Debugger.stubs;
};

Debugger.logCall = function(functionName,inputsKey,output){

    
    var logObject = {
        output : output
    };

    // log the call as a stub
    if( !Debugger.stubs[functionName] )
        Debugger.stubs[functionName] = {};

    if( !Debugger.stubs[functionName][inputsKey] )
        Debugger.stubs[functionName][inputsKey] = {};
    
    Debugger.stubs[functionName][inputsKey].output = output;

    // log the call in the calls list
    // if( !Debugger.logs.calls[name] )
    //     Debugger.logs.calls[name] = {};

    // if( !Debugger.logs.calls[name][inputsKey] )
    //     Debugger.logs.calls[name][inputsKey] = {};
    
    // Debugger.logs.calls[name][inputsKey][Date.now()] = logObject;

};


Debugger.mockBody = function(){
    var inputsKey = generateInputsKey(arguments)
    var output    = null;
    var stub      = Debugger.getStub( '%functionNameStr%', inputsKey );
    if( stub != -1 ){
        output = stub.output;
    } else {
        try {
            output = '%functionMockName%'.apply( null, arguments );
        } catch(e) {
            console.log('Exception in '+'%functionNameStr%'+': ',e);
        }
    }
    Debugger.logCall( '%functionNameStr%', inputsKey, output ) ;
    return { inputsKey: inputsKey, output: output };
}


function generateInputsKey(args){
    var keys = [];
    for( var key in args){
        keys.push( JSON.stringify(args[key]) );
    }
    return keys.join(',')
}

function Scope(context,parent){
    this.context   = context;
    this.variables = [];
    this.parent    = parent || null;
    this.loop      = 0;
}

Scope.prototype = {
    isDeclared : function(varName){
        var scope = this;
        while( scope !== null ){
            if( scope.variables.indexOf(varName) > -1 )
                return true;
            scope = scope.parent;
        }
        return false;
    },
    declare: function(varName){
        this.variables.push(varName);
    }
};