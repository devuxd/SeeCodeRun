export class ExpressionSelection {

    constructor(eventAggregator) {

        this.ea = eventAggregator;
        // this.subscribe();
    }




    subscribe() {

        this.ea.subscribe('onCursorMoved', payload => {

            console.info(payload.position);
        });
    
        this.ea.subscribe('onEditorHover', payload =>{
            
            if(payload.position.isEnd)
            console.info(payload.position);
        });
        
    }


}
