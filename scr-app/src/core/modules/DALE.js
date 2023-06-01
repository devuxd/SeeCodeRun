import debounce from 'lodash/debounce';
import {monacoProps} from "../../utils/monacoUtils";
import {
    ScopeTypes,
    TraceEvents,
    LiveZoneTypes,
    LiveZoneDecorationStyles, ScopeExitTypes
} from "./ALE";
import {range} from "lodash";
import isString from "lodash/isString";

export const configureLoc2Range = (
    monaco, parserType = 'babel'
) => {
    switch (parserType) {
        case 'babel':
        default:
            return (
                loc,
                startLineOffset = 0,
                startColumnOffset = 0,
                endLineOffset = 0,
                endColumnOffset = 0,
            ) => {
                if (!loc || !loc.start) {
                    return new monaco.Range(
                        1,
                        1,
                        1,
                        1
                    );
                }
                return new monaco.Range(
                    startLineOffset + loc.start.line,
                    startColumnOffset + loc.start.column + 1,
                    endLineOffset + loc.end ?
                        loc.end.line
                        : loc.start.line,
                    endColumnOffset + loc.end ?
                        loc.end.column + 1
                        : loc.start.column + 1,
                );
            };
    }
};

export const configureRangeCompactor = (monaco) => {
    const compactRange = (rangeA, rangeB) => {
        if (monaco.Range.areIntersectingOrTouching(rangeA, rangeB)) {
            return rangeA.plusRange(rangeB);
        }

        return null;
    };

    const compactRanges = (ranges) => {
        return ranges
            .sort(monaco.Range.compareRangesUsingStarts)
            .reduce((compactedRanges, range) => {
                    const nextI = compactedRanges.length;
                    const currentI = nextI ? nextI - 1 : 0;
                    const current = compactedRanges[currentI];

                    if (current) {
                        const compactedRange = compactRange(current, range);
                        if (compactedRange) {
                            compactedRanges[currentI] = compactedRange;
                            return compactedRanges;
                        }
                    }

                    compactedRanges[nextI] = range;


                    return compactedRanges;
                },
                []
            );
    };

    return {
        compactRange,
        compactRanges
    };
};


export const ViewZoneEventType = {
    CREATE: 'CREATE',
    READ: 'READ',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
};

export const DECORATION_Z_INDEX = {
    normal: 1,
    active: 2,
    hover: 3,
};

export const ZoneDecorationType = {
    resolve: function (liveZoneType, scopeType) {
        switch (liveZoneType) {
            case LiveZoneTypes.B:
                if (scopeType === ScopeTypes.F) {
                    return this.FunctionBranch;
                }

                return this.ControlBranch;

            case  LiveZoneTypes.P:
                return this.Import;
            default:
                return this.LiveValue;
        }
    },
    resolveType: function (
        {liveZoneType, scopeType},
        liveZoneDecorationStyle = LiveZoneDecorationStyles.default
    ) {
        return this.resolve(liveZoneType, scopeType)[liveZoneDecorationStyle];
    },
    FunctionBranch: {
        normal: {
            zIndex: DECORATION_Z_INDEX.normal,
            inlineClassName: 'ale.branch.function.normal'
        },
        active: {
            zIndex: DECORATION_Z_INDEX.active,
            inlineClassName: 'ale.branch.function.active'
        },
        hover: {
            zIndex: DECORATION_Z_INDEX.hover,
            inlineClassName: "ale.branch.function.hover"
        }
    },
    ControlBranch: {
        normal: {
            zIndex: DECORATION_Z_INDEX.normal,
            inlineClassName: 'ale.branch.control.normal'
        },
        active: {
            zIndex: DECORATION_Z_INDEX.active,
            inlineClassName: 'ale.branch.control.active'
        },
        hover: {
            zIndex: DECORATION_Z_INDEX.hover,
            inlineClassName: "ale.branch.control.hover"
        }
    },
    LiveValue: {
        normal: {
            zIndex: DECORATION_Z_INDEX.normal,
            inlineClassName: 'ale.value.normal'
        },
        active: {
            zIndex: DECORATION_Z_INDEX.active,
            inlineClassName: 'ale.value.active'
        },
        hover: {
            zIndex: DECORATION_Z_INDEX.hover,
            inlineClassName: "ale.value.hover"
        }
    },
    Import: {
        normal: {
            zIndex: DECORATION_Z_INDEX.normal,
            inlineClassName: 'ale.import.normal'
        },
        active: {
            zIndex: DECORATION_Z_INDEX.active,
            inlineClassName: 'ale.import.active'
        },
        hover: {
            zIndex: DECORATION_Z_INDEX.hover,
            inlineClassName: "ale.import.hover"
        }
    },
};

export const resetMonacoEditorViewZones = (editor, viewZoneIdsRef) => {
    editor.changeViewZones(changeAccessor => {
        const {
            current: viewZoneIds,
            onViewZoneDOMChange,
        } = viewZoneIdsRef;

        const vLineCount = viewZoneIds?.length;

        for (let i = 1; i <= vLineCount; i++) {
            if (viewZoneIds[i]) {
                onViewZoneDOMChange(
                    ViewZoneEventType.DELETE, changeAccessor, viewZoneIds, i, null
                );
            }
        }
        viewZoneIdsRef.current = [viewZoneIds];
    });
};

export const updateMonacoEditorViewZones = (editor, viewZoneIdsRef) => {
    editor.changeViewZones(changeAccessor => {
        const {
            current: viewZoneIds,
            onViewZoneDOMChange,
        } = viewZoneIdsRef;
        const lineCount = editor.getModel().getLineCount();
        const newViewZoneIds = [viewZoneIds];

        const vLineCount = viewZoneIds ? viewZoneIds.length : 0;

        const count = Math.max(lineCount, vLineCount);
        for (let i = 1; i <= count; i++) {
            if (i > lineCount) {
                if (viewZoneIds?.[i]) {
                    onViewZoneDOMChange(
                        ViewZoneEventType.DELETE, changeAccessor, viewZoneIds, i, null
                    );
                }
            } else {
                if (viewZoneIds?.[i]) {
                    onViewZoneDOMChange(
                        ViewZoneEventType.UPDATE,
                        changeAccessor, newViewZoneIds, i, viewZoneIds[i]
                    );
                    continue;
                }

                onViewZoneDOMChange(
                    ViewZoneEventType.CREATE,
                    changeAccessor, newViewZoneIds, i, null
                );
            }
        }
        viewZoneIdsRef.current = newViewZoneIds;
    });
};


const makeOnViewZoneDOMChange = (
    onChange,
    createViewZone = (i) => {
        const domNode = document.createElement('div');
        // domNode.style.background = 'transparent';
        // domNode.style.border = '1px dashed grey';
        return {
            afterLineNumber: i,
            heightInPx: 0,
            domNode
        };
    },
) => {

    return (...params) => {
        const [
            ViewZoneEventType, changeAccessor, viewZoneIds, i, viewZoneId
        ] = params;
        switch (ViewZoneEventType) {
            case ViewZoneEventType.CREATE:
                viewZoneIds[i] = changeAccessor.addZone(createViewZone(i));
                break;
            case ViewZoneEventType.UPDATE:
                changeAccessor.layoutZone(viewZoneId);
                viewZoneIds[i] = viewZoneId;
                break;
            case ViewZoneEventType.DELETE:
                changeAccessor.removeZone(viewZoneIds[i]);
                break;
            case ViewZoneEventType.READ:
            default:
                console.warn(`unsupported event: ${ViewZoneEventType}`);
        }

        onChange?.(...params);
    }
};


