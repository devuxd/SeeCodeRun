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
        this.eventAggregator = eventAggregator;
        this.traceModel = new TraceModel();
        this.aceUtils = new AceUtils();
        this.options = [];
        this.selectedFilter = 2;
        this.searchedValue = undefined;
        this.heads = [];
        this.rows = [];
        this.selectedExpressions = [];
        this.searchBox = {
            aceMarkerManager: undefined,
            updateAceMarkers: this.aceUtils.updateAceMarkers,
            updateAceMarkersDelay: 500,
            $searchTerm: undefined,
            $searchFilter: undefined,
            $filteredOptions: undefined,
            $table: undefined,
            markers: undefined,
            searchBoxChanged: undefined,
            updateTable: this.updateTable,
            searchFilters: this.traceModel.traceSearchfilters,
            traceHelper: undefined,
            $searchNumResults: undefined,
            traceSearchEvents: this.traceModel.traceSearchEvents,
            eventAggregator: eventAggregator,
            publishTraceSearchChanged: this.publishTraceSearchChanged,
            publishAceMarkersChanged: this.publishAceMarkersChanged
        };
    }

    attached(aceEditor, $table = $("#traceTable")) {
        let searchBox = this.searchBox;
        searchBox.aceMarkerManager = this.aceUtils.makeAceMarkerManager(aceEditor);
        searchBox.$table = $table;
        searchBox.$searchTerm = $("#searchTerm");
        searchBox.$searchFilter = $("#searchFilter");
        searchBox.$filteredOptions = $("#filteredOptions");
        searchBox.$searchNumResults = $("#resultCount");
        this.searchBox = searchBox;
        for (let filter in searchBox.searchFilters) {
            this.options.push(filter);
        }


        this.subscribe();



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
        this.eventAggregator.subscribe('traceChanged', payload => {
            searchBox.traceHelper = payload.data;
            let variableValues = searchBox.traceHelper.getValues();
            let query = searchBox.traceHelper.traceQueryManager.getQuery(variableValues, this.selectedFilter, this.searchedValue);
            this.updateTable(query);
        });

        this.eventAggregator.subscribe('searchBoxChanged', payload => {
            this.searchedValue = payload.searchTermText;
            let selectedFilter = payload.searchFilterId;

            console.info(this.searchedValue);
            if (searchBox.traceHelper) {
                let variableValues = searchBox.traceHelper.getValues();
                //update table
                let query = searchBox.traceHelper.traceQueryManager.getQuery(variableValues, selectedFilter, this.searchedValue);
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

    updateTable(query) {
        this.heads = [];
        this.heads.push("select");
        for (let key in query.items[0]) {
            if (key !== "range") {
                this.heads.push(key);
            }
        }

        this.rows = [];
        for (let i = 0; i < query.items.length; i++) {
            let contents = {};
            for (let key of this.heads) {
                contents[key] = query.items[i][key];
            }
            contents["range"] = query.items[i]["range"];
            if (contents.value !== undefined) {
                contents["isChecked"] = false;
                this.rows.push(contents);
            }
        }
        this.numberOfResult = this.rows.length;
    }



    filterChanged() {
        this.selectedFilter = this.selectedFilter;
        let searchBox = this.searchBox;
        let selectedFilter = this.selectedFilter;
        let value = searchBox.$searchTerm.val();
        searchBox.publishTraceSearchChanged(value, selectedFilter);
        console.info(this.selectedExpressions);

    }

    addCheckedExpression(row) {
        let target = this.rows[row.$index];
        let exist = this.selectedExpressions.includes(target); //ECMAScript 2016 
        if (!exist) {
            this.selectedExpressions.push(target);
        }
        else {
            this.selectedExpressions = this.selectedExpressions.filter(elem => {
                return elem.range.start.row == target.range.start.row ? elem.range.start.column !== target.range.start.column : true;
            });

        }

        this.publishAceMarkersChanged(this.selectedExpressions);
    }
    showVis() {
        console.info(this.selectedExpressions);
    }
}