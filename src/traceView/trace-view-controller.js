/* global $ */
/* global ace */
import {TraceViewModel} from "./trace-view-model";

export class TraceViewController{
    gutterTooltipId = "gutterTooltip";
    gutterTooltipSelector = "#gutterTooltip";
    gutterTooltipShowDelay = 250;
    gutterTooltipHideDelay = 1500;

    editorTooltipSelector = "#editorTooltip";
    editorTooltipShowDelay = 500;
    editorTooltipHideDelay = 500;

    aceEditorDivId = "aceJsEditorDiv";
    gutterDecorationClassName = "seecoderun-gutter-decoration";

    constructor(eventAggregator, aceUtils){
        this.eventAggregator = eventAggregator;
        this.aceUtils = aceUtils;
    }

    attachGutterTooltip(){
        let self = this;
        let tooltip = document.getElementById(this.gutterTooltipId);
        if(!tooltip){
        			tooltip = document.createElement('div');
        			tooltip.setAttribute('id', self.gutterTooltipId);
        			document.body.appendChild(tooltip);
        }
        self.$gutterTooltip = $(tooltip);

        self.update$GutterTooltip = function update$GutterTooltip($gutterTooltip, position, content, lineHeight){
                if(!$gutterTooltip){
    			        return;
    			}

    		    if(position){
    		        $gutterTooltip.css({
    		          //  position: "absolute",
    		          //  marginLeft: 0,
    		          //  marginTop: 0,
    		            height: `${lineHeight}px`,
    		          //  "font-size": "10px",
    		          //  "float": "left",
    		            top: `${position.pageY}px`,
    		            left: `${position.pageX}px`
    		        });
    		    }


    			if(content){

    			    let navigator = `
    			        <div class = "w3-row-padding">
    			        <i class="material-icons seecoderun-text-blue" style= "font-size: ${lineHeight-1}px">&#xE5CB;</i>
    			           <div id="gutterNavigatorSlider"></div>
    			         <i class="material-icons seecoderun-text-blue" style= "font-size: ${lineHeight-1}px">&#xE5CC;</i>
                        </div>
    			        `;
    // <input id="gutterNavigatorSlider" type="range" min="1" max="${content.count}" value="1" step="1" />

    			 //    			    let navigator = `
    			 //   <div class = "w3-row">
    			 //       <div class = "w3-col" style ="width:${lineHeight}">
    			 //        <i class="material-icons seecoderun-text-blue">&#xE5CB;</i>
    			 //       </div>
    			 //       <div class = "w3-rest">
    			 //           ${content.count}
    			 //       </div>
    			 //       <div class = "w3-col" style ="width:${lineHeight}">
    			 //        <i class="material-icons seecoderun-text-blue">&#xE5CC;</i>
    			 //       </div>
    			 //    </div>`;
    			    $gutterTooltip.html(navigator);
    			    $( "#gutterNavigatorSlider" ).css({
    		            height: `${lineHeight-2}px`,
    		          //  "font-size": "10px",
    		          //  "float": "left",
    		        });

    			    $( "#gutterNavigatorSlider" ).slider({
                    //   range: true,
                      min: 1,
                      max: content.count,
                    //   values: [ 75, 300 ],
                      slide: function( event, ui ) {
                        //   console.log(ui.value);
                          self.eventAggregator.publish("traceNavigationChange", {branchIndex: ui.value, entry: content });
                        // $( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
                      }
                    });

    			    $gutterTooltip.toggle("slide", { direction: "left" }, 500);
    			}else{
    			    $gutterTooltip.hide("slide", { direction: "right" }, 500);
    	        }
        };


    }

    attached(){
        let eventAggregator = this.eventAggregator;
        let aceUtils = this.aceUtils;
        let editor = ace.edit(this.aceEditorDivId);
        let gutterDecorationClassName = this.gutterDecorationClassName;

        this.attachGutterTooltip();
        let $editorTooltip = $(this.editorTooltipSelector);

        if(!$editorTooltip.length){
			$editorTooltip = $(`<div id='${this.editorTooltipSelector}' />`);
// 			$editorTooltip.addClassName("");
        }

        $editorTooltip.attr({
            "data-toggle": "popover",
            "data-placement": "bottom",
            "data-content": "",
            "delay": {
                show: this.editorTooltipShowDelay,
                hide: this.editorTooltipHideDelay
            }
        });
		$editorTooltip.popover({
		    title: "Current Values",
		    html: true,
		  //  selector: '[rel="popover"]',
            content: function $editorTooltipPopoverContent() {
                // return $('#branchNavigator').html();
            },
		    padding: 4
		});

        $editorTooltip.appendTo('body');

        let traceViewModel = new TraceViewModel($editorTooltip);
        traceViewModel.attached();

        aceUtils.setTraceGutterRenderer(editor, traceViewModel.traceGutterData);
    	aceUtils.subscribeToGutterEvents(editor, this.$gutterTooltip, gutterDecorationClassName, traceViewModel.traceGutterData, this.update$GutterTooltip);

    	this.editor = editor;
        this.gutterDecorationClassName = gutterDecorationClassName;
        this.$editorTooltip = $editorTooltip;
    	this.traceViewModel = traceViewModel;

    	aceUtils.publishExpressionHoverEvents(editor, eventAggregator, traceViewModel);

        this.subscribe();
    }

    subscribe(){
        let self = this, eventAggregator = this.eventAggregator, aceUtils = this.aceUtils, editor =  this.editor, traceViewModel = this.traceViewModel;

        eventAggregator.subscribe(
            "traceChanged", payload =>{
                        self.onTraceChanged(payload.data);
                    }
        );

        aceUtils.subscribeToExpressionHoverEvents(editor, eventAggregator, traceViewModel);
    }

    onTraceChanged(traceHelper){

            if(!traceHelper){
                throw "onTraceChanged() called without a Trace Helper.";
            }

            let traceViewModel = this.traceViewModel;

            traceViewModel.traceHelper = traceHelper;

            let stackTrace = traceHelper.getStackBlockCounts();

            let previousRows = traceViewModel.traceGutterData.rows;
            traceViewModel.updateTraceGutterData(stackTrace);

            this.aceUtils.updateGutterDecorations(this.editor, previousRows, traceViewModel.traceGutterData.rows, this.gutterDecorationClassName);

            traceViewModel.traceValuesData.ranges = traceHelper.getExecutionTrace();
    }

}