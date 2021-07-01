import {
   ensureIfStatementBlock,
   isImportOrRequireCallExpression,
   getSourceCode,
   getScopeUID,
} from '../../utils/babelUtils';

import {
   babelParse,
   babelTraverse,
   babelGenerate,
   babelTypes as t,
   TraceEvents,
   ScopeTypes,
   isUnInitializedVariableDeclarator,
   isLoggableExpression,
   isLoggableExpressionBasedOnParent,
   isLoggableMemberExpression,
   isCollectionLikeExpression,
   resolveJSXExpressionReplacementType,
   isLoggableScope,
   isLoggableStatement,
   isLoggableExpressionArgument,
   isStatementOrExpressionWithArgument,
   isSupportingContextOfExpression,
   isControlScope,
   getScopeExitType,
   getPathScopeExits, getPathScopeType, ScopeExitTypes, isScopeExitStatement
} from "./ALE";

export function markPathAsVisited(path) {
   // keeps original path state if the path has been already visited
   path.state = path.state ?? true;
}

let makeAlIdentifier = (identifierName = 'l') => {
   const property = t.identifier(identifierName);
   if (globalObjectIdentifierName) {
      if (scrObjectIdentifierName) {
         const object = t.memberExpression(
            t.identifier(globalObjectIdentifierName),
            t.identifier(scrObjectIdentifierName)
         );
         return t.memberExpression(object, property);
      } else {
         const object = t.identifier(globalObjectIdentifierName);
         return t.memberExpression(object, property);
      }
      
   } else {
      if (scrObjectIdentifierName) {
         const object = t.identifier(scrObjectIdentifierName);
         return t.memberExpression(object, property);
      } else {
         return property;
      }
   }
};

let makeParamsIdentifier =
   (uid) => t.identifier(`${alParamsIdentifierName}${uid}`);

let buildExceptionCallbackString = () => `${
   globalObjectIdentifierName ? `${globalObjectIdentifierName}.` : ''
}${
   scrObjectIdentifierName ? `${scrObjectIdentifierName}.` : ''}${
   alExceptionCallbackIdentifierName
}`;

let buildGlobalScrObjectString = () => `${
   globalObjectIdentifierName ?
      `${globalObjectIdentifierName}.` : ''
}${
   scrObjectIdentifierName
}`;

let alValueParamNumber = 3; // parameter number in 'alIdentifier' call
let globalObjectIdentifierName = 'window.top';
let scrObjectIdentifierName = 'scr';
let alIdentifierName = "_l";
let alPreIdentifierName = '_i';
let alPostIdentifierName = '_o';
let alParamsIdentifierName = `_p`;
let alExceptionCallbackIdentifierName = `_e`;

let exceptionCallbackString = buildExceptionCallbackString();
let alIdentifier = makeAlIdentifier(alIdentifierName);
let alPreIdentifier = makeAlIdentifier(alPreIdentifierName);
let alPostIdentifier = makeAlIdentifier(alPostIdentifierName);
let globalScrObjectString = buildGlobalScrObjectString();

export const setAutoLogIdentifiers = (
   identifiers = {}
) => {
   makeAlIdentifier =
      identifiers.makeAlIdentifier ?? makeAlIdentifier;
   makeParamsIdentifier =
      identifiers.makeParamsIdentifier ?? makeParamsIdentifier;
   buildExceptionCallbackString =
      identifiers.buildExceptionCallbackString ??
      buildExceptionCallbackString;
   buildGlobalScrObjectString =
      identifiers.buildGlobalScrObjectString ??
      buildGlobalScrObjectString;
   
   alValueParamNumber =
      identifiers.alValueParamNumber ?? alValueParamNumber;
   globalObjectIdentifierName =
      identifiers.globalObjectIdentifierName ?? globalObjectIdentifierName;
   scrObjectIdentifierName =
      identifiers.scrObjectIdentifierName ?? scrObjectIdentifierName;
   alIdentifierName =
      identifiers.alIdentifierName ?? alIdentifierName;
   alPreIdentifierName =
      identifiers.alPreIdentifierName ?? alPreIdentifierName;
   alPostIdentifierName =
      identifiers.alPostIdentifierName ?? alPostIdentifierName;
   alExceptionCallbackIdentifierName =
      identifiers.alExceptionCallbackIdentifierName ??
      alExceptionCallbackIdentifierName;
   
   exceptionCallbackString = buildExceptionCallbackString();
   alIdentifier = makeAlIdentifier(alIdentifierName);
   alPreIdentifier = makeAlIdentifier(alPreIdentifierName);
   alPostIdentifier = makeAlIdentifier(alPostIdentifierName);
   globalScrObjectString = buildGlobalScrObjectString();
};

