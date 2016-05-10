import {
    EventAggregator
}
from 'aurelia-event-aggregator';
import {
    inject
}
from 'aurelia-framework';
import * as d3 from 'd3';
import {
    VisualizationFactory
}
from '../visualization/visualizationFactory';
import {
    Visualization
}
from '../visualization/visualization';

@inject(EventAggregator)
export class VisViewer {

    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;

        this.visualizations = [];

        let factory = new VisualizationFactory();

        let dataTableConfig = factory.getVisualizationByType('DataTable');
        let dataTableVisualization = new Visualization(
          d3,
          this.eventAggregator, 
          dataTableConfig.config);

        this.visualizations.push(dataTableVisualization);
        
        let scatterPlotConfig = factory.getVisualizationByType('ScatterPlot');
        let scatterPlotVisualization = new Visualization(
          d3, 
          this.eventAggregator, 
          scatterPlotConfig.config);
        
        this.visualizations.push(scatterPlotVisualization);
        
        this.subscribe();

        this.selectedExpressions = [];
        this.showVisButton = false;
        this.showClearButton = false;
        this.subscribe();

    }

    attached() {
        for (let visualization of this.visualizations) {
            visualization.attached();
        }
    }

    subscribe() {
        
        this.eventAggregator.subscribe('onSelectedExpressionsChanged', payload => {
            this.selectedExpressions = payload.items;
            this.showClearButton = this.showVisButton = this.selectedExpressions.length >= 2 ;
            

        });
    }
    showVis() {
        // TODO: publish an event with payload = this.selectedExpression. The visualization module should subscribe to this event.
        console.info(this.selectedExpressions);

    }

    clearSelection() {

        // notify expressionSelection service to clear the selected expressions 
        this.eventAggregator.publish("onClearSelectionRequest");
    }
}
