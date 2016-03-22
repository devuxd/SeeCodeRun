import * as d3 from 'd3'; 
import {VisualizationFactory} from '../visualization/visualizationFactory';
import {Visualization} from '../visualization/visualization';

export class VisViewer {
    
    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
        
        this.visualizations = [];
        
        let factory = new VisualizationFactory();
        
        let dataTableConfig = factory.getVisualizationByType('DataTable');
        let dataTableVisualization = new Visualization(d3, this.eventAggregator, dataTableConfig.config);

        this.visualizations.push(dataTableVisualization);
    }

    attached() {
        for (let visualization of this.visualizations) {
            visualization.attached();
        }
    }
}