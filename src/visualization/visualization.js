import {inject} from 'aurelia-framework';
import * as d3 from 'd3';
import {TraceModel} from '../traceService/trace-model';

export class Visualization {
  static inject() {
    return [d3];
  }
 
  constructor(d3, eventAggregator, config) {
    this.d3 = d3;
    this.eventAggregator = eventAggregator;
    this.title = config.config.title;
    this.type = config.config.type;
    this.trace = config.config.trace;
    this.formatTrace = config.config.formatTraceFx;
    this.render = config.config.renderFx;
    this.errorMessage = config.config.errorMessage;
    this.hasError = false;
    this.requestSelectionRange = this.getSelectionRange;
    this.traceHelper = null;
  }

  attached() {
    this.renderVisualization();
    this.subscribe();
  }
  
  renderVisualization() {
    let formattedTrace = this.formatTrace(this.trace);
    this.render(formattedTrace, `#${this.type}`);
  }
  
  subscribe() {
    let ea = this.eventAggregator;
    let visualization = this;
    let traceModel = new TraceModel();
    
    ea.subscribe(traceModel.traceEvents.changed.event, payload => {
      this.traceHelper = payload.data;
      visualization.trace = payload.data.trace;
      if(visualization.type !== 'DataTable') {
        visualization.renderVisualization(); 
      }
    });
    
    ea.subscribe(traceModel.executionEvents.failed.event, payload => {
      visualization.hasError = true;
    });

    ea.subscribe('onVisRequest',payload => {
        // Insert code here

    });
    
    ea.subscribe('selectionRangeResponse', payload => {
      let expressions = this.traceHelper.getExpressions();
      let variables = this.traceHelper.getVariables();
      let trace = {
        timeline: [],
        variables: [],
        values: []
        
      };
      for(let i = 0; i < expressions.variables.length; i++) {
        if(this.traceHelper.isRangeInRange(expressions.variables[i].range, payload.range)) {
          trace.variables.push(expressions.variables[i]);
          
          for(let j = 0; j < expressions.timeline.length; j++) {
            if(this.traceHelper.isRangeInRange(expressions.timeline[j].range, payload.range)) {
              trace.timeline.push(expressions.timeline[j]);    
            }
          }
        }
      }
      
      for(let k = 0; k < variables.variables.length; k++) {
          if(this.traceHelper.isRangeInRange(variables.variables[k].range, payload.range)) {
            trace.values.push(variables.variables[k]);
          }
      }
      
      visualization.trace = trace;
      visualization.renderVisualization();
    });
  }
  
  getSelectionRange() {
    let ea = this.eventAggregator;
    ea.publish('selectionRangeRequested');
  }
}