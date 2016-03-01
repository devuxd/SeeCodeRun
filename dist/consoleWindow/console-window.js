System.register(['aurelia-framework', 'aurelia-event-aggregator'], function (_export) {
    'use strict';

    var inject, EventAggregator, ConsoleWindow;

    var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

    return {
        setters: [function (_aureliaFramework) {
            inject = _aureliaFramework.inject;
        }, function (_aureliaEventAggregator) {
            EventAggregator = _aureliaEventAggregator.EventAggregator;
        }],
        execute: function () {
            ConsoleWindow = (function () {
                function ConsoleWindow(eventAggregator) {
                    _classCallCheck(this, _ConsoleWindow);

                    this.eventAggregator = eventAggregator;
                    this.title = 'Console';
                }

                _createClass(ConsoleWindow, [{
                    key: 'attached',
                    value: function attached() {
                        var logger = console.log;
                        var log = [];

                        console.log = function () {
                            log.push(Array.prototype.slice.call(arguments));
                            logger.apply(this, Array.prototype.slice.call(arguments));
                        };

                        this.log = log;
                    }
                }]);

                var _ConsoleWindow = ConsoleWindow;
                ConsoleWindow = inject(EventAggregator)(ConsoleWindow) || ConsoleWindow;
                return ConsoleWindow;
            })();

            _export('ConsoleWindow', ConsoleWindow);
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbnNvbGVXaW5kb3cvY29uc29sZS13aW5kb3cuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O2lDQUlhLGFBQWE7Ozs7Ozs7O3VDQUpsQixNQUFNOztzREFDTixlQUFlOzs7QUFHVix5QkFBYTtBQUVYLHlCQUZGLGFBQWEsQ0FFVixlQUFlLEVBQUU7OztBQUN6Qix3QkFBSSxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7QUFDdkMsd0JBQUksQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO2lCQUMxQjs7NkJBTFEsYUFBYTs7MkJBT2Qsb0JBQUc7QUFDUCw0QkFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztBQUN6Qiw0QkFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDOztBQUViLCtCQUFPLENBQUMsR0FBRyxHQUFHLFlBQVk7QUFDdEIsK0JBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDakQsa0NBQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO3lCQUM3RCxDQUFDOztBQUVGLDRCQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztxQkFDakI7OztxQ0FqQlEsYUFBYTtBQUFiLDZCQUFhLEdBRHpCLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FDWCxhQUFhLEtBQWIsYUFBYTt1QkFBYixhQUFhIiwiZmlsZSI6ImNvbnNvbGVXaW5kb3cvY29uc29sZS13aW5kb3cuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2luamVjdH0gZnJvbSAnYXVyZWxpYS1mcmFtZXdvcmsnO1xuaW1wb3J0IHtFdmVudEFnZ3JlZ2F0b3J9IGZyb20gJ2F1cmVsaWEtZXZlbnQtYWdncmVnYXRvcic7XG5cbkBpbmplY3QoRXZlbnRBZ2dyZWdhdG9yKVxuZXhwb3J0IGNsYXNzIENvbnNvbGVXaW5kb3cge1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKGV2ZW50QWdncmVnYXRvcikge1xuICAgICAgICB0aGlzLmV2ZW50QWdncmVnYXRvciA9IGV2ZW50QWdncmVnYXRvcjtcbiAgICAgICAgdGhpcy50aXRsZSA9ICdDb25zb2xlJztcbiAgICB9XG4gICAgXG4gICAgYXR0YWNoZWQoKSB7XG4gICAgICAgIGxldCBsb2dnZXIgPSBjb25zb2xlLmxvZztcbiAgICAgICAgbGV0IGxvZyA9IFtdO1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsb2cucHVzaChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcbiAgXHQgICAgICAgIGxvZ2dlci5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcbiAgXHQgICAgfTtcbiAgXHQgICAgXG4gIFx0ICAgIHRoaXMubG9nID0gbG9nO1xuICAgIH1cbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
