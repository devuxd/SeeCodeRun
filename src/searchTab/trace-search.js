/* global Firepad */
/* global Firebase */
/* global ace */
/* global $ */
import {TraceModel}from '../traceService/trace-model';
import {AceUtils}from '../utils/ace-utils';
export class TraceSearch {
    constructor(eventAggregator, element) {
        this.eventAggregator = eventAggregator;
        this.element = element;
        this.traceModel = new TraceModel();
        this.aceUtils = new AceUtils();
        this.options = [];
        this.selectedFilter = 2;
        this.searchedValue = undefined;
        this.heads = [];
        this.rows = [];
        this.selectedExpressions = [];
        this.noResult = false;
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
                this.rows.push(contents);
            }
        }
        this.numberOfResult = this.rows.length;
        this.noResult = this.numberOfResult == 0 ? true : false;
    }
    
    filterChanged() {
        let value = this.searchBox.$searchTerm.val();
        this.searchBox.publishTraceSearchChanged(value, this.selectedFilter);
    }

    doMouseOver(row) {
        let target = this.rows[row.$index];
        this.selectedExpressions.push(target);
        this.publishAceMarkersChanged(this.selectedExpressions);
    }

    doMouseOut() {
        this.selectedExpressions.pop();
        this.publishAceMarkersChanged(this.selectedExpressions);
    }
    
    keyPressed() {
        let value = this.searchBox.$searchTerm.val();
        this.searchBox.publishTraceSearchChanged(value, this.selectedFilter);
    }
}