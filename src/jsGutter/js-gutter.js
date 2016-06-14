/* global $ */

export class JsGutter {
    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
        this.selectedLine = '';
    }

    attached() {
        this.$gutter = $('#gutter');
        this.$gutter.css("height",`${$('#codeContent').height()}px`);
        this.subscribe();
    }

    subscribe() {
        let ea = this.eventAggregator;
        let $gutter= this.$gutter;

        $gutter.scroll(function scroll(e) {
                let info = {
                    top: e.target.scrollTop
                };
                ea.publish('onScrolled', info);
            }
        );
        
        ea.subscribe("jsEditorResize", jsEditorLayout => {
           $gutter.css("height",`${$('#codeContent').height()}px`);
        });
        ea.subscribe('onCursorMoved', info => {

            let last$LineNumber = this.getLast$LineNumber();
            this.selectedLine = info.cursor ||1;
            let lastline = info.lastVisibleRow;
            let $lastLine = $gutter.find('#line' + lastline);

            if ($lastLine || $lastLine.length < 1) {
                this.createLine(lastline);
            }
            if (lastline < last$LineNumber) {
                this.removeLine(lastline, last$LineNumber);
            }

            $gutter.find("#line" + this.selectedLine).removeClass("highlight_gutter");
            $gutter.find("#line" + this.selectedLine).addClass("highlight_gutter");

            this.LastVisibleRow = info.lastVisibleRow;

            this.highlightLine(this.selectedLine, lastline);
        });

        ea.subscribe("traceChanged", payload => {
            let traceHelper = payload.data;
            this.updateGutter(traceHelper.getValues());
        });
        
        ea.subscribe("jsEditorchangeScrollTop", payload => {
            let scrollTop = payload.top;
            this.$gutter.scrollTop(scrollTop);
        });
    }

    updateGutter(values) {
        this.clearGutter();
        for (let value of values) {
            this.setGutterLineContent(value.range.start.row + 1, value.id + " = " + value.value);
        }
        this.eventAggregator.publish("jsGutterUpdated", {data:values});
    }

    setGutterLineContent(line, contents) {
        let $line = this.$gutter.find("#line" + line);
        if (!($line && $line.length)) {
            this.createLine(line);
            $line = this.$gutter.find("#line" + line);
        }
        $line.append(" [ " + contents + " ] ");
    }

    createLine(line) {
        let self =this;
        let indexOfDiv = this.getLast$LineNumber();
        for (indexOfDiv; indexOfDiv <= line; indexOfDiv++) {
            this.$gutter.append("<div id = line" + indexOfDiv + "></div>");
            let $newLine = this.$gutter.find("#line" + indexOfDiv);
            $newLine.addClass("line_height");
            $newLine.click( () =>{
                    let row = indexOfDiv -1;
                    self.eventAggregator.publish("jsGutterLineClick", row);
                }
            );
        }
    }
    
    getLast$LineNumber() {
        let indexOfDiv = 1;
        let $lineDiv = null;
        do {
            $lineDiv = this.$gutter.find('#line' + indexOfDiv);
        } while ($lineDiv && $lineDiv.length != 0 && ++indexOfDiv);
        
        return indexOfDiv;
    }
    
    removeLine(lastline, lastDiv) {
        while (lastline < lastDiv) {
            let $toRemove = this.$gutter.find('#line' + lastDiv);
            if($toRemove && $toRemove.length > 0){
                $toRemove.remove();
            }
            lastDiv--;
        }
    }
    
    highlightLine(line, lastline) {

        let lastDiv = this.getLast$LineNumber();
        if (this.$gutter.find('#line' + lastline).length < 1) {
            this.createLine(lastline);
        }
        if (lastline < lastDiv) {
            this.removeLine(lastline, lastDiv);
        }

        this.$gutter.find(".line_height").removeClass("highlight_gutter");
        this.$gutter.find("#line" + line).addClass("highlight_gutter");
        this.selectedLine = line;
    }

    clearGutter() {
        let lines = this.getLast$LineNumber();
        while (lines > 0) {
            this.$gutter.find("#line" + lines).html('');
            lines--;
        }
    }
}
