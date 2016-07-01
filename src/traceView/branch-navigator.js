/* global $ */
/* global ace */

export class BranchNavigator{
    gutterTooltipId = "gutterTooltip";
    gutterTooltipSelector = "#gutterTooltip";
    gutterTooltipShowDelay = 250;
    gutterTooltipHideDelay = 1500;
    gutterDecorationClassName = "seecoderun-gutter-decoration";

    constructor(eventAggregator, aceUtils, jsEditor){
        this.eventAggregator = eventAggregator;
        this.aceUtils = aceUtils;
        this.jsEditor = jsEditor;
    }
    attached(traceViewModel){
        this.traceViewModel = traceViewModel;
        let aceUtils = this.aceUtils;
        let editor = this.jsEditor.editor;
        this.editor = editor;
        let gutterDecorationClassName = this.gutterDecorationClassName;

        this.attachGutterTooltip();

        aceUtils.setTraceGutterRenderer(editor, traceViewModel.traceGutterData);
    	aceUtils.subscribeToGutterEvents(editor, this.$gutterTooltip, gutterDecorationClassName, traceViewModel.traceGutterData, this.update$GutterTooltip);
        this.subscribe();
    }

    subscribe(){
        let self = this, eventAggregator = this.eventAggregator, aceUtils = this.aceUtils, editor =  this.editor, traceViewModel = this.traceViewModel;

        eventAggregator.subscribe(
            "jsEditorPreChange", payload =>{
                self.cleanGutterUI();
            }
        );

        eventAggregator.subscribe(
            "traceChanged", payload =>{
                 self.aceUtils.updateGutterDecorations(self.editor, [], traceViewModel.traceGutterData.rows, this.gutterDecorationClassName);

            }
        );

        eventAggregator.subscribe(
            "traceNavigationChange", navigationData =>{
                        if(traceViewModel.isTraceGutterDataValid()){
                            if(navigationData.branchIndex && traceViewModel.isTraceGutterDataRowValid(navigationData.row)){
                                traceViewModel.setTraceGutterDataRowBranchIndex(navigationData.row, navigationData.branchIndex);
                                self.jsEditor.editor.getSession().addGutterDecoration(navigationData.row, "");
                            }
                        }
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

    cleanGutterUI(){
        if(this.$gutterTooltip && this.$gutterTooltip.is( ":visible" )){
            this.$gutterTooltip.hide("slide", { direction: "down" }, 200);
        }
        if(this.jsEditor){
             $(`${this.jsEditorSelector} .ace_gutter-cell`).off("mouseenter mouseleave");
         }

        let previousRows = this.traceViewModel.getTraceGutterDataRows();
        this.aceUtils.removeGutterDecorations(this.editor, previousRows, this.gutterDecorationClassName);
        this.traceViewModel.resetTraceGutterDataRows();
    }
}