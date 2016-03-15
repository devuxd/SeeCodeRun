import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {ApplicationState} from '../ApplicationState';

//local imports
import {EsTracer} from './estracer';

@inject(EventAggregator, ApplicationState)
export class TraceService {

    constructor(eventAggregator, appState) {
      // inject code in the service. Dependencies failure happens here
      this.eventAggregator = eventAggregator;
      this.appState = appState;
      this.events = {
        onTraceServiceStart: {  event :'onTraceServiceStart', description : 'Building Tracer...' },
        onTraceServiceRunning: {  event :'onTraceServiceRunning', description : 'Tracing...' },
        onTraceServiceEnd :{  event :'onTraceServiceEnd', description : 'Trace build succesfully.' },
        onTraceServiceBusy : {  event :'onTraceServiceBusy', description : 'A previous trace is running.' },
        onTraceServiceException: {  event :'onTraceServiceException', description : 'Trace ended due to an exception.' }
      };
      
      this.timeLimit = 3000; //default timeout
      
      //singleton?
      if(this.appState && this.appState.configuration.tracer){
          this.estracer = this.appState.configuration.tracer;
          
            console.log("Old Instance");
      }else{
        this.estracer = new EsTracer(this.events);
        console.log("New Instance");
        if(this.appState){
            console.log("New Instance saved");
            this.appState.configuration.tracer = this.estracer;
        }
      }
      
     
    }
// exec-viz suscribe to the onTraceChanged event
//   onTraceChanged(result){
//         let traceHelper = new TraceHelper(result); 
//         traceHelper.getLine();
//   }
  
//paste-bin
// onDocumentChanged(){
//   let code =  ace.getText();
//   let traceresults = new TraceService().getTrace(code);
//   // do your magic
//   this.publish('onTraceChanged', traceresults);
// }
    getTimeLimit(){
       return this.timeLimit; 
    }
    setTimeLimit(timeLimit){
       this.timeLimit = timeLimit; 
    }
    cancelTrace(){
        this.estracer.ISCANCELLED = true;
    }
    
    getTrace(code, publisher) { //optional publisher
        if(!code){
          return {status: undefined, description : undefined , data : {}};
        }
        
        if(!publisher){
            publisher = this;
        }
        
        return this.estracer.traceExecution(code, this.timeLimit,  publisher);
        
    }
    

    // example using ACE Annotations
    showTraceAnnotations(aceEditor) {
            var annotations = aceEditor.getSession().getAnnotations();	
            annotations= annotations.concat(traceAnnotations);
    		aceEditor.getSession().setAnnotations(annotations);
    }
    
    // example of how to use the trace resulting data structure
    visualize(stackTrace){
        var i, entry, name, index;
        var stackText= "";
    	var repeat = 0;
    	var previousCall = "";
    	var previousIndex = -1;
        for (i = 0; i < stackTrace.length; i += 1) {
            entry = stackTrace[i];
            if(entry){
                name = entry.text;
        		index = entry.index;
        		 if(previousCall !== name){				 
        			 if(repeat > 0){
        				 stackText += previousIndex + " -- " + previousCall + "( + "+ repeat +" times) <br>";
        				 repeat = 0;
        			 }else{
        				 if(previousIndex > -1){
        					 stackText += previousIndex + " -- " + previousCall + "<br> ";
        				 }
        				 
        			 }
        			 previousCall = name;
        			 previousIndex = index;
        		 }else{
        			 repeat = repeat + 1; 
        		 }
            }
    		
        }
    	if(repeat > 0){
    		stackText +=  previousIndex + " -- " + previousCall + "( + "+ repeat +" times )";
    		repeat = 0;
    	}else{
    		if(previousIndex > -1){
    			stackText += previousIndex + " -- " + previousCall ;
    		}					 
    	}
    	
    	return stackText;  
    
    }
     // example of how to use the trace resulting data structure
  visualizeExecutionTrace(executionTrace){
        var i, entry;
        var stackText= "";

        for (i = 0; i < executionTrace.length; i += 1) {
            entry = executionTrace[i];
            stackText += i + " -- " + JSON.stringify(entry) + "<br> ";
           
        }
       
    	
    	return stackText;  
    
    }
    
    isPositioninRange(position, inRange){
        
        var matchesInOneLine = (
                position.row == inRange.start.row 
                && inRange.start.row  == inRange.end.row
                && position.column >= inRange.start.column
                && position.column <= inRange.end.column
            );
            
        if(matchesInOneLine){
            return true;
        }
            
        var matchesStart = (
                position.row == inRange.start.row 
                && inRange.start.row  < inRange.end.row
                && position.column >= inRange.start.column
            );
           
        if(matchesStart){
            return true;
        }
        
        var matchesEnd = (
                position.row == inRange.end.row
                && inRange.start.row  < inRange.end.row
                && position.column <= inRange.end.column
            );

        return matchesEnd;

    }
    
    isRangeInRange(isRange, inRange){
        return (
                (isRange.start.row >= inRange.start.row && isRange.start.column >= inRange.start.column)
    			 &&
    			(isRange.end.row <= inRange.end.row && isRange.end.column <= inRange.end.column)
    			);
    }
    
    isRangeInRangeStrict(isRange, inRange){
        return (
                (isRange.start.row >= inRange.start.row && isRange.start.column > inRange.start.column)
    			 &&
    			(isRange.end.row <= inRange.end.row && isRange.end.column < inRange.end.column)
    			);
    }
    
    subscribe() {
    // let ea = this.eventAggregator;
    // let session = this.session;
    
    // ea.subscribe('on', payload => {
    //   let doc = session.doc;
      
    //   doc.removeLines(0, doc.getLength());
      
    //   // TODO: fix uncaught length error
    //   doc.insertLines(0, new Array(payload.length - 1));
      
    //   for(let result of payload.syntax) {
    //     doc.insertInLine({
    //       row: result.location.row,
    //       column: result.location.col
    //     }, result.content);
    //   }
    // });
  }
  publish(event, payload){
     let ea = this.eventAggregator;
     if(ea){
        ea.publish(event, payload);
     }
  }
}