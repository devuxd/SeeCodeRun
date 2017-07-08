/* global $ */
import {TracePlayer} from '../tracePlayer/trace-player';
import {AceUtils} from '../utils/ace-utils';
import {NavigatorTooltip} from './navigator-tooltip';

export class BranchNavigator {
  gutterTooltipId = "gutterTooltip";
  callGraphTooltipId = "callGraphTooltip";
  resetNavigationBoxSelector = "#resetNavigationBox";

  constructor(eventAggregator, aceUtils, jsEditor, traceViewModel) {
    this.eventAggregator = eventAggregator;
    this.aceUtils = aceUtils;
    this.jsEditor = jsEditor;
    this.traceViewModel = traceViewModel;
    this.tracePlayer = new TracePlayer(eventAggregator, aceUtils);
    this.gutterNavigatorTooltip = new NavigatorTooltip("gutter", this.gutterTooltipId, eventAggregator, aceUtils, jsEditor, traceViewModel);
    this.callGraphNavigatorTooltip = new NavigatorTooltip("call-graph", this.callGraphTooltipId, eventAggregator, aceUtils, jsEditor, traceViewModel);
  }

  attached() {
    let self = this;
    $(this.resetNavigationBoxSelector).click(function resetNavigationBoxClick() {
      self.eventAggregator.publish("branchNavigatorReset", {indexInTimeline: 0});
    });
    this.tracePlayer.attached();
    this.callGraphNavigatorTooltip.attached();
    this.gutterNavigatorTooltip.attached();
  }
}
