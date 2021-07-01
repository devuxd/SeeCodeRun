import {parse} from "@babel/parser";
import generate from "@babel/generator";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

export * as babelTypes from "@babel/types";
import debounce from "lodash/debounce";

import {monacoProps} from "../../utils/monacoUtils";
import BALE, {getAutoLogIdentifiers} from './BALE'; // Babel transforms

import CALE from './CALE'; // connect require js
import DALE, {BranchNavigatorManager} from './DALE'; // decorate editor
import WALE from './WALE'; // trace bindings
import ZALE from './ZALE'; // zone management

import './ALE.css';
import {getScopeUID} from "../../utils/babelUtils";

// https://babeljs.io/docs/en/babel-types
// All babel-types covered unless noticed here. Last visited March, 2021.
// > handled in related type
// variableDeclaration
// expressionStatement
// decorator
// bindExpression
// classBody
// classImplements

// > Unnecessary for now
// argumentPlaceholder
// debuggerStatement
// directive
// directiveLiteral
// doExpression
// exportAllDeclaration
// exportDefaultDeclaration
// exportDefaultSpecifier
// exportNamedDeclaration
// exportNamespaceSpecifier
// exportSpecifier
// file
// interpreterDirective
// metaProperty
// noop
// privateName
// withStatement //deprecated
// TS or Flow related (Aliases: Flow...)

// Aliases resolution:
// LVal:    isArrayPattern, isAssignmentPattern, isIdentifier,
//          isMemberExpression, isObjectPattern, isRestElement,
//          isTSParameterProperty (ignored)

export const ScopeTypes = {
   N: "none",
   P: "program",
   F: "function",
   A: "any",
   C: "control",
   E: "exception",
   S: "class",
};

export const ScopeExitTypes = {
   T: "throw",
   R: "return",
   Y: "yield",
   C: "continue",
   B: "break",
   N: "normal",
};

export const TraceEvents = {
   R: "R", // runtime special cases
   E: "E", // error or exception
   P: "P", // package import
   L: "L", // expression log
   O: "O", // exit branch
   I: "I", // enter branch
   D: "D", // debugger console ...
};

export const ErrorTypes = {
   P: 'parse',    // compile
   B: 'bundle',   // compile || run,
   R: 'run',
};

export const LiveZoneTypes = {
   B: 'branch', // control or function blocks
   P: "package", // package import,
   O: "omit", // omit zone
   L: 'log', // other expressions
   E: 'error', // error or exception
};


export const LiveZoneDecorationStyles = {
   normal: 'normal',
   active: 'active',
   hover: 'hover',
};

// export const DECORATION_Z_INDEX = Object.keys(LiveZoneDecorationStyles).reduce(
//    (r, v, i)=>{
//       r[v] = i+1;
//       return r;
//    },
//    {}
// );


export const makeError = (e) => {
   return {
      message: e.message,
      name: e.name,
      constructor: {name: e.name},
   }
};

export const ALEError = makeError({
   name: 'ALEError',
   message: 'use constructor\'s onError to get details',
});

// export const LiveDecoratorTypes ={
//
// };

export const parseOptions = {
   sourceFilename: "ale.js",
   sourceType: "module",
   allowImportExportEverywhere: false,
   errorRecovery: true,
   createParenthesizedExpressions: false, // node.extra.parenthesized: Boolean
   plugins: [
      "jsx",
      "classProperties",
      "classPrivateProperties",
      "classPrivateMethods",
      "classStaticBlock",
      "throwExpressions"
   ]
};

export const generateOptions = {
   comments: false,
   compact: false,
   concise: false,
   jsonCompatibleStrings: true,
   minified: false,
   retainLines: true,
   sourceMaps: true,
   sourceFileName: "ale.js"
};

export const babelParse = (code, onError) => {
   try {
      return parse(code, parseOptions);
   } catch (e) {
      onError('parse', e);
      return null;
   }
};

