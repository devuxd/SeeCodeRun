import {TraceModel} from './trace-model';
import {TraceQueryManager} from './trace-query-manager';
export class TraceHelper {
    constructor(trace){
        this.traceModel = new TraceModel();
        this.traceQueryManager = new TraceQueryManager(this.traceModel);
        this.Syntax = this.traceModel.traceSyntax;
        this.setTrace(trace);
    }
    
    setTrace(trace){
        this.trace = this.traceModel.makeTrace(trace);
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
        if(valueTable===undefined || lineNumber<=0){
            return false;
        }
    	lineNumber--;
    	var returnValues = [];
		var i,entry;
        for(i=0;i<valueTable.length;i++){
        	entry = valueTable[i];
            if(entry.hasOwnProperty("range")){
                if(entry.range.start.row===lineNumber){
                    var entryResult = this.getValues(entry.range);
                    if(entryResult!=[])
                	    returnValues.push(entryResult);
                }
            }
        }
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
            return [];
        }
        var i, entry, allValues = [];
        for(i=0;i<valueTable.length;i++){
            entry = valueTable[i];
            if(entry.hasOwnProperty("range")){
                if(this.isRangeInRange(esprimaRange,entry.range)){
                        if(entry.hasOwnProperty("values")&&entry.hasOwnProperty("type")){
                            if(entry.type==="WhileStatement"){
                                allValues.push(entry.hits-1);                            
                            }
                            else{
                                var i;
                                for(i=0;i<entry.values.length;i++){
                                    allValues.push(entry.values[i].value);
                                }
                            }
                            return allValues;
                        }
                        else { 
                            return [];
                        }
                }
            }
        }
        return [];
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
            return []; 
        }
        var i, entry, allValues = {};
        for(i=0;i<valueTable.length;i++){
            entry = valueTable[i];
            if(entry.hasOwnProperty("range")){
                if(this.isRangeInRange(esprimaRange,entry.range)){
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
                            return []; 
                        }
                }
            }
        }
        return []; 
    }
    
    isRangeInRange(isRange, inRange){
        return (
                (isRange.start.row >= inRange.start.row && isRange.start.column >= inRange.start.column)
    			 &&
    			(isRange.end.row <= inRange.end.row && isRange.end.column <= inRange.end.column)
    			);
    }   
    
    visualizeExecutionTrace(executionTrace){
        var i, entry;
        var stackText= "";

        for (i = 0; i < executionTrace.length; i += 1) {
            entry = executionTrace[i];
            stackText += i + " -- " + JSON.stringify(entry) + "<br> ";
           
        }
       
    	
    	return stackText;  
    
    }
    
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

    getStackTrace() {
        let stack = this.trace.stack, data = this.trace.data, hits = this.trace.hits;
        let entry,
            stackData = [];
        for (let i in stack) {
            if (stack.hasOwnProperty(i)) {
                entry = stack[i];
                stackData.push({ index: i, text: entry.split(':')[0], range: data[entry].range,  count: hits[entry]});
            }
        }
        return stackData;
    }
            
    getExecutionTraceAll() {
        let result = [];
        let execution = this.trace.execution, data = this.trace.data;
        
        for (let i in execution) {
            let entry = execution[i];
            if (data.hasOwnProperty(entry)) {
                result.push(data[entry]);
            }
        }
        return result;
    }
    
    getExpressions() {
         return {identifiers : this.trace.identifiers, timeline: this.trace.timeline};
    }
    
    getVariables(){
        return this.trace.variables;
    }
    getValues(){
        return this.trace.values;
    }
    
    getExecutionTrace() {
        let executionTrace = [];
        let execution = this.trace.execution, data = this.trace.data, traceTypes = this.traceModel.traceTypes;
        for (let i in execution) {
            let entry = execution[i];
            if (data.hasOwnProperty(entry)) {
                let dataEntry =data[entry];
                if(traceTypes.Expression.indexOf(dataEntry.type) > -1  ){
                    executionTrace.push(dataEntry);
                }
             }
        }
        return executionTrace;
    }
    
}