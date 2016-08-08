import {AceUtils} from '../utils/ace-utils';
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
    this.queryType = null;

    this.branches = [];

    this.aceUtils = new AceUtils();
    this.aceEditor = ace.edit('aceJsEditorDiv');
    this.aceMarkerManager = this.aceUtils.makeAceMarkerManager(this.aceEditor);
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
    this.render(formattedTrace, `#${this.contentId}`, this.branches, this.query, this.queryType, this.aceUtils, this.aceMarkerManager);
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
      this.queryType = payload.searchFilterId;
      this.renderVisualization();
    });

    ea.subscribe('searchBoxStateResponse', response => {
      this.query = response.searchTermText;
      this.queryType = response.searchFilterId;
      this.renderVisualization();
    });

    ea.subscribe('navigationChanged', payload => {
      this.branches = payload;
    });

    ea.publish('searchBoxStateRequest');
  }

  getSelectionRange() {
    let ea = this.eventAggregator;
    ea.publish('visualizationSelectionRangeRequest', {id: this.id});
  }
}