export const babelTraverse = (ast, visitor, onError) => {
   try {
      traverse(ast, visitor);
      return true;
   } catch (e) {
      onError('traverse', e);
      return false;
   }
};

export const babelGenerate = (ast, code, onError) => {
   //todo: replace with Transform
   try {
      return generate(ast, generateOptions, code);
   } catch (e) {
      onError('generate', e);
      return null;
   }
};

const defaultMonacoEditorLiveExpressionClassName =
   'monaco-editor-live-expression';
export const MonacoOptions = {
   liveEditorConstructionOptions: {
      // glyphMargin: true,
      lineHeight: 18 + monacoProps.lineOffSetHeight,
      // 18 is the default, sync with css: max-height:18px; and padding-top
      nativeContextMenu: false,
      hover: true,
      extraEditorClassName:
      defaultMonacoEditorLiveExpressionClassName,
   },
   defaultMonacoEditorLiveExpressionClassName,
};

const defaultOnContentChangeDebounceWait = 100;
const defaultOnTraceChangeDebounceWait = 100;

const defaultOnContentChangeDebounceOptions = {
   leading: false,
   trailing: true,
   // maxWait: 500,
};
const defaultOnTraceChangeDebounceOptions = {
   leading: false,
   trailing: true,
   maxWait: 500,
};

const defaultOptions = {
   onContentChangeDebounceOptions: [
      defaultOnContentChangeDebounceWait, defaultOnContentChangeDebounceOptions
   ],
   onTraceChangeDebounceOptions: [
      defaultOnTraceChangeDebounceWait, defaultOnTraceChangeDebounceOptions
   ],
};

const defaultOnError = () => {};

const makeErrorHandler = (onError) => {
   return {
      onParseError: (...params) => onError(ErrorTypes.P, ...params),
      onBundleError: (...params) => onError(ErrorTypes.B, ...params),
      onRunError: (...params) => onError(ErrorTypes.R, ...params)
   }
};

export const isCollectionLikeExpression = (path) => {
   // Post processable: get values from parent to show live expressions
   return (
      // elements
      (path.isArrayPattern() || path.isArrayExpression()) ||
      // properties
      (path.isObjectPattern() || path.isObjectExpression()) ||
      // expressions
      path.isSequenceExpression()
   );
};


export const getScopeExitType = (path) => {
   if (!path) {
      return null;
   }
   
   if (path.isThrowStatement()) {
      return ScopeExitTypes.T;
   }
   
   if (path.isReturnStatement()) {
      return ScopeExitTypes.R;
   }
   
   if (path.isYieldExpression()) {
      return ScopeExitTypes.Y;
   }
   
   if (path.isContinueStatement()) {
      return ScopeExitTypes.C;
   }
   
   
   if (path.isBreakStatement()) {
      return ScopeExitTypes.B;
   }
   
   return null;
};

export const isScopeExitStatement = (path) => {
   return !!getScopeExitType(path);
};

export const isControlScope = (path) => {
   return (path && (
         // isDoWhileStatement, isForStatement, isWhileStatement
         path.isLoop() ||  // body
         path.isLabeledStatement() ||  // body
         path.isIfStatement() ||// consequent, alternate
         path.isSwitchStatement() // cases
      )
   )
};

export const isFunctionScope = (path) => {
   return (path && (
      // isArrowFunctionExpression, isClassMethod,
      // isFunctionDeclaration, isFunctionExpression, isObjectMethod
      path.isFunction()  // body
   ))
};

export const isExceptionalScope = (path) => {
   return (path && path.isTryStatement());
};

export const isContinuableScope = (path) => {
   return (path &&
      (
         path.isLabeledStatement() ||
         path.isLoop()
      )
   );
};

export const isBreakableScope = (path) => {
   return (path &&
      (
         path.isSwitchStatement() ||
         isContinuableScope(path)
      )
   );
};


export const isLoggableScopeBlockKey = (path) => {
   return (
      // handled in isLoggableExpression
      path &&
      path.key !== 'test' &&
      path.key !== 'update' &&
      path.key !== 'right' &&
      path.key !== "discriminant"
   );
};

