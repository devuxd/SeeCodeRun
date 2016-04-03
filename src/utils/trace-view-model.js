export class TraceViewModel {
    constructor(aceUtils, aceEditor, tooltipElement, gutterDecorationCSSClassName){
        this.editor= aceEditor;
        this.tooltip = tooltipElement;
        this.gutterDecorationClassName = gutterDecorationCSSClassName;
        this.aceUtils = aceUtils;
        this.traceGutterData = {  maxCount : 0, rows : []  }; // contains custom data to be shown in the gutter cell text
        this.bind();
    }


    bind(){
        
        this.resetTraceGutterData();
        let editor = this.editor;
        let tooltip = this.tooltip;
        let traceGutterData =  this.traceGutterData;
        let gutterDecorationClassName = this.gutterDecorationClassName;
    	let aceUtils = this.aceUtils;
    	
    	aceUtils.setTraceGutterRenderer(editor, traceGutterData);
    	aceUtils.subscribeToGutterEvents(editor, tooltip, gutterDecorationClassName, traceGutterData);

    }
    
    onTraceChanged(trace = []){
            let previousRows = this.traceGutterData.rows;
            this.updateTraceGutterData(trace);
            let editor = this.editor;
            let traceGutterData = this.traceGutterData;
            let gutterDecorationClassName = this.gutterDecorationClassName;
            this.aceUtils.updateGutterDecorations(editor, previousRows, traceGutterData.rows, gutterDecorationClassName);
    }
    
    updateTraceGutterData(trace){
        let localTraceGutterData = this.extractTraceGutterData(trace);
        this.traceGutterData.maxCount = localTraceGutterData.maxCount;
        this.traceGutterData.rows = localTraceGutterData.rows;
    }
    
    resetTraceGutterData(){
        if(!this.traceGutterData){
            this.traceGutterData = {  maxCount : 0, rows : []  };
            return;
        }
        this.traceGutterData.maxCount = 0;
        this.traceGutterData.rows = [];
    }
    
    extractTraceGutterData(trace){
	    let result = {  maxCount : 0, rows : []  };

        for (let i = 0; i < trace.length; i ++) {
            let entry = trace[i];
			let row = entry.range.start.row;
			
			if(!result.rows.hasOwnProperty(row)){
             result.rows[row] = {count: entry.count, text: "This block has been called " + entry.count + " times"};
			}
            
            if(result.maxCount< entry.count){
                result.maxCount = entry.count;
            }
        }
        return result;
	}
    
}
