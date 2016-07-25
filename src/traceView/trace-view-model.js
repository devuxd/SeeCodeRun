export class TraceViewModel {
    constructor(){
        this.resetData();
    }

    resetData(){
        this.resetTraceGutterData();
        this.resetTraceValuesData();
    }

    isDataModelRepOK(){
	    if(!this.traceValuesData.ranges){
		    return false;
		}

		if(!this.traceHelper){
		    return false;
		}
		return true;
	}

    getExpressionAtPosition(mousePosition){
        if(this.isDataModelRepOK()){
            return this.traceHelper.getExpressionAtPosition(this.traceHelper.getTimeline(), mousePosition);
        }
        return undefined;
    }

    updateTraceGutterRowCount(localTraceGutterData){
        for (let rowIndex in localTraceGutterData.rows){
            let rowCount = localTraceGutterData.rows[rowIndex].count;
            if(rowCount && this.traceGutterData.rows[rowIndex]){
                this.traceGutterData.rows[rowIndex].count = rowCount;
                this.traceGutterData.rows[rowIndex].branch = rowCount;
            }
        }
    }


    updateTraceGutterData(traceCollection){
        let localTraceGutterData = this.extractTraceGutterData(traceCollection);
        this.traceGutterData.maxCount = localTraceGutterData.maxCount;
        this.traceGutterData.rows = localTraceGutterData.rows;
    }

    resetTraceGutterData(){
        if(!this.traceGutterData){
            this.traceGutterData = {  maxCount : 0, rows : []  };
            return;
        }
        this.traceGutterData.maxCount = 0;
        this.traceGutterData.rows = [];
    }

    resetTraceValuesData(){
        if(!this.traceValuesData){
            this.traceValuesData = { ranges: [] };
            return;
        }

        this.traceValuesData.ranges = [];
    }

    extractTraceGutterData(trace){
	    let result = {  maxCount : 0, rows : []  };
        for (let i = 0; i < trace.length; i ++) {
            let entry = trace[i];
			let row = entry.range.start.row;

			if(!result.rows.hasOwnProperty(row)){
                result.rows[row] = {entry: entry, count: entry.count, entryText: `Block executed ${entry.count} time(s)`};
			}

            if(result.maxCount< entry.count){
                result.maxCount = entry.count;
            }
        }
        return result;
	}

	extractStackTraceGutterData(trace){
	    let result = {  maxCount : 0, rows : []  };
        for (let i = 0; i < trace.length; i ++) {
            let entry = trace[i];
			let row = entry.range.start.row;

			if(!result.rows.hasOwnProperty(row)){


                result.rows[row] = {count: entry.count, entryText: `Block executed ${entry.count} time(s)`, text: entry};
			}

            if(result.maxCount< entry.count){
                result.maxCount = entry.count;
            }
        }
        return result;
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
        return row && this.traceGutterData.rows[row];
    }

    isTraceGutterDataValid(){
        return this.traceGutterData && this.traceGutterData.rows;
    }

    setTraceValuesDataRanges(rangesCollection){
        this.traceValuesData.ranges = rangesCollection;
    }

}
