System.register(['aurelia-framework', 'aurelia-event-aggregator', 'aurelia-router', '../traceService/traceService', '../mode-javascript', '../theme-chrome'], function (_export) {
  'use strict';

  var inject, EventAggregator, Router, TraceService, JsEditor;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_aureliaFramework) {
      inject = _aureliaFramework.inject;
    }, function (_aureliaEventAggregator) {
      EventAggregator = _aureliaEventAggregator.EventAggregator;
    }, function (_aureliaRouter) {
      Router = _aureliaRouter.Router;
    }, function (_traceServiceTraceService) {
      TraceService = _traceServiceTraceService.TraceService;
    }, function (_modeJavascript) {}, function (_themeChrome) {}],
    execute: function () {
      JsEditor = (function () {
        function JsEditor(eventAggregator, router) {
          _classCallCheck(this, _JsEditor);

          this.eventAggregator = eventAggregator;
          this.router = router;
          this.hasErrors = false;
        }

        _createClass(JsEditor, [{
          key: 'activate',
          value: function activate(params) {
            if (params.id) {
              this.pastebinId = params.id;
            } else {
              var baseURL = 'https://seecoderun.firebaseio.com';
              var firebase = new Firebase(baseURL);
              var pastebinId = firebase.push().key();
            }
          }
        }, {
          key: 'attached',
          value: function attached() {
            var editor = ace.edit('editorDiv');
            this.configureEditor(editor);

            this.editor = editor;

            var session = editor.getSession();
            this.configureSession(session);
            this.setupSessionEvents(session);

            var selection = editor.getSelection();
            this.setupSelectionEvents(selection);

            this.session = session;
            this.selection = selection;
            this.firepad = this.createFirepad(editor);
            this.subscribe();
          }
        }, {
          key: 'configureEditor',
          value: function configureEditor(editor) {
            editor.setTheme('ace/theme/chrome');
            editor.setShowFoldWidgets(false);
          }
        }, {
          key: 'configureSession',
          value: function configureSession(session) {
            session.setUseWrapMode(true);
            session.setUseWorker(false);
            session.setMode('ace/mode/javascript');
            session.addGutterDecoration(0, 'label label-info');
          }
        }, {
          key: 'setupSessionEvents',
          value: function setupSessionEvents(session) {
            var ea = this.eventAggregator;
            var editor = this.editor;

            session.on('change', onEditorChanged);

            var editorChangedTimeout = undefined;

            function onEditorChanged(e) {
              clearTimeout(editorChangedTimeout);
              editorChangedTimeout = setTimeout(function pub() {
                var syntax = new TraceService().getTrace(editor.getValue());

                ea.publish('onEditorChanged', {
                  data: e,
                  length: session.getLength(),
                  syntax: syntax
                });
              }, 2500);
            }

            this.editorChangedTimeout = editorChangedTimeout;

            session.on('changeAnnotation', onAnnotationChanged);

            function onAnnotationChanged() {
              var annotations = session.getAnnotations();
              for (var key in annotations) {
                if (annotations.hasOwnProperty(key) && annotations[key].type === 'error') {
                  ea.publish('onAnnotationChanged', {
                    hasErrors: true,
                    annotation: annotations[key]
                  });
                }
              }
              ea.publish('onAnnotationChanged', {
                hasErrors: false,
                annotation: null
              });
            }
          }
        }, {
          key: 'setupSelectionEvents',
          value: function setupSelectionEvents(selection) {
            var ea = this.eventAggregator;

            selection.on('changeCursor', onCursorMoved);

            function onCursorMoved(e) {
              ea.publish('onCursorMoved', e);
            }
          }
        }, {
          key: 'createFirepad',
          value: function createFirepad(editor) {
            var baseURL = 'https://seecoderun.firebaseio.com';
            var firebase = new Firebase(baseURL + '/' + this.pastebinId + '/content/js');

            return Firepad.fromACE(firebase, editor, {
              defaultText: 'go(); \n\nfunction go() {\n  var message = "Hello, world.";\n  console.log(message);\n}'
            });
          }
        }, {
          key: 'subscribe',
          value: function subscribe() {
            var ea = this.eventAggregator;
            var hasErrors = this.hasErrors;
            var editor = this.editor;

            ea.subscribe('onEditorChanged', function (payload) {});

            ea.subscribe('onAnnotationChanged', function (payload) {
              hasErrors = payload.hasErrors;

              if (payload.hasErrors) {
                console.log('has errors at: ' + payload.annotation);
              } else {
                console.log('no errors');
              }
            });

            ea.subscribe('onCursorMoved', function (payload) {});
          }
        }]);

        var _JsEditor = JsEditor;
        JsEditor = inject(EventAggregator, Router)(JsEditor) || JsEditor;
        return JsEditor;
      })();

      _export('JsEditor', JsEditor);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,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TSxDQUFDLGVBQWUsRUFBRSxNQUFNLENBQUMsQ0FDbkIsUUFBUSxLQUFSLFFBQVE7ZUFBUixRQUFRIiwiZmlsZSI6ImpzRWRpdG9yL2pzLWVkaXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBGaXJlcGFkICovXG4vKiBnbG9iYWwgRmlyZWJhc2UgKi9cbi8qIGdsb2JhbCBhY2UgKi9cbmltcG9ydCB7aW5qZWN0fSBmcm9tICdhdXJlbGlhLWZyYW1ld29yayc7XG5pbXBvcnQge0V2ZW50QWdncmVnYXRvcn0gZnJvbSAnYXVyZWxpYS1ldmVudC1hZ2dyZWdhdG9yJztcbmltcG9ydCB7Um91dGVyfSBmcm9tICdhdXJlbGlhLXJvdXRlcic7XG5pbXBvcnQge1RyYWNlU2VydmljZX0gZnJvbSAnLi4vdHJhY2VTZXJ2aWNlL3RyYWNlU2VydmljZSc7XG5pbXBvcnQgJy4uL21vZGUtamF2YXNjcmlwdCc7XG5pbXBvcnQgJy4uL3RoZW1lLWNocm9tZSc7XG5cbkBpbmplY3QoRXZlbnRBZ2dyZWdhdG9yLCBSb3V0ZXIpXG5leHBvcnQgY2xhc3MgSnNFZGl0b3Ige1xuXG4gIGNvbnN0cnVjdG9yKGV2ZW50QWdncmVnYXRvciwgcm91dGVyKSB7XG4gICAgdGhpcy5ldmVudEFnZ3JlZ2F0b3IgPSBldmVudEFnZ3JlZ2F0b3I7XG4gICAgdGhpcy5yb3V0ZXIgPSByb3V0ZXI7XG4gICAgdGhpcy5oYXNFcnJvcnMgPSBmYWxzZTtcbiAgfVxuXG4gIGFjdGl2YXRlKHBhcmFtcykge1xuICAgIGlmIChwYXJhbXMuaWQpIHtcbiAgICAgIHRoaXMucGFzdGViaW5JZCA9IHBhcmFtcy5pZDtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGJhc2VVUkwgPSAnaHR0cHM6Ly9zZWVjb2RlcnVuLmZpcmViYXNlaW8uY29tJztcbiAgICAgIGxldCBmaXJlYmFzZSA9IG5ldyBGaXJlYmFzZShiYXNlVVJMKTtcbiAgICAgIGxldCBwYXN0ZWJpbklkID0gZmlyZWJhc2UucHVzaCgpLmtleSgpO1xuICAgIH1cbiAgfVxuXG4gIGF0dGFjaGVkKCkge1xuICAgIGxldCBlZGl0b3IgPSBhY2UuZWRpdCgnZWRpdG9yRGl2Jyk7XG4gICAgdGhpcy5jb25maWd1cmVFZGl0b3IoZWRpdG9yKTtcbiAgICBcbiAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcblxuICAgIGxldCBzZXNzaW9uID0gZWRpdG9yLmdldFNlc3Npb24oKTtcbiAgICB0aGlzLmNvbmZpZ3VyZVNlc3Npb24oc2Vzc2lvbik7XG4gICAgdGhpcy5zZXR1cFNlc3Npb25FdmVudHMoc2Vzc2lvbik7XG5cbiAgICBsZXQgc2VsZWN0aW9uID0gZWRpdG9yLmdldFNlbGVjdGlvbigpO1xuICAgIHRoaXMuc2V0dXBTZWxlY3Rpb25FdmVudHMoc2VsZWN0aW9uKTtcblxuICAgIHRoaXMuc2Vzc2lvbiA9IHNlc3Npb247XG4gICAgdGhpcy5zZWxlY3Rpb24gPSBzZWxlY3Rpb247XG4gICAgdGhpcy5maXJlcGFkID0gdGhpcy5jcmVhdGVGaXJlcGFkKGVkaXRvcik7XG4gICAgdGhpcy5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZUVkaXRvcihlZGl0b3IpIHtcbiAgICBlZGl0b3Iuc2V0VGhlbWUoJ2FjZS90aGVtZS9jaHJvbWUnKTtcbiAgICBlZGl0b3Iuc2V0U2hvd0ZvbGRXaWRnZXRzKGZhbHNlKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZVNlc3Npb24oc2Vzc2lvbikge1xuICAgIHNlc3Npb24uc2V0VXNlV3JhcE1vZGUodHJ1ZSk7XG4gICAgc2Vzc2lvbi5zZXRVc2VXb3JrZXIoZmFsc2UpO1xuICAgIHNlc3Npb24uc2V0TW9kZSgnYWNlL21vZGUvamF2YXNjcmlwdCcpO1xuICAgIHNlc3Npb24uYWRkR3V0dGVyRGVjb3JhdGlvbigwLCAnbGFiZWwgbGFiZWwtaW5mbycpO1xuICB9XG5cbiAgc2V0dXBTZXNzaW9uRXZlbnRzKHNlc3Npb24pIHtcbiAgICBsZXQgZWEgPSB0aGlzLmV2ZW50QWdncmVnYXRvcjtcbiAgICBsZXQgZWRpdG9yID0gdGhpcy5lZGl0b3I7XG5cbiAgICBzZXNzaW9uLm9uKCdjaGFuZ2UnLFxuICAgICAgb25FZGl0b3JDaGFuZ2VkKTtcblxuICAgIGxldCBlZGl0b3JDaGFuZ2VkVGltZW91dDtcbiAgICBcbiAgICBmdW5jdGlvbiBvbkVkaXRvckNoYW5nZWQoZSkge1xuICAgICAgY2xlYXJUaW1lb3V0KGVkaXRvckNoYW5nZWRUaW1lb3V0KTtcbiAgICAgIGVkaXRvckNoYW5nZWRUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiBwdWIoKSB7IFxuICAgICAgICBsZXQgc3ludGF4ID0gbmV3IFRyYWNlU2VydmljZSgpLmdldFRyYWNlKGVkaXRvci5nZXRWYWx1ZSgpKTtcblxuICAgICAgICBlYS5wdWJsaXNoKCdvbkVkaXRvckNoYW5nZWQnLCB7XG4gICAgICAgICAgICBkYXRhOiBlLFxuICAgICAgICAgICAgbGVuZ3RoOiBzZXNzaW9uLmdldExlbmd0aCgpLFxuICAgICAgICAgICAgc3ludGF4OiBzeW50YXhcbiAgICAgICAgfSk7XG4gICAgICB9LCAyNTAwKTtcbiAgICB9XG5cbiAgICB0aGlzLmVkaXRvckNoYW5nZWRUaW1lb3V0ID0gZWRpdG9yQ2hhbmdlZFRpbWVvdXQ7XG5cbiAgICBzZXNzaW9uLm9uKCdjaGFuZ2VBbm5vdGF0aW9uJyxcbiAgICAgIG9uQW5ub3RhdGlvbkNoYW5nZWQpO1xuXG4gICAgZnVuY3Rpb24gb25Bbm5vdGF0aW9uQ2hhbmdlZCgpIHtcbiAgICAgIGxldCBhbm5vdGF0aW9ucyA9IHNlc3Npb24uZ2V0QW5ub3RhdGlvbnMoKTtcbiAgICAgIGZvciAobGV0IGtleSBpbiBhbm5vdGF0aW9ucykge1xuICAgICAgICBpZiAoYW5ub3RhdGlvbnMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBhbm5vdGF0aW9uc1trZXldLnR5cGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICBlYS5wdWJsaXNoKCdvbkFubm90YXRpb25DaGFuZ2VkJywge1xuICAgICAgICAgICAgaGFzRXJyb3JzOiB0cnVlLFxuICAgICAgICAgICAgYW5ub3RhdGlvbjogYW5ub3RhdGlvbnNba2V5XVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlYS5wdWJsaXNoKCdvbkFubm90YXRpb25DaGFuZ2VkJywge1xuICAgICAgICBoYXNFcnJvcnM6IGZhbHNlLFxuICAgICAgICBhbm5vdGF0aW9uOiBudWxsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBzZXR1cFNlbGVjdGlvbkV2ZW50cyhzZWxlY3Rpb24pIHtcbiAgICBsZXQgZWEgPSB0aGlzLmV2ZW50QWdncmVnYXRvcjtcblxuICAgIHNlbGVjdGlvbi5vbignY2hhbmdlQ3Vyc29yJyxcbiAgICAgIG9uQ3Vyc29yTW92ZWQpO1xuXG4gICAgZnVuY3Rpb24gb25DdXJzb3JNb3ZlZChlKSB7XG4gICAgICBlYS5wdWJsaXNoKCdvbkN1cnNvck1vdmVkJywgZSk7XG4gICAgfVxuICB9XG5cbiAgY3JlYXRlRmlyZXBhZChlZGl0b3IpIHtcbiAgICBsZXQgYmFzZVVSTCA9ICdodHRwczovL3NlZWNvZGVydW4uZmlyZWJhc2Vpby5jb20nO1xuICAgIGxldCBmaXJlYmFzZSA9IG5ldyBGaXJlYmFzZShiYXNlVVJMICsgJy8nICsgdGhpcy5wYXN0ZWJpbklkICsgJy9jb250ZW50L2pzJyk7XG5cbiAgICByZXR1cm4gRmlyZXBhZC5mcm9tQUNFKFxuICAgICAgZmlyZWJhc2UsXG4gICAgICBlZGl0b3IsXG4gICAgICB7XG4gICAgICAgIGRlZmF1bHRUZXh0OiAnZ28oKTsgXFxuXFxuZnVuY3Rpb24gZ28oKSB7XFxuICB2YXIgbWVzc2FnZSA9IFwiSGVsbG8sIHdvcmxkLlwiO1xcbiAgY29uc29sZS5sb2cobWVzc2FnZSk7XFxufSdcbiAgICAgIH0pO1xuICB9XG5cbiAgc3Vic2NyaWJlKCkge1xuICAgIGxldCBlYSA9IHRoaXMuZXZlbnRBZ2dyZWdhdG9yO1xuICAgIGxldCBoYXNFcnJvcnMgPSB0aGlzLmhhc0Vycm9ycztcbiAgICBsZXQgZWRpdG9yID0gdGhpcy5lZGl0b3I7XG5cbiAgICBlYS5zdWJzY3JpYmUoJ29uRWRpdG9yQ2hhbmdlZCcsIHBheWxvYWQgPT4ge1xuICAgICAgLy8gYWRkIGNvZGUgaGVyZSBmb3Igc3Vic2NyaWJlIGV2ZW50XG4gICAgfSk7XG5cbiAgICBlYS5zdWJzY3JpYmUoJ29uQW5ub3RhdGlvbkNoYW5nZWQnLCBwYXlsb2FkID0+IHtcbiAgICAgIGhhc0Vycm9ycyA9IHBheWxvYWQuaGFzRXJyb3JzO1xuXG4gICAgICBpZiAocGF5bG9hZC5oYXNFcnJvcnMpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2hhcyBlcnJvcnMgYXQ6ICcgKyBwYXlsb2FkLmFubm90YXRpb24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ25vIGVycm9ycycpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgZWEuc3Vic2NyaWJlKCdvbkN1cnNvck1vdmVkJywgcGF5bG9hZCA9PiB7XG4gICAgICAvLyBhZGQgY29kZSBoZXJlIGZvciBzdWJzY3JpYmUgZXZlbnRcbiAgICB9KTtcbiAgfVxufVxuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
