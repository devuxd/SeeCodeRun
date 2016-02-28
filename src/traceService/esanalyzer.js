import esprima from 'esprima';
import estraverse from 'estraverse';
export class EsAnalyzer {

    constructor() {
      this.esprima = esprima;
      this.estraverse = estraverse;
    }
    getEsprima(){
      return this.esprima;
    }
   
}