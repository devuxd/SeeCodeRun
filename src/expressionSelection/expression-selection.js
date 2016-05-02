export class ExpressionSelection {

    constructor(eventAggregator) {

        this.ea = eventAggregator;
        this.selectedExpressions = [];
        this.subscribe();
        this.currentTarget;
        this.previousTarget;
        this.click = false;
        this.publish = false;

    }





    subscribe() {

        // this.ea.subscribe('onCursorMoved', payload => {

        //     console.info(this.traceHelper.getMatchAtPosition(payload.position));
        // });

        // this.ea.subscribe('onEditorHover', payload => {

        //     // console.info(payload.position);
        // });



        //       let target = this.rows[row.$index];
        //     let exist = this.selectedExpressions.includes(target); //ECMAScript 2016 
        //     if (!exist) {
        //         this.selectedExpressions.push(target);
        //     }
        //     else {
        //         this.selectedExpressions = this.selectedExpressions.filter(elem => {
        //             return elem.range.start.row == target.range.start.row ? elem.range.start.column !== target.range.start.column : true;
        //         });

        //     }

        //     this.publishAceMarkersChanged(this.selectedExpressions);
        // }

        // this.ea.subscribe("traceChanged", payload => {
        //     this.traceHelper = payload.data;
        // });

        this.ea.subscribe("onExpressionHover", payload => {
            this.currentTarget = payload;
            this.setMarker(payload);
        });

        this.ea.subscribe("onEditorClick", () => {
            // if (this.currentTarget) {
            //     let exist = this.selectedExpressions.filter(elem => {
            //         return elem.range.start.row == this.currentTarget.range.start.row ? elem.range.start.column == this.currentTarget.range.start.column : false;
            //     }); //ECMAScript 2016 

            //     if (exist.length > 0) {
            //         this.selectedExpressions.push(this.currentTarget);

            //         // console.info(this.selectedExpressions.length);

            //     }
            //     else {
            //         let i = this.selectedExpressions.indexOf(this.currentTarget);
            //         this.selectedExpressions.splice(i,1);
            //      }

            // }

            this.click = this.currentTarget != undefined;
        });
    }




    setMarker(target) {



        if (target) {

            if (this.click) {
                let exist = this.selectedExpressions.filter(elem => {
                    return elem.range.start.row == this.currentTarget.range.start.row ? elem.range.start.column == this.currentTarget.range.start.column : false;
                }); //ECMAScript 2016
                if (exist.length > 1) {
                    let i = this.selectedExpressions.indexOf(this.currentTarget);
                    this.selectedExpressions.splice(i, 1);
                      
                }
                else {
                    this.selectedExpressions.push(target);

                }
                this.publish =true;
            }

            this.currentTarget = target;


            let i = this.selectedExpressions.indexOf(this.previousTarget);

            // console.info(`${i} --> is the index of the removed element`);

            if (i > -1)
                this.selectedExpressions.splice(i, 1);

            this.previousTarget = target;

            this.selectedExpressions.push(target);
            this.click = false;


        }
        else {
            if (this.previousTarget) {
                let i = this.selectedExpressions.indexOf(this.previousTarget);
                this.selectedExpressions.splice(i, 1);
                this.previousTarget = undefined;
                // console.info(`${i} --> is the index of the removed Prevoius element`);

            }

            if (this.publish){
                this.publishNewSelection();
                this.publish=false;
            }

        }

        // console.info(`${this.selectedExpressions.length} --> is the length of expressionSelections`);

        this.ea.publish('aceMarkersChanged', {
            items: this.selectedExpressions
        });

    }

    publishNewSelection() {
        this.ea.publish('onSelectionedExpressionsChanged', {
            items: this.selectedExpressions
        });
    }


}
