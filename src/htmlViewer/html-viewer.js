/* global $ */
import {TraceService} from '../traceService/trace-service';
import {ExternalResourceLoader}  from '../utils/external-resource-loader';
import {HtmlParser} from '../utils/html-parser';

export class HtmlViewer {
  errors = "";
  errorObjs = [];
  html = "";
  css = "";
  js = "";
  webAppViewerId = 'webAppViewer';
  iFrameSourceUrl = "client/output.html";

  constructor(eventAggregator, traceModel) {
    this.eventAggregator = eventAggregator;
    this.traceService = new TraceService(eventAggregator, traceModel);
    this.htmlParser = new HtmlParser();
    this.externalResourceLoader = new ExternalResourceLoader();
    this.subscribe();
  }

  pushError(errorObj) {
    this.errorObjs.push(errorObj);
  }

  popErrors() {
    let poppedErrors = "";
    if (this.errorObjs.length) {
      poppedErrors = JSON.stringify(this.errorObjs);
      this.errorObjs = [];
    }
    this.errors = "";
    return poppedErrors;
  }

  attached() {
    this.webAppViewer = document.getElementById(this.webAppViewerId);
  }

  buildOutput() {
    if (this.js && this.css && this.html) {
      this.eventAggregator.publish("beforeOutputBuild");
      this.webAppViewer = document.getElementById(this.webAppViewerId);
      let self = this;
      this.webAppViewer.onload = function () {
        self.addConsoleLogging(self.eventAggregator);
        self.addCss();
      };
      this.webAppViewer.src = `${this.iFrameSourceUrl}?cache_cancel=${Math.random() * 100000}`;
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
      let instrumentationPayload = traceService.getInstrumentation(editorText);

      if (traceService.isValid(instrumentationPayload)) {
        this.js = instrumentationPayload.data;
      } else {
        this.js = editorText;
      }
      console.log("Instrumentation", this.js);
      this.buildOutput();
    });

    ea.subscribe("headJsScriptsLoaded", scriptsLoadedData => {
      this.handleResponse("head", scriptsLoadedData.response);

      this.addHtml();
    });

    ea.subscribe("bodyJsScriptsLoaded", scriptsLoadedData => {
      this.handleResponse("body", scriptsLoadedData.response);
      this.addJs();
    });
  }

  handleResponse(elementName, response) {
    let status = {done: "done", fail: "fail"};
    if (response.status === status.fail) {
      for (let responseIndex in response.responses) {
        let details = response.responses[responseIndex];
        if (details.status === status.fail) {
          this.eventAggregator.publish("htmlViewerConsoleLog", {
            type: "error",
            arguments: [elementName + ": download script failed", details]
          });
        }
      }
    }
  }

  addJs() {
    let self = this;
    let ea = this.eventAggregator;
    let traceService = this.traceService;
    let traceDataContainer = traceService.traceModel.traceDataContainer;

    let doc = this.getContentDocument();
    let scriptElement = this.externalResourceLoader.createScriptElement(this.js, doc);
    self.result = {error: ""};

    try {
      ea.publish(traceService.executionEvents.running.event);
      doc.body.appendChild(scriptElement);
      let traceDataContainerElement = doc.getElementById(traceDataContainer);
      self.result = JSON.parse(traceDataContainerElement.textContent);
      traceDataContainerElement.addEventListener("click", function getTraceDataClick() {
        self.result = JSON.parse(traceDataContainerElement.textContent);
        self.result.error = self.popErrors();
        ea.publish(
          traceService.executionEvents.finished.event, {
            data: self.result
          });
      });

      self.result.error = this.popErrors();

      ea.publish(
        traceService.executionEvents.finished.event, {
          data: self.result
        });
    } catch (e) {
      this.pushError(e);

      try {
        self.result = JSON.parse(doc.getElementById(traceDataContainer).textContent);
      } catch (jsonError) {
        if (e.toString() !== jsonError.toString()) {
          this.pushError(jsonError);
        }
      }
      self.result.error = this.popErrors();
      ea.publish(
        traceService.executionEvents.finished.event, {
          data: self.result
        });
    }
  }

  addCss() {
    let doc = this.getContentDocument();
    let styleElement = this.externalResourceLoader.createStyleElement(this.css, doc);

    let parsedHtml = this.htmlParser.parseHtmlRemoveTags(this.html);
    let newHead = parsedHtml.head;
    let newHeadAttributes = parsedHtml.headAttributes;
    doc.head.innerHTML = newHead;
    this.htmlParser.setAttributes($(doc.head), newHeadAttributes);
    doc.head.appendChild(styleElement);
    this.externalResourceLoader.loadAndAttachJsScripts(doc.head, doc, this.eventAggregator, "headJsScriptsLoaded");
  }

  addHtml() {
    let doc = this.getContentDocument();
    let parsedHtml = this.htmlParser.parseHtmlRemoveTags(this.html);
    let newBody = parsedHtml.body;
    let newBodyAttributes = parsedHtml.bodyAttributes;
    doc.body.innerHTML = newBody;
    this.htmlParser.setAttributes($(doc.body), newBodyAttributes);
    this.externalResourceLoader.loadAndAttachJsScripts(doc.body, doc, this.eventAggregator, "bodyJsScriptsLoaded");
  }

  getContentDocument() {
    return document.getElementById(this.webAppViewerId).contentDocument || document.getElementById(this.webAppViewerId).contentWindow.document;
  }

  addConsoleLogging(eventAggregator) {
    let ea = eventAggregator;
    let contentWindow = this.getContentWindow();
    let self = this;
    contentWindow.console.log = function hmtlViewerConsoleLogAndError() {
      // if(arguments[0] === 'CLIENT_OUTPUT'){
      //   self.clientDocument = arguments[1];
      //   arguments[1].getElementById("xx").click();
      //   console.log("got it", arguments[1].getElementById("xx"));
      //
      // }
      ea.publish('htmlViewerConsoleLog', {
        contentWindow: contentWindow,
        this: this,
        arguments: arguments
      });
    };
  }

  getContentWindow() {
    return document.getElementById(this.webAppViewerId).contentWindow;
  }
}
