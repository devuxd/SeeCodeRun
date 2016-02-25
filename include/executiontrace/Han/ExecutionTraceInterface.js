'use strict'
class ExecutionTraceInterface{
    constructor(source){
        if(source===undefined){
            this.sourceCode = editor.getSession().getDocument().getValue();
        }
        else{
            try{
                this.sourceCode = source;
            }
            catch(e){
            }            
        }
        if(this.sourceCode === undefined){
            this.link = false;
        }
        else{
        	window.traceExecution(this.sourceCode,
                function eventListener (event){
                    if(event.status === "Finished"){
                        this.link = true;
                    }
		    });
        }
    }
    linkEstablished(){
        return this.link;
    }
    // precondition: line number should start with 1
    getLineValues(lineNumber){
        this.valueTable = window.TRACE.getExecutionTrace();
        if(this.valueTable===undefined){
            return null;
        }
    	lineNumber--; // aces starts with row = 0;
    	this.returnValues = [];
		var i,entry,ele;
        //Object.keys(valueTable[0]);
        for(i=0;i<this.valueTable.length;i++){
        	entry = this.valueTable[i]
            //Object.keys(valueTable[entry]);
            if(entry.hasOwnProperty("range")){
                if(entry.range.start.row===lineNumber){
                	this.returnValues.push(this.getValues(entry.range));
                }
            }
        }
        //alert(this.returnValues.toString());
        return this.returnValues;
    }
    
    getValues(inputEsprimaRange){
        if(inputEsprimaRange===undefined){
            return -1;
        }
        // find the element that meets the range requirement
        var i, entry;
        for(i=0;i<this.valueTable.length;i++){
            entry = this.valueTable[i];
            if(entry.hasOwnProperty("range")){
                if(this.isRangeInRange(entry.range,inputEsprimaRange)){
                    //if(this.isRangeInRangeStrict(entry.range,inputEsprimaRange)){
                        //alert(Object.keys(this.valueTable[i]));
                        if(entry.hasOwnProperty("values")){
                            //alert("Value:"+entry.values[0].value);
                            //alert(entry.values); // return stackIndex + values
                            return entry.values[0].value; // return only values
                        }
                    //}
                }
            }
        }
        // $("#status").append(
        //     "start row:"+inputEsprimaRange.start.row+
        //     ", start col:"+inputEsprimaRange.start.column+
        //     ", end row:"+inputEsprimaRange.start.row+
        //     ", end col:"+inputEsprimaRange.start.column+            
        //     "<br/>");
    }
    isRangeInRange(isRange, inRange){
        return (
                (isRange.start.row >= inRange.start.row && isRange.start.column >= inRange.start.column)
    			 &&
    			(isRange.end.row <= inRange.end.row && isRange.end.column <= inRange.end.column)
    			);
    }
    isRangeInRangeStrict(isRange, inRange){
        return (
                (isRange.start.row >= inRange.start.row && isRange.start.column > inRange.start.column)
    			 &&
    			(isRange.end.row <= inRange.end.row && isRange.end.column < inRange.end.column)
    			);
    }
}