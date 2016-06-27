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

        this.update$Tooltip = function update$Tooltip(position, content){
            if(!div){
			        return;
			}

		    if(position){
		        div.css({
		            position: "absolute",
		            marginLeft: 0,
		            marginTop: 0,
		            top: `${position.pageY}px`,
		            left: `${position.pageX}px`
		        });
		    }

			if(content){
			    div.popover({
        		    title: "Y: " +position.pageY,
        		    html: true,
        		  //  selector: '[rel="popover"]',
                    content: function $editorTooltipPopoverContent() {
                        // return $('#branchNavigator').html();
                        return content;
                    },
        		    padding: 4
        		});
			 //   div.attr("data-content", content);
			 //   div.popover("show");
			}else{
			 //   div.popover("hide");
	        }
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
            this.update$Tooltip(pixelPosition, match.text +",  values"+ JSON.stringify(match.values));
        }else{
            this.update$Tooltip();
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


                result.rows[row] = {count: entry.count, entryText: `Block executed ${entry.count} time(s)`, text: entry};
			}

            if(result.maxCount< entry.count){
                result.maxCount = entry.count;
            }
        }
        return result;
	}

	extractStackTraceGutterData(trace){
	    let result = {  maxCount : 0, rows : []  };
        for (let i = 0; i < trace.length; i ++) {
            let entry = trace[i];
			let row = entry.range.start.row;

			if(!result.rows.hasOwnProperty(row)){


                result.rows[row] = {count: entry.count, entryText: `Block executed ${entry.count} time(s)`, text: entry};
			}

            if(result.maxCount< entry.count){
                result.maxCount = entry.count;
            }
        }
        return result;
	}

	getTraceGutterDataRows(){
        return this.traceGutterData.rows;
    }

    setTraceGutterDataRows(rows){
        this.traceGutterData.rows = rows;
    }

    resetTraceGutterDataRows(){
        this.traceGutterData.rows = [];
    }

    setTraceGutterDataRowBranchIndex(row, branchIndex){
        this.traceGutterData.rows[row].branch = branchIndex;
    }

    isTraceGutterDataRowValid(row){
        return row && this.traceGutterData.rows[row];
    }

    isTraceGutterDataValid(){
        return this.traceGutterData && this.traceGutterData.rows;
    }

    setTraceValuesDataRanges(rangesCollection){
        this.traceValuesData.ranges = rangesCollection;
    }

}