export function sortedIndex(array, value, property, property2) {
    let low = 0,
        high = array.length;

    while (low < high) {
        let mid = (low + high) >>> 1;
        let isLessThan = null;
        if (property) {
            if (property2) {
                isLessThan =
                    parseFloat(array[mid][property][property2], 10) <
                    parseFloat(value[property][property2], 10);
            } else {
                isLessThan =
                    parseFloat(array[mid][property], 10) <
                    parseFloat(value[property], 10);
            }
        } else {
            isLessThan = array[mid] < value;
        }

        if (isLessThan) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}

export function sortedUniquePush(array, value, ...rest) {
    if (array.indexOf(value) < 0) {
        array.splice(sortedIndex(array, value, ...rest), 0, value);
    }
}

export const mouseActionTypes = {
    mousemove: "mousemove",
    mousedown: "mousedown",
    mouseleave: "mouseleave",
    contextmenu: "contextmenu"
};

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

export function styleContentWidgetDomNode(domNode/*, ...rest*/) {
    domNode.style.overflow = 'hidden';
    domNode.style.whiteSpace = 'nowrap';
    domNode.style.marginTop = `-${monacoProps.widgetOffsetHeight}px`;
    domNode.style.height = `${monacoProps.widgetMaxHeight}px`;
    domNode.style.maxHeight = `${monacoProps.widgetMaxHeight}px`;
    domNode.style.minWidth = `${monacoProps.widgetMinWidth}px`;
    domNode.style.backgroundColor = monacoProps.widgetBackgroundColor;
    domNode.style.fontSize = `${monacoProps.widgetFontSize}px`;

    // return setContentWidgetDomNodeStyle(domNode,...rest);
}

class ContentWidgetManager {
    // resizeDelay = 10;
    layoutAllDelay = 100;
    resolveMouseActionEnterDelay = 150;
    resolveMouseActionLeaveDelay = 300;
    contentWidgets = {};
    // pendingToResize = [];
    resolveMouseActionDecorationIds = [];
    lastMouseActionRange = null;
    editor = null;
    monaco = null;
    handleMouseActionDecoration = null;
    style = {
        minWidth: '8px',
        maxWidth: '600px',
    };
    pendingYs = {};
    tid = null;
    widgetGap = 4;
    widgetResizeDebounceTime = 10;

    constructor(
        editor, monaco, handleMouseActionDecoration
    ) {
        this.editor = editor;
        this.monaco = monaco;
        this.handleMouseActionDecoration = handleMouseActionDecoration;

        this._layoutAll = debounce(
            this.layoutAll,
            this.layoutAllDelay
        );

        // this._resize = debounce(
        //     this.resize,
        //     this.resizeDelay
        // );

        this._resolveMouseActionReset = debounce(
            this.resolveMouseActionReset,
            this.resolveMouseActionLeaveDelay
        );

        this._resolveMouseActionMoveEnter = debounce(
            this.resolveMouseActionMove,
            this.resolveMouseActionEnterDelay
        );

        this._resolveMouseActionMoveLeave = debounce(
            this.resolveMouseActionMove,
            this.resolveMouseActionLeaveDelay
        );
    }


    getContentWidgets = () => {
        return this.contentWidgets;
    };

    widgetResize = () => {
        let layout = {};
        const contentWidgets = Object.values(this.getContentWidgets() ?? {});
        for (const contentWidget of contentWidgets) {
            if (!contentWidget) {
                continue;
            }

            const {x = 0, y = 0, width = 0} = contentWidget.getDomNode()?.getBoundingClientRect() ?? {};
            layout[y] ??= {};
            layout[y][x] = {width, contentWidget};
        }

        Object.keys(this.pendingYs).forEach(y => {
            const xs = Object.keys(layout[y] ?? {}).sort((a, b) => a - b);
            //console.log(" Y needs resizing:", y, xs);
            let previous = null;

            xs.forEach(x => {
                const {width, contentWidget} = layout[y][x];
                if (!previous) {
                    previous = {x, width, contentWidget};
                    return;
                }
                const maxWidth = x - previous.x - this.widgetGap;
                //
                // console.log(
                // "resize",
                // { y, x, maxWidth, previousEl: previous.contentWidget.domNode, currentEl: contentWidget.domNode, contentWidget }
                // );

                const style = previous.contentWidget.getDomNode()?.style;
                if (style) {
                    style.maxWidth = `${maxWidth}px`;
                }

            });

            if (previous && xs.length === 1) {
                const style = previous.contentWidget.getDomNode()?.style;
                if (style) {
                    style.maxWidth = `unset`;
                }
            }

        });

        this.pendingYs = {};
    };

    debouncedWidgetResize = (domRect = {}) => {
        const {y = 0} = domRect;
        this.pendingYs[y] = true;
        clearTimeout(this.tid);
        this.tid = setTimeout(this.widgetResize, this.widgetResizeDebounceTime);
    };

    handleContentWidgetResize = (domRects) => {
        for (const domRect of domRects) {
            if (domRect) {
                this.debouncedWidgetResize(domRect);
            }
        }
    };


    makeContentWidget = (id, locLiveZoneActiveDecoration) => {
        const {monaco, editor, handleContentWidgetResize} = this;
        const preference = [monaco.editor.ContentWidgetPositionPreference.BELOW];
        const getId = () => {
            return id;
        };


        // use locLiveZoneActiveDecoration and its decoration id
        // let range = {...(locLiveZoneActiveDecoration?.syntaxFragment?.ranges?.[0] ??(editor.getModel()?.getDecorationRange(id)?? {}))};
        // range.getStartPosition = () => {
        //     const {
        //         startLineNumber = 1, startColumn = 1
        //     } = range;
        //     return new monaco.Position(startLineNumber, startColumn);
        // };
        const getRange = () => {
            return editor.getModel()?.getDecorationRange(id);
            // it has not been decorated
            //range = locLiveZoneActiveDecoration?.syntaxFragment?.getDecoratorsCollection()?.getRanges?.()?.[0] ?? range;
            //console.log("locLiveZoneActiveDecoration", range, locLiveZoneActiveDecoration, editor.getModel()?.getDecorationRange(id))
            // return range;
            // console.log("locLiveZoneActiveDecoration", locLiveZoneActiveDecoration)
            // return editor.getModel()?.getDecorationRange(id);
        };

        // const contentWidget =
        return {
            allowEditorOverflow: false,
            suppressMouseDown: true,
            domNode: null,
            locLiveZoneActiveDecoration,
            getId,
            getRange,
            needsResizing: false,
            position: null,
            getDomNode: function () {
                if (!this.domNode) {
                    this.domNode = document.createElement("div");
                    styleContentWidgetDomNode(this.domNode);
                }
                return this.domNode;
            },
            getPosition: function () {
                const position = getRange()?.getStartPosition()?? this.position;

                if ((!this.position && position) || !position.equals(this.position)) {
                    this.needsResizing = true;
                    this.position = position;
                }

                return {
                    position,
                    preference
                };

            },
            // afterRender: function () {
            //     pendingToResizePush(this);
            // },
            domRect: null,
            afterRender: function () {
                if (this.needsResizing) {
                    this.needsResizing = false;
                    const domRect = this.getDomNode()?.getBoundingClientRect();
                    handleContentWidgetResize([this.domRect, domRect]);
                    this.domRect = domRect;
                }
            }
        };

        // contentWidget.layout = () => {
        //     this.layoutContentWidget(contentWidget);
        // }
        // return contentWidget;
    };


    removeContentWidgetById = (id) => {
        const contentWidget = this.getContentWidgets()[id];
        contentWidget && this.editor.removeContentWidget(contentWidget);
    };

    layoutContentWidget = (contentWidget) => {
        this.editor?.layoutContentWidget(contentWidget);
    };

    layoutAll = () => {
        // const contentWidgets = this.getContentWidgets();
        // for (let id in contentWidgets) {
        //     this.layoutContentWidget(contentWidgets[id]);
        // }

        const contentWidgets = Object.values(this.getContentWidgets());
        for (const contentWidget of contentWidgets) {
            // console.log("onDidChangeModelDecorations", contentWidget);
            this.layoutContentWidget(contentWidget);
        }

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

    resolveMouseActionMove = (currentRange, mouseActionDecorations) => {
        console.log("resolveMouseActionMove", {currentRange, mouseActionDecorations});
        this.lastMouseActionRange = currentRange;
        this.resolveMouseActionDecorationIds =
            this.editor.deltaDecorations(
                this.resolveMouseActionDecorationIds,
                mouseActionDecorations
            );
    };

    resolveMouseActionReset = () => {
        console.log("resolveMouseActionReset");
        this.resolveMouseActionDecorationIds =
            this.editor.deltaDecorations(
                this.resolveMouseActionDecorationIds,
                []
            );
    };

    getWidgetSyntaxFragmentById = (widgetId) => {
        return this.contentWidgets[widgetId]?.locLiveZoneActiveDecoration?.syntaxFragment;
    };


    startHover = (currentHoveredWidgetId) => {
        if (this.currentHoveredWidgetId === currentHoveredWidgetId) {
            return false;
        }

        this.currentHoveredWidgetId = currentHoveredWidgetId;
        this.currentHoveredWidget =
            this.getWidgetSyntaxFragmentById(currentHoveredWidgetId);
        this.currentHoveredWidget?.decorate(
            LiveZoneDecorationStyles.hover, false
        );
        return true;
    };

    stopHover = (currentHoveredWidgetId = null) => {
        if (this.currentHoveredWidgetId === currentHoveredWidgetId) {
            return false;
        }

        this.currentHoveredWidget?.decorate(
            LiveZoneDecorationStyles.hover, true
        );
        this.currentHoveredWidget = null;
        this.currentHoveredWidgetId = null;
        return true;
    };

    mouseActionActive = false;
    resolveMouseAction = (eventType, eventInfo, ...rest) => {
        if (!this.mouseActionActive) {
            return;
        }
        let currentHoveredWidgetId = eventInfo.target?.detail;
        // console.log("M", {eventType, eventInfo}, ...rest);
        if (!isString(currentHoveredWidgetId)) {
            const currentRange = eventInfo.target?.range;
            let mouseActionDecorations = currentRange && this.editor
                .getModel()
                .getLineDecorations(currentRange.startLineNumber)
                .reduce(
                    (r, decoration) => {
                        const widget = this.contentWidgets[decoration.id];
                        const widgetSyntaxFragment = this.getWidgetSyntaxFragmentById(decoration.id);
                        if (widget) {
                            // console.log(widget);
                            const foundI = widgetSyntaxFragment.ranges.findIndex(range => range.containsRange(currentRange));
                            if (foundI < 0) {
                                //!decoration.range.containsRange(currentRange)
                                return r;
                            }

                            if (!r.decoration || r.decoration.range.strictContainsRange(decoration.range)) {
                                r.decoration = decoration;
                                r.widget = widget;
                            }

                            r.widgets.push(widget);
                        }
                        return r;
                    }
                    , {widget: null, decoration: null, widgets: []})
            ;
            // console.log(">", eventType, eventInfo, mouseActionDecorations, ...rest);
            currentHoveredWidgetId = mouseActionDecorations?.widget?.getId() ?? null;
            //  console.log("R>", eventType, currentHoveredWidgetId);
            // this.stopHover();
        }

        switch (eventType) {
            case mouseActionTypes.mousedown:
            case mouseActionTypes.mousemove:
                this.stopHover(currentHoveredWidgetId);
                this.startHover(currentHoveredWidgetId);
                console.log("M", currentHoveredWidgetId, eventType, eventInfo, ...rest);
                break;
            default:
                this.stopHover(currentHoveredWidgetId);
        }
    };

    _resolveMouseAction = (eventType, eventInfo) => {
        this._resolveMouseActionMoveEnter.cancel();
        this._resolveMouseActionMoveLeave.cancel();
        this._resolveMouseActionReset.cancel();

        switch (eventType) {
            case mouseActionTypes.mousedown:
            case mouseActionTypes.mousemove:
                const currentRange =
                    eventInfo.target.range ??
                    this.contentWidgets[eventInfo.target.detail]?.getRange();
                console.log("M", eventInfo.target.detail, this.contentWidgets[eventInfo.target.detail]);
                if (
                    currentRange &&
                    (!this.lastMouseActionRange ||
                        !this.monaco.Range.equalsRange(
                            this.lastMouseActionRange,
                            currentRange
                        ))
                ) {
                    let mouseActionDecorations = this.editor
                        .getModel()
                        .getDecorationsInRange(currentRange)
                        .filter(
                            (decoration) => !!this.contentWidgets[decoration.id]
                        );

                    mouseActionDecorations =
                        this.handleMouseActionDecoration?.(mouseActionDecorations) ??
                        mouseActionDecorations;

                    mouseActionDecorations.length ?
                        this._resolveMouseActionMoveEnter(
                            currentRange, mouseActionDecorations
                        )
                        : this._resolveMouseActionMoveLeave(
                            currentRange, mouseActionDecorations
                        );

                }
                break;
            default:
                this._resolveMouseActionReset();
        }
    };

    handleLayoutContentWidgetById = (id) => {
        const contentWidget = this.getContentWidgets()[id];

        if (!contentWidget) {
            return false;
        }

        this.editor.layoutContentWidget(contentWidget);
        return true;
    };

    handleLayoutContentWidgetByDecoration = (decoration) => {
        return this.handleLayoutContentWidgetById(decoration?.id);
    }

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

        // editor.onContextMenu(function (...e) {
        //   contentWidgetManager.resolveMouseAction(
        //   mouseActionTypes.contextmenu, ...e);
        // });

        const onMouseMoveDisposer = editor.onMouseMove((...e) => {
            this.resolveMouseAction(
                mouseActionTypes.mousemove, ...e
            );
        });

        const onMouseDownDisposer = editor.onMouseDown((...e) => {
            this.resolveMouseAction(
                mouseActionTypes.mousedown, ...e
            );
        });

        const onMouseLeaveDisposer = editor.onMouseLeave((...e) => {
            this.resolveMouseAction(
                mouseActionTypes.mouseleave, ...e
            );
        });

        this.disposers = [
            onDidChangeModelContentDisposer,
            onDidLayoutChangeDisposer,
            onDidChangeModelDecorationsDisposer,
            onMouseMoveDisposer,
            onMouseDownDisposer,
            onMouseLeaveDisposer,
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

    onDecorationsChange = (locLiveZoneActiveDecorations) => {
        // console.log("onDecorationsChange", locLiveZoneActiveDecorations);
        //fix ampping of id with map to index of locLiveZoneActiveDecorations: done

        const ids2i = {}
        locLiveZoneActiveDecorations.forEach(
            (e, i) => { // todo: obtain anchor id not all: done
                const a = e.parentSyntaxFragment?.getDecorationIds() ?? [];
                const b = e.syntaxFragment?.getDecorationIds() ?? [];
                [...a, ...b].forEach(
                    (k) => {
                        ids2i[k] = i;
                    }
                );
            }
        );

        const ids = Object.keys(ids2i);
        const contentWidgets = {};
        const {prevIds} = this;
        const toRemove = {};


        // th ids are not redy yet, since they are trigered at rale
        // console.log("locLiveZoneActiveDecorations", {prevIds, ids, ids2i});

        prevIds?.forEach((id) => {
            toRemove[id] = true;
        });

        ids.forEach((id, i) => {
            toRemove[id] = false;

            if (!this.handleLayoutContentWidgetById(id)) {
                const contentWidget =
                    this.makeContentWidget(id, locLiveZoneActiveDecorations[ids2i[id]]);
                contentWidgets[id] = contentWidget;
                this.editor.addContentWidget(contentWidget);
            } else {
                contentWidgets[id] = this.contentWidgets[id];
            }
        });

        for (const id in toRemove) {
            if (toRemove[id]) {
                this.removeContentWidgetById(id);
            }
        }

        this.prevIds = ids;
        this.contentWidgets = contentWidgets;

        // console.log("onDecorationsChange", locLiveZoneActiveDecorations, contentWidgets);

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

class BranchNavigator {
    _uid = null;
    _zone = null;
    _paths = [];
    _min = null;
    _max = null;
    _tryBlockType = null;
    _scopeExitType = null;
    currentBranch = -1;
    branches = [];
    _paramsIdentifiers = [];


    constructor(uid, zone) {
        this._uid = uid;
        this._zone = zone;
    }

    uid() {
        return this._uid;
    }

    zone() {
        return this._zone;
    }

    tryBlockType(tryBlockType) {
        if (tryBlockType) {
            this._tryBlockType = tryBlockType;
        }
        return this._tryBlockType;
    }

    scopeExitType(scopeExitType) {
        if (scopeExitType) {
            this._scopeExitType = scopeExitType;
        }
        return this._scopeExitType;
    }

    paths() {
        return this._paths;
    }

    min() {
        return this._min;
    }

    max() {
        return this._max;
    }

    current(paramsIdentifier) {
        if (paramsIdentifier) {
            return this.allBranches().find(b => b?.paramsIdentifier === paramsIdentifier);
        }

        return this.allBranches().reverse().find(b => b?.out === -1);
    }

    currentEnter(paramsIdentifier, zone) {
        let i = -1;
        if (paramsIdentifier) {
            i = this.allBranches().findIndex(b => b?.paramsIdentifier === paramsIdentifier);
        }

        if (i < 0) {
            i = this._paramsIdentifiers.push({paramsIdentifier, zone}) - 1;
        }

        return i;
    }

    last() {
        return this.branches[this.branches.length - 1];
    }

    allBranches() {
        return this.paths().reduce((r, e) => [...r, ...e], []);
    }

    enter(i, zone, paramsIdentifier) {
        this.currentBranch = this.currentEnter(
            paramsIdentifier ?? `${i}`, zone
        );

        if (this.currentBranch === 0) {
            const branches = [];
            this._paths.push(branches);
            this.branches = branches;
        }

        this.branches[this.currentBranch] = {
            paramsIdentifier,
            i: this.currentBranch,
            in: i,
            out: -1,
            zones: {in: zone, out: null}
        };

        this._min = Math.min(this.min(), i);
    }

    exit(i, zone, paramsIdentifier) {
        const current = this.current(paramsIdentifier);
        if (current?.out === -1) {
            current.out = i;
            current.zones.out = zone;
            this._max = Math.max(this.max(), i);
        }
    }

    getScopeType() {
        return this.zone()?.scopeType;
    }

    getScopeExit(scopeExitType) {
        return this.zone()?.scopeExits[scopeExitType];
    }

    getLoopScopeUID() {
        return this.zone()?.loopScopeUID;
    }

    toString() {
        return this.uid();
    }

    relativePaths(branchNavigator) {
        const relativePaths = [];
        if (this === branchNavigator) {
            return relativePaths;
        }

        const branchNavigatorPaths = branchNavigator?.paths?.();
        if (!branchNavigatorPaths?.length) {
            return relativePaths;
        }

        if (this.min() > branchNavigator.max() ||
            this.max() < branchNavigator.min()) {
            return relativePaths;
        }

        this.paths().forEach((parentPath, parentPathI) => {
            parentPath.forEach((parentBranch, parentBranchI) => {
                branchNavigatorPaths.forEach((path, pathI) => {
                    path.forEach((branch, branchI) => {
                        if (branch.in > parentBranch.in && branch.out < parentBranch.out) {
                            relativePaths.push({
                                branch,
                                branchI,
                                path,
                                pathI,
                                parentBranch,
                                parentBranchI,
                                parentPath,
                                parentPathI
                            });
                        }
                    })
                })
            })
        });

        return relativePaths;
    }
}


export class BranchNavigatorManager {
    aleInstance = null
    lastTimelineLength = 0;
    navigators = {};
    programStartTimelineI = null;
    programEndTimelineI = null;
    _values = {};
    _programZone = null;
    _programUID = null;
    _currentThrow = {};

    constructor(aleInstance) {
        this.aleInstance = aleInstance;
    }

    values(newValues) {
        if (newValues) {
            this._values = newValues;
        }
        return this._values;
    }

    programUID(newZone) {
        if (newZone) {
            this._programZone = newZone;
            this._programUID = newZone.uid;
        }
        return this._programUID;
    }

    currentThrow(newCurrentThrow) {
        if (newCurrentThrow) {
            this._currentThrow = newCurrentThrow;
        }
        return this._currentThrow;
    }

    getNavigators = () => {
        return this.navigators;
    };

    getNavigator = (uid) => {
        return this.getNavigators()?.[uid];
    };

    setLastTimelineLength = (lastTimelineLength) => {
        this.lastTimelineLength = lastTimelineLength;
    };

    getLastTimelineLength = () => {
        return this.lastTimelineLength;
    };

    setLocLiveZoneActiveDecorations = (locLiveZoneActiveDecorations) => {
        this.locLiveZoneActiveDecorations = locLiveZoneActiveDecorations;
    };

    getLocLiveZoneActiveDecorations = () => {
        return this.locLiveZoneActiveDecorations;
    };

    setProgramEndTimelineI = (programEndTimelineI) => {
        this.programEndTimelineI = programEndTimelineI;
    };

    getProgramEndTimelineI = () => {
        return this.programEndTimelineI;
    };

    setProgramStartTimelineI = (programStartTimelineI) => {
        this.programStartTimelineI = programStartTimelineI;
    };

    getProgramEndTimelineI = () => {
        return this.programStartTimelineI;
    };

    resolveScope(uid, zone) {
        let branchNavigator = this.getNavigator(uid);
        if (!branchNavigator) {
            branchNavigator = new BranchNavigator(
                uid, zone
            );
            this.navigators[uid] = branchNavigator;
        }

        const loopScopeUID = zone?.loopScopeUID;
        if (loopScopeUID) {
            this.navigators[loopScopeUID] = branchNavigator;
        }
        return branchNavigator;
    }

    getNavigatorsByScopeExitType(uid, scopeExitType) {
        const navigators = this.getNavigators();
        const currentNavigator = navigators[uid];
        const currentScopeExitUID =
            currentNavigator?.getScopeExit(scopeExitType).uid;

        const result = [];

        for (const navigatorKey in navigators) {
            const navigator = navigators[navigatorKey];
            const tryUID = navigator?.getScopeExit(scopeExitType).uid;
            if (currentScopeExitUID === tryUID) {
                result.push(navigator);
            }
        }

        return result;
    }


    getTryBlockNavigator(uid, tryBlockType) {
        const navigators =
            this.getNavigatorsByScopeExitType(uid, ScopeExitTypes.T);
        return navigators.find(navigator => {
            if (navigator.uid() === uid) {
                return false;
            }

            if (navigator.tryBlockType() === tryBlockType) {
                return true;
            }

            return false;

        });
    }

    enterScope(uid, i, zone, tryBlockType, extraZone, paramsIdentifier) {

        const scope = this.resolveScope(uid, zone);
        if (tryBlockType) {
            scope.tryBlockType(tryBlockType);
            let previousTryBlockType =
                tryBlockType === 'handler' ? 'block'
                    : tryBlockType === 'finalizer' ? 'handler' : null;

            if (previousTryBlockType) {
                const tryBlockNavigator =
                    this.getTryBlockNavigator(uid, previousTryBlockType);

                const boundaryBranch = tryBlockNavigator?.current(paramsIdentifier);
                const tryUID = tryBlockNavigator?.uid();
                if (boundaryBranch?.out === -1) {
                    tryBlockNavigator.exit(
                        this.currentThrow().i ?? i,
                        this.currentThrow().zone ?? zone
                    );
                    this.exitSubScopes(tryUID, boundaryBranch, ScopeExitTypes.T);
                }
            }
        }

        if (extraZone?.type === "SwitchCase" && scope.current(paramsIdentifier)) {
            return scope;
        }
        scope.enter(i, zone, paramsIdentifier);
        return scope;
    }

    exitSubScopes(uid, boundaryBranch, scopeExitType, isScopeExit) {

        if (!boundaryBranch) {
            return;
        }

        const navigators = this.getNavigators();
        const currentNavigator = navigators[uid];

        if (!currentNavigator) {
            return;
        }

        const exitUID =
            isScopeExit ? uid : currentNavigator.getScopeExit(scopeExitType)?.uid;

        if (!exitUID) {
            return;
        }

        for (const navigatorKey in navigators) {
            const navigator = navigators[navigatorKey];

            // if (uid == navigator.uid()) {
            //    continue;
            // }

            if ((
                scopeExitType === ScopeExitTypes.R ||
                scopeExitType === ScopeExitTypes.Y
            ) && (
                navigator.getScopeType() === ScopeTypes.F
            )
            ) {
                continue;
            }

            const isInScope = scopeExitType === ScopeExitTypes.T ||
                (navigator.getScopeExit(scopeExitType)?.uid === exitUID);

            const branches =
                scopeExitType === ScopeExitTypes.T ?
                    navigator.allBranches()
                    : [navigator.current()];

            branches.forEach(branch => {
                if (branch && isInScope) {
                    if (boundaryBranch.in <= branch.in && branch.out === -1) {
                        navigator.exit(boundaryBranch.out, boundaryBranch.zones.out);
                        //  console.log('>>', uid, navigator.uid(), boundaryBranch.in, branch.in, branch.out, scopeExitType);
                    }
                }
            });
        }

    }

    exitScope(uid, i, zone, scopeExitType, paramsIdentifier) {
        let scope = null;
        let boundaryBranch = null;
        switch (scopeExitType) {
            case ScopeExitTypes.R:
            case ScopeExitTypes.Y:
            case ScopeExitTypes.C:
            case ScopeExitTypes.B:
                scope = this.resolveScope(uid);
                boundaryBranch = scope?.current(paramsIdentifier);
                if (boundaryBranch?.out === -1) {
                    scope.exit(i, zone, paramsIdentifier);
                }

                this.exitSubScopes(
                    uid, boundaryBranch, scopeExitType, true
                );
                break;
            case ScopeExitTypes.T:
                this.currentThrow({
                    uid, i, zone, scopeExitType
                });
                scope = this.resolveScope(uid);
                break;
            case ScopeExitTypes.N:
            default:
                scope = this.resolveScope(uid);
                scope?.exit(i, zone, paramsIdentifier);
        }

        scopeExitType && scope?.scopeExitType(scopeExitType);
        return scope;
    }

    getScopeMapByUID = (bale, uid) => {
        if (!bale) {
            return null;
        }
        return bale.scopesMaps[uid];
    };
    getZoneByUID = (bale, zale, uid) => {
        const scopeMap = this.getScopeMapByUID(bale, uid);

        if (!zale || !scopeMap) {
            return null;
        }

        return zale.zones[scopeMap?.expressionId];
    };


    isTraceReset = (timeline) => {
        return this._timeline !== timeline;
    };

    handleTraceReset = (timeline, zones, scopesMaps, locToMonacoRange /*, ref, monacoEditor*/) => {
        if (!this.isTraceReset(timeline)) {
            return false;
        }

        this._timeline = timeline;
        // monacoEditor.deltaDecorations?.(
        //    ref?.current?.activeIds ?? [],
        //    []
        // );
        // console.log("handleTraceReset", {timeline, zones, scopesMaps, locToMonacoRange});
        this.locLiveZoneActiveDecorationsReset(
            zones, scopesMaps, locToMonacoRange
        );
        this.setLastTimelineLength(0);
        this.setProgramStartTimelineI(null);
        this.setProgramEndTimelineI(null);
        this.values({});
        return true;
    };

    locLiveZoneActiveDecorationsReset = (
        zones, scopesMaps, locToMonacoRange
    ) => {
        this.setLocLiveZoneActiveDecorations([]);
        for (let uid in scopesMaps) {
            const scopeMap = scopesMaps[uid];
            const zone = zones[scopeMap.expressionId];
            if (zone) {
                const getBranchNavigator = () => this.resolveScope(uid, zone);
                this.locLiveZoneActiveDecorationsPush(zone, [], locToMonacoRange, getBranchNavigator);
            }
        }
    }

    locLiveZoneActiveDecorationsPush = (zone, logValues, locToMonacoRange, getBranchNavigator, forcePush = false, isImport = false) => {
        const {dale} = this.aleInstance;
        const options = ZoneDecorationType.resolveType(
            zone, LiveZoneDecorationStyles.active
        );

        let activate = false;

        // zone.locLiveZones.getHighlights().forEach(loc => {
        //    locLiveZoneActiveDecorations.push({
        //       options,
        //       range: locToMonacoRange?.(loc),
        //    });
        // });
        const loc = zone.locLiveZones.getMainAnchor();
        const range = locToMonacoRange?.(loc);
        const found = this.locLiveZoneActiveDecorations.find(
            d => d.range.equalsRange(range)
        );

        let syntaxFragment = null;
        let parentSyntaxFragment = null;

        // let is

        // if (zone?.key === 'alternate') {
        //     console.log('alternate', {zone, range, logValues, found, b: getBranchNavigator()});
        // }

        // if(zone?.type === 'BinaryExpression'){
        //    console.log('BinaryExpression', {zone, range, logValues, found});
        // }

// check import from timline enrty being aldso her
//         if (isImport) {
//             console.log('import', {zone, range, logValues, found});
//         }
        if (zone?.parentType === "IfStatement") { // && zone?.key !== 'test'
            // console.log('IfStatement ', {zone, range, logValues, found, b: getBranchNavigator()});
            syntaxFragment = dale.getSyntaxFragment(zone.expressionId)?.[2];
            activate = true;
        }


        if (isImport) {
            syntaxFragment = dale.getSyntaxFragmentImport(zone?.importSourceName, 0)?.[2];
            activate = true;
        }


        if (!activate && (forcePush || !found)) {
            syntaxFragment = dale.getSyntaxFragment(zone.expressionId)?.[2];
            activate = !!syntaxFragment;
            if (zone?.parentSnapshot?.type == "VariableDeclarator") {
                // && zone.liveZoneType === LiveZoneTypes.B
                const vRange = dale.locToMonacoRange(zone.parentSnapshot.locLiveZones.mainAnchor);
                parentSyntaxFragment = dale.getSyntaxFragment(zone.parentSnapshot.expressionId)?.[2];
                //todo
                //console.log("Fix declarator highlight here>>", zone, vRange, parentSyntaxFragment);
            }

        }

        if (activate) {
            this.locLiveZoneActiveDecorations.push({
                isImport,
                zone,
                logValues,
                options,
                range,
                getBranchNavigator,
                syntaxFragment,
                parentSyntaxFragment,
            });
        }
    }

    handleTimelineChange = () => {

        // console.log("handleTimelineChange");
        if (!this.aleInstance) {
            return;
        }

        const {
            zale, bale, scr, dale, afterTraceChange, resetTimelineChange
        } = this.aleInstance.getModel();

        if (!(zale?.zones && bale?.scopesMaps && scr?.timeline)) {
            return;
        }
        const {
            locToMonacoRange,
            ref,
            monacoEditor,
            contentWidgetManager,
        } = dale ?? {};

        let isTraceReset = this.handleTraceReset(
            scr.timeline, zale.zones, bale.scopesMaps, locToMonacoRange,
            /*, ref, monacoEditor*/
        );
        //TODO: move locLiveZoneActiveDecorations logi to syntaxfragments

        const from = this.getLastTimelineLength();
        const to = scr.timeline.length;

        const timelineDataDelta = {};
        const values = this.values();
        let logValues = [];

        for (let i = from; i < to; i++) {
            const entry = scr.timeline[i];
            const {
                pre, traceEventType, uid, scopeType, extraExpressionId,
                tryBlockType, scopeExitType, paramsIdentifier,
            } = entry;
            let zone = null;
            let branchNavigator = null;

            let ignore = false;
            let isImport = false;

            switch (traceEventType) {
                case TraceEvents.L:
                    const expressionId = pre?.expressionId;
                    zone = zale.zones[pre?.expressionId];
                    values[expressionId] = values[expressionId] ?? [];
                    logValues = values[expressionId];
                    const logValue = {
                        i,
                        uid,
                        zone,
                        entry,
                        isReady: false,
                        getValue: entry?.logValue?.getSnapshot
                    };

                    logValues.push(logValue);
                    break;
                case TraceEvents.O:
                    zone = this.getZoneByUID(bale, zale, uid);// zale.zones[extraExpressionId];
                    branchNavigator = this.exitScope(
                        uid, i, zone, scopeExitType, paramsIdentifier
                    );
                    // console.log('O', {uid, extraExpressionId, zone, entry, branchNavigator});
                    break;
                case TraceEvents.I:
                    zone = this.getZoneByUID(bale, zale, uid);
                    const extraZone = zale.zones[extraExpressionId];

                    branchNavigator = this.enterScope(
                        uid, i, zone, tryBlockType, extraZone, paramsIdentifier
                    );
                    // console.log('I', {uid, extraExpressionId, zone, entry, extraZone, branchNavigator});
                    break;
                case TraceEvents.R:
                case TraceEvents.E:
                    break;
                case TraceEvents.P:
                    // why called more than once, what is happening to cleection higlighting? solved s1
                    zone = entry.importZoneExpressionData?.zone;
                    // console.log("import?", {entry, zone});
                    isImport = true;
                    break;
                case TraceEvents.D:
                default:
                    ignore = true;
            }

            zone = zone ?? zale.zones[entry.extraExpressionId];

            if (scopeType === ScopeTypes.P) {
                if (traceEventType === TraceEvents.I) {
                    this.setProgramStartTimelineI(i);
                    this.programUID(zone);
                } else {
                    this.setProgramEndTimelineI(i);
                }

            } else {
                // console.log(entry);
            }

            if (!zone) {
                continue;
            }
            const getBranchNavigator = () => branchNavigator;

            this.locLiveZoneActiveDecorationsPush(
                zone, logValues, locToMonacoRange, getBranchNavigator, false, isImport
            );
        }

        // this.setLastTimelineLength((scr.timeline.length || 1) - 1); // s1: solved changing to "to" value
        this.setLastTimelineLength(to);
        // todo: adds anchors deltas, group locs by anchor,
        //  and pass only delta anchors to afterTC, then render in RALE
        const locLiveZoneActiveDecorations =
            this.getLocLiveZoneActiveDecorations();
        if (monacoEditor) {
            // const activeIds = [];
            // locLiveZoneActiveDecorations.forEach(z => {
            //    activeIds.push(...z.syntaxFragment.decorate(LiveZoneDecorationStyles.active, false))
            // });
            // monacoEditor.deltaDecorations?.(
            //    ref?.current?.activeIds ?? [],
            //    locLiveZoneActiveDecorations
            // );

            // locLiveZoneActiveDecorations.forEach(z => {
            //    // if (z.parentSyntaxFragment) {
            //         z.parentSyntaxFragment?.decorate(LiveZoneDecorationStyles.active, false);
            //     //}
            //     //else {
            //         z.syntaxFragment?.decorate(LiveZoneDecorationStyles.active, false);
            //     //}
            // });

            // if (ref?.current) {
            //    ref.current.activeIds = activeIds;
            // }

            // activeIds.forEach((id, i) => {
            //    timelineDataDelta[id] = {
            //       i,
            //       data: locLiveZoneActiveDecorations[i],
            //    }
            // });

        }
        contentWidgetManager?.onDecorationsChange(locLiveZoneActiveDecorations);

        this._getActiveZoneByDecorationId = (id) => {
            const i = (locLiveZoneActiveDecorations ?? []).find(
                z => z.parentSyntaxFragment?.getDecorationIds().includes(id)
                    || z.syntaxFragment?.getDecorationIds().includes(id)
            );
            if (i < 0) {
                return null;
            }
            console.log("XL");

            return locLiveZoneActiveDecorations[i];
        };
        //console.log("afterTraceChange", scr.timeline?.length, scr.timeline);
        // console.log("afterTraceChange", scr.timeline?.length, scr.timeline, locLiveZoneActiveDecorations);
        afterTraceChange?.(
            scr.timeline, isTraceReset, timelineDataDelta, [from, to], this.getProgramEndTimelineI(), values
        );
    };

    handleMouseActionDecoration = (mouseActionDecorations) => {
        if (!this.aleInstance) {
            return;
        }

        const {
            dale
        } = this.aleInstance.getModel();

        if (!dale?.locToMonacoRange) {
            return;
        }


        const zoneDecorations = [];
        mouseActionDecorations.forEach(decoration => {
            const zoneDecoration = this._getActiveZoneByDecorationId?.(decoration.id);
            const zone = zoneDecoration?.zone;
            zone?.locLiveZones.getHighlights().forEach(loc => {
                zoneDecorations.push({
                    options: ZoneDecorationType.resolveType(
                        zone, LiveZoneDecorationStyles.hover
                    ),
                    range: dale.locToMonacoRange(loc),
                });
            });
        });

        return zoneDecorations;
    };
}

// a fragment visualizes a role-dependent focus of a syntax expression.
// const f = function(args){ let i = 0; return i++};
// f is a reference role becomes
// const f = function(...){...};

const checks = {};

class SyntaxFragment {
    constructor(dale, zone) {
        this.dale = dale;
        this.zone = zone;

        this.decorationStyles =
            ZoneDecorationType.resolve(zone.liveZoneType, zone.scopeType);
        this.rawRanges = zone.locLiveZones.getHighlights().map(
            loc => dale.locToMonacoRange(loc)
        );

        this.rawAlternateRanges = zone.locLiveZones.getAlternateHighlights().map(
            loc => dale.locToMonacoRange(loc)
        );

        // console.log("ZE", zone);
        this.ranges = dale.rangeCompactor.compactRanges(this.rawRanges);
        this.alternateRanges = dale.rangeCompactor.compactRanges(this.rawAlternateRanges);
        const allRanges = zone.node?.loc ?
            [dale.locToMonacoRange(zone.node.loc), ...this.ranges] :
            this.ranges;
        this.sourceText = dale.getValueInRanges(allRanges);

        this.ifBlock = () => {
            return this.zone?.parentType === "IfStatement";
        }

        this.ifBlockKey = () => {
            return this.ifBlock() && this.zone?.key;
        }

        this.ifBlockConsequent = () => {
            return this.zone?.key === "consequent";
        }

        this.ifBlockAlternate = () => {
            return this.zone?.key === "alternate";
        }

        this.expressionTest =() =>{
            return this.zone?.key === "test";
        };

        this.forBlock = () => {
            return this.zone?.parentType === "ForStatement";
        }

        this.expressionInit =() =>{
            return this.zone?.key === "init";
        };

        this.expressionUpdate =() =>{
            return this.zone?.key === "update";
        };

        this.forBlockInit=()=>{
            return  this.expressionInit() &&!!this.dale?.getAleInstance?.()?.zale.lookupZoneParentByType(this.zone, "ForStatement");
        };


        this.makeZoneDecorations = (
            decorationStyle = LiveZoneDecorationStyles.default, value = 0
        ) => {
            const {dale, ranges, alternateRanges, decorationStyles, zone} = this;
            const model = dale.monacoEditor.getModel();

            let currentRanges =
                decorationStyle === LiveZoneDecorationStyles.default ?
                    ranges : alternateRanges;

            let complementDecorationStyle = LiveZoneDecorationStyles.default;
            let complementRanges = [];

            // value &&console.log("makeZoneDecorations", zone.type, {zone, currentRanges, decorationStyle, value});
            if(!this.ifBlock() && this.expressionTest()){
                // console.log("loop?", zone.type, {zone, currentRanges, decorationStyle, value});
            }

            if (this.ifBlock()) {
                if (this.ifBlockConsequent() || this.ifBlockAlternate()) {
                    // console.log("makeZoneDecorations ifBlockConsequent", {zone, currentRanges, t: this, value});
                    if (!value) {
                        currentRanges = alternateRanges;
                        decorationStyle = LiveZoneDecorationStyles.normal;
                        // const loc = zone?.node?.loc;
                        // if (loc) {
                        //     currentRanges = [
                        //         ...ranges,
                        //         dale.locToMonacoRange(loc)];
                        //     // console.log("makeZoneDecorations ifBlockConsequent", {loc, zone, currentRanges, t: this, value});
                        // }


                    } else {
                        currentRanges = ranges;
                        decorationStyle = LiveZoneDecorationStyles.active;
                    }

                    // this.ifBlockConsequent() && console.log("makeZoneDecorations ifBlockConsequent", {
                    //     zone,
                    //     currentRanges,
                    //     t: this,
                    //     value
                    // });
                    // this.ifBlockAlternate() && console.log("makeZoneDecorations ifBlockAlternate", {
                    //     zone,
                    //     currentRanges,
                    //     t: this,
                    //     value
                    // });

                } else {
                    // if () {
                    // return [];
                    //  console.log("makeZoneDecorations ifBlockAlternate", {zone, currentRanges, t: this, value});
                    //     if (!value) {
                    //         // currentRanges = ranges;
                    //         decorationStyle = LiveZoneDecorationStyles.default;
                    //     } else {
                    //         // currentRanges = alternateRanges;
                    //         decorationStyle = LiveZoneDecorationStyles.active;
                    //         currentRanges = ranges;
                    //         // decorationStyle = LiveZoneDecorationStyles.active;
                    //         // const loc = zone?.node?.loc;
                    //         // if (loc) {
                    //         //     currentRanges = [
                    //         //         // ...ranges,
                    //         //         dale.locToMonacoRange(loc)];
                    //         //     // console.log("makeZoneDecorations ifBlockConsequent", {loc, zone, currentRanges, t: this, value});
                    //         // }
                    //         // const loc = zone?.node?.loc;
                    //         // if (loc) {
                    //         //     complementRanges.push(dale.locToMonacoRange(loc));
                    //         //     complementDecorationStyle = LiveZoneDecorationStyles.default;
                    //         //     /console.log("complementDecorationStyle", {zone, currentRanges,complementRanges, value});
                    //         // }
                    //     }
                    //     // console.log("makeZoneDecorations ifBlockAlternate", {zone, currentRanges, t: this, value});
                    // } else {
                    // console.log("makeZoneDecorations ifBlockTest", {zone, currentRanges, t: this, value});
                    // return [];
                    // }
                }
            }

            const options = decorationStyles[decorationStyle];
            const cOptions = decorationStyles[complementDecorationStyle];

            if (decorationStyle === LiveZoneDecorationStyles.active) {
                if (zone.type === "VariableDeclarator") {
                    const vRange = dale.locToMonacoRange(zone.locLiveZones.mainAnchor);
                    console.log("GOTCHA", vRange);
                    currentRanges = [vRange];
                }
            }

            return [...currentRanges.map(
                range => ({
                    options,
                    range,
                })
            ), ...complementRanges.map(
                range => ({
                    options: cOptions,
                    range,
                })
            )];

            // return dale.filterDuplicateDecorations(
            //     currentRanges.map(
            //         range => ({
            //             options,
            //             range,
            //         })
            //     ),
            //     model
            // );
        };

        const decoratorCollection = this.dale.monacoEditor.createDecorationsCollection?.();

        this.getDecoratorsCollection = () => {
            return decoratorCollection;
        };
        this.getDecorationIds = () => decoratorCollection._decorationIds;


        this._decorationStyle = null;

        this.clear = (zoneDecorations) => {

            const zd = [
                ...(this._zoneDecorations ?? []),
                ...zoneDecorations
            ];

            const decorationIds = {};
            zd.forEach((z) => {
                const zoneRange = z.range;
                (this.dale.monacoEditor.getDecorationsInRange(zoneRange)).forEach((decoration) => {
                        const {id, range} = decoration;
                        // console.log("zd", {decoration, zoneRange, range});
                        // if (this._decorationStyle === LiveZoneDecorationStyles.active && !range.equalsRange(zoneRange)) {
                        //     return;
                        // }

                        decorationIds[id] = decoration;
                    }
                );
            });

            // this.dale.monacoEditor.removeDecorations(Object.keys(decorationIds));
        };

        this.decorate = (
            decorationStyle = LiveZoneDecorationStyles.default,
            isReset = false,
            value = 0
        ) => {

            if (decorationStyle && this._decorationStyle !== decorationStyle) {
                // decoratorCollection?.clear();
                const zoneDecorations = this.makeZoneDecorations(decorationStyle, value);
                this.clear(zoneDecorations);
                decoratorCollection?.set(zoneDecorations);
                this._decorationStyle = decorationStyle;
                this._zoneDecorations = zoneDecorations;

                // (this.getDecorationIds() ?? []).forEach(id => {
                //     checks[id] ??= 0;
                //     checks[id]++;
                // });

                // console.log("decorate", zd,zd.reduce((r, e) => {
                //     const k = JSON.stringify(e.range);
                //     r[k] ??= {};
                //     (this.dale.monacoEditor.getDecorationsInRange(e.range)).forEach((v) => {
                //             const {id} = v;
                //             v.ccc ??= 0;
                //             v.ccc++;
                //             r[k][id] = v;
                //         }
                //     );
                //     return r;
                //
                // }, {}), {decorationStyle});
            }

            return decoratorCollection;
        };

        this.unDecorateAll = (decorationStyle = LiveZoneDecorationStyles.default) => {
            // decoratorCollection?.clear();
            if (decorationStyle && this._decorationStyle !== decorationStyle) {
                const zoneDecorations = this.makeZoneDecorations(decorationStyle);
                this.clear(zoneDecorations);
                decoratorCollection?.set(zoneDecorations);
                this._decorationStyle = decorationStyle;
                this._zoneDecorations = zoneDecorations;

                // (this.getDecorationIds() ?? []).forEach(id => {
                //     checks[id] ??= 0;
                //     checks[id]++;
                // });
                //
                //
                // console.log("unDecorateAll", zd, {decorationStyle: this._decorationStyle});
            }
            //
        };
    }
}


// class IdiomaticView {
//     syntaxExpression;
//     syntaxFragmentDecorator;
//     stateExplorer;
//     graphicalLocator;
//
//     constructor(syntaxExpression) {
//         this.syntaxExpression = syntaxExpression;
//
//     }
//
//     destroy = () => {
//
//     }
// }
//
// const activateIdioms = (monacoEditor, monaco, gap = 4) => {
//     const preference = [monaco.editor.ContentWidgetPositionPreference.BELOW];
//
//     let pendingYs = {};
//
//     const widgetResize = () => {
//         let idiomLayout = {};
//         for (const idiom of idioms) {
//             const {
//                 // range,
//                 // decorationCollection,
//                 contentWidget
//             } = idiom;
//             const {x, y, width} = contentWidget.domNode.getBoundingClientRect();
//             idiomLayout[y] ??= {};
//             idiomLayout[y][x] = {width, contentWidget};
//
//         }
//         Object.keys(pendingYs).forEach(y => {
//             const xs = Object.keys(idiomLayout[y] ?? {}).sort((a, b) => a - b);
//             //console.log(" Y needs resizing:", y, xs);
//             let previous = null;
//             xs.forEach(x => {
//                 const {width, contentWidget} = idiomLayout[y][x];
//                 if (!previous) {
//                     previous = {x, width, contentWidget};
//                     return;
//                 }
//                 const maxWidth = x - previous.x - gap;
//
//                 //console.log("resize", { y, x, maxWidth, previousEl: previous.contentWidget.domNode, currentEl: contentWidget.domNode });
//
//                 previous.contentWidget.domNode.style.maxWidth = `${maxWidth}px`;
//             });
//
//             if (previous && xs.length === 1) {
//                 previous.contentWidget.domNode.style.maxWidth = `unset`;
//             }
//
//         });
//         pendingYs = {};
//     };
//     let tid = null;
//     const debouncedWidgetResize = (domRect) => {
//         const {y} = domRect;
//         pendingYs[y] = true;
//         clearTimeout(tid);
//         tid = setTimeout(widgetResize, 0);
//     };
//
//     const handleContentWidgetResize = (domRects) => {
//         for (const domRect of domRects) {
//             if (domRect) {
//                 debouncedWidgetResize(domRect);
//             }
//         }
//     };
//     const createIdiom = (decorationArray) => {
//         const {range} = decorationArray[0];
//         console.log("shiot");
//         const decorationCollection = monacoEditor.createDecorationsCollection(decorationArray);
//
//         const domNode = document.createElement("div");
//         domNode.setAttribute("class", 'myContentWidget');
//         domNode.innerHTML = JSON.stringify(range);
//
//
//         const contentWidget = {
//             getId: function () {
//                 return decorationCollection._decorationIds?.[0];
//             },
//             needsResizing: false,
//             position: null,
//             getPosition: function () {
//                 const position = decorationCollection.getRange(0)?.getStartPosition();
//                 if (!this.position || !position.equals(this.position)) {
//                     this.needsResizing = true;
//                     this.position = position;
//                 }
//
//                 return {
//                     position,
//                     preference
//                 };
//             },
//             domNode,
//             getDomNode: function () {
//                 return this.domNode;
//             },
//             domRect: null,
//             afterRender: function () {
//                 if (this.needsResizing) {
//                     this.needsResizing = false;
//                     const domRect = contentWidget.domNode?.getBoundingClientRect();
//                     handleContentWidgetResize([this.domRect, domRect]);
//                     this.domRect = domRect;
//                 }
//             }
//         };
//         monacoEditor.addContentWidget(contentWidget);
//
//         const idiom = {
//             range,
//             decorationCollection,
//             contentWidget
//         };
//
//         contentWidget.idiom = idiom;
//
//         return idiom;
//     };
//
//     const decorationArrays = [
//         [{
//             range: new monaco.Range(1, 2, 1, 10),
//             options: {inlineClassName: 'myInlineDecoration'}
//         }],
//         [{
//             range: new monaco.Range(1, 11, 3, 5),
//             options: {inlineClassName: 'myInlineDecoration2'}
//         }],
//     ];
//     const idioms = decorationArrays.map((da) => createIdiom(da));
//
//     monacoEditor.onDidChangeModelDecorations(() => {
//         for (const idiom of idioms) {
//             const {
//                 // range,
//                 // decorationCollection,
//                 contentWidget
//             } = idiom;
//
//             monacoEditor.layoutContentWidget(contentWidget);
//         }
//     });
// };

const makeDALERefDefaultState = () => {
    return {
        syntaxFragments: null,
        syntaxFragmentsReset: null,
        syntaxFragmentsImports: null,
        syntaxFragmentsImportsReset: null,
    }
};

export default function decorateALEExpressions(
    aleInstance,
    monaco,
    monacoEditor,
    onDecorationsReady,
    onViewZoneChange
) {
    const locToMonacoRange = configureLoc2Range(monaco);

    const rangeCompactor = configureRangeCompactor(monaco);

    const contentWidgetManager = new ContentWidgetManager(
        monacoEditor,
        monaco,
        aleInstance.branchNavigatorManager?.handleMouseActionDecoration
    );

    const dale = {
        isStandAlone: false,
        monaco,
        monacoEditor,
        rangeCompactor,
        locLiveZoneDecorationsMap: [],
        onChangeLocLiveZoneDecorations: null,
        ref: {
            current: makeDALERefDefaultState(),
        },
        getAleInstance: () => aleInstance,
        contentWidgetManager,
        getCode: () => monacoEditor.getValue(),
        locToMonacoRange,
        activeDecorationIdsRef: {current: []},
        viewZoneIdsRef: {
            onViewZoneDOMChange: makeOnViewZoneDOMChange(onViewZoneChange),
        },
        updateMonacoEditorViewZones: () => {
            updateMonacoEditorViewZones(monacoEditor, dale.viewZoneIdsRef);
        },
        resetMonacoEditorViewZones: () => {
            resetMonacoEditorViewZones(monacoEditor, dale.viewZoneIdsRef);
        },
        enableMonacoEditorViewZones: () => {
            dale.updateMonacoEditorViewZones();
            dale.updateMonacoEditorViewZonesDisposer =
                dale.monacoEditor.onDidChangeModelContent(
                    dale.updateMonacoEditorViewZones
                );

            dale.resetMonacoEditorViewZonesDisposer =
                dale.monacoEditor.onDidChangeModel(dale.resetMonacoEditorViewZones);

            dale.disableMonacoEditorViewZones = () => {
                dale.resetMonacoEditorViewZones();
                dale.updateMonacoEditorViewZonesDisposer?.dispose();
                dale.resetMonacoEditorViewZonesDisposer?.dispose();
                dale.updateMonacoEditorViewZonesDisposer = null;
                dale.resetMonacoEditorViewZonesDisposer = null;
            };

            return dale.disableMonacoEditorViewZones;

        },
        disableMonacoEditorViewZones: () => {
            // set by enableMonacoEditorViewZones
        },
    };


    dale.filterDuplicateDecorations = (decorations, model) => {
        return decorations.filter(({range, options}) => {
            if (!range || !options) {
                return false;
            }
            const {inlineClassName} = options;

            return !model.getDecorationsInRange(range)?.find(
                id => (
                    range.equalsRange(model.getDecorationRange(id)) &&
                    model.getDecorationOptions(id)?.inlineClassName === inlineClassName
                )
            );
        });

    }

    dale.stop = () => {
        // console.log("STOP");
        const {
            syntaxFragmentsReset,
            syntaxFragmentsImportsReset,
        } = dale.ref.current;

        syntaxFragmentsReset?.();
        syntaxFragmentsImportsReset?.();

    };

    dale.start = () => {

        const {zale} = aleInstance.getModel();
        const {zones, importZones} = zale ?? {};
        const removeIds = dale.monacoEditor?.getModel()?.getAllDecorations(undefined, true)?.map(d => d.id) ?? [];
        // console.log("START", {zones, importZones}, removeIds);
        removeIds.length && dale.monacoEditor?.removeDecorations(removeIds);
        const {
            syntaxFragments,
            syntaxFragmentsNormalize,
            syntaxFragmentsReset,
        } = dale.makeSyntaxFragments(zones);

        const {
            syntaxFragmentsImports,
            syntaxFragmentsImportsNormalize,
            syntaxFragmentsImportsReset,
        } = dale.makeSyntaxFragmentsImports(importZones);

        syntaxFragmentsNormalize?.();
        syntaxFragmentsImportsNormalize?.();

        return dale.ref.current = {
            syntaxFragments,
            syntaxFragmentsNormalize,
            syntaxFragmentsReset,
            syntaxFragmentsImports,
            syntaxFragmentsImportsNormalize,
            syntaxFragmentsImportsReset,
        };
    };

    dale.setOnChangeLocLiveZoneDecorations = (onChangeLocLiveZoneDecorations) => {
        dale.onChangeLocLiveZoneDecorations = onChangeLocLiveZoneDecorations;
        dale.onChangeLocLiveZoneDecorations?.(Date.now());
    };

    dale.onDidChangeModelContentDisposer =
        dale.monacoEditor.onDidChangeModelContent(aleInstance.handleChangeContent);

    dale.onDidDisposeDisposer = monacoEditor.onDidDispose(dale.stop);
    dale.onDidChangeModelDisposer = monacoEditor.onDidChangeModel(
        () => {
            aleInstance.handleChangeContent();
        }
    );

    dale.dispose = () => {
        dale.stop();
        dale.contentWidgetManager?.unobserve();
        dale.onDidChangeModelContentDisposer?.dispose();
        dale.onDidChangeModelDisposer?.dispose();
        dale.onDidDisposeDisposer?.dispose();
    };

    dale.getShortValueInRanges = (ranges) => {
        const model = dale.monacoEditor.getModel();
        return ranges.reduce((r, e) => `${r}${model.getValueInRange(e)}`, '');
    }

    dale.getValueInRanges = (ranges) => {
        if (!ranges || !ranges.length) {
            return '';
        }

        const model = dale.monacoEditor.getModel();
        const wholeRange = ranges.reduce((r, e) => r.plusRange(e), ranges[0]);

        return model.getValueInRange(model.validateRange(wholeRange));
    }

    dale.getSyntaxFragment = (expressionId) => {
        const syntaxFragment = dale.ref.current?.syntaxFragments?.[expressionId];
        return [
            expressionId,
            syntaxFragment?.sourceText,
            syntaxFragment
        ];
    };

    dale.makeSyntaxFragments = (zones) => {
        if (!zones) {
            return {};
        }

        const syntaxFragments = {};
        const syntaxFragmentsNormalizers = [];
        const syntaxFragmentsResets = [];

        zones.forEach(
            (zone, i) => {
                const {expressionId} = zone;
                const syntaxFragment = new SyntaxFragment(dale, zone);
                syntaxFragments[expressionId] = syntaxFragment;
                syntaxFragmentsNormalizers[i] = () => syntaxFragment.decorate();
                syntaxFragmentsResets[i] = () => syntaxFragment.unDecorateAll();
            }
        );

        const syntaxFragmentsNormalize = () => {
            for (const i in syntaxFragmentsNormalizers) {
                syntaxFragmentsNormalizers[i]?.();
            }
        }

        const syntaxFragmentsReset = () => {
            for (const i in syntaxFragmentsResets) {
                syntaxFragmentsResets[i]?.();
            }
        }

        return {
            syntaxFragments,
            syntaxFragmentsNormalize,
            syntaxFragmentsReset,
        };

    };

    dale.makeSyntaxFragmentsImports = (importZones) => {
        if (!importZones) {
            return {};
        }

        const syntaxFragmentsImports = {};
        const syntaxFragmentsImportsNormalizers = {};
        const syntaxFragmentsImportsResets = {};

        for (const importSource in importZones) {
            importZones[importSource].forEach((zone, i) => {
                // console.log("makeSyntaxFragmentsImports");
                syntaxFragmentsImports[importSource] ??= [];
                syntaxFragmentsImportsNormalizers[importSource] ??= [];
                syntaxFragmentsImportsResets[importSource] ??= [];
                const syntaxFragment = new SyntaxFragment(dale, zone);
                syntaxFragmentsImports[importSource][i] = syntaxFragment;
                syntaxFragmentsImportsNormalizers[importSource][i] =
                    () => syntaxFragment.decorate(
                        LiveZoneDecorationStyles.default, false
                    );
                syntaxFragmentsImportsResets[importSource][i] =
                    () => syntaxFragment.unDecorateAll();
            });
        }

        const syntaxFragmentsImportsNormalize = () => {
            for (const importSource in syntaxFragmentsImportsNormalizers) {
                const importZoneSyntaxFragment =
                    syntaxFragmentsImportsNormalizers[importSource] ?? [];
                for (const i in importZoneSyntaxFragment) {
                    importZoneSyntaxFragment[i]?.();
                }
            }
        };

        const syntaxFragmentsImportsReset = () => {
            for (const importSource in syntaxFragmentsImportsResets) {
                const importZoneSyntaxFragment =
                    syntaxFragmentsImportsResets[importSource] ?? [];
                for (const i in importZoneSyntaxFragment) {
                    importZoneSyntaxFragment[i]?.();
                }
            }
        };

        return {
            syntaxFragmentsImports,
            syntaxFragmentsImportsNormalize,
            syntaxFragmentsImportsReset,
        };
    };
    dale.getSyntaxFragmentImport = (importSource, i) => {
        const entry = dale.ref.current?.syntaxFragmentsImports?.[importSource]?.[i];
        return [
            i,
            entry?.sourceText,
            entry,
            importSource
        ];
    };

    dale.defaultOnChangeHandler = () => { // no React
        dale.stop();
        return dale.start();
    };

    dale.onContentChange = () => {
        if (dale.isStandAlone) {
            dale.defaultOnChangeHandler();
            return;
        }

        dale.onChangeLocLiveZoneDecorations?.(Date.now());
    };
    // console.log(" dale.contentWidgetManager.observe();");
    dale.contentWidgetManager.observe();
    return dale;
}
