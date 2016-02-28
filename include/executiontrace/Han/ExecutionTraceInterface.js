// Written by: Execution Trace Feature Team 
// (@author: Han Tsung Liu
//  @started: 02-24-16
//  @last-modified: 02-26-16)
// Reviewed by: Dana Pepporuby and Venkat Polumahanti (02-26-16)
// Referenced: David Gonzalez (isRangeInRange(isRange, inRange) function)
// Interface created by execution trace team to provide the trace table
// and useable functions to be called.
// Example of using the class
// Step 1) Create a new instance of the class
// var eti = new ExecutionTraceInterface(source_code);
// Step 2) Check to see if the object is ready to be used
// if(eti.linkEstablished){
//      Step 3) Call any functions to get parts of the trace 
// }
'use strict'
class ExecutionTraceInterface{
    /*
     * Constructor(source)
     * @ param source - source code for the trace
     */
    constructor(source){
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
        // checks to see if the source code is provided by the caller
        if(source===undefined){
            // if source code not given by caller then retrieve source code through ace editor
            this.sourceCode = editor.getSession().getDocument().getValue();
        }
        else{
            // if the source code is provided by the caller of the class, then store the source code
            this.sourceCode = source;
        }
        // if the source code is undefined then set the link to false (not ready to call object functions)
        if(this.sourceCode === undefined){
            this.link = false;
        }
        // if the source code is provided then create new trace with source code and a event listener
        else{
        	window.traceExecution(this.sourceCode,
                function eventListener (event){
                    if(event.status === "Finished"){
                        this.link = true;
                    }
		    });
        }
    }
    /*
     * linkEstablished()
     * @ param - none
     * @ return this.link - if true, the getter functions are ready to be called
     *                    - if false, the getter functions are not ready 
     */
    linkEstablished(){
        return this.link;
    }
    /*
     * Direct Source from David Gonzalez for finding printing execution trace.
     */
    getFullTrace(){
        var i, entry;
        var stackText= "";
        for (i = 0; i < this.valueTable.length; i += 1) {
            entry = this.valueTable[i];
            stackText += i + " -- " + JSON.stringify(entry) + "<br> ";
           
        }
    	return stackText;  
    }
    /*
     * getLineValues(lineNumber)
     * @ param lineNumber - the line number in the editor for retrieving all the associated values
     * @ pre - this.valueTable is defined and lineNumber > 0
     * @ returns - an array of values for the current line
     * @ comment - line number should start with 1 same as the gutter
     */
    getLineValues(lineNumber){
        // retrieves the execution trace
        this.valueTable = window.TRACE.getExecutionTrace();
        // if the execution trace is undefined the return undefined
        if(this.valueTable===undefined || lineNumber<=0){
            return undefined;
        }
        // sorts out the conflict for the ace editor starting with row #0
    	lineNumber--;
    	// new array for storing all the return values
    	this.returnValues = [];
    	// i = iteration, entry = each traced element
		var i,entry;
        // iterates through all the elements of the execution trace
        for(i=0;i<this.valueTable.length;i++){
            // stores current element in entry
        	entry = this.valueTable[i];
        	// retrieves all the keys for the current element in the trace
            // Object.keys(valueTable[entry]);
            // check to see if the current entry element has the range property
            if(entry.hasOwnProperty("range")){
                // determines if the current range element row number matches line number
                if(entry.range.start.row===lineNumber){
                    // calls this.getValues() to get the value based on the range
                    this.entryResult = this.getValues(entry.range);
                    // if the returned result is not false
                    if(this.entryResult!=[])
                        // push the result into the array
                	    this.returnValues.push(this.entryResult);
                }
            }
        }
        // return all the values for the current line
        return this.returnValues;
    }
    /*
     * getLineValues(lineNumber)
     * @ param inputEsprimaRange - start row and column & end row and column
     * @ example: {"start":{"row":18,"column":8},"end":{"row":18,"column":9}}
     * @ pre - inputEsprimaRange is not undefined
     * @ returns - (currently) an "array" all the values of a single statement within the range
     *             else, if no statement within range, return []
     * @ comment - none
     */    
    getValues(inputEsprimaRange){
        if(inputEsprimaRange===undefined){
            return "unavailable"; // return false if inputEsprimaRange is undefined
        }
        // find the element that meets the range requirement
        var i, entry, allValues = [];
        // iterates through all the elements of the execution trace
        for(i=0;i<this.valueTable.length;i++){
            // stores current element in entry
            entry = this.valueTable[i];
            // check to see if the current entry element has the range property
            if(entry.hasOwnProperty("range")){
                // check to see if inputEsprimaRange is within the entry.range
                if(this.isRangeInRange(inputEsprimaRange,entry.range)){
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
    getValuesWithType(inputEsprimaRange){
        if(inputEsprimaRange===undefined){
            return false; // return false if inputEsprimaRange is undefined
        }
        // find the element that meets the range requirement
        var i, entry, allValues = {};
        // iterates through all the elements of the execution trace
        for(i=0;i<this.valueTable.length;i++){
            // stores current element in entry
            entry = this.valueTable[i];
            // check to see if the current entry element has the range property
            if(entry.hasOwnProperty("range")){
                // check to see if inputEsprimaRange is within the entry.range
                if(this.isRangeInRange(inputEsprimaRange,entry.range)){
                        //alert(Object.keys(this.valueTable[i]));
                        // check to see if the current entry element has the values property
                        if(entry.hasOwnProperty("values")&&entry.hasOwnProperty("type")){
                            if(entry.type===this.Syntax.WhileStatement){
                                allValues["Loops"]=(entry.hits-1+"");                            
                            }
                            else if(entry.type===this.Syntax.AssignmentExpression||entry.type===this.Syntax.VariableDeclarator){
                                allValues[this.Syntax.AssignmentExpression]=entry.values[0].value;                           
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
    /*
     * Direct Source from David Gonzalez for finding range.
     */
    isRangeInRange(isRange, inRange){
        return (
                (isRange.start.row >= inRange.start.row && isRange.start.column >= inRange.start.column)
    			 &&
    			(isRange.end.row <= inRange.end.row && isRange.end.column <= inRange.end.column)
    			);
    }
}