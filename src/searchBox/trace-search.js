/* global $ */
export class TraceSearch{
    constructor(eventAggregator){
        this.eventAggregator = eventAggregator;
    }
    attached(){
        let searchTermDiv = $("#searchTerm");
        let optionSelectedDiv = $("optionSelected");
        let updateTable = this.updateTable;
        let traceHelper = this.trace;
        searchTermDiv.change(function searchTermChanged(e){
            
            let option = optionSelectedDiv.options[optionSelectedDiv.selectedIndex].value;
            
            if(this.traceHelper){
                let query = this.traceHelper.traceQueryManager.query(traceHelper.trace,this.value,option);
                let combo = ["id","type","text","values"];
                updateTable(query,combo);
            }
        });
        
        optionSelectedDiv.change(function(e){
            // returns an object array of the queried results
            var term = searchTermDiv.value;
            var query = JlinqQueryTrace(trace,term,this.value);
            var combo = ["id","type","text","values"];
            this.updateTable(query,combo);
        });
        
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
                let select = document.getElementById("optionSelected").value;
                let term = document.getElementById("searchTerm").value;
                let query = traceHelper.traceQueryManager.JlinqQueryTrace(traceHelper.trace,term,select);
                let combo = ["id","type","text","values"];
                this.updateTable(query,combo);
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