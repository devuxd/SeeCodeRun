/* global $ */
import {bindable} from 'aurelia-framework';
import {ObjectViewer} from "../utils/object-viewer";
import {TraceViewUtils} from '../utils/trace-view-utils';

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
    jsGutterEntryClass = "js-gutter-entry";
    jsGutteEntryClassSelector = ".js-gutter-entry";
    editorLayout = null;
    selectedLine = '';
    $gutter = null;
    lastLine = 0;
    isTraceServiceProccesing =false;
    isTraceChange = false;
    scrollTop = 0;

    constructor(eventAggregator, aceUtils, aceJsEditorDiv = "aceJsEditorDiv") {
        this.eventAggregator = eventAggregator;
        this.aceUtils = aceUtils;
        this.aceJsEditorDiv = aceJsEditorDiv;
    }

    setTraceViewModel(traceViewModel){
        this.traceViewModel = traceViewModel;
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

        if(self.isTraceChange && self.traceViewModel && editorLayout.lastRow){
            if(self.traceViewModel.isRepOK()){

            self.isTraceChange = false;
                let entries = self.traceViewModel.branchModel.getTimeline();
                let timeline = self.traceViewModel.traceHelper.getTimeline();

                for ( let indexInTimeline in entries) {
                  if (entries.hasOwnProperty(indexInTimeline)) {
                    let entry = entries[indexInTimeline];
                    self.setGutterLineContent(indexInTimeline, entry, timeline);
                  }
                }
                self.eventAggregator.publish("jsGutterContentUpdate", {data: entries});

            self.isTraceServiceProccesing = false;
            }
        }

        if(self.isTraceServiceProccesing){
            self.$gutter.addClass(self.jsGutterBlurClass);
        }else{
            self.$gutter.removeClass(self.jsGutterBlurClass);
            if(self.traceViewModel && self.traceViewModel.isRepOK()){
                self.$gutter.removeClass(self.jsGutterInvalidClass);
            }else{
                if(editorLayout.lastRow){
                    self.$gutter.addClass(self.jsGutterInvalidClass);
                }
            }
        }
        self.$gutter.scrollTop(self.scrollTop);
        TraceViewUtils.attachExpressionDataExplorerOnHover("right-gutter", this.jsGutteEntryClassSelector,this.eventAggregator);
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
        ea.subscribe("jsEditorCursorMoved", info => {
            this.selectedLine = info.cursor ||1;
            this.highlightLine(this.selectedLine);
        });

        ea.subscribe("jsEditorChangeScrollTop", scrollData => {
                this.scrollTop = scrollData.scrollTop;
                this.scrollerHeight = scrollData.scrollerHeight;
                // $gutter.scrollerHeight(this.scrollerHeight);
                $gutter.scrollTop(this.scrollTop);
        });

        ea.subscribe("traceNavigationChange", traceData => {
            if(traceData.isEditorChange){
                this.clearGutter();
            }
            if(traceData.traceViewModel){
                if(traceData.traceViewModel.branchModel.currentNavigationDatum){
                    console.log("entry", traceData.traceViewModel.branchModel.currentNavigationDatum.entry);
                    this.clearGutter(traceData.traceViewModel.branchModel.currentNavigationDatum.entry.entry.range);
                }
                this.setTraceViewModel(traceData.traceViewModel);
                this.isTraceChange=true;
                this.update();
            }

        });
    }

    setGutterLineContent(indexInTimeline, entry, timeline, isAppendToContent) {
        let firstLineNumber = this.editorLayout? this.editorLayout.firstLineNumber: 1;
        let line = entry.range.start.row + firstLineNumber;
        let readableString = entry.value;

        // let readableStringTitle = this.jsUtils.toReadableString(readableString);
      let currentObjectViewer = new ObjectViewer(readableString);
      readableString = currentObjectViewer.stringifyHMTLString(currentObjectViewer.generateLineViewContent().content);

        let content = entry.id + " = " + readableString;
        let $line = $(this.jsGutterLineSelectorPrefix + line);

        if ($line.length) {

            if(["Literal", "BlockStatement", "Program", "FunctionData"].indexOf(entry.type) > -1){
                // $line.text("");
                return;
            }

            if(isAppendToContent){
                $line.append("[" + content + "] ");
            }else{

                let lineEntrySelector = this.aceUtils.idifyRange(this.jsGutterLineSelectorPrefix + line, entry.range);;
                let $lineEntry = $(lineEntrySelector);
                if(!$lineEntry.length){
                    let lineEntryId = this.aceUtils.idifyRange(this.jsGutterLineIdPrefix  + line, entry.range);;
                    if(entry.type === "Parameter"){
                        $line.append("<div id = '"+lineEntryId+"' class = '"+this.jsGutterEntryClass+"' ></div>");
                    }else{
                        $line.prepend("<div id = '"+lineEntryId+"' class = '"+this.jsGutterEntryClass+"' ></div>");
                    }
                    $lineEntry = $(lineEntrySelector);
                }
                let previousEntry = timeline[$lineEntry.data("itimeline")];
                // console.log("entries", previousEntry !== entry, previousEntry, entry);
                $lineEntry.text("[" + content + "]");
                $lineEntry.data("itimeline", indexInTimeline);
                if(previousEntry && previousEntry.value !== entry.value){
                    this.animateLineEntryChange($lineEntry);
                }
            }
        }
    }

    animateLineEntryChange($lineEntry){
        // $lineEntry.html("[" + content + "]");
        // $lineEntry.prop('title', $lineEntry.text());
        $lineEntry.stop(true).animate( { backgroundColor: '#E7EFF5' }, 250, function(){
            $(this).animate( { backgroundColor: 'transparent' }, 350);
        });
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

    clearGutter(rangeToClear) {
        if(rangeToClear){
            let self = this;
            let isRangeInRange = this.traceViewModel.getTraceHelper().isRangeInRange;
            this.$gutter.find(this.jsGutteEntryClassSelector).each(function (){
                let range = self.aceUtils.parseIdifiedRange($(this).attr('id'));
                if(range && isRangeInRange(range, rangeToClear)){
                    let indexInTimeline = $(this).data("itimeline");
                    $(this).html("");
                    $(this).data("itimeline", indexInTimeline);
                }
            });
        }else{
            this.$gutter.find(this.jsGutterLineClassSelector).html("");
        }
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
