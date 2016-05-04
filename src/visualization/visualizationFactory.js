import {DataTable} from '../visualization/dataTable';
import {ScatterPlot} from '../visualization/scatterPlot';

export class VisualizationFactory {
  
  constructor() {
  }
  
  getVisualizationTypes() {
    return [
      {
        value: "",
        name: "Select Visualization Type"
      },
      {
        value: "DataTable",
        name: "Data Table"
      },
      {
        value: "ScatterPlot",
        name: "Scatterplot"
      }
    ];
  }
  
  getVisualizationByType(type) {
    switch (type) {
      case "DataTable":
        return this.getFormattedDataTable();
      case "ScatterPlot":
        return this.getFormattedScatterPlot();
      default:
        break;
    }
  }
  
  getFormattedDataTable() {
    var dataTable = new DataTable();
    dataTable.config.trace = dataTable.config.formatTraceFx();
    return dataTable;
  }
  
  getFormattedScatterPlot() {
    var scatterPlot = new ScatterPlot();
    scatterPlot.config.trace = scatterPlot.config.formatTraceFx();
    return scatterPlot;
  }
}
