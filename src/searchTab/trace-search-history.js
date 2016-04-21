/* global Firepad */
/* global Firebase */
/* global ace */
/* global $ */

import {TraceModel} from '../traceService/trace-model';

export class TraceSearchHistory {
	 constructor(eventAggregator){
        this.eventAggregator = eventAggregator;
        this.traceModel = new TraceModel();
        this.baseURL = 'https://seecoderun.firebaseio.com';
	 }
	 
    attached(params){
    
    if (params.id) {
      this.pastebinId = params.id;
    }

        //New Firebase visualisation Reference
        this.firebase = new Firebase(this.baseURL + '/' + this.pastebinId + '/content/search');
     
        
        this.subscribe();        
        
    // Retrieve.
            this.firebase.limitToLast(1).on('child_added', function(snapshot) {
    
    //GET DATA
            let data = snapshot.val();
            console.info(data.filter);
            console.info(data.searchterm);
   

            });

    }
    

subscribe(){

let searchBoxChangedEvent = this.traceModel.traceSearchEvents.searchBoxChanged.event;

        this.eventAggregator.subscribe( searchBoxChangedEvent, payload =>{
            let value = payload.searchTermText;
            let selectedFilter = payload.searchFilterId;
            alert(value);
            alert(selectedFilter);
             //Store values
                this.firebase.push({
                    filter: selectedFilter,
                searchterm: value
                        });
        });
            }
            
	
}