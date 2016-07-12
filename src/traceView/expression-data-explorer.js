/* global $ */
import {TreeViewExplorer} from "./tree-view-explorer";

export class ExpressionDataExplorer{
    editorTooltipSelector = "#editorTooltip";
    editorTooltipId = "editorTooltip";
    editorTooltipShowDelay = 500;
    editorTooltipHideDelay = 500;

    constructor(eventAggregator, aceUtils, jsEditor, traceViewModel){
        this.eventAggregator = eventAggregator;
        this.aceUtils = aceUtils;
        this.jsEditor = jsEditor;
        this.traceViewModel = traceViewModel;
    }

    attached(){
        let eventAggregator = this.eventAggregator;
        let aceUtils = this.aceUtils;
        let editor = this.jsEditor.editor;
        this.expressionMarkerManager = aceUtils.makeAceMarkerManager(editor);
        this.expressionMarkerManager.markerRenderer = aceUtils.getAvailableMarkers().expressionMarker;
        let $editorTooltip = $(this.editorTooltipSelector);

        if(!$editorTooltip.length){
          $editorTooltip = $(`<div id='${this.editorTooltipId}' />`);
          $editorTooltip.addClass("seecoderun-tooltip");
        }

        // $editorTooltip.attr({
        //     "data-toggle": "popover",
        //     "data-placement": "bottom",
        //     "data-content": "",
        //     "delay": {
        //         show: this.editorTooltipShowDelay,
        //         hide: this.editorTooltipHideDelay
        //     }
        // });
		// $editorTooltip.popover({
		//     title: "Current Values",
		//     html: true,
		//   //  selector: '[rel="popover"]',
    //         content: function $editorTooltipPopoverContent() {
    //             // return $('#branchNavigator').html();
    //         },
		//     padding: 4
		// });

        $editorTooltip.appendTo('body');

        this.$editorTooltip = $editorTooltip;
        aceUtils.subscribeToExpressionHoverEvents(editor, eventAggregator, this);
        this.attachTooltipUpdateWithDelay();
    }

    attachTooltipUpdateWithDelay(){
      let self = this;
        let div =   this.$editorTooltip;
        let aceUtils = this.aceUtils;
        let expressionMarkerManager = this.expressionMarkerManager;
    	let showToolTipDelay = this.showToolTipDelay;
    	let hideToolTipDelay = this.hideToolTipDelay;
    	let tooltipSetTimeout = window.setTimeout;
    	let tooltipClearTimeout = window.clearTimeout;
    	let tooltipTimeout = null;

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
    				div.show();
    				div.innerHTML = content;
    			}else{
            	  div.hide();
            		div.innerHTML = "";
    	        }
			}, toolTipDelay);
	    };

        this.update$Tooltip = function update$Tooltip(position, match){
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

			if(match){
			    let content = match.text +",  values"+ JSON.stringify(match.values);
			    // div.popover({
        	// 	    title: "Y: " + position.pageY,
        	// 	    html: true,
          //           content: function $editorTooltipPopoverContent() {
          //               return content;
          //           },
        	// 	    padding: 4
        	// 	});
			    // div.attr("data-content", content);
          let editorTooltipElement = document.getElementById(self.editorTooltipId);
          self.treeViewExplorer = new TreeViewExplorer(match.values);
          self.treeViewExplorer.appendContent(editorTooltipElement);
          // div.popover("show");
          div.show();
			    aceUtils.updateAceMarkers(expressionMarkerManager, match);
			}else{
			    // div.popover("hide");
          div.hide();
			    aceUtils.updateAceMarkers(expressionMarkerManager, []);
	        }
        };

    }

    onExpressionHovered(match, pixelPosition){
        if(match){
            this.update$Tooltip(pixelPosition, match);
        }else{
            this.update$Tooltip();
        }
    }

}
