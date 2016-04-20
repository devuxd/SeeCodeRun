/* global Firepad */
/* global Firebase */
/* global ace */
/* global $ */


import {TraceModel} from '../traceService/trace-model';

export class TraceSearch{
    
    constructor(eventAggregator, $table){
        
        this.baseURL = 'https://seecoderun.firebaseio.com';
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
            traceHelper: undefined,
            $searchNumResults: undefined,
            traceSearchEvents : this.traceModel.traceSearchEvents,
            eventAggregator: eventAggregator,
            publishTraceSearchChanged: this.publishTraceSearchChanged

        };
    }
  
    activate(params) {
    if (params.id) {
      this.pastebinId = params.id;
    }
    else {
      let firebase = new Firebase(this.baseURL);
      this.pastebinId = firebase.push().key();
    }
    }
 
 
    attached(params){
    
    if (params.id) {
      this.pastebinId = params.id;
    }

        //New Firebase visualisation Reference
        this.firebase = new Firebase(this.baseURL + '/' + this.pastebinId + '/content/search');
     
        let searchBox = this.searchBox;
        
        searchBox.$searchTerm = $("#searchTerm");
        searchBox.$searchFilter = $("#searchFilter");
        searchBox.$searchNumResults = $("#numResultCount");
        
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
            
            searchBox.publishTraceSearchChanged(searchBox, value, selectedFilter);
        };
        searchBox.searchBoxChanged = searchBoxChanged;
        searchBox.$searchTerm.change(searchBoxChanged);
        searchBox.$searchFilter.change(searchBoxChanged);
        
        this.subscribe(); 
        
            // Retrieve.
            this.firebase.limitToLast(1).on('child_added', function(snapshot) {
                //GET DATA
            var data = snapshot.val();
            console.info(data.filter);
            console.info(data.searchterm);
                });    
    
    }
    
    publishTraceSearchChanged(searchBox, searchTermText, searchFilterId){
        searchBox.eventAggregator.publish(searchBox.traceSearchEvents.searchBoxChanged.event, 
            { searchTermText: searchTermText, searchFilterId: searchFilterId }
        );
    }
    subscribe(){
        let searchBox = this.searchBox;
        let traceChangedEvent = this.traceModel.traceEvents.changed.event;
        let searchBoxChangedEvent = this.traceModel.traceSearchEvents.searchBoxChanged.event;
        
        this.eventAggregator.subscribe( traceChangedEvent, payload =>{
            searchBox.traceHelper = payload.data;
            searchBox.searchBoxChanged(traceChangedEvent);
        });
        
        this.eventAggregator.subscribe( searchBoxChangedEvent, payload =>{
            let value = payload.searchTermText;
            let selectedFilter = payload.searchFilterId;
                
                //Store values
                this.firebase.push({
                    filter: selectedFilter,
                searchterm: value
                        });

                
                if(searchBox.traceHelper){
                let variableValues =searchBox.traceHelper.getValues();
                let query = searchBox.traceHelper.traceQueryManager.getQuery(variableValues, selectedFilter, value);
                searchBox.updateTable(searchBox, query);
            }
        });
    }
    
    updateTable(searchBox, query){
                let $table = searchBox.$table;
                
                let $numResults = searchBox.$searchNumResults;
                
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
                $numResults.html("<p>Number of Search Results: "+query.count()+"</p>");
    }
    
 
}