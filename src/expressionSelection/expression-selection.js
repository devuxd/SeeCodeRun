export class ExpressionSelection {

    constructor(eventAggregator) {

        this.ea = eventAggregator;
        this.expression=[];
        this.subscribe();
        
    }




    subscribe() {

        // this.ea.subscribe('onCursorMoved', payload => {

        //     console.info(this.traceHelper.getMatchAtPosition(payload.position));
        // });

        // this.ea.subscribe('onEditorHover', payload => {

        //     // console.info(payload.position);
        // });


        // this.ea.subscribe("traceChanged", payload => {
        //     this.traceHelper = payload.data;
        // });
        
    //     this.ea.subscribe("onExpressionHover", payload => {
    //       this.publish(payload); 
           
    //     });
        
    //     this.ea.subscribe("onEditorClick", () =>{
    //       let target = this.expression[0];
    //         if(target)
    //           console.log(target);
    //     });

    // }


    // publish(target) {
    //      this.expression.pop();
    //      if(target)
    //      this.expression.push(target);
           
    //     this.ea.publish('aceMarkersChanged', {
    //         items: this.expression
    //     });
    
    }


}
