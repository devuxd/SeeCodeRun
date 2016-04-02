import {inject} from 'aurelia-framework';
import * as d3 from 'd3';

export class Visualization {
  static inject() {
    return [d3];
  }
 
  constructor(d3, eventAggregator, config) {
    this.d3 = d3;
    this.eventAggregator = eventAggregator;
    this.title = config.title;
    this.type = config.type;
    this.trace = config.trace;
    this.formatTrace = config.formatTraceFx;
    this.render = config.renderFx;
    this.errorMessage = config.errorMessage;
    this.hasError = false;
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
    let renderVisualization = this.renderVisualization;
    
    ea.subscribe('onTraceChanged', payload => {
      this.trace = payload.data;
      renderVisualization();
    });
    
    ea.subscribe('onTraceFailed', payload => {
      this.hasError = true;
    });

    ea.subscribe('onVisRequest',payload => {
        // Insert code here
        console.info(payload);
    });
  }
}