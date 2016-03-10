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
                    this.tabulate(vis.data);
                    break;
                default:
                    break;
            }    
        }
    }
    
    // Method to create the table
    tabulate(data) {
            let columns = data.columns;
            let values = data.values;
            let table = d3.select(".visualization.table").append("table")
                        .style("border-collapse", "collapse")// <= Add this line in
                        .style("border", "2px black solid"),
                thead = table.append("thead"),
                tbody = table.append("tbody");
        
            // append the header row
            thead.append("tr")
                .selectAll("th")
                .data(columns)
                .enter()
                .append("th")
                    .text(function(column) { return column; });
        
            // create a row for each object in the data
            let rows = tbody.selectAll("tr")
                .data(values)
                .enter()
                .append("tr");
        
            // create a cell in each row for each column
            let cells = rows.selectAll("td")
                .data(function(row) {
                    return columns.map(function(column) {
                        return {column: column, value: row[column]};
                    });
                })
                .enter()
                .append("td")
                .attr("style", "font-family: Courier") // sets the font style
                    .html(function(d) { return d.value; });
        }
}