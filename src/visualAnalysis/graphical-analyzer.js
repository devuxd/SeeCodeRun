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
    let aceEditor = ace.edit('aceJsEditorDiv');
    let defaultMarkers = [
      aceUtils.getAvailableMarkers().graphicalAnalysisRedMarker,
      aceUtils.getAvailableMarkers().graphicalAnalysisOrangeMarker,
      aceUtils.getAvailableMarkers().graphicalAnalysisYellowMarker,
      aceUtils.getAvailableMarkers().graphicalAnalysisGreenMarker,
      aceUtils.getAvailableMarkers().graphicalAnalysisBlueMarker,
      aceUtils.getAvailableMarkers().graphicalAnalysisPurpleMarker
    ];
    var defaultMarkerIndexer = 0;
    var refToMarker = [];


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
    });

    this.eventAggregator.subscribe("uniqueGraphicalReferencesCalculated", payload =>{
      let uniqueReferences = payload;
      this.uniqueGraphicalReferences = uniqueReferences;
        for (let index in this.uniqueGraphicalReferences) {
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

    this.eventAggregator.subscribe("expressionHovered", exp =>{
      let referenceTimeLineObject = null;
      if(exp){
        if(exp.type === "CallExpression"){
        for(let ind in this.referenceTimeLine){
          let loopRef = this.referenceTimeLine[ind];
          if(loopRef.isGraphical){
            if(checkRangeEquate(exp.range, loopRef.range)){
              referenceTimeLineObject = loopRef;
            }
          }
        }
        if(referenceTimeLineObject){
          for(let index in refToMarker){
            let obj = refToMarker[index];
            if(obj.key[0] && referenceTimeLineObject.reference[0] && obj.key[0] === referenceTimeLineObject.reference[0]){
              for(let ind in defaultMarkers){
                let marker = defaultMarkers[ind];
                if(obj.marker === marker){
                  let highlightColor = $("." + marker).css("border-color");
                  let payload = {reference: referenceTimeLineObject.reference, color: highlightColor};
                  this.eventAggregator.publish("highlightVisualElement", payload);
                }
              }
            }
          }
        }
        }
      }else{
        let payload = {};
        this.eventAggregator.publish("highlightVisualElement", payload);
      }
    });
    function checkRangeEquate(n, a){
      return n.start.row === a.start.row && n.start.column === a.start.column && a.end.row === n.end.row && a.end.column === n.end.column;
    }

    this.eventAggregator.subscribe("outputGraphicalElementHovered", elem => {
      let referenceToMark = null;
      let allCallsToElem = [];
      for(let obj of this.referenceTimeLine){
        if(obj.reference){
          if(obj.reference[0] === elem && obj.type === "CallExpression"){
            if(allCallsToElem.length > 0){
              for(let x of allCallsToElem){
                if(x.id !== obj.id){
                  allCallsToElem.push(obj);
                }
              }
            }
            if(allCallsToElem.length === 0){
              allCallsToElem.push(obj);
            }
          }
        }
        if(allCallsToElem.length > 0){console.log("a", allCallsToElem);}
        //TODO branch selector status at this point.  Branch selector should recognize the state of code and output as a function is called multiple times
        /**
         * At this point, we store all calls that relate to element x.  Even if a function (e.g. helloWorld()) is called twice
         * and element x is modified twice, we store it regardless (so we would have two instances of that modification in
         * allCallsToElem).  It remains to parse through this array and recognize that graphical Function calls (e.g. $helloMessage.addClass("shiny-red"))
         * are called multiple times when the parent function (helloWorld()) is called multiple times.  Then, we can implement a branch selector
         * to step through the changes to the output element (the hello message) as the function (helloWorld()) is called again and again.
          */
      }

      for(let index in this.uniqueGraphicalReferences){
        let reference = this.uniqueGraphicalReferences[index];
        if(createSelector(elem) === createSelector(reference[0])){
          referenceToMark = reference;
        }
      }

      if(referenceToMark){
        let colorForBg = null;
        for(let index in refToMarker){
          let element = refToMarker[index];
          if(element.key === referenceToMark){
            colorForBg = $("." + element.marker).css("border-color");
          }
        }

        if(colorForBg && referenceToMark){
          let payload = {reference: referenceToMark, color: colorForBg};
          this.eventAggregator.publish("highlightVisualElement", payload);
        }
        else{
          console.log("ERROR", colorForBg, referenceToMark);
        }
      }

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


function createSelector(elem){
  let name = "";
  if(elem && elem.tagName) {
    name += elem.tagName.toLowerCase();
    if (elem.id) {
      name += "#" + elem.id;
    }
    if (elem.className) {
      let classConcat = elem.className.replace(" ", ".");
      name += "." + classConcat;
    }

    return name;
  }
}