export const isLoggableFunctionBlock = (path) => {
   return (
      isLoggableScopeBlockKey(path) &&
      isFunctionScope(path.parentPath)
   );
};

export const isLoggableControlBlock = (path) => {
   return (
      isLoggableScopeBlockKey(path) &&
      isControlScope(path.parentPath)
   );
};

export const isLoggableExceptionalBlock = (path) => {
   return (
      // block, handler (isCatchClause), finalizer
      isLoggableScopeBlockKey(path) &&
      isExceptionalScope(path.parentPath)
   );
};

export const isLoggableScopeBlock = (path) => {
   return (
      isLoggableFunctionBlock(path) ||
      isLoggableControlBlock(path) ||
      isLoggableExceptionalBlock(path)
   );
   
};

export const isLoggableScope = (path) => {
   // Complies with isScopable, it only omits isProgram.
   return (
      isFunctionScope(path) ||
      path.isClass() ||  //path.isClassDeclaration(), path.isClassExpression()
      isControlScope(path) || // only to ensure block statements and zones
      path.isSwitchCase() || //path.parentPath.isSwitchStatement - discriminant
      // isExceptionalScope(path) ||
      isLoggableScopeBlock(path)
      // path.listKey === ?
   );
};


export const getPathScopeType = (path) => {
   
   if (!path) {
      return ScopeTypes.N;
   }
   
   if (path.isProgram()) {
      return ScopeTypes.P;
   }
   
   if (isFunctionScope(path)) {
      return ScopeTypes.F;
   }
   
   if (path.isClass()) {
      return ScopeTypes.S;
   }
   
   if (
      isControlScope(path) ||
      path.isSwitchCase() ||
      isLoggableControlBlock(path)
   ) {
      return ScopeTypes.C;
   }
   
   if (isLoggableExceptionalBlock(path)) {
      return ScopeTypes.E;
   }
   
   return ScopeTypes.A;
};


export const getPathScopeExits = (path, registerExpression = i => i) => {
   const exits = {
      [ScopeTypes.C]: {
         uid: null,
         zoneI: null,
      },
      [ScopeExitTypes.T]: {
         uid: null,
         zoneI: null,
      },
      [ScopeExitTypes.R]: {
         uid: null,
         zoneI: null,
      },
      [ScopeExitTypes.Y]: {
         uid: null,
         zoneI: null,
      },
      [ScopeExitTypes.C]: {
         uid: null,
         zoneI: null,
      },
      [ScopeExitTypes.B]: {
         uid: null,
         zoneI: null,
      },
      [ScopeExitTypes.N]: {
         uid: null,
         zoneI: null,
      },
   };
   
   if (!path) {
      return exits;
   }
   
   const ancestry = [path, ...path.getAncestry()];
   
   let exceptionalBlockExitPath = null;
   let functionBlockExitPath = null;
   let functionGeneratorBlockExitPath = null;
   let continuableBlockExitPath = null;
   let breakableBlockExitPath = null;
   
   let controlBlockExitPath = null;
   
   ancestry.forEach(
      parent => {
         
         if (!exceptionalBlockExitPath && isExceptionalScope(parent)) {
            exceptionalBlockExitPath = parent;
         }
         
         if (isFunctionScope(parent)) {
            if (!functionBlockExitPath) {
               functionBlockExitPath = parent;
            }
            
            if (!functionGeneratorBlockExitPath && parent.node.generator) {
               functionGeneratorBlockExitPath = parent;
            }
         }
         
         if (!continuableBlockExitPath && isContinuableScope(parent)) {
            continuableBlockExitPath = parent;
         }
         
         if (!breakableBlockExitPath && isBreakableScope(parent)) {
            breakableBlockExitPath = parent;
         }
         
         if (!controlBlockExitPath && isControlScope(parent)) {
            controlBlockExitPath = parent;
         }
         
      });
   
   
   exits[ScopeExitTypes.T] = {
      uid: getScopeUID(exceptionalBlockExitPath),
      zoneI: registerExpression(exceptionalBlockExitPath),
   };
   
   exits[ScopeExitTypes.R] = {
      uid: getScopeUID(functionBlockExitPath),
      zoneI: registerExpression(functionBlockExitPath),
   };
   
   exits[ScopeExitTypes.Y] = {
      uid: getScopeUID(functionGeneratorBlockExitPath),
      zoneI: registerExpression(functionGeneratorBlockExitPath),
   };
   
   exits[ScopeExitTypes.C] = {
      uid: getScopeUID(continuableBlockExitPath),
      zoneI: registerExpression(continuableBlockExitPath),
   };
   
   exits[ScopeExitTypes.B] = {
      uid: getScopeUID(breakableBlockExitPath),
      zoneI: registerExpression(breakableBlockExitPath),
   };
   
   exits[ScopeExitTypes.N] = {
      uid: getScopeUID(path),
      zoneI: registerExpression(path),
   };
   
   
   return exits;
};

