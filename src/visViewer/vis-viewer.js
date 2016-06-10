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
    
    ea.subscribe('selectionRangeResponse', payload => {
      if(!self.traceHelper){
        return;
      }
      let expressions = self.traceHelper.getExpressions();
      let variables = self.traceHelper.getVariables();
      let trace = {
        timeline: [],
        variables: [],
        values: []
      };
      for(let i = 0; i < expressions.variables.length; i++) {
        if(self.traceHelper.isRangeInRange(expressions.variables[i].range, payload.range)) {
          trace.variables.push(expressions.variables[i]);
          
          for(let j = 0; j < expressions.timeline.length; j++) {
            if(self.traceHelper.isRangeInRange(expressions.timeline[j].range, payload.range)) {
              trace.timeline.push(expressions.timeline[j]);    
            }
          }
        }
      }
      
      for(let k = 0; k < variables.variables.length; k++) {
          if(self.traceHelper.isRangeInRange(variables.variables[k].range, payload.range)) {
            trace.values.push(variables.variables[k]);
          }
      }
      
      self.trace = trace;
      ea.publish('onVisRequest', {trace: trace, traceHelper: self.traceHelper} );
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
    console.log(tempVis);
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
