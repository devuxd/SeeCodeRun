import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';

import {JsEditor} from '../jsEditor/js-editor';
import {AceUtils} from "./aceutils";
import {TraceViewModel} from "./traceviewmodel";

@inject(EventAggregator, JsEditor, AceUtils)
export class TraceViewController{
    
    constructor(eventAggregator, jsEditor, aceUtils){
        this.eventAggregator = eventAggregator;
        this.jsEditor = jsEditor;
        this.aceUtils = aceUtils;
    }
    // requires CSS styles for decorations (.ace_gutter-cell.seecoderun_gutter_decoration) and tooltips (.seecoderun_tooltip)
    attached(){
        let jsEditor = this.jsEditor, aceUtils = this.aceUtils;
        let gutterDecorationClassName = "seecoderun_gutter_decoration";
        let tooltip = document.getElementById('tooltip_0');
        
        if(tooltip === null){
        			tooltip = document.createElement('div');		
        			tooltip.setAttribute('id', 'tooltip_0'); 
        			tooltip.setAttribute('class', 'seecoderun_tooltip'); // and make sure myclass has some styles in css
        			document.body.appendChild(tooltip);
        }
        
        
        this.tooltip = tooltip;
        this.gutterDecorationClassName = gutterDecorationClassName;
        this.traceViewModel = new TraceViewModel(aceUtils, jsEditor.editor, tooltip, gutterDecorationClassName); 
    }
    subscribe(){
        let eventAggregator = this.eventAggregator, traceViewModel = this.traceViewModel;
        
        eventAggregator.subscribe(
            "traceChanged", function payload(trace){
                        traceViewModel.onTraceChanged(trace);
                    }
            );
    }
    
}