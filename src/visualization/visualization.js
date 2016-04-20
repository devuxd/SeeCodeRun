import {inject} from 'aurelia-framework';
import * as d3 from 'd3';
import {TraceModel} from '../traceService/trace-model';
import {TraceHelper} from '../traceService/trace-helper';

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
    this.traceModel = new TraceModel();
    this.traceHelper = new TraceHelper();
  }

  attached() {
    this.renderVisualization();
    this.subscribe();
  }
  
  getSelectionRange() {
    let ea = this.eventAggregator;
    ea.publish('selectionRangeRequested');
  }

  renderVisualization() {
    let formattedTrace = this.formatTrace(this.trace);
    this.render(formattedTrace, `#${this.type}`);
  }
  
  subscribe() {
    let ea = this.eventAggregator;
    let renderVisualization = this.renderVisualization;
    
    let traceChangedEvent = this.traceModel.traceEvents.changed.event;
    ea.subscribe(traceChangedEvent, payload => {
      this.traceHelper = payload.data;
      this.trace = payload.data.trace;
    });
    
    ea.subscribe('onTraceFailed', payload => {
      this.hasError = true;
    });

    ea.subscribe('onVisRequest',payload => {
        // Insert code here
        console.info(payload);
    });
    
    ea.subscribe('selectionRangeResponse', payload => {
      let expsInRange = [];
      let expressions = this.traceHelper.getExpressions();
      for(let i = 0; i < expressions.variables.length; i++) {
        if(this.traceHelper.isRangeInRange(expressions.variables[i].range, payload.range)) {
          expsInRange.push(expressions.variables[i]);
        }
      }
    });
  }
}