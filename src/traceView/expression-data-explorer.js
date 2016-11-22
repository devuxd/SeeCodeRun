/* global $ */
/* global CollapsibleLists */
import {ObjectViewer} from "../utils/object-viewer";

export class ExpressionDataExplorer{
  editorTooltipSelector = "#editorTooltip";
  editorTooltipId = "editorTooltip";
  editorTooltipContentId = "editorTooltipContent";
  treeViewId = "treeViewContent";
  viewportSelector = "#codeContent .ace_scroller";
  viewportPadding = -6;
  editorTooltipShowDelay = 750;
  editorTooltipHideDelay = 750;
  content = "";

  constructor(eventAggregator, aceUtils, aureliaEditor, traceViewModel){
    this.eventAggregator = eventAggregator;
    this.aceUtils = aceUtils;
    this.aureliaEditor = aureliaEditor;
    this.traceViewModel = traceViewModel;
  }

  attached(){
    let self = this;
    let eventAggregator = this.eventAggregator;
    let aceUtils = this.aceUtils;
    let editor = this.aureliaEditor.editor;
    this.expressionMarkerManager = aceUtils.makeAceMarkerManager(editor);
    this.errorMarkerManager = aceUtils.makeAceMarkerManager(editor);
    this.logMarkerManager = aceUtils.makeAceMarkerManager(editor);
    this.expressionMarkerManager.markerRenderer = aceUtils.getAvailableMarkers().expressionMarker;
    this.errorMarkerManager.markerRenderer = aceUtils.getAvailableMarkers().errorMarker;
    this.logMarkerManager.markerRenderer = aceUtils.getAvailableMarkers().logMarker;

    let $editor = $(editor.renderer.getContainerElement());
    $editor.mouseleave(function aceEditorMouseleave(){
      eventAggregator.publish("expressionHovered");
    });

    let $editorTooltip = $(this.editorTooltipSelector);

    if(!$editorTooltip.length){
      $editorTooltip = $(`<div id='${this.editorTooltipId}' />`);
      $editorTooltip.attr({
        "data-toggle": "popover",
        "data-placement": "auto bottom",
        "data-content": "No value found."
      });
  		$editorTooltip.popover({
  		    viewport: {selector: this.viewportSelector, padding: this.viewportPadding},
  		    html: true,
  		    trigger: 'manual',
              template: '<div class="popover" role="tooltip"><div class="arrow"></div><div id = "'+this.editorTooltipContentId+'"><div class="popover-content"></div></div></div>'
  		});
    }

    $editorTooltip.appendTo('body');
    $editorTooltip.on('inserted.bs.popover', function(){
      let $popoverContentTreeViewContent = $("#" + self.editorTooltipContentId);
      $popoverContentTreeViewContent.html("");
      $popoverContentTreeViewContent.append(self.title);
      $popoverContentTreeViewContent.append(self.content);
      self.title = "";
      self.content = "";
      CollapsibleLists.apply();
      $('[data-toggle="tooltip"]').tooltip();
    });

    this.$editorTooltip = $editorTooltip;
    aceUtils.subscribeToExpressionHoverEvents(editor, eventAggregator, this);
    this.attachTooltipUpdate();
    this.subscribe();
  }

  decoratePopoverContentElement($popoverContentElement){
    if(!this.elementDecorator){
      return;
    }

    if(this.this.isShowToolTipEvent){
      this.elementDecorator.$decorate();
    }else{
      if(this.elementDecorator.$undecorate){
        this.elementDecorator.$undecorate();
      }
    }
  }

  attachTooltipUpdate(){
      let self = this;
      let $editorTooltip =   this.$editorTooltip;
      let aceUtils = this.aceUtils;

    this.update$Tooltip = function update$Tooltip(position, match, dimensions) {
        if(!$editorTooltip){
		        return;
		    }

		    if(position){
		        $editorTooltip.css({
		            position: "absolute",
		            marginLeft: 0,
		            marginTop: 0,
		            top: `${position.pageY}px`,
              left: `${position.pageX}px`,
              width: `${dimensions.width}`,
              height: `${dimensions.height}`
              ,
              "z-index": -1000

		        });
		    }

  			if(match && !self.isBranchNavigatorVisible){
          self.currentObjectViewer = new ObjectViewer(match.value, self.treeViewId);
          let popoverData = self.currentObjectViewer.generatePopoverTreeViewContent();
          let popoverTitle = `<strong>${match.id !== null ? match.id : ""} :</strong> <i>${self.currentObjectViewer.classType}</i>`;
          // $editorTooltip.attr("data-content", `<div class="custom-popover-title">${popoverTitle}</div>${popoverData.content}`);
          $editorTooltip.attr("data-content", "");
          self.title = `<div class="custom-popover-title">${popoverTitle}</div>`;
          self.content = popoverData.content;
            $editorTooltip.popover("show");
            aceUtils.updateAceMarkers(self.expressionMarkerManager, [match]);
  			}else{
  			    self.$hideTooltip();
  	    }
        let $popoverContentElement = $("#"+self.editorTooltipContentId);
        $popoverContentElement.mouseenter(
              function editorTooltipMouseenter(){
                  clearTimeout(self.onExpressionHoveredTimeout);
                  clearTimeout(self.editorTooltiptimeout);
              }
          ).mouseleave(
              function editorTooltipMouseleave(){
                  self.editorTooltiptimeout = setTimeout(function editorTooltiptimeout(){
                      self.$hideTooltip();
                  }, self.editorTooltipHideDelay);
              }
        );
        self.decoratePopoverContentElement($popoverContentElement);
    };
  }

