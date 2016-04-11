/* global $ */
import {TraceModel} from '../traceService/trace-model';

export class TraceSearch{
    constructor(eventAggregator, $table){
        this.$table = $table;
        this.eventAggregator = eventAggregator;
        this.traceModel = new TraceModel();
        this.searchBox = {
            $searchTerm: undefined,
            $searchFilter: undefined,
            $table : $table,
            searchBoxChanged: undefined,
            updateTable: this.updateTable,
            searchFilters: this.traceModel.traceSearchfilters,
            traceHelper: undefined
        };
    }


    attached(){
        let searchBox = this.searchBox;
        
        searchBox.$searchTerm = $("#searchTerm");
        searchBox.$searchFilter = $("#searchFilter");
        
        if(this.$table){
            searchBox.$table = this.$table;
        }else{
            searchBox.$table = $("#traceTable");
        }
        
        searchBox.$searchFilter.empty();
        let options ="";
        for (let id in searchBox.searchFilters){
            let value = searchBox.searchFilters[id];
            options += `<option value="${id}">${value}</option>`;
        }
        searchBox.$searchFilter.append(options);
        
        let searchBoxChanged = function searchBoxChanged(e){
            let selectedFilter = searchBox.$searchFilter.find(":selected").val();
            let value = searchBox.$searchTerm.val();
            
            if(searchBox.traceHelper){
                let variableValues =searchBox.traceHelper.getValues();
                let query = searchBox.traceHelper.traceQueryManager.getQuery(variableValues, selectedFilter, value);
                searchBox.updateTable(searchBox, query);
            }
        };
        searchBox.searchBoxChanged = searchBoxChanged;
        searchBox.$searchTerm.change(searchBoxChanged);
        searchBox.$searchFilter.change(searchBoxChanged);
        
       this.subscribe(); 
    }
    subscribe(){
        let searchBox = this.searchBox;
        let traceChangedEvent = this.traceModel.traceEvents.changed.event;
        this.eventAggregator.subscribe( traceChangedEvent, payload =>{
            searchBox.traceHelper = payload.data;
            searchBox.searchBoxChanged(traceChangedEvent);
        });
    }

    
    updateTable(searchBox, query){
                let $table = searchBox.$table;
                
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
                let table = `<table border="1">`;

                let header ="<tr>";
                for(let key in query.items[0]){
                    header += `<td>${key}</td>`;
                }
                header += "</tr>";
                
                table += header;
                
                for(let i = 0; i < query.items.length; i++){
                    
                    let row = "<tr>";
                    for(let key in query.items[i]){
                        row += `<td>${JSON.stringify(query.items[i][key])}</td>`;
                    }
                    row += "</tr>";
                    
                    table+= row;
                 }
                
                table += "</table>";
                $table.html(table);                
    }
    
  
}