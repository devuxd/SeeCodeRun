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
        var TraceRuntimeTypes =  ${JSON.stringify(this.traceModel.traceRuntimeTypes)};
        var traceTypes = ${JSON.stringify(this.traceModel.traceTypes)};
        window.ISCANCELLED = false;
        window.TRACE = {
            functionScopes : [], updateTimeout: null, error: "", currentExpressionRange: null, hits: {}, data: {}, stack : [], stackIndex: [{path: [], scope: "program"}],  execution : [], variables: [], values : [], timeline: [], identifiers: [],
            preautolog: function preAutolog(range, type, id, text){
                var info = { id: id , value: null, range: range, type: type, text: text};
                this.currentExpressionRange = range;
                if(type === Syntax.CallExpression){
                    this.timeline.push(info);
                    this.enterFunctionScope(info);
                }
                return window.TRACE;
            },
            enterFunctionScope: function enterFunctionScope(info){
                    this.functionScopes.push({id: info.id, parametersString: "[]", callerRange: info.range, range: null, timelineStartIndex: this.timeline.length - 1, timelineEndIndex: 0});
            },
            populateFunctionScope: function populateFunctionScope(info){
                if(!this.functionScopes.length || !info){
                    return;
                }

                let topScope = this.functionScopes[this.functionScopes.length - 1];
                topScope.range = info.range;
                var calleeInfo = this.timeline[topScope.timelineStartIndex];
                var callArguments = info.value;

                var callExpressionParameters= [];

                if(calleeInfo.text){
                    try{
                        callExpressionParameters = JSON.parse(calleeInfo.text).parameters;
                    }catch(e){}
                }

                if(callArguments){
                   for(var i = 0; i < callArguments.length; i++){
                        if(callExpressionParameters[i]){
                            callExpressionParameters[i].value = callArguments[i];
                        }
                   }
                }

                calleeInfo.text = this.stringify(callExpressionParameters);
                topScope.parametersString = calleeInfo.text;
            },
            exitFunctionScope: function exitFunctionScope(info){
                if(!this.functionScopes.length || !info){
                    return;
                }
                let topScope = this.functionScopes[this.functionScopes.length -1];
                this.timeline[topScope.timelineStartIndex].value= info.value;
                topScope.timelineEndIndex = this.timeline.length;
                this.timeline[topScope.timelineStartIndex].path = this.stringify(this.functionScopes);
                this.functionScopes.pop();
            },
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
                    if(info.value && info.value.nodeType === 1){
                        infoValueString = this.toJSON(info.value);
                    }else{
                        infoValueString = this.stringify(info.value);
                    }
                }catch(e){
                    infoValueString = info.value == null? null: info.value.toString();
                }

                if(traceTypes.Expression.indexOf(info.type) > -1){
                    if(info.id){
                        this.values.push({id: info.id , value: infoValueString, range: info.range});
                    }else{
                        this.values.push({id: info.text , value: infoValueString, range: info.range});
                    }
                }

                if(info.type === TraceRuntimeTypes.FunctionData){
                    this.populateFunctionScope(info);
                }

                if(info.type === Syntax.CallExpression){
                    this.exitFunctionScope(info);
                }else{
                    this.timeline.push({ id: info.id , value: infoValueString, range: info.range, type: info.type, text: info.text, key: key});
                }

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
            stringify: function stringify(obj, replacer, spaces, cycleReplacer) {
              return JSON.stringify(obj, this.serializer(replacer, cycleReplacer), spaces);
            },
            serializer: function serializer(replacer, cycleReplacer) {
              var stack = [], keys = [];

              if (cycleReplacer == null){
                  cycleReplacer = function(key, value) {
                    if (stack[0] === value) return "[Circular ~]";
                    return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]";
                  };
              }

              return function(key, value) {
                if(stack.length > 0){
                  var thisPos = stack.indexOf(this);
                  ~thisPos ? stack.splice(thisPos + 1) : stack.push(this);
                  ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key);
                  if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value);
                }else{
                    stack.push(value);
                }
                return replacer == null ? value : replacer.call(this, key, value);
              };
            },
            toJSON: function toJSON(node) {
            //https://gist.github.com/sstur/7379870
              node = node || this;
              var obj = {
                nodeType: node.nodeType
              };
              if (node.tagName) {
                obj.tagName = node.tagName.toLowerCase();
              } else
              if (node.nodeName) {
                obj.nodeName = node.nodeName;
              }
              if (node.nodeValue) {
                obj.nodeValue = node.nodeValue;
              }
              var attrs = node.attributes;
              if (attrs) {
                var length = attrs.length;
                var arr = obj.attributes = new Array(length);
                for (var i = 0; i < length; i++) {
                  var attr = attrs[i];
                  arr[i] = [attr.nodeName, attr.nodeValue];
                }
              }
              var childNodes = node.childNodes;
              if (childNodes) {
                length = childNodes.length;
                arr = obj.childNodes = new Array(length);
                for (i = 0; i < length; i++) {
                  arr[i] = this.toJSON(childNodes[i]);
                }
              }
              return obj;
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