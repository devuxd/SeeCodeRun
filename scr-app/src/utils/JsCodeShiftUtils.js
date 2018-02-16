import j from 'jscodeshift';

export const toAst=(source, options) => {
  if (options) {
    return j(source, options);
  }
  return j(source);
};

const getFirstNode=(jPath, j) => {
  return j(jPath).get('body', 0).node;
};


//
// export const wrapCallExpressions=(ast, locationMap) => {
//   const paths=[];
//   let wrapped=ast
//     .find(j.CallExpression)
//     .forEach(
//       path => paths.unshift(path)
//     );
//
//   for (const i in paths) {
//     const path=paths[i];
//     j(path).replaceWith(p => {
//         const parametersSource=j(p).toSource();
//         let id=locationMap.length;
//         locationMap.push({
//           type: l.FunctionCall,
//           expressionType: j.ExpressionStatement.name,
//           loc: {...path.value.loc}
//         });
//
//         return j.callExpression(l.g,
//           [j.identifier(`${id}`), j.identifier(parametersSource)]);
//       }
//     );
//   }
//
// };

// function wrapMemberExpressions(ast, j) {
//   const paths=[];
//   let wrapped=ast
//     .find(j.MemberExpression)
//     .forEach(
//       path => paths.unshift(path)
//     );
//
//   for (const i in paths) {
//     const path=paths[i];
//     console.log(j(path).toSource(), j(path.value.object).toSource());
//
//
//     j(path).replaceWith(p => {
//       console.log('>', j(p).toSource(), p.value)
//       let object=p.node.object;
//       if (p.value.object) {
//         object=j.callExpression(j.identifier('_'),
//           [j.identifier(j(p.value.object).toSource())]);
//       }
//       return j.memberExpression(object, p.node.property);
//
//     });
//
//     j(path).replaceWith(p => {
//         const parametersSource=j(p).toSource();
//         return j.callExpression(l.g,
//           [j.identifier(parametersSource)]);
//       }
//     );
//
//
//   }
// }

// function wrapNewExpressions(ast, j) {
//   const paths=[];
//   let wrapped=ast
//     .find(j.NewExpression)
//     .forEach(
//       path => paths.unshift(path)
//     );
//
//   for (const i in paths) {
//     const path=paths[i];
//     j(path).replaceWith(p => {
//         const parametersSource=j(p).toSource();
//         return j.callExpression(j.identifier('_'),
//           [j.identifier(parametersSource)]);
//       }
//     );
//   }
//
// }
//
// export function wrapFunctionExpressions(ast, locationMap) {
//   const paths=[];
//   let wrapped=ast
//     .find(j.FunctionExpression)
//     .forEach(
//       path => paths.unshift(path)
//     );
//   //const ast = j(source).get();
//
//   for (const i in paths) {
//     const path=paths[i];
//     const body=path.node.body.body;// block statement body of function body
//     path.node.scr=path.node.params
//     console.log(path.node);
//
//     let id=locationMap.length;
//     locationMap.push({
//       type: l.FunctionStart,
//       expressionType: j.ExpressionStatement.name,
//       loc: {...path.value.loc}
//     });
//
//     body.unshift(j.expressionStatement(j.callExpression(
//       j.identifier('_'),
//       [j.identifier(`${id}`), j.identifier('arguments')]
//     )));
//     // console.log(body[body.length-1]);
//     if (body.length && body[body.length - 1].type !== 'ReturnStatement') {
//       id=locationMap.length;
//       locationMap.push({
//         type: l.FunctionEnd,
//         expressionType: body[body.length - 1].type,
//         loc: {...path.value.loc}
//       });
//
//       body.push(j.expressionStatement(j.callExpression(
//         l.g,
//         [j.identifier(`${id}`)]
//       )));
//     }
//     console.log(path.value.loc);
//
//
//     j(path).find(j.ReturnStatement).replaceWith(p => {
//         id=locationMap.length;
//         locationMap.push({
//           type: l.FunctionEnd,
//           expressionType: body[body.length - 1].type,
//           loc: {...p.value.loc}
//         });
//
//         const parametersSource=j(p.value.argument).toSource();
//         return j.returnStatement(j.callExpression(l.g,
//           [j.identifier(`${id}`), j.identifier(parametersSource)]));
//       }
//     );
//   }
//
// }

// exception handlind pending
