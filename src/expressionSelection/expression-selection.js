


export class ExpressionSelection {

    constructor(eventAggregator) {

        this.ea = eventAggregator;
        //  this.subscribe();
    }




    subscribe() {

        this.ea.subscribe('onCursorMoved', payload => {

            console.info(payload.position);
        });

        this.ea.subscribe('onEditorHover', payload => {

                console.info(payload.position);
        });


    }
    
    
    publish(){
        
        
         this.eventAggregator.publish('aceMarkersChanged', {
            // items: itemsWithRanges
        });
    }


}
