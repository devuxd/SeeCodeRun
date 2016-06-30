import {TraceService} from '../traceService/trace-service';
import {ExternalResourceLoader}  from '../utils/external-resource-loader';
import {HtmlParser} from '../utils/html-parser';

export class HtmlViewer {
    errors = "";
    html = "";
    css = "";
    js = "";
    constructor(eventAggregator, traceModel) {
        this.eventAggregator = eventAggregator;
        this.traceService = new TraceService(eventAggregator, traceModel);
        this.htmlParser = new HtmlParser();
        this.externalResourceLoader = new ExternalResourceLoader();
        this.div = 'htmlView';
        this.subscribe();
    }

    pushError(errorRef){
      let error = "";
      if(errorRef){
        error = errorRef.toString();
      }
      this.errors = this.errors? this.errors + ", "  + error : error;
    }

    popErrors(){
      let poppedErrors = this.errors;
      this.errors = "";
      return poppedErrors;
    }

    attached() {
      this.addConsoleLogging(this.eventAggregator);
      this.addErrorLogging(this.eventAggregator);
    }

    buildOutput(){
      if(this.js && this.css && this.html){
        this.addCss();
      }
    }

    subscribe() {
      let ea = this.eventAggregator;
      let traceService = this.traceService;

      ea.subscribe('onHtmlEditorChanged', htmlContent => {
        this.html = htmlContent;
        this.buildOutput();
      });

      ea.subscribe('onCssEditorChanged', cssContent => {
        this.css = cssContent;
        this.buildOutput();
      });

      ea.subscribe('jsEditorChange', jsEditorData => {
        let editorText = jsEditorData.js;
        let instrumentationPayload = this.traceService.getInstrumentation(editorText);

        if (traceService.isValid(instrumentationPayload)) {
          this.js = instrumentationPayload.data;
        } else {
          this.js = editorText;
        }

        this.buildOutput();
      });

      ea.subscribe("headJsScriptsLoaded", scriptsData => {
        let scriptTexts = scriptsData.scripts;
        this.addCssScripts(scriptTexts);
      });

      ea.subscribe("bodyJsScriptsLoaded", scriptsData => {
        let scriptTexts = scriptsData.scripts;
        this.addHtmlScripts(scriptTexts);
      });
    }

    addCssScripts(scriptTexts){
      let doc = this.getContentDocument();

      for(let scriptIndex in scriptTexts){
        let scriptText = scriptTexts[scriptIndex];
        let script = doc.createElement('script');
        script.type="text/javascript";
        script.innerHTML=scriptText;
        doc.head.appendChild(script);
      }
      this.addHtml();
    }

    addHtmlScripts(scriptTexts){
      let doc = this.getContentDocument();

      for(let scriptIndex in scriptTexts){
        let scriptText = scriptTexts[scriptIndex];
        let script = doc.createElement('script');
        script.type="text/javascript";
        script.innerHTML=scriptText;
        doc.body.appendChild(script);
      }
      this.addJs();
    }

    addJs() {
      let ea = this.eventAggregator;
      let traceService = this.traceService;
      let traceDataContainer = traceService.traceModel.traceDataContainer;

      let doc = this.getContentDocument();

      let script = doc.createElement('script');
      script.type="text/javascript";
      script.textContent = this.js;

      let result = {error: ""};

      try {
        ea.publish(traceService.executionEvents.running.event);
        doc.body.appendChild(script);

        result = JSON.parse(doc.getElementById(traceDataContainer).innerHTML);

        result.error = this.popErrors();

        ea.publish(
          traceService.executionEvents.finished.event, {
            data: result
        });
      } catch(e) {
        this.pushError(e);

        try {
          result = JSON.parse(doc.getElementById(traceDataContainer).innerHTML);
        } catch (jsonError) {
          if(e.toString() !== jsonError.toString()){
            this.pushError(jsonError);
          }
        }
        result.error = this.popErrors();
        ea.publish(
          traceService.executionEvents.finished.event, {
            data: result
          });
      }
    }

    addCss() {
      let doc = this.getContentDocument();
      let styleElement = doc.createElement('style');
      styleElement.type = 'text/css';
      styleElement.textContent = this.css;

      let newHead = this.htmlParser.parseHtml(this.html).head;
      doc.head.innerHTML = newHead;
      doc.head.appendChild(styleElement);
      let urls = this.htmlParser.parseJsScripts(newHead);
      if(urls && urls.length){
        this.externalResourceLoader.loadJsScripts(urls, this.eventAggregator, "headJsScriptsLoaded");
      }else{
        this.eventAggregator.publish("headJsScriptsLoaded", {scripts:[]});
      }
    }

    addHtml() {
      let doc = this.getContentDocument();

      let newBody = this.htmlParser.parseHtml(this.html).body;
      this.htmlParser.parseJsScripts(newBody);
      doc.body.innerHTML = newBody;
      let urls = this.htmlParser.parseJsScripts(newBody);
      if(urls && urls.length){
       this.externalResourceLoader.loadJsScripts(urls, this.eventAggregator, "bodyJsScriptsLoaded");
      }else{
        this.eventAggregator.publish("bodyJsScriptsLoaded", {scripts:[]});
      }
    }

    getContentDocument() {
      return document.getElementById(this.div)
                     .contentDocument;
    }

    addErrorLogging(eventAggregator) {
      let self = this;
      let ea = eventAggregator;
      let contentWindow = this.getContentWindow();

      contentWindow.onerror = function hmtlViewerWindowOnerror(message) {
        self.pushError(message);
        ea.publish('htmlViewerWindowError', {
          this: this,
          arguments: arguments
        });
      };
    }

    addConsoleLogging(eventAggregator) {
      let ea = eventAggregator;
      let contentWindow = this.getContentWindow();

      contentWindow.console.log = function hmtlViewerConsoleLog() {
        ea.publish('htmlViewerConsoleLog', {
          contentWindow: contentWindow,
          this: this,
          arguments: arguments
        });
	    };
    }

    getContentWindow() {
      return document.getElementById(this.div)
                     .contentWindow;
    }
}