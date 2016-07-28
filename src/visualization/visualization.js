
export class Visualization {
  constructor(index, eventAggregator, config) {
    this.id = "seecoderun-visualization-"+ index;
    this.buttonId = "seecoderun-visualization-"+ index+"-button";
    this.contentId = "seecoderun-visualization-"+ index+"-content";
    this.eventAggregator = eventAggregator;
    this.styleClass = config.config.styleClass;
    this.title = config.config.title;
    this.type = config.config.type;
    this.trace = config.config.trace;
    this.formatTrace = config.config.formatTraceFx;
    this.render = config.config.renderFx;
    this.errorMessage = config.config.errorMessage;
    this.hasError = false;
    this.requestSelectionRange = this.getSelectionRange;
    this.traceHelper = null;
    this.query = null;
  }

  attached() {
    this.subscribe();
    this.renderVisualization();
  }

  renderVisualization() {
    if(!this.trace){
      console.log(`No trace found when rendering visualization #${this.id}`);
    }
    let formattedTrace = this.formatTrace(this.trace);
    this.render(formattedTrace, `#${this.contentId}`, this.query);
  }

  subscribe() {
    let ea = this.eventAggregator;
    let self = this;

    ea.subscribe('onVisRequest', payload => {
        self.traceHelper = payload.traceHelper;
        self.trace = payload.trace;
        self.renderVisualization();
    });

    ea.subscribe('searchBoxChanged', payload => {
      this.query = payload.searchTermText;
      this.renderVisualization();
    });
  }

  getSelectionRange() {
    let ea = this.eventAggregator;
    ea.publish('visualizationSelectionRangeRequest', {id: this.id});
  }
}
