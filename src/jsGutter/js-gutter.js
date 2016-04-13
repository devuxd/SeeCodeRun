/* global Firepad */
/* global Firebase */
/* global ace */
import {
    TraceHelper
}
from '../traceService/trace-helper';

import {
    TraceModel
}
from '../traceService/trace-model';
export class JsGutter {

    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
        this.selectedLine = '';
        this.traceModel = new TraceModel();

    }

    attached() {
        this.iframeBody = $('#gutter');

        this.subscribe();

    }


    publish(e) {
        let ea = this.eventAggregator;

        let info = {

            top: e.target.scrollTop
        };

        ea.publish('onScrolled', info);
    }



    subscribe() {
        let ea = this.eventAggregator;

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

        //   Gettting vaules from TraceHelper 
        let traceChangedEvent = this.traceModel.traceEvents.changed.event;
        ea.subscribe(traceChangedEvent, payload => {
            let traceHelper = payload.data;
            this.updateGutter(traceHelper.getVariables().values);
        });

    }



    updateGutter(values) {
        this.clearGutter();
        for (let value of values) {
            this.setContentGutter(value.range.start.row + 1, value.id + " = " + value.value);
        }
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
