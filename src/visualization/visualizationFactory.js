import {DataTable} from '../visualization/dataTable';

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
      }
    ];
  }
  
  getVisualizationByType(type) {
    switch (type) {
      case "DataTable":
        return this.getFormattedDataTable();
      default:
        break;
    }
  }
  
  getFormattedDataTable() {
    var dataTable = new DataTable();
    dataTable.config.trace = dataTable.config.formatTraceFx();
    return dataTable;
  }
}
