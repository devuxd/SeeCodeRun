/* global $ */
/* global ace */
import $ from "jquery";
import {popover} from "bootstrap";
import {TraceViewModel} from "./trace-view-model";

export class TraceViewController{
    gutterTooltipSelector = "#gutterTooltip";
    gutterTooltipShowDelay = 250;
    gutterTooltipHideDelay = 1500;
    
    editorTooltipSelector = "#editorTooltip";
    editorTooltipShowDelay = 500;
    editorTooltipHideDelay = 500;
    
    aceEditorDivId = "aceJsEditorDiv";
    gutterDecorationClassName = "seecoderun-gutter-decoration";
    
    constructor(eventAggregator, aceUtils){
        this.eventAggregator = eventAggregator;
        this.aceUtils = aceUtils;
    }
    
    attached(){
        let eventAggregator = this.eventAggregator;
        let aceUtils = this.aceUtils;
        let editor = ace.edit(this.aceEditorDivId);
        let gutterDecorationClassName = this.gutterDecorationClassName;
        
        let $editorTooltip = $(this.editorTooltipSelector);
        
        if(!$editorTooltip.length){
			$editorTooltip = $(`<div id='${this.editorTooltipSelector}' />`);
// 			$editorTooltip.addClassName("");
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
        
        let traceViewModel = new TraceViewModel($editorTooltip); 
        traceViewModel.attached();
        
        aceUtils.setTraceGutterRenderer(editor, traceViewModel.traceGutterData);
    	aceUtils.subscribeToGutterEvents(editor, $editorTooltip, gutterDecorationClassName, traceViewModel.traceGutterData, traceViewModel.update$Tooltip);
    	
    	this.editor = editor;
        this.gutterDecorationClassName = gutterDecorationClassName;
        this.$editorTooltip = $editorTooltip;
    	this.traceViewModel = traceViewModel;
    	
    	aceUtils.publishExpressionHoverEvents(editor, eventAggregator, traceViewModel);
    	
        this.subscribe();
    }
    
    subscribe(){
        let self = this, eventAggregator = this.eventAggregator, aceUtils = this.aceUtils, editor =  this.editor, traceViewModel = this.traceViewModel;
        
        eventAggregator.subscribe(
            "traceChanged", payload =>{
                        self.onTraceChanged(payload.data);
                    }
        );
            
        aceUtils.subscribeToExpressionHoverEvents(editor, eventAggregator, traceViewModel);
    }
    
    onTraceChanged(traceHelper){
        
            if(!traceHelper){
                throw "onTraceChanged() called without a Trace Helper.";
            }
            
            let traceViewModel = this.traceViewModel;
            
            traceViewModel.traceHelper = traceHelper;
            
            let stackTrace = traceHelper.getStackBlockCounts();

            let previousRows = traceViewModel.traceGutterData.rows;
            traceViewModel.updateTraceGutterData(stackTrace);
            
            this.aceUtils.updateGutterDecorations(this.editor, previousRows, traceViewModel.traceGutterData.rows, this.gutterDecorationClassName);
            
            traceViewModel.traceValuesData.ranges = traceHelper.getExecutionTrace();
    }
    
}