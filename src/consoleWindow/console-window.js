/* global $, PR*/
import {JsUtils} from "../utils/js-utils";

export class ConsoleWindow {
  title = 'Console';
  consoleLogFeedbackSelector = "#consoleLogFeedback";
  scrollerSelector = "#right-splitter-bottom";
  styleConsoleWindowErrorMessage = "console-window-error-message";
  styleConsoleWindowLogMessage = "console-window-log-message";
  styleConsoleWindowTraceMessage = "console-window-trace-message";
  styleConsoleWindowJSONPrettyPrint = "prettyprint lang-js";
  styleConsoleWindowTextCompactOverflow = "text-compact-overflow";
  styleConsoleWindowTextLooseOverflow = "text-loose-overflow";

  constructor(eventAggregator) {
    this.eventAggregator = eventAggregator;
    this.jsUtils = new JsUtils();
  }

  attached() {
    this.log = [];
    this.$consoleLogFeedback = $(this.consoleLogFeedbackSelector);
    this.$scroller = $(this.scrollerSelector);
    this.subscribe();
    this.scrollToBottom();
  }

  scrollToBottom() {
    let self = this;
    if (!self.$consoleLogFeedback.is(":animated")) {
      self.$consoleLogFeedback.css("display", "inline").fadeIn(50, function (event) {
        // PR.prettyPrint();
      }).fadeOut(450, function () {
        self.$scroller.scrollTop(self.$scroller[0].scrollHeight);
        // PR.prettyPrint();
      });
    }
  }

  mouseOver(data) {
    this.eventAggregator.publish("expressionDataExplorerShowTooltip", data);
  }

  mouseOut(data) {
    this.eventAggregator.publish("expressionDataExplorerHideTooltip", data);
  }

  subscribe() {
    let ea = this.eventAggregator;

    ea.subscribe('beforeOutputBuild', payload => {
      this.log = [];
    });

    ea.subscribe('htmlViewerConsoleLog', htmlViewerConsoleLog => {
      if (htmlViewerConsoleLog.arguments && htmlViewerConsoleLog.arguments.length) {
        let logData = null;
        try {
          logData = JSON.parse(htmlViewerConsoleLog.arguments[0]);
        }
        catch (e) {}

        if (logData && logData.type && logData.range) {
          let logstyle = this.styleConsoleWindowLogMessage;
          Array.prototype.shift.apply(htmlViewerConsoleLog.arguments);
          //todo handle dom elements
          let logArguments = htmlViewerConsoleLog.arguments;
          logData.value = logArguments;

          if (logData.type === "error") {
            logstyle = this.styleConsoleWindowErrorMessage;
            // Error arguments: message, source, lineno, colno, error
            logArguments = [logArguments[0], ` at line ${logData.range.start.row + 1}, column ${logData.range.start.column}`];
            logData.value = "";
          }
          this.log.push({
            styleClass: logstyle,
            content: this.prettifyConsoleLine(logArguments),
            data: logData
          });
          this.scrollToBottom();
        }

        if (logData == null || logData.type === "log") {
          console.log.apply(htmlViewerConsoleLog.this, htmlViewerConsoleLog.arguments);
        }
      }
    });

    ea.subscribe('traceChanged', payload => {
      this.scrollToBottom();
    });
  }

  prettifyConsoleLine(consoleArguments) {
    let onClick = `$('.${this.styleConsoleWindowTextCompactOverflow}').click( function consoleWindowTextCompactOverflowClick(){
      	$(this).toggleClass('${this.styleConsoleWindowTextLooseOverflow}');
      })`;
    return `<pre class="${this.styleConsoleWindowJSONPrettyPrint} ${this.styleConsoleWindowTextCompactOverflow}" onclick = "${onClick}">
        ${this.jsUtils.toReadableString(consoleArguments)}
      </pre>`;
  }
}
