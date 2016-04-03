/* global ace */

import {AceUtils} from "./ace-utils";
import {TraceViewModel} from "./trace-view-model";

export class TraceViewController{
    
    constructor(eventAggregator){
        this.eventAggregator = eventAggregator;
        this.aceUtils = new AceUtils();
    }
    // requires CSS styles for decorations (.ace_gutter-cell.seecoderun-gutter-decoration) and tooltips (.seecoderun-tooltip)
    attached(){
        let editor = ace.edit('aceJsEditorDiv'), aceUtils = this.aceUtils;
        let gutterDecorationClassName = "seecoderun-gutter-decoration";
        let tooltip = document.getElementById('tooltip_0');
        
        if(tooltip === null){
        			tooltip = document.createElement('div');		
        			tooltip.setAttribute('id', 'tooltip-0'); 
        			tooltip.setAttribute('class', 'seecoderun-tooltip'); // and make sure myclass has some styles in css
        			document.body.appendChild(tooltip);
        }
        
        
        this.tooltip = tooltip;
        this.gutterDecorationClassName = gutterDecorationClassName;
        this.traceViewModel = new TraceViewModel(aceUtils, editor, tooltip, gutterDecorationClassName); 
        this.subscribe();
    }
    subscribe(){
        let eventAggregator = this.eventAggregator, traceViewModel = this.traceViewModel;
        
        eventAggregator.subscribe(
            "traceChanged", payload =>{
                        traceViewModel.onTraceChanged(payload.data);
                        console.log(payload);
                    }
            );
    }
    
}