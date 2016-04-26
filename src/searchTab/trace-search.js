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
        // searchBox.$searchFilter.empty();

        for (let filter in searchBox.searchFilters) {
            // let value = searchBox.searchFilters[id];
            // options += `<option value = "${id}">${value}</option>`;

            // console.info(filter);
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
            //   searchBox.searchBoxChanged('traceChanged');
            let variableValues = searchBox.traceHelper.getValues();

            let query = searchBox.traceHelper.traceQueryManager.getQuery(variableValues, this.selectedFilter, this.searchedValue);

            this.updateTable(query);
        });

        this.eventAggregator.subscribe('searchBoxChanged', payload => {
            this.searchedValue = payload.searchTermText;
            let selectedFilter = payload.searchFilterId;
            //alert(value);

            console.info(this.searchedValue);
            if (searchBox.traceHelper) {
                let variableValues = searchBox.traceHelper.getValues();
                //update ta
                let query = searchBox.traceHelper.traceQueryManager.getQuery(variableValues, selectedFilter, this.searchedValue);
                //   console.info(query.item[0]);
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

            //     let $table = searchBox.$table;
            //     let $numResults = searchBox.$searchNumResults;
            // let selectedFilter = this.selectedFilter;

            //     if(!$table){
            //         throw "No table container received.";
            //     }

            //     if(!query){
            //         throw "No query received.";
            //     }

            //     if(query.count()<1){
            //         $table.innerHTML = "No Results Found. Try a different Search Term with Filter Option.";
            //         return;
            //     }
            //     let table = "<table>";

            // let header ="<tr>";

            this.heads = [];
            this.heads.push("select");
            for (let key in query.items[0]) {
                if (key !== "range") {


                    this.heads.push(key);
                    // header += `<td>${key}</td>`;
                    // columns[key] = true;
                }
            }
            // console.info(this.heads);
            //     header += "</tr>";

            //     table += header;

            //     let dataList = [];

            this.rows = [];
            for (let i = 0; i < query.items.length; i++) {
                let contents = {};
                for (let key of this.heads) {
                    //             //TODO add tooltip and new css when selected
                    //             let value = query.items[i][key];
                    //             row += `<td>${value}</td>`;

                    contents[key] = query.items[i][key];
                    //             if(selectedFilter === "any" || key === selectedFilter){
                    //               dataList[value]++;
                    //             }
                    //         }
                    //         row += "</tr>";

                    //         table+= row;
                }
                contents["range"] = query.items[i]["range"];
                if (contents.value !== undefined) {
                    contents["isChecked"] = false;
                    this.rows.push(contents);

                }

            }

            // console.info(query.items);
            //     table += "</table>";

            //   searchBox.publishAceMarkersChanged(searchBox, query.items);

            //     searchBox.$filteredOptions.empty();
            //     let options ="";
            //       for(let value  of this.rows.values()){
            //           options += `<option>${value}</option>`;

            //           console.info(value);
            //   }
            //     searchBox.$filteredOptions.append(options);

            //     $table.html(table);   
            //     $numResults.html(`<p>Number of Search Results: ${query.count()}</p>`);


            this.numberOfResult = this.rows.length;
            
            // this.selectedExpressions.forEach()
            // this.publishAceMarkersChanged(this.selectedExpressions);

        }
        // console.info(this.rows);



    filterChanged() {
        this.selectedFilter = this.selectedFilter;
        // console.info(this.selectedFilter);
        let searchBox = this.searchBox;
        let selectedFilter = this.selectedFilter;
        // console.info(`First ${selectedFilter}`)


        let value = searchBox.$searchTerm.val();
        // console.info(`Second  ${selectedFilter}`)

        searchBox.publishTraceSearchChanged(value, selectedFilter);
        console.info(this.selectedExpressions);


    }
    addCheckedExpression(rows) {
        let target = this.rows[rows.$index];
        // console.log("Target Object");
        // console.log(target);


        let exist = this.selectedExpressions.includes(target); //ECMAScript 2016 
        if (!exist) {
            this.selectedExpressions.push(target);
            // console.info("Object added");
            // console.info(target);
        }
        else {
            this.selectedExpressions = this.selectedExpressions.filter(elem => {
                return elem.range.start.row == target.range.start.row ? elem.range.start.column !== target.range.start.column : true;
            });

            // console.info("Object deleted");
            // console.info(this.selectedExpressions);

        }
        // console.info(this.isChecked);

        this.publishAceMarkersChanged(this.selectedExpressions);


    }
    showVis(){
        
        console.info(this.selectedExpressions);
    }

}