// isStatementOrExpressionWithArgument start
// subsumes isLoggableStatement
export const isStatementOrExpressionWithArgument = (path) => {
   return (path && ( // 11 cases total
      path.isBreakStatement() || path.isContinueStatement() ||
      path.isReturnStatement() || path.isThrowStatement() ||
      path.isAwaitExpression() || path.isJSXSpreadAttribute() ||
      path.isRestElement() || path.isSpreadElement() ||
      path.isUnaryExpression() ||
      path.isUpdateExpression() || // *argument not logged
      path.isYieldExpression()
   ));
};

export const isLoggableStatement = (path) => {
   return (path && ( // 5 cases
         (path.isBreakStatement() || path.isContinueStatement()) ||
         (path.isReturnStatement() || path.isYieldExpression()) ||
         path.isThrowStatement()
      )
   );
};

export const isNonLoggableExpressionWithArgument = (path) => {
   return (path && ( // 2 cases
      // Only Lvals are allowed
      path.isRestElement() ||
      // Avoids Invalid left-hand side expression in postfix operation
      path.isUpdateExpression()
   ));
};

export const isLoggableExpressionArgument = (path) => {
   return (
      path &&
      path.key === 'argument' &&
      path.parentPath && ( // 4 cases
         path.parentPath.isUnaryExpression() ||
         path.parentPath.isAwaitExpression() ||
         path.parentPath.isJSXSpreadAttribute() ||
         path.parentPath.isSpreadElement()
      )
   );
};

// isStatementOrExpressionWithArgument end 11 = 5 + 4 + 2 (OK)

export const isLoggableLiteral = (path) => {
   // requires JSX attribute handling before
   // isStringLiteral, isRegExpLiteral, isNumericLiteral, isNullLiteral,
   // isBooleanLiteral, isBigIntLiteral
   return (
      path && path.isLiteral() && !path.isTemplateLiteral() &&
      path.key !== 'source' && path.key !== 'local' &&
      path.key !== 'imported'
   );
};

export const isLoggableExpressionBasedOnKey = (path) => {
   return (
      path && (
         //  last resort, locPush isIdentifier only
         path.key === "discriminant" ||
         path.key === "test" ||
         path.key === "update" ||
         path.listKey === "expressions"// templateLiteral, sequenceExpression
      )
   );
};

export const isPureLoggableExpression = (path) => {
   return (
      path && (
         path.isArrayExpression() || // isCollectionLikeExpression
         path.isAssignmentExpression() ||
         path.isAwaitExpression() || // isStatementOrExpressionWithArgument
         path.isBinary() || // isBinaryExpression, isLogicalExpression
         path.isConditionalExpression() ||
         path.isEmptyStatement() ||
         path.isNewExpression() ||
         path.isObjectExpression() || // isStatementOrExpressionWithArgument
         path.isUnaryExpression() || // isStatementOrExpressionWithArgument
         path.isUpdateExpression() || // isStatementOrExpressionWithArgument
         path.isSequenceExpression() || // isCollectionLikeExpression
         path.isThisExpression() ||
         path.isCallExpression() ||
         path.isOptionalCallExpression()
      )
   );
};


