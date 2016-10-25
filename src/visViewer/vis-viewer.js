/* global $ */

// import * as d3 from 'd3';
import {VisualizationFactory} from '../visualization/visualizationFactory';
import {Visualization} from '../visualization/visualization';


export class VisViewer {
  seePanelHeadingSelector = "#seePanelHeading";
  seePanelBodySelector = "#seePanelBody";
  visViewerSelectSelector = "#visViewerSelect";
  noSelectionMessage = "Please select a visualization type first."
  constructor(eventAggregator, aceUtils, aureliaEditor) {
    this.eventAggregator = eventAggregator;

    this.visualizations = [];
    this.tempVis = null;

    this.factory = new VisualizationFactory();
    this.visualizationTypes = this.factory.getVisualizationTypes();
    this.isChecked = true;
    this.aceUtils = aceUtils;
    this.aureliaEditor = aureliaEditor;
    this.subscribe();
  }

  attached() {
    this.aceEditor = this.aureliaEditor.editor;
    let self = this;
    $(this.seePanelBodySelector).on('show.bs.collapse', function (e) {
      self.adjustHeight($("#seePanelBody"));
    });
    $(this.seePanelBodySelector).on('shown.bs.collapse', function (e) {
      self.adjustHeight($("#seePanelBody"));
      self.eventAggregator.publish("seePanelBodyResize", $("#seePanelBody"));
    });

    $(this.seePanelBodySelector).on('hidden.bs.collapse', function (e) {
      $("#traceSearchPanelHeading").click();
    });
    for (let visualization of this.visualizations) {
      visualization.attached();
    }
  }

  adjustHeight($container) {
    let pendingHorizontalPixels = 15 + 25;
    $container.height($("#console-window").offset().top - $(this.seePanelHeadingSelector).offset().top - $(this.seePanelHeadingSelector).parent().height() - $("#traceSearchPanelHeading").parent().height() - pendingHorizontalPixels);
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

      let currentVisualizationType= $(this.visViewerSelectSelector).val();
      if(!currentVisualizationType){
        currentVisualizationType = "CallGraph";
        $(this.visViewerSelectSelector).val(currentVisualizationType);
        this.addVisualization();
      }

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
      // ea.publish('onVisRequest', {trace: self.trace, traceHelper: self.traceHelper} );
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
    let self = this;
    let type = $(this.visViewerSelectSelector).val();
    this.prepareVisualization(type);
    let tempVis = this.tempVis;
    if(tempVis) {
      if(!this.checkVisExists(tempVis.type)) {
          tempVis.traceHelper = this.traceHelper;
          tempVis.trace = this.trace;
          this.visualizations = [];
          this.visualizations.push(tempVis);
          let vis = this.visualizations[this.visualizations.length-1];
          // this.removeVisType(tempVis.type);
          setTimeout(function() {
            vis.attached();
            if(!$(self.seePanelBodySelector).is(":visible")){
              $(self.seePanelHeadingSelector).click();
            }
          }, 50);
      }
    }

  }

  onSelectChange(event, index) {
    this.addVisualization();
  }

  prepareVisualization(type){
    if (type !== '' && type !== null) {
      this.tempVis = new Visualization(this.visualizations.length, this.eventAggregator, this.aceUtils, this.aceEditor, this.factory.getVisualizationByType(type));
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
