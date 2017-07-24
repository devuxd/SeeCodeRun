export class VisualAnalyzer{
    eventAggregator = null;
    previousReference = null;
    previousReferenceBG = null;
    constructor(eventAggregator){
        this.eventAggregator = eventAggregator;
    }
    highlight(reference, color){
        if (this.previousReference && this.previousReference !== reference) {
            $(this.previousReference).css("background-color", this.previousReferenceBG);
        }

        if (this.previousReference !== reference) {
            this.previousReference = reference;
            this.previousReferenceBG = $(reference).css("background-color");
            $(reference).css("background-color", color);
            //let graphicalElement = $(this.previousReference);
            //this.eventAggregator.publish("outputGraphicalElementHovered", graphicalElement);
        }
    }
    unhighlight(){
        if (this.previousReference && this.previousReferenceBG) {
            $(this.previousReference).css("background-color", this.previousReferenceBG);
        }
        this.previousReference = null;
        this.previousReferenceBG = null;
    }
    subscribe(){
      this.eventAggregator.subscribe("highlightVisualElement", payload => {

                var ref = null;
                var highlightColor = null;
                ref = payload.reference;
                highlightColor = payload.color;
                if(ref){
                  this.highlight(ref, highlightColor);
                 }else{
                  this.unhighlight();
                }
          });
    }
}


