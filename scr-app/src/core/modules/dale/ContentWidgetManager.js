import debounce from 'lodash/debounce';
import isString from "lodash/isString";
import {sortedIndex, mouseActionTypes} from "./DALE"
import {LiveZoneDecorationStyles} from "../ALE";
import {SyntaxWidget} from "./SyntaxWidget";

export function sortedUniquePush(array, value, ...rest) {
    if (array.indexOf(value) < 0) {
        array.splice(sortedIndex(array, value, ...rest), 0, value);
    }
}

export default class ContentWidgetManager {
    // resizeDelay = 10;
    layoutAllDelay = 50;
    layoutAllOptions = {
        'maxWait': 150,
        'leading': true,
        'trailing': true
    };
    resolveMouseActionMouseDownDelay = 10;
    resolveMouseActionMouseMoveDelay = 50;
    resolveMouseActionMouseLeaveDelay = 40;
    contentWidgets = {};
    // pendingToResize = [];
    resolveMouseActionDecorationIds = [];
    lastMouseActionRange = null;
    editor = null;
    monaco = null;
    preference = null;
    // handleMouseActionDecoration = null;
    style = {
        minWidth: '8px',
        maxWidth: '600px',
    };
    pendingYs = {};
    tid = null;
    widgetGap = 4;
    widgetResizeDebounceTime = 10;

    constructor(
        editor, monaco
        // handleMouseActionDecoration
    ) {
        // console.log("ContentWidgetManager");
        this.editor = editor;
        this.monaco = monaco;
        this.preference = [monaco.editor.ContentWidgetPositionPreference.BELOW];
        // this.handleMouseActionDecoration = handleMouseActionDecoration;

        this.layoutAll = debounce(
            this._layoutAll,
            this.layoutAllDelay,
            this.layoutAllOptions,
        );

        // this._resize = debounce(
        //     this.resize,
        //     this.resizeDelay
        // );

        // this._resolveMouseActionReset = debounce(
        //     this.resolveMouseActionReset,
        //     this.resolveMouseActionLeaveDelay
        // );
        // //
        // // this._resolveMouseActionMoveEnter = debounce(
        // //     this.resolveMouseActionMove,
        // //     this.resolveMouseActionEnterDelay
        // // );
        //
        // this._resolveMouseActionMoveLeave = debounce(
        //     this.resolveMouseActionMove,
        //     this.resolveMouseActionLeaveDelay
        // );
    }


    layoutContentWidget = (contentWidget) => {
        return contentWidget && this.editor?.layoutContentWidget(contentWidget);
    };

    _layoutAll = () => {
        // const contentWidgets = this.getContentWidgets();
        // for (let id in contentWidgets) {
        //     this.layoutContentWidget(contentWidgets[id]);
        // }

        // console.log("layoutAll");

        const contentWidgets = Object.values(this.getContentWidgets());
        for (const contentWidget of contentWidgets) {
            // console.log("onDidChangeModelDecorations", contentWidget);
            this.layoutContentWidget(contentWidget);
        }

    };


    getContentWidgets = () => {
        return this.contentWidgets;
    };

    isContentWidgetIncludedInResize = (contentWidget) => {
        return contentWidget?.getDomNode?.()?.children?.length > 0;
    };

