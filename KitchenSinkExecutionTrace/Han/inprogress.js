        $("#inputRange").change(function() {
            //"range":{"start":{"row":18,"column":8},"end":{"row":18,"column":9}}
            var res = $(this).val().split(" ");
            var startRow = {"row":res[0]};
            var startCol = {"col":res[1]};
            var endRow = {"row":res[2]};
            var endCol = {"col":res[3]};
            var concatRange = {"start":{"row":res[0],"col":res[1]},"end":{"row":res[2],"col":res[3]}};
            $("#sr").text(concatRange.start.row);
            $("#sc").text(concatRange.start.col);
            $("#er").text(concatRange.end.row);
            $("#ec").text(concatRange.end.col);
            getValues(concatRange);
        });
        // example of how to use the trace resulting data structure
        function visualizeExecutionTrace(executionTrace){
            var i, entry;
            var stackText= "";
            for (i = 0; i < executionTrace.length; i += 1) {
                entry = executionTrace[i];
                stackText += i + " -- " + JSON.stringify(entry) + "<br> ";
               
            }
        	return stackText;  
        }
        function getValues(Range){
            var stackTrace;
            var valueTable;
            var eventStatus = [];
            window.traceExecution($("#mockCode").val(),
                        function eventListener (event){
                        if(event.status === "Running"){
                            //alert("Running");
                            eventStatus.push(event.description);
                        }else if(event.status === "Finished"){
                            //alert("Finished");
                            stackTrace = window.TRACE.getStackTrace();
                            valueTable = window.TRACE.getExecutionTrace();
                            eventStatus.push(event.description);
                        }else if(event.status === "Error"){
                            //alert("Error");
                            eventStatus.push(event.description);
                        }else if(event.status === "Timeout"){
                            //alert("Timeout");
                            eventStatus.push(event.description);
                        }else if(event.status === "Busy"){
                            //alert("Busy");
                            eventStatus.push(event.description);
                        }
            });
            var entry,ele;
            //alert(Object.keys(valueTable[0]));
            for(entry=0;entry<valueTable.length;entry++){
                //var keys = Object.keys(valueTable[entry]);
                if(valueTable[entry].hasOwnProperty("type")){
                    //alert("type");
                }
                if(valueTable[entry].hasOwnProperty("id")){
                    //alert("id");
                }
                if(valueTable[entry].hasOwnProperty("text")){
                    //alert("text");
                }
                if(valueTable[entry].hasOwnProperty("values")){ // problem 1: should be stated as "values"
                    //alert("value");
                    var res;
                    alert(valueTable[entry].values[0].value);
                    $("#resultContainer").text(valueTable[entry].values.value);
                }
            }            
        }
