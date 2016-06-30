/* global $ */

export class ExpressionDataExplorer{
    editorTooltipSelector = "#editorTooltip";
    editorTooltipShowDelay = 500;
    editorTooltipHideDelay = 500;

    constructor(eventAggregator, aceUtils, jsEditor){
        this.eventAggregator = eventAggregator;
        this.aceUtils = aceUtils;
        this.jsEditor = jsEditor;
    }

    attached(){
        let eventAggregator = this.eventAggregator;
        let aceUtils = this.aceUtils;
        let editor = this.jsEditor.editor;

        let $editorTooltip = $(this.editorTooltipSelector);

        if(!$editorTooltip.length){
			$editorTooltip = $(`<div id='${this.editorTooltipSelector}' />`);
        }

        $editorTooltip.attr({
            "data-toggle": "popover",
            "data-placement": "bottom",
            "data-content": "",
            "delay": {
                show: this.editorTooltipShowDelay,
                hide: this.editorTooltipHideDelay
            }
        });
		$editorTooltip.popover({
		    title: "Current Values",
		    html: true,
		  //  selector: '[rel="popover"]',
            content: function $editorTooltipPopoverContent() {
                // return $('#branchNavigator').html();
            },
		    padding: 4
		});

        $editorTooltip.appendTo('body');

        this.$editorTooltip = $editorTooltip;
    }

    get$TooltipView(){
        return this.$editorTooltip;
    }
}