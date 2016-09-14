import {TraceModel} from '../trace-model';
export class AutoLogTracer{
    constructor(traceDataContainer){
        this.traceDataContainer = traceDataContainer;
        this.traceModel = new TraceModel();
    }

    wrapCodeInTryCatch(code){
        return `
                ${code}
                window.IS_AFTER_LOAD = true;
                window.START_TIME = null;
                clearTimeout(window.TRACE.runTimeout);
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
        traceDataContainerElement.textContent= window.TRACE.stringify(window.TRACE.getTraceData());
        `;
    }

    getAutologCodeBoilerPlate(timeLimit){
        return `
        /*AutoLogTracer*/

        var isIntercepted;
        (function () {
            if(isIntercepted){
                return;
            }
            isIntercepted= true;

            var log = console.log;
            console.log = function () {
                if(window.TRACE.currentScope && window.TRACE.currentScope){
                  log.apply(this, [JSON.stringify({ type: "log", range: window.TRACE.currentScope.range, indexInTimeline: window.TRACE.currentScope.timelineStartIndex})].concat(Array.prototype.slice.call(arguments)));
                }else{
                    log.apply(this, Array.prototype.slice.call(arguments));
                }
            };

            window.onerror = function () {
                log.apply(this, [JSON.stringify({ type: "error", range: window.TRACE? window.TRACE.currentExpressionRange : null, indexInTimeline: window.TRACE && window.TRACE.timeline && window.TRACE.timeline.length? window.TRACE.timeline.length - 1: 0})].concat(Array.prototype.slice.call(arguments)));
                return true;
            };
        }());

        window.TIME_LIMIT = ${timeLimit};
        window.START_TIME = +new Date();

        var Syntax =  ${JSON.stringify(this.traceModel.esSyntax)};
        var TraceRuntimeTypes =  ${JSON.stringify(this.traceModel.traceRuntimeTypes)};
        var TraceTypes = ${JSON.stringify(this.traceModel.traceTypes)};
        window.ISCANCELLED = false;
        window.TRACE = {
            indexInTimeline: 0, scopeCounter: 0, currentScope: null, functionScopes : [], updateTimeout: null, error: "", currentExpressionRange: null, hits: {}, data: {}, stack : {},  execution : [], variables: [], values : [], timeline: [], identifiers: [],
            decycle: function decycle(obj) {
              var keys = [];
              var stack = [];
              var stackSet = new Set();
              var detected = false;
              function visit(obj, key) {
                if (obj == null) { return obj; }
                if (typeof obj != 'object') { return obj; }
                if (stackSet.has(obj)) {
                  var oldindex = stack.indexOf(obj);
                  var l1 = keys.join('.') + '.' + key;
                  var l2 = keys.slice(0, oldindex + 1).join('.');
                  detected = true;
                  return "[Circular ~" +l1 +"= "+l2+ "]";
                }

                keys.push(key);
                stack.push(obj);
                stackSet.add(obj);
                var shadowCopy;
                if (obj instanceof Date){
                    shadowCopy = new obj.constructor(); //or new Date(obj);
                }else{
                  try{
                   shadowCopy =  obj.constructor();
                  }catch(e){

                  }
                }
                if(shadowCopy == null){
                    shadowCopy = {};
                }
                for (var k in obj) {
                  if (obj.hasOwnProperty(k)) {
                   shadowCopy[k]= visit(obj[k], k);
                  }
                }
                keys.pop();
                stack.pop();
                stackSet.delete(obj);
                return shadowCopy;
              }
              return visit(obj, 'root');
            },
            serialize: function serialize(object){
                let serializedObjectString;
                try{
                    // if(object && object.toString() ==="[object Arguments]"){
                    //     object = (object.length === 1 ? [object[0]] : Array.apply(null, object));
                    // }
                    object = this.decycle(object);
                    if(object && object.nodeType === 1){
                        serializedObjectString = this.tryToJSON(object);
                    }else{
                        serializedObjectString = this.stringify(object);
                    }
                }catch(e){
                    console.log("ERROR", object.toString(), object);
                    serializedObjectString = object == null? this.stringify(object): this.stringify(object.toString());
                }
                return serializedObjectString;
            },
            preautolog: function preAutolog(range, type, id, text){
            //todo: document.currentScript as context and handle a callstack per each one [Fixes timeout, Ajax callbacks and other external libraries interaction]
                var info = { id: id , value: null, range: range, type: type, text: text};
                this.currentExpressionRange = range;
                this.handleTryRescope(info);
                if(type === Syntax.CallExpression){
                    this.timeline.push(info);
                    this.enterFunctionScope(info);
                }

                if(info.type === "BlockStatement"){
                    clearTimeout(this.runTimeout);
                    this.runTimeout = setTimeout(function updateTrace(){
                        window.START_TIME = null;
                    }, window.TIME_LIMIT- 500);
                    window.START_TIME = window.START_TIME ? window.START_TIME : +new Date();
                }

                var duration  = 0;
                if(window.START_TIME){
                    duration = (+new Date()) - window.START_TIME;
                }

                if(duration > window.TIME_LIMIT){
                     throw "Trace Timeout. Running code exceeded " + window.TIME_LIMIT + " ms time limit.";
                }

                if(window.IS_AFTER_LOAD){
                    clearTimeout(this.updateTimeout);
                    this.updateTimeout = setTimeout(function updateTrace(){
                        window.START_TIME = null;
                        traceDataContainerElement.textContent = window.TRACE.stringify(window.TRACE.getTraceData());
                        traceDataContainerElement.click();
                    }, 100);
                }
                return window.TRACE;
            },  // From TraceHelper
            isRangeInRange: function isRangeInRange(isRange, inRange){
                var l1 = (isRange.start.row > inRange.start.row);
                var l2 = (isRange.start.row == inRange.start.row && isRange.start.column >= inRange.start.column);
                var r1 = (isRange.end.row < inRange.end.row);
                var r2 = (isRange.end.row == inRange.end.row && isRange.end.column <= inRange.end.column);
                return ((r1||r2))&&((l1||l2));
            }, // from "Jquery"
            isFunction: function isFunction(obj){
                return obj == null? false : toString.call( obj ) === "[object Function]";
            }, // from "Jquery"
            isWindow: function isWindow( obj ) {
        		return obj && obj === obj.window;
        	},
            enterFunctionScope: function enterFunctionScope(info){
                    var isRoot = this.functionScopes.length? false: true;
                    this.functionScopes.push({id: info.id, isRoot: isRoot, isLocal: false, isCallback: false, argumentsString: "[]", parametersString: "[]", range: info.range, functionRange: null, timelineStartIndex: this.timeline.length - 1, timelineEndIndex: 0});
                    this.scopeCounter = this.functionScopes.length - 1;
                    this.currentScope = this.functionScopes[this.scopeCounter];
                    this.timeline[this.currentScope.timelineStartIndex].isRoot = isRoot;
                    // console.log("enter " +info.id);
            },
            populateFunctionScope: function populateFunctionScope(info, infoValueString, key, isParameter){
            //todo callbacks
                if(!this.functionScopes.length || !info){
                    return;
                }

                let topScope = this.currentScope;
                topScope.isLocal = true;
                this.timeline[this.currentScope.timelineStartIndex].isLocal = true;
                topScope.functionRange = info.range;
                var calleeInfo = this.timeline[topScope.timelineStartIndex];
                var callArguments = info.value;

                var callExpressionArguments= [];
                var callExpressionText = calleeInfo.text;
                if(calleeInfo.text){
                    try{
                        var data = JSON.parse(calleeInfo.text);
                        callExpressionArguments = data.parameters;
                        callExpressionText = data.text;
                    }catch(e){}
                }
                var isExternalCallExpression = false;

                if(!callExpressionArguments){
                console.log(info);
                    isExternalCallExpression = true;
                    try{
                        var data = JSON.parse(info.text);
                        callExpressionArguments = data.params;
                        callExpressionText = data.text;
                    }catch(e){}
                }

                if(!callExpressionArguments){
                    var entry = { isParameter: true, id: info.id , value: infoValueString, range: info.range, type: info.type, text: info.text, key: key};
                    this.timeline.push(entry);
                    return;
                }

                if(callArguments){
                   for(var i = 0; i < callArguments.length; i++){
                        if(callExpressionArguments[i]){
                            callExpressionArguments[i].value = callArguments[i];
                        }
                   }
                }

                if(!isExternalCallExpression){

                }
                calleeInfo.text = this.serialize({text: callExpressionText, parameteres: callExpressionArguments});
                topScope.argumentsString = this.serialize(callExpressionArguments);
            },
            exitFunctionScope: function exitFunctionScope(info, isScopeToCatchBlock, isParameter){
                if(!this.functionScopes.length || !info){
                    return;
                }

                let topScope = this.currentScope;

                if(isScopeToCatchBlock){
                    // console.log("error -----> " + topScope.id);
                    this.timeline[topScope.timelineStartIndex].value= "EXCEPTION/ERROR THROWN";
                }else{
                    if(info.type === Syntax.CallExpression){
                        this.timeline[topScope.timelineStartIndex].value= this.serialize(info.value);
                    }
                }
                // console.log("exit " +topScope.id);
                topScope.timelineEndIndex = this.timeline.length;
                this.timeline[topScope.timelineStartIndex].path = this.serialize(this.functionScopes);
                this.timeline[topScope.timelineStartIndex].functionRange = topScope.functionRange;
                this.functionScopes.pop();
                this.scopeCounter = this.functionScopes.length - 1;
                this.currentScope = this.functionScopes[this.scopeCounter];
                // console.log("current " +(this.currentScope?this.currentScope.id: "none"));
            },
            handleTryRescope: function handleTryRescope(info){
                if(!this.functionScopes.length || !info){
                    return;
                }

                if(info.type ===  Syntax.BlockStatement || info.type === TraceRuntimeTypes.FunctionData){
                    return;
                }

                let isBadScope = false;

                do{
                    let topScope = this.currentScope;
                    if(topScope.functionRange === null){
                        // ignore if not local or function Data has not been reached
                        return;
                    }

                    if(!this.isRangeInRange(info.range, topScope.functionRange)){
                        isBadScope = true;
                        topScope.tryExit = true;
                        // console.log("TS: " +this.serialize(topScope.functionRange));
                        // console.log("CE: " + this.serialize(info.range));
                        this.exitFunctionScope(info, true);
                    }else{
                        isBadScope = false;
                    }
                }while(this.functionScopes.length && isBadScope);
            },
            autoLog: function autoLog(info) {
                var self = this;
                this.currentExpressionRange = info.range;

                var isParameter = false;
                var parameterData = null;
                if(info.type === TraceRuntimeTypes.Parameter){
                    isParameter = true;
                    parameterData = JSON.parse(info.extra);
                    info.type = parameterData.parameterType;
                    if(this.isFunction(info.value)){
                         parameterData.isCallback = true;
                    }
                }

                var key = info.indexRange[0]+ ':' + info.indexRange[1];
                var extra = info.extra;

                if(TraceTypes.Stack.indexOf(info.type) > -1){
                    if(extra){
                        var extraValues = extra.split(":");
                        if(extraValues.length > 1){
                            var blockId = extraValues[0];
                            var isEnteringBlock = extraValues[1] === "Enter" ? true : false;
                            var stackKey = key + ":" + blockId;
                            key = key + ":" + extra;

                            if(isEnteringBlock){
                                this.stack[key]= this.stack[key]? this.stack[key]+ 1 : 1;
                            }
                        }

                    }else{
                        this.stack[key]= this.stack[key]? this.stack[key]+ 1 : 1;
                    }
                }

                var infoValueString = this.serialize(info.value);

                if(info.type === Syntax.CallExpression && !isParameter){
                    this.exitFunctionScope(info);
                }else{

                    if(info.type === TraceRuntimeTypes.FunctionData){
                            this.populateFunctionScope(info, infoValueString, key);
                    }

                    var entry = { id: info.id , value: infoValueString, range: info.range, type: info.type, text: info.text, key: key};
                    if(isParameter){
                        entry.isParameter = true;
                        entry.callExpressionRange = parameterData.callExpressionRange;
                        entry.isCallback = parameterData.isCallback;
                    }
                    this.timeline.push(entry);
                    this.indexInTimeline = this.timeline.length;
                }

                if(TraceTypes.Expression.indexOf(info.type) > -1){
                    if(info.id){
                        this.values.push({indexInTimeline: this.indexInTimeline, id: info.id , value: infoValueString, range: info.range});
                    }else{
                        this.values.push({indexInTimeline: this.indexInTimeline, id: info.text , value: infoValueString, range: info.range});
                    }
                }

				if (this.hits.hasOwnProperty(key)) {
                    this.hits[key] = this.hits[key] + 1;
                    this.data[key].values.push({ indexInTimeline: this.indexInTimeline, infoValueString});
                }else{
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
                        values: [{  indexInTimeline: this.indexInTimeline, value : infoValueString}],
                        range: info.range,
                        extra : info.extra
                    };
                }

                if(window.ISCANCELLED){
                    throw "Trace Cancelled.";
                }

                return info.value;
            },
            stringify: function stringify(obj, replacer, spaces, cycleReplacer) {
                try{
                    return JSON.stringify(obj, this.serializer(replacer, cycleReplacer), spaces);
                }catch(e){
                    return obj == null? "" + obj: obj.toString();
                }
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
            tryToJSON: function tryToJSON(node){
                try{
                    return this.toJSON(node);
                }catch(e){
                    return this.serialize(node);
                }
            },
            toJSON: function toJSON(node, visited, visitedValue) {
            //https://gist.github.com/sstur/7379870
              visited = visited? visited : [];
              visitedValue = visitedValue? visitedValue : [];
              node = node || this;

              var obj = {
                nodeType: node.nodeType
              };

            var visitedIndex = visited.indexOf(node);
            if(visitedIndex > -1){
                return visitedValue[visitedIndex];
            }else{
                visited.push(node);
                visitedValue.push(obj);
            }

              if (node.tagName) {
                obj.tagName = node.tagName.toLowerCase();
              } else{
                  if (node.nodeName) {
                    obj.nodeName = node.nodeName;
                  }
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
                  arr[i] = this.toJSON(childNodes[i], visited, visitedValue);
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