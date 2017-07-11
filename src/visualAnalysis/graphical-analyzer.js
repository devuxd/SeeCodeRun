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
    let aceMarkerManager = aceUtils.makeAceMarkerManager(aceEditor, aceUtils.getAvailableMarkers().errorMarker);
    this.eventAggregator.subscribe("graphicalTraceChanged", payload => {
      let referenceTimeline = payload;
      let graphicalTimeline = [];
      for (let index in referenceTimeline) {
        if (referenceTimeline[index].isGraphical) {
          graphicalTimeline.push(referenceTimeline[index]);
          }
        }
      aceUtils.updateAceMarkers(aceMarkerManager, graphicalTimeline);
      });
  }
}
