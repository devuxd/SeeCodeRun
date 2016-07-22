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

        aceUtils.publishExpressionHoverEvents(editor, eventAggregator, traceViewModel);

        this.expressionDataExplorer.attached();
        this.traceNavigator.attached();

    }

    onTraceChanged(traceHelper){
            if(!traceHelper){
                throw "onTraceChanged() triggered without a Trace Helper.";
            }

            let traceViewModel = this.traceViewModel;

            traceViewModel.traceHelper = traceHelper;

            let blockCounts = traceHelper.getStackBlockCounts();

            traceViewModel.updateTraceGutterData(blockCounts);
            this.eventAggregator.publish("traceGutterDataChanged");
            traceViewModel.setTraceValuesDataRanges(traceHelper.getTimeline());
            this.eventAggregator.publish("traceValuesDataRangesChanged");
    }
}