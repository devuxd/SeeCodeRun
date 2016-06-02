/* global $ */

export class JsGutter {
    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
        this.selectedLine = '';
    }

    attached() {
        this.iframeBody = $('#gutter');
        $('#gutter').css("height",`${$("#js-editor-code").height()}px`);
        
        this.subscribe();
    }

    subscribe() {
        let ea = this.eventAggregator;

        $('#gutter').scroll(function scroll(e) {
                let info = {
                    top: e.target.scrollTop
                };
        
                ea.publish('onScrolled', info);
            }
        );
        ea.subscribe('onCursorMoved', info => {

            let lastDiv = this.getLastDiv();
            let line = info.cursor;
            let lastline = info.lastVisibleRow;

            if (this.iframeBody.find('#line' + lastline).length == 0) {
                this.createLine(lastline);
            }
            if (lastline < lastDiv) {
                this.removeLine(lastline, lastDiv);
            }

            this.iframeBody.find("#line" + this.selectedLine).removeClass("highlight_gutter");
            this.iframeBody.find("#line" + line).addClass("highlight_gutter");
            this.selectedLine = line;


            this.LastVisibleRow = info.lastVisibleRow;

            this.highlightLine(line, lastline);


        });

        ea.subscribe("traceChanged", payload => {
            let traceHelper = payload.data;
            this.updateGutter(traceHelper.getValues());
        });
        
        ea.subscribe("jsEditorchangeScrollTop", payload => {
            let scrollTop = payload.top;
            this.iframeBody.scrollTop(scrollTop);
        });


    }

    updateGutter(values) {
        this.clearGutter();
        for (let value of values) {
            this.setContentGutter(value.range.start.row + 1, value.id + " = " + value.value);
        }
        this.eventAggregator.publish("jsGutterUpdated", {data:values});
    }

    setContentGutter(line, contents) {
        let lastDiv = this.getLastDiv();
        if (line > lastDiv) {
            throw ("Line " + line + " does not exist" + "last visible line is  " + lastDiv);
        }
        this.iframeBody.find("#line" + line).append(" [ " + contents + " ] ");
    }

    createLine(line) {
        let indexOfDiv = this.getLastDiv();
        for (indexOfDiv; indexOfDiv <= line; indexOfDiv++) {
            this.iframeBody.append("<div id=line" + indexOfDiv + "></div>");
            this.iframeBody.find("#line" + indexOfDiv).addClass("line_height");
        }
    }
    
    getLastDiv() {
        let indexOfDiv = 1;
        while (this.iframeBody.find('#line' + indexOfDiv).length != 0) {
            indexOfDiv++;
        }
        return indexOfDiv;
    }
    
    removeLine(lastline, lastDiv) {
        while (lastline < lastDiv) {
            this.iframeBody.find('#line' + lastDiv).remove();
            lastDiv--;
        }
    }
    
    highlightLine(line, lastline) {

        let lastDiv = this.getLastDiv();
        let selectedLine = this.selectedLine;
        if (this.iframeBody.find('#line' + lastline).length == 0) {
            this.createLine(lastline);
        }
        if (lastline < lastDiv) {
            this.removeLine(lastline, lastDiv);
        }

        this.iframeBody.find("#line" + selectedLine).removeClass("highlight_gutter");
        this.iframeBody.find("#line" + line).addClass("highlight_gutter");
        this.selectedLine = line;



    }

    clearGutter() {
        let lines = this.getLastDiv();
        while (lines > 0) {
            this.iframeBody.find("#line" + lines).html('');
            lines--;
        }
    }
    
}
