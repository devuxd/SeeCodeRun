import {BranchModel} from "./branch-model";

export class TraceViewModel {
    constructor(){
        this.branchModel = new BranchModel();
        this.resetData();
    }

    isRepOK(){
	    if(!this.traceValuesData.ranges){
		    return false;
		}

		if(!this.traceHelper){
		    return false;
		}

		if(!this.traceHelper.trace){
		    return false;
		}

		if(!this.branchModel){
		    return false;
		}

		return true;
	}

	startNavigation(){
	    if(this.isRepOK()){
	        this.branchModel.startNavigation();
	    }
	}

	stopNavigation(){
	    if(this.isRepOK()){
	        this.branchModel.stopNavigation();
	    }
	}

    getTraceHelper(){
        return this.traceHelper;
    }

    setTraceHelper(traceHelper){
        this.traceHelper = traceHelper;
        this.branchModel.traceHelper = traceHelper;
        this.branchModel.updateTraceGutterData();
    }

    updateTraceGutterData(navigationDatum){
        this.branchModel.updateTraceGutterData(navigationDatum);
    }

    resetTraceGutterData(){
        this.branchModel.resetTraceGutterData();
    }

    resetTraceGutterDataRows(){
        this.branchModel.resetTraceGutterDataRows();
    }

    setTraceGutterDataRowBranchIndex(row, branchIndex){
        this.branchModel.setTraceGutterDataRowBranchIndex(row, branchIndex);
    }

    isTraceGutterDataRowValid(row){
        return this.branchModel.isTraceGutterDataRowValid(row);
    }

    isTraceGutterDataValid(){
        return this.branchModel.isTraceGutterDataValid();
    }

    resetData(){
        this.branchModel.resetTraceGutterData();
        this.resetTraceValuesData();
    }

    getExpressionAtPosition(mousePosition){
        if(this.isRepOK()){
            return this.traceHelper.getExpressionAtPosition(this.branchModel.getTimeline(), mousePosition);
        }
        return null;
    }

    resetTraceValuesData(){
        if(!this.traceValuesData){
            this.traceValuesData = { ranges: [] };
            return;
        }
        this.traceValuesData.ranges = [];
    }

    setTraceValuesDataRanges(rangesCollection){
        this.traceValuesData.ranges = rangesCollection;
    }
}
