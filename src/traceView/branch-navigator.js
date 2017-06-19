/* global $ */
import {TracePlayer} from '../tracePlayer/trace-player';
import {AceUtils} from '../utils/ace-utils';

export class BranchNavigator {
  gutterTooltipId = "gutterTooltip";
  gutterTooltipSelector = "#gutterTooltip";
  resetNavigationBoxSelector = "#resetNavigationBox";
  gutterNavigatorSliderLeftSelector = ".gutterNavigatorSliderLeft";
  gutterNavigatorSliderRightSelector = ".gutterNavigatorSliderRight";
  gutterNavigatorSliderSelector = ".gutterNavigatorSlider";
  callGraphNavigatorSliderSelector = ".callGraphNavigatorSlider";
  gutterTooltipSlideTime = 50;
  gutterTooltipShowDelay = 50;
  gutterTooltipHideDelay = 500;
  aceGutterCellSelector = ".ace_gutter-cell";
  gutterDecorationClassNames = {
    branchGlobal: "seecoderun-gutter-decoration-branch-global",
    branchLocal: "seecoderun-gutter-decoration-branch-local"
  };

  constructor(eventAggregator, aceUtils, jsEditor, traceViewModel) {
    this.eventAggregator = eventAggregator;
    this.aceUtils = aceUtils;
    this.jsEditor = jsEditor;
    this.traceViewModel = traceViewModel;
    this.tracePlayer = new TracePlayer(eventAggregator, aceUtils);
    this.aceUtils = new AceUtils();
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

    this.attachGutterTooltip();

    aceUtils.setTraceGutterRenderer(editor, branchModel.traceGutterData);
    aceUtils.setCustomGutterUpdate(editor);
    aceUtils.subscribeToGutterEvents(this.eventAggregator, editor, gutterDecorationClassNames, branchModel.traceGutterData, this.aceGutterCellSelector);
    $(this.resetNavigationBoxSelector).click(function resetNavigationBoxClick() {
      self.eventAggregator.publish("branchNavigatorReset", {indexInTimeline: 0});
    });

    this.tracePlayer.attached();
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
            console.log("navigating ", navigationDatum.branchIndex, navigationDatum.branchTotal, navigationDatum);

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

        if (this.$gutterTooltip.is(":visible")) {
          let currentTop = this.$gutterTooltip.css("top");
          currentTop = currentTop.replace("px", "");
          this.$gutterTooltip.css({
            top: `${parseInt(currentTop, 10) + this.jsGutterScrollTopDelta}px`
          });
        }
      }
    );

    let setTooltipMouseMoveForGutter = function setTooltipMouseMove(target, row, pixelPosition, rowData) {
      $(target).mouseenter(function onMouseEnterGutterCell() {
        clearTimeout(self.gutterTooltipHideTimeout);
        self.previousRow = row;
        self.update$GutterTooltip(pixelPosition, rowData, row, editor.renderer.lineHeight);
      }).mouseleave(function onMouseLeaveGutterCell() {
        clearTimeout(self.gutterTooltipHideTimeout);
        self.gutterTooltipHideTimeout =
          setTimeout(function gutterTooltipHideTimeout() {
            self.previousRow = null;
            self.update$GutterTooltip(pixelPosition, null, row, editor.renderer.lineHeight);
          }, self.gutterTooltipHideDelay);
        $(target).off("mouseenter mouseleave");
      });
      $(target).mouseenter();
    };

    eventAggregator.subscribe("showBranchNavigator", payload => {
      if (payload.context === "gutter") {
        setTooltipMouseMoveForGutter(payload.target, payload.row, payload.pixelPosition, payload.rowData);
      } else {
        self.update$GraphTooltip(payload.pixelPosition, null, payload.row, 14)
      }
    });

    eventAggregator.subscribe("hideBranchNavigator", payload => {

    });
  }

  attachGutterTooltip() {
    let self = this;
    let tooltip = document.getElementById(this.gutterTooltipId);
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.setAttribute('id', self.gutterTooltipId);
      document.body.appendChild(tooltip);
    }
    self.$gutterTooltip = $(tooltip);

    self.gutterMouseMoveTimeout = null;

    let gutterMouseMoveUpdateTooltipTimeout = function gutterMouseMoveUpdateTooltipTimeout() {
      self.$hideTooltip();
    };


    self.update$GraphTooltip = function update$GraphTooltip(position, rowData, row, lineHeight) {
      let $gutterTooltip = self.$gutterTooltip;
      if (!$gutterTooltip) {
        return;
      }
      let branchModel = self.traceViewModel.branchModel;
      let dataModel = branchModel.traceGutterData;
      if (dataModel.rows.hasOwnProperty(row)) {
        rowData = dataModel.rows[row];
        // setTooltipMouseMove(target, row, position, rowData);
      }

      self.currentRow = row;
      if (rowData && rowData.UI.branchTotal) {
        let count = rowData.UI.branchTotal;
        let branch = rowData.UI.branchIndex;
        let timelineIndexes = rowData.timelineIndexes;
        self.currentEntry = rowData;
        let $gutterNavigatorSlider = $(self.callGraphNavigatorSliderSelector);

        if (!$gutterNavigatorSlider.length) {
          let navigator = `
			        <div class = "w3-row">
    			        <div class="gutterNavigatorSliderLeft">
    			            <i class="material-icons navigator-global-branch">&#xE5CB;</i>
    			        </div>
    			        <div class="gutterNavigatorSliderRight">
    			         <i class="material-icons navigator-global-branch">&#xE5CC;</i>
                        </div>

    			        <div class="gutterNavigatorSlider"></div>
                </div>
    			    `;
          $gutterTooltip.html(navigator);

          $gutterNavigatorSlider = $(self.gutterNavigatorSliderSelector);

          self.gutterNavigatorSliderValue = 0;
          $gutterNavigatorSlider.slider({
            slide: function gutterNavigatorSliderChange(event, ui) {
              if (self.gutterNavigatorSliderValue !== ui.value) {
                let indexInTimeline = self.timelineIndexes[ui.value];
                self.eventAggregator.publish("traceNavigationPrepareChange", {
                  branchIndex: ui.value,
                  branchTotal: self.branchTotal,
                  indexInTimeline: indexInTimeline,
                  entry: self.currentEntry,
                  row: self.currentRow
                });
                self.gutterNavigatorSliderValue = ui.value;
              }
            }
          });

          $gutterNavigatorSlider.show();

          $(self.gutterNavigatorSliderLeftSelector).click(function gutterNavigatorSliderLeftClick(event) {
            let value = $gutterNavigatorSlider.slider('value') - 1;
            $gutterNavigatorSlider.slider('value', value);
            if ($gutterNavigatorSlider.slider('value') === value) {
              let indexInTimeline = self.timelineIndexes[value];
              self.eventAggregator.publish("traceNavigationPrepareChange", {
                branchIndex: value,
                branchTotal: self.branchTotal,
                indexInTimeline: indexInTimeline,
                entry: self.currentEntry,
                row: self.currentRow
              });
              self.gutterNavigatorSliderValue = value;
            }
          });
          $(self.gutterNavigatorSliderLeftSelector).show();

          $(self.gutterNavigatorSliderRightSelector).click(function gutterNavigatorSliderRightClick(event) {
            let value = $gutterNavigatorSlider.slider('value') + 1;
            $gutterNavigatorSlider.slider('value', value);
            if ($gutterNavigatorSlider.slider('value') === value) {
              let indexInTimeline = self.timelineIndexes[value];
              self.eventAggregator.publish("traceNavigationPrepareChange", {
                branchIndex: value,
                branchTotal: self.branchTotal,
                indexInTimeline: indexInTimeline,
                entry: self.currentEntry,
                row: self.currentRow
              });
              self.gutterNavigatorSliderValue = value;
            }
          });
          $(self.gutterNavigatorSliderRightSelector).show();
          $gutterTooltip.hide();
          $gutterTooltip.mouseenter(function gutterTooltipMouseEnter() {
            clearTimeout(self.gutterMouseMoveTimeout);
            if (!$gutterTooltip.is(":visible")) {
              self.$showTooltip();
            }
          })
            .mouseleave(function gutterTooltipMouseLeave() {
              clearTimeout(self.gutterMouseMoveTimeout);
              self.gutterMouseMoveTimeout =
                setTimeout(gutterMouseMoveUpdateTooltipTimeout, self.gutterTooltipHideDelay);
            });
        }

        if (rowData.gutterDecorationClassName === self.gutterDecorationClassNames.branchGlobal) {
          $(self.gutterTooltipSelector + " i.material-icons").removeClass("navigator-local-branch").addClass("navigator-global-branch");
        } else {
          $(self.gutterTooltipSelector + " i.material-icons").removeClass("navigator-global-branch").addClass("navigator-local-branch");
        }

        let $aceEditor$Width = $("#aceJsEditorDiv").width();

        $("#gutterTooltip").width($aceEditor$Width);

        $("#gutterTooltip > div").height(lineHeight);

        $("#gutterTooltip > div > div").height(lineHeight);

        $("#gutterTooltip > div > div > i").css({
          "line-height": `${lineHeight - 2}px`,
          "padding-top": `1px`
        });

        $gutterNavigatorSlider.css({
          height: `${lineHeight - 4}px`,
          top: `-${lineHeight / 2}px`
        });
        let $button$Width = 31;// todo get the actual value
        $gutterNavigatorSlider.width($aceEditor$Width - $button$Width * 4);

        $gutterNavigatorSlider.slider('option', {min: 1, max: count, value: branch});
        self.branchTotal = count;
        self.branchIndex = branch;
        self.timelineIndexes = timelineIndexes;
        if (position) {
          $gutterTooltip.css({
            height: `${lineHeight}px`,
            top: `${position.pageY}px`,
            left: `${position.pageX}px`
          });
        }
        if (!$gutterTooltip.is(":visible") || $gutterTooltip.is(":animated")) {
          if (self.previousRow) {
            self.jsEditor.editor.getSession().removeGutterDecoration(self.previousRow, "seecoderun-gutter-decoration-active");
          }
          self.$showTooltip();
          $gutterTooltip.mouseenter();
        }
      } else {
        let isGutterTooltipHovered = !!$($gutterTooltip).filter(function () {
          return $(this).is(":hover");
        }).length;
        if (!isGutterTooltipHovered) {
          clearTimeout(self.gutterMouseMoveTimeout);
          self.gutterMouseMoveTimeout =
            setTimeout(gutterMouseMoveUpdateTooltipTimeout, self.gutterTooltipHideDelay);
        }
      }
      self.previousRow = row;
    };


    self.update$GutterTooltip = function update$GutterTooltip(position, rowData, row, lineHeight) {
      let $gutterTooltip = self.$gutterTooltip;
      if (!$gutterTooltip) {
        return;
      }
      console.log(arguments);
      self.currentRow = row;
      if (rowData && rowData.UI.branchTotal) {
        let count = rowData.UI.branchTotal;
        let branch = rowData.UI.branchIndex;
        let timelineIndexes = rowData.timelineIndexes;
        self.currentEntry = rowData;
        let $gutterNavigatorSlider = $(self.gutterNavigatorSliderSelector);

        if (!$gutterNavigatorSlider.length) {
          let navigator = `
			        <div class = "w3-row">
    			        <div class="gutterNavigatorSliderLeft">
    			            <i class="material-icons navigator-global-branch">&#xE5CB;</i>
    			        </div>
    			        <div class="gutterNavigatorSliderRight">
    			         <i class="material-icons navigator-global-branch">&#xE5CC;</i>
                        </div>

    			        <div class="gutterNavigatorSlider"></div>

    			        <div class="gutterNavigatorSliderLeft">
    			            <i class="material-icons navigator-global-branch">&#xE5CB;</i>
    			        </div>
    			        <div class="gutterNavigatorSliderRight">
    			         <i class="material-icons navigator-global-branch">&#xE5CC;</i>
                        </div>

                    </div>
    			    `;
          $gutterTooltip.html(navigator);

          $gutterNavigatorSlider = $(self.gutterNavigatorSliderSelector);

          self.gutterNavigatorSliderValue = 0;
          $gutterNavigatorSlider.slider({
            slide: function gutterNavigatorSliderChange(event, ui) {
              if (self.gutterNavigatorSliderValue !== ui.value) {
                let indexInTimeline = self.timelineIndexes[ui.value];
                self.eventAggregator.publish("traceNavigationPrepareChange", {
                  branchIndex: ui.value,
                  branchTotal: self.branchTotal,
                  indexInTimeline: indexInTimeline,
                  entry: self.currentEntry,
                  row: self.currentRow
                });
                self.gutterNavigatorSliderValue = ui.value;
              }
            }
          });

          $gutterNavigatorSlider.show();

          $(self.gutterNavigatorSliderLeftSelector).click(function gutterNavigatorSliderLeftClick(event) {
            let value = $gutterNavigatorSlider.slider('value') - 1;
            $gutterNavigatorSlider.slider('value', value);
            if ($gutterNavigatorSlider.slider('value') === value) {
              let indexInTimeline = self.timelineIndexes[value];
              self.eventAggregator.publish("traceNavigationPrepareChange", {
                branchIndex: value,
                branchTotal: self.branchTotal,
                indexInTimeline: indexInTimeline,
                entry: self.currentEntry,
                row: self.currentRow
              });
              self.gutterNavigatorSliderValue = value;
            }
          });
          $(self.gutterNavigatorSliderLeftSelector).show();

          $(self.gutterNavigatorSliderRightSelector).click(function gutterNavigatorSliderRightClick(event) {
            let value = $gutterNavigatorSlider.slider('value') + 1;
            $gutterNavigatorSlider.slider('value', value);
            if ($gutterNavigatorSlider.slider('value') === value) {
              let indexInTimeline = self.timelineIndexes[value];
              self.eventAggregator.publish("traceNavigationPrepareChange", {
                branchIndex: value,
                branchTotal: self.branchTotal,
                indexInTimeline: indexInTimeline,
                entry: self.currentEntry,
                row: self.currentRow
              });
              self.gutterNavigatorSliderValue = value;
            }
          });
          $(self.gutterNavigatorSliderRightSelector).show();
          $gutterTooltip.hide();
          $gutterTooltip.mouseenter(function gutterTooltipMouseEnter() {
            clearTimeout(self.gutterMouseMoveTimeout);
            if (!$gutterTooltip.is(":visible")) {
              self.$showTooltip();
            }
          })
            .mouseleave(function gutterTooltipMouseLeave() {
              clearTimeout(self.gutterMouseMoveTimeout);
              self.gutterMouseMoveTimeout =
                setTimeout(gutterMouseMoveUpdateTooltipTimeout, self.gutterTooltipHideDelay);
            });
        }

        if (rowData.gutterDecorationClassName === self.gutterDecorationClassNames.branchGlobal) {
          $(self.gutterTooltipSelector + " i.material-icons").removeClass("navigator-local-branch").addClass("navigator-global-branch");
        } else {
          $(self.gutterTooltipSelector + " i.material-icons").removeClass("navigator-global-branch").addClass("navigator-local-branch");
        }

        let $aceEditor$Width = $("#aceJsEditorDiv").width();

        $("#gutterTooltip").width($aceEditor$Width);

        $("#gutterTooltip > div").height(lineHeight);

        $("#gutterTooltip > div > div").height(lineHeight);

        $("#gutterTooltip > div > div > i").css({
          "line-height": `${lineHeight - 2}px`,
          "padding-top": `1px`
        });

        $gutterNavigatorSlider.css({
          height: `${lineHeight - 4}px`,
          top: `-${lineHeight / 2}px`
        });
        let $button$Width = 31;// todo get the actual value
        $gutterNavigatorSlider.width($aceEditor$Width - $button$Width * 4);

        $gutterNavigatorSlider.slider('option', {min: 1, max: count, value: branch});
        self.branchTotal = count;
        self.branchIndex = branch;
        self.timelineIndexes = timelineIndexes;
        if (position) {
          $gutterTooltip.css({
            height: `${lineHeight}px`,
            top: `${position.pageY}px`,
            left: `${position.pageX}px`
          });
        }
        if (!$gutterTooltip.is(":visible") || $gutterTooltip.is(":animated")) {
          if (self.previousRow) {
            self.jsEditor.editor.getSession().removeGutterDecoration(self.previousRow, "seecoderun-gutter-decoration-active");
          }
          self.$showTooltip();
          $gutterTooltip.mouseenter();
        }
      } else {
        let isGutterTooltipHovered = !!$($gutterTooltip).filter(function () {
          return $(this).is(":hover");
        }).length;
        if (!isGutterTooltipHovered) {
          clearTimeout(self.gutterMouseMoveTimeout);
          self.gutterMouseMoveTimeout =
            setTimeout(gutterMouseMoveUpdateTooltipTimeout, self.gutterTooltipHideDelay);
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

  $hideTooltip() {
    if (this.$gutterTooltip && !this.$gutterTooltip.is(":animated")) {
      this.currentRow = null;
      this.$gutterTooltip.hide("slide", {direction: "down"}, this.gutterTooltipSlideTime);
      this.eventAggregator.publish("branchNavigatorChange", {isVisible: false});
    }
  }

  $showTooltip(isForceShow = false) {
    if (this.$gutterTooltip && (!this.$gutterTooltip.is(":animated" || isForceShow))) {
      this.$gutterTooltip.show("slide", {direction: "down"}, this.gutterTooltipSlideTime);
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
