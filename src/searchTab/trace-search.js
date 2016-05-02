/* global Firepad */
/* global Firebase */
/* global ace */
/* global $ */
import {
    TraceModel
}
from '../traceService/trace-model';
import {
    AceUtils
}
from '../utils/ace-utils';
export class TraceSearch {
    constructor(eventAggregator) {
        this.clickedRow = [];
        this.eventAggregator = eventAggregator;
        this.traceModel = new TraceModel();
        this.aceUtils = new AceUtils();
        this.options = [];
        this.selectedFilter = '';
        this.searchedValue = '';
        this.heads = [];
        this.rows = [];
        this.selectedExpressions = [];
        this.noResult = false;
        this.noSearchYet = true;
        this.searchBox = {
            aceMarkerManager: undefined,
            updateAceMarkers: this.aceUtils.updateAceMarkers,
            updateAceMarkersDelay: 500,
            searchFilters: this.traceModel.traceSearchfilters,
            traceHelper: undefined,
        };
        this.subscribe();

    }

    attached() {
        this.optionsBuilder();
    }

    publishTraceSearchChanged(searchTermText, searchFilterId) {
        this.eventAggregator.publish('searchBoxChanged', {
            searchTermText: searchTermText,
            searchFilterId: searchFilterId
        });
    }

    publishAceMarkersChanged(itemsWithRanges) {
        this.eventAggregator.publish('aceMarkersChanged', {
            items: itemsWithRanges
        });
    }

    subscribe() {
        let searchBox = this.searchBox;

        this.eventAggregator.subscribe("onEditorReady", editor => {
            this.searchBox.aceMarkerManager = this.aceUtils.makeAceMarkerManager(editor);
        });


        this.eventAggregator.subscribe('traceChanged', payload => {
            searchBox.traceHelper = payload.data;
            let variableValues = searchBox.traceHelper.getValues();
            let query = searchBox.traceHelper.traceQueryManager.getQuery(variableValues, this.selectedFilter, this.searchedValue);
            this.updateTable(query);
        });

        this.eventAggregator.subscribe('searchBoxChanged', payload => {
            this.searchedValue = payload.searchTermText;
            this.selectedFilter = payload.searchFilterId;

            if (searchBox.traceHelper) {
                let variableValues = searchBox.traceHelper.getValues();
                //update table
                let query = searchBox.traceHelper.traceQueryManager.getQuery(variableValues, this.selectedFilter, this.searchedValue);
                this.updateTable(query);
            }
        });

        let updateAceMarkersTimeout;
        let updateAceMarkersSetTimeout = window.setTimeout;
        let updateAceMarkersClearTimeout = window.clearTimeout;

        this.eventAggregator.subscribe('aceMarkersChanged', payload => {
            let items = payload.items;
            updateAceMarkersClearTimeout(updateAceMarkersTimeout);
            updateAceMarkersTimeout = updateAceMarkersSetTimeout(
                searchBox.updateAceMarkers(searchBox.aceMarkerManager, items),
                searchBox.updateAceMarkersDelay);
        });

    }

    optionsBuilder() {

        for (let filter in this.searchBox.searchFilters) {
            this.options.push(filter);
        }
    }

    updateTable(query) {
        this.heads = [];
        for (let head in query.items[0]) {
            if (head !== "range") {
                this.heads.push(head);
            }
        }
        this.rows = query.items.filter(row => {
            return row.value !== undefined; //This line removes rows with undefined value. TODO: Do not inculde undefined vaules in the trace.  
        });

        this.numberOfResult = this.rows.length;
        this.noSearchYet = this.searchedValue.replace(/^\s+|\s+$/g, '') == "";
        this.noResult = this.numberOfResult == 0 && !this.noSearchYet;

    }

    filterChanged() {
        this.publishTraceSearchChanged(this.searchedValue, this.selectedFilter);

    }

    doMouseOver(row) {
        if(this.selectedExpressions.indexOf(this.rows[row.$index])==-1)
            this.selectedExpressions.push(this.rows[row.$index]);
        this.publishAceMarkersChanged(this.selectedExpressions);
    }

    doMouseOut(row) {
        let indexFound2 = this.clickedRow.indexOf(this.rows[row.$index]);
        if(indexFound2==-1){
            let indexFound = this.selectedExpressions.indexOf(this.rows[row.$index]);
            this.selectedExpressions.splice(indexFound, 1);
        }
        this.publishAceMarkersChanged(this.selectedExpressions);
    }
    
    keyPressed() {
        this.publishTraceSearchChanged(this.searchedValue, this.selectedFilter);
    }
    // jumps to current line in the editor
    doOnClickJumpToCode(row) {
        let editor = ace.edit('aceJsEditorDiv');
        editor.gotoLine(this.rows[row.$index].range.start.row+1);
        
    }
    // highlights current line in the ditor
    doOnClickHighlight(row){
        let indexFound = this.clickedRow.indexOf(this.rows[row.$index]);
        if(indexFound==-1){
            this.clickedRow.push(this.rows[row.$index]);
        }
        else{
            this.clickedRow.splice(indexFound, 1);
        }
    }
}