    widgetResize = () => {
        let layout = {};
        const contentWidgets = Object.values(this.getContentWidgets() ?? {});
        for (const contentWidget of contentWidgets) {
            if (!contentWidget) {
                continue;
            }

            const rect = contentWidget.getDomNode()?.getBoundingClientRect();
            if (!rect) {
                continue;
            }
            const {x = 0, y = 0, width = 0} = rect;
            layout[y] ??= {};
            layout[y][x] = {width, contentWidget};
        }

        console.log("widgetResize---------------------------------------------");

        Object.keys(this.pendingYs).forEach(y => {
            const ys = layout[y] ?? {};
            const xs = Object.keys(ys).sort((a, b) => +a - +b);
            // console.log(" Y needs resizing:", y, ys, xs);
            let previous = null;
            let lastIncludedI = xs.length - 1;
            let lastStyle = null;
            xs.forEach((x, i) => {
                const {width, contentWidget} = ys[x];
                if (!previous) {
                    if (this.isContentWidgetIncludedInResize(contentWidget)) {
                        previous = {x, width, contentWidget, i};
                    } else {

                    }

                    // console.log(
                    //     "resize",
                    //     { y, x, maxWidth: 0, previousEl: previous.contentWidget.domNode, currentEl: contentWidget.domNode, contentWidget }
                    // );
                    return;
                }

                if (!this.isContentWidgetIncludedInResize(contentWidget)) {
                    // console.log("empty", {contentWidget, y, x});
                    return;
                }

                const maxWidth = x - previous.x - this.widgetGap;

                // console.log(
                //     "resize", i,
                //     {
                //         y, x,
                //         maxWidth,
                //         previousEl: previous.contentWidget.getDomNode(),
                //         currentEl: contentWidget.getDomNode()
                //     }
                // );


                // console.log("previousDomNode", );

                const style = previous.contentWidget.getDomNode()?.style;
                if (style) {
                    style.maxWidth = `${maxWidth}px`;
                    // lastStyle = style;
                }

                previous = {x, width, contentWidget, i};
                // lastIncludedI = i;

            });

            // if (lastStyle) {
            //     lastStyle.maxWidth = `unset`;
            // }

            if (xs.length) {
                // const lastContentWidget = ys[xs[lastIncludedI]].contentWidget;
                const lastContentWidget = ys[xs[xs.length - 1]].contentWidget;
                if (this.isContentWidgetIncludedInResize(lastContentWidget)) {

                    const style = lastContentWidget.getDomNode()?.style;
                    if (style) {

                        style.maxWidth = `unset`;
                        // console.log("last", {lastContentWidget, lastIncludedI, maxWidth:style.maxWidth});
                    }
                }
            }

        });

        this.pendingYs = {};
    };

    debouncedWidgetResize = (domRect = {}) => {
        const {y = -1} = domRect;

        if (y < 0) {
            return;
        }

        this.pendingYs[y] = true;
        clearTimeout(this.tid);
        this.tid = setTimeout(this.widgetResize, this.widgetResizeDebounceTime);
    };

    handleContentWidgetResize = (domRects) => {
        // console.log("handleContentWidgetResize", domRects);
        for (const domRect of domRects) {
            if (domRect) {
                this.debouncedWidgetResize(domRect);
            }
        }
    };


    makeContentWidgets = (id, locLiveZoneActiveDecoration) => {
        // const contentWidget = new SyntaxWidget(
        //     this, id, locLiveZoneActiveDecoration
        // );
        // locLiveZoneActiveDecoration?.syntaxFragment.syntaxWidget(contentWidget);
        // return contentWidget;
        const newContentWidgets = [];

        if (!id) {
            // program type zone
            return newContentWidgets;
        }

        const contentWidget = new SyntaxWidget(
            this, id, locLiveZoneActiveDecoration
        );
        locLiveZoneActiveDecoration?.syntaxFragment.syntaxWidget(contentWidget);

        newContentWidgets.push(contentWidget);

        // if (locLiveZoneActiveDecoration.zone?.functionParams) {
        //     console.log("makeContentWidgets", {id, locLiveZoneActiveDecoration});
        // }

        return newContentWidgets;

        // use locLiveZoneActiveDecoration and its decoration id
        // let range = {...(locLiveZoneActiveDecoration?.syntaxFragment?.ranges?.[0] ??(editor.getModel()?.getDecorationRange(id)?? {}))};
        // range.getStartPosition = () => {
        //     const {
        //         startLineNumber = 1, startColumn = 1
        //     } = range;
        //     return new monaco.Position(startLineNumber, startColumn);
        // };
    };


    // filterTimelineDataVisibleWidgets = (timelineDataVisible) => {
    //
    //     if (!timelineDataVisible) {
    //         return [];
    //     }
    //
    //     const contentWidgets = this.getContentWidgets();
    //
    //     return Object.keys(timelineDataVisible)
    //         .filter(id => timelineDataVisible[id])
    //         .map(id => contentWidgets[id]);
    // };

    // calculateMaxWidthString = (right, left, minWidth) => {
    //     const maxWidth = parseFloat(right) - parseFloat(left);
    //     if (maxWidth > 0) {
    //         return `${
    //             Math.max(maxWidth, minWidth)
    //         }px`
    //     }
    //
    //     return null;
    // };

