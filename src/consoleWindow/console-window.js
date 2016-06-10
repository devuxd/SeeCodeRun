export class ConsoleWindow {
    title = 'Console';
    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
        this.subscribe();
    }
    
    attached() {
        let logger = console.log;
        let log = [];
        console.log = function consoleWindowLog() {
            log.push(Array.prototype.slice.call(arguments));
  	        logger.apply(this, Array.prototype.slice.call(arguments));
  	    };
  	    
  	    this.log = log;
    }
    
    subscribe() {
      let ea = this.eventAggregator;

      ea.subscribe('iframeError', payload => {
        console.log(payload.err);
      });
      
      ea.subscribe('iframeConsoleLog', payload => {
        console.log(payload.log);
      });
    }
}