export const isLoggableExpression = (path) => {
   return (
      path && (
         isLoggableLiteral(path) ||
         isPureLoggableExpression(path) ||
         isLoggableExpressionBasedOnKey(path) || (
            path.key === 'callee' && path.isIdentifier()
         )
      )
   );
};

export const isLoggableIdentifier = (path) => {
   return (
      path && (
         path.isIdentifier() &&
         isLoggableExpressionBasedOnKey(path)
      )
   );
};

// isLoggableExpressionBasedOnParent start
export const isUnInitializedVariableDeclarator = (path) => (
   path.isVariableDeclarator() &&
   !path.node.init &&
   path.parentPath.isVariableDeclaration() &&
   !path.parentPath.parentPath?.isForXStatement()
);

export const isPathOrNodeLoggableCallExpressionCallee = (pathOrNode) => {
   // prevents DOM illegal invocation at runtime
   // (e.g. var doc = document; doc?.getX?.(y))
   const node = pathOrNode.node ?? pathOrNode;
   return (
      !t.isImport(node) &&
      !t.isSuper(node) &&
      (
         !(
            t.isMemberExpression(node) ||
            t.isOptionalMemberExpression(node)
         ) || (
            node && (
               node.property.type === 'MemberExpression' ||
               node.property.type === 'OptionalMemberExpression'
            )
         )
      )
   );
};

export const isLoggableMemberExpression = (path) => {
   // prevents DOM illegal invocation at runtime
   // (e.g. var doc = document; doc?.getX?.(y))
   return (
      path &&
      (
         path.isMemberExpression() ||
         path.isOptionalMemberExpression()
      ) &&
      (!path.parentPath ||
         !(
            path.parentPath.isCallExpression() ||
            path.parentPath.isOptionalCallExpression() ||
            // avoids Invalid left-hand side expression in prefix operation
            path.parentPath.isUpdateExpression()
         )
      )
   );
};

export const isLoggableExpressionBasedOnParent = (path) => {
   return ( // parentPath-dependent
      isLoggableMemberExpression(path) ||
      (path.parentPath &&
         (isUnInitializedVariableDeclarator(path) ||
            path.parentPath.isJSXSpreadChild() ||
            path.parentPath.isJSXExpressionContainer() ||
            path.parentPath.isBinary() ||
            path.parentPath.isConditionalExpression() ||
            path.listKey === "arguments" ||
            (
               path.key === "init" &&
               path.parentPath.isVariableDeclarator()
            
            ) ||
            (
               path.key === "value" &&
               !path.parentPath.parentPath?.isArrayPattern() &&
               !path.parentPath.parentPath?.isObjectPattern() &&
               // classPrivateProperty, classProperty, objectProperty
               path.parentPath.isProperty() &&
               !path.isAssignmentPattern()
            ) ||
            (
               path.key === "tag" &&
               path.parentPath.isTaggedTemplateExpression()
            
            ) ||
            (
               path.isTemplateLiteral() &&
               !path.parentPath.isTaggedTemplateExpression()
            
            ) ||
            (
               path.parentPath.isExpressionStatement() &&
               path.isIdentifier()
            ) ||
            (
               path.key === "right" &&
               (
                  path.parentPath.isAssignmentExpression() ||
                  path.parentPath.isAssignmentPattern() ||
                  path.parentPath.isForXStatement()
               )
            )
            || (
               path.key === 'object' &&
               isLoggableMemberExpression(path.parentPath)
            )
         )
      )
   );
}

// isLoggableExpressionBasedOnParent end

export const isSupportingContextOfExpression = (path) => {
   // Post processable: get values from parent to show live expressions
   return (
      path.listKey ||
      path.key ||
      path.key === 0
   );
};

