import * as d3 from 'd3';

export class CallGraph {

  constructor() {
    this.config = {
      type: 'CallGraph',
      title: 'Call Graph',
      trace: null,
      formatTraceFx: this.formatTraceFx,
      renderFx: this.renderFx,
      errorMessage: null
    };
  }

  formatTraceFx(trace) {
    if(!trace){
      return;
    }
    let toReturn = [];
    return toReturn;
  }

  renderFx(trace, divElement) {
    if (!trace){
      return;
    }
    // clear the div element
    d3.select(divElement).html("");
  }

}