export const getAutoLogIdentifiers = () => ({
   makeAlIdentifier,
   makeParamsIdentifier,
   buildExceptionCallbackString,
   alValueParamNumber,
   globalObjectIdentifierName,
   scrObjectIdentifierName,
   alIdentifierName,
   alPreIdentifierName,
   alPostIdentifierName,
   alExceptionCallbackIdentifierName,
   globalScrObjectString,
   exceptionCallbackString,
   alIdentifier,
   alPreIdentifier,
   alPostIdentifier,
});


export function isAlNode(node) {
   return (
      node &&
      node.type === "CallExpression" &&
      (
         (
            (node.callee.type === 'Identifier'
               && node.callee.name === alIdentifierName) ||
            (node.callee.type === "MemberExpression"
               && node.callee.property.name === alIdentifierName))
         &&
         (
            !scrObjectIdentifierName ||
            (
               (node.callee.object.type === 'Identifier' &&
                  node.callee.object.name === scrObjectIdentifierName) ||
               (node.callee.object.type === "MemberExpression" &&
                  node.callee.object.property.name === scrObjectIdentifierName)
            )
         ) &&
         (!globalObjectIdentifierName ||
            (node.callee.object.object.type === 'Identifier'
               && node.callee.object.object.name === globalObjectIdentifierName)
         )
      )
   )
}

export function getOriginalNode(node) {
   if (!isAlNode(node)) {
      return node;
   }
   
   do {
      node = node?.arguments?.[alValueParamNumber];
   } while (isAlNode(node));
   
   return (node);
}


function makeAlPreCall(id, ...rest) {
   return t.callExpression(alPreIdentifier, [
      t.stringLiteral(`${id}`),
      ...rest
   ]);
}

function makeAlPostCall(id, ...rest) {
   return t.callExpression(alPostIdentifier, [
      t.stringLiteral(`${id}`),
      ...rest
   ]);
}

function makeAlCall(uid, ...rest) {
   return t.callExpression(alIdentifier, [
      t.stringLiteral(`${uid}`),
      t.stringLiteral(TraceEvents.L),
      ...rest
   ]);
}

function makeEnterCall(uid, scopeType, ...rest) {
   return t.callExpression(alIdentifier, [
      t.stringLiteral(`${uid}`),
      t.stringLiteral(TraceEvents.I),
      t.stringLiteral(scopeType),
      t.thisExpression(),
      ...rest
   ]);
}

function makeExitCall(uid, scopeType, scopeExitType, ...rest) {
   const paramsIdentifier =
      (scopeType === ScopeTypes.F ||
         scopeExitType === ScopeExitTypes.R ||
         scopeExitType === ScopeExitTypes.Y
      ) ? makeParamsIdentifier(uid)
         : t.identifier('undefined');
   return t.callExpression(alIdentifier, [
      t.stringLiteral(`${uid}`),
      t.stringLiteral(TraceEvents.O),
      t.stringLiteral(scopeType),
      t.thisExpression(),
      paramsIdentifier,
      t.stringLiteral(`${scopeExitType}`),
      ...rest
   ]);
}

function makeImportLogCall(id, ...rest) {
   return (
      t.callExpression(alIdentifier, [
         t.stringLiteral(`${id}`),
         t.stringLiteral(TraceEvents.P),
         ...rest
      ])
   );
}

function makeImportLogStatement(...rest) {
   return t.expressionStatement(makeImportLogCall(...rest));
}


