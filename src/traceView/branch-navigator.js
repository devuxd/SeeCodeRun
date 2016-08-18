/* global $ */
import {TracePlayer} from '../tracePlayer/trace-player';

export class BranchNavigator{
    gutterTooltipId = "gutterTooltip";
    gutterTooltipSelector = "#gutterTooltip";
    resetNavigationBoxSelector ="#resetNavigationBox";
    gutterNavigatorSliderLeftSelector = ".gutterNavigatorSliderLeft";
    gutterNavigatorSliderRightSelector = ".gutterNavigatorSliderRight";
    gutterNavigatorSliderSelector = ".gutterNavigatorSlider";
    gutterTooltipSlideTime = 50;
    gutterTooltipShowDelay = 50;
    gutterTooltipHideDelay = 500;
    gutterDecorationClassName = "seecoderun-gutter-decoration";
    branches = [];

    constructor(eventAggregator, aceUtils, jsEditor, traceViewModel){
        this.eventAggregator = eventAggregator;
        this.aceUtils = aceUtils;
        this.jsEditor = jsEditor;
        this.traceViewModel = traceViewModel;
        this.tracePlayer = new TracePlayer(eventAggregator, aceUtils);
    }

    updateGutterBranches(traceGutterData){
        for(let row in traceGutterData.rows){
            if(traceGutterData.rows.hasOwnProperty(row)){
                let count = traceGutterData.rows[row].count;
                if(count != null){
                    traceGutterData.rows[row].branch = count;
                }

            }
        }

        if(this.traceHelper && this.traceHelper.navigationTrace){
            let navigationData = this.traceHelper.navigationTrace.navigationData;
            for(let row in navigationData){
                let navigationDatum = navigationData[row];
                if(navigationDatum.row !=  null && traceGutterData.rows.hasOwnProperty(navigationDatum.row)){
                    traceGutterData.rows[navigationDatum.row].count = navigationDatum.branchMax;
                    traceGutterData.rows[navigationDatum.row].branch = navigationDatum.brancIndex;
                }
            }

        }
        this.branches = traceGutterData.rows;
    }

    attached(){
        let self = this;
        let traceViewModel = this.traceViewModel;
        let aceUtils = this.aceUtils;
        let gutterDecorationClassName = this.gutterDecorationClassName;
        let editor = this.jsEditor.editor;
        this.editor = editor;

        this.attachGutterTooltip();

        aceUtils.setTraceGutterRenderer(editor, traceViewModel.traceGutterData);
    	aceUtils.subscribeToGutterEvents(editor, this.$gutterTooltip,
    	    gutterDecorationClassName, traceViewModel.traceGutterData, this.update$GutterTooltip,
    	    this.gutterTooltipSlideTime, this.gutterTooltipShowDelay, this.gutterTooltipShowDelay
    	    );
    	$(this.resetNavigationBoxSelector).click(function resetNavigationBoxClick(){
    	    self.traceHelper.stopNavigation();
    	    self.eventAggregator.publish("traceChanged", {status: self.traceHelper.event, description : self.traceHelper.description , data: self.traceHelper});
    	    self.eventAggregator.publish("branchNavigatorReset",{indexInTimeline: 0});
    	});

        this.tracePlayer.attached();
        this.subscribe();
    }

