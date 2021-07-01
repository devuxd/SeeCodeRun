import * as t from "@babel/types";


export function replaceExpressionWithBlock(
   path, property, node
) {
   if (!path?.node || !property) {
      return;
   }
   
   node = node ?? path.node[property];
   
   if (!node || t.isBlockStatement(node)) {
      return;
   }
   
   const {key, listKey, extra, data, directives, loc} = node;
   const blockStatement = t.blockStatement([node]);
   blockStatement.key = key;
   blockStatement.listKey = listKey;
   blockStatement.extra = extra;
   blockStatement.data = data;
   blockStatement.directives = directives;
   blockStatement.loc = loc;
   blockStatement.blockEnsured = true;
   path.node[property] = blockStatement;
}

export function ensureIfStatementBlock(path) {
   const node = path?.node;
   if (!node || !path.isIfStatement()) {
      return;
   }
   replaceExpressionWithBlock(path, "consequent");
   replaceExpressionWithBlock(path, "alternate");
}

export function isRequireCallExpression(pathOrNode) {
   return (
      pathOrNode?.node?.callee?.name === 'require' ||
      pathOrNode?.callee?.name === 'require'
   );
}

export function isImportCallExpression(pathOrNode) {
   return (
      t.isImport(pathOrNode?.node?.callee) || t.isImport(pathOrNode?.callee)
   );
}

export function isImportOrRequireCallExpression(pathOrNode) {
   return (
      isImportCallExpression(pathOrNode) ||
      isRequireCallExpression(pathOrNode)
   );
}

export function getSourceCode(pathOrNode, code = '') {
   const node = pathOrNode.node ?? pathOrNode;
   return node ? code.slice(node.start, node.end) : '';
}

export function getScopeUID(path) {
   const uid = path?.scope?.uid ?? null;
   return uid === null ? uid : `${uid}`;
}
