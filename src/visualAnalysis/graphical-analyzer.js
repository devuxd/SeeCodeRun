/**
 * Created by DavidIgnacio on 7/10/2017.
 */
import {AceUtils} from '../utils/ace-utils';
export class GraphicalAnalyzer{
  referenceTimeLine = null;
  graphicalTimeline = null;
  uniqueGraphicalReferences = null;
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
    let defaultMarkers = [ //all the markers we plan to use for graphical highlighting
      aceUtils.getAvailableMarkers().graphicalAnalysisRedMarker,
      aceUtils.getAvailableMarkers().graphicalAnalysisOrangeMarker,
      aceUtils.getAvailableMarkers().graphicalAnalysisYellowMarker,
      aceUtils.getAvailableMarkers().graphicalAnalysisGreenMarker,
      aceUtils.getAvailableMarkers().graphicalAnalysisBlueMarker,
      aceUtils.getAvailableMarkers().graphicalAnalysisPurpleMarker
    ];
    var defaultMarkerIndexer = 0;
    var refToMarker = []; //a "dictionary" (still an array though) which will index with the reference name and the marker for that reference


    this.eventAggregator.subscribe("graphicalTraceChanged", payload => {
      defaultMarkerIndexer = 0;
      let referenceTimeline = payload;
      this.referenceTimeLine = referenceTimeline;
      let graphicalTimeline = [];
      for (let index in referenceTimeline) {
        if (referenceTimeline[index].isGraphical) {
          graphicalTimeline.push(referenceTimeline[index]);
        }
      }
      this.graphicalTimeline = graphicalTimeline;
      // aceUtils.updateAceMarkers(aceMarkerManager, graphicalTimeline);

    });

    this.eventAggregator.subscribe("uniqueGraphicalReferencesCalculated", payload =>{
      let uniqueReferences = payload;
      this.uniqueGraphicalReferences = uniqueReferences;
      for(let index in uniqueReferences){
        let uniqueRef = uniqueReferences[index]; //get the name of the unique reference (e.g. div#jumbotron.class1)
        let markerToUse = defaultMarkers[defaultMarkerIndexer]; //based on the marker incrementer, get the available marker from my array
        refToMarker.push({key: uniqueRef, marker: markerToUse}); //creates an object and pushes into array, key is the name of the reference, value is the availible marker
        defaultMarkerIndexer++;
      }
      for(let index in refToMarker){
        let reference = refToMarker[index].key;
        let codeLines = generateCodeLinesForReference(reference, this.referenceTimeLine);
        let marker = refToMarker[index].marker;
        let markerManager = aceUtils.makeAceMarkerManager(aceEditor, marker);
        aceUtils.updateAceMarkers(markerManager, codeLines);
      }

    });

    this.eventAggregator.subscribe("expressionAfterCursorChanged", match =>{
      if(!this.graphicalTimeline){
        return;
      }
      if(!match){
        return;
      }
      let graphicalReference = null;
      for(let objInd in this.referenceTimeLine){
        let obj = this.referenceTimeLine[objInd];
        if(obj.id === match.id){
          if(obj.reference && obj.isGraphical){
            graphicalReference = obj.reference;
          }
        }
      }
      if(graphicalReference){
        $(graphicalReference).fadeOut(100).fadeIn();
      }
    });

    this.eventAggregator.subscribe("outputGraphicalElementHovered", elem => {
      for(let ind in this.uniqueGraphicalReferences){
      }
      // console.log(elem);

      // if(elem){
      //   let hoveredDOMString = createToken(elem);
      //   var superRef;
      //   for(let objInd in this.graphicalTimeline){
      //     let obj = this.graphicalTimeline[objInd];
      //     if(obj.reference){
      //       superRef = obj.reference;
      //     }
      //   }
      //   let graphicalObjString = createToken(superRef[0]);
      //   console.log("check", hoveredDOMString === graphicalObjString, "Hovered String: " + hoveredDOMString, "Graphical String: " + graphicalObjString);
      //
      //   // console.log("names: " + superRef, createToken(superRef[0]), name, superRef === name);
      // }
      // //Todo: Something went wrong in the code above because the references are really off plz check

    });

  }


}









function generateCodeLinesForReference(aReference, referenceTimeline){
  var codeLinesForReference = [];
  for(let index in referenceTimeline){
    let referenceTimelineObject = referenceTimeline[index];
    if(referenceTimelineObject.reference && (referenceTimelineObject.reference === aReference)){
      codeLinesForReference.push(referenceTimelineObject);
    }
  }
  return codeLinesForReference;
}


// function createToken(elem){
//   let name = "";
//   name += elem.tagName.toLowerCase();
//   if(elem.id){
//     name += "#" + elem.id;
//   }
//   if(elem.className){
//     let classConcat = elem.className.replace(" ", ".");
//     name += "." + classConcat;
//   }
//
//   return name;
// }
