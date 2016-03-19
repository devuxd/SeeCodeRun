
export class AceUtils{
    constructor(editor){
        this.editor;
    }
    // example using ACE Annotations
    showTraceAnnotations(aceEditor, traceAnnotations) {
            var annotations = aceEditor.getSession().getAnnotations();	
            annotations= annotations.concat(traceAnnotations);
    		aceEditor.getSession().setAnnotations(annotations);
    }
    
        isPositioninRange(position, inRange){
        
        var matchesInOneLine = (
                position.row == inRange.start.row 
                && inRange.start.row  == inRange.end.row
                && position.column >= inRange.start.column
                && position.column <= inRange.end.column
            );
            
        if(matchesInOneLine){
            return true;
        }
            
        var matchesStart = (
                position.row == inRange.start.row 
                && inRange.start.row  < inRange.end.row
                && position.column >= inRange.start.column
            );
           
        if(matchesStart){
            return true;
        }
        
        var matchesEnd = (
                position.row == inRange.end.row
                && inRange.start.row  < inRange.end.row
                && position.column <= inRange.end.column
            );

        return matchesEnd;

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
    
    compareRanges(){
        
    }

    hoverRange(){
        
    }
    getSmallestRange(){
         
    }
    getRanges(){
         
    }
}