  handleIndexInTimeline(indexInTimeline){
    if( indexInTimeline === null){
      return;
    }

    if(!this.traceViewModel.traceHelper){
      return;
    }

    let timeline  = this.traceViewModel.traceHelper.getTimeline();
    if(!timeline){
      return;
    }

    let match =  timeline[indexInTimeline];
    if(match){
      this.traceViewModel.branchModel.getNavigationStackBlockCountsByIndexInTimeline(indexInTimeline);
      this.eventAggregator.publish("expressionHovered", match);
    }
  }

  $showTooltip(match){
    match.id = "console.log";
    this.eventAggregator.publish("expressionHovered", match);
  }

  $hideTooltip(){
    let $popoverContentElement = $("#"+this.editorTooltipContentId);
    if(this.$editorTooltip && $popoverContentElement.length  && !$popoverContentElement.is(":hover")){
      this.content = "";
        this.$editorTooltip.popover("hide");
        this.aceUtils.updateAceMarkers(this.expressionMarkerManager, []);
        clearTimeout(this.onExpressionHoveredTimeout);
        clearTimeout(this.editorTooltiptimeout);
    }
  }

  $showError(data){
        this.aceUtils.updateAceMarkers(this.errorMarkerManager, [data]);
  }

  $hideError(causeRange){
        this.aceUtils.updateAceMarkers(this.errorMarkerManager, []);
  }

  subscribe(){
    let eventAggregator = this.eventAggregator;

    eventAggregator.subscribe(
      "branchNavigatorChange", branchNavigatorData => {
        this.isBranchNavigatorVisible = branchNavigatorData.isVisible;
        if(this.isBranchNavigatorVisible){
          this.$hideTooltip();
        }
    });

    eventAggregator.subscribe(
      "jsEditorCursorMoved", info => {
        this.selectedLine = info.cursor ||1;
        this.$hideTooltip();
    });

    eventAggregator.subscribe(
      "jsEditorPreChange", payload =>{
        this.$hideTooltip();
      }
    );

    eventAggregator.subscribe(
      "jsEditorChangeError", payload =>{
        this.$hideTooltip();
      }
    );

    eventAggregator.subscribe(
      "activeEditorChange", payload =>{
        this.$hideTooltip();
      }
    );

    eventAggregator.subscribe(
      "jsGutterChangeScrollTop", payload =>{
        this.$hideTooltip();
      }
    );

    eventAggregator.subscribe(
      "expressionDataExplorerHideTooltip", data =>{
        this.isShowToolTipEvent = false;
        this.elementDecorator = data.elementDecorator;

        switch(data.type){
          case "right-gutter":
            this.onExpressionHovered();
            break;
          case "player":
            this.$hideTooltip(data);
            break;
          case "error":
            this.$hideError(data);
            break;
          default:
            this.onExpressionHovered();
        }

        this.elementDecorator = null;
      }
    );

    eventAggregator.subscribe(
      "expressionDataExplorerShowTooltip", data =>{
        this.isShowToolTipEvent = true;
        this.elementDecorator = data.elementDecorator;
        switch(data.type){
          case "right-gutter":
            this.handleIndexInTimeline(data.indexInTimeline);
            break;
          case "player":
            this.handleIndexInTimeline(data.indexInTimeline);
            break;
          case "error":
            this.$showError(data);
            break;
          default:
            this.$showTooltip(data);
        }
      }
    );
  }

  onExpressionHovered(match, pixelPosition, dimensions) {
    let isEditorTooltipContentVisible = $("#"+this.editorTooltipContentId).is(":visible");

    if(isEditorTooltipContentVisible && this.currentMatch === match){
      return;
    }
    this.currentMatch = match;

    let self = this;
    if(match && match.range){
      clearTimeout(this.onExpressionHoveredTimeout);
      this.onExpressionHoveredTimeout = setTimeout( function onExpressionHoveredTimeout(){
        self.update$Tooltip(pixelPosition, match, dimensions);
      }, this.editorTooltipShowDelay);
    }else{
      clearTimeout(this.onExpressionHoveredTimeout);
      this.onExpressionHoveredTimeout = setTimeout( function onExpressionHoveredTimeout(){
        self.update$Tooltip();
      }, this.editorTooltipHideDelay);
    }
  }
}
