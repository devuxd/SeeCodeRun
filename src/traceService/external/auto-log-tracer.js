import {TraceModel} from '../trace-model';
export class AutoLogTracer{
    constructor(traceDataContainer){
        this.traceDataContainer = traceDataContainer;
        this.traceModel = new TraceModel();
    }

    wrapCodeInTryCatch(code){
        return `
            try{
                ${code}
                window.IS_AFTER_LOAD = true;
                window.START_TIME = null;
            }catch(e){
                window.TRACE.error = e.toString();
                throw "{exception:"+ JSON.stringify(window.TRACE.currentExpressionRange)+", details:" + window.TRACE.error + "}";
            }
        `;

    }

    getTraceDataContainerCodeBoilerPlate(){
        return `
        var  traceDataContainerElement = document.getElementById("${this.traceDataContainer}");
        if(!traceDataContainerElement){
            traceDataContainerElement = document.createElement("div");
            traceDataContainerElement.id = "${this.traceDataContainer}";
        }
        traceDataContainerElement.style.display = "none";
        document.body.appendChild(traceDataContainerElement);
        `;
    }

    getTraceDataCodeBoilerPlate(){
        return `
        traceDataContainerElement.textContent= JSON.stringify(window.TRACE.getTraceData());
        `;
    }

    getAutologCodeBoilerPlate(timeLimit){
        return `
        /*AutoLogTracer*/
        window.START_TIME = +new Date();
        window.TIME_LIMIT = ${timeLimit};

        var Syntax =  ${JSON.stringify(this.traceModel.esSyntax)};
        var traceTypes = ${JSON.stringify(this.traceModel.traceTypes)};
        window.ISCANCELLED = false;
        window.TRACE = {
            updateTimeout: null, error: "", currentExpressionRange: null, hits: {}, data: {}, stack : [], stackIndex: [{path: [], scope: "program"}],  execution : [], variables: [], values : [], timeline: [], identifiers: [],
            autoLog: function autoLog(info) {
                this.currentExpressionRange = info.range;
                if(this.hits.length < 1){
                    window.START_TIME = +new Date();
                }

                if(window.IS_AFTER_LOAD){
                    // if(!window.START_TIME){
                    //     window.START_TIME = +new Date();
                    // }
                    clearTimeout(this.updateTimeout);
                    this.updateTimeout = setTimeout(function updateTrace(){
                        traceDataContainerElement.textContent= JSON.stringify(window.TRACE.getTraceData());
                        traceDataContainerElement.click();
                        // window.START_TIME = null;
                    }, 100);
                }

                var duration = 0;
                if(window.START_TIME){
                    duration = (+new Date()) - window.START_TIME;
                }
                if(duration > window.TIME_LIMIT){
                     throw "Trace Timeout. Running code exceeded " + window.TIME_LIMIT + " ms time limit.";
                }

                var key = info.indexRange[0]+ ':' + info.indexRange[1];
                var extra = info.extra;

                if(traceTypes.Stack.indexOf(info.type) > -1){

                    if(extra){
                        var extraValues = extra.split(":");
                        if(extraValues.length > 1){
                            var blockId = extraValues[0];
                            var isEnteringBlock = extraValues[1] === "Enter" ? true : false;
                            var stackKey = key + ":" + blockId;
                            key = key + ":" + extra;

                            if(isEnteringBlock){
                                this.stackIndex.push({path: [this.stackIndex], scope: stackKey});
                                this.stack.push(key);
                            }else{
                              //  this.stackIndex = this.stackIndex.pop();
                            }
                        }

                    }else{
                        this.stack.push(key);
                    }

                }
                var infoValueString = null;
                try{
                    infoValueString = JSON.stringify(info.value, this.stringifyCicleBreaker);
                }catch(e){
                    infoValueString = info.value? info.value.toString(): "[Stringify-Circular-Error]";
                }
                this.cache = [];

                if(traceTypes.Expression.indexOf(info.type) > -1){
                    if(info.id){
                        this.values.push({id: info.id , value: infoValueString, range: info.range});
                    }else{
                        this.values.push({id: info.text , value: infoValueString, range: info.range});
                    }
                }

                this.timeline.push({ id: info.id , value: infoValueString, range: info.range, type: info.type, text: info.text});


                var stackTop =	this.stackIndex[ this.stackIndex.length - 1].scope;

				if (this.hits.hasOwnProperty(key)) {
                    this.hits[key] = this.hits[key] + 1;
                    this.data[key].hits[stackTop] = this.data[key].hits[stackTop] + 1;
                    this.data[key].values.push({ stackIndex : stackTop + ":" + this.data[key].hits[stackTop]  , infoValueString});
                } else {

                    if(info.type === Syntax.VariableDeclarator){
                       this.variables.push({id: info.id , range: info.range});
                    }

                    this.identifiers.push({id: info.id , range: info.range});


                    this.hits[key] = 1;
                    this.execution.push(key);
                    this.data[key] = {
                        type : info.type,
                        id : info.id,
                        text : info.text,
                        values: [{stackIndex: stackTop + ":1", value : infoValueString}],
                        range: info.range,
                        hits : [],
                        extra : info.extra
                    };
                    this.data[key].hits[stackTop] = 1;
                }

                if(window.ISCANCELLED){
                    throw "Trace Cancelled.";
                }

                return info.value;
            },
            stringifyCicleBreaker: function stringifyCicleBreaker( key, value){
                if(!this.cache){
                    this.cache = [];
                }

                if(this.cache.indexOf(value) > -1){
                    if(value != null && typeof value === "object"){
                        value = value.toString();
                    }
                }else{
                    this.cache.push(value);
                }

                return value;
            },
            getTraceData: function getTraceData() {
                return {
                    error       : this.error,
                    lastExpressionRange: this.currentExpressionRange,
                    hits        : this.hits,
                    data        : this.data,
                    stack       : this.stack,
                    execution   : this.execution,
                    variables   : this.variables,
                    values      : this.values,
                    timeline    : this.timeline,
                    identifiers : this.identifiers
                };
            }
        };
        `;
    }
}