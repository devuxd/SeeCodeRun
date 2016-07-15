import {DataTable} from '../visualization/data-table';
import {ScatterPlot} from '../visualization/scatter-plot';
import {CallGraph} from '../visualization/call-graph';

export class VisualizationFactory {

  constructor() {
  }

  getVisualizationTypes() {
    return [
      {
        value: "DataTable",
        name: "Data Table",
        default: false
      },
      {
        value: "ScatterPlot",
        name: "Scatter Plot",
        default: false
      },
      {
        value: "CallGraph",
        name: "Call Graph",
        default: true
      }
    ];
  }

  getVisualizationByType(type) {
    switch (type) {
      case "DataTable":
        return this.getFormattedDataTable();
      case "ScatterPlot":
        return this.getFormattedScatterPlot();
      case "CallGraph":
        return this.getFormattedCallGraph();
      default:
        break;
    }
  }

  getFormattedDataTable() {
    let dataTable = new DataTable();
    dataTable.config.trace = dataTable.config.formatTraceFx();
    return dataTable;
  }

  getFormattedScatterPlot() {
    let scatterPlot = new ScatterPlot();
    scatterPlot.config.trace = scatterPlot.config.formatTraceFx();
    return scatterPlot;
  }

  getFormattedCallGraph() {
    let callGraph = new CallGraph();
    callGraph.config.trace = callGraph.config.formatTraceFx();
    return callGraph;
  }
}
