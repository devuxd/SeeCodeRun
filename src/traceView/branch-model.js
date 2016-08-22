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
        let branchIndex = this.currentNavigationDatum.branchIndex;
        let lowerBound = this.currentNavigationDatum.entry.timelineIndexes[branchIndex];
        let upperBound = this.currentNavigationDatum.entry.timelineIndexes[branchIndex + 1]; // call appears at entrance and exit of block
        let timeline = this.traceHelper.getTimeline();
        let branchTimeline = [];
        for(let j = lowerBound; j < upperBound; j++) {
                branchTimeline.push(timeline[j]);
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
            this.navigationData[navigationDatum.entry.key] = navigationDatum;
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
                result.rows[row] = {entry: entry, count: entry.count, branch : entry.count};
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
        let stack = this.traceHelper.trace.stack, data = this.traceHelper.trace.data;
        let stackData = [];
        if(this.currentNavigationFunction && this.currentNavigationFunction.entry && this.currentNavigationFunction.entry.timelineIndexes){
            let timelineIndexesLength = this.currentNavigationFunction.entry.timelineIndexes.length;
            let branchIndex = this.currentNavigationFunction.branchIndex;
            if( timelineIndexesLength > 2){
                // lowerBound = this.currentNavigationFunction.entry.timelineIndexes[1];
                // upperBound = timelineIndexesLength > 3? this.currentNavigationFunction.entry.timelineIndexes[timelineIndexesLength - 2]: upperBound;
                lowerBound = this.currentNavigationFunction.entry.timelineIndexes[branchIndex];
                upperBound = timelineIndexesLength > 3? this.currentNavigationFunction.entry.timelineIndexes[branchIndex+1]: upperBound;
            }
        }

        // if(this.currentNavigationDatum && this.currentNavigationDatum.entry && this.currentNavigationDatum.entry.timelineIndexes){
        //     let timelineIndexesLength = this.currentNavigationDatum.entry.timelineIndexes.length;
        //     let branchIndex = this.currentNavigationDatum.branchIndex;
        //     if( timelineIndexesLength > 2){
        //         // lowerBound = this.currentNavigationFunction.entry.timelineIndexes[1];
        //         // upperBound = timelineIndexesLength > 3? this.currentNavigationFunction.entry.timelineIndexes[timelineIndexesLength - 2]: upperBound;
        //         lowerBound = this.currentNavigationDatum.entry.timelineIndexes[branchIndex];
        //         upperBound = timelineIndexesLength > 3? this.currentNavigationDatum.entry.timelineIndexes[branchIndex+1]: upperBound;
        //     }
        // }

        if(!upperBound){
            upperBound = this.traceHelper.getTimeline().length;
        }

        for (let key in stack) {
            if(data[key]){
                let containingBlock = JSON.parse(data[key].id);
                if(containingBlock){
                    let timelineIndexes = null, count = 0;
                    if(containingBlock.type === "FunctionDeclaration" || containingBlock.type === "FunctionExpression"){
                        timelineIndexes = this.getTimelineIndexesByBlockKey(key);
                        count = stack[key];
                    }else{
                        timelineIndexes = this.getTimelineIndexesByBlockKey(key, lowerBound, upperBound);
                        count = timelineIndexes.length - 2;
                    }
                    stackData.push({ blockKey: key, type: containingBlock.type, range: containingBlock.range, blockRange: data[key].range,  timelineIndexes: timelineIndexes, count: count});
                }
            }
        }
        return stackData;
    }

    getTimelineIndexesByBlockKey(key, lowerBound = 0, upperBound = this.timelineLength){
        if(!this.isRepOK()){
	        return [];
	    }

        let timeline = this.traceHelper.trace.timeline;
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
        let traceCollection = this.getNavigationStackBlockCounts();
        let localTraceGutterData = this.extractTraceGutterData(traceCollection);

        if(!navigationDatum){
            this.traceGutterData.maxCount = localTraceGutterData.maxCount;
            this.traceGutterData.rows = localTraceGutterData.rows;
        }else{
            this.pushNavigationData(navigationDatum);
            this.startNavigation();
            this.navigateToBranch();
            for (let rowIndex in localTraceGutterData.rows){
                let rowCount = localTraceGutterData.rows[rowIndex].count;
                if(rowCount && this.traceGutterData.rows[rowIndex]){
                    this.traceGutterData.rows[rowIndex].count = rowCount;
                    this.traceGutterData.rows[rowIndex].branch = Math.min(this.traceGutterData.rows[rowIndex].branch || rowCount, rowCount);
                }
            }
        }
    }

    updateGutterBranches(){
        let traceGutterData = this.getTraceGutterData();
        let navigationData = this.getNavigationData();
        for(let row in traceGutterData.rows){
            if(traceGutterData.rows.hasOwnProperty(row)){
                let count = traceGutterData.rows[row].count;
                if(count != null){
                    traceGutterData.rows[row].branch = count;
                }
                let navigationDatum = navigationData[row];
                if(navigationDatum){
                    traceGutterData.rows[row].count = navigationDatum.entry.count;
                    traceGutterData.rows[row].branch = navigationDatum.brancIndex;
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