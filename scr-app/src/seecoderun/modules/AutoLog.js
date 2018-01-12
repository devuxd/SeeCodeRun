import {l, toAst, wrapCallExpressions, wrapFunctionExpressions} from "../../utils/JsCodeShiftUtils";

// const j = require('jscodeshift');


class AutoLog{
  constructor(text){
    this.locationMap = [];
    this.text = text;
    this.ast = {};
  }

  static autoLogSource(text, locationMap){
    let ast = toAst(text);
    wrapFunctionExpressions(ast, locationMap);
    wrapCallExpressions(ast, locationMap);
    return ast;
  }

  toSource(){
    this.ast = AutoLog.autoLogSource(this.text, this.locationMap);
    console.log(this.locationMap);
  return this.ast.toSource();
  }
}

export default AutoLog;
