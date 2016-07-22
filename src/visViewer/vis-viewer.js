/* global $ */

// import * as d3 from 'd3';
import {VisualizationFactory} from '../visualization/visualizationFactory';
import {Visualization} from '../visualization/visualization';


export class VisViewer {
  seePanelHeadingSelector = "#seePanelHeading";
  seePanelBodySelector = "#seePanelBody";
  visViewerSelectSelector = "#visViewerSelect";
  noSelectionMessage = "Please select a visualization type first."
  constructor(eventAggregator) {
    this.eventAggregator = eventAggregator;

    this.visualizations = [];
    this.tempVis = null;

    this.factory = new VisualizationFactory();
    this.visualizationTypes = this.factory.getVisualizationTypes();
    this.isChecked = true;
    this.subscribe();
  }

  attached() {
    for (let visualization of this.visualizations) {
      visualization.attached();
    }
  }

  subscribe() {
    let self = this;
    let ea = this.eventAggregator;
    ea.subscribe('onSelectedExpressionsChanged', payload => {
        self.selectedExpressions = payload.items;
        self.showClearButton = self.showVisButton = self.selectedExpressions.length >= 2 ;
    });

    ea.subscribe("traceChanged", payload => {
      self.traceHelper = payload.data;
      self.trace = payload.data.trace;
      for (let visualization of this.visualizations) {
        visualization.traceHelper = self.traceHelper;
        visualization.trace = self.trace;
        if(visualization.type !== 'DataTable') {
          visualization.renderVisualization();
        }
      }
    });

    ea.subscribe("instrumentationFailed", payload => {
      self.hasError = true;
      ea.publish('onVisRequest', payload );
    });

    ea.subscribe('visualizationSelectionRangeResponse', expression => {
      if(!self.traceHelper){
        return;
      }
      self.trace = self.traceHelper.getTraceForExpression(expression);

      ea.publish('onVisRequest', {trace: self.trace, traceHelper: self.traceHelper} );
    });
  }
  // showVis() {
  //     // TODO: publish an event with payload = this.selectedExpression. The visualization module should subscribe to this event.
  //     console.info(this.selectedExpressions);

  // }

  // clearSelection() {
  //     // notify expressionSelection service to clear the selected expressions
  //     this.eventAggregator.publish("onClearSelectionRequest");
  // }

  publish(payload) {
    let ea = this.eventAggregator;
    ea.publish('onVisRequest', payload);
  }

  addVisualization() {
    let self = this;
    let type = $(this.visViewerSelectSelector).val();
    this.prepareVisualization(type);
    let tempVis = this.tempVis;
    if(tempVis) {
      if(!this.checkVisExists(tempVis.type)) {
          tempVis.traceHelper = this.traceHelper;
          tempVis.trace = this.trace;
          this.visualizations.push(tempVis);
          let vis = this.visualizations[this.visualizations.length-1];
          this.removeVisType(tempVis.type);
          setTimeout(function() {
            vis.attached();
            if(!$(self.seePanelBodySelector).is(":visible")){
              $(self.seePanelHeadingSelector).click();
            }
          }, 50);
      }
    }

  }

  onSelectChange(event) {
    // let type = $(event.target).val();
    // this.prepareVisualization(type);
  }

  prepareVisualization(type){
    if (type !== '' && type !== null) {
      this.tempVis = new Visualization(this.visualizations.length, this.eventAggregator, this.factory.getVisualizationByType(type));
    }
  }

  checkVisExists(type) {
    let exists = false;
    for (let i = 0; i < this.visualizations.length; i++) {
      if (this.visualizations[i].type === type) {
        exists = true;
        break;
      }
    }
    return exists;
  }

  removeVisType(type) {
    let index = -1;
    for (let i = 0; i < this.visualizationTypes.length; i++) {
      if (this.visualizationTypes[i].value === type) {
        index = i;
        break;
      }
    }

    if(index >= 0) {
      this.visualizationTypes.splice(index, 1);
    }
  }
}
