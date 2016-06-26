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

    jsEditorId = "aceJsEditorDiv";
    jsEditorSelector = "#aceJsEditorDiv";

    gutterDecorationClassName = "seecoderun-gutter-decoration";

    constructor(eventAggregator, aceUtils, jsEditor){
        this.eventAggregator = eventAggregator;
        this.aceUtils = aceUtils;
        this.jsEditor = jsEditor;
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

        self.gutterMouseMoveTimeout = null;

        let gutterMouseMoveUpdateTooltipTimeout = function gutterMouseMoveUpdateTooltipTimeout(){
	        self.$gutterTooltip.hide("slide", { direction: "down" }, self.tooltipSlideDelay);
	    };

        self.update$GutterTooltip = function update$GutterTooltip($gutterTooltip, position, content, row, lineHeight, tooltipSlideDelay, tooltipShowDelay, tooltipHideDelay){
            if(!$gutterTooltip){
			        return;
			}
            self.tooltipSlideDelay = tooltipSlideDelay;
	        self.currentRow = row;
		    if(content){
	            self.currentContent = content;
			    let $gutterNavigatorSlider = $("#gutterNavigatorSlider");

			    if(!$gutterNavigatorSlider.length){
			        let navigator = `
			        <div class = "w3-row">
    			        <div id="gutterNavigatorSliderLeft">
    			            <i class="material-icons seecoderun-text-blue">&#xE5CB;</i>
    			        </div>
    			        <div id="gutterNavigatorSlider"></div>
    			        <div id="gutterNavigatorSliderRight">
    			         <i class="material-icons seecoderun-text-blue">&#xE5CC;</i>
                        </div>
                    </div>
    			    `;
    			    $gutterTooltip.html(navigator);
    			    $gutterNavigatorSlider = $("#gutterNavigatorSlider");

    			    self.gutterNavigatorSliderValue = 0;
    			    $gutterNavigatorSlider.slider({
                      slide: function gutterNavigatorSliderChange(event, ui) {
                          if(self.gutterNavigatorSliderValue !== ui.value){
                            self.eventAggregator.publish("traceNavigationChange", {branchIndex: ui.value, branchMax: self.branchMax, entry: self.currentContent, row: self.currentRow });
                            self.gutterNavigatorSliderValue = ui.value;
                          }
                      }
                    });
    			    $gutterNavigatorSlider.show();

    			    $("#gutterNavigatorSliderLeft").click( function gutterNavigatorSliderLeftClick( event) {
    			        let value = $gutterNavigatorSlider.slider('value') - 1;
    			        $gutterNavigatorSlider.slider('value',  value);
    			        if($gutterNavigatorSlider.slider('value') === value){
        			        self.eventAggregator.publish("traceNavigationChange", {branchIndex: value, branchMax: self.branchMax, entry: self.currentContent, row: self.currentRow });
                            self.gutterNavigatorSliderValue = value;
    			        }
    			     });
                    $("#gutterNavigatorSliderLeft").show();

                    $("#gutterNavigatorSliderRight").click(function gutterNavigatorSliderRightClick( event) {
                        let value = $gutterNavigatorSlider.slider('value') + 1;
    			        $gutterNavigatorSlider.slider('value',  value);
    			        if($gutterNavigatorSlider.slider('value') === value){
        			        self.eventAggregator.publish("traceNavigationChange", {branchIndex: value, branchMax: self.branchMax, entry: self.currentContent, row: self.currentRow });
                            self.gutterNavigatorSliderValue = value;
    			        }
                    });
                    $("#gutterNavigatorSliderRight").show();
                    $gutterTooltip.hide();
                    $gutterTooltip.mouseenter( function gutterTooltipMouseEnter(){
                        clearTimeout(self.gutterMouseMoveTimeout);
                        if(!$gutterTooltip.is( ":visible" )){
                        if(self.previousRow){
                            self.jsEditor.editor.getSession().removeGutterDecoration(self.previousRow, "seecoderun-gutter-decoration-active");
                        }
                        self.jsEditor.editor.getSession().addGutterDecoration(self.currentRow, "seecoderun-gutter-decoration-active");
                        $gutterTooltip.hide().show("slide", { direction: "down" }, tooltipSlideDelay);
                    }
                    })
                    .mouseleave( function gutterTooltipMouseLeave(){
                        clearTimeout(self.gutterMouseMoveTimeout);
                        self.gutterMouseMoveTimeout =
        			        setTimeout( gutterMouseMoveUpdateTooltipTimeout, tooltipHideDelay);
                    });
			    }

		        $( "#gutterTooltip > div" ).css({
		            height: `${lineHeight}px`,
		        });

		        $( "#gutterTooltip > div > div" ).css({
		            height: `${lineHeight}px`
		        });
		        $( "#gutterTooltip > div > div > i" ).css({
		            "line-height": `${lineHeight -2}px`
		        });

		        $gutterNavigatorSlider.css({
		            height: `${lineHeight - 4}px`,
		            top: "-7px"
		        });

		        $gutterNavigatorSlider.slider('option', {min: 1, max: content.count, value: content.count});
		        self.branchMax = content.count;
		        if(position){
    		        $gutterTooltip.css({
    		            height: `${lineHeight}px`,
    		            top: `${position.pageY}px`,
    		            left: `${position.pageX}px`
    		        });
    		    }
                if(!$gutterTooltip.is( ":visible" )){
                    if(self.previousRow){
                        self.jsEditor.editor.getSession().removeGutterDecoration(self.previousRow, "seecoderun-gutter-decoration-active");
                    }
                    $gutterTooltip.hide().show("slide", { direction: "down" }, tooltipSlideDelay);
                    $gutterTooltip.mouseenter();
                }
			}else{
		        let isGutterTooltipHovered = !!$($gutterTooltip).
                    filter(function() { return $(this).is(":hover"); }).length;
			    if(!isGutterTooltipHovered){
			     self.gutterMouseMoveTimeout =
    			    setTimeout( gutterMouseMoveUpdateTooltipTimeout, tooltipHideDelay);
			    }
	        }
	        self.previousRow = row;
        };
    }

    removeAllGutterDecorations(editorSession, className){
        let lastRow = editorSession.getLength();
        for(let row = 0; row < lastRow; row++){
            editorSession.addGutterDecoration(row, className);
            editorSession.removeGutterDecoration(row, className);
        }
    }

    attached(){
        let eventAggregator = this.eventAggregator;
        let aceUtils = this.aceUtils;
        let editor = ace.edit(this.jsEditorId);
        let gutterDecorationClassName = this.gutterDecorationClassName;

        this.attachGutterTooltip();
        let $editorTooltip = $(this.editorTooltipSelector);

        if(!$editorTooltip.length){
			$editorTooltip = $(`<div id='${this.editorTooltipSelector}' />`);
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
        self.jsGutterScrollTopDelta = 0;
        self.jsGutterPreviousScrollTop = null;
        eventAggregator.subscribe(
            "jsGutterChangeScrollTop", scrollData =>{
                if(self.jsGutterPreviousScrollTop === null){
                    self.jsGutterPreviousScrollTop = scrollData.scrollTop;
                }
                self.jsGutterScrollTopDelta = self.jsGutterPreviousScrollTop - scrollData.scrollTop;
                self.jsGutterPreviousScrollTop= scrollData.scrollTop;

                if(self.$gutterTooltip.is( ":visible" )){
                    let currentTop = self.$gutterTooltip.css("top");
                    currentTop = currentTop.replace("px", "");
                    self.$gutterTooltip.css({
		            top: `${parseInt(currentTop, 10) + self.jsGutterScrollTopDelta}px`
		        });
                }
            }
        );

        eventAggregator.subscribe(
            "jsEditorPreChange", payload =>{
                if(self.$gutterTooltip && self.$gutterTooltip.is( ":visible" )){
                    self.$gutterTooltip.hide("slide", { direction: "down" }, 200);
                }
                if(self.jsEditor){
                     $(`${self.jsEditorSelector} .ace_gutter-cell`).off("mouseenter mouseleave");
                 }

                let previousRows = traceViewModel.traceGutterData.rows;
                aceUtils.removeGutterDecorations(self.editor, previousRows, self.gutterDecorationClassName);
                traceViewModel.traceGutterData.rows = [];
            }
        );

        eventAggregator.subscribe(
            "traceNavigationChange", navigationData =>{
                        if(traceViewModel.traceGutterData && traceViewModel.traceGutterData.rows){
                            if(navigationData.branchIndex && navigationData.row && traceViewModel.traceGutterData.rows[navigationData.row]){
                                traceViewModel.traceGutterData.rows[navigationData.row].branch = navigationData.branchIndex;
                                self.jsEditor.editor.getSession().addGutterDecoration(navigationData.row, "");
                            }
                        }
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

            traceViewModel.updateTraceGutterData(stackTrace);

            this.aceUtils.updateGutterDecorations(this.editor, [], traceViewModel.traceGutterData.rows, this.gutterDecorationClassName);

            traceViewModel.traceValuesData.ranges = traceHelper.getExecutionTrace();
    }

}