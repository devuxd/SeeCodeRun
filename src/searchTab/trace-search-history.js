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
            traceSearchHistory.publish(data);
        });

        this.subscribe();
    }

    subscribe() {
        let eventAggregator = this.eventAggregator;
        let searchBoxChangedEvent = this.traceModel.traceSearchEvents.searchBoxChanged.event;
        
        eventAggregator.subscribe(searchBoxChangedEvent, payload => {
            let searchTermText = payload.searchTermText;
            let searchFilterId = payload.searchFilterId;
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