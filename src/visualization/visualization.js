import {inject} from 'aurelia-framework';
import * as d3 from 'd3';

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
    if(!this.trace){
      console.log(`No trace found when rendering visualization #${this.type}`);
    }
    let formattedTrace = this.formatTrace(this.trace);
    this.render(formattedTrace, `#${this.type}`);
  }
  
  subscribe() {
    let ea = this.eventAggregator;
    let self = this;

    ea.subscribe('onVisRequest', payload => {
        self.traceHelper = payload.traceHelper;
        self.trace = payload.trace;
        self.renderVisualization();
    });
  }
  
  getSelectionRange() {
    let ea = this.eventAggregator;
    ea.publish('selectionRangeRequested');
  }
}