    // resize = (timelineDataVisible) => {
    //     this.doResize(this.pendingToResize);
    //     this.pendingToResize = [];
    //     this.doResize(this.filterTimelineDataVisibleWidgets(timelineDataVisible));
    // };
    //
    // doResize = (contentWidgetsArray) => {
    //     const lineNodes = {};
    //     contentWidgetsArray.forEach((contentWidget) => {
    //         const domNode = contentWidget?.getDomNode();
    //         const domNodeStyle = domNode?.style;
    //         if (domNodeStyle) {
    //             if (lineNodes[domNodeStyle.top]) {
    //                 sortedUniquePush(
    //                     lineNodes[domNodeStyle.top], domNode, "style", "left"
    //                 );
    //             } else {
    //                 lineNodes[domNodeStyle.top] = [domNode];
    //             }
    //         }
    //     })
    //
    //     const minWidth = parseFloat(this.style.minWidth);
    //
    //     for (let top in lineNodes) {
    //         let leftDomNode = null;
    //         lineNodes[top].forEach((rightDomNode) => {
    //             if (leftDomNode) {
    //                 const maxWidthString = this.calculateMaxWidthString(
    //                     rightDomNode.style.left,
    //                     leftDomNode.style.left,
    //                     minWidth
    //                 );
    //
    //                 if (maxWidthString) {
    //                     // console.log(">>" + top, leftDomNode, rightDomNode, maxWidth);
    //                     leftDomNode.style.maxWidth = maxWidthString;
    //                     leftDomNode = rightDomNode;
    //                 }
    //             } else {
    //                 leftDomNode = rightDomNode;
    //             }
    //         });
    //
    //         // if (rightDomNode) {
    //         //    console.log(">>" + top + '>>last', leftDomNode, rightDomNode);
    //         //    rightDomNode.style.maxWidth = this.style.maxWidth;
    //         // }
    //     }
    // };

    // pendingToResizePush = (entry) => {
    //     this._resize();
    //     return this.pendingToResize.push(entry);
    // };

    // resolveMouseActionMove = (currentRange, mouseActionDecorations) => {
    //     console.log("resolveMouseActionMove", {currentRange, mouseActionDecorations});
    //     this.lastMouseActionRange = currentRange;
    //     this.resolveMouseActionDecorationIds =
    //         this.editor.deltaDecorations(
    //             this.resolveMouseActionDecorationIds,
    //             mouseActionDecorations
    //         );
    // };
    //
    // resolveMouseActionReset = () => {
    //     console.log("resolveMouseActionReset");
    //     this.resolveMouseActionDecorationIds =
    //         this.editor.deltaDecorations(
    //             this.resolveMouseActionDecorationIds,
    //             []
    //         );
    // };

    widgetById = (id) => {
        let contentWidget = this.contentWidgets[id];

        if (contentWidget) {
            return contentWidget;
        }

        if (this.editor._contentWidgets?.hasOwnProperty(id)) {
            contentWidget = this.editor._contentWidgets[id]?.widget;

            if (contentWidget) {
                this.contentWidgets[id] = contentWidget;
                return contentWidget;
            }
        }

        return null;
    };

    // removeWidgetById = (id) => {
    //     const contentWidget = this.getContentWidgets()[id];
    //     contentWidget && this.editor.removeContentWidget(contentWidget);
    // };

    getWidgetSyntaxFragmentById = (widgetId) => {
        return this.widgetById(widgetId)?.locLiveZoneActiveDecoration?.syntaxFragment;
    };

    startHover = (currentHoveredWidgetId) => {
        if (this.currentHoveredWidgetId === currentHoveredWidgetId) {
            return false;
        }

        this.currentHoveredWidgetId = currentHoveredWidgetId;
        this.currentHoveredWidgetSyntaxFragment =
            this.getWidgetSyntaxFragmentById(currentHoveredWidgetId);
        this.currentHoveredWidgetSyntaxFragment?.startHover();
        return true;
    };

    stopHover = (currentHoveredWidgetId = null) => {
        if (this.currentHoveredWidgetId && this.currentHoveredWidgetId === currentHoveredWidgetId) {
            return false;
        }

        this.currentHoveredWidgetSyntaxFragment?.stopHover();

        this.currentHoveredWidgetSyntaxFragment = null;

        this.currentHoveredWidgetId = null;
        return true;
    };

