System.register(['aurelia-framework', 'aurelia-event-aggregator', '../mode-javascript', '../theme-chrome'], function (_export) {
  'use strict';

  var inject, EventAggregator, JsGutter;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_aureliaFramework) {
      inject = _aureliaFramework.inject;
    }, function (_aureliaEventAggregator) {
      EventAggregator = _aureliaEventAggregator.EventAggregator;
    }, function (_modeJavascript) {}, function (_themeChrome) {}],
    execute: function () {
      JsGutter = (function () {
        function JsGutter(eventAggregator) {
          _classCallCheck(this, _JsGutter);

          this.eventAggregator = eventAggregator;
        }

        _createClass(JsGutter, [{
          key: 'attached',
          value: function attached() {
            var gutter = ace.edit('gutterDiv');
            this.configureGutter(gutter);

            var session = gutter.getSession();

            this.gutter = gutter;
            this.session = session;
            this.subscribe();
          }
        }, {
          key: 'configureGutter',
          value: function configureGutter(gutter) {
            gutter.setTheme('ace/theme/chrome');
            gutter.setShowFoldWidgets(false);
            gutter.renderer.setShowGutter(false);
            gutter.renderer.$cursorLayer.element.style.display = 'none';
            gutter.setReadOnly(true);
          }
        }, {
          key: 'subscribe',
          value: function subscribe() {
            var ea = this.eventAggregator;
            var session = this.session;

            ea.subscribe('onEditorChanged', function (payload) {
              var doc = session.doc;

              doc.removeLines(0, doc.getLength());

              doc.insertLines(0, new Array(payload.length - 1));

              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                for (var _iterator = payload.syntax[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  var result = _step.value;

                  doc.insertInLine({
                    row: result.location.row,
                    column: result.location.col
                  }, result.content);
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
            });
          }
        }]);

        var _JsGutter = JsGutter;
        JsGutter = inject(EventAggregator)(JsGutter) || JsGutter;
        return JsGutter;
      })();

      _export('JsGutter', JsGutter);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzR3V0dGVyL2pzLWd1dHRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7K0JBU2EsUUFBUTs7Ozs7Ozs7aUNBTmIsTUFBTTs7Z0RBQ04sZUFBZTs7O0FBS1YsY0FBUTtBQUVSLGlCQUZBLFFBQVEsQ0FFUCxlQUFlLEVBQUU7OztBQUMzQixjQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztTQUN4Qzs7cUJBSlUsUUFBUTs7aUJBTVgsb0JBQUc7QUFDVCxnQkFBSSxNQUFNLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNuQyxnQkFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFN0IsZ0JBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQzs7QUFFbEMsZ0JBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0FBQ3JCLGdCQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUN2QixnQkFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1dBQ2xCOzs7aUJBRWMseUJBQUMsTUFBTSxFQUFFO0FBQ3RCLGtCQUFNLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDcEMsa0JBQU0sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQyxrQkFBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDckMsa0JBQU0sQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztBQUM1RCxrQkFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztXQUMxQjs7O2lCQUVRLHFCQUFHO0FBQ1YsZ0JBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7QUFDOUIsZ0JBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7O0FBRTNCLGNBQUUsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLEVBQUUsVUFBQSxPQUFPLEVBQUk7QUFDekMsa0JBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7O0FBRXRCLGlCQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQzs7QUFHcEMsaUJBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Ozs7OztBQUVsRCxxQ0FBa0IsT0FBTyxDQUFDLE1BQU0sOEhBQUU7c0JBQTFCLE1BQU07O0FBQ1oscUJBQUcsQ0FBQyxZQUFZLENBQUM7QUFDZix1QkFBRyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRztBQUN4QiwwQkFBTSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRzttQkFDNUIsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7aUJBQ3BCOzs7Ozs7Ozs7Ozs7Ozs7YUFDRixDQUFDLENBQUM7V0FDSjs7O3dCQTVDVSxRQUFRO0FBQVIsZ0JBQVEsR0FEcEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUNYLFFBQVEsS0FBUixRQUFRO2VBQVIsUUFBUSIsImZpbGUiOiJqc0d1dHRlci9qcy1ndXR0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgRmlyZXBhZCAqL1xuLyogZ2xvYmFsIEZpcmViYXNlICovXG4vKiBnbG9iYWwgYWNlICovXG5pbXBvcnQge2luamVjdH0gZnJvbSAnYXVyZWxpYS1mcmFtZXdvcmsnO1xuaW1wb3J0IHtFdmVudEFnZ3JlZ2F0b3J9IGZyb20gJ2F1cmVsaWEtZXZlbnQtYWdncmVnYXRvcic7XG5pbXBvcnQgJy4uL21vZGUtamF2YXNjcmlwdCc7XG5pbXBvcnQgJy4uL3RoZW1lLWNocm9tZSc7XG5cbkBpbmplY3QoRXZlbnRBZ2dyZWdhdG9yKVxuZXhwb3J0IGNsYXNzIEpzR3V0dGVyIHtcbiAgXG4gIGNvbnN0cnVjdG9yKGV2ZW50QWdncmVnYXRvcikge1xuICAgIHRoaXMuZXZlbnRBZ2dyZWdhdG9yID0gZXZlbnRBZ2dyZWdhdG9yO1xuICB9XG4gIFxuICBhdHRhY2hlZCgpIHtcbiAgICBsZXQgZ3V0dGVyID0gYWNlLmVkaXQoJ2d1dHRlckRpdicpO1xuICAgIHRoaXMuY29uZmlndXJlR3V0dGVyKGd1dHRlcik7XG4gICAgXG4gICAgbGV0IHNlc3Npb24gPSBndXR0ZXIuZ2V0U2Vzc2lvbigpO1xuICAgIFxuICAgIHRoaXMuZ3V0dGVyID0gZ3V0dGVyO1xuICAgIHRoaXMuc2Vzc2lvbiA9IHNlc3Npb247XG4gICAgdGhpcy5zdWJzY3JpYmUoKTtcbiAgfVxuICBcbiAgY29uZmlndXJlR3V0dGVyKGd1dHRlcikge1xuICAgIGd1dHRlci5zZXRUaGVtZSgnYWNlL3RoZW1lL2Nocm9tZScpO1xuICAgIGd1dHRlci5zZXRTaG93Rm9sZFdpZGdldHMoZmFsc2UpO1xuICAgIGd1dHRlci5yZW5kZXJlci5zZXRTaG93R3V0dGVyKGZhbHNlKTtcbiAgICBndXR0ZXIucmVuZGVyZXIuJGN1cnNvckxheWVyLmVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICBndXR0ZXIuc2V0UmVhZE9ubHkodHJ1ZSk7XG4gIH1cbiAgXG4gIHN1YnNjcmliZSgpIHtcbiAgICBsZXQgZWEgPSB0aGlzLmV2ZW50QWdncmVnYXRvcjtcbiAgICBsZXQgc2Vzc2lvbiA9IHRoaXMuc2Vzc2lvbjtcbiAgICBcbiAgICBlYS5zdWJzY3JpYmUoJ29uRWRpdG9yQ2hhbmdlZCcsIHBheWxvYWQgPT4ge1xuICAgICAgbGV0IGRvYyA9IHNlc3Npb24uZG9jO1xuICAgICAgXG4gICAgICBkb2MucmVtb3ZlTGluZXMoMCwgZG9jLmdldExlbmd0aCgpKTtcbiAgICAgIFxuICAgICAgLy8gVE9ETzogZml4IHVuY2F1Z2h0IGxlbmd0aCBlcnJvclxuICAgICAgZG9jLmluc2VydExpbmVzKDAsIG5ldyBBcnJheShwYXlsb2FkLmxlbmd0aCAtIDEpKTtcbiAgICAgIFxuICAgICAgZm9yKGxldCByZXN1bHQgb2YgcGF5bG9hZC5zeW50YXgpIHtcbiAgICAgICAgZG9jLmluc2VydEluTGluZSh7XG4gICAgICAgICAgcm93OiByZXN1bHQubG9jYXRpb24ucm93LFxuICAgICAgICAgIGNvbHVtbjogcmVzdWx0LmxvY2F0aW9uLmNvbFxuICAgICAgICB9LCByZXN1bHQuY29udGVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
