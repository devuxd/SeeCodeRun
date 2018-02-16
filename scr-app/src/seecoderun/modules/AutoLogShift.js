import j from "jscodeshift";
import {toAst} from "../../utils/JsCodeShiftUtils";

export const alt={
  FunctionStart: 'FunctionStart',
  FunctionEnd: 'FunctionEnd',
  FunctionCall: 'FunctionCall'
};

export const l ={
  autoLogId: 'autoLog',
  preAutoLogId: 'preAutoLog',
  postAutoLogId: 'postAutoLog'
};

class AutoLogShift {
  constructor(autoLogName, preAutoLogName, postAutoLogName, liveExpressionStore) {
    this.autoLogName= l.autoLogId=autoLogName;
    this.preAutoLogName=l.preAutoLogId=preAutoLogName;
    this.postAutoLogName=l.postAutoLogId=postAutoLogName;
    this.liveExpressionStore = liveExpressionStore;
  }
  
  autoLogSource(text, locationMap){
    let ast = toAst(text);
    //  wrapFunctionExpressions(ast, locationMap);
    this.autoLogCallExpressions(ast, locationMap);
    return ast;
  }
  
  autoLogExpression(expression, id, isJ) {
    const jid=j.identifier(`${id}`);
    const jValue = isJ? expression: j.identifier(expression);
    return j.callExpression(
      j.identifier(l.autoLogId),
      [
        j.callExpression(j.identifier(l.preAutoLogId), [jid]),
        jValue,
        j.callExpression(j.identifier(l.postAutoLogId), [jid])
      ]);
  }
  
  autoLogCallExpressions(ast, locationMap) {
    const paths=[];
    let wrapped=ast
      .find(j.CallExpression)
      .forEach(
        path => paths.unshift(path)
      );
    
    for (const i in paths) {
      const path=paths[i];
      j(path).replaceWith(p => {
          const pathSource=j(p).toSource();
          let id=locationMap.length;
          locationMap.push({
            type: alt.FunctionCall,
            expressionType: j.ExpressionStatement.name,
            loc: {...path.value.loc}
          });
          
          return this.autoLogExpression(pathSource, id);
        }
      );
    }
    
  }
  
}

export default AutoLogShift;
