export class ConsoleWindow {
    
    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
        this.title = 'Console';
        this.errorFormat= ' color:red;'
        this.subscribe();
    }
    
    attached() {
        let logger = console.log;
        let log = [];
        console.count();
        console.log = function () {
            log.push(Array.prototype.slice.call(arguments));
  	        logger.apply(this, Array.prototype.slice.call(arguments));
  	    };
  	    
  	    this.log = log;
    }
    
    subscribe() {
      let ea = this.eventAggregator;

      ea.subscribe('iframeError', payload => {
        console.log(JSON.stringify(payload.err));
      });
      
      ea.subscribe('iframeConsoleLog', payload => {
        console.log(JSON.stringify(payload.log));
      });
    }
}
