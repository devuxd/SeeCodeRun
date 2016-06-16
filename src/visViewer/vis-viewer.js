/* global $ */

import * as d3 from 'd3';
import {VisualizationFactory} from '../visualization/visualizationFactory';
import {Visualization} from '../visualization/visualization';


export class VisViewer {

  constructor(eventAggregator) {
    this.eventAggregator = eventAggregator;

    this.visualizations = [];
    this.tempVis = null;

    this.factory = new VisualizationFactory();
    this.visualizationTypes = this.factory.getVisualizationTypes();
    this.isChecked = false;
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
    let self =this;
    let tempVis = this.tempVis;
    if(tempVis) {
      if(!this.checkVisExists(tempVis.type)) {
        tempVis.traceHelper = self.traceHelper;
        tempVis.trace = self.trace;
        this.visualizations.push(tempVis);
        let vis = this.visualizations[this.visualizations.length-1];
        setTimeout(function() {
          vis.attached();
        }, 50);
        this.removeVisType(tempVis.type);
      }
    }
  }
  
  onSelectChange(event) {
    let type = $(event.target).val();
    if (type !== '' && type !== null) {
      this.tempVis = new Visualization(d3, this.eventAggregator, this.factory.getVisualizationByType(type));
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
