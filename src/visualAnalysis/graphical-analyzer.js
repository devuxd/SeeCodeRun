/**
 * Created by DavidIgnacio on 7/10/2017.
 */
import {AceUtils} from '../utils/ace-utils';
export class GraphicalAnalyzer{
  graphicalTimeline = null;
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
      this.graphicalTimeline = graphicalTimeline;
      // so far is highlighting everything that is graphical
      aceUtils.updateAceMarkers(aceMarkerManager, graphicalTimeline);
      });

    this.eventAggregator.subscribe("expressionAfterCursorChanged", match =>{
      // you should only proceed if you have graphic timeline
      if(!this.graphicalTimeline){
        return;
      }
      // and you have an expression match
      if(!match){
        return;
      }
      // here you get the info for expressions after cursor changes
      let expressionText =  aceEditor.session.doc.getTextRange(match.range);
      console.log("expression at cursor: ", expressionText, match);
    });
  }
}
