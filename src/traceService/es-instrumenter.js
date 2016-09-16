import escodegen from 'escodegen';
import {EsprimaNodeFactory} from './external/esprima-node-factory';
import {AutoLogTracer} from './external/auto-log-tracer';

export class EsInstrumenter {
  code = "";
  constructor(traceModel) {
    this.traceModel = traceModel;
    this.escodegen = escodegen;
    this.esprimaNodeFactory = new EsprimaNodeFactory();
    this.autoLogTracer = new AutoLogTracer(traceModel.traceDataContainer);
    this.Syntax = this.traceModel.traceSyntax;
    this.traceTypes = this.traceModel.traceTypes;
    this.TraceParameters = this.traceModel.traceParameters;
    this.blockCounter = 0;
    this.blocks = {};
    this.blocks[this.blockCounter] = {identifier: "program", parent: -1, children: []};
  }

  static lookupForContainingNode(nodePath, typesArray) {
    while (nodePath != null) {
      if (nodePath.length) {
        if (typesArray.indexOf(nodePath[0].type) > -1) {
          return nodePath[0];
        }

        if (nodePath.length > 1) {
          nodePath = nodePath[1];

        } else {
          nodePath = null;
        }
      } else {
        nodePath = null;
      }
    }
    return null;
  }

  lookupForContainingBlock(nodePath) {
    let containingControlBlock = this.lookupForContainingControlBlock(nodePath);
    return containingControlBlock ? containingControlBlock : this.lookupForContainingFunction(nodePath);
  }

  lookupForContainingControlBlock(nodePath) {
    return EsInstrumenter.lookupForContainingNode(nodePath, this.traceTypes.ControlFlow);
  }

  lookupForContainingFunction(nodePath) {
    return EsInstrumenter.lookupForContainingNode(nodePath, this.traceTypes.Function);
  }

  isAutoLogNode(node, self = this) {
    let Syntax = self.Syntax;
    if (node.type === Syntax.CallExpression) {
      if (node.callee.type === Syntax.MemberExpression) {
        if (node.callee && node.callee.property.type === Syntax.Identifier && node.callee.property.name === "autoLog") {
          if (node.callee.object && node.callee.object.type === Syntax.MemberExpression) {
            if (node.callee.object.property && node.callee.object.property.type === Syntax.Identifier && node.callee.object.property.name === "TRACE") {
              if (node.callee.object.object && node.callee.object.object.type === Syntax.Identifier && node.callee.object.object.name === "window") {
                return true;
              }
            }

          }
        }
      }
    }

    return false;

  }

  static getNewBlock(self, parent, identifier) {
    let block = {identifier: identifier, parent: parent, children: []};
    if (parent > -1 && self.blocks[parent]) {
      self.blocks[parent].children.push(block);
    }
    return block;
  }

  static getTextRange(code, range) {
    if (!range) {
      return;
    }

    if (range.length < 2) {
      return;
    }

    let from = range[0];
    let till = range[1];
    return code.substring(from, till);
  }

  static toAceRange(loc) {
    return {
      start: {
        row: ((loc.start && loc.start.line > 0) ? loc.start.line - 1 : 0),
        column: (loc.start ? loc.start.column : 0)
      },
      end: {row: ((loc.end && loc.end.line > 0) ? loc.end.line - 1 : 0), column: (loc.end ? loc.end.column : 0)}
    };
  }

  static wrapInExpressionStatementNode(autoLogNode) {
    return {
      "visited": true,
      "type": "ExpressionStatement",
      "expression": autoLogNode
    };
  }

  getDefaultAutoLogNode(self = this) {
    return self.esprimaNodeFactory.getDefaultAutoLogNode();
  }

  getLocationDataNode(loc, range, self = this) {
    return self.esprimaNodeFactory.getLocationDataNode(loc, range);
  }

  static setNodeValue(ref) {
    let traceParametersRange = 4;
    ref.autoLogNode.arguments[0].properties[ref.propertyIndex].value = ref.value;
    if (ref.propertyIndex === traceParametersRange) {
      ref.autoLogNode.callee.object.arguments[0] = ref.value;
    }
  }

