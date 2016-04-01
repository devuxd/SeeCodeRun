import * as d3 from 'd3';
 
export class DataTable {

  constructor() {
    this.config = {
      type: 'DataTable',
      title: 'Data Table',
      trace: null,
      formatTraceFx: this.formatTraceFx,
      renderFx: this.renderFx,
      errorMessage: null
    };
  }

  formatTraceFx(trace) {
    return {
      columns: [
        "a",
        "b"
      ],
      values: [{
        a: 3,
        b: 5
      }, {
        a: 4,
        b: 6
      }]
    };
  }

  renderFx(trace, divElement) {
    let data = trace;
    let columns = data.columns;
    let values = data.values;
    let table = d3.select(divElement).append("table")
      .style("border-collapse", "collapse") // <= Add this line in
      .style("border", "2px black solid"),
      thead = table.append("thead"),
      tbody = table.append("tbody");

    // append the header row
    thead.append("tr")
      .selectAll("th")
      .data(columns)
      .enter()
      .append("th")
      .text(function(column) {
        return column;
      });

    // create a row for each object in the data
    let rows = tbody.selectAll("tr")
      .data(values)
      .enter()
      .append("tr");

    // create a cell in each row for each column
    let cells = rows.selectAll("td")
      .data(function(row) {
        return columns.map(function(column) {
          return {
            column: column,
            value: row[column]
          };
        });
      })
      .enter()
      .append("td")
      .attr("style", "font-family: Courier") // sets the font style
      .html(function(d) {
        return d.value;
      });
  }

  getVariables(trace) {
    let vars = new Set();
    for (let t of trace) {
      if (t.type === 'VariableDeclarator') {
        vars.add(t.id);
      }
    }

    return Array.from(vars);
  }
}