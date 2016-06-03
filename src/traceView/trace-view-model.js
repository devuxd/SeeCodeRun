export class TraceViewModel {
    constructor(tooltipElement, showToolTipDelay = 500, hideToolTipDelay = 250){
        this.tooltip = tooltipElement;
        this.showToolTipDelay = showToolTipDelay;
        this.hideToolTipDelay = hideToolTipDelay;
        this.resetData();
    }
    
    resetData(){
        this.resetTraceGutterData();
        this.resetTraceValuesData();
    }
    
    attached(){
        this.attachTooltipUpdateWithDelay();
    }

    attachTooltipUpdateWithDelay(){
        let div =   this.tooltip;
    	let showToolTipDelay = this.showToolTipDelay;
    	let hideToolTipDelay = this.hideToolTipDelay;
    	let tooltipSetTimeout = window.setTimeout;
    	let tooltipClearTimeout = window.clearTimeout;
    	let tooltipTimeout;
    	
    	this.tooltipUpdateWithDelay = function tooltipUpdateWithDelay(position, content){
    	    let toolTipDelay = showToolTipDelay;
    	    if(!content){
    	        toolTipDelay = hideToolTipDelay;
    	    }
    	    
    	    tooltipClearTimeout(tooltipTimeout);
			tooltipTimeout = tooltipSetTimeout(
			function delayedToolTip(){
			    if(!div){
			        return;
			    }
			    
			    if(position){
    			    div.style.left = position.pageX + 'px';
        			div.style.top = position.pageY + 'px';
			    }
			    
    			if(content){
    				div.style.display = "block";
    				div.innerHTML = content;
    			}else{
            	    div.style.display = "none";
            		div.innerHTML = "";
    	        }
			}, toolTipDelay);
	    };

    }
    
    
    isDataModelRepOK(){
	    if(!this.traceValuesData.ranges){
		    return false;
		}
		
		if(!this.traceHelper){
		    return false;
		}
		return true;
	}
	
    getExpressionAtPosition(mousePosition){
        if(this.isDataModelRepOK()){
            return this.traceHelper.getExpressionAtPosition(this.traceHelper.getExecutionTrace(), mousePosition);
        }
        return undefined;
    }
    
    onExpressionHovered(match, pixelPosition){
        if(match){
            this.tooltipUpdateWithDelay(pixelPosition, match.text +",  values"+ JSON.stringify(match.values));
        }else{
            this.tooltipUpdateWithDelay();
        }
    }
    
    updateTraceGutterData(stackTrace){
        let localTraceGutterData = this.extractTraceGutterData(stackTrace);
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
    
    resetTraceValuesData(){
        if(!this.traceValuesData){
            this.traceValuesData = { ranges: [] };
            return;
        }

        this.traceValuesData.ranges = [];
    }
    
    extractTraceGutterData(trace){
	    let result = {  maxCount : 0, rows : []  };
        for (let i = 0; i < trace.length; i ++) {
            let entry = trace[i];
			let row = entry.range.start.row;

			if(!result.rows.hasOwnProperty(row)){
			    let navigator = `
			    <div class = "w3-container">
			        <div class = "w3-row">This block has been called ${entry.count} time(s)</div>
			        <div class = "w3-row">
			            <div class = "w3-container w3-half">Previous</div>
			            <div class = "w3-container w3-half">Next</div>
			        </div>
			     </div>`;

                result.rows[row] = {count: entry.count, text: navigator};
			}
            
            if(result.maxCount< entry.count){
                result.maxCount = entry.count;
            }
        }
        return result;
	}
    
}
