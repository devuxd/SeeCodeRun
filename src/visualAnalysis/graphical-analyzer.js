/**
 * Created by DavidIgnacio on 7/10/2017.
 */
export class GraphicalAnalyzer{
  attribute = "h";

  constructor(eventAggregator){
    this.eventAggregator = eventAggregator;
  }

  attached(){

    this.subscribe();
  }

  subscribe(){
      this.eventAggregator.subscribe("traceChanged", payload=>{
        let traceHelper = payload.data;
        //todo: David will create getGraphicalObjectsFromTimeline() with the references to DOM elements
        console.log("GA", traceHelper.getTimeline());
      });
  }
}
