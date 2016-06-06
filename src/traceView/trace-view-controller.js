/* global ace */
import {TraceViewModel} from "./trace-view-model";

export class TraceViewController{
    
    constructor(eventAggregator, aceUtils){
        this.eventAggregator = eventAggregator;
        this.aceUtils = aceUtils;
    }
    
    attached(){
        let eventAggregator = this.eventAggregator;
        let editor = ace.edit('aceJsEditorDiv'), aceUtils = this.aceUtils;
        let gutterDecorationClassName = "seecoderun-gutter-decoration";
        let tooltip = document.getElementById('tooltip_0');
        
        if(tooltip === null){
        			tooltip = document.createElement('div');
        			tooltip.setAttribute('id', 'tooltip-0'); 
        			tooltip.setAttribute('title', 'Navigation'); 
        			tooltip.setAttribute('data-toggle', 'popover');  
        			tooltip.setAttribute('data-placement', 'right'); 
        			tooltip.setAttribute('data-content', 'Branch'); 
        			tooltip.setAttribute('class', 'seecoderun-tooltip'); 
        			document.body.appendChild(tooltip);
        			$('#tooltip_0').popover(); 
        }
        
        
        
        let traceViewModel = new TraceViewModel(tooltip); 
        traceViewModel.attached();
        
        aceUtils.setTraceGutterRenderer(editor, traceViewModel.traceGutterData);
    	aceUtils.subscribeToGutterEvents(editor, tooltip, gutterDecorationClassName, traceViewModel.traceGutterData, traceViewModel.tooltipUpdateWithDelay);
    	
    	this.editor = editor;
        this.gutterDecorationClassName = gutterDecorationClassName;
        this.tooltip = tooltip;
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