    subscribe(){
        let eventAggregator = this.eventAggregator,
            aceUtils = this.aceUtils,
            editor =  this.editor,
            traceViewModel = this.traceViewModel,
            gutterDecorationClassName = this.gutterDecorationClassName;

        eventAggregator.subscribe("jsEditorCursorMoved", info => {
            this.selectedLine = info.cursor ||1;
            this.$hideTooltip();

        });

        eventAggregator.subscribe(
            "jsEditorPreChange", payload =>{
                this.cleanGutterUI();
            }
        );

        eventAggregator.subscribe(
            "jsEditorChangeError", payload =>{
                this.$hideTooltip();
            }
        );

        eventAggregator.subscribe(
            "traceGutterDataChanged", payload =>{
                this.updateGutterBranches(traceViewModel.traceGutterData);
                aceUtils.updateGutterDecorations(editor, [], traceViewModel.traceGutterData.rows, gutterDecorationClassName);

            }
        );

        eventAggregator.subscribe("traceChanged", payload => {
            this.traceHelper = payload.data;
        });

        eventAggregator.subscribe(
            "traceNavigationPrepareChange", navigationData =>{
                if(this.traceHelper){
                    this.traceHelper.pushNavigationData(navigationData, this.branches);
                    this.traceHelper.startNavigation();
                    this.traceHelper.navigateToBranch();
                    let localTraceGutterData = traceViewModel.extractTraceGutterData(this.traceHelper.getNavigationStackBlockCounts());
                    // traceViewModel.traceGutterData.maxCount = localTraceGutterData.maxCount;
                    // traceViewModel.traceGutterData.rows = localTraceGutterData.rows;
                    traceViewModel.updateTraceGutterRowCount(localTraceGutterData);
                    eventAggregator.publish("traceGutterDataChanged");
                    eventAggregator.publish("traceNavigationChange", this.traceHelper);
                }

                if(traceViewModel.isTraceGutterDataValid()){
                    if(navigationData.branchIndex && traceViewModel.isTraceGutterDataRowValid(navigationData.row)){
                        traceViewModel.setTraceGutterDataRowBranchIndex(navigationData.row, navigationData.branchIndex);
                        editor.getSession().addGutterDecoration(navigationData.row, "");
                    }
                }
            }
        );

        this.jsGutterScrollTopDelta = 0;
        this.jsGutterPreviousScrollTop = null;
        eventAggregator.subscribe(
            "jsGutterChangeScrollTop", scrollData =>{
                if(this.jsGutterPreviousScrollTop === null){
                    this.jsGutterPreviousScrollTop = scrollData.scrollTop;
                }
                this.jsGutterScrollTopDelta = this.jsGutterPreviousScrollTop - scrollData.scrollTop;
                this.jsGutterPreviousScrollTop= scrollData.scrollTop;

                if(this.$gutterTooltip.is( ":visible" )){
                    let currentTop = this.$gutterTooltip.css("top");
                    currentTop = currentTop.replace("px", "");
                    this.$gutterTooltip.css({
		            top: `${parseInt(currentTop, 10) + this.jsGutterScrollTopDelta}px`
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
	        self.$hideTooltip();
	    };

        self.update$GutterTooltip = function update$GutterTooltip($gutterTooltip, position, context, row, lineHeight){
            if(!$gutterTooltip){
			        return;
			}
	        self.currentRow = row;
	        let content = context.entry;
	        let count = context.count;
	        let branch = context.branch;
		    if(content){
	            self.currentContent = content;
			    let $gutterNavigatorSlider = $(self.gutterNavigatorSliderSelector);

			    if(!$gutterNavigatorSlider.length){
			        let navigator = `
			        <div class = "w3-row">
    			        <div class="gutterNavigatorSliderLeft">
    			            <i class="material-icons seecoderun-text-blue">&#xE5CB;</i>
    			        </div>
    			        <div class="gutterNavigatorSliderRight">
    			         <i class="material-icons seecoderun-text-blue">&#xE5CC;</i>
                        </div>

    			        <div class="gutterNavigatorSlider"></div>

    			        <div class="gutterNavigatorSliderLeft">
    			            <i class="material-icons seecoderun-text-blue">&#xE5CB;</i>
    			        </div>
    			        <div class="gutterNavigatorSliderRight">
    			         <i class="material-icons seecoderun-text-blue">&#xE5CC;</i>
                        </div>

                    </div>
    			    `;
    			    $gutterTooltip.html(navigator);
    			    $gutterNavigatorSlider = $(self.gutterNavigatorSliderSelector);

    			    self.gutterNavigatorSliderValue = 0;
    			    $gutterNavigatorSlider.slider({
                      slide: function gutterNavigatorSliderChange(event, ui) {
                          if(self.gutterNavigatorSliderValue !== ui.value){
                            self.eventAggregator.publish("traceNavigationPrepareChange", {branchIndex: ui.value, branchMax: self.branchMax, entry: self.currentContent, row: self.currentRow });
                            self.gutterNavigatorSliderValue = ui.value;
                          }
                      }
                    });
    			    $gutterNavigatorSlider.show();

    			    $(self.gutterNavigatorSliderLeftSelector).click( function gutterNavigatorSliderLeftClick( event) {
    			        let value = $gutterNavigatorSlider.slider('value') - 1;
    			        $gutterNavigatorSlider.slider('value',  value);
    			        if($gutterNavigatorSlider.slider('value') === value){
        			        self.eventAggregator.publish("traceNavigationPrepareChange", {branchIndex: value, branchMax: self.branchMax, entry: self.currentContent, row: self.currentRow });
                            self.gutterNavigatorSliderValue = value;
    			        }
    			     });
                    $(self.gutterNavigatorSliderLeftSelector).show();

                    $(self.gutterNavigatorSliderRightSelector).click(function gutterNavigatorSliderRightClick( event) {
                        let value = $gutterNavigatorSlider.slider('value') + 1;
    			        $gutterNavigatorSlider.slider('value',  value);
    			        if($gutterNavigatorSlider.slider('value') === value){
        			        self.eventAggregator.publish("traceNavigationPrepareChange", {branchIndex: value, branchMax: self.branchMax, entry: self.currentContent, row: self.currentRow });
                            self.gutterNavigatorSliderValue = value;
    			        }
                    });
                    $(self.gutterNavigatorSliderRightSelector).show();
                    $gutterTooltip.hide();
                    $gutterTooltip.mouseenter( function gutterTooltipMouseEnter(){
                        clearTimeout(self.gutterMouseMoveTimeout);
                        if(!$gutterTooltip.is( ":visible" )){
                            self.$showTooltip();
                        }
                    })
                    .mouseleave( function gutterTooltipMouseLeave(){
                        clearTimeout(self.gutterMouseMoveTimeout);
                        self.gutterMouseMoveTimeout =
        			        setTimeout( gutterMouseMoveUpdateTooltipTimeout, self.gutterTooltipHideDelay);
                    });
			    }
                let $aceEditor$Width = $("#aceJsEditorDiv").width();

                $( "#gutterTooltip" ).width($aceEditor$Width);

		        $( "#gutterTooltip > div" ).height(lineHeight);

		        $( "#gutterTooltip > div > div" ).height(lineHeight);

                $( "#gutterTooltip > div > div > i" ).css({
		            "line-height": `${lineHeight -2}px`,
		            "padding-top": `1px`
		        });

		        $gutterNavigatorSlider.css({
		            height: `${lineHeight - 4}px`,
		            top: `-${lineHeight/2}px`
		        });
                let $button$Width = 31;// todo get the actual value
		        $gutterNavigatorSlider.width($aceEditor$Width - $button$Width*4);

		        $gutterNavigatorSlider.slider('option', {min: 1, max: count, value: branch});
		        self.branchMax = count;
		        self.branchIndex = branch;
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
                    self.$showTooltip();
                    $gutterTooltip.mouseenter();
                }
			}else{
		        let isGutterTooltipHovered = !!$($gutterTooltip).
                    filter(function() { return $(this).is(":hover"); }).length;
			    if(!isGutterTooltipHovered){
			         clearTimeout(self.gutterMouseMoveTimeout);
        		     self.gutterMouseMoveTimeout =
        			    setTimeout( gutterMouseMoveUpdateTooltipTimeout, self.gutterTooltipHideDelay);
			    }
	        }
	        self.previousRow = row;
        };
    }

    cleanGutterUI(){
        if(!this.jsEditor){
            return;
        }
        this.$hideTooltip();
        $(`${this.jsEditorSelector} .ace_gutter-cell`).off("mouseenter mouseleave");
        this.aceUtils.removeAllGutterDecorations(this.editor, this.gutterDecorationClassName);
        $(`${this.jsEditorSelector}.ace_gutter-cell`).removeClass(this.gutterDecorationClassName);
        this.traceViewModel.resetTraceGutterDataRows();
    }

    $hideTooltip(){
        if(this.$gutterTooltip && this.$gutterTooltip.is( ":visible" )){
            this.currentRow = null;
            this.$gutterTooltip.hide("slide", { direction: "down" }, this.gutterTooltipSlideTime);
            this.eventAggregator.publish("branchNavigatorChange", {isVisible: false});
        }
    }

    $showTooltip(isForceShow = false){
        if(this.$gutterTooltip && (!this.$gutterTooltip.is( ":visible" || isForceShow))){
            this.$gutterTooltip.show("slide", { direction: "down" }, this.gutterTooltipSlideTime);
            this.eventAggregator.publish("branchNavigatorChange", {isVisible: true});
        }
    }
}