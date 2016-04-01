import esprima from 'esprima';

export class TraceService {

    constructor() {
        this.esprima = esprima;
    }

    getTrace(code) {
        let syntax = this.esprima.parse(code, { loc: true});
        
        let toReturn = [];
        
        for(let node of syntax.body) {
        if(node.type === 'VariableDeclaration') {
          let init = node.declarations[0].init;
          
          if(init.type === 'Literal') {
            let variableName = node.declarations[0].id.name;
            let content = `{ ${variableName}: ${init.value} }`;
            
            toReturn.push({
              location: {
                row: init.loc.start.line - 1,
                col: init.loc.start.col
              },
              content: content
            });  
          }
        }
      }
      
      return toReturn;
    }
	
	getCreate(){
    
  }
}