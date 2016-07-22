/* global $ */
import {bindable} from 'aurelia-framework';

export class JsGutter {
    aceEditorFontSize = null;
    gutterFontFamily = null;
    aceEditorToGutterFontSizeScale = 0.85;
    aceJsEditorDiv = "";
    @bindable jsGutterDiv = "jsGutterDiv";
    jsGutterBlurClass = "js-gutter-blur";
    jsGutterInvalidClass = "js-gutter-invalid";
    jsGutterLineIdPrefix = "jsGutterLine";
    jsGutterLineSelectorPrefix = "#jsGutterLine";
    jsGutterLineClass = "js-gutter-line";
    jsGutterLineClassSelector = ".js-gutter-line";
    jsGutterLineHighlightClass = "js-gutter-line-highlight";
    jsGutterLineHighlightClassSelector = ".js-gutter-line-highlight";
    editorLayout = null;
    selectedLine = '';
    $gutter = null;
    lastLine = 0;
    isTraceServiceProccesing =false;
    isTraceChange = false;
    traceHelper = null;
    scrollTop = 0;

    constructor(eventAggregator, aceUtils, aceJsEditorDiv = "aceJsEditorDiv") {
        this.eventAggregator = eventAggregator;
        this.aceUtils = aceUtils;
        this.aceJsEditorDiv = aceJsEditorDiv;
    }

    adjustFontStyle(aceJsEditorDiv = this.aceJsEditorDiv){
        let $editorDiv =$(`#${aceJsEditorDiv}`);
        let aceEditorFontSize = $editorDiv.css("font-size");
        if(this.aceEditorFontSize  !== aceEditorFontSize){
            this.aceEditorFontSize  = aceEditorFontSize;
            this.gutterFontSize = aceEditorFontSize;
            this.gutterFontFamily = $editorDiv.css("font-family");
            try{
                let fontNumber = parseFloat(this.gutterFontSize.replace(/px/i, ""));
                this.gutterFontSize = String(Math.round(fontNumber * this.aceEditorToGutterFontSizeScale * 10) / 10) + "px";
            }catch(e){
                //ignore font size adjustment
            }
        }
    }

    update(editorLayout = this.editorLayout){
        let self = this;
        if(!editorLayout){
            return;
        }

        this.adjustFontStyle();
        let $jsGutterLineClass =$(this.jsGutterLineClassSelector);
        if($jsGutterLineClass.length){
            let $jsGutterLineHighlightClass = $(this.jsGutterLineHighlightClassSelector);

            $jsGutterLineClass.css("font-size", this.gutterFontSize);
            $jsGutterLineClass.css("font-family", this.gutterFontFamily);

            $jsGutterLineHighlightClass.css("font-size", this.gutterFontSize);
            $jsGutterLineHighlightClass.css("font-family", this.gutterFontFamily);

        }

        let firstLineNumber = editorLayout.firstLineNumber;

        self.lastLine = firstLineNumber + editorLayout.lastRow;
        self.cleanGutter();

        let $previousLine = undefined;
        let currentLine = 0;
        for(let line = editorLayout.firstRow; line <= editorLayout.lastRow; line++){
            currentLine = firstLineNumber + line;
            let newLineId = self.jsGutterLineIdPrefix + currentLine;
            let newLineSelector =  self.jsGutterLineSelectorPrefix + currentLine;
            let $newLine = $(newLineSelector);
            if(!$newLine.length){
                if($previousLine){
                    $("<li id = '" + newLineId + "'></li>").insertAfter($previousLine);
                }else{
                    self.$gutter.append("<li id = '" + newLineId + "'></li>");
                }
                $newLine = $(newLineSelector);
                $newLine.addClass(self.jsGutterLineClass);
                let lineNumber = currentLine;
                $newLine.click( function(event){
                    self.eventAggregator.publish("jsGutterLineClick", lineNumber);
                });
            }
          $newLine.css("height", editorLayout.getRowHeight(line));
          $previousLine = $newLine;
        }

        if(self.isTraceChange && self.traceHelper && editorLayout.lastRow){
            self.isTraceChange = false;
            if(self.traceHelper.isValid()){
                let entries = self.traceHelper.getTimeline();
                let isAppendToContent = true;
                if(self.traceHelper.isNavigationMode){
                    entries = self.traceHelper.getNavigationTimeline();
                    isAppendToContent = false;
                }
                for (let entry of entries) {
                    self.setGutterLineContent(entry, isAppendToContent);
                }
                self.eventAggregator.publish("jsGutterContentUpdate", {data: entries});
            }
            self.isTraceServiceProccesing = false;
        }

        if(self.isTraceServiceProccesing){
            self.$gutter.addClass(self.jsGutterBlurClass);
        }else{
            self.$gutter.removeClass(self.jsGutterBlurClass);
            if(self.traceHelper && self.traceHelper.isValid()){
                self.$gutter.removeClass(self.jsGutterInvalidClass);
            }else{
                if(editorLayout.lastRow){
                    self.$gutter.addClass(self.jsGutterInvalidClass);
                }
            }
        }
        self.$gutter.scrollTop(self.scrollTop);
    }