  static setNodeTextValue(ref) {
    ref.autoLogNode.arguments[0].properties[ref.propertyIndex].value = {
      "type": "Literal",
      "value": ref.value,
      "raw": ref.value
    };
    let traceParametersType = 0;
    let traceParametersId = 1;
    let traceParametersText = 2;
    if (ref.propertyIndex === traceParametersType || ref.propertyIndex === traceParametersId || ref.propertyIndex === traceParametersText) {
      ref.autoLogNode.callee.object.arguments[ref.propertyIndex + 1] = {
        "type": "Literal",
        "value": ref.value,
        "raw": ref.value
      };
    }
  }

  instrumentVariableDeclarator(node, self = this) {
    let code = self.code;
    let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
    let Syntax = self.Syntax,
      TraceParameters = self.TraceParameters,
      setNodeValue = EsInstrumenter.setNodeValue,
      setNodeTextValue = EsInstrumenter.setNodeTextValue,
      getLocationDataNode = self.getLocationDataNode,
      getTextRange = EsInstrumenter.getTextRange;

    if (!node.init) {
      return;
    }

    if (node.init.type === Syntax.FunctionExpression) {
      return;// Backward Analysis
    }

    setNodeTextValue({autoLogNode: autoLogNode, propertyIndex: TraceParameters.type, value: node.type});
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.id,
      'value': getTextRange(code, node.id.range)
    });
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': getTextRange(code, node.init.range)
    });
    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value': node.init});
    locationData = getLocationDataNode(node.loc, node.range, self);
    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }

    node.init = autoLogNode;
  }

  getParametersRanges(parameters) {
    let parametersRanges = [];
    for (let parameterIndex in parameters) {
      if (parameters.hasOwnProperty(parameterIndex)) {
        let parameter = parameters[parameterIndex];
        if (parameter.loc) {
          let name = null;
          if (parameter.type === "Identifier") {
            name = parameter.name;
          } else {
            if (parameter.type === "RestElement") {
              name = parameter.argument.name;
            }
          }
          parametersRanges[parameterIndex] = {name: name, value: null, range: EsInstrumenter.toAceRange(parameter.loc)};
        }
      }
    }
    return parametersRanges;
  }

  autologParameters(callExpressionAceRange, parameters, self = this) {
    let code = self.code;
    let autoLoggedParameters = [];
    for (let parameterIndex in parameters) {
      if (parameters.hasOwnProperty(parameterIndex)) {
        let parameter = parameters[parameterIndex];
        parameter.logged = true;
        let autoLogNode = self.getDefaultAutoLogNode(self);
        EsInstrumenter.setNodeTextValue({
          'autoLogNode': autoLogNode,
          'propertyIndex': self.TraceParameters.type,
          'value': "Parameter"
        });
        EsInstrumenter.setNodeTextValue({
          'autoLogNode': autoLogNode,
          'propertyIndex': self.TraceParameters.id,
          'value': EsInstrumenter.getTextRange(code, parameter.range)
        });
        EsInstrumenter.setNodeTextValue({
          'autoLogNode': autoLogNode,
          'propertyIndex': self.TraceParameters.text,
          'value': ""
        });
        EsInstrumenter.setNodeValue({
          'autoLogNode': autoLogNode,
          'propertyIndex': self.TraceParameters.value,
          'value': parameter
        });
        let locationData = self.getLocationDataNode(parameter.loc, parameter.range, self);
        if (locationData) {
          EsInstrumenter.setNodeValue({
            'autoLogNode': autoLogNode,
            'propertyIndex': self.TraceParameters.range,
            'value': locationData.location
          });
          EsInstrumenter.setNodeValue({
            'autoLogNode': autoLogNode,
            'propertyIndex': self.TraceParameters.indexRange,
            'value': locationData.range
          });
        }
        EsInstrumenter.setNodeTextValue({
          'autoLogNode': autoLogNode,
          'propertyIndex': self.TraceParameters.extra,
          'value': JSON.stringify({parameterType: parameter.type, callExpressionRange: callExpressionAceRange})
        });
        autoLoggedParameters[parameterIndex] = autoLogNode;
      }
    }
    return autoLoggedParameters;
  }

  // setAutologValues(){}

  instrumentCallExpression(node, self = this) {
    let code = self.code;
    let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
    let Syntax = self.Syntax,
      TraceParameters = self.TraceParameters,
      setNodeValue = EsInstrumenter.setNodeValue,
      setNodeTextValue = EsInstrumenter.setNodeTextValue,
      getLocationDataNode = self.getLocationDataNode,
      getTextRange = EsInstrumenter.getTextRange;

    if (node.logged) {
      return true;
    }

    if (!node.callee || !node.range) {
      return;
    }

    let callExpressionText = JSON.stringify({
      text: getTextRange(code, node.range),
      parameters: self.getParametersRanges(node.arguments)
    });
    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value': node.type});
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.id,
      'value': getTextRange(code, node.callee.range)
    });
    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.text, 'value': callExpressionText});
    setNodeValue({
      'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value': {
        "type": Syntax.CallExpression,
        "callee": node.callee,
        "arguments": self.autologParameters(EsInstrumenter.toAceRange(node.loc), node.arguments, self),
        "logged": true
      }
    });
    locationData = getLocationDataNode(node.loc, node.range, self);
    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }


    node.callee = autoLogNode.callee;
    node.arguments = autoLogNode.arguments;
    node.logged = true;
  }

  instrumentAssignmentExpression(node, self = this) {
    let code = self.code;
    let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
    let Syntax = self.Syntax,
      TraceParameters = self.TraceParameters,
      setNodeValue = EsInstrumenter.setNodeValue,
      setNodeTextValue = EsInstrumenter.setNodeTextValue,
      getLocationDataNode = self.getLocationDataNode,
      getTextRange = EsInstrumenter.getTextRange;

    if (!node.right) {
      return;
    }

    if (node.right.type === Syntax.FunctionExpression) {
      return;

    }
    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value': node.type});
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.id,
      'value': getTextRange(code, node.left.range)
    });
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': getTextRange(code, node.right.range)
    });
    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value': node.right});
    locationData = getLocationDataNode(node.loc, node.range, self);
    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }
    node.right = autoLogNode;
  }

  instrumentExitFlowStatement(node, self = this) {
    let code = self.code;
    let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
    let Syntax = self.Syntax,
      TraceParameters = self.TraceParameters,
      setNodeValue = EsInstrumenter.setNodeValue,
      setNodeTextValue = EsInstrumenter.setNodeTextValue,
      getLocationDataNode = self.getLocationDataNode,
      getTextRange = EsInstrumenter.getTextRange;

    if (!node.argument) {
      return;
    }

    if (node.argument.type === Syntax.FunctionExpression) {
      return;
    }

    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value': node.type});
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.id,
      'value': node.type.replace("Statement", "")
    });
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': getTextRange(code, node.argument.range)
    });
    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value': node.argument});
    locationData = getLocationDataNode(node.loc, node.range, self);
    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }
    node.argument = autoLogNode;
  }

  instrumentJumpStatement(node, self = this) {
    let code = self.code;
    let newJumpStatement = {type: node.type, label: node.label};

    let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
    let Syntax = self.Syntax,
      TraceParameters = self.TraceParameters,
      setNodeValue = EsInstrumenter.setNodeValue,
      setNodeTextValue = EsInstrumenter.setNodeTextValue,
      getLocationDataNode = self.getLocationDataNode,
      getTextRange = EsInstrumenter.getTextRange;

    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.type,
      'value': node.type
    });

    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.id,
      'value': node.type.replace("Statement", "").toLowerCase()
    });

    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': getTextRange(code, node.range)
    });

    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.value,
      'value': node.label ? getTextRange(code, node.label.range) : "none"
    });

    locationData = getLocationDataNode(node.loc, node.range, self);

    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }

    node.visited = true;
    node.type = Syntax.IfStatement;
    node.alternate = null;
    node.test = {
      "type": "Literal",
      "value": true,
      "raw": "true"
    };
    node.consequent = {
      "visited": true,
      "type": Syntax.BlockStatement,
      "body": [
        EsInstrumenter.wrapInExpressionStatementNode(autoLogNode),
        newJumpStatement
      ]
    };
    delete node.label;
    delete node.loc;
    delete node.range;
  }

  instrumentBinaryExpression(node, self = this) {
    let code = self.code;
    let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
    let TraceParameters = self.TraceParameters,
      getDefaultAutoLogNode = self.getDefaultAutoLogNode,
      setNodeValue = EsInstrumenter.setNodeValue,
      setNodeTextValue = EsInstrumenter.setNodeTextValue,
      getLocationDataNode = self.getLocationDataNode,
      getTextRange = EsInstrumenter.getTextRange;

    if (!(node.right && node.left)) {
      return;
    }


    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value': node.right.type});

    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.id,
      'value': getTextRange(code, node.right.range)
    });

    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': getTextRange(code, node.right.range)
    });
    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value': node.right});
    locationData = getLocationDataNode(node.right.loc, node.right.range, self);
    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }

    node.right = autoLogNode;

    autoLogNode = getDefaultAutoLogNode(self);

    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value': node.left.type});
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.id,
      'value': getTextRange(code, node.left.range)
    });
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': getTextRange(code, node.left.range)
    });
    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value': node.left});
    locationData = getLocationDataNode(node.left.loc, node.left.range, self);
    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }

    node.left = autoLogNode;
  }


  instrumentBlockStatement(node, path, self = this) {
    let code = self.code;
    let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
    let TraceParameters = self.TraceParameters,
      getDefaultAutoLogNode = self.getDefaultAutoLogNode,
      setNodeValue = EsInstrumenter.setNodeValue,
      setNodeTextValue = EsInstrumenter.setNodeTextValue,
      getLocationDataNode = self.getLocationDataNode,
      getTextRange = EsInstrumenter.getTextRange,
      wrapInExpressionStatementNode = EsInstrumenter.wrapInExpressionStatementNode,
      blockCounter = self.blockCounter;

    if (!node.body) {
      return;
    }
    // if(path && path[0] && self.traceTypes.Function.indexOf(path[0].type) > -1){ //parent
    //     isFunctionBlock = true;
    // }
    let containingBlock = self.lookupForContainingBlock(path);

    let block = EsInstrumenter.getNewBlock(self, blockCounter, getTextRange(code, node.range));


    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value': node.type});
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.id,
      'value': containingBlock ? JSON.stringify({
        type: containingBlock.type,
        range: EsInstrumenter.toAceRange(containingBlock.loc)
      }) : "null"
    });
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': getTextRange(code, node.range)
    });
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.value,
      'value': getTextRange(code, node.range)
    });
    locationData = getLocationDataNode(node.loc, node.range, self);
    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.extra,
      'value': `Block${blockCounter}:Enter`
    });

    node.body.unshift(wrapInExpressionStatementNode(autoLogNode));

    autoLogNode = getDefaultAutoLogNode(self);
    //TODO: Introduced BlockStatementExit
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.type,
      'value': "BlockStatementExit"
    });
    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value': "null"});
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': getTextRange(code, node.range)
    });
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.value,
      'value': getTextRange(code, node.range)
    });
    locationData = getLocationDataNode(node.loc, node.range, self);
    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.extra,
      'value': `Block${blockCounter}:Exit`
    });

    node.body.push(wrapInExpressionStatementNode(autoLogNode));

    self.blocks[blockCounter] = block;
    self.blockCounter++;
  }

  instrumentSwitchCase(node, self = this) {
    let code = self.code;
    let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
    let TraceParameters = self.TraceParameters,
      getDefaultAutoLogNode = self.getDefaultAutoLogNode,
      setNodeValue = EsInstrumenter.setNodeValue,
      setNodeTextValue = EsInstrumenter.setNodeTextValue,
      getLocationDataNode = self.getLocationDataNode,
      getTextRange = EsInstrumenter.getTextRange,
      wrapInExpressionStatementNode = EsInstrumenter.wrapInExpressionStatementNode,
      blockCounter = self.blockCounter;

    if (!node.range) {
      return;
    }

    if (!(node.consequent)) {
      return;
    }


    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value': node.type});
    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value': "null"});
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': getTextRange(code, node.range)
    });
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.value,
      'value': getTextRange(code, node.range)
    });
    locationData = getLocationDataNode(node.loc, node.range, self);
    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.extra,
      'value': `Block${blockCounter}:Enter`
    });

    node.consequent.unshift(wrapInExpressionStatementNode(autoLogNode));

    autoLogNode = getDefaultAutoLogNode(self);
    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value': node.type});
    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value': "null"});
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': getTextRange(code, node.range)
    });
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.value,
      'value': getTextRange(code, node.range)
    });
    locationData = getLocationDataNode(node.loc, node.range, self);
    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.extra,
      'value': `Block${blockCounter}:Exit`
    });

    node.consequent.push(wrapInExpressionStatementNode(autoLogNode));

    self.blockCounter++;
  }


  instrumentFunctionDeclaration(node, self = this) {
    let code = self.code;
    let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
    let TraceParameters = self.TraceParameters,
      setNodeValue = EsInstrumenter.setNodeValue,
      setNodeTextValue = EsInstrumenter.setNodeTextValue,
      getLocationDataNode = self.getLocationDataNode,
      wrapInExpressionStatementNode = EsInstrumenter.wrapInExpressionStatementNode;

    if (!node.range) {
      return;
    }

    if (!(node.body && node.body.body)) {
      return;
    }
    let paramsRanges = self.getParametersRanges(node.params);
    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value': "FunctionData"});
    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value': node.id.name});
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': JSON.stringify({text: EsInstrumenter.getTextRange(code, node.range), params: paramsRanges})
    });
    setNodeValue({
      'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value,
      'value': {
        "type": "Identifier",
        "name": "arguments"
      }
    });
    locationData = getLocationDataNode(node.loc, node.range, self);
    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }

    autoLogNode = wrapInExpressionStatementNode(autoLogNode);
    node.body.body.unshift(autoLogNode);


  }

  instrumentProperty(node, self = this) {
    let code = self.code;
    let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
    let TraceParameters = self.TraceParameters,
      setNodeValue = EsInstrumenter.setNodeValue,
      setNodeTextValue = EsInstrumenter.setNodeTextValue,
      getLocationDataNode = self.getLocationDataNode,
      getTextRange = EsInstrumenter.getTextRange;
    if (!(node.key && node.value)) {
      return;
    }
    if (!node.value.range) {
      return;
    }

    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value': node.type});
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.id,
      'value': getTextRange(code, node.key.range)
    });
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': getTextRange(code, node.value.range)
    });
    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value': node.value});
    locationData = getLocationDataNode(node.loc, node.range, self);

    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }
    node.value = autoLogNode;

  }

  instrumentExpressionStatement(node, self = this) {
    let code = self.code;
    let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
    let Syntax = self.Syntax,
      TraceParameters = self.TraceParameters,
      setNodeValue = EsInstrumenter.setNodeValue,
      setNodeTextValue = EsInstrumenter.setNodeTextValue,
      getLocationDataNode = self.getLocationDataNode,
      getTextRange = EsInstrumenter.getTextRange;

    if (!node.expression) {
      return;
    }

    if (!node.range) {
      return;
    }

    if (!node.expression.range) {
      return;
    }
    if (!(node.expression.type === Syntax.UnaryExpression || node.expression.type === Syntax.UpdateExpression)) {
      return;
    }

    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.type,
      'value': node.expression.type
    });
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.id,
      'value': getTextRange(code, node.expression.range)
    });
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': getTextRange(code, node.expression.range)
    });
    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value': node.expression});
    locationData = getLocationDataNode(node.expression.loc, node.expression.range, self);

    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }
    node.expression = autoLogNode;
  }

  instrumentControlStatementWithTest(node, self = this) {
    let code = self.code;
    let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
    let TraceParameters = self.TraceParameters,
      setNodeValue = EsInstrumenter.setNodeValue,
      setNodeTextValue = EsInstrumenter.setNodeTextValue,
      getLocationDataNode = self.getLocationDataNode,
      getTextRange = EsInstrumenter.getTextRange;

    if (!node.test) {
      return;
    }

    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value': node.test.type});
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.id,
      'value': getTextRange(code, node.test.range)
    });
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': getTextRange(code, node.test.range)
    });
    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value': node.test});
    locationData = getLocationDataNode(node.test.loc, node.test.range, self);

    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }
    node.test = autoLogNode;
  }

  instrumentSwitchStatement(node, self = this) {
    let code = self.code;
    let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
    let TraceParameters = self.TraceParameters,
      setNodeValue = EsInstrumenter.setNodeValue,
      setNodeTextValue = EsInstrumenter.setNodeTextValue,
      getLocationDataNode = self.getLocationDataNode,
      getTextRange = EsInstrumenter.getTextRange;

    if (!node.discriminant) {
      return;
    }
    if (!node.discriminant.range) {
      return;
    }

    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value': node.type});
    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value': "null"});
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': getTextRange(code, node.discriminant.range)
    });
    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value': node.discriminant});
    locationData = getLocationDataNode(node.discriminant.loc, node.discriminant.range, self);

    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }
    node.discriminant = autoLogNode;

  }

  instrumentForStatement(node, self = this) {
    let code = self.code;
    let autoLogNode, locationData;
    let Syntax = self.Syntax,
      TraceParameters = self.TraceParameters,
      getDefaultAutoLogNode = self.getDefaultAutoLogNode,
      setNodeValue = EsInstrumenter.setNodeValue,
      setNodeTextValue = EsInstrumenter.setNodeTextValue,
      getLocationDataNode = self.getLocationDataNode,
      getTextRange = EsInstrumenter.getTextRange;

    if (!node.init || !node.test || !node.update) {
      return;
    }
    if (!node.init.range || !node.test.range || !node.update.range) {
      return;
    }

    if (node.init.type !== Syntax.VariableDeclaration && node.init.type !== Syntax.AssignmentExpression) {
      autoLogNode = self.getDefaultAutoLogNode(self);
      setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value': node.init.type});
      setNodeTextValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.id,
        'value': getTextRange(code, node.init.range)
      });
      setNodeTextValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.text,
        'value': getTextRange(code, node.init.range)
      });
      setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value': node.init});
      locationData = getLocationDataNode(node.init.loc, node.init.range, self);

      if (locationData) {
        setNodeValue({
          'autoLogNode': autoLogNode,
          'propertyIndex': TraceParameters.range,
          'value': locationData.location
        });
        setNodeValue({
          'autoLogNode': autoLogNode,
          'propertyIndex': TraceParameters.indexRange,
          'value': locationData.range
        });
      }
      node.init = autoLogNode;
    } else {
      //Handled in other cases
    }

    autoLogNode = getDefaultAutoLogNode(self);
    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value': node.test.type});
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.id,
      'value': getTextRange(code, node.test.range)
    });
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': getTextRange(code, node.test.range)
    });
    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value': node.test});
    locationData = getLocationDataNode(node.test.loc, node.test.range, self);

    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }
    node.test = autoLogNode;

    autoLogNode = getDefaultAutoLogNode(self);
    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value': node.update.type});
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.id,
      'value': getTextRange(code, node.update.range)
    });
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': getTextRange(code, node.update.range)
    });
    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value': node.update});
    locationData = getLocationDataNode(node.update.loc, node.update.range, self);

    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }
    node.update = autoLogNode;
  }

  instrumentForInStatement(node, self = this) {
    let code = self.code;
    let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
    let Syntax = self.Syntax,
      TraceParameters = self.TraceParameters,
      getDefaultAutoLogNode = self.getDefaultAutoLogNode,
      setNodeValue = EsInstrumenter.setNodeValue,
      setNodeTextValue = EsInstrumenter.setNodeTextValue,
      getLocationDataNode = self.getLocationDataNode,
      getTextRange = EsInstrumenter.getTextRange;

    if (!node.left || !node.right) {
      return;
    }
    if (!node.left.range || !node.right.range) {
      return;
    }

    if (node.left.type !== Syntax.VariableDeclaration) {
      setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value': node.type});
      setNodeTextValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.id,
        'value': getTextRange(code, node.left.range)
      });
      setNodeTextValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.text,
        'value': getTextRange(code, node.left.range)
      });
      setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value': node.left});
      locationData = getLocationDataNode(node.loc, node.range, self);

      if (locationData) {
        setNodeValue({
          'autoLogNode': autoLogNode,
          'propertyIndex': TraceParameters.range,
          'value': locationData.location
        });
        setNodeValue({
          'autoLogNode': autoLogNode,
          'propertyIndex': TraceParameters.indexRange,
          'value': locationData.range
        });
      }
      node.left = autoLogNode;
      autoLogNode = getDefaultAutoLogNode(self);
    }

    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value': node.type});
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.id,
      'value': getTextRange(code, node.right.range)
    });
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': getTextRange(code, node.right.range)
    });
    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value': node.right});
    locationData = getLocationDataNode(node.loc, node.range, self);

    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }
    node.right = autoLogNode;

  }

  instrumentMemberExpression(node, self = this) {
    let code = self.code;
    let newMemberExpression = {
      "visited": true,
      "type": node.type,
      "computed": node.computed,
      "object": node.object,
      "property": node.property
    };

    let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
    let TraceParameters = self.TraceParameters,
      setNodeValue = EsInstrumenter.setNodeValue,
      setNodeTextValue = EsInstrumenter.setNodeTextValue,
      getLocationDataNode = self.getLocationDataNode;

    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.type,
      'value': node.type
    });
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.id,
      'value': getTextRange(code, node.range)
    });
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': getTextRange(code, node.range)
    });
    setNodeValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value, 'value': newMemberExpression});

    locationData = getLocationDataNode(node.loc, node.range, self);
    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }

    delete node.object;
    delete node.property;
    delete node.loc;
    delete node.range;
    node.object.visited = true;
    node.property.visited = true;

    node.visited = autoLogNode.visited;
    node.type = autoLogNode.type;
    node.callee = autoLogNode.callee;
    node.arguments = autoLogNode.arguments;
  }

  instrumentFunctionExpression(node, parent, self = this) {
    let code = self.code;
    let autoLogNode = self.getDefaultAutoLogNode(self), locationData;
    let Syntax = self.Syntax,
      TraceParameters = self.TraceParameters,
      setNodeValue = EsInstrumenter.setNodeValue,
      setNodeTextValue = EsInstrumenter.setNodeTextValue,
      getLocationDataNode = self.getLocationDataNode,
      wrapInExpressionStatementNode = EsInstrumenter.wrapInExpressionStatementNode;

    let identifier = 'anonymous';
    if (parent) {
      if (parent.type === Syntax.AssignmentExpression) {
        if (parent.left.range != null) {
          identifier = code.slice(parent.left.range[0], parent.left.range[1]).replace(/"/g, '\\"');
        }
      } else if (parent.type === Syntax.VariableDeclarator) {
        identifier = parent.id.name;

      } else if (parent.type === Syntax.CallExpression) {
        identifier = parent.id ? parent.id.name : 'anonymous';

      } else if (typeof parent.length === "number" && parent.length > 0 && ( parent.length - 1 ) in parent) {
        identifier = parent[0].id ? parent[0].id.name : 'anonymous';
      } else if (parent.key != null) {
        if (parent.key.type === 'Identifier') {
          if (parent.value === node && parent.key.name) {
            identifier = parent.key.name;
          }
        }
      }
    }

    if (!(node.body && node.body.body)) {
      return;
    }

    let paramsRanges = self.getParametersRanges(node.params);
    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.type, 'value': "FunctionData"});
    setNodeTextValue({'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.id, 'value': identifier});
    setNodeTextValue({
      'autoLogNode': autoLogNode,
      'propertyIndex': TraceParameters.text,
      'value': JSON.stringify({text: EsInstrumenter.getTextRange(code, node.range), params: paramsRanges})
    });
    setNodeValue({
      'autoLogNode': autoLogNode, 'propertyIndex': TraceParameters.value,
      'value': {
        "type": "Identifier",
        "name": "arguments"
      }
    });
    locationData = getLocationDataNode(node.loc, node.range, self);
    if (locationData) {
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.range,
        'value': locationData.location
      });
      setNodeValue({
        'autoLogNode': autoLogNode,
        'propertyIndex': TraceParameters.indexRange,
        'value': locationData.range
      });
    }

    autoLogNode = wrapInExpressionStatementNode(autoLogNode);
    node.body.body.unshift(autoLogNode);
  }

  instrumentTracer(sourceCode, esanalyzer) {
    let self = this;
    let instrumentedCode;
    let Syntax = self.Syntax,
      instrumentVariableDeclarator = self.instrumentVariableDeclarator,
      instrumentCallExpression = self.instrumentCallExpression,
      instrumentAssignmentExpression = self.instrumentAssignmentExpression,
      instrumentExitFlowStatement = self.instrumentExitFlowStatement,
      instrumentJumpStatement = self.instrumentJumpStatement,
      instrumentBinaryExpression = self.instrumentBinaryExpression,
      instrumentFunctionDeclaration = self.instrumentFunctionDeclaration,
      instrumentBlockStatement = self.instrumentBlockStatement,
      instrumentProperty = self.instrumentProperty,
      instrumentExpressionStatement = self.instrumentExpressionStatement,
      instrumentControlStatementWithTest = self.instrumentControlStatementWithTest,
      instrumentForStatement = self.instrumentForStatement,
      instrumentForInStatement = self.instrumentForInStatement,
      instrumentFunctionExpression = self.instrumentFunctionExpression,
      instrumentSwitchCase = self.instrumentSwitchCase,
      instrumentSwitchStatement = self.instrumentSwitchStatement;


    let instrumenter = function instrumenter(ref) {
      let isForwardAnalysis = true;
      self.code = ref.code;
      let node = ref.node, path = ref.path;

      if (!Syntax.hasOwnProperty(node.type)) {
        return;
      }

      if (node.visited) {
        return;
      }

      if (!node.range) {
        return;
      }

      switch (node.type) {
        case Syntax.VariableDeclarator:
          instrumentVariableDeclarator(node, self);
          break;

        case Syntax.CallExpression:
          instrumentCallExpression(node, self);
          break;

        case Syntax.AssignmentExpression:
          instrumentAssignmentExpression(node, self);
          break;

        case Syntax.ReturnStatement:
          instrumentExitFlowStatement(node, self);
          break;

        case Syntax.ThrowStatement:
          instrumentExitFlowStatement(node, self);
          break;

        case Syntax.BreakStatement:
          instrumentJumpStatement(node, self);
          break;

        case Syntax.ContinueStatement:
          instrumentJumpStatement(node, self);
          break;

        case Syntax.BlockStatement:
          instrumentBlockStatement(node, path, self);
          break;

        case Syntax.FunctionDeclaration:
          instrumentFunctionDeclaration(node, self);
          break;

        case Syntax.Program:
          instrumentBlockStatement(node, path, self);
          break;

        case Syntax.Property:
          instrumentProperty(node, self);
          break;

        case Syntax.ExpressionStatement:
          instrumentExpressionStatement(node, self);
          break;

        case Syntax.IfStatement:
          instrumentControlStatementWithTest(node, self);
          break;

        case Syntax.DoWhileStatement:
          instrumentControlStatementWithTest(node, self);
          break;

        case Syntax.WhileStatement:
          instrumentControlStatementWithTest(node, self);
          break;

        case Syntax.ForStatement:
          instrumentForStatement(node, self);
          break;

        case Syntax.ForInStatement:
          instrumentForInStatement(node, self);
          break;

        case Syntax.SwitchStatement:
          instrumentSwitchStatement(node, self);
          break;

        case Syntax.SwitchCase:
          instrumentSwitchCase(node, self);
          break;

        default:
          isForwardAnalysis = false;
      }


      if (isForwardAnalysis) {
        return;
      }

      let parent = path[0];

      switch (node.type) {
        case Syntax.BinaryExpression:
          instrumentBinaryExpression(node, self);
          break;

        case Syntax.LogicalExpression:
          instrumentBinaryExpression(node, self);
          break;

        case Syntax.FunctionExpression:
          instrumentFunctionExpression(node, parent, self);
          break;

        default:
      }
    };

    let analysis = esanalyzer.traceAllAutoLog(sourceCode, instrumenter);
    let tree = analysis.tree;

    //noinspection JSUnresolvedFunction
    instrumentedCode = self.escodegen.generate(tree);

    instrumentedCode = `
            ${this.autoLogTracer.getTraceDataContainerCodeBoilerPlate()}
            ${this.autoLogTracer.getAutologCodeBoilerPlate(this.traceModel.timeLimit)}
            ${AutoLogTracer.wrapCodeInTryCatch(instrumentedCode)}
            ${AutoLogTracer.getTraceDataCodeBoilerPlate()}
        `;

    return instrumentedCode;
  }

}
