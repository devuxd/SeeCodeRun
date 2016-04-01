<<<<<<< HEAD
import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
<<<<<<< HEAD
=======

>>>>>>> parent of 8e0a935... Merge pull request #57 from tlatoza/feature-30
@inject(EventAggregator)
=======
>>>>>>> parent of 82bf960... Merge pull request #69 from tlatoza/Abdulaziz
export class ConsoleWindow {
    
    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
        this.title = 'Console';
    }
    
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
