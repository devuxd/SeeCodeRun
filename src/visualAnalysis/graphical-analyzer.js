/**
 * Created by DavidIgnacio on 7/10/2017.
 */
import {AceUtils} from '../utils/ace-utils';
export class GraphicalAnalyzer{
  attribute = "h";

  constructor(eventAggregator){
    this.eventAggregator = eventAggregator;
  }

  attached(){

    this.subscribe();
  }

  subscribe(){
    let aceUtils = new AceUtils();
    let aceEditor = ace.edit('aceJsEditorDiv'); // example
    let aceMarkerManager = aceUtils.makeAceMarkerManager(aceEditor, aceUtils.getAvailableMarkers().errorMarker, "line", true);
      this.eventAggregator.subscribe("traceChanged", payload=>{
        let traceHelper = payload.data;
        //todo: David will create getGraphicalObjectsFromTimeline() with the references to DOM elements
        let timeline = traceHelper.getTimeline();
        // console.log("GA", );
        let identifiers = [];
        for (let index in timeline) {
          //console.log("", timeline[index]);
          if (timeline[index].type === "VariableDeclarator") {
            identifiers.push(timeline[index]);
          }
        }
        aceUtils.updateAceMarkers(aceMarkerManager, identifiers);
      });
  }
}
