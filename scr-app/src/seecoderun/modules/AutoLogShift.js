import j from "jscodeshift";
import {toAst} from "../../utils/jsCodeShiftUtils";

export const alt = {
  FunctionStart: 'FunctionStart',
  FunctionEnd: 'FunctionEnd',
  FunctionCall: 'FunctionCall'
};

export const l = {
  autoLogId: 'autoLog',
  preAutoLogId: 'preAutoLog',
  postAutoLogId: 'postAutoLog'
};

class AutoLogShift {
  constructor(autoLogName, preAutoLogName, postAutoLogName, liveExpressionStore) {
    this.autoLogName = l.autoLogId = autoLogName;
    this.preAutoLogName = l.preAutoLogId = preAutoLogName;
    this.postAutoLogName = l.postAutoLogId = postAutoLogName;
    this.liveExpressionStore = liveExpressionStore;
  }

  autoLogSource(text, locationMap, getLocationId) {
    let ast = toAst(text);
    if (!getLocationId) {
      getLocationId = () => locationMap.keys().length;
    }
    //  wrapFunctionExpressions(ast, locationMap);
    this.autoLogCallExpressions(ast, locationMap, getLocationId);
    return ast;
  }

  autoLogAst(ast, locationMap, getLocationId) {
    //  wrapFunctionExpressions(ast, locationMap);
    this.autoLogCallExpressions(ast, locationMap, getLocationId);
    return ast;
  }

  autoLogExpression(expression, id, isJ) {
    const jid = j.identifier(`'${id}'`);
    const jValue = isJ ? expression : j.identifier(expression);
    return j.callExpression(
      j.identifier(l.autoLogId),
      [
        j.callExpression(j.identifier(l.preAutoLogId), [jid]),
        jValue,
        j.callExpression(j.identifier(l.postAutoLogId), [jid])
      ]);
  }

  autoLogCallExpressions(ast, locationMap, getLocationId) {
    const paths = [];
    let wrapped = ast
      .find(j.CallExpression)
      .forEach(
        path => paths.unshift(path)
      );

    for (const i in paths) {
      const path = paths[i];
      j(path).replaceWith(p => {
          const pathSource = j(p).toSource();
          let id = path.value ? getLocationId(path.value.loc, j.CallExpression.name) : null;
          if (!id) {
            console.log('error', path, path.value, j.CallExpression.name);
            return;
          }
          locationMap[id] = {
            type: alt.FunctionCall,
            expressionType: j.ExpressionStatement.name,
            loc: {...path.value.loc}, //_.cloneDeep(path.value.loc)
          };
          console.log('id', id)
          return this.autoLogExpression(pathSource, id);
        }
      );
    }

  }

}

export default AutoLogShift;
