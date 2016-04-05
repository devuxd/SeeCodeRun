/* global $ */
import {TraceModel} from '../traceService/trace-model';

export class TraceSearch{
    constructor(eventAggregator){
        this.eventAggregator = eventAggregator;
        this.traceModel = new TraceModel();
        this.searchBox = {
            $searchTermDiv: undefined,
            $optionSelectedDiv: undefined,
            searchBoxChanged: this.searchBoxChanged,
            updateTable: this.updateTable,
            searchOptions: this.traceModel.traceSearchfilters,
            traceHelper: undefined
        };
    }


    attached(){
        let searchBox = this.searchBox;
        searchBox.$searchTermDiv = $("#searchTerm");
        searchBox.$searchFilter = $("#searchFilter");
        
        searchBox.$searchFilter.empty();
        let options ="";
        for (let id in searchBox.searchOptions){
            let value = searchBox.searchOptions[id];
            options += `<option value="${id}">${value}</option>`;
        }
        searchBox.$searchFilter.append(options);

        let searchBoxChanged = function searchBoxChanged(e){
            
            let option = searchBox.$optionSelectedDiv.options[searchBox.optionSelectedDiv.selectedIndex].value;
            let value = searchBox.$searchTermDiv.value;
            
            if(searchBox.traceHelper){
                let query = searchBox.traceHelper.traceQueryManager.query(searchBox.traceHelper.trace, value, option);
                searchBox.updateTable(query,combo);
            }
    }
        searchBox.$searchTermDiv.change(searchBoxChanged );
        
        searchBox.$searchFilter.change(searchBoxChanged);
        
       this.subscribe(); 
    }
    subscribe(){
        let onTraceChanged = this.onTraceChanged;
        this.eventAggregator.subscribe(this.traceModel.traceEvents.changed, payload =>{
            onTraceChanged(payload);
        });
    }
    onTraceChanged(payload){
                let traceHelper= payload.data;
                let variableValues =traceHelper.getVariables().values;
                let select = document.getElementById("optionSelected").value;
                let term = document.getElementById("searchTerm").value;
                let query = traceHelper.traceQueryManager.query(variableValues,term,select);
                let combo = ["id","type","text","values"];
               // this.updateTable(query,combo);
    }
    
    updateTable(query,cols){
                var displayArea = document.getElementById('searchResultDisplayArea');
                if(query!=null&&query.length==0){
                    displayArea.innerHTML = "No Results Found. Try a different Search Term with Filter Option.";
                    return;
                }
                // var allAssociatedKeys = "";
                var table =" ";
                var i,c, qData;
                table = "<table border='1'>";
                for(i=0;i<query.length;i++){
                    // for(var key in query[i]){
                    //     allAssociatedKeys+="key:"+key+"\n";
                    // }
                    // alert(allAssociatedKeys);
                    // generate the table
                    table += "<tr><td>" +  "Row No. " + "</td>" + "<td>"+  i + " " +"</td>" 
                    for(c=0;c<cols.length;c++){
                        if(cols[c]=="type")
                            qData = ("type"+":"+query[i].type);                        
                        else if(cols[c]=="id")
                            qData = ("id"+":"+query[i].id);
                        else if(cols[c]=="text")
                            qData = ("text"+":"+query[i].text);
                        else if(cols[c]=="values"){
                            qData = ("values"+":");
                            var a;
                            for(a=0;a<query[i].values.length;a++){
                                qData+=query[i].values[a].value;
                                if(i+1<query[i].values.length)
                                    qData+=","
                            }
                        }
                        table += "<td>" + qData + "</td>";
                    }
                    table+= "</tr>";
                }
                table += "</table><br/>";
                displayArea.innerHTML =  table;
                //displayArea.innerHTML = JSON.stringify(query2);                  
    }
    
  
}