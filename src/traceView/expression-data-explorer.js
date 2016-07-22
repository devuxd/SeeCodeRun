/* global $ */
/* global CollapsibleLists */
import {TreeViewExplorer} from "./tree-view-explorer";

export class ExpressionDataExplorer{
    editorTooltipSelector = "#editorTooltip";
    editorTooltipId = "editorTooltip";
    editorTooltipContentId = "editorTooltipContentId";
    viewportSelector = "#codeContent .ace_scroller";
    editorTooltipShowDelay = 750;
    editorTooltipHideDelay = 1500;
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
		    viewport: this.viewportSelector,
		    html: true,
		    trigger: 'manual',
            template: '<div class="popover" role="tooltip"><div class="arrow"></div><div id = "'+this.editorTooltipContentId+'"><div class="popover-content"></div></div></div>'
		});
        }

        $editorTooltip.appendTo('body');
        $editorTooltip.on('shown.bs.popover', function(){
          CollapsibleLists.apply();
        });

        this.$editorTooltip = $editorTooltip;
        aceUtils.subscribeToExpressionHoverEvents(editor, eventAggregator, this);
        this.attachTooltipUpdate();
    }

    attachTooltipUpdate(){
        let self = this;
        let div =   this.$editorTooltip;
        let aceUtils = this.aceUtils;
        let expressionMarkerManager = this.expressionMarkerManager;

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
		      self.treeViewExplorer = new TreeViewExplorer(match.value);
              let popoverData = self.treeViewExplorer.getPopoverElementContent(div);

		      div.attr("data-content", '<div class="custom-popover-title">Exploring '+popoverData.type+' Element</div>'+popoverData.content);
              div.popover("show");
              aceUtils.updateAceMarkers(expressionMarkerManager, [match]);
			}else{
			    div.popover("hide");
			    self.currentMatchRange = null;
			    aceUtils.updateAceMarkers(expressionMarkerManager, []);
	        }

	        $("#"+self.editorTooltipContentId).mouseenter(
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
