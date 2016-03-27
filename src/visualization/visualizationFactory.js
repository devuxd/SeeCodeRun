import {DataTable} from '../visualization/dataTable';

export class VisualizationFactory {
  
  constructor() {
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