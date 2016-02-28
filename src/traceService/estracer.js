import {inject} from 'aurelia-framework';
//local imports
import {EsAnalyzer} from './esanalyzer';
import {EsInstrumenter} from './esinstrumenter';

export class EsTracer {

    constructor() {
      this.esanalyzer = new EsAnalyzer();
      this.esinstrumenter = new EsInstrumenter();
    }
    getEsAnalyzer(){
      return this.esanalyzer;
    }
    getTrace(code, callback) {
       
      
      
    }
    
   
}