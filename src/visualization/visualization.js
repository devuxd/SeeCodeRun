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
    let traceHelper = null;
    
    ea.subscribe(traceModel.traceEvents.changed.event, payload => {
      traceHelper = payload.data;
      visualization.trace = payload.data.trace;
      visualization.renderVisualization();
    });
    
    ea.subscribe(traceModel.executionEvents.failed.event, payload => {
      visualization.hasError = true;
    });

    ea.subscribe('onVisRequest',payload => {
        // Insert code here
        console.info(payload);
    });
    
    ea.subscribe('selectionRangeResponse', payload => {
      let expsInRange = [];
      let expressions = traceHelper.getExpressions();
      for(let i = 0; i < expressions.variables.length; i++) {
        if(this.traceHelper.isRangeInRange(expressions.variables[i].range, payload.range)) {
          expsInRange.push(expressions.variables[i]);
        }
      }
    });
  }
  
  getSelectionRange() {
    let ea = this.eventAggregator;
    ea.publish('selectionRangeRequested');
  }
}