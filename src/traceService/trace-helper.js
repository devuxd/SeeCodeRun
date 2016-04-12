import {TraceModel} from './trace-model';
import {TraceQueryManager} from './trace-query-manager';
export class TraceHelper {
    constructor(trace){
        this.traceModel = new TraceModel();
        this.traceQueryManager = new TraceQueryManager(this.traceModel);
        this.Syntax = this.traceModel.traceSyntax;
        this.setTrace(trace);
    }
    
    isValid(){
        
    }
    
    setTrace(trace){
        this.trace = this.traceModel.makeTrace(trace);
    }
    
    /*
     * getTraceDataInRange(traceData, aceRange)
     * @ param traceData - an array based on the available properties of a Trace, that is, arrays with each entry having a range.
     * @ param aceRange - a range in Ace's format, that is, with start row and column and end row and column.
     * @ example {"start":{"row":18,"column":8},"end":{"row":18,"column":9}}.
     * @ post   if aceRange is not defined or there are no values in the trace data, returns an empty array
     *             otherwise, returns an array with all the entries within the aceRange.
     */    
    getTraceDataInRange(traceData, aceRange){
        if(!aceRange || !traceData){
            return [];
        }
        let allValues = [];
        for(let i = 0; i < traceData.length; i++){
            let entry = traceData[i];
            if(entry.hasOwnProperty("range")){
                if(this.isRangeInRange(aceRange, entry.range)){
                        allValues.push(entry);
                }
            }
        }
        return allValues;
    }
    
    /*
     * getTraceDataInLine(traceData, lineNumber)
     * @ param traceData - an array based on the available properties of a Trace, that is, arrays with each entry having a range.
     * @ param lineNumber - the line number in the editor for retrieving all  associated data.
     * @ post  if there are no values in the trace data or line number is less than 1, returns an empty array;
     *              otherwise, returns an array of entries that start or end at lineNumber.
     * @ comment - line numbers start at 1, which matches what is normally displayed in the gutter.
     */
    getTraceDataInLine(traceData, lineNumber){
        if(!traceData || lineNumber < 1){
            return [];
        }
    	let returnValues = [];
        for(let i = 0; i < traceData.length; i++){
        	let entry = traceData[i];
            if(entry.hasOwnProperty("range")){
                if(this.isRangeInLine(entry.range.start.row, lineNumber)){
                   returnValues.push(entry);
                }
            }
        }
        return returnValues;
    }

    /*
     * getValuesInLine(lineNumber)
     * @ param lineNumber - the line number in the editor for retrieving all  associated values.
     * @ post  if there are no values in the trace or line number is less than 1, returns an empty array;
     *              otherwise, returns an array of values of variables that start or end at lineNumber.
     * @ comment - line numbers start at 1, which matches what is normally displayed in the gutter.
     */
    getValuesInLine(lineNumber){
        let values = this.getValues();
        return this.getTraceDataInLine(values, lineNumber);
    }
    
    /*
     * getValuesInRange(aceRange)
     * @ param aceRange - a range in Ace's format, that is, with start row and column and end row and column.
     * @ example {"start":{"row":18,"column":8},"end":{"row":18,"column":9}}.
     * @ post   if aceRange is not defined or there are no values in the trace, returns an empty array
     *             otherwise, returns an array with all the values within  the aceRange.
     */    
    getValuesInRange(aceRange){
        let values = this.getValues();
        return this.getTraceDataInRange(values, aceRange);
    }
    
    isRangeInRange(isRange, inRange){
        return (
                (isRange.start.row >= inRange.start.row && isRange.start.column >= inRange.start.column)
    			 &&
    			(isRange.end.row <= inRange.end.row && isRange.end.column <= inRange.end.column)
    			);
    }
    
    isRangeInLine(isRange, inLine){
        return(
            (isRange.start.row === (inLine - 1))
            ||
            (isRange.end.row === (inLine - 1))
        );
    }
    
    getStackBlockCounts() {
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
    
    getExpressions() {
         return {identifiers : this.trace.identifiers, timeline: this.trace.timeline};
    }
    
    getVariables(){
        return this.trace.variables;
    }
    getValues(){
        return this.trace.values;
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
    
    getExecutionTrace() {
        let executionTrace = [];
        let execution = this.trace.execution, data = this.trace.data, traceTypes = this.traceModel.traceTypes;
        for (let i in execution) {
            let entry = execution[i];
            if (data.hasOwnProperty(entry)) {
                let dataEntry = data[entry];
                if(traceTypes.Expression.indexOf(dataEntry.type) > -1  ){
                    executionTrace.push(dataEntry);
                }
             }
        }
        return executionTrace;
    }
}