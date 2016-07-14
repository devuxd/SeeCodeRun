/* global $ */
import {TreeViewExplorer} from "./tree-view-explorer";

export class ExpressionDataExplorer{
    editorTooltipSelector = "#editorTooltip";
    editorTooltipId = "editorTooltip";
    editorTooltipShowDelay = 1000;
    editorTooltipHideDelay = 2000;
    currentMatchRange = null;

    constructor(eventAggregator, aceUtils, aureliaEditor, traceViewModel){
        this.eventAggregator = eventAggregator;
        this.aceUtils = aceUtils;
        this.aureliaEditor = aureliaEditor;
        this.traceViewModel = traceViewModel;
    }

    attached(){
        let eventAggregator = this.eventAggregator;
        let aceUtils = this.aceUtils;
        let editor = this.aureliaEditor.editor;
        this.expressionMarkerManager = aceUtils.makeAceMarkerManager(editor);
        this.expressionMarkerManager.markerRenderer = aceUtils.getAvailableMarkers().expressionMarker;
        let $editorTooltip = $(this.editorTooltipSelector);

        if(!$editorTooltip.length){
          $editorTooltip = $(`<div id='${this.editorTooltipId}' />`);
          $editorTooltip.attr({
            "data-toggle": "popover",
            "data-placement": "bottom",
            "data-content": "No value found."
        });
		$editorTooltip.popover({
		    viewport:"#codeContent .ace_scroller",
		    html: true,
		    padding: 0,
		    trigger: 'manual',
            delay: {
                show: this.editorTooltipShowDelay,
                hide: this.editorTooltipHideDelay
            },
            template: '<div class="popover" role="tooltip"><div class="arrow"></div><div id = "editorTooltipContentId"><div class="popover-content"></div></div></div>'
		});
        }

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
			    self.treeViewExplorer = new TreeViewExplorer(match.values);
                self.treeViewExplorer.appendTo$PopoverElement(div);
                div.popover("show");
                aceUtils.updateAceMarkers(expressionMarkerManager, [match]);
			}else{
			    div.popover("hide");
			    self.currentMatchRange = null;
			    aceUtils.updateAceMarkers(expressionMarkerManager, []);
	        }

	        $("#editorTooltipContentId").mouseenter(
                function editorTooltipMouseenter(){
                    clearTimeout(self.onExpressionHoveredTimeout);
                    clearTimeout(self.editorTooltiptimeout);
                }
            ).mouseleave(
                function editorTooltipMouseleave(){
                    self.editorTooltiptimeout = setTimeout(function editorTooltiptimeout(){
                        div.popover("hide");
                        self.currentMatchRange = null;
			            aceUtils.updateAceMarkers(expressionMarkerManager, []);
                    }, self.editorTooltipHideDelay);
                }
            );
        };

    }

    onExpressionHovered(match, pixelPosition){
        let self = this;
        if(match){
            if(match.range){
                let newMatchRange = this.aceUtils.parseRangeString(match.range);
                if(match.range && this.currentMatchRange !== newMatchRange){
                    this.currentMatchRange = newMatchRange;
                    clearTimeout(this.onExpressionHoveredTimeout);
                    this.onExpressionHoveredTimeout = setTimeout( function onExpressionHoveredTimeout(){
                        self.update$Tooltip(pixelPosition, match);
                    }, this.editorTooltipShowDelay);

                }
            }
        }else{
            clearTimeout(this.onExpressionHoveredTimeout);
            this.onExpressionHoveredTimeout = setTimeout( function onExpressionHoveredTimeout(){
                self.update$Tooltip();
            }, this.editorTooltipHideDelay);
        }
    }

}
