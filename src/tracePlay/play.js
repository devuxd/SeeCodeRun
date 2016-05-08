/* global $ */
/* global ace */

export class TracePlay{
    constructor(eventAggregator, traceModel, aceUtils){
        this.eventAggregator = eventAggregator;
        this.traceModel = traceModel;
        this.aceUtils = aceUtils;
        this.refreshRate = 2000;
        this.traceValuesData.ranges = [];
    }

    attached(){

        let tooltip = document.getElementById('tooltip_1');
        
        let editor = ace.edit('aceJsEditorDiv');
        if(tooltip === null){
        			tooltip = document.createElement('div');		
        			tooltip.setAttribute('id', 'tooltip-1'); 
        			tooltip.setAttribute('class', 'seecoderun-tooltip'); 
        			document.body.appendChild(tooltip);
        }
        
        this.tooltip = tooltip;
        this.attachPlayer(editor, tooltip, this.traceValuesData);
        this.subscribe(); 
    }
    
    subscribe(){
        let self = this;
        let eventAggregator = this.eventAggregator;
        let traceUpdatedEvent = this.traceModel.traceEvents.changed.event;
        
        eventAggregator.subscribe( traceUpdatedEvent, payload =>{
            self.onTraceChanged(payload.data);
        });
    }
    
    onTraceChanged(traceHelper){
        this.traceValuesData.ranges = traceHelper.getExecutionTrace();
    }
    
    attachPlayer(editor, tooltip, dataModel){
        let refreshRate = this.refreshRate;
        let updateTooltip = this.aceUtils.updateTooltip;
        let index = -1,
            flag = false,
            interval;
        
        let updatePlayer = function updatePlayer(){
             if(!dataModel){
			    return;
			}
			
			if(!dataModel.ranges){
			    return;
			}
			
			if(index > dataModel.ranges.length -1 ){
			    index = 0;
			    clearInterval(interval);
			}
			
			if(index < 0){
			    index = dataModel.ranges.length - 1;
			}
			
		    let match = dataModel.ranges[index];
			
			let pixelPosition = editor.renderer.textToScreenCoordinates(match.range.start);
			pixelPosition.pageY += editor.renderer.lineHeight;
			updateTooltip(tooltip, pixelPosition, JSON.stringify(match.values));
        };
     	
     	$("#next").click(function (e){
			index++;
			updatePlayer();
		});
		
		$("#prev").click(function (e){
			index--;
			updatePlayer();
		});
		
			
    	$("#play").click(function(){
    	    flag = !flag;
			clearInterval(interval);
			if(flag){
			    $("#play").html('Pause');
			    $("#remove").prop('disabled', 'disabled');
			    $("#remove").prop('title', 'Pause to hide tooltip');
			    $("#play").removeClass('btn-success').addClass('btn-danger');
    			interval = setInterval(updatePlayer(), refreshRate);
    	    }else{
    	        $("#play").html('Play');
			    $("#remove").removeAttr('disabled');
			    $("#remove").removeAttr('title');
			    $("#play").removeClass('btn-danger').addClass('btn-success');
    	    }
    	});
    	
    	$("#remove").click(function(){
    	    updateTooltip(tooltip);
    	});
    }
}