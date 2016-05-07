/* global $ */
/* global ace */
import {TraceModel} from '../traceService/trace-model';
import {TraceViewModel} from "../traceView/trace-view-model";
import {AceUtils} from "../utils/ace-utils";

export class TracePlay{
    constructor(eventAggregator){
        this.eventAggregator = eventAggregator;
        this.traceModel = new TraceModel();
        this.aceUtils = new AceUtils();
    }

    attached(){

        let tooltip = document.getElementById('tooltip_1');
        
        let editor = ace.edit('aceJsEditorDiv'), aceUtils = this.aceUtils;
        if(tooltip === null){
        			tooltip = document.createElement('div');		
        			tooltip.setAttribute('id', 'tooltip-1'); 
        			tooltip.setAttribute('class', 'seecoderun-tooltip'); 
        			document.body.appendChild(tooltip);
        }
        
        this.tooltip = tooltip;
        this.traceViewModel = new TraceViewModel(aceUtils, editor, tooltip);
        this.subscribe(); 
    }
    subscribe(){
        let eventAggregator = this.eventAggregator;
        let traceViewModel = this.traceViewModel;
        let traceUpdatedEvent = this.traceModel.traceEvents.changed.event;
        eventAggregator.subscribe( traceUpdatedEvent, payload =>{
            traceViewModel.onTraceChanged(payload.data);
        });
    }
}