export class ExpressionSelection {

    constructor(eventAggregator) {

        this.ea = eventAggregator;
        this.selectedExpressions = [];
        this.currentTarget;
        this.previousTarget;
        this.click = false;
        this.selectedExpressionsChanged = false;
        this.subscribe();

    }

    subscribe() {

        this.ea.subscribe("onExpressionHover", payload => {
            this.currentTarget = payload;
            this.setMarker();
        });

        this.ea.subscribe("onEditorClick", () => {
            this.click = this.currentTarget != undefined;
        });
    }

    setMarker() {

        if (this.currentTarget) {

            if (this.click) {
                let exist = this.selectedExpressions.filter(elem => {
                    return elem.range.start.row == this.currentTarget.range.start.row ? elem.range.start.column == this.currentTarget.range.start.column : false;
                }); //ECMAScript 2016
                if (exist.length > 1) {
                    let i = this.selectedExpressions.indexOf(this.currentTarget);
                    this.selectedExpressions.splice(i, 1);

                }
                else {
                    this.selectedExpressions.push(this.currentTarget);

                }
                this.selectedExpressionsChanged = true;
            }

            let i = this.selectedExpressions.indexOf(this.previousTarget);

            if (i > -1)
                this.selectedExpressions.splice(i, 1);

            this.selectedExpressions.push(this.currentTarget);
            this.click = false;
            this.previousTarget = this.currentTarget;

        }
        else {
            if (this.previousTarget) {
                let i = this.selectedExpressions.indexOf(this.previousTarget);
                if (i > -1)
                    this.selectedExpressions.splice(i, 1);
                    
                this.previousTarget = undefined;
            }

        }
        if (this.selectedExpressionsChanged) {
            this.publishNewSelection();
            this.selectedExpressionsChanged = false;
        }

        this.ea.publish('aceMarkersChanged', {
            items: this.selectedExpressions
        });

    }

    publishNewSelection() {
        this.ea.publish('onSelectedExpressionsChanged', {
            items: this.selectedExpressions
        });
    }


}
