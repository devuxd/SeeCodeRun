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
    if(!trace)
      return;
    
    let columns = [];
    let values = [];
    let transformation = [];
    
    for (let variable of trace.variables) {
      columns.push(variable.id);
      transformation.push({ name: variable.id, values: [] });
    }
    
    for (let variable of trace.timeline) {
      if (variable.type !== 'VariableDeclarator' && variable.type !== 'AssignmentExpression')
        continue;

      for (let t of transformation) {
        if (t.name !== variable.id) {
          if (t.values.length > 0) {
            
            // set the current time periods value to the previous value
            t.values.push(t.values[t.values.length - 1]);
          } else {
            
            // the variable does not exist so insert a blank value
            t.values.push('');
          }
        } else {
          
          // the variable changed so add the new value
          t.values.push(variable.value); 
        }
      }
    }
    
    for (let i = 0; i < trace.values.length; i++) {
      let toAdd = {};
      
      for (let t of transformation) {
        toAdd[t.name] = t.values[i];
      }
      
      values.push(toAdd);
    }
    
    return {
      columns: columns,
      values: values
    };
  }

  renderFx(trace, divElement) {
    if (!trace)
      return;
      
    // clear the div element  
    d3.select(divElement).html("");
    
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
}