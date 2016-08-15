/* global $ */

export class TracePlayer{
    constructor(eventAggregator, aceUtils, refreshRate = 2000){
        this.eventAggregator = eventAggregator;
        this.aceUtils = aceUtils;
        this.refreshRate = refreshRate;
        this.resetPlayBack();
    }

    resetPlayBack(){
		this.indexInTimeline = -1,
        this.isPlaying = false,
		clearInterval(this.intervalId);
		this.enablePlayBack();
	}

    attached(){
    	let self = this;

     	$("#next").click(function (e){
			self.indexInTimeline++;
			self.updatePlayer();
		});

		$("#prev").click(function (e){
			self.indexInTimeline--;
			self.updatePlayer();
		});

		$("#play").click(function(){
    	    self.isPlaying = !self.isPlaying;
			clearInterval(self.intervalId);
			if(self.isPlaying){
                self.disablePlayBack();
                $("#next").click();
    			self.intervalId = setInterval(function incrementAndUpdatePlayer(){
    			        $("#next").click();
    			}, self.refreshRate);
    	    }else{
    	       self.enablePlayBack();
    	    }
    	});

    	$("#remove").click(function(){
    		if($("#remove").is(":disabled")){
    			$("#remove").removeAttr('title');
	    		$("#remove").removeAttr('disabled');
	    		$("#remove").html("<span class='glyphicon glyphicon-eye-close'></span>");
    			self.eventAggregator.publish("expressionDataExplorerShowTooltip", {type: "player", indexInTimeline: self.indexInTimeline});
    		}else{
    			$("#remove").prop('disabled', 'disabled');
	    		$("#remove").prop('title', 'Pause to hide tooltip');
    			$("#remove").html("<span class='glyphicon glyphicon-eye-open'></span>");
		    	self.eventAggregator.publish("expressionDataExplorerHideTooltip", {type: "player", indexInTimeline: self.indexInTimeline});
    		}
    	});
        this.subscribe();
    }

    subscribe(){
        this.eventAggregator.subscribe( "branchNavigatorChange", payload =>{
            this.indexInTimeline = payload.indexInTimeline || 0;
        });

        this.eventAggregator.subscribe( "traceChanged", payload =>{
            this.timeLineLength = payload.data.getTimeline().length || 0;
        });
    }

    enablePlayBack(){
	    $("#play").html("<span class='glyphicon glyphicon-play'></span>");
	    $("#play").removeClass('btn-danger').addClass('btn-success');

	    $("#remove").removeAttr('title');
	    $("#remove").removeAttr('disabled');
	}

	disablePlayBack(){
	    $("#play").html("<span class='glyphicon glyphicon-pause'></span>");
	    $("#remove").prop('disabled', 'disabled');
	    $("#remove").prop('title', 'Pause to hide tooltip');
	    $("#play").removeClass('btn-success').addClass('btn-danger');
	}

	updatePlayer(){
		if(this.indexInTimeline > this.timeLineLength - 1 ){
            this.resetPlayBack();
		}
		if(this.indexInTimeline < 0){
		    this.indexInTimeline = this.timeLineLength - 1 ;
		}
		this.eventAggregator.publish("expressionDataExplorerShowTooltip", {type: "player", indexInTimeline: this.indexInTimeline});

		$("#remove").removeAttr('title');
		$("#remove").removeAttr('disabled');
	    $("#remove").html("<span class='glyphicon glyphicon-eye-close'></span>");
    }

}