System.register(['aurelia-framework', 'aurelia-event-aggregator', 'aurelia-router', '../jsEditor/js-editor', '../jsGutter/js-gutter', '../consoleWindow/console-window'], function (_export) {
  'use strict';

  var inject, EventAggregator, Router, JsEditor, JsGutter, ConsoleWindow, Pastebin;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_aureliaFramework) {
      inject = _aureliaFramework.inject;
    }, function (_aureliaEventAggregator) {
      EventAggregator = _aureliaEventAggregator.EventAggregator;
    }, function (_aureliaRouter) {
      Router = _aureliaRouter.Router;
    }, function (_jsEditorJsEditor) {
      JsEditor = _jsEditorJsEditor.JsEditor;
    }, function (_jsGutterJsGutter) {
      JsGutter = _jsGutterJsGutter.JsGutter;
    }, function (_consoleWindowConsoleWindow) {
      ConsoleWindow = _consoleWindowConsoleWindow.ConsoleWindow;
    }],
    execute: function () {
      Pastebin = (function () {
        function Pastebin(eventAggregator, router, jsEditor, jsGutter, consoleWindow) {
          _classCallCheck(this, _Pastebin);

          this.eventAggregator = eventAggregator;
          this.router = router;
          this.heading = 'Pastebin';
          this.jsEditor = jsEditor;
          this.jsGutter = jsGutter;
          this.consoleWindow = consoleWindow;
        }

        _createClass(Pastebin, [{
          key: 'activate',
          value: function activate(params) {
            if (params.id) {
              var id = params.id;
              this.pastebinId = id;
              this.jsEditor.activate({ id: id });
            } else {
              var baseURL = 'https://seecoderun.firebaseio.com';
              var firebase = new Firebase(baseURL);

              var id = firebase.push().key();
              this.router.navigateToRoute('pastebin', { id: id });
            }

            this.subscribe();
          }
        }, {
          key: 'attached',
          value: function attached() {
            this.jsEditor.attached();
            this.jsGutter.attached();
            this.consoleWindow.attached();
          }
        }, {
          key: 'subscribe',
          value: function subscribe() {
            var ea = this.eventAggregator;

            ea.subscribe('onEditorChanged', function (payload) {});

            ea.subscribe('onCursorMoved', function (payload) {});
          }
        }]);

        var _Pastebin = Pastebin;
        Pastebin = inject(EventAggregator, Router, JsEditor, JsGutter, ConsoleWindow)(Pastebin) || Pastebin;
        return Pastebin;
      })();

      _export('Pastebin', Pastebin);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhc3RlYmluL3Bhc3RlYmluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OzswRUFRYSxRQUFROzs7Ozs7OztpQ0FSYixNQUFNOztnREFDTixlQUFlOzs4QkFDZixNQUFNOzttQ0FDTixRQUFROzttQ0FDUixRQUFROztrREFDUixhQUFhOzs7QUFHUixjQUFRO0FBRVIsaUJBRkEsUUFBUSxDQUVQLGVBQWUsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUU7OztBQUN0RSxjQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztBQUN2QyxjQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztBQUNyQixjQUFJLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQztBQUMxQixjQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUN6QixjQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUN6QixjQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztTQUNwQzs7cUJBVFUsUUFBUTs7aUJBV1gsa0JBQUMsTUFBTSxFQUFFO0FBQ2YsZ0JBQUksTUFBTSxDQUFDLEVBQUUsRUFBRTtBQUNiLGtCQUFJLEVBQUUsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDO0FBQ25CLGtCQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztBQUNyQixrQkFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQzthQUNwQyxNQUFNO0FBQ0wsa0JBQUksT0FBTyxHQUFHLG1DQUFtQyxDQUFDO0FBQ2xELGtCQUFJLFFBQVEsR0FBRyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQzs7QUFFckMsa0JBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMvQixrQkFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDckQ7O0FBRUQsZ0JBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztXQUNsQjs7O2lCQUVPLG9CQUFHO0FBQ1QsZ0JBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDekIsZ0JBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDekIsZ0JBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLENBQUM7V0FDL0I7OztpQkFFUSxxQkFBRztBQUNWLGdCQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDOztBQUU5QixjQUFFLENBQUMsU0FBUyxDQUFDLGlCQUFpQixFQUFFLFVBQUEsT0FBTyxFQUFJLEVBRTFDLENBQUMsQ0FBQzs7QUFFSCxjQUFFLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxVQUFBLE9BQU8sRUFBSSxFQUV4QyxDQUFDLENBQUM7V0FDSjs7O3dCQTNDVSxRQUFRO0FBQVIsZ0JBQVEsR0FEcEIsTUFBTSxDQUFDLGVBQWUsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxhQUFhLENBQUMsQ0FDdEQsUUFBUSxLQUFSLFFBQVE7ZUFBUixRQUFRIiwiZmlsZSI6InBhc3RlYmluL3Bhc3RlYmluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtpbmplY3R9IGZyb20gJ2F1cmVsaWEtZnJhbWV3b3JrJztcbmltcG9ydCB7RXZlbnRBZ2dyZWdhdG9yfSBmcm9tICdhdXJlbGlhLWV2ZW50LWFnZ3JlZ2F0b3InO1xuaW1wb3J0IHtSb3V0ZXJ9IGZyb20gJ2F1cmVsaWEtcm91dGVyJztcbmltcG9ydCB7SnNFZGl0b3J9IGZyb20gJy4uL2pzRWRpdG9yL2pzLWVkaXRvcic7XG5pbXBvcnQge0pzR3V0dGVyfSBmcm9tICcuLi9qc0d1dHRlci9qcy1ndXR0ZXInO1xuaW1wb3J0IHtDb25zb2xlV2luZG93fSBmcm9tICcuLi9jb25zb2xlV2luZG93L2NvbnNvbGUtd2luZG93JztcblxuQGluamVjdChFdmVudEFnZ3JlZ2F0b3IsIFJvdXRlciwgSnNFZGl0b3IsIEpzR3V0dGVyLCBDb25zb2xlV2luZG93KVxuZXhwb3J0IGNsYXNzIFBhc3RlYmluIHtcblxuICBjb25zdHJ1Y3RvcihldmVudEFnZ3JlZ2F0b3IsIHJvdXRlciwganNFZGl0b3IsIGpzR3V0dGVyLCBjb25zb2xlV2luZG93KSB7XG4gICAgdGhpcy5ldmVudEFnZ3JlZ2F0b3IgPSBldmVudEFnZ3JlZ2F0b3I7XG4gICAgdGhpcy5yb3V0ZXIgPSByb3V0ZXI7XG4gICAgdGhpcy5oZWFkaW5nID0gJ1Bhc3RlYmluJztcbiAgICB0aGlzLmpzRWRpdG9yID0ganNFZGl0b3I7XG4gICAgdGhpcy5qc0d1dHRlciA9IGpzR3V0dGVyO1xuICAgIHRoaXMuY29uc29sZVdpbmRvdyA9IGNvbnNvbGVXaW5kb3c7XG4gIH1cblxuICBhY3RpdmF0ZShwYXJhbXMpIHtcbiAgICBpZiAocGFyYW1zLmlkKSB7XG4gICAgICBsZXQgaWQgPSBwYXJhbXMuaWQ7XG4gICAgICB0aGlzLnBhc3RlYmluSWQgPSBpZDtcbiAgICAgIHRoaXMuanNFZGl0b3IuYWN0aXZhdGUoeyBpZDogaWQgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBiYXNlVVJMID0gJ2h0dHBzOi8vc2VlY29kZXJ1bi5maXJlYmFzZWlvLmNvbSc7XG4gICAgICBsZXQgZmlyZWJhc2UgPSBuZXcgRmlyZWJhc2UoYmFzZVVSTCk7XG4gICAgICBcbiAgICAgIGxldCBpZCA9IGZpcmViYXNlLnB1c2goKS5rZXkoKTtcbiAgICAgIHRoaXMucm91dGVyLm5hdmlnYXRlVG9Sb3V0ZSgncGFzdGViaW4nLCB7IGlkOiBpZCB9KTtcbiAgICB9XG4gICAgXG4gICAgdGhpcy5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIGF0dGFjaGVkKCkge1xuICAgIHRoaXMuanNFZGl0b3IuYXR0YWNoZWQoKTtcbiAgICB0aGlzLmpzR3V0dGVyLmF0dGFjaGVkKCk7XG4gICAgdGhpcy5jb25zb2xlV2luZG93LmF0dGFjaGVkKCk7XG4gIH1cblxuICBzdWJzY3JpYmUoKSB7XG4gICAgbGV0IGVhID0gdGhpcy5ldmVudEFnZ3JlZ2F0b3I7XG4gICAgXG4gICAgZWEuc3Vic2NyaWJlKCdvbkVkaXRvckNoYW5nZWQnLCBwYXlsb2FkID0+IHtcbiAgICAgIC8vIGFkZCBjb2RlIGZvciBzdWJzY3JpYmUgZXZlbnRcbiAgICB9KTtcblxuICAgIGVhLnN1YnNjcmliZSgnb25DdXJzb3JNb3ZlZCcsIHBheWxvYWQgPT4ge1xuICAgICAgLy8gYWRkIGNvZGUgZm9yIHN1YnNjcmliZSBldmVudFxuICAgIH0pO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
