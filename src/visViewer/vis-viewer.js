import * as d3 from 'd3';
import {TableVis} from '../tableVis/table-vis'

export class VisViewer {
    
    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
        this.subscribe();
    }
    
    attached(visualizations) {
        this.visualizations = visualizations;
        this.generateVisualizations();
    }
    
    subscribe() {
      let ea = this.eventAggregator;
    }
    
    generateVisualizations() {
        for (let vis of this.visualizations) {
            switch(vis.type) {
                case "table":
                    let tableVis = new TableVis();
                    tableVis.attached(vis.data);
                    break;
                default:
                    break;
            }    
        }
    }
}