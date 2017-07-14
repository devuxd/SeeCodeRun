/* global $ */

import {TraceViewModel} from "./trace-view-model";
import {BranchNavigator} from "./branch-navigator";
import {ExpressionDataExplorer} from "./expression-data-explorer";

export class TraceViewController{

    constructor(eventAggregator, aceUtils, jsEditor){
        this.eventAggregator = eventAggregator;
        this.aceUtils = aceUtils;
        this.jsEditor = jsEditor;
    	this.traceViewModel = new TraceViewModel();
        this.traceNavigator = new BranchNavigator(eventAggregator, aceUtils, jsEditor, this.traceViewModel);
        this.expressionDataExplorer = new ExpressionDataExplorer(eventAggregator, aceUtils, jsEditor, this.traceViewModel);
    }

    attached(){
        // needs a ace editor to be attached previously
        this.editor = this.jsEditor.editor;
        let eventAggregator = this.eventAggregator, aceUtils = this.aceUtils, editor =  this.editor, traceViewModel = this.traceViewModel;

        eventAggregator.subscribe(
            "traceChanged", payload =>{
                        this.onTraceChanged(payload.data);
                    }
        );

        eventAggregator.subscribe(
            "branchNavigatorReset", () =>{
                        this.onBranchNavigatorReset();
                    }
        );

        aceUtils.publishExpressionHoverEvents(editor, eventAggregator, traceViewModel);
        aceUtils.publishExpressionCursorMovedEvents(editor, eventAggregator, traceViewModel);

        this.expressionDataExplorer.attached();
        this.traceNavigator.attached();

    }

    onTraceChanged(traceHelper){
            if(!traceHelper){
                throw "onTraceChanged() triggered without a Trace Helper.";
            }
            this.traceViewModel.setTraceHelper(traceHelper);
            this.eventAggregator.publish("traceGutterDataChanged");

            this.traceViewModel.setTraceValuesDataRanges(traceHelper.getTimeline());
            this.eventAggregator.publish("traceValuesDataRangesChanged");
    }

    onBranchNavigatorReset(){
        if(!this.traceViewModel){
            return;
        }
        let traceHelper = this.traceViewModel.getTraceHelper();
	    if(traceHelper){
    	    this.traceViewModel.stopNavigation();
    	    this.onTraceChanged(traceHelper);
	    }
    }
}
