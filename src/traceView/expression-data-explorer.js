/* global $ */
/* global CollapsibleLists */
import {TreeViewExplorer} from "./tree-view-explorer";

export class ExpressionDataExplorer{
    editorTooltipSelector = "#editorTooltip";
    editorTooltipId = "editorTooltip";
    editorTooltipContentId = "editorTooltipContentId";
    viewportSelector = "#codeContent .ace_scroller";
    viewportPadding = -6;
    editorTooltipShowDelay = 750;
    editorTooltipHideDelay = 750;

    constructor(eventAggregator, aceUtils, aureliaEditor, traceViewModel){
        this.eventAggregator = eventAggregator;
        this.aceUtils = aceUtils;
        this.aureliaEditor = aureliaEditor;
        this.traceViewModel = traceViewModel;
    }

    attached(){
        let eventAggregator = this.eventAggregator;
        let aceUtils = this.aceUtils;
        let editor = this.aureliaEditor.editor;
        this.expressionMarkerManager = aceUtils.makeAceMarkerManager(editor);
        this.expressionMarkerManager.markerRenderer = aceUtils.getAvailableMarkers().expressionMarker;
        let $editorTooltip = $(this.editorTooltipSelector);

        if(!$editorTooltip.length){
          $editorTooltip = $(`<div id='${this.editorTooltipId}' />`);
          $editorTooltip.attr({
            "data-toggle": "popover",
            "data-placement": "bottom",
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
        $editorTooltip.on('shown.bs.popover', function(){
          CollapsibleLists.apply();
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

        this.update$Tooltip = function update$Tooltip(position, match){
          if(!$editorTooltip){
			        return;
			    }

  		    if(position){
  		        $editorTooltip.css({
  		            position: "absolute",
  		            marginLeft: 0,
  		            marginTop: 0,
  		            top: `${position.pageY}px`,
  		            left: `${position.pageX}px`
  		        });
  		    }

    			if(match && !self.isBranchNavigatorVisible){
    		      self.treeViewExplorer = new TreeViewExplorer(match.value);
              let popoverData = self.treeViewExplorer.getPopoverElementContent($editorTooltip);
              let popoverTitle =`Exploring <strong>${match.id !== null ? match.id: ""} :</strong> <i>${popoverData.type}</i>`;
    		      $editorTooltip.attr("data-content", `<div class="custom-popover-title">${popoverTitle}</div>${popoverData.content}`);

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
      let timeline  = this.traceHelper.getTimeline();
      let match =  timeline[indexInTimeline];
      if(match){
        this.eventAggregator.publish("expressionHovered", match);
      }
    }

    $showTooltip(indexInTimeline){
      this.handleIndexInTimeline(indexInTimeline);
    }

    $hideTooltip(indexInTimeline){
      if(this.$editorTooltip){
          this.$editorTooltip.popover("hide");
          this.aceUtils.updateAceMarkers(this.expressionMarkerManager, []);
      }
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
        "expressionDataExplorerHideTooltip", expressionDataExplorerData =>{
          this.isShowToolTipEvent = false;
          this.elementDecorator = expressionDataExplorerData.elementDecorator;
          this.$hideTooltip(expressionDataExplorerData.indexInTimeline);
          this.elementDecorator = null;
        }
      );

      eventAggregator.subscribe(
        "expressionDataExplorerShowTooltip", expressionDataExplorerData =>{
          this.isShowToolTipEvent = true;
          this.elementDecorator = expressionDataExplorerData.elementDecorator;
          this.$showTooltip(expressionDataExplorerData.indexInTimeline);
        }
      );
    }

    onExpressionHovered(match, pixelPosition){
      let isEditorTooltipContentVisible = $("#"+this.editorTooltipContentId).is(":visible");

      if(isEditorTooltipContentVisible && this.currentMatch === match){
        return;
      }

      this.currentMatch = match;

      let self = this;
      if(match){
          if(match.range){
             if(match.range){
                  clearTimeout(this.onExpressionHoveredTimeout);
                  this.onExpressionHoveredTimeout = setTimeout( function onExpressionHoveredTimeout(){
                      self.update$Tooltip(pixelPosition, match);
                     }, this.editorTooltipShowDelay);

              }
          }
      }else{
          clearTimeout(this.onExpressionHoveredTimeout);
          this.onExpressionHoveredTimeout = setTimeout( function onExpressionHoveredTimeout(){
              self.update$Tooltip();
          }, this.editorTooltipHideDelay);
      }
    }

    toJSON(node) {
    //https://gist.github.com/sstur/7379870
      var obj = {
        nodeType: node.nodeType
      };
      if (node.tagName) {
        obj.tagName = node.tagName.toLowerCase();
      } else
      if (node.nodeName) {
        obj.nodeName = node.nodeName;
      }
      if (node.nodeValue) {
        obj.nodeValue = node.nodeValue;
      }
      var attrs = node.attributes;
      if (attrs) {
        var length = attrs.length;
        var arr = obj.attributes = new Array(length);
        for (var i = 0; i < length; i++) {
          var attr = attrs[i];
          arr[i] = [attr.nodeName, attr.nodeValue];
        }
      }
      var childNodes = node.childNodes;
      if (childNodes) {
        length = childNodes.length;
        arr = obj.childNodes = new Array(length);
        for (i = 0; i < length; i++) {
          arr[i] = this.toJSON(childNodes[i]);
        }
      }
      return obj;
    }

    toDOM(obj) {
        // https://gist.github.com/sstur/7379870
      if (typeof obj == 'string') {
        obj = JSON.parse(obj);
      }
      var node, nodeType = obj.nodeType;
      switch (nodeType) {
        case 1: //ELEMENT_NODE
          node = document.createElement(obj.tagName);
          var attributes = obj.attributes || [];
          for (var i = 0, len = attributes.length; i < len; i++) {
            var attr = attributes[i];
            node.setAttribute(attr[0], attr[1]);
          }
          break;
        case 3: //TEXT_NODE
          node = document.createTextNode(obj.nodeValue);
          break;
        case 8: //COMMENT_NODE
          node = document.createComment(obj.nodeValue);
          break;
        case 9: //DOCUMENT_NODE
          node = document.implementation.createDocument();
          break;
        case 10: //DOCUMENT_TYPE_NODE
          node = document.implementation.createDocumentType(obj.nodeName);
          break;
        case 11: //DOCUMENT_FRAGMENT_NODE
          node = document.createDocumentFragment();
          break;
        default:
          return node;
      }
      if (nodeType == 1 || nodeType == 11) {
        var childNodes = obj.childNodes || [];
        for (i = 0, len = childNodes.length; i < len; i++) {
          node.appendChild(this.toDOM(childNodes[i]));
        }
      }
      return node;
    }

    stringify(obj, replacer, spaces, cycleReplacer) {
      return JSON.stringify(obj, this.serializer(replacer, cycleReplacer), spaces);
    }

    serializer(replacer, cycleReplacer) {
      var stack = [], keys = [];

      if (cycleReplacer == null){
          cycleReplacer = function(key, value) {
            if (stack[0] === value) return "[Circular ~]";
            return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]";
          };
      }

      return function(key, value) {
        if(stack.length > 0){
          var thisPos = stack.indexOf(this);
          ~thisPos ? stack.splice(thisPos + 1) : stack.push(this);
          ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key);
          if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value);
        }else{
            stack.push(value);
        }
        return replacer == null ? value : replacer.call(this, key, value);
      };
    }
}
