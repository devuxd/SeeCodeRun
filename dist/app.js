System.register([], function (_export) {
  'use strict';

  var App;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [],
    execute: function () {
      App = (function () {
        function App() {
          _classCallCheck(this, App);
        }

        _createClass(App, [{
          key: 'configureRouter',
          value: function configureRouter(config, router) {
            config.title = 'SeeCode.Run';
            config.map([{
              route: ['', '/:id'],
              name: 'pastebin',
              moduleId: 'pastebin/pastebin',
              nav: false,
              title: 'Pastebin'
            }]);

            this.router = router;
          }
        }]);

        return App;
      })();

      _export('App', App);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7TUFBYSxHQUFHOzs7Ozs7Ozs7QUFBSCxTQUFHO2lCQUFILEdBQUc7Z0NBQUgsR0FBRzs7O3FCQUFILEdBQUc7O2lCQUNDLHlCQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUU7QUFDOUIsa0JBQU0sQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFDO0FBQzdCLGtCQUFNLENBQUMsR0FBRyxDQUFDLENBQ1Q7QUFDRSxtQkFBSyxFQUFFLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztBQUNuQixrQkFBSSxFQUFFLFVBQVU7QUFDaEIsc0JBQVEsRUFBRSxtQkFBbUI7QUFDN0IsaUJBQUcsRUFBRSxLQUFLO0FBQ1YsbUJBQUssRUFBRSxVQUFVO2FBQ2xCLENBQ0YsQ0FBQyxDQUFDOztBQUVILGdCQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztXQUN0Qjs7O2VBZFUsR0FBRyIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgQXBwIHtcbiAgY29uZmlndXJlUm91dGVyKGNvbmZpZywgcm91dGVyKSB7XG4gICAgY29uZmlnLnRpdGxlID0gJ1NlZUNvZGUuUnVuJztcbiAgICBjb25maWcubWFwKFtcbiAgICAgIHtcbiAgICAgICAgcm91dGU6IFsnJywgJy86aWQnXSxcbiAgICAgICAgbmFtZTogJ3Bhc3RlYmluJyxcbiAgICAgICAgbW9kdWxlSWQ6ICdwYXN0ZWJpbi9wYXN0ZWJpbicsXG4gICAgICAgIG5hdjogZmFsc2UsXG4gICAgICAgIHRpdGxlOiAnUGFzdGViaW4nXG4gICAgICB9XG4gICAgXSk7XG5cbiAgICB0aGlzLnJvdXRlciA9IHJvdXRlcjtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