export const resolveJSXExpressionReplacementType = (path) => {
   return (
      (
         (
            (path.isJSXElement() || path.isJSXFragment()) &&
            path.parentPath &&
            (path.parentPath.isJSXElement() || path.parentPath?.isJSXFragment())
         ) ||
         (
            path.parentPath?.isJSXAttribute() &&
            path.key === "value" &&
            !path.isJSXExpressionContainer()
         )
      ) ? "containerWrap"
         : (path.isJSXAttribute() && !path.node.value) ? "valueAppend"
            : null
   );
};

export const isLoopBlockStatement = (path) => {
   if (!path) {
      return false;
   }
   
   if (!path?.isBlockStatement() || !path.parentPath) {
      return false;
   }
   
   return path.parentPath.isLoop?.();
};

export const getLoopScopeUID = (path) => {
   if (!isLoopBlockStatement(path)) {
      return null;
   }
   
   return getScopeUID(path.parentPath);
};


class ALEManager {
   prevModel = null;
   ids = null;
   original = null;
   code = null;
   output = null;
   dale = null; // set by attachDALE
   zale = null;
   scr = null; // set by WALE
   branchNavigatorManager = null; // used by RALE, set by activateTraceChanges
   onTraceChange = null; // used by WALE, set by DALE
   onOutputChange = null;
   onContentChangeError = null;
   onTraceChangeError = null;
   onContentChangeDebounceOptions = null;
   onTraceChangeDebounceOptions = null;
   customTraverseEnter = null;
   customTraverseExit = null;
   globalObject
   options = null;
   onParseError = null;
   key = null;
   handleChangeContent = null;
   errorHandler = null;
   traceProvider = {
      trace: {
         window: null,
         parseLiveRefs: null,
      },
   };
   
   constructor(
      customTraverseEnter,
      customTraverseExit,
      globalObject,
      options,
      onError,
      key,
   ) {
      const errorHandler = makeErrorHandler(onError);
      const {onParseError, onBundleError, onRunError} = errorHandler;
      
      const onContentChangeDebounceOptions =
         options === true ? defaultOptions.onContentChangeDebounceOptions
            : (
               options.onContentChangeDebounceOptions ??
               defaultOptions.onContentChangeDebounceOptions
            );
      const onTraceChangeDebounceOptions =
         options === true ? defaultOptions.onTraceChangeDebounceOptions
            : (
               options.onTraceChangeDebounceOptions ??
               defaultOptions.onTraceChangeDebounceOptions
            );
      
      this.ids = getAutoLogIdentifiers();
      this.onContentChangeDebounceOptions = onContentChangeDebounceOptions;
      this.onTraceChangeDebounceOptions = onTraceChangeDebounceOptions;
      
      this.customTraverseEnter = customTraverseEnter;
      this.customTraverseExit = customTraverseExit;
      this.globalObject = globalObject;
      this.options = options;
      this.onParseError = onParseError
      this.key = key;
      this.errorHandler = errorHandler;
      
      this.handleChangeContent = debounce(
         () => {
            return this._handleContentChange();
         },
         ...this.onContentChangeDebounceOptions
      );
   }
   
   getModel = () => ({
      code: this.code,
      zale: this.zale,
      bale: this.bale,
      output: this.bale?.output,
      dale: this.dale,
      scr: this.scr,
      afterTraceChange: this.afterTraceChange,
      resetTimelineChange: this.resetTimelineChange,
      branchNavigatorManager: this.branchNavigatorManager,
   });
   
   setModel = (code, zale, bale, scr, afterTraceChange) => {
      this.code = code;
      this.zale = zale;
      this.bale = bale;
      this.output = bale?.output;
      this.scr = scr;
      this.afterTraceChange = afterTraceChange;
   };
   
   setOriginalCode = (code) => {
      this.original = code;
      this._handleContentChange();
   };
   
   afterTraceChange = null;
   
