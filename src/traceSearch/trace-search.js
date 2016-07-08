/* global $*/
export class TraceSearch {
    constructor(eventAggregator, traceModel ,aceUtils) {
        this.eventAggregator = eventAggregator;
        this.traceModel = traceModel;
        this.aceUtils = aceUtils;
        this.options;
        this.selectedFilter = "any";
        this.searchedValue = "";
        this.rows = [];
        this.filteredOptions = [];
        this.selectedExpressions = [];
        this.noResult = false;
        this.noSearchYet = true;
        this.suggestionMessage = '';
        this.test='';
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
        this.eventAggregator.publish("searchBoxChanged", {
            searchTermText: searchTermText,
            searchFilterId: searchFilterId
        });
    }

    publishAceMarkersChanged(itemsWithRanges) {
        this.eventAggregator.publish("aceMarkersChanged", {
            items: itemsWithRanges
        });
    }

    subscribe() {
        let searchBox = this.searchBox;

        this.eventAggregator.subscribe("jsEditorReady", editor => {
            this.searchBox.aceMarkerManager = this.aceUtils.makeAceMarkerManager(editor);
        });


        this.eventAggregator.subscribe("traceChanged", payload => {
            searchBox.traceHelper = payload.data;
            if(searchBox.traceHelper.isValid()){
                let variableValues = searchBox.traceHelper.getValues();
                let query = searchBox.traceHelper.traceQueryManager.getQuery(variableValues, this.selectedFilter, this.searchedValue);
                this.updateTable(query);
            }
        });

        this.eventAggregator.subscribe("searchBoxChanged", payload => {
            this.searchedValue = payload.searchTermText;
            this.selectedFilter = payload.searchFilterId;

            if (searchBox.traceHelper) {
                let variableValues = searchBox.traceHelper.getValues();
                let query = searchBox.traceHelper.traceQueryManager.getQuery(variableValues, this.selectedFilter, this.searchedValue);
                this.updateTable(query);
            }
        });

        let updateAceMarkersTimeout;
        let updateAceMarkersSetTimeout = window.setTimeout;
        let updateAceMarkersClearTimeout = window.clearTimeout;

        this.eventAggregator.subscribe("aceMarkersChanged", payload => {
            let items = payload.items;
            updateAceMarkersClearTimeout(updateAceMarkersTimeout);
            updateAceMarkersTimeout = updateAceMarkersSetTimeout(
                searchBox.updateAceMarkers(searchBox.aceMarkerManager, items),
                searchBox.updateAceMarkersDelay);
        });

    }

    optionsBuilder() {
            this.options= this.searchBox.searchFilters;
    }

    updateTable(query) {
        if(!$("#traceSearchPanelBody").is(":visible")){
              $("#traceSearchPanelHeading").click();
        }
        let selectedFilter = this.selectedFilter;
        let dataList = [];
        this.rows = query.where( function whereFilter(row) {
            if(row[selectedFilter]){
                dataList.push(row[selectedFilter]);
            }
            return row.value !== undefined;
        }).items;

        this.filteredOptions =new Set(dataList);

        this.numberOfResult = this.rows.length;
        this.suggestionMessage = this.numberOfResult == 0 ?
                                'There is no javascript code.Try to write some and then comeback here :)':
                                `Type any expression to see its value. Try ${this.rows[0].id} or ${this.rows[0].value}`;

        this.noSearchYet = this.searchedValue.replace(/^\s+|\s+$/g, '') == "";
        this.noResult = this.numberOfResult == 0 && !this.noSearchYet;
        this.errorMessage = `Oops, no results found for "${this.searchedValue}" with "${this.selectedFilter}" filter. Remember, the search term is case sensitive.`;
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
        if(!this.clickedRow){
            this.publishAceMarkersChanged([]);
            return;
        }
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
        let lineData = {lineNumber: this.rows[row.$index].range.start.row+1};
        this.eventAggregator.publish("traceSearchGotoLine", lineData);
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