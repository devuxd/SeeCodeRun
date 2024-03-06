import {monacoProps} from "../../../utils/monacoUtils";
// export function setContentWidgetDomNodeStyle(domNode, className, style) {
//    if(className??false){
//       domNode.className = className;
//    }
//
//    for (let prop in (style??{})) {
//       domNode.style[prop] = style[prop];
//    }
//
//    return domNode;
// }
export const styleContentWidgetDomNodeHover = (domNode, hoverClassName = null) => {
    if (hoverClassName) {
        domNode.style.removeProperty("background-color");
        domNode.className = hoverClassName;
        return;
    }

    domNode.style.backgroundColor = monacoProps.widgetBackgroundColor;
    domNode.className = "";
};

export function styleContentWidgetDomNode(domNode/*, ...rest*/) {
    domNode.style.overflow = 'hidden';
    domNode.style.whiteSpace = 'nowrap';
    domNode.style.marginTop = `-${monacoProps.widgetOffsetHeight}px`;
    domNode.style.height = `${monacoProps.widgetMaxHeight}px`;
    domNode.style.maxHeight = `${monacoProps.widgetMaxHeight}px`;
    domNode.style.minWidth = `${monacoProps.widgetMinWidth}px`;
    domNode.style.fontSize = `${monacoProps.widgetFontSize}px`;
    styleContentWidgetDomNodeHover(domNode);
    // return setContentWidgetDomNodeStyle(domNode,...rest);
};

export class SyntaxWidget {
    allowEditorOverflow = false;
    suppressMouseDown = true;
    contentWidgetManager = null;
    id = null;
    locLiveZoneActiveDecoration = null;
    domNode = null;
    position = null;
    prevDomRect = null;

    constructor(contentWidgetManager, id, locLiveZoneActiveDecoration) {
        this.id = id;
        this.updateRefs(contentWidgetManager, locLiveZoneActiveDecoration);
    }

    updateRefs(contentWidgetManager, locLiveZoneActiveDecoration) {
        this.contentWidgetManager = contentWidgetManager;
        this.locLiveZoneActiveDecoration = locLiveZoneActiveDecoration;
    }

    getId = () => {
        //console.log("getId",this.id, this.contentWidgetManager, this.locLiveZoneActiveDecoration)
        return this.id;
    };

    getContentWidgetManager = () => {
        return this.contentWidgetManager;
    };

    getLocLiveZoneActiveDecoration = () => {
        return this.locLiveZoneActiveDecoration;
    };

    mouseMove = () => {
        this.getContentWidgetManager()?.resolveMouseActionMouseMoveByWidgetId(this.getId());
    };

    mouseDown = () => {
        this.getContentWidgetManager()?.resolveMouseActionMouseDownByWidgetId(this.getId());
    };

    mouseLeave = () => {
        this.getContentWidgetManager()?.resolveMouseActionMouseLeaveByWidgetId(this.getId());
    };

    getRange = () => {
        const {editor} = this.contentWidgetManager;
        return editor.getModel()?.getDecorationRange(this.getId());
    };

    startPosition = () => {
        const {
            getRange,
            position: currentPosition, preference
        } = this;

        const position = getRange()?.getStartPosition() ?? currentPosition;

        if (
            (!currentPosition && position) ||
            (position && !currentPosition.equals(position))) {
            this.position = position;
        }

        return position;
    };

    isPositionInVisibleRange = () => {
        const position = this.startPosition();
        if (!position) {
            return false;
        }

        const {editor} = this.contentWidgetManager;

        return !!editor?.getVisibleRanges().find(vr => vr.containsPosition(position));
    };

    getDomNode = () => {
        let {domNode, locLiveZoneActiveDecoration, getRange, startPosition} = this;

        if (!domNode) {
            this.domNode = document.createElement("div");
            domNode = this.domNode;
            styleContentWidgetDomNode(domNode);
            //todo: remove after debug
            domNode.dataset.type = locLiveZoneActiveDecoration?.syntaxFragment?.type();
            if(domNode.dataset.type === "CallExpression"){
                // console.log("SyntaxWidget", this, locLiveZoneActiveDecoration);
            }
            // domNode.dataset.sourceTextFocus = locLiveZoneActiveDecoration?.syntaxFragment?.sourceTextFocus;
            // domNode.dataset.sourceText = locLiveZoneActiveDecoration?.syntaxFragment?.sourceText;
            // domNode.dataset.range = JSON.stringify(getRange());
            // domNode.dataset.startPosition = JSON.stringify(startPosition());

        }

        // console.log("getDomNode", domNode);

        return domNode;
    };
    getPosition = () => {
        const {
            isPositionInVisibleRange, startPosition, contentWidgetManager
        } = this;

        const {preference} = contentWidgetManager;

        if (!isPositionInVisibleRange()) {
            return null;
        }

        const position = startPosition();

        // console.log("getPosition", this.domNode, {
        //     position,
        //     preference
        // });

        return {
            position,
            preference
        };

    };

    domRects = () => {
        const {getDomNode, prevDomRect} = this;

        const domRect = getDomNode()?.getBoundingClientRect();

        const rects = [];

        if (prevDomRect) {
            rects.push(prevDomRect);
        }

        if (domRect) {
            rects.push(domRect);
        }

        this.prevDomRect = domRect;

        return rects;

    };

    afterRender = () => {
        // console.log("afterRender", this.domNode);
        const {domRects, contentWidgetManager} = this;
        const {handleContentWidgetResize} = contentWidgetManager;
        // console.log("afterRender", this.domNode);

        handleContentWidgetResize(domRects());
    };

    hover = (hoverClassName) => {
        const {getDomNode} = this;
        styleContentWidgetDomNodeHover(getDomNode(), hoverClassName);
    };

};
