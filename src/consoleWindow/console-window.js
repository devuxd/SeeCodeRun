/* global $*/
export class ConsoleWindow {
    title = 'Console';
    consoleLogFeedbackSelector = "#consoleLogFeedback";
    scrollerSelector = "#right-splitter-bottom";
    styleConsoleWindowErrorMessage = "console-window-error-message";
    styleConsoleWindowLogMessage = "console-window-log-message";
    styleConsoleWindowTraceMessage = "console-window-trace-message";
    styleConsoleWindowJSONPrettyPrint = "prettyprint lang-js";
    styleConsoleWindowTextCompactOverflow = "text-compact-overflow";
    styleConsoleWindowTextLooseOverflow  = "text-loose-overflow";
    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
    }

    attached() {
        this.log = [];
        this.$consoleLogFeedback = $(this.consoleLogFeedbackSelector);
        this.$scroller = $(this.scrollerSelector);
        this.subscribe();
        this.update();
    }

    update(){
      let self = this;
      self.$scroller.scrollTop(self.$scroller[0].scrollHeight);
      self.$consoleLogFeedback.css("display", "inline").fadeOut(1000);
      // $(`.${self.styleConsoleWindowTextCompactOverflow}`).click();
     }

    subscribe() {
      // let logger = console.log;
      // self.log.push(Array.prototype.slice.call(arguments));
      //     logger.apply(this, arguments);
      let ea = this.eventAggregator;

      ea.subscribe('beforeOutputBuild', payload => {
        this.log = [];
      });

      ea.subscribe('htmlViewerWindowError', htmlViewerWindowError => {
        this.log.push({styleClass: this.styleConsoleWindowErrorMessage, content: this.prettifyConsoleLine(htmlViewerWindowError.arguments, htmlViewerWindowError.aceErrorRange)});
        // console.log(JSON.stringify(htmlViewerWindowError.arguments));
        this.update();
      });

      ea.subscribe('htmlViewerConsoleLog', htmlViewerConsoleLog => {
        this.log.push({styleClass: this.styleConsoleWindowLogMessage,content: this.prettifyConsoleLine(htmlViewerConsoleLog.arguments, htmlViewerConsoleLog.aceLogRange)});
        this.update();
        console.log.apply(htmlViewerConsoleLog.this, htmlViewerConsoleLog.arguments);
      });

      ea.subscribe('traceChanged', payload => {
        // this.log.push({styleClass: this.styleConsoleWindowTraceMessage, content: this.prettifyConsoleLine(payload.data.description)});
        this.update();
      });

    }

    prettifyConsoleLine(jsObject, aceRange){
      let onClick = `PR.prettyPrint(); $('.${this.styleConsoleWindowTextCompactOverflow}').click( function consoleWindowTextCompactOverflowClick(){
      	$(this).toggleClass('${this.styleConsoleWindowTextLooseOverflow}');
      })`;
      return `<pre class="${this.styleConsoleWindowJSONPrettyPrint} ${this.styleConsoleWindowTextCompactOverflow}" onclick = "${onClick}">
        ${JSON.stringify(jsObject)} , source: ${JSON.stringify(aceRange)}
      </pre>`;
    }
}
