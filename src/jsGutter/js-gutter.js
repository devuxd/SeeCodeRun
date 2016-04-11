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
        this.selectedLine = 1;
        this.traceModel = new TraceModel();

    }

    attached() {
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
            let iframeBody = $('#gutter');
            let line = info.cursor;
            let lastline = info.lastVisibleRow;

            if (iframeBody.find('#line' + lastline).length == 0) {
                this.CreateLine(lastline);
            }
            if (lastline < lastDiv) {
                this.removeLine(lastline, lastDiv);
            }

            iframeBody.find("#line" + this.selectedLine).removeClass("highlight_gutter");
            iframeBody.find("#line" + line).addClass("highlight_gutter");
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
        
       for (let value of values){
        
        this.setContentGutter(value.range.start.row+1, value.id +" = "+ value.value);

           
       }


        // let values1_1 = ['Executed 10 times from 0...9'];
        // this.setContentGutter(1, values1_1);

        // let values1_2 = ['x=5, y=0', 'x=5, y=1', 'x=5, y=2', 'x=5, y=3', 'x=5, y=4', 'x=5, y=5', 'x=5, y=6', 'x=5, y=7', 'x=5, y=8', 'x=5, y=9' ];
        // this.setContentGutter(6, values1_2);

        // let values1_4 = ['5, 0', '5, 1', '5, 2', '5, 3', '5, 4', '5, 5', '5, 6', '5, 7', '5, 8', '5, 9' ];
        // this.setContentGutter(2, values1_4);

        // let values1_3 = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14' ];
        // this.setContentGutter(7, values1_3);

        // Example 2 

        // let values2_4 = ['5, 5'];
        // this.setContentGutter(5, values2_4);

        // let values2_2 = ['x=5, y=5'];
        // this.setContentGutter(6, values2_2);

        // let values2_3 = ['10'];
        // this.setContentGutter(7, values2_3);

    }

    setContentGutter(line, contents) {
        let lastDiv = this.getLastDiv();
        if (line > lastDiv) {
            throw ("Line " + line + " does not exist" + "last visible line is  " + lastDiv);
        }
        let iframeBody = $('#gutter');
        // for (let content of contents) {
            iframeBody.find("#line" + line).append(" [ " + contents + " ] ");

        // }
    }

    CreateLine(line) {
        let iframeBody = $('#gutter');
        let indexOfDiv = this.getLastDiv();
        for (indexOfDiv; indexOfDiv <= line; indexOfDiv++) {
            iframeBody.append("<div id=line" + indexOfDiv + "></div>");
            iframeBody.find("#line" + indexOfDiv).addClass("line_height");
        }
    }
    getLastDiv() {
        let iframeBody = $('#gutter');
        let indexOfDiv = 1;
        while (iframeBody.find('#line' + indexOfDiv).length != 0) {
            indexOfDiv++;
        }
        return indexOfDiv;
    }
    removeLine(lastline, lastDiv) {
        let iframeBody = $('#gutter');
        while (lastline < lastDiv) {
            iframeBody.find('#line' + lastDiv).remove();
            lastDiv--;
        }
    }
    highlightLine(line, lastline) {

        let lastDiv = this.getLastDiv();
        let iframeBody = $('#gutter');
        let selectedLine = this.selectedLine;
        if (iframeBody.find('#line' + lastline).length == 0) {
            this.CreateLine(lastline);
        }
        if (lastline < lastDiv) {
            this.removeLine(lastline, lastDiv);
        }

        iframeBody.find("#line" + selectedLine).removeClass("highlight_gutter");
        iframeBody.find("#line" + line).addClass("highlight_gutter");
        this.selectedLine = line;



    }
    
     clearGutter() {
        let iframeBody = $('#gutter');
        let lines = this.getLastDiv();
        while (lines > 0) {
            iframeBody.find("#line" + lines).html('');
            lines--;
        }
    }




}
