/* */ 
(function(process) {
  module.exports = (core) => {
    var xpath = {};
    function getNodeName(nodeOrAttr) {
      return nodeOrAttr.constructor.name === 'Attr' ? nodeOrAttr.name : nodeOrAttr.nodeName;
    }
    var Stream = xpath.Stream = function Stream(str) {
      this.original = this.str = str;
      this.peeked = null;
      this.prev = null;
      this.prevprev = null;
    };
    Stream.prototype = {
      peek: function() {
        if (this.peeked)
          return this.peeked;
        var m = this.re.exec(this.str);
        if (!m)
          return null;
        this.str = this.str.substr(m[0].length);
        return this.peeked = m[1];
      },
      peek2: function() {
        this.peek();
        var m = this.re.exec(this.str);
        if (!m)
          return null;
        return m[1];
      },
      pop: function() {
        var r = this.peek();
        this.peeked = null;
        this.prevprev = this.prev;
        this.prev = r;
        return r;
      },
      trypop: function(tokens) {
        var tok = this.peek();
        if (tok === tokens)
          return this.pop();
        if (Array.isArray(tokens)) {
          for (var i = 0; i < tokens.length; ++i) {
            var t = tokens[i];
            if (t == tok)
              return this.pop();
            ;
          }
        }
      },
      trypopfuncname: function() {
        var tok = this.peek();
        if (!this.isQnameRe.test(tok))
          return null;
        switch (tok) {
          case 'comment':
          case 'text':
          case 'processing-instruction':
          case 'node':
            return null;
        }
        if ('(' != this.peek2())
          return null;
        return this.pop();
      },
      trypopaxisname: function() {
        var tok = this.peek();
        switch (tok) {
          case 'ancestor':
          case 'ancestor-or-self':
          case 'attribute':
          case 'child':
          case 'descendant':
          case 'descendant-or-self':
          case 'following':
          case 'following-sibling':
          case 'namespace':
          case 'parent':
          case 'preceding':
          case 'preceding-sibling':
          case 'self':
            if ('::' == this.peek2())
              return this.pop();
        }
        return null;
      },
      trypopnametest: function() {
        var tok = this.peek();
        if ('*' === tok || this.startsWithNcNameRe.test(tok))
          return this.pop();
        return null;
      },
      trypopliteral: function() {
        var tok = this.peek();
        if (null == tok)
          return null;
        var first = tok.charAt(0);
        var last = tok.charAt(tok.length - 1);
        if ('"' === first && '"' === last || "'" === first && "'" === last) {
          this.pop();
          return tok.substr(1, tok.length - 2);
        }
      },
      trypopnumber: function() {
        var tok = this.peek();
        if (this.isNumberRe.test(tok))
          return parseFloat(this.pop());
        else
          return null;
      },
      trypopvarref: function() {
        var tok = this.peek();
        if (null == tok)
          return null;
        if ('$' === tok.charAt(0))
          return this.pop().substr(1);
        else
          return null;
      },
      position: function() {
        return this.original.length - this.str.length;
      }
    };
    (function() {
      var nameStartCharsExceptColon = 'A-Z_a-z\xc0-\xd6\xd8-\xf6\xF8-\u02FF\u0370-\u037D\u037F-\u1FFF' + '\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF' + '\uFDF0-\uFFFD';
      var nameCharExceptColon = nameStartCharsExceptColon + '\\-\\.0-9\xb7\u0300-\u036F\u203F-\u2040';
      var ncNameChars = '[' + nameStartCharsExceptColon + '][' + nameCharExceptColon + ']*';
      var qNameChars = ncNameChars + '(?::' + ncNameChars + ')?';
      var otherChars = '\\.\\.|[\\(\\)\\[\\].@,]|::';
      var operatorChars = 'and|or|mod|div|' + '//|!=|<=|>=|[*/|+\\-=<>]';
      var literal = '"[^"]*"|' + "'[^']*'";
      var numberChars = '[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+';
      var variableReference = '\\$' + qNameChars;
      var nameTestChars = '\\*|' + ncNameChars + ':\\*|' + qNameChars;
      var optionalSpace = '[ \t\r\n]*';
      var nodeType = 'comment|text|processing-instruction|node';
      var re = new RegExp('^' + optionalSpace + '(' + numberChars + '|' + otherChars + '|' + nameTestChars + '|' + operatorChars + '|' + literal + '|' + variableReference + ')');
      Stream.prototype.re = re;
      Stream.prototype.startsWithNcNameRe = new RegExp('^' + ncNameChars);
      Stream.prototype.isQnameRe = new RegExp('^' + qNameChars + '$');
      Stream.prototype.isNumberRe = new RegExp('^' + numberChars + '$');
    })();
    var parse = xpath.parse = function parse(stream, a) {
      var r = orExpr(stream, a);
      var x,
          unparsed = [];
      while (x = stream.pop()) {
        unparsed.push(x);
      }
      if (unparsed.length)
        throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Position ' + stream.position() + ': Unparsed tokens: ' + unparsed.join(' '));
      return r;
    };
    function binaryL(subExpr, stream, a, ops) {
      var lhs = subExpr(stream, a);
      if (lhs == null)
        return null;
      var op;
      while (op = stream.trypop(ops)) {
        var rhs = subExpr(stream, a);
        if (rhs == null)
          throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Position ' + stream.position() + ': Expected something after ' + op);
        lhs = a.node(op, lhs, rhs);
      }
      return lhs;
    }
    function binaryR(subExpr, stream, a, ops) {
      var lhs = subExpr(stream, a);
      if (lhs == null)
        return null;
      var op = stream.trypop(ops);
      if (op) {
        var rhs = binaryR(stream, a);
        if (rhs == null)
          throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Position ' + stream.position() + ': Expected something after ' + op);
        return a.node(op, lhs, rhs);
      } else {
        return lhs;
      }
    }
    function locationPath(stream, a) {
      return absoluteLocationPath(stream, a) || relativeLocationPath(null, stream, a);
    }
    function absoluteLocationPath(stream, a) {
      var op = stream.peek();
      if ('/' === op || '//' === op) {
        var lhs = a.node('Root');
        return relativeLocationPath(lhs, stream, a, true);
      } else {
        return null;
      }
    }
    function relativeLocationPath(lhs, stream, a, isOnlyRootOk) {
      if (null == lhs) {
        lhs = step(stream, a);
        if (null == lhs)
          return lhs;
      }
      var op;
      while (op = stream.trypop(['/', '//'])) {
        if ('//' === op) {
          lhs = a.node('/', lhs, a.node('Axis', 'descendant-or-self', 'node', undefined));
        }
        var rhs = step(stream, a);
        if (null == rhs && '/' === op && isOnlyRootOk)
          return lhs;
        else
          isOnlyRootOk = false;
        if (null == rhs)
          throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Position ' + stream.position() + ': Expected step after ' + op);
        lhs = a.node('/', lhs, rhs);
      }
      return lhs;
    }
    function step(stream, a) {
      var abbrStep = stream.trypop(['.', '..']);
      if ('.' === abbrStep)
        return a.node('Axis', 'self', 'node');
      if ('..' === abbrStep)
        return a.node('Axis', 'parent', 'node');
      var axis = axisSpecifier(stream, a);
      var nodeType = nodeTypeTest(stream, a);
      var nodeName;
      if (null == nodeType)
        nodeName = nodeNameTest(stream, a);
      if (null == axis && null == nodeType && null == nodeName)
        return null;
      if (null == nodeType && null == nodeName)
        throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Position ' + stream.position() + ': Expected nodeTest after axisSpecifier ' + axis);
      if (null == axis)
        axis = 'child';
      if (null == nodeType) {
        if ('attribute' === axis)
          nodeType = 'attribute';
        else if ('namespace' === axis)
          nodeType = 'namespace';
        else
          nodeType = 'element';
      }
      var lhs = a.node('Axis', axis, nodeType, nodeName);
      var pred;
      while (null != (pred = predicate(lhs, stream, a))) {
        lhs = pred;
      }
      return lhs;
    }
    function axisSpecifier(stream, a) {
      var attr = stream.trypop('@');
      if (null != attr)
        return 'attribute';
      var axisName = stream.trypopaxisname();
      if (null != axisName) {
        var coloncolon = stream.trypop('::');
        if (null == coloncolon)
          throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Position ' + stream.position() + ': Should not happen. Should be ::.');
        return axisName;
      }
    }
    function nodeTypeTest(stream, a) {
      if ('(' !== stream.peek2()) {
        return null;
      }
      var type = stream.trypop(['comment', 'text', 'processing-instruction', 'node']);
      if (null != type) {
        if (null == stream.trypop('('))
          throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Position ' + stream.position() + ': Should not happen.');
        var param = undefined;
        if (type == 'processing-instruction') {
          param = stream.trypopliteral();
        }
        if (null == stream.trypop(')'))
          throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Position ' + stream.position() + ': Expected close parens.');
        return type;
      }
    }
    function nodeNameTest(stream, a) {
      var name = stream.trypopnametest();
      if (name != null)
        return name;
      else
        return null;
    }
    function predicate(lhs, stream, a) {
      if (null == stream.trypop('['))
        return null;
      var expr = orExpr(stream, a);
      if (null == expr)
        throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Position ' + stream.position() + ': Expected expression after [');
      if (null == stream.trypop(']'))
        throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Position ' + stream.position() + ': Expected ] after expression.');
      return a.node('Predicate', lhs, expr);
    }
    function primaryExpr(stream, a) {
      var x = stream.trypopliteral();
      if (null == x)
        x = stream.trypopnumber();
      if (null != x) {
        return x;
      }
      var varRef = stream.trypopvarref();
      if (null != varRef)
        return a.node('VariableReference', varRef);
      var funCall = functionCall(stream, a);
      if (null != funCall) {
        return funCall;
      }
      if (stream.trypop('(')) {
        var e = orExpr(stream, a);
        if (null == e)
          throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Position ' + stream.position() + ': Expected expression after (.');
        if (null == stream.trypop(')'))
          throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Position ' + stream.position() + ': Expected ) after expression.');
        return e;
      }
      return null;
    }
    function functionCall(stream, a) {
      var name = stream.trypopfuncname(stream, a);
      if (null == name)
        return null;
      if (null == stream.trypop('('))
        throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Position ' + stream.position() + ': Expected ( ) after function name.');
      var params = [];
      var first = true;
      while (null == stream.trypop(')')) {
        if (!first && null == stream.trypop(','))
          throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Position ' + stream.position() + ': Expected , between arguments of the function.');
        first = false;
        var param = orExpr(stream, a);
        if (param == null)
          throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Position ' + stream.position() + ': Expected expression as argument of function.');
        params.push(param);
      }
      return a.node('FunctionCall', name, params);
    }
    function unionExpr(stream, a) {
      return binaryL(pathExpr, stream, a, '|');
    }
    function pathExpr(stream, a) {
      var filter = filterExpr(stream, a);
      if (null == filter) {
        var loc = locationPath(stream, a);
        if (null == loc) {
          throw new Error;
          throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Position ' + stream.position() + ': The expression shouldn\'t be empty...');
        }
        return a.node('PathExpr', loc);
      }
      var rel = relativeLocationPath(filter, stream, a, false);
      if (filter === rel)
        return rel;
      else
        return a.node('PathExpr', rel);
    }
    function filterExpr(stream, a) {
      var primary = primaryExpr(stream, a);
      if (primary == null)
        return null;
      var pred,
          lhs = primary;
      while (null != (pred = predicate(lhs, stream, a))) {
        lhs = pred;
      }
      return lhs;
    }
    function orExpr(stream, a) {
      var orig = (stream.peeked || '') + stream.str;
      var r = binaryL(andExpr, stream, a, 'or');
      var now = (stream.peeked || '') + stream.str;
      return r;
    }
    function andExpr(stream, a) {
      return binaryL(equalityExpr, stream, a, 'and');
    }
    function equalityExpr(stream, a) {
      return binaryL(relationalExpr, stream, a, ['=', '!=']);
    }
    function relationalExpr(stream, a) {
      return binaryL(additiveExpr, stream, a, ['<', '>', '<=', '>=']);
    }
    function additiveExpr(stream, a) {
      return binaryL(multiplicativeExpr, stream, a, ['+', '-']);
    }
    function multiplicativeExpr(stream, a) {
      return binaryL(unaryExpr, stream, a, ['*', 'div', 'mod']);
    }
    function unaryExpr(stream, a) {
      if (stream.trypop('-')) {
        var e = unaryExpr(stream, a);
        if (null == e)
          throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Position ' + stream.position() + ': Expected unary expression after -');
        return a.node('UnaryMinus', e);
      } else
        return unionExpr(stream, a);
    }
    var astFactory = {node: function() {
        return Array.prototype.slice.call(arguments);
      }};
    function optimize(ast) {}
    function NodeMultiSet(isReverseAxis) {
      this.nodes = [];
      this.pos = [];
      this.lasts = [];
      this.nextPos = [];
      this.seriesIndexes = [];
      this.isReverseAxis = isReverseAxis;
      this._pushToNodes = isReverseAxis ? Array.prototype.unshift : Array.prototype.push;
    }
    NodeMultiSet.prototype = {
      pushSeries: function pushSeries() {
        this.nextPos.push(1);
        this.seriesIndexes.push(this.nodes.length);
      },
      popSeries: function popSeries() {
        console.assert(0 < this.nextPos.length, this.nextPos);
        var last = this.nextPos.pop() - 1,
            indexInPos = this.nextPos.length,
            seriesBeginIndex = this.seriesIndexes.pop(),
            seriesEndIndex = this.nodes.length;
        for (var i = seriesBeginIndex; i < seriesEndIndex; ++i) {
          console.assert(indexInPos < this.lasts[i].length);
          console.assert(undefined === this.lasts[i][indexInPos]);
          this.lasts[i][indexInPos] = last;
        }
      },
      finalize: function() {
        if (null == this.nextPos)
          return this;
        console.assert(0 === this.nextPos.length);
        for (var i = 0; i < this.lasts.length; ++i) {
          for (var j = 0; j < this.lasts[i].length; ++j) {
            console.assert(null != this.lasts[i][j], i + ',' + j + ':' + JSON.stringify(this.lasts));
          }
        }
        this.pushSeries = this.popSeries = this.addNode = function() {
          throw new Error('Already finalized.');
        };
        return this;
      },
      addNode: function addNode(node) {
        console.assert(node);
        this._pushToNodes.call(this.nodes, node);
        this._pushToNodes.call(this.pos, this.nextPos.slice());
        this._pushToNodes.call(this.lasts, new Array(this.nextPos.length));
        for (var i = 0; i < this.nextPos.length; ++i)
          this.nextPos[i]++;
      },
      simplify: function() {
        this.finalize();
        return {
          nodes: this.nodes,
          pos: this.pos,
          lasts: this.lasts
        };
      }
    };
    function eachContext(nodeMultiSet) {
      var r = [];
      for (var i = 0; i < nodeMultiSet.nodes.length; i++) {
        var node = nodeMultiSet.nodes[i];
        if (!nodeMultiSet.pos) {
          r.push({
            nodes: [node],
            pos: [[i + 1]],
            lasts: [[nodeMultiSet.nodes.length]]
          });
        } else {
          for (var j = 0; j < nodeMultiSet.pos[i].length; ++j) {
            r.push({
              nodes: [node],
              pos: [[nodeMultiSet.pos[i][j]]],
              lasts: [[nodeMultiSet.lasts[i][j]]]
            });
          }
        }
      }
      return r;
    }
    function NodeMatcher(nodeTypeNum, nodeName, shouldLowerCase) {
      this.nodeTypeNum = nodeTypeNum;
      this.nodeName = nodeName;
      this.shouldLowerCase = shouldLowerCase;
      this.nodeNameTest = null == nodeName ? this._alwaysTrue : shouldLowerCase ? this._nodeNameLowerCaseEquals : this._nodeNameEquals;
    }
    NodeMatcher.prototype = {
      matches: function matches(node) {
        if (0 === this.nodeTypeNum || this._nodeTypeMatches(node)) {
          return this.nodeNameTest(getNodeName(node));
        }
        return false;
      },
      _nodeTypeMatches(nodeOrAttr) {
        if (nodeOrAttr.constructor.name === 'Attr' && this.nodeTypeNum === 2) {
          return true;
        }
        return nodeOrAttr.nodeType === this.nodeTypeNum;
      },
      _alwaysTrue: function(name) {
        return true;
      },
      _nodeNameEquals: function _nodeNameEquals(name) {
        return this.nodeName === name;
      },
      _nodeNameLowerCaseEquals: function _nodeNameLowerCaseEquals(name) {
        return this.nodeName === name.toLowerCase();
      }
    };
    function followingSiblingHelper(nodeList, nodeTypeNum, nodeName, shouldLowerCase, shift, peek, followingNode, andSelf, isReverseAxis) {
      var matcher = new NodeMatcher(nodeTypeNum, nodeName, shouldLowerCase);
      var nodeMultiSet = new NodeMultiSet(isReverseAxis);
      while (0 < nodeList.length) {
        var node = shift.call(nodeList);
        console.assert(node != null);
        node = followingNode(node);
        nodeMultiSet.pushSeries();
        var numPushed = 1;
        while (null != node) {
          if (!andSelf && matcher.matches(node))
            nodeMultiSet.addNode(node);
          if (node === peek.call(nodeList)) {
            shift.call(nodeList);
            nodeMultiSet.pushSeries();
            numPushed++;
          }
          if (andSelf && matcher.matches(node))
            nodeMultiSet.addNode(node);
          node = followingNode(node);
        }
        while (0 < numPushed--)
          nodeMultiSet.popSeries();
      }
      return nodeMultiSet;
    }
    function followingNonDescendantNode(node) {
      if (node.ownerElement) {
        if (node.ownerElement.firstChild)
          return node.ownerElement.firstChild;
        node = node.ownerElement;
      }
      do {
        if (node.nextSibling)
          return node.nextSibling;
      } while (node = node.parentNode);
      return null;
    }
    function followingNode(node) {
      if (node.ownerElement)
        node = node.ownerElement;
      if (null != node.firstChild)
        return node.firstChild;
      do {
        if (null != node.nextSibling) {
          return node.nextSibling;
        }
        node = node.parentNode;
      } while (node);
      return null;
    }
    function precedingNode(node) {
      if (node.ownerElement)
        return node.ownerElement;
      if (null != node.previousSibling) {
        node = node.previousSibling;
        while (null != node.lastChild) {
          node = node.lastChild;
        }
        return node;
      }
      if (null != node.parentNode) {
        return node.parentNode;
      }
      return null;
    }
    function followingHelper(nodeList, nodeTypeNum, nodeName, shouldLowerCase) {
      var matcher = new NodeMatcher(nodeTypeNum, nodeName, shouldLowerCase);
      var nodeMultiSet = new NodeMultiSet(false);
      var cursor = nodeList[0];
      var unorderedFollowingStarts = [];
      for (var i = 0; i < nodeList.length; i++) {
        var node = nodeList[i];
        var start = followingNonDescendantNode(node);
        if (start)
          unorderedFollowingStarts.push(start);
      }
      if (0 === unorderedFollowingStarts.length)
        return {nodes: []};
      var pos = [],
          nextPos = [];
      var started = 0;
      while (cursor = followingNode(cursor)) {
        for (var i = unorderedFollowingStarts.length - 1; i >= 0; i--) {
          if (cursor === unorderedFollowingStarts[i]) {
            nodeMultiSet.pushSeries();
            unorderedFollowingStarts.splice(i, i + 1);
            started++;
          }
        }
        if (started && matcher.matches(cursor)) {
          nodeMultiSet.addNode(cursor);
        }
      }
      console.assert(0 === unorderedFollowingStarts.length);
      for (var i = 0; i < started; i++)
        nodeMultiSet.popSeries();
      return nodeMultiSet.finalize();
    }
    function precedingHelper(nodeList, nodeTypeNum, nodeName, shouldLowerCase) {
      var matcher = new NodeMatcher(nodeTypeNum, nodeName, shouldLowerCase);
      var cursor = nodeList.pop();
      if (null == cursor)
        return {nodes: {}};
      var r = {
        nodes: [],
        pos: [],
        lasts: []
      };
      var nextParents = [cursor.parentNode || cursor.ownerElement],
          nextPos = [1];
      while (cursor = precedingNode(cursor)) {
        if (cursor === nodeList[nodeList.length - 1]) {
          nextParents.push(nodeList.pop());
          nextPos.push(1);
        }
        var matches = matcher.matches(cursor);
        var pos,
            someoneUsed = false;
        if (matches)
          pos = nextPos.slice();
        for (var i = 0; i < nextParents.length; ++i) {
          if (cursor === nextParents[i]) {
            nextParents[i] = cursor.parentNode || cursor.ownerElement;
            if (matches) {
              pos[i] = null;
            }
          } else {
            if (matches) {
              pos[i] = nextPos[i]++;
              someoneUsed = true;
            }
          }
        }
        if (someoneUsed) {
          r.nodes.unshift(cursor);
          r.pos.unshift(pos);
        }
      }
      for (var i = 0; i < r.pos.length; ++i) {
        var lasts = [];
        r.lasts.push(lasts);
        for (var j = r.pos[i].length - 1; j >= 0; j--) {
          if (null == r.pos[i][j]) {
            r.pos[i].splice(j, j + 1);
          } else {
            lasts.unshift(nextPos[j] - 1);
          }
        }
      }
      return r;
    }
    function descendantDfs(nodeMultiSet, node, remaining, matcher, andSelf, attrIndices, attrNodes) {
      while (0 < remaining.length && null != remaining[0].ownerElement) {
        var attr = remaining.shift();
        if (andSelf && matcher.matches(attr)) {
          attrNodes.push(attr);
          attrIndices.push(nodeMultiSet.nodes.length);
        }
      }
      if (null != node && !andSelf) {
        if (matcher.matches(node))
          nodeMultiSet.addNode(node);
      }
      var pushed = false;
      if (null == node) {
        if (0 === remaining.length)
          return;
        node = remaining.shift();
        nodeMultiSet.pushSeries();
        pushed = true;
      } else if (0 < remaining.length && node === remaining[0]) {
        nodeMultiSet.pushSeries();
        pushed = true;
        remaining.shift();
      }
      if (andSelf) {
        if (matcher.matches(node))
          nodeMultiSet.addNode(node);
      }
      var nodeList = node.childNodes;
      for (var j = 0; j < nodeList.length; ++j) {
        var child = nodeList[j];
        descendantDfs(nodeMultiSet, child, remaining, matcher, andSelf, attrIndices, attrNodes);
      }
      if (pushed) {
        nodeMultiSet.popSeries();
      }
    }
    function descenantHelper(nodeList, nodeTypeNum, nodeName, shouldLowerCase, andSelf) {
      var matcher = new NodeMatcher(nodeTypeNum, nodeName, shouldLowerCase);
      var nodeMultiSet = new NodeMultiSet(false);
      var attrIndices = [],
          attrNodes = [];
      while (0 < nodeList.length) {
        descendantDfs(nodeMultiSet, null, nodeList, matcher, andSelf, attrIndices, attrNodes);
      }
      nodeMultiSet.finalize();
      for (var i = attrNodes.length - 1; i >= 0; --i) {
        nodeMultiSet.nodes.splice(attrIndices[i], attrIndices[i], attrNodes[i]);
        nodeMultiSet.pos.splice(attrIndices[i], attrIndices[i], [1]);
        nodeMultiSet.lasts.splice(attrIndices[i], attrIndices[i], [1]);
      }
      return nodeMultiSet;
    }
    function ancestorHelper(nodeList, nodeTypeNum, nodeName, shouldLowerCase, andSelf) {
      var matcher = new NodeMatcher(nodeTypeNum, nodeName, shouldLowerCase);
      var ancestors = [];
      for (var i = 0; i < nodeList.length; ++i) {
        var node = nodeList[i];
        var isFirst = true;
        var a = [];
        while (null != node) {
          if (!isFirst || andSelf) {
            if (matcher.matches(node))
              a.push(node);
          }
          isFirst = false;
          node = node.parentNode || node.ownerElement;
        }
        if (0 < a.length)
          ancestors.push(a);
      }
      var lasts = [];
      for (var i = 0; i < ancestors.length; ++i)
        lasts.push(ancestors[i].length);
      var nodeMultiSet = new NodeMultiSet(true);
      var newCtx = {
        nodes: [],
        pos: [],
        lasts: []
      };
      while (0 < ancestors.length) {
        var pos = [ancestors[0].length];
        var last = [lasts[0]];
        var node = ancestors[0].pop();
        for (var i = ancestors.length - 1; i > 0; --i) {
          if (node === ancestors[i][ancestors[i].length - 1]) {
            pos.push(ancestors[i].length);
            last.push(lasts[i]);
            ancestors[i].pop();
            if (0 === ancestors[i].length) {
              ancestors.splice(i, i + 1);
              lasts.splice(i, i + 1);
            }
          }
        }
        if (0 === ancestors[0].length) {
          ancestors.shift();
          lasts.shift();
        }
        newCtx.nodes.push(node);
        newCtx.pos.push(pos);
        newCtx.lasts.push(last);
      }
      return newCtx;
    }
    function addressVector(node) {
      var r = [node];
      if (null != node.ownerElement) {
        node = node.ownerElement;
        r.push(-1);
      }
      while (null != node) {
        var i = 0;
        while (null != node.previousSibling) {
          node = node.previousSibling;
          i++;
        }
        r.push(i);
        node = node.parentNode;
      }
      return r;
    }
    function addressComparator(a, b) {
      var minlen = Math.min(a.length - 1, b.length - 1),
          alen = a.length,
          blen = b.length;
      if (a[0] === b[0])
        return 0;
      var c;
      for (var i = 0; i < minlen; ++i) {
        c = a[alen - i - 1] - b[blen - i - 1];
        if (0 !== c)
          break;
      }
      if (null == c || 0 === c) {
        c = alen - blen;
      }
      if (0 === c)
        c = getNodeName(a) - getNodeName(b);
      if (0 === c)
        c = 1;
      return c;
    }
    var sortUniqDocumentOrder = xpath.sortUniqDocumentOrder = function(nodes) {
      var a = [];
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var v = addressVector(node);
        a.push(v);
      }
      a.sort(addressComparator);
      var b = [];
      for (var i = 0; i < a.length; i++) {
        if (0 < i && a[i][0] === a[i - 1][0])
          continue;
        b.push(a[i][0]);
      }
      return b;
    };
    function sortNodeMultiSet(nodeMultiSet) {
      var a = [];
      for (var i = 0; i < nodeMultiSet.nodes.length; i++) {
        var v = addressVector(nodeMultiSet.nodes[i]);
        a.push({
          v: v,
          n: nodeMultiSet.nodes[i],
          p: nodeMultiSet.pos[i],
          l: nodeMultiSet.lasts[i]
        });
      }
      a.sort(compare);
      var r = {
        nodes: [],
        pos: [],
        lasts: []
      };
      for (var i = 0; i < a.length; ++i) {
        r.nodes.push(a[i].n);
        r.pos.push(a[i].p);
        r.lasts.push(a[i].l);
      }
      function compare(x, y) {
        return addressComparator(x.v, y.v);
      }
      return r;
    }
    function nodeAndAncestors(node) {
      var ancestors = [node];
      var p = node;
      while (p = p.parentNode || p.ownerElement) {
        ancestors.unshift(p);
      }
      return ancestors;
    }
    function compareSiblings(a, b) {
      if (a === b)
        return 0;
      var c = a;
      while (c = c.previousSibling) {
        if (c === b)
          return 1;
      }
      c = b;
      while (c = c.previousSibling) {
        if (c === a)
          return -1;
      }
      throw new Error('a and b are not siblings: ' + xpath.stringifyObject(a) + ' vs ' + xpath.stringifyObject(b));
    }
    function mergeNodeLists(x, y) {
      var a,
          b,
          aanc,
          banc,
          r = [];
      if ('object' !== typeof x)
        throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Invalid LHS for | operator ' + '(expected node-set): ' + x);
      if ('object' !== typeof y)
        throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Invalid LHS for | operator ' + '(expected node-set): ' + y);
      while (true) {
        if (null == a) {
          a = x.shift();
          if (null != a)
            aanc = addressVector(a);
        }
        if (null == b) {
          b = y.shift();
          if (null != b)
            banc = addressVector(b);
        }
        if (null == a || null == b)
          break;
        var c = addressComparator(aanc, banc);
        if (c < 0) {
          r.push(a);
          a = null;
          aanc = null;
        } else if (c > 0) {
          r.push(b);
          b = null;
          banc = null;
        } else if (getNodeName(a) < getNodeName(b)) {
          r.push(a);
          a = null;
          aanc = null;
        } else if (getNodeName(a) > getNodeName(b)) {
          r.push(b);
          b = null;
          banc = null;
        } else if (a !== b) {
          r.push(b);
          b = null;
          banc = null;
        } else {
          console.assert(a === b, c);
          b = null;
          banc = null;
        }
      }
      while (a) {
        r.push(a);
        a = x.shift();
      }
      while (b) {
        r.push(b);
        b = y.shift();
      }
      return r;
    }
    function comparisonHelper(test, x, y, isNumericComparison) {
      var coersion;
      if (isNumericComparison)
        coersion = fn.number;
      else
        coersion = 'boolean' === typeof x || 'boolean' === typeof y ? fn['boolean'] : 'number' === typeof x || 'number' === typeof y ? fn.number : fn.string;
      if ('object' === typeof x && 'object' === typeof y) {
        var aMap = {};
        for (var i = 0; i < x.nodes.length; ++i) {
          var xi = coersion({nodes: [x.nodes[i]]});
          for (var j = 0; j < y.nodes.length; ++j) {
            var yj = coersion({nodes: [y.nodes[j]]});
            if (test(xi, yj))
              return true;
          }
        }
        return false;
      } else if ('object' === typeof x && x.nodes && x.nodes.length) {
        for (var i = 0; i < x.nodes.length; ++i) {
          var xi = coersion({nodes: [x.nodes[i]]}),
              yc = coersion(y);
          if (test(xi, yc))
            return true;
        }
        return false;
      } else if ('object' === typeof y && x.nodes && x.nodes.length) {
        for (var i = 0; i < x.nodes.length; ++i) {
          var yi = coersion({nodes: [y.nodes[i]]}),
              xc = coersion(x);
          if (test(xc, yi))
            return true;
        }
        return false;
      } else {
        var xc = coersion(x),
            yc = coersion(y);
        return test(xc, yc);
      }
    }
    var axes = xpath.axes = {
      'ancestor': function ancestor(nodeList, nodeTypeNum, nodeName, shouldLowerCase) {
        return ancestorHelper(nodeList, nodeTypeNum, nodeName, shouldLowerCase, false);
      },
      'ancestor-or-self': function ancestorOrSelf(nodeList, nodeTypeNum, nodeName, shouldLowerCase) {
        return ancestorHelper(nodeList, nodeTypeNum, nodeName, shouldLowerCase, true);
      },
      'attribute': function attribute(nodeList, nodeTypeNum, nodeName, shouldLowerCase) {
        var matcher = new NodeMatcher(nodeTypeNum, nodeName, shouldLowerCase);
        var nodeMultiSet = new NodeMultiSet(false);
        if (null != nodeName) {
          for (var i = 0; i < nodeList.length; ++i) {
            var node = nodeList[i];
            if (null == node.getAttributeNode)
              continue;
            var attr = node.getAttributeNode(nodeName);
            if (null != attr && matcher.matches(attr)) {
              nodeMultiSet.pushSeries();
              nodeMultiSet.addNode(attr);
              nodeMultiSet.popSeries();
            }
          }
        } else {
          for (var i = 0; i < nodeList.length; ++i) {
            var node = nodeList[i];
            if (null != node.attributes) {
              nodeMultiSet.pushSeries();
              for (var j = 0; j < node.attributes.length; j++) {
                var attr = node.attributes[j];
                if (matcher.matches(attr))
                  nodeMultiSet.addNode(attr);
              }
              nodeMultiSet.popSeries();
            }
          }
        }
        return nodeMultiSet.finalize();
      },
      'child': function child(nodeList, nodeTypeNum, nodeName, shouldLowerCase) {
        var matcher = new NodeMatcher(nodeTypeNum, nodeName, shouldLowerCase);
        var nodeMultiSet = new NodeMultiSet(false);
        for (var i = 0; i < nodeList.length; ++i) {
          var n = nodeList[i];
          if (n.ownerElement)
            continue;
          if (n.childNodes) {
            nodeMultiSet.pushSeries();
            var childList = 1 === nodeTypeNum && null != n.children ? n.children : n.childNodes;
            for (var j = 0; j < childList.length; ++j) {
              var child = childList[j];
              if (matcher.matches(child)) {
                nodeMultiSet.addNode(child);
              }
            }
            nodeMultiSet.popSeries();
          }
        }
        nodeMultiSet.finalize();
        return sortNodeMultiSet(nodeMultiSet);
      },
      'descendant': function descenant(nodeList, nodeTypeNum, nodeName, shouldLowerCase) {
        return descenantHelper(nodeList, nodeTypeNum, nodeName, shouldLowerCase, false);
      },
      'descendant-or-self': function descenantOrSelf(nodeList, nodeTypeNum, nodeName, shouldLowerCase) {
        return descenantHelper(nodeList, nodeTypeNum, nodeName, shouldLowerCase, true);
      },
      'following': function following(nodeList, nodeTypeNum, nodeName, shouldLowerCase) {
        return followingHelper(nodeList, nodeTypeNum, nodeName, shouldLowerCase);
      },
      'following-sibling': function followingSibling(nodeList, nodeTypeNum, nodeName, shouldLowerCase) {
        return followingSiblingHelper(nodeList, nodeTypeNum, nodeName, shouldLowerCase, Array.prototype.shift, function() {
          return this[0];
        }, function(node) {
          return node.nextSibling;
        });
      },
      'namespace': function namespace(nodeList, nodeTypeNum, nodeName, shouldLowerCase) {},
      'parent': function parent(nodeList, nodeTypeNum, nodeName, shouldLowerCase) {
        var matcher = new NodeMatcher(nodeTypeNum, nodeName, shouldLowerCase);
        var nodes = [],
            pos = [];
        for (var i = 0; i < nodeList.length; ++i) {
          var parent = nodeList[i].parentNode || nodeList[i].ownerElement;
          if (null == parent)
            continue;
          if (!matcher.matches(parent))
            continue;
          if (nodes.length > 0 && parent === nodes[nodes.length - 1])
            continue;
          nodes.push(parent);
          pos.push([1]);
        }
        return {
          nodes: nodes,
          pos: pos,
          lasts: pos
        };
      },
      'preceding': function preceding(nodeList, nodeTypeNum, nodeName, shouldLowerCase) {
        return precedingHelper(nodeList, nodeTypeNum, nodeName, shouldLowerCase);
      },
      'preceding-sibling': function precedingSibling(nodeList, nodeTypeNum, nodeName, shouldLowerCase) {
        return followingSiblingHelper(nodeList, nodeTypeNum, nodeName, shouldLowerCase, Array.prototype.pop, function() {
          return this[this.length - 1];
        }, function(node) {
          return node.previousSibling;
        }, false, true);
      },
      'self': function self(nodeList, nodeTypeNum, nodeName, shouldLowerCase) {
        var nodes = [],
            pos = [];
        var matcher = new NodeMatcher(nodeTypeNum, nodeName, shouldLowerCase);
        for (var i = 0; i < nodeList.length; ++i) {
          if (matcher.matches(nodeList[i])) {
            nodes.push(nodeList[i]);
            pos.push([1]);
          }
        }
        return {
          nodes: nodes,
          pos: pos,
          lasts: pos
        };
      }
    };
    var fn = {
      'number': function number(optObject) {
        if ('number' === typeof optObject)
          return optObject;
        if ('string' === typeof optObject)
          return parseFloat(optObject);
        if ('boolean' === typeof optObject)
          return +optObject;
        return fn.number(fn.string.call(this, optObject));
      },
      'string': function string(optObject) {
        if (null == optObject)
          return fn.string(this);
        if ('string' === typeof optObject || 'boolean' === typeof optObject || 'number' === typeof optObject)
          return '' + optObject;
        if (0 == optObject.nodes.length)
          return '';
        if (null != optObject.nodes[0].textContent)
          return optObject.nodes[0].textContent;
        return optObject.nodes[0].nodeValue;
      },
      'boolean': function booleanVal(x) {
        return 'object' === typeof x ? x.nodes.length > 0 : !!x;
      },
      'last': function last() {
        console.assert(Array.isArray(this.pos));
        console.assert(Array.isArray(this.lasts));
        console.assert(1 === this.pos.length);
        console.assert(1 === this.lasts.length);
        console.assert(1 === this.lasts[0].length);
        return this.lasts[0][0];
      },
      'position': function position() {
        console.assert(Array.isArray(this.pos));
        console.assert(Array.isArray(this.lasts));
        console.assert(1 === this.pos.length);
        console.assert(1 === this.lasts.length);
        console.assert(1 === this.pos[0].length);
        return this.pos[0][0];
      },
      'count': function count(nodeSet) {
        if ('object' !== typeof nodeSet)
          throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Position ' + stream.position() + ': Function count(node-set) ' + 'got wrong argument type: ' + nodeSet);
        return nodeSet.nodes.length;
      },
      'id': function id(object) {
        var r = {nodes: []};
        var doc = this.nodes[0].ownerDocument || this.nodes[0];
        console.assert(doc);
        var ids;
        if ('object' === typeof object) {
          ids = [];
          for (var i = 0; i < object.nodes.length; ++i) {
            var idNode = object.nodes[i];
            var idsString = fn.string({nodes: [idNode]});
            var a = idsString.split(/[ \t\r\n]+/g);
            Array.prototype.push.apply(ids, a);
          }
        } else {
          var idsString = fn.string(object);
          var a = idsString.split(/[ \t\r\n]+/g);
          ids = a;
        }
        for (var i = 0; i < ids.length; ++i) {
          var id = ids[i];
          if (0 === id.length)
            continue;
          var node = doc.getElementById(id);
          if (null != node)
            r.nodes.push(node);
        }
        r.nodes = sortUniqDocumentOrder(r.nodes);
        return r;
      },
      'local-name': function(nodeSet) {
        if (null == nodeSet)
          return fn.name(this);
        if (null == nodeSet.nodes) {
          throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'argument to name() must be a node-set. got ' + nodeSet);
        }
        return nodeSet.nodes[0].localName;
      },
      'namespace-uri': function(nodeSet) {
        throw new Error('not implemented yet');
      },
      'name': function(nodeSet) {
        if (null == nodeSet)
          return fn.name(this);
        if (null == nodeSet.nodes) {
          throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'argument to name() must be a node-set. got ' + nodeSet);
        }
        return nodeSet.nodes[0].name;
      },
      'concat': function concat(x) {
        var l = [];
        for (var i = 0; i < arguments.length; ++i) {
          l.push(fn.string(arguments[i]));
        }
        return l.join('');
      },
      'starts-with': function startsWith(a, b) {
        var as = fn.string(a),
            bs = fn.string(b);
        return as.substr(0, bs.length) === bs;
      },
      'contains': function contains(a, b) {
        var as = fn.string(a),
            bs = fn.string(b);
        var i = as.indexOf(bs);
        if (-1 === i)
          return false;
        return true;
      },
      'substring-before': function substringBefore(a, b) {
        var as = fn.string(a),
            bs = fn.string(b);
        var i = as.indexOf(bs);
        if (-1 === i)
          return '';
        return as.substr(0, i);
      },
      'substring-after': function substringBefore(a, b) {
        var as = fn.string(a),
            bs = fn.string(b);
        var i = as.indexOf(bs);
        if (-1 === i)
          return '';
        return as.substr(i + bs.length);
      },
      'substring': function substring(string, start, optEnd) {
        if (null == string || null == start) {
          throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Must be at least 2 arguments to string()');
        }
        var sString = fn.string(string),
            iStart = fn.round(start),
            iEnd = optEnd == null ? null : fn.round(optEnd);
        if (iEnd == null)
          return sString.substr(iStart - 1);
        else
          return sString.substr(iStart - 1, iEnd);
      },
      'string-length': function stringLength(optString) {
        return fn.string.call(this, optString).length;
      },
      'normalize-space': function normalizeSpace(optString) {
        var s = fn.string.call(this, optString);
        return s.replace(/[ \t\r\n]+/g, ' ').replace(/^ | $/g, '');
      },
      'translate': function translate(string, from, to) {
        var sString = fn.string.call(this, string),
            sFrom = fn.string(from),
            sTo = fn.string(to);
        var eachCharRe = [];
        var map = {};
        for (var i = 0; i < sFrom.length; ++i) {
          var c = sFrom.charAt(i);
          map[c] = sTo.charAt(i);
          eachCharRe.push(c.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').replace(/\x08/g, '\\x08'));
        }
        var re = new RegExp(eachCharRe.join('|'), 'g');
        return sString.replace(re, function(c) {
          return map[c];
        });
      },
      'not': function not(x) {
        var bx = fn['boolean'](x);
        return !bx;
      },
      'true': function trueVal() {
        return true;
      },
      'false': function falseVal() {
        return false;
      },
      'lang': function lang(string) {
        throw new Error('Not implemented');
      },
      'sum': function sum(optNodeSet) {
        if (null == optNodeSet)
          return fn.sum(this);
        var sum = 0;
        for (var i = 0; i < optNodeSet.nodes.length; ++i) {
          var node = optNodeSet.nodes[i];
          var x = fn.number({nodes: [node]});
          sum += x;
        }
        return sum;
      },
      'floor': function floor(number) {
        return Math.floor(fn.number(number));
      },
      'ceiling': function ceiling(number) {
        return Math.ceil(fn.number(number));
      },
      'round': function round(number) {
        return Math.round(fn.number(number));
      }
    };
    var more = {
      UnaryMinus: function(x) {
        return -fn.number(x);
      },
      '+': function(x, y) {
        return fn.number(x) + fn.number(y);
      },
      '-': function(x, y) {
        return fn.number(x) - fn.number(y);
      },
      '*': function(x, y) {
        return fn.number(x) * fn.number(y);
      },
      'div': function(x, y) {
        return fn.number(x) / fn.number(y);
      },
      'mod': function(x, y) {
        return fn.number(x) % fn.number(y);
      },
      '<': function(x, y) {
        return comparisonHelper(function(x, y) {
          return fn.number(x) < fn.number(y);
        }, x, y, true);
      },
      '<=': function(x, y) {
        return comparisonHelper(function(x, y) {
          return fn.number(x) <= fn.number(y);
        }, x, y, true);
      },
      '>': function(x, y) {
        return comparisonHelper(function(x, y) {
          return fn.number(x) > fn.number(y);
        }, x, y, true);
      },
      '>=': function(x, y) {
        return comparisonHelper(function(x, y) {
          return fn.number(x) >= fn.number(y);
        }, x, y, true);
      },
      'and': function(x, y) {
        return fn['boolean'](x) && fn['boolean'](y);
      },
      'or': function(x, y) {
        return fn['boolean'](x) || fn['boolean'](y);
      },
      '|': function(x, y) {
        return {nodes: mergeNodeLists(x.nodes, y.nodes)};
      },
      '=': function(x, y) {
        if ('object' === typeof x && 'object' === typeof y) {
          var aMap = {};
          for (var i = 0; i < x.nodes.length; ++i) {
            var s = fn.string({nodes: [x.nodes[i]]});
            aMap[s] = true;
          }
          for (var i = 0; i < y.nodes.length; ++i) {
            var s = fn.string({nodes: [y.nodes[i]]});
            if (aMap[s])
              return true;
          }
          return false;
        } else {
          return comparisonHelper(function(x, y) {
            return x === y;
          }, x, y);
        }
      },
      '!=': function(x, y) {
        if ('object' === typeof x && 'object' === typeof y) {
          if (0 === x.nodes.length || 0 === y.nodes.length)
            return false;
          var aMap = {};
          for (var i = 0; i < x.nodes.length; ++i) {
            var s = fn.string({nodes: [x.nodes[i]]});
            aMap[s] = true;
          }
          for (var i = 0; i < y.nodes.length; ++i) {
            var s = fn.string({nodes: [y.nodes[i]]});
            if (!aMap[s])
              return true;
          }
          return false;
        } else {
          return comparisonHelper(function(x, y) {
            return x !== y;
          }, x, y);
        }
      }
    };
    var nodeTypes = xpath.nodeTypes = {
      'node': 0,
      'attribute': 2,
      'comment': 8,
      'text': 3,
      'processing-instruction': 7,
      'element': 1
    };
    var stringifyObject = xpath.stringifyObject = function stringifyObject(ctx) {
      var seenKey = 'seen' + Math.floor(Math.random() * 1000000000);
      return JSON.stringify(helper(ctx));
      function helper(ctx) {
        if (Array.isArray(ctx)) {
          return ctx.map(function(x) {
            return helper(x);
          });
        }
        if ('object' !== typeof ctx)
          return ctx;
        if (null == ctx)
          return ctx;
        if (null != ctx.outerHTML)
          return ctx.outerHTML;
        if (null != ctx.nodeValue)
          return ctx.nodeName + '=' + ctx.nodeValue;
        if (ctx[seenKey])
          return '[circular]';
        ctx[seenKey] = true;
        var nicer = {};
        for (var key in ctx) {
          if (seenKey === key)
            continue;
          try {
            nicer[key] = helper(ctx[key]);
          } catch (e) {
            nicer[key] = '[exception: ' + e.message + ']';
          }
        }
        delete ctx[seenKey];
        return nicer;
      }
    };
    var Evaluator = xpath.Evaluator = function Evaluator(doc) {
      this.doc = doc;
    };
    Evaluator.prototype = {val: function val(ast, ctx) {
        console.assert(ctx.nodes);
        if ('number' === typeof ast || 'string' === typeof ast)
          return ast;
        if (more[ast[0]]) {
          var evaluatedParams = [];
          for (var i = 1; i < ast.length; ++i) {
            evaluatedParams.push(this.val(ast[i], ctx));
          }
          var r = more[ast[0]].apply(ctx, evaluatedParams);
          return r;
        }
        switch (ast[0]) {
          case 'Root':
            return {nodes: [this.doc]};
          case 'FunctionCall':
            var functionName = ast[1],
                functionParams = ast[2];
            if (null == fn[functionName])
              throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, 'Unknown function: ' + functionName);
            var evaluatedParams = [];
            for (var i = 0; i < functionParams.length; ++i) {
              evaluatedParams.push(this.val(functionParams[i], ctx));
            }
            var r = fn[functionName].apply(ctx, evaluatedParams);
            return r;
          case 'Predicate':
            var lhs = this.val(ast[1], ctx);
            var ret = {nodes: []};
            var contexts = eachContext(lhs);
            for (var i = 0; i < contexts.length; ++i) {
              var singleNodeSet = contexts[i];
              var rhs = this.val(ast[2], singleNodeSet);
              var success;
              if ('number' === typeof rhs) {
                success = rhs === singleNodeSet.pos[0][0];
              } else {
                success = fn['boolean'](rhs);
              }
              if (success) {
                var node = singleNodeSet.nodes[0];
                ret.nodes.push(node);
                while (i + 1 < contexts.length && node === contexts[i + 1].nodes[0]) {
                  i++;
                }
              }
            }
            return ret;
          case 'PathExpr':
            var x = this.val(ast[1], ctx);
            if (x.finalize) {
              return {nodes: x.nodes};
            } else {
              return x;
            }
          case '/':
            var lhs = this.val(ast[1], ctx);
            console.assert(null != lhs);
            var r = this.val(ast[2], lhs);
            console.assert(null != r);
            return r;
          case 'Axis':
            var axis = ast[1],
                nodeType = ast[2],
                nodeTypeNum = nodeTypes[nodeType],
                shouldLowerCase = true,
                nodeName = ast[3] && shouldLowerCase ? ast[3].toLowerCase() : ast[3];
            nodeName = nodeName === '*' ? null : nodeName;
            if ('object' !== typeof ctx)
              return {
                nodes: [],
                pos: []
              };
            var nodeList = ctx.nodes.slice();
            var r = axes[axis](nodeList, nodeTypeNum, nodeName, shouldLowerCase);
            return r;
        }
      }};
    var evaluate = xpath.evaluate = function evaluate(expr, doc, context) {
      var stream = new Stream(expr);
      var ast = parse(stream, astFactory);
      var val = new Evaluator(doc).val(ast, {nodes: [context]});
      return val;
    };
    var XPathException = xpath.XPathException = function XPathException(code, message) {
      var e = new Error(message);
      e.name = 'XPathException';
      e.code = code;
      return e;
    };
    XPathException.INVALID_EXPRESSION_ERR = 51;
    XPathException.TYPE_ERR = 52;
    var XPathEvaluator = xpath.XPathEvaluator = function XPathEvaluator() {};
    XPathEvaluator.prototype = {
      createExpression: function(expression, resolver) {
        return new XPathExpression(expression, resolver);
      },
      createNSResolver: function(nodeResolver) {},
      evaluate: function evaluate(expression, contextNode, resolver, type, result) {
        var expr = new XPathExpression(expression, resolver);
        return expr.evaluate(contextNode, type, result);
      }
    };
    var XPathExpression = xpath.XPathExpression = function XPathExpression(expression, resolver, optDoc) {
      var stream = new Stream(expression);
      this._ast = parse(stream, astFactory);
      this._doc = optDoc;
    };
    XPathExpression.prototype = {evaluate: function evaluate(contextNode, type, result) {
        if (null == contextNode.nodeType)
          throw new Error('bad argument (expected context node): ' + contextNode);
        var doc = contextNode.ownerDocument || contextNode;
        if (null != this._doc && this._doc !== doc) {
          throw new core.DOMException(core.DOMException.WRONG_DOCUMENT_ERR, 'The document must be the same as the context node\'s document.');
        }
        var evaluator = new Evaluator(doc);
        var value = evaluator.val(this._ast, {nodes: [contextNode]});
        if (XPathResult.NUMBER_TYPE === type)
          value = fn.number(value);
        else if (XPathResult.STRING_TYPE === type)
          value = fn.string(value);
        else if (XPathResult.BOOLEAN_TYPE === type)
          value = fn['boolean'](value);
        else if (XPathResult.ANY_TYPE !== type && XPathResult.UNORDERED_NODE_ITERATOR_TYPE !== type && XPathResult.ORDERED_NODE_ITERATOR_TYPE !== type && XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE !== type && XPathResult.ORDERED_NODE_SNAPSHOT_TYPE !== type && XPathResult.ANY_UNORDERED_NODE_TYPE !== type && XPathResult.FIRST_ORDERED_NODE_TYPE !== type)
          throw new core.DOMException(core.DOMException.NOT_SUPPORTED_ERR, 'You must provide an XPath result type (0=any).');
        else if (XPathResult.ANY_TYPE !== type && 'object' !== typeof value)
          throw new XPathException(XPathException.TYPE_ERR, 'Value should be a node-set: ' + value);
        return new XPathResult(doc, value, type);
      }};
    var XPathResult = xpath.XPathResult = function XPathResult(doc, value, resultType) {
      this._value = value;
      this._resultType = resultType;
      this._i = 0;
      this._invalidated = false;
      if (this.resultType === XPathResult.UNORDERED_NODE_ITERATOR_TYPE || this.resultType === XPathResult.ORDERED_NODE_ITERATOR_TYPE) {
        doc.addEventListener('DOMSubtreeModified', invalidate, true);
        var self = this;
        function invalidate() {
          self._invalidated = true;
          doc.removeEventListener('DOMSubtreeModified', invalidate, true);
        }
      }
    };
    XPathResult.ANY_TYPE = 0;
    XPathResult.NUMBER_TYPE = 1;
    XPathResult.STRING_TYPE = 2;
    XPathResult.BOOLEAN_TYPE = 3;
    XPathResult.UNORDERED_NODE_ITERATOR_TYPE = 4;
    XPathResult.ORDERED_NODE_ITERATOR_TYPE = 5;
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE = 6;
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE = 7;
    XPathResult.ANY_UNORDERED_NODE_TYPE = 8;
    XPathResult.FIRST_ORDERED_NODE_TYPE = 9;
    var proto = {
      get resultType() {
        if (this._resultType)
          return this._resultType;
        switch (typeof this._value) {
          case 'number':
            return XPathResult.NUMBER_TYPE;
          case 'string':
            return XPathResult.STRING_TYPE;
          case 'boolean':
            return XPathResult.BOOLEAN_TYPE;
          default:
            return XPathResult.UNORDERED_NODE_ITERATOR_TYPE;
        }
      },
      get numberValue() {
        if (XPathResult.NUMBER_TYPE !== this.resultType)
          throw new XPathException(XPathException.TYPE_ERR, 'You should have asked for a NUMBER_TYPE.');
        return this._value;
      },
      get stringValue() {
        if (XPathResult.STRING_TYPE !== this.resultType)
          throw new XPathException(XPathException.TYPE_ERR, 'You should have asked for a STRING_TYPE.');
        return this._value;
      },
      get booleanValue() {
        if (XPathResult.BOOLEAN_TYPE !== this.resultType)
          throw new XPathException(XPathException.TYPE_ERR, 'You should have asked for a BOOLEAN_TYPE.');
        return this._value;
      },
      get singleNodeValue() {
        if (XPathResult.ANY_UNORDERED_NODE_TYPE !== this.resultType && XPathResult.FIRST_ORDERED_NODE_TYPE !== this.resultType)
          throw new XPathException(XPathException.TYPE_ERR, 'You should have asked for a FIRST_ORDERED_NODE_TYPE.');
        return this._value.nodes[0] || null;
      },
      get invalidIteratorState() {
        if (XPathResult.UNORDERED_NODE_ITERATOR_TYPE !== this.resultType && XPathResult.ORDERED_NODE_ITERATOR_TYPE !== this.resultType)
          return false;
        return !!this._invalidated;
      },
      get snapshotLength() {
        if (XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE !== this.resultType && XPathResult.ORDERED_NODE_SNAPSHOT_TYPE !== this.resultType)
          throw new XPathException(XPathException.TYPE_ERR, 'You should have asked for a ORDERED_NODE_SNAPSHOT_TYPE.');
        return this._value.nodes.length;
      },
      iterateNext: function iterateNext() {
        if (XPathResult.UNORDERED_NODE_ITERATOR_TYPE !== this.resultType && XPathResult.ORDERED_NODE_ITERATOR_TYPE !== this.resultType)
          throw new XPathException(XPathException.TYPE_ERR, 'You should have asked for a ORDERED_NODE_ITERATOR_TYPE.');
        if (this.invalidIteratorState)
          throw new core.DOMException(core.DOMException.INVALID_STATE_ERR, 'The document has been mutated since the result was returned');
        return this._value.nodes[this._i++] || null;
      },
      snapshotItem: function snapshotItem(index) {
        if (XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE !== this.resultType && XPathResult.ORDERED_NODE_SNAPSHOT_TYPE !== this.resultType)
          throw new XPathException(XPathException.TYPE_ERR, 'You should have asked for a ORDERED_NODE_SNAPSHOT_TYPE.');
        return this._value.nodes[index] || null;
      }
    };
    XPathResult.prototype = Object.create(XPathResult, Object.keys(proto).reduce(function(descriptors, name) {
      descriptors[name] = Object.getOwnPropertyDescriptor(proto, name);
      return descriptors;
    }, {constructor: {
        value: XPathResult,
        writable: true,
        configurable: true
      }}));
    core.XPathException = XPathException;
    core.XPathExpression = XPathExpression;
    core.XPathResult = XPathResult;
    core.XPathEvaluator = XPathEvaluator;
    core.Document.prototype.createExpression = XPathEvaluator.prototype.createExpression;
    core.Document.prototype.createNSResolver = XPathEvaluator.prototype.createNSResolver;
    core.Document.prototype.evaluate = XPathEvaluator.prototype.evaluate;
    return xpath;
  };
})(require('process'));
