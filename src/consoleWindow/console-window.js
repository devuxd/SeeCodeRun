

export class ConsoleWindow {
    
    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
        this.title = 'Console';
    }
    

    // TODO: this does not wrok! see github repo for more information.
    attached() {
        let logger = console.log;
        let log = [];
        
        console.log = function () {
            log.push(Array.prototype.slice.call(arguments));
  	        logger.apply(this, Array.prototype.slice.call(arguments));
  	    };
  	    
  	    this.log = log;
    }
}