    attached() {
        this.$gutter = $(`#${this.jsGutterDiv}`);
        this.subscribe();
    }

    scrollHandler(event) {
        if (event && event.target){
            let scrollData = {
               scrollTop: event.target.scrollTop
            };

            if(this.eventAggregator){
                this.eventAggregator.publish('jsGutterChangeScrollTop', scrollData);
            }
        }
    }

    subscribe() {
        let self = this;
        let $gutter= this.$gutter;
        let ea = this.eventAggregator;

        ea.subscribe("windowResize", layout =>{
            $gutter.height(layout.editorHeight);
            self.update();
          }
        );

        ea.subscribe("jsEditorPreChange", editorLayout => {
            this.isTraceServiceProccesing = true;
            this.editorLayout = editorLayout;
            // this.clearGutter(); // too distracting
            this.update();
        });

        ea.subscribe("jsEditorAfterRender", editorLayout => {
            this.editorLayout = editorLayout;
            this.update();
        });

        ea.subscribe("jsEditorResize", editorLayout => {
            this.editorLayout = editorLayout;
            this.update();
        });
        ea.subscribe('onCursorMoved', info => {
            this.selectedLine = info.cursor ||1;
            this.highlightLine(this.selectedLine);
        });

        ea.subscribe("traceChanged", payload => {
            this.isTraceChange = true;
            this.traceHelper = payload.data;
            this.clearGutter();
            this.update();
        });

        ea.subscribe("jsEditorChangeScrollTop", scrollData => {
                this.scrollTop = scrollData.scrollTop;
                this.scrollerHeight = scrollData.scrollerHeight;
                // $gutter.scrollerHeight(this.scrollerHeight);
                $gutter.scrollTop(this.scrollTop);
        });

        ea.subscribe("traceNavigationChange", traceHelper => {
                if(traceHelper){
                    this.traceHelper = traceHelper;
                    this.clearGutter();
                    this.isTraceChange=true;
                    this.update();
                    // this.traceHelper.stopNavigation();
                }

        });
    }

    setGutterLineContent(entry, isAppendToContent) {
        let firstLineNumber = this.editorLayout? this.editorLayout.firstLineNumber: 1;
        let line = entry.range.start.row + firstLineNumber;
        let content = entry.id + " = " + entry.value;
        let $line = $(this.jsGutterLineSelectorPrefix + line);

        if ($line.length) {

            if(["Literal", "BlockStatement", "Program"].indexOf(entry.type) > -1){
                // $line.text("");
                return;
            }

            if(isAppendToContent){
                $line.append("[" + content + "] ");
            }else{
                let entryId = this.aceUtils.parseRangeString(entry.range);
                let lineEntrySelector = this.jsGutterLineSelectorPrefix + line + "-"+ entryId;
                let $lineEntry = $(lineEntrySelector);
                if($lineEntry.length){
                    $lineEntry.text("[" + content + "]");
                }else{
                    let lineEntryId = this.jsGutterLineIdPrefix + line + "-"+ entryId;
                    $line.prepend("<strong id = '"+lineEntryId+"'></strong>");
                    $lineEntry = $(lineEntrySelector);
                }
                $lineEntry.text("[" + content + "]");
            }
        }
    }

    highlightLine(line) {
        this.$gutter.find(this.jsGutterLineClassSelector).removeClass(this.jsGutterLineHighlightClass);
        let $lineToHighLight = $(this.jsGutterLineSelectorPrefix + line);
        if($lineToHighLight.length){
            $lineToHighLight.addClass(this.jsGutterLineHighlightClass);
            this.selectedLine = line;
        }else{
            this.selectedLine = -1;
        }
    }

    clearGutter() {
        this.$gutter.find(this.jsGutterLineClassSelector).html("");
    }

    cleanGutter() {
        let lineNumberToRemove = this.lastLine;
        let $lineToRemove = "";
        do{
           $lineToRemove = $(this.jsGutterLineSelectorPrefix + (++lineNumberToRemove));
        }while($lineToRemove.length && !$lineToRemove.remove());
    }

    removeGutterContent() {
        this.$gutter.find(this.jsGutterLineClassSelector).remove();
    }

}
