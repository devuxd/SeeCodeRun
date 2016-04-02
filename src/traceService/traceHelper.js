
export class TraceHelper {
    constructor(executionTrace){
        this.executionTrace = executionTrace;
        this.Syntax = {
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
    }
    /*
     * getLineValues(lineNumber,valueTable)
     * @ param lineNumber - the line number in the editor for retrieving all the associated values
     * @ param valueTable - the whole execution trace of the code
     * @ pre - valueTable is defined and lineNumber > 0
     * @ returns - an array of values for the current line
     * @ comment - line number should start with 1, which is same as the gutter
     */
    getLineValues(lineNumber,valueTable){
        // if the execution trace is undefined the return undefined
        if(valueTable===undefined || lineNumber<=0){
            return false;
        }
        // sorts out the conflict for the ace editor starting with row #0
    	lineNumber--;
    	// new array for storing all the return values
    	var returnValues = [];
    	// i = iteration, entry = each traced element
		var i,entry;
        // iterates through all the elements of the execution trace
        for(i=0;i<valueTable.length;i++){
            // stores current element in entry
        	entry = valueTable[i];
        	// retrieves all the keys for the current element in the trace
            // Object.keys(valueTable[entry]);
            // check to see if the current entry element has the range property
            if(entry.hasOwnProperty("range")){
                // determines if the current range element row number matches line number
                if(entry.range.start.row===lineNumber){
                    // calls this.getValues() to get the value based on the range
                    var entryResult = this.getValues(entry.range);
                    // if the returned result is not false
                    if(entryResult!=[])
                        // push the result into the array
                	    returnValues.push(entryResult);
                }
            }
        }
        // return all the values for the current line
        return returnValues;
    }
    /*
     * getLineValues(lineNumber)
     * @ param inputEsprimaRange - start row and column & end row and column
     * @ param valueTable - the whole execution trace of the code
     * @ example: {"start":{"row":18,"column":8},"end":{"row":18,"column":9}}
     * @ pre - inputEsprimaRange is not undefined
     * @ returns - (currently) an "array" all the values of a single statement within the range
     *             else, if no statement within range, return []
     * @ comment - none
     */    
    getValues(esprimaRange,valueTable){
        if(esprimaRange===undefined){
            return []; // return false if inputEsprimaRange is undefined
        }
        // find the element that meets the range requirement
        var i, entry, allValues = [];
        // iterates through all the elements of the execution trace
        for(i=0;i<valueTable.length;i++){
            // stores current element in entry
            entry = valueTable[i];
            // check to see if the current entry element has the range property
            if(entry.hasOwnProperty("range")){
                // check to see if inputEsprimaRange is within the entry.range
                if(this.isRangeInRange(esprimaRange,entry.range)){
                        //alert(Object.keys(this.valueTable[i]));
                        // check to see if the current entry element has the values property
                        if(entry.hasOwnProperty("values")&&entry.hasOwnProperty("type")){
                            if(entry.type==="WhileStatement"){
                                allValues.push(entry.hits-1);                            
                            }
                            else{
                                //alert(entry.values); // if return stackIndex + values
                                // returns the value within thin the range
                                var i;
                                for(i=0;i<entry.values.length;i++){
                                    //alert(entry.values[i].value);
                                    allValues.push(entry.values[i].value);
                                }
                            }
                            return allValues;
                        }
                        else { 
                            return []; //return false if not found
                        }
                }
            }
        }
        return []; // return false if not found
    }
    /*
     * getLineValuesWithType(lineNumber)
     * @ param inputEsprimaRange - start row and column & end row and column
     * @ example: {"start":{"row":18,"column":8},"end":{"row":18,"column":9}}
     * @ pre - inputEsprimaRange is not undefined
     * @ returns - (currently) a "map" of all the values for a statement (+type) within the range
     *             else, if no statement within range, return []
     * @ comment - none
     */    
    getValuesWithType(esprimaRange,valueTable){
        if(esprimaRange===undefined){
            return []; // return false if inputEsprimaRange is undefined
        }
        // find the element that meets the range requirement
        var i, entry, allValues = {};
        // iterates through all the elements of the execution trace
        for(i=0;i<valueTable.length;i++){
            // stores current element in entry
            entry = valueTable[i];
            // check to see if the current entry element has the range property
            if(entry.hasOwnProperty("range")){
                // check to see if inputEsprimaRange is within the entry.range
                if(this.isRangeInRange(esprimaRange,entry.range)){
                        //alert(Object.keys(this.valueTable[i]));
                        // check to see if the current entry element has the values property
                        if(entry.hasOwnProperty("values")&&entry.hasOwnProperty("type")){
                            if(entry.type===this.Syntax.WhileStatement
                            || entry.type===this.Syntax.ForStatement || entry.type===this.Syntax.ForInStatement){
                                allValues["Loops"]=(entry.hits-2);                           
                            }
                            else if (entry.type===this.Syntax.DoWhileStatement ){
                                allValues["Loops"]=(entry.hits-1);
                            }
                            else if(entry.type===this.Syntax.AssignmentExpression||entry.type===this.Syntax.VariableDeclarator){
                                allValues[this.Syntax.AssignmentExpression]=entry.values[0].value;                           
                            }
                            else if(entry.type===this.Syntax.ReturnStatement){
                                allValues[this.Syntax.ReturnStatement]=entry.values[0].value;
                            }
                            else if(entry.type===this.Syntax.CallExpression){
                                allValues["FunctionInvocation"]=entry.values[0].value;
                            }
                            else{
                                var i, tempArr = [];
                                for(i=0;i<entry.values.length;i++){
                                    tempArr[i]=entry.values[i].value;
                                }
                                allValues["Others"]=tempArr;
                            }
                            return allValues;
                        }
                        else { 
                            return []; //return false if not found
                        }
                }
            }
        }
        return []; // return false if not found
    }
    isRangeInRange(isRange, inRange){
        return (
                (isRange.start.row >= inRange.start.row && isRange.start.column >= inRange.start.column)
    			 &&
    			(isRange.end.row <= inRange.end.row && isRange.end.column <= inRange.end.column)
    			);
    }   
    // example of how to use the trace resulting data structure
    visualizeExecutionTrace(executionTrace){
        var i, entry;
        var stackText= "";

        for (i = 0; i < executionTrace.length; i += 1) {
            entry = executionTrace[i];
            stackText += i + " -- " + JSON.stringify(entry) + "<br> ";
           
        }
       
    	
    	return stackText;  
    
    }
       /**
        * @desc example of how to use the trace resulting data structure
        * @param stackTrace results from the trace service
        * */
    visualize(stackTrace){
        var i, entry, name, index;
        var stackText= "";
    	var repeat = 0;
    	var previousCall = "";
    	var previousIndex = -1;
        for (i = 0; i < stackTrace.length; i += 1) {
            entry = stackTrace[i];
            if(entry){
                name = entry.text;
        		index = entry.index;
        		 if(previousCall !== name){				 
        			 if(repeat > 0){
        				 stackText += previousIndex + " -- " + previousCall + "( + "+ repeat +" times) <br>";
        				 repeat = 0;
        			 }else{
        				 if(previousIndex > -1){
        					 stackText += previousIndex + " -- " + previousCall + "<br> ";
        				 }
        				 
        			 }
        			 previousCall = name;
        			 previousIndex = index;
        		 }else{
        			 repeat = repeat + 1; 
        		 }
            }
    		
        }
    	if(repeat > 0){
    		stackText +=  previousIndex + " -- " + previousCall + "( + "+ repeat +" times )";
    		repeat = 0;
    	}else{
    		if(previousIndex > -1){
    			stackText += previousIndex + " -- " + previousCall ;
    		}					 
    	}
    	
    	return stackText;  
    
    }
    
}