   setAfterTraceChange = (afterTraceChange) => {
      this.afterTraceChange = afterTraceChange;
   }
   
   resetTimelineChange = () => {
      this._traceReset?.();
   };
   
   activateTraceChanges = () => {
      this.branchNavigatorManager = new BranchNavigatorManager(this);
      this.setOnTraceChange(this.branchNavigatorManager.handleTimelineChange);
   }
   
   deactivateTraceChanges = () => {
      this.setOnTraceChange(null);
   }
   
   attachDALE = (...rest) => {
      this.dale = DALE(this, ...rest);
      this._handleContentChange();
   };
   
   getAutoLogIdentifiers = () => this.ids;
   
   getCode = () => {
      if (this.dale) {
         return this.dale.getCode();
      }
      return this.original;
   };
   
   _handleContentChange = () => {
      const code = this.getCode();
      const zale = (code ?? '') ? ZALE(code) : null;
      
      const bale = BALE(
         code,
         zale,
         this.customTraverseEnter,
         this.customTraverseExit,
         this.options,
         this.onParseError,
         this.key,
      );
      
      if (bale.error) {
         this.onContentChangeError?.(bale.error);
         return;
      }
      
      this.prevModel = this.getModel();
      
      const scrObject = WALE(this, this.globalObject, this.errorHandler);
      
      this.setModel(code, zale, bale, scrObject, this.afterTraceChange);
      this._onOutputChange();
      this.dale?.onContentChange();
   };
   
   _onOutputChange = () => {
      return this.onOutputChange?.(this);
   };
   
   setOnOutputChange = (onOutputChange) => {
      this.onOutputChange = onOutputChange;
   };
   
   setOnTraceChange = (onTraceChange) => {
      if (this._traceCallback !== onTraceChange) {
         this.onTraceChange?.cancel();
         this._traceCallback = onTraceChange;
      }
      
      if (onTraceChange) {
         this.onTraceChange = debounce(
            onTraceChange, ...this.onTraceChangeDebounceOptions
         );
      }
   };
   
   dispose = () => {
      this.handleChangeContent?.cancel();
      this.onTraceChange?.cancel();
      this.dale?.dispose?.();
   };
   
   static wrapCode = (code, exceptionCallbackString) => {
      return (`
   try{
   ${code}
   }catch(e){
   ${exceptionCallbackString ? `${exceptionCallbackString}(e);` : "throw e;"}
   }`);
   };
   
   
   getALECode = () => {
      return this.getModel().output?.code ?? this.getCode();
   }
   
   hasALECode = () => {
      return this.getCode() !== this.getALECode();
   }
   
   getWrappedCode = () => {
      return ALEManager.wrapCode(this.getCode(), null);
   };
   
   getWrappedALECode = (isActivateTraceChanges) => {
      const {
         exceptionCallbackString,
      } = this.getAutoLogIdentifiers();
      
      isActivateTraceChanges && this.activateTraceChanges();
      
      if (this.hasALECode()) {
         return ALEManager.wrapCode(
            this.getALECode()
            , exceptionCallbackString
         );
      } else {
         return this.getWrappedCode();
      }
   };
   
}

const ALE = (
   customTraverseEnter = null,
   customTraverseExit = null,
   globalObject = global.top ?? global,
   options = defaultOptions,
   onError = defaultOnError,
   key = 0,
) => {
   
   return new ALEManager(
      customTraverseEnter, customTraverseExit, globalObject,
      options, onError, key
   );
   
};

export default ALE;

export {
   default as BALE,
   setAutoLogIdentifiers,
   getAutoLogIdentifiers,
   getOriginalNode,
} from './BALE';

export {
   default as CALE,
} from './CALE';

export {
   default as DALE,
} from './DALE';

export {
   default as RALE,
} from './RALE';

export {
   default as WALE,
} from './WALE';

export {
   default as TALE,
} from './TALE';

export {
   default as ZALE,
} from './ZALE';
