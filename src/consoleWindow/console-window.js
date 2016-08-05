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
     }

     mouseOver(range){
          let data  = JSON.parse(range);
          if(data.indexInTimeline !== null)
          this.eventAggregator.publish("expressionDataExplorerShowTooltip", data);
     }

     mouseOut(range){
          let data  = JSON.parse(range);
          if(data.indexInTimeline !== null)
          this.eventAggregator.publish("expressionDataExplorerHideTooltip", data);
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
        this.log.push({styleClass: this.styleConsoleWindowErrorMessage, content: this.prettifyConsoleLine(htmlViewerWindowError.arguments, true), range: htmlViewerWindowError.aceErrorRange});
        // console.log(JSON.stringify(htmlViewerWindowError.arguments));
        this.update();
      });

      ea.subscribe('htmlViewerConsoleLog', htmlViewerConsoleLog => {
        this.log.push({styleClass: this.styleConsoleWindowLogMessage,content: this.prettifyConsoleLine(htmlViewerConsoleLog.arguments), range: htmlViewerConsoleLog.aceLogRange});
        this.update();
        console.log.apply(htmlViewerConsoleLog.this, htmlViewerConsoleLog.arguments);
      });

      ea.subscribe('traceChanged', payload => {
        // this.log.push({styleClass: this.styleConsoleWindowTraceMessage, content: this.prettifyConsoleLine(payload.data.description)});
        this.update();
      });

    }

    prettifyConsoleLine(jsObject, isError){
      let onClick = `$('.${this.styleConsoleWindowTextCompactOverflow}').click( function consoleWindowTextCompactOverflowClick(){
      	$(this).toggleClass('${this.styleConsoleWindowTextLooseOverflow}');
      })`;
      return `<pre class="${this.styleConsoleWindowJSONPrettyPrint} ${this.styleConsoleWindowTextCompactOverflow}" onclick = "${onClick}">
        ${isError? jsObject:this.makeArgumentsString(jsObject)}
      </pre>`;
    }

    makeArgumentsString(jsObject){
      if(jsObject == null){
        return "null";
      }
      return Array.prototype.slice.call(jsObject, 1);
    }
}
