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

@
inject(EventAggregator)
export class VisViewer {

    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;

        this.visualizations = [];

        let factory = new VisualizationFactory();

        let dataTableConfig = factory.getVisualizationByType('DataTable');
        let dataTableVisualization = new Visualization(d3, this.eventAggregator, dataTableConfig.config);

        this.visualizations.push(dataTableVisualization);

        this.selectedExpressions = [];
        this.disable = true;
        this.subscribe();

    }

    attached() {
        for (let visualization of this.visualizations) {
            visualization.attached();
        }
    }

    subscribe() {
        let ea = this.eventAggregator;

        ea.subscribe('onSelectedExpressionsChanged', payload => {
            this.selectedExpressions = payload.items;
            this.disable = this.selectedExpressions.length == 1;


        });
    }
    showVis() {
        console.info(this.selectedExpressions);

    }
}
