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
    constructor(eventAggregator, element) {
        this.eventAggregator = eventAggregator;
        this.element = element;
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
    }

    attached(aceEditor) {
        let searchBox = this.searchBox;
        searchBox.aceMarkerManager = this.aceUtils.makeAceMarkerManager(aceEditor);
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
        this.noSearchYet = this.searchedValue.replace(/^\s+|\s+$/g, '')=="";
        this.noResult = this.numberOfResult == 0 && !this.noSearchYet ;

    }

    filterChanged() {
        this.publishTraceSearchChanged(this.searchedValue, this.selectedFilter);

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
        this.publishTraceSearchChanged(this.searchedValue, this.selectedFilter);
    }
}