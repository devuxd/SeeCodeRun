/* global $ */
/* global ace */

export class TracePlayer{
    constructor(eventAggregator, aceUtils){
        this.eventAggregator = eventAggregator;
        this.aceUtils = aceUtils;
        this.refreshRate = 2000;
        this.traceValuesData= {ranges: []};
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
        this.eventAggregator.subscribe( "traceChanged", payload =>{
            this.onTraceChanged(payload.data);
        });
    }

    onTraceChanged(traceHelper){
        this.traceValuesData.ranges = traceHelper.getExecutionTrace();
    }

    attachPlayer(editor, tooltip, dataModel){
        let refreshRate = this.refreshRate;
        let updateTooltip = this.aceUtils.updateTooltip;
        let index = -1,
            isPlaying = false,
            interval;

        let enablePlayBack = function enablePlayBack(){
		    $("#play").html("<span class='glyphicon glyphicon-play'></span>");
		    $("#play").removeClass('btn-danger').addClass('btn-success');

		    $("#remove").removeAttr('title');
		    $("#remove").removeAttr('disabled');
		};

		let disablePlayBack = function disablePlayBack(){
		    $("#play").html("<span class='glyphicon glyphicon-pause'></span>");
		    $("#remove").prop('disabled', 'disabled');
		    $("#remove").prop('title', 'Pause to hide tooltip');
		    $("#play").removeClass('btn-success').addClass('btn-danger');
		};

		let resetPlayBack = function resetPlayBack(){
	    	index = 0;
		    isPlaying = false;
		    clearInterval(interval);
		    enablePlayBack();
		};

        let updatePlayer = function updatePlayer(){
             if(!dataModel){
			    return;
			}

			if(!dataModel.ranges){
			    return;
			}

			if(index > dataModel.ranges.length -1 ){
                resetPlayBack();
			}

			if(index < 0){
			    index = dataModel.ranges.length - 1;
			}

		    let match = dataModel.ranges[index];

			let pixelPosition = editor.renderer.textToScreenCoordinates(match.range.start);
			pixelPosition.pageY += editor.renderer.lineHeight;
			updateTooltip(tooltip, pixelPosition, JSON.stringify(match.values));
		    $("#remove").html("<span class='glyphicon glyphicon-eye-close'></span>");
        };

     	$("#next").click(function (e){
			index++;
			updatePlayer(index);
		});

		$("#prev").click(function (e){
			index--;
			updatePlayer();
		});

		$("#play").click(function(){
    	    isPlaying = !isPlaying;
			clearInterval(interval);
			if(isPlaying){
                disablePlayBack();
    			interval = setInterval(
    			    function incrementAndUpdatePlayer(){
    			        index++;
    			        updatePlayer();
    			    }
    			    , refreshRate);
    	    }else{
    	       enablePlayBack();
    	    }
    	});

    	$("#remove").click(function(){
    	    updateTooltip(tooltip, {pageY: 0, pageX: 0});
		    $("#remove").html("<span class='glyphicon glyphicon-eye-open'></span>");
    	});
    }
}