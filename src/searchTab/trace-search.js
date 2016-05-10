
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

        this.eventAggregator.subscribe("onEditorReady", editor => {
            this.searchBox.aceMarkerManager = this.aceUtils.makeAceMarkerManager(editor);
        });


        this.eventAggregator.subscribe("traceChanged", payload => {
            searchBox.traceHelper = payload.data;
            let variableValues = searchBox.traceHelper.getValues();
            let query = searchBox.traceHelper.traceQueryManager.getQuery(variableValues, this.selectedFilter, this.searchedValue);
            this.updateTable(query);
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
        let target = this.rows[row.$index];
        this.selectedExpressions.push(target);
        this.publishAceMarkersChanged(this.selectedExpressions);
    }

    doMouseOut() {
        this.selectedExpressions=[];
        this.publishAceMarkersChanged(this.selectedExpressions);
    }

    keyPressed() {
        this.publishTraceSearchChanged(this.searchedValue, this.selectedFilter);
    }
}