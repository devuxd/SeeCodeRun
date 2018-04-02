import j from "jscodeshift";
import _ from 'lodash';

export const toAst = (source, options) => {
  if (options) {
    return j(source, options);
  }
  return j(source);
};

export const alt = {
  Expression: 'Expression',
  BlockStart: 'BlockStart',
  BlockEnd: 'BlockEnd',
  BlockControl: 'BlockControl'
};

export const l = {
  autoLogId: 'autoLog',
  preAutoLogId: 'preAutoLog',
  postAutoLogId: 'postAutoLog',
};

class AutoLogShift {
  constructor(autoLogName, preAutoLogName, postAutoLogName) {
    this.autoLogName = l.autoLogId = autoLogName;
    this.preAutoLogName = l.preAutoLogId = preAutoLogName;
    this.postAutoLogName = l.postAutoLogId = postAutoLogName;
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
    // console.log('al',!!ast, !!locationMap);
    //  wrapFunctionExpressions(ast, locationMap);
    // this.autoLogCallExpressions(ast, locationMap, getLocationId);
    // try {
    this.autoLogExpressions(ast, locationMap, getLocationId);
    this.autoLogBlocks(ast, locationMap, getLocationId);
    // } catch (e) {
    //   console.log('j', e)
    // }

    // console.log(locationMap);
    return ast;
  }

