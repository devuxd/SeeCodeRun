
export class TraceSearchHistory {
    constructor(eventAggregator, firebaseManager) {
        this.eventAggregator = eventAggregator;
        this.firebaseManager = firebaseManager;
        this.data = undefined;
    }

    attached() {
        this.firebase = this.firebaseManager.makeTraceSearchHistoryFirebase();

        let traceSearchHistory= this;

        this.firebase.on("value", function(snapshot) {
            let data = snapshot.val();

            if(data){
                 traceSearchHistory.eventAggregator.publish("searchBoxChanged", data);
            }

        });

        this.subscribe();
    }

    subscribe() {
        let eventAggregator = this.eventAggregator;

        eventAggregator.subscribe("searchBoxChanged", payload => {
            let searchTermText = payload.searchTermText;
            let searchFilterId = payload.searchFilterId;
            this.firebase.update({
                searchFilterId: searchFilterId,
                searchTermText: searchTermText
            });
        });
    }

}
