/**
 * Created by DavidIgnacio on 7/7/2017.
 */
/* global $ */
import {TracePlayer} from '../tracePlayer/trace-player';
import {AceUtils} from '../utils/ace-utils';

export class NavigatorTooltip {
  navigatorTooltipClassName = "navigator-tooltip";
  sliderLeftSelector = ".navigatorSliderLeft";
  sliderRightSelector = ".navigatorSliderRight";
  sliderSelector = ".navigator-slider";
  slideTime = 50;
  hideDelay = 500;
  aceGutterCellSelector = ".ace_gutter-cell";
  gutterDecorationClassNames = {
    branchGlobal: "seecoderun-gutter-decoration-branch-global",
    branchLocal: "seecoderun-gutter-decoration-branch-local"
  };

  jsEditorSelector = "#aceJsEditorDiv";

  constructor(type, tooltipId, eventAggregator, aceUtils, jsEditor, traceViewModel) {
    this.type =  type;
    this.tooltipId= tooltipId;
    this.tooltipSelector= "#"+tooltipId;
    this.eventAggregator = eventAggregator;
    this.aceUtils = aceUtils;
    this.jsEditor = jsEditor;
    this.traceViewModel = traceViewModel;
  }

  attached() {
    let self = this;
    let branchModel = this.traceViewModel.branchModel;
    let aceUtils = this.aceUtils;
    let gutterDecorationClassNames = this.gutterDecorationClassNames;
    branchModel.gutterDecorationClassNames = gutterDecorationClassNames;
    let editor = this.jsEditor.editor;
    this.editor = editor;
    this.setAceMarkerManager(editor);

    this.attachTooltip();
    if(this.type === "gutter"){
      aceUtils.setTraceGutterRenderer(editor, branchModel.traceGutterData);
      aceUtils.setCustomGutterUpdate(editor);
      aceUtils.subscribeToGutterEvents(this.eventAggregator, editor, gutterDecorationClassNames, branchModel.traceGutterData, this.aceGutterCellSelector);
    }
    this.subscribe();
  }

