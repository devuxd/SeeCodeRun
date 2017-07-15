/**
 * Created by DavidIgnacio on 7/10/2017.
 */
import {AceUtils} from '../utils/ace-utils';
export class GraphicalAnalyzer{
  referenceTimeLine = null;
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
      this.referenceTimeLine = referenceTimeline;
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
      // console.log("selected: ", match);
      // here you get the info for expressions after cursor changes
      let expressionText =  aceEditor.session.doc.getTextRange(match.range);

      /**
       * for obj in referencetime{
       *  if obj.id == reftime.id
       *  if reftime exists
       *  then console.log reftime.ref
       *  then we check if the reference is graphical and has  value
       * }
       */
      let graphicalReference = null;
      for(let objInd in this.referenceTimeLine){
        let obj = this.referenceTimeLine[objInd];
        if(obj.id == match.id){
          if(obj.reference && obj.isGraphical){
            graphicalReference = obj.reference;
          }
        }
      }

      if(graphicalReference && graphicalReference.length == 1){
        // console.log("selected Graphical Reference id", graphicalReference[0].id);
        let attr = $(graphicalReference).css("background-color");
        $(graphicalReference).fadeOut(100).fadeIn();
      }

    });
  }
}
