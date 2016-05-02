/* global $ */

import {TraceModel} from '../traceService/trace-model';
import {AceUtils} from '../utils/ace-utils';

export class TraceSearch{
    constructor(eventAggregator){
        this.eventAggregator = eventAggregator;
        this.traceModel = new TraceModel();
        this.aceUtils = new AceUtils();
        this.searchBox = {
            aceMarkerManager: undefined,
            updateAceMarkers: this.aceUtils.updateAceMarkers,
            updateAceMarkersDelay: 500,
            $searchTerm: undefined,
            $searchFilter: undefined,
            $filteredOptions: undefined,
            $table : undefined,
            markers: undefined,
            searchBoxChanged: undefined,
            updateTable: this.updateTable,
            searchFilters: this.traceModel.traceSearchfilters,
            traceHelper: undefined,
            $searchNumResults: undefined,
            traceSearchEvents : this.traceModel.traceSearchEvents,
            eventAggregator: eventAggregator,
            publishTraceSearchChanged: this.publishTraceSearchChanged,
            publishAceMarkersChanged: this.publishAceMarkersChanged
        };
    }

    attached(aceEditor, $table = $("#traceTable")){
        let searchBox = this.searchBox;
        
        searchBox.aceMarkerManager = this.aceUtils.makeAceMarkerManager(aceEditor);
        searchBox.$table = $table;
        searchBox.$searchTerm = $("#searchTerm");
        searchBox.$searchFilter = $("#searchFilter");
        searchBox.$filteredOptions = $("#filteredOptions");
        searchBox.$searchNumResults = $("#resultCount");
        
        searchBox.$searchFilter.empty();
        let options ="";
        for (let id in searchBox.searchFilters){
            let value = searchBox.searchFilters[id];
            options += `<option value = "${id}">${value}</option>`;
        }
        searchBox.$searchFilter.append(options);
        
        let searchBoxChanged = function searchBoxChanged(e){
            let selectedFilter = searchBox.$searchFilter.find(":selected").val();
            let value = searchBox.$searchTerm.val();
            
            searchBox.publishTraceSearchChanged(searchBox, value, selectedFilter);
        };
        searchBox.searchBoxChanged = searchBoxChanged;
        searchBox.$searchTerm.change(searchBoxChanged);
        searchBox.$searchFilter.change(searchBoxChanged);
        
        this.subscribe(); 
        
                
    
    }
    
    publishTraceSearchChanged(searchBox, searchTermText, searchFilterId){
        searchBox.eventAggregator.publish(searchBox.traceSearchEvents.searchBoxChanged.event, 
            { searchTermText: searchTermText, searchFilterId: searchFilterId }
        );
    }
    
    publishAceMarkersChanged(searchBox, itemsWithRanges){
        searchBox.eventAggregator.publish(searchBox.traceSearchEvents.aceMarkersChanged.event,
            {items: itemsWithRanges}
        );
    }
    
    subscribe(){
        let searchBox = this.searchBox;
        let traceChangedEvent = this.traceModel.traceEvents.changed.event;
        let searchBoxChangedEvent = this.traceModel.traceSearchEvents.searchBoxChanged.event;
        let searchStateUpdated = this.traceModel.traceSearchEvents.searchStateUpdated.event;
        let aceMarkersChangedEvent = this.traceModel.traceSearchEvents.aceMarkersChanged.event;
        
        this.eventAggregator.subscribe( traceChangedEvent, payload =>{
            searchBox.traceHelper = payload.data;
            searchBox.searchBoxChanged(traceChangedEvent);
            
        });
        
        this.eventAggregator.subscribe( searchBoxChangedEvent, payload =>{
            let value = payload.searchTermText;
            let selectedFilter = payload.searchFilterId;
            
            if(searchBox.traceHelper){
                let variableValues =searchBox.traceHelper.getValues();
                let query = searchBox.traceHelper.traceQueryManager.getQuery(variableValues, selectedFilter, value);
                searchBox.updateTable(searchBox, query);
                
            }
        });
        
        this.eventAggregator.subscribe( searchStateUpdated, payload =>{
            let value = payload.searchTermText;
            let selectedFilter = payload.searchFilterId;
            
            searchBox.$searchTerm.val(value);
            searchBox.$searchFilter.val(selectedFilter);
        });
        
        let updateAceMarkersTimeout;
        let updateAceMarkersSetTimeout = window.setTimeout;
        let updateAceMarkersClearTimeout = window.clearTimeout;
        
        this.eventAggregator.subscribe( aceMarkersChangedEvent, payload =>{
            let items = payload.items;
            updateAceMarkersClearTimeout(updateAceMarkersTimeout);
            updateAceMarkersTimeout = updateAceMarkersSetTimeout(
                searchBox.updateAceMarkers(searchBox.aceMarkerManager, items),
                searchBox.updateAceMarkersDelay);
        });
        
    }
    
    updateTable(searchBox, query){
        
        let $table = searchBox.$table;
        let $numResults = searchBox.$searchNumResults;
        let selectedFilter = searchBox.$searchFilter.find(":selected").val();
        
        if(!$table){
            throw "No table container received.";
        }

        if(!query){
            throw "No query received.";
        }
        
        if(query.count()<1){
            $table.innerHTML = "No Results Found. Try a different Search Term with Filter Option.";
            return;
        }
        let table = "<table>";

        let header ="<tr>";
        let columns = [];
        for(let key in query.items[0]){
            if(key !== "range"){
                header += `<td>${key}</td>`;
                columns[key] = true;
            }
        }
        header += "</tr>";
        
        table += header;
        
        let dataList = [];
        for(let i = 0; i < query.items.length; i++){

            let row = "<tr>";
            for(let key in columns){
                //TODO add tooltip and new css when selected
                let value = query.items[i][key];
                row += `<td>${value}</td>`;
                
                if(selectedFilter === "any" || key === selectedFilter){
                   dataList[value]++;
                }
            }
            row += "</tr>";
            
            table+= row;
         }
        
        table += "</table>";

        searchBox.publishAceMarkersChanged(searchBox, query.items);
        
        searchBox.$filteredOptions.empty();
        let options ="";
        for(let value in dataList){
             options += `<option>${value}</option>`;
        }
        searchBox.$filteredOptions.append(options);
        
        $table.html(table);   
        $numResults.html(`<p>Number of Search Results: ${query.count()}</p>`);
    }
}