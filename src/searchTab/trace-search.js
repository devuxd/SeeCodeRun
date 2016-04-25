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
        this.heads=[];
        this.rows = new Map();
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
    publishAceMarkersChanged( itemsWithRanges) {
        this.eventAggregator.publish('aceMarkersChanged', {
            items: itemsWithRanges
        });
    }

    subscribe() {
        let searchBox = this.searchBox;
       
        this.eventAggregator.subscribe('traceChanged', payload => {
            searchBox.traceHelper = payload.data;
        //   searchBox.searchBoxChanged('traceChanged');
        });

        this.eventAggregator.subscribe('searchBoxChanged', payload => {
            let value = payload.searchTermText;
            let selectedFilter = payload.searchFilterId;
            //alert(value);

            if (searchBox.traceHelper) {
                let variableValues = searchBox.traceHelper.getValues();
              //update ta
               let query = searchBox.traceHelper.traceQueryManager.getQuery(variableValues, selectedFilter, value);
            //   console.info(query.item[0]);
               this.updateTable(searchBox,query);
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

    updateTable(searchBox, query) {

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
            
            this.heads=[];
            for(let key in query.items[0]){
                if(key !== "range"){
                   
                   
                    this.heads.push(key);
                    // header += `<td>${key}</td>`;
                    // columns[key] = true;
                }
            }
            // console.info(this.heads);
        //     header += "</tr>";

        //     table += header;

        //     let dataList = [];
          

            for(let i = 0; i < query.items.length; i++){
                let contents ={};
                for(let key of this.heads){
        //             //TODO add tooltip and new css when selected
        //             let value = query.items[i][key];
        //             row += `<td>${value}</td>`;
                    contents[key] =query.items[i][key];
        //             if(selectedFilter === "any" || key === selectedFilter){
        //               dataList[value]++;
        //             }
        //         }
        //         row += "</tr>";

        //         table+= row;
             }
             console.info("Hello");
                this.rows.set(i,contents);

            }
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
    
        
        this.numberOfResult=this.rows.size;
    }
                // console.info(this.rows);

    

    filterChanged() {
        this.selectedFilter= this.selectedFilter;
        // console.info(this.selectedFilter);
        let searchBox = this.searchBox;
         let selectedFilter = this.selectedFilter
        // console.info(`First ${selectedFilter}`)
       

            let value = searchBox.$searchTerm.val();
            // console.info(`Second  ${selectedFilter}`)

            searchBox.publishTraceSearchChanged(value, selectedFilter);
        
       

    }

}