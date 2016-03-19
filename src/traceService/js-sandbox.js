/* global Firepad */
/* global Firebase */
/* global ace */
import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class JsSandBox {

  constructor(eventAggregator) {
    this.eventAggregator = eventAggregator;
  }

  attached(code) {
    let sandbox = ace.edit('sandBoxDiv');
    this.sandbox = sandbox;
    if(code){
      sandbox.setValue = code;
    }else{
      this.subscribe();
    }
  }
  
  subscribe() {
    let ea = this.eventAggregator;
    let sandbox = this.sandbox;
    let jsSandBox = this;

    ea.subscribe('onTraceChanged', payload => {
      sandbox.setValue = payload.code;
      jsSandBox.attached();
      console.log(JSON.stringify(window.TRACE.getExecutionTrace()));
      
    });

    
  }

  
}