    mouseActionActive = false;
    resolveMouseAction = (eventType, eventInfo) => {

        if (!this.mouseActionActive) {
            return;
        }

        let currentHoveredWidgetId = eventInfo.target?.detail;
        // console.log("M", {eventType, eventInfo}, ...rest);
        if (!isString(currentHoveredWidgetId)) {
            const currentRange = eventInfo.target?.range;
            let mouseActionDecorations = {widget: null, decoration: null, widgets: []};
            (currentRange?.startLineNumber > -1) && this.editor?.getModel()?.getLineDecorations(currentRange.startLineNumber)
                .forEach(
                    (decoration) => {
                        const widget = this.contentWidgets[decoration.id];


                        if (!widget) {
                            return;
                        }

                        const widgetSyntaxFragment = this.getWidgetSyntaxFragmentById(decoration.id);
                        // console.log(widget);
                        const foundI = widgetSyntaxFragment?.ranges.findIndex(range => range.containsRange(currentRange));
                        if (foundI < 0) {
                            //!decoration.range.containsRange(currentRange)
                            return;
                        }

                        if (!mouseActionDecorations.decoration
                            || mouseActionDecorations.decoration.range.strictContainsRange(decoration.range)) {
                            mouseActionDecorations.decoration = decoration;
                            mouseActionDecorations.widget = widget;
                        }

                        mouseActionDecorations.widgets.push(widget);
                    }
                );
            // console.log(">", eventType, eventInfo, mouseActionDecorations, ...rest);
            currentHoveredWidgetId = mouseActionDecorations?.widget?.getId();
            //  console.log("R>", eventType, currentHoveredWidgetId);
            // this.stopHover();
        }

        switch (eventType) {
            case mouseActionTypes.mousedown:
            case mouseActionTypes.mousemove:
                this.stopHover(currentHoveredWidgetId);
                this.startHover(currentHoveredWidgetId);
                // console.log("M", currentHoveredWidgetId, eventType, eventInfo, ...rest);
                break;
            default:
                this.stopHover(currentHoveredWidgetId);
        }
    };

    // _resolveMouseAction = (eventType, eventInfo) => {
    //     this._resolveMouseActionMoveEnter.cancel();
    //     this._resolveMouseActionMoveLeave.cancel();
    //     this._resolveMouseActionReset.cancel();
    //
    //     switch (eventType) {
    //         case mouseActionTypes.mousedown:
    //         case mouseActionTypes.mousemove:
    //             const currentRange =
    //                 eventInfo.target.range ??
    //                 this.contentWidgets[eventInfo.target.detail]?.getRange();
    //             console.log("_resolveMouseAction", eventInfo.target.detail, this.contentWidgets[eventInfo.target.detail]);
    //             if (
    //                 currentRange &&
    //                 (!this.lastMouseActionRange ||
    //                     !this.monaco.Range.equalsRange(
    //                         this.lastMouseActionRange,
    //                         currentRange
    //                     ))
    //             ) {
    //                 let mouseActionDecorations = this.editor
    //                     .getModel()
    //                     .getDecorationsInRange(currentRange)
    //                     .filter(
    //                         (decoration) => !!this.contentWidgets[decoration.id]
    //                     );
    //
    //                 mouseActionDecorations =
    //                     this.handleMouseActionDecoration?.(mouseActionDecorations) ??
    //                     mouseActionDecorations;
    //
    //                 mouseActionDecorations.length ?
    //                     this._resolveMouseActionMoveEnter(
    //                         currentRange, mouseActionDecorations
    //                     )
    //                     : this._resolveMouseActionMoveLeave(
    //                         currentRange, mouseActionDecorations
    //                     );
    //
    //             }
    //             break;
    //         default:
    //             this._resolveMouseActionReset();
    //     }
    // };

    handleLayoutContentWidgetById = (id) => {
        const contentWidget = this.getContentWidgets()[id];

        if (!contentWidget) {
            return false;
        }

        this.layoutContentWidget(contentWidget);
        return true;
    };

    handleLayoutContentWidgetByDecoration = (decoration) => {
        return this.handleLayoutContentWidgetById(decoration?.id);
    }

    resolveMouseActionMouseMove = debounce(
        (...e) => {
            this.resolveMouseAction(
                mouseActionTypes.mousemove, ...e
            );
        },
        this.resolveMouseActionMouseMoveDelay
    );

