/* global Firepad */
/* global Firebase */
/* global ace */
/* global $ */

import {
    TraceModel
}
from '../traceService/trace-model';

export class TraceSearchHistory {
    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
        this.traceModel = new TraceModel();
        this.baseURL = 'https://seecoderun.firebaseio.com';
        this.data = undefined;
    }

    attached(params) {

        if (params.id) {
            this.pastebinId = params.id;
        }

        //New Firebase visualisation Reference
        this.firebase = new Firebase(this.baseURL + '/' + this.pastebinId + '/content/search');

        this.subscribe();


        // Retrieve.

    }



    subscribe() {
        let eventAggregator = this.eventAggregator;
        let searchBoxChangedEvent = this.traceModel.traceSearchEvents.searchBoxChanged.event;
        let traceSearchHistory= this;

        this.firebase.on('value', function(snapshot) {
            let data = snapshot.val();
            console.info(`${data.searchFilterId} inside subscribe firebase`);
            console.info(`${data.searchTermText} inside subscribe firebase`);

            // Publishing an event for searchBox;
            traceSearchHistory.publish(data);
        });



        eventAggregator.subscribe(searchBoxChangedEvent, payload => {
            let searchTermText = payload.searchTermText;
            let searchFilterId = payload.searchFilterId;
            console.info(`${searchTermText} inside subscribe searchBoxChangedEvent`);
            console.info(`${searchFilterId} inside subscribe searchBoxChangedEvent`);
            //Store values
            this.firebase.update({
                searchFilterId: searchFilterId,
                searchTermText: searchTermText
            });
        });
    }




    publish(data) {
        let searchBoxChangedEvent = this.traceModel.traceSearchEvents.searchBoxChanged.event;

        this.eventAggregator.publish(searchBoxChangedEvent, data);
        this.eventAggregator.publish("traceSearchHistory", data);
    }
}