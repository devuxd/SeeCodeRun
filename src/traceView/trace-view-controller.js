/* global $ */

import {TraceViewModel} from "./trace-view-model";
import {BranchNavigator} from "./branch-navigator";
import {ExpressionDataExplorer} from "./expression-data-explorer";

export class TraceViewController{

    constructor(eventAggregator, aceUtils, jsEditor){
        this.eventAggregator = eventAggregator;
        this.aceUtils = aceUtils;
        this.jsEditor = jsEditor;
        this.traceNavigator = new BranchNavigator(eventAggregator, aceUtils, jsEditor);
        this.expressionDataExplorer = new ExpressionDataExplorer(eventAggregator, aceUtils, jsEditor);
    }

    attached(){
        let eventAggregator = this.eventAggregator;
        let aceUtils = this.aceUtils;
        this.editor = this.jsEditor.editor;
    	let editor = this.editor;
        let expressionDataExplorer = this.expressionDataExplorer;
        expressionDataExplorer.attached();

        let $tooltipView = expressionDataExplorer.get$TooltipView();
        let traceViewModel = new TraceViewModel($tooltipView);
        traceViewModel.attached();
    	this.traceViewModel = traceViewModel;

    	aceUtils.publishExpressionHoverEvents(editor, eventAggregator, traceViewModel);

        this.traceNavigator.attached(traceViewModel);
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

            traceViewModel.updateTraceGutterData(stackTrace);
            traceViewModel.setTraceValuesDataRanges(traceHelper.getExecutionTrace());
    }
}