    resolveMouseActionMouseDown = debounce(
        (...e) => {
            this.resolveMouseAction(
                mouseActionTypes.mousedown, ...e
            );
        },
        this.resolveMouseActionMouseDownDelay
    );

    resolveMouseActionMouseLeave = debounce(
        (...e) => {
            this.resolveMouseAction(
                mouseActionTypes.mouseleave, ...e
            );
        },
        this.resolveMouseActionMouseLeaveDelay
    );

    resolveMouseActionMouseMoveByWidgetId = (widgetId) => {
        return this.resolveMouseActionMouseMove({target: {detail: widgetId}});
    };
    resolveMouseActionMouseDownByWidgetId = (widgetId) => {
        return this.resolveMouseActionMouseDown({target: {detail: widgetId}});
    };
    resolveMouseActionMouseLeaveByWidgetId = (widgetId) => {
        return this.resolveMouseActionMouseLeave({target: {detail: widgetId}});
    };

    observe = (forceReset = false) => {
        if (this.disposers) {
            if (!forceReset) {
                return this.unobserve;
            }

            this.unobserve();
        }

        const {monaco, editor} = this;

        const onDidChangeModelContentDisposer =
            editor.onDidChangeModelContent((event) => {
                let changeStartPosition = null;
                event.changes.forEach((change) => {
                    if (!change?.range) {
                        return;
                    }
                    const currentStartPosition =
                        monaco.Range.getStartPosition(change.range);
                    if (changeStartPosition) {
                        if (currentStartPosition.isBefore(changeStartPosition)) {
                            changeStartPosition = currentStartPosition;
                        }
                    } else {
                        changeStartPosition = currentStartPosition;
                    }
                    const modelEndPosition = editor
                        .getModel()
                        .getFullModelRange()
                        .getEndPosition();
                    const affectedRange = monaco.Range.fromPositions(
                        changeStartPosition,
                        modelEndPosition
                    );
                    editor
                        .getModel()
                        .getDecorationsInRange(affectedRange)
                        .forEach(this.handleLayoutContentWidgetByDecoration);
                });
            });


        let width, height;

        const onDidLayoutChangeDisposer = editor.onDidLayoutChange((info) => {
            if (height !== info.height || width !== info.width) {
                height = info.height;
                width = info.width;
                this._layoutAll();
            }
        });

        const onDidChangeModelDecorationsDisposer = editor.onDidChangeModelDecorations(this.layoutAll);
        const onDidScrollChangeDisposer = editor.onDidScrollChange(this.layoutAll);

        // editor.onContextMenu(function (...e) {
        //   contentWidgetManager.resolveMouseAction(
        //   mouseActionTypes.contextmenu, ...e);
        // });

        const {
            resolveMouseActionMouseMove,
            resolveMouseActionMouseDown,
            resolveMouseActionMouseLeave
        } = this;

        const debouncersDisposer = {
            dispose: () => {
                resolveMouseActionMouseMove.cancel();
                resolveMouseActionMouseDown.cancel();
                resolveMouseActionMouseLeave.cancel();
            }
        };

        const onMouseMoveDisposer = editor.onMouseMove(resolveMouseActionMouseMove);

        const onMouseDownDisposer = editor.onMouseDown(resolveMouseActionMouseDown);

        const onMouseLeaveDisposer = editor.onMouseLeave(resolveMouseActionMouseLeave);

        this.disposers = [
            onDidChangeModelContentDisposer,
            onDidLayoutChangeDisposer,
            onDidChangeModelDecorationsDisposer,
            onMouseMoveDisposer,
            onMouseDownDisposer,
            onMouseLeaveDisposer,
            onDidScrollChangeDisposer,
            debouncersDisposer,
        ];

        return this.unobserve;
    }

    unobserve = () => {
        if (!this.disposers) {
            return false;
        }

        this.disposers.forEach(disposer => disposer.dispose());

        this.disposers = null;
        return true;
    }

