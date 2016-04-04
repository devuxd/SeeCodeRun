export class Trace{
    constructor(trace){
        if(trace){
            this.updateTrace(trace);
        }else{
            this.resetTrace();
        }
    }
    
    updateTrace(trace){
        this.hits = trace.hits;
        this.data =  trace.data;
        this.stack = trace.stack;
        this.execution = trace.execution;
        this.variables = trace.variables;
        this.values = trace.values;
        this.timeline = trace.timeline;
        this.identifiers= trace.identifiers;
    }
    
    resetTrace(){
        this.hits = {};
        this.data =  {};
        this.stack = [];
        this.execution = [];
        this.variables = [];
        this.values = [];
        this.timeline = [];
        this.identifiers= [];
    }
}