// BABEL AUTO LOG EVERYTHING
let c = 0;
export default function BabeAutoLogEverything(
   code,
   zale,
   customTraverseEnter = null,
   customTraverseExit = null,
   options = {},
   onError,
   key = 0,
) {
   const disableConsoleWarnings =
      options === true || options.disableProgramScopeExit;
   const disableProgramScopeExit =
      options === true || options.disableProgramScopeExit;
   const enableDynamicImportDynamicSources =
      !options === true || options.enableDynamicImportDynamicSources;
   const _this = this;
   
   const scopesMaps = {};
   
   const bale = {
      ast: babelParse(code, onError),
      output: null,
      visitor: null,
      scopesMaps,
      error: null
   };
   
   if (!bale.ast) {
      bale.error = 'parse';
      return bale;
   }
   
   if (!zale) {
      bale.error = 'zale';
      return bale;
   }
   
   const {
      expressions, registerExpression, registerImport, zones
   } = zale;
   
   let lastImportStatement = null;
   let importsContainer = null;
   let makeImportLogStatements = [];
   
   c++;
   
   bale.visitor = {
      enter: (path) => {
         customTraverseEnter && customTraverseEnter(path, _this);
         
         if (path.state) {
            return;
         }
         
         if (path.key === 'left' && path.parentPath?.isAssignmentExpression()) {
            markPathAsVisited(path);
         }
         
         if (path.parentPath?.state) {
            markPathAsVisited(path);
         }
         
         if (path.isProgram()) {
            addScope(path);
            return;
         }
         
         if (
            isCollectionLikeExpression(path) ||
            isLoggableExpression(path) ||
            isLoggableExpressionBasedOnParent(path) ||
            isStatementOrExpressionWithArgument(path) ||
            isSupportingContextOfExpression(path) ||
            isScopeExitStatement(path)
         ) {
            registerExpression(path);
         }
         
         if (isLoggableScope(path)) {
            const expressionId = registerExpression(path);
            
            const scopeType = getPathScopeType(path);
            
            switch (scopeType) {
               case ScopeTypes.N:
                  break;
               case ScopeTypes.P:
               case ScopeTypes.S:
               case ScopeTypes.C:
                  addScope(path, scopeType, expressionId);
                  if (path.isLoop()) {
                     path.ensureBlock();
                     return;
                  }
                  
                  if (path.isIfStatement()) {
                     ensureIfStatementBlock(path);
                     return;
                  }
                  return;
               case ScopeTypes.F:
                  addScope(path, scopeType, expressionId);
                  path.ensureBlock();
                  return;
               case ScopeTypes.E:
                  addScope(path, scopeType, expressionId);
                  if (path.isCatchClause()) {
                     path.ensureBlock();
                  }
                  return;
               default:
            }
         }
      },
      exit: (path) => {
         customTraverseExit && customTraverseExit(path, _this);
         
         if (path.state) {
            return;
         }
         
         if (path.isProgram()) {
            wrapProgramScope(path);
         }
         
         if (isLoggableScope(path)) {
            
            const scopeType = getPathScopeType(path);
            
            switch (scopeType) {
               case ScopeTypes.N:
                  break;
               case ScopeTypes.S:
                  wrapClassScope(path);
                  break;
               case ScopeTypes.F:
                  wrapFunctionScope(path);
                  break;
               case ScopeTypes.E:
                  wrapExceptionScope(path);
                  break;
               case ScopeTypes.P:
               case ScopeTypes.C:
               default:
                  
                  if (// enter's ensureBlock guarantees isBlockStatement
                     path.isBlockStatement() &&
                     isControlScope(path.parentPath)
                  ) {
                     wrapControlScope(path);
                  }
                  
                  // isSwitchStatement not needed
                  if (path.isSwitchCase()) {
                     wrapSwitchCaseScope(path);
                  }
            }
            
         }
         
         // isStatementOrExpressionWithArgument
         if (isLoggableStatement(path)) {
            if (addScopeExit(path)) {
               return;
            }
         }
         
         const jsxReplacementType = resolveJSXExpressionReplacementType(path);
         if (jsxReplacementType) {
            logExpression(
               path, null, null, jsxReplacementType
            );
            return;
         } else {
            if (path.isJSXElement()) {
               logExpression(path);
               return;
            }
         }
         
         if (isLoggableExpression(path)) {
            if (isImportOrRequireCallExpression(path)) {
               logImportDeclaration(path);
            } else {
               logExpression(path);
            }
            return;
         }
         
         if (isLoggableExpressionBasedOnParent(path)) {
            if (isImportOrRequireCallExpression(path.parentPath)) {
               // enableDynamicImportDynamicSources:false
               // prevents logging imports or require call parameters
               enableDynamicImportDynamicSources && logExpression(path);
            } else {
               logExpression(path);
            }
            return;
         }
         
         if (isLoggableMemberExpression(path)) {
            if (isImportOrRequireCallExpression(path.parentPath)) {
               // enableDynamicImportDynamicSources:false
               // prevents logging imports or require call parameters
               enableDynamicImportDynamicSources && logExpression(path);
            } else {
               logExpression(path);
            }
            return;
         }
         
         // isStatementOrExpressionWithArgument with lower precedence
         if (isLoggableExpressionArgument(path)) {
            logExpression(path);
            return;
         }
         
         if (path.isImportDeclaration()) {
            logImportDeclaration(path);
            //return;
         }
      }
   };
   
   if (!babelTraverse(bale.ast, bale.visitor, onError)) {
      bale.error = 'traverse';
      return bale;
   }
   
   wrapLogImportDeclarations();
   
   bale.output = babelGenerate(bale.ast, code, onError);
   
   if (!bale.output) {
      bale.error = 'generate';
      return bale;
   }
   
   return bale;
   
   function track(path, ...rest) {
      console.log(key, getSourceCode(path, code), path, ...rest);
   }
   
   function trackWarn(path, ...rest) {
      (
         !disableConsoleWarnings &&
         console.warn(key, getSourceCode(path, code), path, ...rest)
      );
   }
   
   function trackOnly(onlyForKey, path, ...rest) {
      onlyForKey === key && track(path, ...rest);
   }
   
   
   function resolveContainingScope(path) {
      return scopesMaps[addScope(path)];
   }
   
   function addScope(path, scopeType, expressionId) {
      expressionId = expressionId ?? registerExpression(path);
      scopeType = scopeType ?? getPathScopeType(path);
      const uid = getScopeUID(path);
      
      if (uid && !scopesMaps[uid]) {
         scopesMaps[uid] = {
            uid,
            scopeType,
            path,
            expressionId,
            parentPath: path.parentPath, // in case context changes
            node: {...path.node},
            loc: {...path.node.loc},
            parentLoc: path.parentPath ? {...path.parentPath.node.loc} : null,
            exits: [],
            scopeExits: getPathScopeExits(path, registerExpression)
         };
      }
      
      return uid;
   }
   
   function addScopeExit(path) {
      const scopeExitType = getScopeExitType(path);
      const containingScope = resolveContainingScope(path);
      
      if (!scopeExitType || !containingScope) {
         return false;
      }
      const scopeType = containingScope.scopeType;
      const scopeExitId =
         containingScope.scopeExits[scopeExitType].uid ?? (
            scopeExitType === ScopeExitTypes.T ?
               containingScope.scopeExits[ScopeExitTypes.R].uid
               : containingScope.scopeExits[ScopeExitTypes.N].uid
         );
      
      const expressionId = registerExpression(path);
      const expressionIdNode = t.stringLiteral(`${expressionId}`);
      
      containingScope.exits.push(expressionId);
      markPathAsVisited(path);
      // scopeExitType === ScopeExitTypes.N is handled in default block wrapping
      
      if (
         scopeExitType === ScopeExitTypes.T ||
         scopeExitType === ScopeExitTypes.R ||
         scopeExitType === ScopeExitTypes.Y
      ) {
         const node = path.node;
         node.argument = makeExitCall(
            scopeExitId, //0
            scopeType,
            scopeExitType,
            expressionIdNode, // 2
            node.argument ?? t.identifier('undefined'),
         );
      } else {
         if (
            scopeExitType === ScopeExitTypes.C ||
            scopeExitType === ScopeExitTypes.B
         ) {
            const i = path.container?.indexOf(path.node);
            if (i > -1) {
               path.container.splice(
                  i,
                  0,
                  t.expressionStatement(
                     makeExitCall(
                        scopeExitId,
                        scopeType,
                        scopeExitType,
                        expressionIdNode,
                        t.identifier('undefined'),
                        t.identifier('undefined')
                        // 3 alValueParamNumber
                     )
                  )
               );
            } else {
               trackWarn(
                  path,
                  "! (p) => p.isSwitchCase()||p.isBlockStatement()"
               );
            }
         }
      }
      
      
      return true;
   }
   
   function getOriginalNodeExpressionIndex(_node) {
      const ogNode = getOriginalNode(_node);
      return expressions.findIndex(
         p => getOriginalNode(p.node) === ogNode
      );
   }
   
   function logExpression(path, type, node, jsxReplacementType) {
      const containingScope = resolveContainingScope(path);
      if (containingScope) {
         const extra = [];
         if (enableDynamicImportDynamicSources &&
            isImportOrRequireCallExpression(path)
         ) {
            path.node.arguments.forEach(argument => {
               const j = getOriginalNodeExpressionIndex(argument);
               if (j < 0) {
                  trackWarn(
                     path,
                     '! getOriginalNode found in expressions'
                  );
               }
               
               extra.push(t.stringLiteral(`${j}`));
               
            });
         }
         
         const i = registerExpression(path);
         markPathAsVisited(path);
         
         if (jsxReplacementType === "valueAppend") {
            path.node.value = t.jsxExpressionContainer(
               makeAlCall(
                  containingScope.uid,
                  makeAlPreCall(i),
                  t.booleanLiteral(true),
                  makeAlPostCall(i)
               )
            );
            return;
         }
         
         const isNonInitVariableDeclarator =
            isUnInitializedVariableDeclarator(path);
         
         node = node || path.node;
         const preExtra = [];
         
         const nodeLoc = path.node.loc;
         
         if (node.type === 'CallExpression') {
            const calleeType = node.callee.type;
            // preExtra.push(t.stringLiteral(`${node.type}`));
            // preExtra.push(t.stringLiteral(`${calleeType}`));
            preExtra.push(t.numericLiteral(
               getOriginalNodeExpressionIndex(node.callee)
            ));
            if (calleeType === "MemberExpression" ||
               calleeType === "OptionalMemberExpression") {
               preExtra.push(t.numericLiteral(
                  getOriginalNodeExpressionIndex(node.callee.object)
               ));
            }
         } else {
            if (
               node.type === 'JSXEmptyExpression' ||
               node.type === 'EmptyStatement' ||
               isNonInitVariableDeclarator
            ) {
               // preExtra.push(t.stringLiteral(`${node.type}`));
               node = t.identifier('undefined');
            }
            
            
         }
         
         let replacement = makeAlCall(
            containingScope.uid, // 0
            makeAlPreCall(i, ...preExtra), // 2
            node, // alValueParamNumber = 3
            makeAlPostCall(i),
            ...extra
         );
         
         
         if (isNonInitVariableDeclarator) {
            replacement = t.variableDeclarator(path.node.id, replacement);
         }
         
         if (jsxReplacementType === "containerWrap") {
            replacement = t.jsxExpressionContainer(replacement);
         }
         
         path.replaceWith(replacement);
         path.node.loc = path.node.loc ?? nodeLoc;
         
         
      } else {
         trackWarn(
            path,
            "!containingScope"
         );
      }
   }
   
   function wrapProgramScope(path) {
      const uid = getScopeUID(path);
      const paramsIdentifier = makeParamsIdentifier(uid);
      path.node.body.unshift(
         t.variableDeclaration("const", [
            t.variableDeclarator(
               paramsIdentifier, t.thisExpression(),
            )
         ]),
         t.expressionStatement(makeEnterCall(uid, ScopeTypes.P))
      );
      !disableProgramScopeExit &&   // alValueParamNumber
      path.node.body.push(t.expressionStatement(
         makeExitCall(uid, ScopeTypes.P, ScopeExitTypes.N))
      );
   }
   
   function wrapFunctionParams(path, paramsIdentifier) {
      path.node.body.body.unshift(
         t.variableDeclaration("let", [
            t.variableDeclarator(
               t.arrayPattern(path.node.params), paramsIdentifier
            )
         ])
      );
      path.node.params = [t.spreadElement(paramsIdentifier)];
   }
   
   function wrapFunctionScope(path) {
      const uid = getScopeUID(path);
      const paramsIdentifier = makeParamsIdentifier(uid);
      wrapFunctionParams(path, paramsIdentifier);
      let superI = -1;
      if (path.isClassMethod() && path.scope.block.kind === "constructor") {
         path.traverse({
            enter: (p) => {
               if (superI < 0) {
                  if (p.isSuper() && p.parentPath?.isCallExpression()) {
                     const stmnt = p.getStatementParent();
                     if (stmnt?.container === path.node.body.body) {
                        superI = stmnt.container.indexOf(stmnt.node);
                     } else {
                        trackWarn(
                           path,
                           "! stmnt?.container === path.node.body.body"
                        );
                     }
                  }
               } else {
                  p.stop();
               }
            }
         });
      }
      
      const enterCallStatement = t.expressionStatement(
         makeEnterCall(uid, ScopeTypes.F, paramsIdentifier)
      );
      
      if (superI < 0) {
         path.node.body.body.unshift(enterCallStatement);
      } else {
         path.node.body.body.splice(
            superI + 1,
            0,
            enterCallStatement
         );
      }
      
      path.node.body.body.push(
         t.expressionStatement(
            makeExitCall(uid, ScopeTypes.F, ScopeExitTypes.N)
         )
      );
   }
   
   function wrapControlScope(path) {
      const uid = resolveContainingScope(path).uid;
      if (path.parentPath.isForXStatement()) {
         const idNode =
            path.container.left?.type === "Identifier"
               ? path.container.left
               : path.container.left?.declarations?.[0]?.id;
         const ofIdNode =
            path.container.right?.type === "Identifier" ||
            (path.container.right?.type?.includes("Literal") &&
               !path.container.right?.type?.includes("Template"))
               ? path.container.right
               : null;
         if (idNode) {
            if (ofIdNode) {
               path.node.body.unshift(
                  t.expressionStatement(makeEnterCall(
                        uid, ScopeTypes.C, idNode, ofIdNode
                     )
                  )
               );
            } else {
               path.node.body.unshift(
                  t.expressionStatement(makeEnterCall(
                        uid, ScopeTypes.C, idNode
                     )
                  )
               );
            }
         }
      } else {
         path.node.body.unshift(t.expressionStatement(makeEnterCall(
            uid, ScopeTypes.C
         )));
      }
      path.node.body.push(t.expressionStatement(
         makeExitCall(uid, ScopeTypes.C, ScopeExitTypes.N))
      );
      // alValueParamNumber
      
   }
   
   function wrapSwitchCaseScope(path) {
      const uid = resolveContainingScope(path).uid;
      
      const expressionId = registerExpression(path);
      const expressionIdNode = t.stringLiteral(`${expressionId}`);
      const l = path.node.consequent.length;
      const needsExit = l < 1 || !!path.node.consequent[l - 1].state;
      path.node.consequent.unshift(
         t.expressionStatement(
            makeEnterCall(
               uid, ScopeTypes.A, expressionIdNode
            )
         )
      );
      
      if (needsExit) {
         path.node.consequent.push(
            t.expressionStatement(
               makeExitCall(uid, ScopeTypes.C, ScopeExitTypes.N, expressionIdNode)
            ) // alValueParamNumber
         );
      }
   }
   
   function wrapExceptionScope(path) {
      const uid = resolveContainingScope(path)?.uid;
      const tryBlockType = t.stringLiteral(`${path.key}`);
      const isHandler = path.key === 'handler';
      const body = isHandler ? path.node.body.body : path.node.body;
      
      if (isHandler) {
         body.unshift(
            t.expressionStatement(
               makeEnterCall(uid, ScopeTypes.E, tryBlockType, path.node.param)
            )
         );
      } else {
         body.unshift(
            t.expressionStatement(makeEnterCall(uid, ScopeTypes.E, tryBlockType))
         );
      }
      
      body.push(
         t.expressionStatement(makeExitCall(uid, ScopeTypes.E, ScopeExitTypes.N))
      ); //alValueParamNumber
   }
   
   function wrapClassScope(path) {
      const i = registerExpression(path);
      if (path.isClassDeclaration()) {
         const containingScope = resolveContainingScope(path);
         const ib = path.container?.indexOf?.(path.node);
         if (ib > -1) {
            path.container.splice(
               ib + 1,
               0,
               t.expressionStatement(
                  makeAlCall(
                     containingScope.uid,
                     makeAlPreCall(i),
                     path.node.id,
                     makeAlPostCall(i)
                  )
               )
            );
         } else {
            trackWarn(
               path,
               "! path.container?.indexOf?.(path.node)"
            );
         }
      } else {
         logExpression(path);
      }
   }
   
   function logImportDeclaration(path) {
      if (isImportOrRequireCallExpression(path)) {
         
         const importSourceName = (
            t.isStringLiteral(path.node.arguments?.[0]) &&
            path.node.arguments[0].value
         );
         
         if (!importSourceName) {
            if (enableDynamicImportDynamicSources) {
               logExpression(path);
            } else {
               trackWarn(
                  path,
                  '! isStringLiteral: import/require source '
               );
            }
            return;
         }
         
         
         const nodeLoc = path.node.loc;
         const i = registerExpression(path);
         markPathAsVisited(path);
         
         const uid = getScopeUID(path);
         const uidParent = getScopeUID(path.parentPath);
         const j = registerImport(
            importSourceName, path, i, uid, uidParent
         );
         
         path.replaceWith(
            t.parenthesizedExpression(
               t.logicalExpression("||", makeImportLogCall(
                     i,
                     path.node.arguments[0],
                     t.stringLiteral(`${j}`),
                  ),
                  path.node
               )
            )
         );
         path.node.loc = path.node.loc ?? nodeLoc;
         return;
      }
      
      const i = registerExpression(path);
      markPathAsVisited(path);
      
      if (importsContainer) {
         if (importsContainer !== path.container) {
            trackWarn(
               path,
               "! importsContainer === path.container"
            );
            lastImportStatement = null;
         } else {
            lastImportStatement = path.node;
         }
      } else {
         importsContainer = path.container;
         lastImportStatement = path.node;
      }
      
      const importSourceName = path.node.source.value;
      const uid = getScopeUID(path);
      const uidParent = getScopeUID(path.parentPath);
      
      if (!path.node.specifiers.length) {
         registerImport(
            importSourceName, path.node, i, uid, uidParent
         );
         return;
      }
      
      path.node.specifiers.forEach((s) => {
         const j = registerImport(
            importSourceName, s, i, uid, uidParent
         );
         
         if (s.local?.name === s.imported?.name) {
            makeImportLogStatements.push(
               makeImportLogStatement(
                  i,
                  path.node.source,
                  t.stringLiteral(`${j}`),
                  s.local
               )
            );
         } else {
            const lId =
               s.local?.name === s.imported?.name
                  ? s.local
                  : t.identifier(`${s.local.name}${getScopeUID(path)}`);
            makeImportLogStatements.push(
               makeImportLogStatement(
                  i,
                  path.node.source,
                  t.stringLiteral(`${j}`),
                  lId
               ),
               t.variableDeclaration(
                  "let",
                  [t.variableDeclarator(s.local, lId)]
               )
            );
            s.local = lId;
         }
      });
   }
   
   function wrapLogImportDeclarations() {
      if (lastImportStatement && importsContainer) {
         const afterLastImportI =
            importsContainer.indexOf(lastImportStatement) + 1;
         if (afterLastImportI) {
            importsContainer.splice(
               afterLastImportI,
               0,
               ...makeImportLogStatements
            );
         } else {
            !disableConsoleWarnings && console.warn("! no import block");
         }
      }
   }
}