  subscribe() {
    let self = this;
    let eventAggregator = this.eventAggregator,
      aceUtils = this.aceUtils,
      editor = this.editor,
      traceViewModel = this.traceViewModel,
      gutterDecorationClassNames = this.gutterDecorationClassNames;

    eventAggregator.subscribe("jsEditorCursorMoved", info => {
      this.selectedLine = info.cursor || 1;
      this.$hideTooltip();
    });

    eventAggregator.subscribe(
      "jsEditorPreChange", () => {
        this.aceUtils.updateAceMarkers(this.branchLocalMarkerManager, []);
        this.aceUtils.updateAceMarkers(this.branchGlobalMarkerManager, []);
        this.cleanGutterUI();
      }
    );

    eventAggregator.subscribe(
      "jsEditorChangeError", () => {
        this.$hideTooltip();
      }
    );

    eventAggregator.subscribe(
      "traceGutterDataChanged", payload => {
        aceUtils.updateGutterDecorations(editor, [], traceViewModel.branchModel.traceGutterData.rows);
      }
    );

    eventAggregator.subscribe("traceChanged", payload => {
      this.$hideTooltip();
      eventAggregator.publish("traceNavigationChange", {traceViewModel: traceViewModel, isEditorChange: true});
    });

    eventAggregator.subscribe(
      "traceNavigationPrepareChange", navigationDatum => {

        if (traceViewModel) {

          traceViewModel.updateTraceGutterData(navigationDatum);
          eventAggregator.publish("traceGutterDataChanged");
          eventAggregator.publish("traceNavigationChange", {traceViewModel: traceViewModel, isEditorChange: false});

          if (traceViewModel.isTraceGutterDataValid()) {
            for (let row in traceViewModel.branchModel.traceGutterData.rows) {
              editor.getSession().addGutterDecoration(row, "");
            }
            // console.log("navigating ", navigationDatum.branchIndex, navigationDatum.branchTotal, navigationDatum);

            if (traceViewModel.branchModel.currentNavigationFunction) {
              let globalEntry = traceViewModel.branchModel.currentNavigationFunction.entry.entry;
              let branchRange = {
                start: {row: globalEntry.range.start.row, column: 0},
                end: {row: globalEntry.range.end.row, column: globalEntry.range.end.column}
              }
              this.aceUtils.updateAceMarkers(this.branchGlobalMarkerManager, [{range: branchRange}]);
            }

            if (traceViewModel.branchModel.currentNavigationFunction !== navigationDatum) {
              let localEntry = navigationDatum.entry.entry;
              let branchRange = {
                start: {row: localEntry.range.start.row, column: 0},
                end: {row: localEntry.range.end.row, column: localEntry.range.end.column}
              }

              this.aceUtils.updateAceMarkers(this.branchLocalMarkerManager, [{range: branchRange}]);
            } else {
              this.aceUtils.updateAceMarkers(this.branchLocalMarkerManager, []);
            }
          }
        }


      }
    );

    this.jsGutterScrollTopDelta = 0;
    this.jsGutterPreviousScrollTop = null;
    eventAggregator.subscribe(
      "jsGutterChangeScrollTop", scrollData => {
        if (this.jsGutterPreviousScrollTop === null) {
          this.jsGutterPreviousScrollTop = scrollData.scrollTop;
        }
        this.jsGutterScrollTopDelta = this.jsGutterPreviousScrollTop - scrollData.scrollTop;
        this.jsGutterPreviousScrollTop = scrollData.scrollTop;

        if (this.$tooltip.is(":visible")) {
          let currentTop = this.$tooltip.css("top");
          currentTop = currentTop.replace("px", "");
          this.$tooltip.css({
            top: `${parseInt(currentTop, 10) + this.jsGutterScrollTopDelta}px`
          });
        }
      }
    );

    let setTooltipMouseMoveForGutter = function setTooltipMouseMove(target, row, pixelPosition, rowData) {
      $(target).mouseenter(function onMouseEnterGutterCell() {
        clearTimeout(self.gutterTooltipHideTimeout);
        self.previousRow = row;
        self.update$Tooltip(pixelPosition, rowData, row, editor.renderer.lineHeight);
      }).mouseleave(function onMouseLeaveGutterCell() {
        clearTimeout(self.gutterTooltipHideTimeout);
        self.gutterTooltipHideTimeout =
          setTimeout(function gutterTooltipHideTimeout() {
            self.previousRow = null;
            self.update$Tooltip(pixelPosition, null, row, editor.renderer.lineHeight);
          }, self.hideDelay);
        $(target).off("mouseenter mouseleave");
      });
      $(target).mouseenter();
    };

    eventAggregator.subscribe("showBranchNavigator", payload => {

      if (payload.context === self.type) {
        if(self.type === "gutter"){
          setTooltipMouseMoveForGutter(payload.target, payload.row, payload.pixelPosition, payload.rowData);
          // $("#callGraphTooltip").css({display:"block", left: payload.pixelPosition.pageX+"px", top: payload.pixelPosition.pageY+"px"});
        }else{
          // console.log(self.type);
          // payload.pixelPosition = {pageX: 100, pageY:  100};
          self.update$Tooltip(payload.pixelPosition, null, payload.row, 14);

        }
      }
    });

    eventAggregator.subscribe("hideBranchNavigator", payload => {

    });
  }



