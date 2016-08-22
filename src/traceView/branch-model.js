export class BranchModel{
    timelineLength = 0;
    constructor(){
        this.traceGutterData = { maxCount : 0, rows : [] };
        this.navigationTimeline = [];
        this.navigationData = {};
        this.currentNavigationDatum = null;
        this.currentNavigationDatum = null;
    }

    isRepOK(){
		if(!this.traceHelper){
		    return false;
		}

		if(!this.traceHelper.isRepOK()){
		    return false;
		}

		if(!this.traceGutterData.rows){
		    return false;
		}
		return true;
	}

	startNavigation(){
        this.isNavigationMode = true;
    }

    toggleNavigation(){
        this.isNavigationMode = !this.isNavigationMode;
    }

    stopNavigation(){
        this.isNavigationMode = false;
        this.resetNavigation();
    }

    resetNavigation(){
        this.navigationTimeline = this.traceHelper? this.traceHelper.getTimeline(): [];
        this.updateTraceGutterData();
        this.navigationData = {};
        this.currentNavigationDatum = null;
        this.currentNavigationDatum = null;
    }

	getTimeline(){
	    if(!this.isRepOK()){
	        return [];
	    }

        if(this.isNavigationMode){
            return this.getNavigationTimeline();
        }
        return this.traceHelper.getTimeline();
    }

    getNavigationTimeline(){
        return this.navigationTimeline;
    }

    navigateToBranch(){
        // if(!this.currentNavigationFunction){
            // this.navigationTimeline = this.traceHelper.getTimeline();
            // return;
        // }
        let branchIndex = this.currentNavigationDatum.branchIndex;
        let lowerBound = this.currentNavigationDatum.entry.timelineIndexes[branchIndex];
        let upperBound = this.currentNavigationDatum.entry.timelineIndexes[branchIndex + 1];
        let timeline = this.traceHelper.getTimeline();
        // let branchIndex = this.currentNavigationFunction.branchIndex|| 1;
        // let lowerBound = this.currentNavigationFunction.entry.timelineIndexes[branchIndex];
        // let upperBound = this.currentNavigationFunction.entry.timelineIndexes[branchIndex + 1];
        // let timeline = this.traceHelper.getTimeline();
        let branchTimeline = {};
        for(let j = lowerBound; j < upperBound; j++) {
                branchTimeline[j] = timeline[j];
         }

        this.navigationTimeline = branchTimeline;
    }

    pushNavigationData(navigationDatum){
        if(navigationDatum && navigationDatum.entry){
            let type = navigationDatum.entry.type;
            if(type === "FunctionDeclaration" || type === "FunctionExpression"){
                this.currentNavigationFunction = navigationDatum;
            }
            this.currentNavigationDatum = navigationDatum;
            let navigationDatumKey = null;
            if(this.currentNavigationFunction){
                navigationDatumKey = this.currentNavigationFunction.entry.blockKey + this.currentNavigationFunction.branchIndex;
            }else{
                navigationDatumKey = "GLOBAL";
            }
            if(!this.navigationData[navigationDatumKey]){
                this.navigationData[navigationDatumKey] = {};
            }
            this.navigationData[navigationDatumKey][navigationDatum.entry.blockKey] = navigationDatum;
        }
    }

    resetTraceGutterData(){
        if(!this.traceGutterData){
            this.traceGutterData = {  maxCount : 0, rows : []  };
            return;
        }
        this.traceGutterData.maxCount = 0;
        this.traceGutterData.rows = [];
    }

    extractTraceGutterData(trace){
	    let result = {maxCount : 0, rows : []  };
        for (let i = 0; i < trace.length; i ++) {
            let entry = trace[i];
			let row = entry.range.start.row;

			if(!result.rows.hasOwnProperty(row)){
                result.rows[row] = { entry: entry, count: entry.count, branch : entry.count};
			}

            if(result.maxCount< entry.count){
                result.maxCount = entry.count;
            }
        }
        return result;
	}


	getNavigationStackBlockCounts(lowerBound = 0, upperBound) {
	    if(!this.isRepOK()){
	        return [];
	    }
	    let timelineLength = this.traceHelper.getTimeline().length;
        let stack = this.traceHelper.trace.stack, data = this.traceHelper.trace.data;
        let stackData = [];
        let navigationDatumKey = "GLOBAL";
        if(this.currentNavigationFunction && this.currentNavigationFunction.entry && this.currentNavigationFunction.entry.timelineIndexes){
            let timelineIndexesLength = this.currentNavigationFunction.entry.timelineIndexes.length;
            let branchIndex = this.currentNavigationFunction.branchIndex;
            if( timelineIndexesLength > 2){
                lowerBound = this.currentNavigationFunction.entry.timelineIndexes[branchIndex];
                upperBound = timelineIndexesLength > 3? this.currentNavigationFunction.entry.timelineIndexes[branchIndex+1]: upperBound;
            }

            navigationDatumKey = this.currentNavigationFunction.entry.blockKey + this.currentNavigationFunction.branchIndex;
        }

        if(!upperBound){
            lowerBound = 0;
            upperBound = timelineLength;
        }

        for (let key in stack) {
            if(data[key]){
                let containingBlock = JSON.parse(data[key].id);
                if(containingBlock){
                    let timelineIndexes = null, count = 0;
                    if(containingBlock.type === "FunctionDeclaration" || containingBlock.type === "FunctionExpression"){
                        timelineIndexes = this.getTimelineIndexesByBlockKey(key, 0, timelineLength);
                        count = stack[key];
                    }else{
                        let navigationDatum = this.navigationData[navigationDatumKey]? this.navigationData[navigationDatumKey][key]: null;

                        if(navigationDatum && navigationDatum !== this.currentNavigationFunction){
                            if(navigationDatum === this.currentNavigationDatum){
                                timelineIndexes = this.getTimelineIndexesByBlockKey(key, 0, timelineLength);
                                count = timelineIndexes.length - 2;
                            }
                            let timelineIndexesLength = navigationDatum.entry.timelineIndexes.length;
                            let branchIndex = navigationDatum.branchIndex;
                            if( timelineIndexesLength > 2){
                                lowerBound = navigationDatum.entry.timelineIndexes[branchIndex];
                                upperBound = timelineIndexesLength > 3? navigationDatum.entry.timelineIndexes[branchIndex+1]: upperBound;
                            }
                        }else{
                            timelineIndexes = this.getTimelineIndexesByBlockKey(key, lowerBound, upperBound);
                            count = timelineIndexes.length - 2;
                        }

                        // if(navigationDatum !== this.currentNavigationDatum){
                        //     timelineIndexes = this.getTimelineIndexesByBlockKey(key, lowerBound, upperBound);
                        //     count = timelineIndexes.length - 2;
                        // }
                    }
                    stackData.push({ blockKey: key, type: containingBlock.type, range: containingBlock.range, blockRange: data[key].range,  timelineIndexes: timelineIndexes, count: count});
                }
            }
        }
        return stackData;
    }

    getTimelineIndexesByBlockKey(key, lowerBound, upperBound){
        if(!this.isRepOK()){
	        return [];
	    }

        let timeline = this.traceHelper.getTimeline();
        if(!timeline){
            return [];
        }

        let timelineIndexes = [lowerBound];
        for(let i = lowerBound; i < upperBound; i++){
            if(timeline[i] && key === timeline[i].key){
                timelineIndexes.push(i);
            }
        }
        timelineIndexes.push(upperBound);

        return timelineIndexes;
    }

	updateTraceGutterData(navigationDatum){
        if(!this.isRepOK()){
            return;
        }

        if(!navigationDatum){
            let traceCollection = this.getNavigationStackBlockCounts();
            let localTraceGutterData = this.extractTraceGutterData(traceCollection);
            this.traceGutterData.maxCount = localTraceGutterData.maxCount;
            this.traceGutterData.rows = localTraceGutterData.rows;
        }else{
            this.pushNavigationData(navigationDatum);
            this.startNavigation();
            this.navigateToBranch();
            let traceCollection = this.getNavigationStackBlockCounts();
            let localTraceGutterData = this.extractTraceGutterData(traceCollection);
            for (let rowIndex in localTraceGutterData.rows){
                let row = localTraceGutterData.rows[rowIndex];
                if(row && this.traceGutterData.rows[rowIndex]){
                    let rowCount = row.count;
                    let navigationDatumKey = this.currentNavigationFunction? this.currentNavigationFunction.entry.blockKey + this.currentNavigationFunction.branchIndex: "GLOBAL";
                    let navigationDatum = this.navigationData[navigationDatumKey]? this.navigationData[navigationDatumKey][row.entry.blockKey]: null;
                    if(navigationDatum){
                        // this.traceGutterData.rows[rowIndex].count = Math.min(this.traceGutterData.rows[rowIndex].count? this.traceGutterData.rows[rowIndex].count: 0, rowCount);
                        this.traceGutterData.rows[rowIndex].branch = Math.min(navigationDatum.branchIndex? navigationDatum.branchIndex: rowCount, rowCount);
                    }else{
                        this.traceGutterData.rows[rowIndex].count = rowCount;
                        this.traceGutterData.rows[rowIndex].branch = this.traceGutterData.rows[rowIndex].count;
                    }
                }
            }
        }
    }

	getTraceGutterData(){
        return this.traceGutterData;
    }

	getTraceGutterDataRows(){
        return this.traceGutterData.rows;
    }

    setTraceGutterDataRows(rows){
        this.traceGutterData.rows = rows;
    }

    resetTraceGutterDataRows(){
        this.traceGutterData.rows = [];
    }

    setTraceGutterDataRowBranchIndex(row, branchIndex){
        this.traceGutterData.rows[row].branch = branchIndex;
    }

    isTraceGutterDataRowValid(row){
        return row != null && this.traceGutterData.rows[row];
    }

    isTraceGutterDataValid(){
        return this.traceGutterData && this.traceGutterData.rows;
    }

    getNavigationData(){
        if(this.isRepOK()){
            return this.navigationData;
        }
        return [];
    }
}