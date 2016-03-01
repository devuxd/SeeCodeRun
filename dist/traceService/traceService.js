System.register(['esprima'], function (_export) {
  'use strict';

  var esprima, TraceService;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_esprima) {
      esprima = _esprima['default'];
    }],
    execute: function () {
      TraceService = (function () {
        function TraceService() {
          _classCallCheck(this, TraceService);

          this.esprima = esprima;
        }

        _createClass(TraceService, [{
          key: 'getTrace',
          value: function getTrace(code) {
            var syntax = this.esprima.parse(code, { loc: true });

            var toReturn = [];

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = syntax.body[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var node = _step.value;

                if (node.type === 'VariableDeclaration') {
                  var init = node.declarations[0].init;

                  if (init.type === 'Literal') {
                    var variableName = node.declarations[0].id.name;
                    var content = '{ ' + variableName + ': ' + init.value + ' }';

                    toReturn.push({
                      location: {
                        row: init.loc.start.line - 1,
                        col: init.loc.start.col
                      },
                      content: content
                    });
                  }
                }
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator['return']) {
                  _iterator['return']();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }

            return toReturn;
          }
        }]);

        return TraceService;
      })();

      _export('TraceService', TraceService);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRyYWNlU2VydmljZS90cmFjZVNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O2VBRWEsWUFBWTs7Ozs7Ozs7Ozs7QUFBWixrQkFBWTtBQUVWLGlCQUZGLFlBQVksR0FFUDtnQ0FGTCxZQUFZOztBQUdqQixjQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztTQUMxQjs7cUJBSlEsWUFBWTs7aUJBTWIsa0JBQUMsSUFBSSxFQUFFO0FBQ1gsZ0JBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDOztBQUVwRCxnQkFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDOzs7Ozs7O0FBRWxCLG1DQUFnQixNQUFNLENBQUMsSUFBSSw4SEFBRTtvQkFBckIsSUFBSTs7QUFDWixvQkFBRyxJQUFJLENBQUMsSUFBSSxLQUFLLHFCQUFxQixFQUFFO0FBQ3RDLHNCQUFJLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQzs7QUFFckMsc0JBQUcsSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7QUFDMUIsd0JBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztBQUNoRCx3QkFBSSxPQUFPLFVBQVEsWUFBWSxVQUFLLElBQUksQ0FBQyxLQUFLLE9BQUksQ0FBQzs7QUFFbkQsNEJBQVEsQ0FBQyxJQUFJLENBQUM7QUFDWiw4QkFBUSxFQUFFO0FBQ1IsMkJBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQztBQUM1QiwyQkFBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUc7dUJBQ3hCO0FBQ0QsNkJBQU8sRUFBRSxPQUFPO3FCQUNqQixDQUFDLENBQUM7bUJBQ0o7aUJBQ0Y7ZUFDRjs7Ozs7Ozs7Ozs7Ozs7OztBQUVELG1CQUFPLFFBQVEsQ0FBQztXQUNqQjs7O2VBL0JRLFlBQVkiLCJmaWxlIjoidHJhY2VTZXJ2aWNlL3RyYWNlU2VydmljZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBlc3ByaW1hIGZyb20gJ2VzcHJpbWEnO1xuXG5leHBvcnQgY2xhc3MgVHJhY2VTZXJ2aWNlIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmVzcHJpbWEgPSBlc3ByaW1hO1xuICAgIH1cblxuICAgIGdldFRyYWNlKGNvZGUpIHtcbiAgICAgICAgbGV0IHN5bnRheCA9IHRoaXMuZXNwcmltYS5wYXJzZShjb2RlLCB7IGxvYzogdHJ1ZX0pO1xuICAgICAgICBcbiAgICAgICAgbGV0IHRvUmV0dXJuID0gW107XG4gICAgICAgIFxuICAgICAgICBmb3IobGV0IG5vZGUgb2Ygc3ludGF4LmJvZHkpIHtcbiAgICAgICAgaWYobm9kZS50eXBlID09PSAnVmFyaWFibGVEZWNsYXJhdGlvbicpIHtcbiAgICAgICAgICBsZXQgaW5pdCA9IG5vZGUuZGVjbGFyYXRpb25zWzBdLmluaXQ7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYoaW5pdC50eXBlID09PSAnTGl0ZXJhbCcpIHtcbiAgICAgICAgICAgIGxldCB2YXJpYWJsZU5hbWUgPSBub2RlLmRlY2xhcmF0aW9uc1swXS5pZC5uYW1lO1xuICAgICAgICAgICAgbGV0IGNvbnRlbnQgPSBgeyAke3ZhcmlhYmxlTmFtZX06ICR7aW5pdC52YWx1ZX0gfWA7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRvUmV0dXJuLnB1c2goe1xuICAgICAgICAgICAgICBsb2NhdGlvbjoge1xuICAgICAgICAgICAgICAgIHJvdzogaW5pdC5sb2Muc3RhcnQubGluZSAtIDEsXG4gICAgICAgICAgICAgICAgY29sOiBpbml0LmxvYy5zdGFydC5jb2xcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgY29udGVudDogY29udGVudFxuICAgICAgICAgICAgfSk7ICBcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgcmV0dXJuIHRvUmV0dXJuO1xuICAgIH1cbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