  attachTooltip() {
    let self = this;
    let tooltip = document.getElementById(this.tooltipId);
    let $tooltip = null;
    let $navigatorSlider = null;

    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.setAttribute('id', this.tooltipId);
      tooltip.className = self.navigatorTooltipClassName;
      document.body.appendChild(tooltip);

      $tooltip = $(tooltip);
      self.$tooltip = $tooltip;

      let navigator = `
			        <div class = "w3-row">
    			        <div class="navigatorSliderLeft">
    			            <i class="material-icons navigator-global-branch">&#xE5CB;</i>
    			        </div>
    			        <div class="navigatorSliderRight">
    			         <i class="material-icons navigator-global-branch">&#xE5CC;</i>
                        </div>

    			        <div class="navigator-slider"></div>

    			        <div class="navigatorSliderLeft">
    			            <i class="material-icons navigator-global-branch">&#xE5CB;</i>
    			        </div>
    			        <div class="navigatorSliderRight">
    			         <i class="material-icons navigator-global-branch">&#xE5CC;</i>
                        </div>

                    </div>
    			    `;

      if(self.type === "call-graph"){
        navigator = `
			        <div class = "w3-row">
    			        <div class="navigatorSliderLeft">
    			            <i class="material-icons navigator-global-branch">&#xE5CB;</i>
    			        </div>
    			        <div class="navigator-slider"></div>
    			        <div class="navigatorSliderRight">
    			         <i class="material-icons navigator-global-branch">&#xE5CC;</i>
                        </div>

                    </div>
    			    `;
      }

      $tooltip.html(navigator);
      $navigatorSlider = $tooltip.find(self.sliderSelector);

      self.navigatorSliderValue = 0;
      $navigatorSlider.slider({
        slide: function navigatorSliderChange(event, ui) {
          if (self.navigatorSliderValue !== ui.value) {
            let indexInTimeline = self.timelineIndexes[ui.value];
            self.eventAggregator.publish("traceNavigationPrepareChange", {
              branchIndex: ui.value,
              branchTotal: self.branchTotal,
              indexInTimeline: indexInTimeline,
              entry: self.currentEntry,
              row: self.currentRow
            });
            self.navigatorSliderValue = ui.value;
          }
        }
      });

      $navigatorSlider.show();

      $tooltip.find(self.sliderLeftSelector).click(function navigatorSliderLeftClick(event) {
        let value = $navigatorSlider.slider('value') - 1;
        $navigatorSlider.slider('value', value);
        if ($navigatorSlider.slider('value') === value) {
          let indexInTimeline = self.timelineIndexes[value];
          self.eventAggregator.publish("traceNavigationPrepareChange", {
            branchIndex: value,
            branchTotal: self.branchTotal,
            indexInTimeline: indexInTimeline,
            entry: self.currentEntry,
            row: self.currentRow
          });
          self.navigatorSliderValue = value;
        }
      });
      // $(self.sliderLeftSelector).show();

      $tooltip.find(self.sliderRightSelector).click(function navigatorSliderRightClick(event) {
        let value = $navigatorSlider.slider('value') + 1;
        $navigatorSlider.slider('value', value);
        if ($navigatorSlider.slider('value') === value) {
          let indexInTimeline = self.timelineIndexes[value];
          self.eventAggregator.publish("traceNavigationPrepareChange", {
            branchIndex: value,
            branchTotal: self.branchTotal,
            indexInTimeline: indexInTimeline,
            entry: self.currentEntry,
            row: self.currentRow
          });
          self.navigatorSliderValue = value;
        }
      });
      // $(self.sliderRightSelector).show();
      $tooltip.hide();

      self.$hideTooltip = function $hideTooltip(){

        if (self.$tooltip && !self.$tooltip.is(":animated")) {
          self.currentRow = null;
          self.$tooltip.hide("slide", {direction: "down"}, self.slideTime);
          self.eventAggregator.publish("branchNavigatorChange", {isVisible: false});
        }
      };

      $tooltip.mouseenter(function gutterTooltipMouseEnter() {
        clearTimeout(self.mouseMoveTimeout);
        if (!$tooltip.is(":visible")) {
          self.$showTooltip();
        }
      }).mouseleave(function gutterTooltipMouseLeave() {
          clearTimeout(self.mouseMoveTimeout);
          self.mouseMoveTimeout =
            setTimeout(self.$hideTooltip, self.hideDelay);
        });
    }