    //exposes editors inner collection and recover missing from "this" one
    editorContentWidgetsById = (id, locLiveZoneActiveDecoration) => {
        let currentContentWidget = this.widgetById(id);
        const contentWidgets = [];
        if (currentContentWidget) {
            currentContentWidget.updateRefs(this, locLiveZoneActiveDecoration);
            contentWidgets.push(currentContentWidget);
        } else {
            const newContentWidgets = this.makeContentWidgets(id, locLiveZoneActiveDecoration);
            newContentWidgets.forEach((newContentWidget) => {
                this.editor.addContentWidget(newContentWidget);
            });
            contentWidgets.push(...newContentWidgets);
        }
        // const {expressionId} = contentWidget?.locLiveZoneActiveDecoration?.zone ?? {};
        // expressionId == 6 && console.log("editorContentWidgetsById", {expressionId, contentWidget});

        // console.log("editorContentWidgetsById", {contentWidget});
        contentWidgets.forEach((contentWidget) => {
            this.layoutContentWidget(contentWidget);
        });
        // console.log("contentWidgets", contentWidgets);
        return contentWidgets;
    };

    removeContentWidgetById = (id) => {
        const contentWidget = this.widgetById(id);
        if (contentWidget) {
            this.editor.removeContentWidget(contentWidget);
            delete this.contentWidgets[id];
        }
    }

    onDecorationsChange = (locLiveZoneActiveDecorations) => {
        // console.log("onDecorationsChange", locLiveZoneActiveDecorations, locLiveZoneActiveDecorations.find(locLiveZoneActiveDecoration => {
        //     const {expressionId} = locLiveZoneActiveDecoration?.zone ?? {};
        //     return expressionId; //&& console.log("onDecorationsChange", {expressionId, locLiveZoneActiveDecoration});
        // }));
        //fix mapping of id with map to index of locLiveZoneActiveDecorations: done

        const ids2i = {};
        // const i2ids = {};
        locLiveZoneActiveDecorations.forEach(
            (e, i) => { // todo: obtain anchor id not all: done
                const a = e.parentSyntaxFragment?.getDecorationIds() ?? [];
                const b = e.syntaxFragment?.getDecorationIds() ?? [];
                const ks= [...a, ...b];
                // const ks = [b[0] ?? a[0]];
                // console.log("locLiveZoneActiveDecorations", {e, i, ks, a, b});
                ks.forEach(
                    (k) => {
                        if (!k) {
                            return; // prevents program's undefined widget id
                        }
                        ids2i[k] = i;
                        // i2ids[i]??={};
                        // i2ids[i][k] = ids2i[k];
                    }
                );
            }
        );

        const ids = Object.keys(ids2i);
        const contentWidgets = {};
        const {prevIds} = this;
        const toRemove = {};

        // th ids are not ready yet, since they are trigered at rale
        // console.log("locLiveZoneActiveDecorations", {prevIds, ids, ids2i});

        prevIds?.forEach((id) => {
            toRemove[id] = true;
        });

        ids.forEach((id) => {
            toRemove[id] = false;
            // heck why elements are not bein added
            const locLiveZoneActiveDecoration = locLiveZoneActiveDecorations[ids2i[id]];
            // makeContentWidgets call caused a month delay
            const currentContentWidgets = this.editorContentWidgetsById(id, locLiveZoneActiveDecoration);
            // console.log("makeContentWidgets", {currentContentWidgets, id, locLiveZoneActiveDecoration} );
            currentContentWidgets.forEach((contentWidget, i) => {
                // const _id = `${contentWidget.getId()};${i}`;
                const _id = contentWidget.getId();
                toRemove[_id] = false;
                // console.log("makeContentWidgets", {currentContentWidgets, id, _id, locLiveZoneActiveDecoration});
                contentWidgets[_id] = contentWidget;
            });

        });

        const removed = [];
        for (const id in toRemove) {
            if (toRemove[id]) {
                this.removeContentWidgetById(id);
                removed.push(id);
            }
        }

        this.prevIds = ids;
        this.contentWidgets = contentWidgets;

        // console.log("onDecorationsChange", {locLiveZoneActiveDecorations, contentWidgets, removed});

        return toRemove;
    }
}

// const getZoneParentScopeUIDs = (zone) => {
//    const parentScopeUIDs = [];
//    let parentZone = zone?.parentSnapshot;
//
//    while (parentZone) {
//       parentScopeUIDs.push(parentZone.uid);
//       parentZone = parentZone.parentSnapshot;
//    }
//
//    return parentScopeUIDs;
//
// };
