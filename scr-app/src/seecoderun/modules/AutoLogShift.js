// import j from 'jscodeshift';
import isString from 'lodash/isString';

export const toAst = (source, options) => {
    if (options) {
        return j(source, options);
    }
    return j(source);
};

export const alt = {
    Expression: 'Expression',
    ExpressionIdiom: 'ExpressionIdiom',
    BlockStart: 'BlockStart',
    BlockEnd: 'BlockEnd',
    BlockControl: 'BlockControl',
    Argument: 'Argument',
};

export const l = {
    autoLogId: 'autoLog',
    preAutoLogId: 'preAutoLog',
    postAutoLogId: 'postAutoLog',
    autoLogArguments: 'autoLogArguments',
};

export const NavigationTypes = {
    Global: 'Global',
    Local: 'Local',
};

let j = null;

class AutoLogShift {
    constructor(autoLogName, preAutoLogName, postAutoLogName, jRef) {
        this.autoLogName = l.autoLogId = autoLogName;
        this.preAutoLogName = l.preAutoLogId = preAutoLogName;
        this.postAutoLogName = l.postAutoLogId = postAutoLogName;
        j = jRef;
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

    autoLogAst(ast, getLocationId, locationMap = [], deps = {}) {
        // console.log('al',!!ast, !!locationMap);
        //  wrapFunctionExpressions(ast, locationMap);
        // this.autoLogCallExpressions(ast, locationMap, getLocationId);
        // try {
        deps = AutoLogShift.getDependencies(ast);
        const expressionPaths = [];
        ast.find(j.Expression).forEach(
            path => expressionPaths.unshift(path)
        );
        const variableDeclaratorPaths = [];
        ast.findVariableDeclarators().forEach(
            path => variableDeclaratorPaths.unshift(path)
        );
        // console.log(variableDeclaratorPaths);
        const blockPaths = [];
        ast.find(j.BlockStatement).forEach(
            path => blockPaths.unshift(path)
        );
        this.autoLogExpressions(ast, expressionPaths, locationMap, getLocationId);
        this.autoLogExpressions(ast, variableDeclaratorPaths, locationMap, getLocationId);
        this.autoLogBlocks(ast, blockPaths, locationMap, getLocationId);
        //todo autologBlock expressions
        // } catch (e) {
        //   console.log('j', e)
        // }

        // console.log(locationMap);
        return {ast, locationMap, deps};
    }

    autoLogExpression(expression, id, type, path, p, params) {
        const jid = j.identifier(`'${id}'`);
        const jtype = j.identifier(`'${type}'`);
        const jValue = isString(expression) ? j.identifier(expression) : expression;
        params = params || [
            j.callExpression(j.identifier(l.preAutoLogId),
                [
                    jid,
                    jtype,
                ]),
            jValue,
            j.callExpression(j.identifier(l.postAutoLogId), [jid]),
        ];
        const alExpression =
            j.memberExpression(j.callExpression(j.identifier(l.autoLogId), params), j.identifier('_'), false);
        alExpression.autologId = id;
        return alExpression;
    }

    static SupportedExpressions = [
        'ThisExpression', // this
        'ArrayExpression', // [...]
        'ObjectExpression', // {...}
        'UnaryExpression', // !x
        'UpdateExpression', // x++
        'BinaryExpression', // x>y
        'LogicalExpression', // x && y
        'ConditionalExpression', // x?x:y
        'CallExpression', // x()
        'NewExpression', // new X
        'MemberExpression', // x.y, except x.y =...
        'AssignmentExpression', // x=y; todo needs extra statement al(id='x', val=x)
        'Identifier', // Property, PropertyClass
        // 'Property',// is checked with parent via Identifier child
        // 'FunctionExpression', is as block
        // 'ArrowFunctionExpression',  is as block
        'VariableDeclarator',
    ];

    static SupportedBlockExpressions = [
        'FunctionExpression', // x= function (...){...}
        'ArrowFunctionExpression', // (...)=>{...},..., x=>y
    ];

    static SupportedBlocks = [
        // 'Function', //?
        'FunctionDeclaration', // function x(...){...}
        'MethodDefinition', // Class X{ x(...){...} x=(...)=>{...}},
        'IfStatement', // if(...){...}else{...}
        'SwitchStatement',
        'SwitchCase',
        'ReturnStatement',
        'ThrowStatement',
        'TryStatement',
        'WhileStatement',
        'DoWhileStatement',
        'ForStatement',
        'ForInStatement',
        'DoWhileStatement',
        //Program  is not a block
    ];

    static IdentifierIgnores = [
        // 'ThisExpression',
        // 'ArrayExpression',
        'ObjectExpression',
        'UnaryExpression',
        'UpdateExpression',
        'BinaryExpression',
        'CallExpression',
        'NewExpression',
        'MemberExpression',
        'AssignmentExpression',
        'FunctionExpression',
        'FunctionDeclaration',
        'ClassDeclaration',
        'MethodDefinition',
        'ImportDefaultSpecifier',
        'ExportDefaultDeclaration',
    ];

    static ignorePatterns = [
        'SpreadElementPattern',
        'SpreadPropertyPattern',
        'PropertyPattern',
        'ObjectPattern',
        'ArrayPattern',
        'AssignmentPattern',
        'ImportDeclaration'
    ];

    static BranchNavigation = [
        'FunctionExpression', // x= function (...){...}
        'ArrowFunctionExpression', // (...)=>{...},..., x=>y
        'FunctionDeclaration', // function x(...){...}
        'MethodDefinition', // Class X{ x(...){...} x=(...)=>{...}},
    ];

    static getBlockNavigationType = (type) => {
        if (AutoLogShift.BranchNavigation.includes(type)) {
            return NavigationTypes.Global;
        } else {
            return NavigationTypes.Local;
        }
    };

    static supportedLiveExpressions =
        [
            ...AutoLogShift.SupportedExpressions,
            ...AutoLogShift.SupportedBlockExpressions,
            ...AutoLogShift.SupportedBlocks
        ];

    composedExpressions = {
        MemberExpression: ({ast, locationMap, getLocationId, path}, {pathSource, id, type, p}) => {
            const jid = j.identifier(`'${id}'`);
            const jtype = j.identifier(`'${type}'`);
            const object = path.value.object;//node
            // console.log(object)
            const property = path.value ? path.value.property : null;
            //const propertyNode = property
            // && property.computed ? property : j.identifier(`'${j(property).toSource()}'`);
            const objectId = object.loc ? getLocationId(object.loc, object.type) : object.autologId;
            const objectLoc = object.loc || (locationMap[objectId] || {}).loc;
            const propertyId =
                property.loc ? getLocationId(path.value.property.loc, path.value.property.type) : property.autologId;
            const propertyLoc = property.loc || (locationMap[propertyId] || {}).loc;
            let objectValue = null, propertyValue = null;
            if (objectId && !object.autologId) {
                locationMap[objectId] = {
                    type: alt.ExpressionIdiom,
                    expressionType: object.type,
                    loc: {...objectLoc},
                    parentId: id,
                };
                objectValue = `${j(object).toSource()}`;
            }
            // else{
            //     objectValue = `${j(object).toSource()}`;
            // }
            else {
                //   console.log('OBJ', id, object.autologId, locationMap[object.autologId], locationMap);
            }

            if (propertyId && !property.autologId) {
                locationMap[propertyId] = {
                    type: alt.ExpressionIdiom,
                    expressionType: property.type,
                    loc: {...propertyLoc},
                    parentId: id,
                };
                propertyValue = property.computed ? j(property).toSource() : `'${j(property).toSource()}'`;
            }
            const jValue = isString(pathSource) ? j.identifier(pathSource) : pathSource;
            const params = [
                j.callExpression(j.identifier(l.preAutoLogId),
                    [
                        jid,
                        jtype,
                    ]),
                jValue,
                j.callExpression(j.identifier(l.postAutoLogId), [jid]),
                j.identifier(`'MemberExpression'`),
                j.identifier(`['${objectId}', '${propertyId}']`),
                j.identifier(`[${!object.autologId}, ${!property.autologId}]`),
                j.identifier(`[${objectValue}, ${propertyValue}]`),
            ];
            return this.autoLogExpression(pathSource, id, type, path, p, params);
        },
        BinaryExpression: ({ast, locationMap, getLocationId, path}, {pathSource, id, type, p}) => {
            const jid = j.identifier(`'${id}'`);
            const jtype = j.identifier(`'${type}'`);
            const left = path.value ? path.value.left : null;
            const leftId = left.loc ? getLocationId(left.loc, left.type) : left.autologId;
            const leftLoc = left.loc || (locationMap[leftId] || {}).loc;
            const right = path.value ? path.value.right : null;
            const rightId = right.loc ? getLocationId(right.loc, right.type) : right.autologId;
            const rightLoc = right.loc || (locationMap[rightId] || {}).loc;
            let leftValue = null;
            let rightValue = null;

            if (leftId && !left.autologId) {
                locationMap[leftId] = {
                    type: alt.ExpressionIdiom,
                    expressionType: left.type,
                    loc: {...leftLoc},
                    parentId: id,
                };
                leftValue = j(left).toSource();
            }

            if (rightId && !right.autologId) {
                locationMap[rightId] = {
                    type: alt.ExpressionIdiom,
                    expressionType: right.type,
                    loc: {...rightLoc},
                    parentId: id,
                };
                rightValue = j(right).toSource();
            }
            const jValue = isString(pathSource) ? j.identifier(pathSource) : pathSource;
            const params = [
                j.callExpression(j.identifier(l.preAutoLogId),
                    [
                        jid,
                        jtype
                    ]),
                jValue,
                j.callExpression(j.identifier(l.postAutoLogId), [jid]),
                j.identifier(`'BinaryExpression'`),
                j.identifier(`['${leftId}', '${rightId}']`),
                j.identifier(`[${!left.autologId}, ${!right.autologId}]`),
                j.identifier(`[${leftValue}, ${rightValue}]`),
            ];
            return this.autoLogExpression(pathSource, id, type, path, p, params);
        },
        CallExpression: ({ast, locationMap, getLocationId, path}, {pathSource, id, type, p}) => {
            const jid = j.identifier(`'${id}'`);
            const jtype = j.identifier(`'${type}'`);
            const callee = path.value ? path.value.callee : null;
            const calleeId = callee.loc ? getLocationId(callee.loc, callee.type) : callee.autologId;
            const calleeLoc = callee.loc || (locationMap[calleeId] || {}).loc;
            const callArguments = path.value ? path.value.arguments : null;
            path.value.arguments = callArguments.map(argument => {
                // const argument = argumentNode.value;
                const argumentId = argument.loc ? getLocationId(argument.loc, argument.type) : argument.autologId;
                const argumentLoc = argument.loc || (locationMap[argumentId] || {}).loc;
                let argumentValue = null;
                if (argumentId) {
                    locationMap[argumentId] = {
                        type: alt.ExpressionIdiom,
                        expressionType: argument.type,
                        loc: {...argumentLoc},
                        parentId: id,
                        isArgument: true,
                    };
                    argumentValue = j(argument).toSource();
                    // console.log(argumentValue, argument.loc, argument.type, argumentId);
                    return this.autoLogExpression(argumentValue, argumentId, argument.type, argument);
                } else {
                    return argument;
                }
            });


            let calleeValue = null;


            if (calleeId && !callee.autologId) {
                locationMap[calleeId] = {
                    type: alt.ExpressionIdiom,
                    expressionType: callee.type,
                    loc: {...calleeLoc},
                    parentId: id,
                };
                calleeValue = j(callee).toSource();
            }
            calleeValue = calleeValue === 'import' ? `'import'` : calleeValue;

            const jValue = j.identifier(j(path.value).toSource());
            const params = [
                j.callExpression(j.identifier(l.preAutoLogId),
                    [
                        jid,
                        jtype,
                    ]),
                jValue,
                j.callExpression(j.identifier(l.postAutoLogId), [jid]),
                j.identifier(`'CallExpression'`),
                j.identifier(`['${calleeId}']`),
                j.identifier(`[${!callee.autologId}]`),
                j.identifier(`[${calleeValue}]`),
            ];
            // j.identifier(`['${calleeId}', '${parametersId}']`),
            //     j.identifier(`[${!callee.autologId}, ${!parameters.autologId}]`),
            //     j.identifier(`[${calleeValue}, ${parametersValue}]`),
            return this.autoLogExpression(pathSource, id, type, path, p, params);
        },
        VariableDeclarator: ({ast, locationMap, getLocationId, path}, {pathSource, id, type, p}) => {
            const jid = j.identifier(`'${id}'`);
            const jtype = j.identifier(`'${type}'`);
            const left = path.value ? path.value.id : null;
            const leftId = left.loc ? getLocationId(left.loc, left.type) : left.autologId;
            const leftLoc = left.loc || (locationMap[leftId] || {}).loc;
            const right = path.value ? path.value.init : null;
            const rightId = right.loc ? getLocationId(right.loc, right.type) : right.autologId;
            const rightLoc = right.loc || (locationMap[rightId] || {}).loc;
            let rightValue = null;

            let extraLocs = null;

            const variableDeclarationLoc =
                path.parentPath && path.parentPath.parentPath ? path.parentPath.parentPath.value.loc : null;
            const firstVariableDeclaratorLoc = path.parentPath && path.parentPath.value ? path.parentPath.value[0].id.loc : null;
            //expressionType     console.log('ve', !!(variableDeclarationLoc && firstVariableDeclaratorLoc), variableDeclarationLoc, firstVariableDeclaratorLoc);
            if (!!(variableDeclarationLoc && firstVariableDeclaratorLoc)) {

                extraLocs = {
                    'kind': {
                        start: {
                            line: variableDeclarationLoc.start.line,
                            column: variableDeclarationLoc.start.column,
                        },
                        end: {
                            line: firstVariableDeclaratorLoc.start.line,
                            column: firstVariableDeclaratorLoc.start.column,
                        }
                    }
                };
            }

            if (leftId) {
                if (!left.autologId) {
                    locationMap[leftId] = {
                        type: alt.ExpressionIdiom,
                        expressionType: left.type,
                        loc: {...leftLoc},
                        parentId: id,
                        isVariableDeclarator: true,
                        extraLocs,
                    };
                    //  leftValue = j(left).toSource();
                } else {
                    locationMap[leftId].isVariableDeclarator = true;
                    locationMap[leftId].extraLocs = extraLocs;
                }
                //  leftValue = j(left).toSource();
            }

            if (rightId && !right.autologId) {
                locationMap[rightId] = {
                    type: alt.ExpressionIdiom,
                    expressionType: right.type,
                    loc: {...rightLoc},
                    parentId: id,
                };
                rightValue = j(right).toSource();
            }
            const jValue = isString(right) ? j.identifier(right) : right;
            const params = [
                j.callExpression(j.identifier(l.preAutoLogId),
                    [
                        jid,
                        jtype
                    ]),
                jValue,
                j.callExpression(j.identifier(l.postAutoLogId), [jid]),
                j.identifier(`'VariableDeclarator'`),
                j.identifier(`['${leftId}', '${rightId}']`),
                j.identifier(`[true, true]`),
                j.identifier(`[null, null]`),
            ];
            // console.log('vd', type, path);
            // path.value.init=this.autoLogExpression(pathSource, id, type, path, p, params);
            return j.variableDeclarator(left, this.autoLogExpression(pathSource, id, type, path, p, params));
        },
        // NewExpression: (ast, locationMap, getLocationId, path) => {
        // },
        // FunctionExpression: (ast, locationMap, getLocationId, path) => {
        // },
    };


    static isInPattern = (path) => {
        while (path) {
            if (path.value && AutoLogShift.ignorePatterns.includes(path.value.type)) {
                return true;
            }
            path = path.parentPath;
        }
        return false;
    };

    static extractDependencyInfo = (node) => {
        let path = (j(node).toSource() || '').replace(/["'`]/g, '');
        let loc = node.loc;
        let error = null;
        const firstSlash = path.indexOf('/');
        let name = path;
        if (firstSlash > -1) {
            name = path.substring(0, firstSlash);
            error = `Dependency ${name} cannot have paths: RequireJS does not support relative paths: "${path}".`;
        }
        return {path, source: `"${name}"`, name, loc, error};
    };

    static getDependencies = (ast) => {
        const dependencies = {};
        const asyncDependencies = {};
        const dependenciesInfo = [];
        let hasErrors = false;
        const handleImports = path => {
            const dependencyInfo = AutoLogShift.extractDependencyInfo(path.value.source);
            hasErrors = hasErrors || !!dependencyInfo.error;
            dependenciesInfo.push(dependencyInfo);
            const source = dependencyInfo.source;
            dependencies[source] = [...(dependencies[source] || []), path.value.loc];
        };
        const handleAsyncImports = path => {
            const isRequire =
                (path.value.callee.name === 'require' || path.value.callee.type === 'Import')
                && path.value.arguments.length;
            if (isRequire) {
                const arg = path.value.arguments[0];
                if (arg.type === j.Literal.name) {
                    const dependencyInfo = AutoLogShift.extractDependencyInfo(path.value.arguments[0]);
                    hasErrors = hasErrors || !!dependencyInfo.error;
                    dependenciesInfo.push(dependencyInfo);
                    const source = dependencyInfo.source;
                    //threats dynamic imports as static
                    // if(path.value.callee.type === 'Import'){
                    //     asyncDependencies[source] =
                    // [...(dependencies[path.value.arguments[0]] || []), path.value.loc];
                    // }else{
                    dependencies[source] = [...(dependencies[path.value.arguments[0]] || []), path.value.loc];
                    // }
                } else {
                    if (arg.type === j.ArrayExpression.name) {
                        arg.elements.forEach(el => {
                            if (el.type === j.Literal.name) { // same
                                const dependencyInfo = AutoLogShift.extractDependencyInfo(el);
                                hasErrors = hasErrors || !!dependencyInfo.error;
                                dependenciesInfo.push(dependencyInfo);
                                const source = dependencyInfo.source;
                                asyncDependencies[source] =
                                    [...(asyncDependencies[path.value.arguments[0]] || []), path.value.loc];
                            }
                        });

                    }
                }
            }
        };
        ast.find(j.ImportDeclaration)
            .forEach(handleImports);
        ast.find(j.CallExpression)
            .forEach(handleAsyncImports);
        // pending await import
        return {dependencies, asyncDependencies, dependenciesInfo, hasErrors};
    };

    composedBlocks = {
        FunctionDeclaration:
            ({ast, locationMap, getLocationId, path}, {id, type}, {parentType, parentLoc, parentId}) => {
                // const jid = j.identifier(`'${parentId}'`);
                // const jValue = j.identifier('arguments');
                locationMap[parentId] = {
                    type: alt.BlockStart,
                    expressionType: parentType,
                    loc: {...parentLoc},
                    blockId: id,
                };
                // console.log('f', path.parentPath.value);
                const funcParams = path.parentPath.value ? path.parentPath.value.params : null;
                let paramIds = '', paramValues = '';
                funcParams.forEach(param => {
                    if (param.type === j.Identifier.name) {
                        const paramType = param.type;
                        const paramLoc = param.loc;
                        let paramIdMain = paramLoc ? getLocationId(paramLoc, paramType) : null;

                        if (paramIdMain) {
                            locationMap[paramIdMain] = {
                                type: alt.ExpressionIdiom,
                                expressionType: paramType,
                                loc: {...paramLoc},
                                parentId: parentId,
                                isParam: true,
                            };
                            paramIds = `${paramIds}${paramIds ? ',' : ''}'${param.name}'`;
                            paramValues = `${paramValues}${paramValues ? ',' : ''}${param.name}`;
                        } else {
                          //  console.log('pi', param);
                        }

                    }
                    j(param).find(j.Property).forEach(idPath => {
                        const paramId = idPath.value.key;
                        const paramIdType = paramId.type;
                        const paramIdLoc = paramId.loc;
                        let paramIdId = paramIdLoc ? getLocationId(paramIdLoc, paramIdType) : null;

                        if (paramIdId) {
                            locationMap[paramIdId] = {
                                type: alt.ExpressionIdiom,
                                expressionType: paramIdType,
                                loc: {...paramIdLoc},
                                parentId: parentId,
                                isParam: true,
                            };
                            paramIds = `${paramIds}${paramIds ? ',' : ''}'${paramId.name}'`;
                            paramValues = `${paramValues}${paramValues ? ',' : ''}${paramId.name}`;
                        } else {
                            console.log('pi', idPath, idPath.value);
                        }
                    });
                });
                paramIds = `[${paramIds}]`;
                paramValues = `[${paramValues}]`;
                // console.log('PARA', paramIds, paramValues);
                // const params = [
                //     j.callExpression(j.identifier(l.preAutoLogId),
                //         [
                //             jid,
                //         ]),
                //     jValue,
                //     j.callExpression(j.identifier(l.postAutoLogId), [jid]),
                //     j.identifier(`'FunctionDeclaration'`),
                //     j.identifier(paramIds),
                //     j.identifier(`[]`),
                //     j.identifier(paramValues),
                // ];
                //const enterExpression = this.autoLogExpression(null, id, type, path, p, params);

                // const body = path.value.body;
                // if (body.length && j(body[0]).toSource().startsWith('super')) {
                //     const superS = body[0];
                //     body.unshift(j.expressionStatement(j.identifier('//start')));
                //     body[1] = body[0];
                //     body[0] = superS;
                // } else {
                //     body.unshift(j.expressionStatement(j.identifier('//start')));
                // }


                // console.log(body[body.length-1]);
                // if(body.length && body[body.length-1].type !== 'ReturnStatement'){
                //   id = locationMap.length;
                //   locationMap
                // .push({type: FUNCTION_END, expressionType: body[body.length-1].type,loc:{...path.value.loc}});
                //
                //   body.push(j.expressionStatement(j.callExpression(
                //     j.identifier('_'),
                //     []
                //   )));
                // }
                // console.log(path.value.loc);


                // j(path).find(j.ReturnStatement).replaceWith(p =>{
                //     const parametersSource = j(p.value.argument).toSource();
                //     return  j.returnStatement(j.callExpression(j.identifier('_'),
                //       [j.identifier(parametersSource)]));
                //   }
                // );
                // return p;
            },
    };

    autoLogExpressions(ast, paths, locationMap, getLocationId) {

        const getJReplacer = (id, type, path, parentId, parentType, parentPath) => (p => {
            const pathSource = j(p).toSource();
            const isReturn = parentPath && parentType === 'ReturnStatement';
            const isTest = path.name === 'test';
            const testableStatementType = isTest ? parentPath.value.type : null;
            const extraLocs = isTest ? {
                testableStatement: {...parentPath.value.loc},
                body: parentPath.value.body?{...parentPath.value.body.loc}:null,
                consequent: parentPath.value.consequent?{...parentPath.value.consequent.loc}:null,
                alternate: parentPath.value.alternate?{...parentPath.value.alternate.loc}:null,
                return:isReturn ? {...parentPath.value.loc} : null,
            } : isReturn?{return:{...parentPath.value.loc} }:null;

            const loc = {...path.value.loc};
          //  id= isReturn? parentId: id;
          //  isTest && console.log('TES', testableStatementType,path);
        //    isReturn && console.log('RET', parentPath);
            locationMap[id] = {
                type: alt.Expression,
                expressionType: type,
                loc,
                parentId,
                isReturn,
                isTest,
                testableStatementType,
                extraLocs,
            };

            if (this.composedExpressions[type]) {
                return this.composedExpressions[type]({ast, locationMap, getLocationId, path}, {
                    pathSource,
                    id,
                    type,
                    p
                });
            } else {

                if (parentType === 'Property' || parentType === 'ClassProperty') {

                    if (path.name === 'key') {

                        if (path.parentPath.value.kind === 'init' && path.parentPath.value.shorthand) {
                            // console.log('case', path.parentPath.value);
                            path.parentPath.value.shorthand = false;
                            path.parentPath.value.value = j.identifier(pathSource);
                        }
                        if (parentPath.computed) { // logs {[x]:...}
                            return j.arrayExpression(
                                [this.autoLogExpression(pathSource, id, type, path, p)]
                            );
                        } else { // ignores {d:...}
                            parentPath.computed = true;
                            // return j.arrayExpression(
                            //     [j.identifier(`'${pathSource}'`)]
                            // );
                            return j.arrayExpression(
                                [this.autoLogExpression(`'${pathSource}'`, id, type, path, p)]
                            );
                        }
                    } else {
                        return this.autoLogExpression(pathSource, id, type, path, p);
                    }
                } else {
                    return this.autoLogExpression(pathSource, id, type, path, p);
                }
            }
        });

        for (const i in paths) {
            const path = paths[i];
            const type = path.value ? path.value.type : null;
            const loc = type ? path.value.loc : null;
            let id = loc ? getLocationId(loc, type) : null;

            const parentPath = path ? path.parentPath : null;
            const parentType = parentPath.value ? parentPath.value.type : null;
            const parentLoc = parentType ? parentPath.value.loc : null;
            let parentId = parentLoc ? getLocationId(parentLoc, parentType) : null;
            //console.log('vdr', type, path);

            if (id) {
                if (AutoLogShift.SupportedExpressions.includes(type)) {
                    let isValid = true;
                    //isValid && type === 'VariableDeclarator' && console.log('vdr', path);
                    if (type === j.MemberExpression.name && parentType === j.CallExpression.name) {
                        isValid = false; // c of c() => handled in parent
                    }

                    if (type === j.CallExpression.name && path.value.callee.type === 'Super') {
                        isValid = false; // super call
                    }

                    if (path.name === 'left' && parentType === j.AssignmentExpression.name) {
                        isValid = false; // x of x= y => handled in parent
                    }

                    if (path.name === 'id' && parentType === j.VariableDeclarator.name) {
                        isValid = false; //  x of let x=y => handled in parent
                    }

                    if (type === j.Identifier.name
                        && AutoLogShift.IdentifierIgnores.includes(parentType)) {
                        isValid = false; //  x of function x(...) , x of function (x)... => handled in parent
                    }
                    if ((parentPath && (parentPath.name === 'params' || parentPath.name === 'arguments'))) {
                        isValid = false; //  x of function y(x) , x of y(x) => handled in parent
                    }

                    if (AutoLogShift.isInPattern(path)) {
                        isValid = false; // x of {x}, [x]... object deconstruction => handled in parent.
                    }


                    if (isValid) {
                        j(path).replaceWith(getJReplacer(id, type, path, parentId, parentType, parentPath));
                    } else {
                        // console.log('passing to parent', type, loc, path);
                    }
                } else {
                    if (AutoLogShift.SupportedBlocks.includes(type)) {
                        // console.log('block', type, loc, path);
                    } else {
                        // console.log('ignored', type, loc, path);
                    }
                }
            } else {
                if (!type === j.FunctionExpression.name) {
                    console.log('critical', type, loc, path);
                }
            }
        }

    }

    autoLogBlocks(ast, paths, locationMap, getLocationId) {

        const getParamMapper = (result, id, loc) => {
            return (param) => {
                result.funcParams = result.funcParams === '' ?
                    `${j(param).toSource()}` : `${result.funcParams}, ${j(param).toSource()}`;
                const paramType = param.type;
                const paramLoc = paramType ? param.loc : null;
                const paramId = paramLoc ? getLocationId(paramLoc, paramType) : null;
                result.funcParamsIds = result.funcParamsIds === '' ?
                    `'${paramId}'` : `${result.funcParamsIds}, '${paramId}'`;
                if (paramId) {
                    locationMap[paramId] = {
                        type: alt.Argument,
                        expressionType: paramType,
                        loc: {...paramLoc},
                        blockId: id,
                        blockLoc: loc,
                    };
                }
            };
        };

        for (const i in paths) {
            const path = paths[i];
            const type = path.value ? path.value.type : null;
            const loc = type ? path.value.loc : null;
            let id = loc ? getLocationId(loc, type) : null;

            if (id) {
                const parentPath = path.parentPath;
                if (parentPath) {
                    let parentType = parentPath.value.type;
                    let parentLoc = parentType ? parentPath.value.loc : null;
                    let parentId = parentLoc ? getLocationId(parentLoc, parentType) : null;
                    if (!parentId && parentType === j.FunctionExpression.name) {
                        parentType = parentPath.parentPath ? parentPath.parentPath.value.type : null;
                        parentLoc = parentType ? parentPath.parentPath.value.loc : null;
                        parentId = parentLoc ? getLocationId(parentLoc, parentType) : null;
                    }
                    if (parentId) {
                        let extraLocs = null;
                        let blockName = path.name;// 'TryStatement',
                        //     'WhileStatement',
                        //     'DoWhileStatement',
                        //     'ForStatement',
                        //     'ForInStatement',
                        //     'DoWhileStatement',
                        switch (parentType) {
                            case 'IfStatement':
                               // console.log('IfStatement log', blockName, loc);
                                extraLocs = {
                                    test: parentPath.value.test.loc ?
                                        parentPath.value.test.loc : locationMap[parentPath.value.test.autologId].loc,
                                    consequent: parentPath.value.consequent.loc,
                                    alternate: parentPath.value.alternate ? parentPath.value.alternate.loc : null
                                };
                                break;
                            case 'WhileStatement':
                                extraLocs = {
                                    test: parentPath.value.test.loc ?
                                        parentPath.value.test.loc : locationMap[parentPath.value.test.autologId].loc,
                                };
                                break;
                            case 'DoWhileStatement':
                                extraLocs = {
                                    test: parentPath.value.test.loc ?
                                        parentPath.value.test.loc : locationMap[parentPath.value.test.autologId].loc,
                                };
                                break;
                            case 'FunctionDeclaration':
                                extraLocs = {
                                    signature: parentLoc || locationMap[parentPath.value.autologId].loc,
                                };
                                break;
                            case 'FunctionExpression':
                                extraLocs = {
                                    signature: parentLoc || locationMap[parentPath.value.autologId].loc,
                                };
                                break;
                            case 'ArrowFunctionExpression':
                                extraLocs = {
                                    signature: parentLoc || locationMap[parentPath.value.autologId].loc,
                                };
                                break;
                            default:
                                extraLocs = {};
                        }
                        //     console.log(parentType, path.name, extraLocs, path, parentPath);

                        locationMap[parentId] = {
                            type: alt.BlockControl,
                            expressionType: parentType,
                            loc: {...parentLoc},
                            blockId: id,
                            blockLoc: loc,
                            extraLocs
                        };
                        const jid = j.identifier(`'${parentId}'`);
                        let hasParams = false;

                        let oriParams = null;
                        let needParentheses = false;
                        const result = {funcParams: '', funcParamsIds: ''};
                        if (parentPath.value.params) {
                            hasParams = true;
                            if (parentPath.value.params.length === 1
                                && parentPath.value.params[0].start === parentPath.value.start) {
                                needParentheses = true;
                            }
                            parentPath.value.params
                                .forEach(getParamMapper(result, id, loc));

                            oriParams = parentPath.value.params;
                            parentPath.value.params =
                                [j.identifier(needParentheses ?
                                    `(...${l.autoLogArguments})` : `...${l.autoLogArguments}`)];
                        }

                        let {funcParams, funcParamsIds} = result;

                        const params = [
                            j.callExpression(j.identifier(l.preAutoLogId),
                                [
                                    jid,
                                    j.identifier(`'${parentType}'`),
                                    j.identifier(`'${id}'`),
                                    j.identifier(`'${AutoLogShift.getBlockNavigationType(parentType)}'`),
                                    hasParams ? j.identifier(`${l.autoLogArguments}`)
                                        : j.identifier(`null`),
                                    j.identifier(`[${funcParamsIds}]`),
                                    j.identifier(`'${blockName}'`),
                                ]),
                            j.identifier('this'),
                            j.callExpression(j.identifier(l.postAutoLogId), [jid]),
                            j.identifier(`'${j.BlockStatement.name}'`),
                            // j.identifier(`'${parentType}'`),
                            j.identifier(`[]`),
                            j.identifier(`[]`),
                            j.identifier(`[]`),
                        ];
                        const funcParamsStatement = funcParams.length ? j.expressionStatement(
                            j.identifier(`let [${funcParams}] = ${l.autoLogArguments}`)
                        ) : null;
                        const enterExpression = this.autoLogExpression(null, id, type, path, null, params);

                        const body = path.value.body;
                        //  console.log('all', path.parentPath.value.loc && path.parentPath.value.loc.start.line);
                        if (body.length && j(body[0]).toSource().startsWith('super')) {
                            if (hasParams) {
                                path.parentPath.value.params = oriParams;
                                params[0] = j.callExpression(j.identifier(l.preAutoLogId),
                                    [
                                        jid,
                                        j.identifier(`'${parentType}'`),
                                        j.identifier(`'${id}'`),
                                        j.identifier(`'${AutoLogShift.getBlockNavigationType(parentType)}'`),
                                        j.identifier(`null`),
                                    ]);
                            }

                            const superS = body[0];
                            body.unshift(j.expressionStatement(enterExpression));
                            body[1] = body[0];
                            body[0] = superS;
                        } else {
                            body.unshift(j.expressionStatement(enterExpression));
                            if (funcParamsStatement) {
                                body.unshift(funcParamsStatement);
                            }
                        }
                        // if (AutoLogShift.SupportedBlocks.includes(parentType)) {
                        //     if (this.composedBlocks[parentType]) {
                        //         return this.composedBlocks[parentType](
                        //             {ast, locationMap, getLocationId, path},
                        //             {id, type},
                        //             {parentType, parentLoc, parentId}
                        //         );
                        //     }
                        // } else {
                        //     // console.log('critical parent', type, loc, path, parentType, parentLoc);
                        // }
                    } else {
                        console.log('ignored', path);
                    }
                } else {
                    console.log('ignored no parent', path,);
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