    self.update$Tooltip = function update$GutterTooltip(position, rowData, row, lineHeight) {
      if (!$tooltip) {
        return;
      }

      if(self.type === "call-graph"){
        let branchModel = self.traceViewModel.branchModel;
        let dataModel = branchModel.traceGutterData;
        if (dataModel.rows.hasOwnProperty(row)) {
          rowData = dataModel.rows[row];
          // setTooltipMouseMove(target, row, position, rowData);
        }
      }
      self.currentRow = row;
      if (rowData && rowData.UI.branchTotal) {
        let count = rowData.UI.branchTotal;
        let branch = rowData.UI.branchIndex;
        let timelineIndexes = rowData.timelineIndexes;
        self.currentEntry = rowData;


        if (rowData.gutterDecorationClassName === self.gutterDecorationClassNames.branchGlobal) {
          $(self.tooltipSelector + " i.material-icons").removeClass("navigator-local-branch").addClass("navigator-global-branch");
        } else {
          $(self.tooltipSelector + " i.material-icons").removeClass("navigator-global-branch").addClass("navigator-local-branch");
        }

        let $aceEditor$Width = 300;
        let buttonCount = 2.3;
        if(self.type === "gutter"){
          $aceEditor$Width = $("#aceJsEditorDiv").width();
          buttonCount =  4;
        }

        $tooltip.width($aceEditor$Width);

        $(`${self.tooltipSelector} > div`).height(lineHeight);

        $(`${self.tooltipSelector} > div > div`).height(lineHeight);

        $(`${self.tooltipSelector} > div > div > i`).css({
          "line-height": `${lineHeight - 2}px`,
          "padding-top": `1px`
        });

        $navigatorSlider.css({
          height: `${lineHeight - 4}px`,
          top: `-${lineHeight / 2}px`
        });
        let $button$Width = 31;// todo get the actual value
        $navigatorSlider.width($aceEditor$Width - $button$Width * buttonCount);

        $navigatorSlider.slider('option', {min: 1, max: count, value: branch});
        self.branchTotal = count;
        self.branchIndex = branch;
        self.timelineIndexes = timelineIndexes;

        if (position) {
          $tooltip.css({
            height: `${lineHeight}px`,
            top: `${position.pageY}px`,
            left: `${position.pageX}px`
          });
          // console.log(position);
        }
        if (!$tooltip.is(":visible") || $tooltip.is(":animated")) {
          if (self.previousRow) {
            self.jsEditor.editor.getSession().removeGutterDecoration(self.previousRow, "seecoderun-gutter-decoration-active");
          }
          self.$showTooltip();
          $tooltip.mouseenter();
        }
      } else {
        let isTooltipHovered = !!$($tooltip).filter(function () {
          return $(this).is(":hover");
        }).length;
        if (!isTooltipHovered) {
          clearTimeout(self.mouseMoveTimeout);
          self.mouseMoveTimeout =
            setTimeout(self.$hideTooltip, self.hideDelay);
        }
      }
      self.previousRow = row;
    };


  }

  cleanGutterUI() {
    if (!this.jsEditor) {
      return;
    }
    this.$hideTooltip();
    $(`${this.jsEditorSelector} .ace_gutter-cell`).off("mouseenter mouseleave");
    for (let key in this.gutterDecorationClassNames) {
      if (this.gutterDecorationClassNames.hasOwnProperty(key)) {
        let gutterDecorationClassName = this.gutterDecorationClassNames[key];
        this.aceUtils.removeAllGutterDecorations(this.editor, gutterDecorationClassName);
        $(`${this.jsEditorSelector}.ace_gutter-cell`).removeClass(gutterDecorationClassName);
      }
    }
    this.traceViewModel.resetTraceGutterDataRows();
  }

  $showTooltip(isForceShow = false) {
    if (this.$tooltip && (!this.$tooltip.is(":animated" || isForceShow))) {
      this.$tooltip.show("slide", {direction: "down"}, this.slideTime);
      this.eventAggregator.publish("branchNavigatorChange", {isVisible: true});
    }
  }

  setAceMarkerManager(editor) {
    this.disableMarkerManager = this.aceUtils.makeAceMarkerManager(editor);
    this.disableMarkerManager.markerRenderer = this.aceUtils.getAvailableMarkers().disableMarker;
    this.disableMarkerManager.markerType = "line";
    this.disableMarkerManager.inFront = true;

    this.transparentMarkerManager = this.aceUtils.makeAceMarkerManager(editor);
    this.transparentMarkerManager.markerRenderer = this.aceUtils.getAvailableMarkers().transparentMarker;
    this.transparentMarkerManager.markerType = "line";
    this.transparentMarkerManager.inFront = true;

    this.branchGlobalMarkerManager = this.aceUtils.makeAceMarkerManager(editor);
    this.branchGlobalMarkerManager.markerRenderer = this.aceUtils.getAvailableMarkers().branchGlobalMarker;
    this.branchGlobalMarkerManager.markerType = "line";
    this.branchGlobalMarkerManager.inFront = false;

    this.branchLocalMarkerManager = this.aceUtils.makeAceMarkerManager(editor);
    this.branchLocalMarkerManager.markerRenderer = this.aceUtils.getAvailableMarkers().branchLocalMarker
    this.branchLocalMarkerManager.markerType = "line";
    this.branchLocalMarkerManager.inFront = false;
  }
}