  autoLogExpression(expression, id, type, path, p, params) {
    const jid = j.identifier(`'${id}'`);
    const jValue = _.isString(expression) ? j.identifier(expression) : expression;
    let property;
    let isComputed;

    params = params || [
      j.callExpression(j.identifier(l.preAutoLogId),
        [
          jid,
        ]),
      jValue,
      j.callExpression(j.identifier(l.postAutoLogId), [jid]),
    ];

    const alExpression = j.callExpression(j.identifier(l.autoLogId), params);
    return j.memberExpression(alExpression, j.identifier('_'), false);
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
            console.log('error', path.value, j.CallExpression.name);
            return;
          }
          locationMap[id] = {
            type: alt.FunctionCall,
            expressionType: j.ExpressionStatement.name,
            loc: {...path.value.loc}, //_.cloneDeep(path.value.loc)
          };
          //  console.log('id', id)
          return this.autoLogExpression(pathSource, id);
        }
      );
    }

  }

  static SupportedExpressions = [
    'ThisExpression',
    'ArrayExpression',
    'ObjectExpression',
    'UnaryExpression',
    'UpdateExpression',
    'BinaryExpression',
    'CallExpression',
    'NewExpression',
    'MemberExpression',
    'AssignmentExpression',
    'Identifier',
    // 'FunctionExpression', is as block
  ];

  composedExpressions = {
    MemberExpression: ({ast, locationMap, getLocationId, path}, {pathSource, id, type, p}) => {
      const jid = j.identifier(`'${id}'`);
      const object = path.value.object;//node
      // console.log(object)
      const property = path.value.computed ? path.value.property : j.identifier(`'${j(path.value.property).toSource()}'`);
      const objectId = object && object.loc ? getLocationId(object.loc, object.type) : null;
      const propertyId = path.value.property ?
        path.value.property.loc ? getLocationId(path.value.property.loc, path.value.property.type) : null : null;
      const params = [
        j.callExpression(j.identifier(l.preAutoLogId),
          [
            jid,
          ]),
        j.identifier(`${j(object).toSource()}`),
        j.callExpression(j.identifier(l.postAutoLogId), [jid]),
        j.identifier(`'MemberExpression'`),
        property,
        j.identifier(`['${objectId}', '${propertyId}']`),
      ];
      return this.autoLogExpression(pathSource, id, type, path, p, params);
    },
    // BinaryExpression: (ast, locationMap, getLocationId, path) => {
    // },
    // CallExpression: (ast, locationMap, getLocationId, path) => {
    // },
    // NewExpression: (ast, locationMap, getLocationId, path) => {
    // },
    // FunctionExpression: (ast, locationMap, getLocationId, path) => {
    // },
  };

  static SupportedBlocks = [
    'Function',
    'IfStatement',
    'SwitchStatement',
    'SwitchCase',
    'ReturnStatement',
    'ThrowStatement',
    'TryStatement',
    'WhileStatement',
    'DoWhileStatement',
    'ForStatement',
    'ForInStatement',
    'FunctionDeclaration',
    'DoWhileStatement',
    'FunctionExpression',
    'ArrowFunctionExpression', // look separatly for cases with blocks
    //Program  is not a block
  ];
  static composedBlocks = {
    '': () => {

    },
    CallExpression: (ast, locationMap, getLocationId, path) => {
    },
    NewExpression: (ast, locationMap, getLocationId, path) => {
    },
    FunctionExpression: (ast, locationMap, getLocationId, path) => {
    },
  };

  // static ComposedExpressions= Object.keys(AutoLogShift.composedExpressions);

  autoLogExpressions(ast, locationMap, getLocationId) {
    const paths = [];
    let wrapped = ast
      .find(j.Expression)
      .forEach(
        path => paths.unshift(path)
      );

    for (const i in paths) {
      const path = paths[i];
      const type = path.value ? path.value.type : null;
      const loc = type ? path.value.loc : null;
      let id = loc ? getLocationId(loc, type) : null;

      const parentPath = path ? path.parentPath : null;
      const parentType = parentPath.value ? parentPath.value.type : null;
      const parentLoc = parentType ? parentPath.value.loc : null;
      let parentId = parentLoc ? getLocationId(parentLoc, parentType) : null;

      if (id) {
        if (AutoLogShift.SupportedExpressions.includes(type)) {
          let isValid = true;
          if (type === j.MemberExpression.name && parentType === j.CallExpression.name) {
            isValid = false; // c of c() => handled in parent
          }

          if (path.name === 'left' && parentType === j.AssignmentExpression.name) {
            isValid = false; // x of x= y => handled in parent
          }

          if (path.name === 'id' && parentType === j.VariableDeclarator.name) {
            isValid = false; //  x of let x=y => handled in parent
          }

          if (type === j.Identifier.name && (parentType === j.MemberExpression.name || parentType === j.CallExpression.name)) {
            isValid = false; //  x of let x=y => handled in parent
          }

          if (isValid) {
            j(path).replaceWith(p => {
                const pathSource = j(p).toSource();
                locationMap[id] = {
                  type: alt.FunctionCall,
                  expressionType: type,
                  loc: {...path.value.loc},
                };

                if (this.composedExpressions[type]) {
                  return this.composedExpressions[type]({ast, locationMap, getLocationId, path}, {
                    pathSource,
                    id,
                    type,
                    p
                  });
                } else {
                  return this.autoLogExpression(pathSource, id, type, path, p);
                }
              }
            );
          } else {
            //     console.log('ignoring duplicate: memberExp of callExp', type, loc, path);
          }
        } else {
          if (AutoLogShift.SupportedBlocks.includes(type)) {
            // console.log('block', type, loc, path);
          } else {
            // console.log('ignored', type, loc, path);
          }
        }
      } else {
        console.log('critical', type, loc, path);
      }
    }

  }

  autoLogBlocks(ast, locationMap, getLocationId) {
    const paths = [];
    let wrapped = ast
      .find(j.BlockStatement)
      .forEach(
        path => paths.unshift(path)
      );

    for (const i in paths) {
      const path = paths[i];
      const type = path.value ? path.value.type : null;
      const loc = type ? path.value.loc : null;
      let id = loc ? getLocationId(loc, type) : null;
      if (id) {
        if (path.parentPath) {
          const parentType = path.parentPath.value.type;
          const parentLoc = parentType ? path.parentPath.value.loc : null;
          let parentId = parentLoc ? getLocationId(parentLoc, parentType) : null;
          if (parentId) {
            if (AutoLogShift.SupportedBlocks.includes(parentType)) {
              // console.log('b', j(path.parentPath.value).toSource());
              // const body = path.value.body
              // body.unshift(j.expressionStatement());
              // // console.log(body[body.length-1]);
              // if(body.length && body[body.length-1].type !== 'ReturnStatement'){
              //   id = locationMap.length;
              //   locationMap.push({type: FUNCTION_END, expressionType: body[body.length-1].type,loc:{...path.value.loc}});
              //
              //   body.push(j.expressionStatement(j.callExpression(
              //     j.identifier('_'),
              //     []
              //   )));
              // }
              // console.log(path.value.loc);
              //
              //
              // j(path).find(j.ReturnStatement).replaceWith(p =>{
              //     const parametersSource = j(p.value.argument).toSource();
              //     return  j.returnStatement(j.callExpression(j.identifier('_'),
              //       [j.identifier(parametersSource)]));
              //   }
              // );

            } else {
              console.log('critical parent', type, loc, path, parentType, parentLoc);
            }

          } else {
            console.log('ignored', path.parentPath.value.toSource());
          }
        } else {
          console.log('ignored no parent', path.value.body.length,);
        }
      }
      else {
        if (AutoLogShift.SupportedExpressions.includes(type)) {
          //console.log('block', expressionType, loc, path);
        } else {
          console.log('critical', type, loc, path);
        }
      }
    }

  }

}

export default AutoLogShift;
