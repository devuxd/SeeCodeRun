/* global Firebase */

export class TraceSearchHistory {
    constructor(eventAggregator, traceModel) {
        this.eventAggregator = eventAggregator;
        this.traceModel = traceModel;
        this.baseURL = 'https://seecoderun.firebaseio.com';
        this.data = undefined;
    }

    attached(params) {
        if (params.id) {
            this.pastebinId = params.id;
        }
        
        this.firebase = new Firebase(this.baseURL + '/' + this.pastebinId + '/content/search');
        
        let traceSearchHistory= this;

        this.firebase.on('value', function(snapshot) {
            let data = snapshot.val();
            // console.info(`${data.searchFilterId} inside subscribe firebase`);
            // console.info(`${data.searchTermText} inside subscribe firebase`);
            console.info(data);
            // Publishing an event for searchBox;
            if(data != null)
            eventAggregator.publish(searchBoxChangedEvent, data);

        });

        this.subscribe();
    }

    subscribe() {
        let eventAggregator = this.eventAggregator;
        let searchBoxChangedEvent = this.traceModel.traceSearchEvents.searchBoxChanged.event;
        
        eventAggregator.subscribe(searchBoxChangedEvent, payload => {
            let searchTermText = payload.searchTermText;
            let searchFilterId = payload.searchFilterId;
            // console.info(`${searchTermText} inside subscribe searchBoxChangedEvent`);
            // console.info(`${searchFilterId} inside subscribe searchBoxChangedEvent`);
            //Store values
            this.firebase.update({
                searchFilterId: searchFilterId,
                searchTermText: searchTermText
            });
        });
    }

    publish(data) {
        let searchStateUpdated = this.traceModel.traceSearchEvents.searchStateUpdated.event;
        this.eventAggregator.publish(searchStateUpdated, data);
    }
}