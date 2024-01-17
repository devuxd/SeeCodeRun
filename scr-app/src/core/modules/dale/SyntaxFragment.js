import {
    // ScopeTypes,
    // TraceEvents,
    // LiveZoneTypes,
    // ScopeExitTypes,
    LiveZoneDecorationStyles,
} from "../ALE";
// a fragment visualizes a role-dependent focus of a syntax expression.
// const f = function(args){ let i = 0; return i++};
// f is a reference role becomes
// const f = function(...){...};

export const SyntaxTypeChecks = {
    forX: ["ForInStatement", "ForOfStatement"],
};


export const defaultOptionsToCompare = [
    // "inlineClassName", // they don't match from deltaoptions to modeldecorations: ale.r => ale r not preceise
    "zIndex"
];
export const areDecorationOptionsEquivalent = (decorationStyleOptions, modelDecorationOptions, optionsToCompare = defaultOptionsToCompare) => {
    return !optionsToCompare.find(
        option =>
            // console.log("oe", {option, decorationStyleOptions, modelDecorationOptions}, decorationStyleOptions[option], modelDecorationOptions[option])??
            decorationStyleOptions[option] != modelDecorationOptions[option]);

};

export const areDecorationStylesEquivalent = (decorationStylesOptions, modelDecorationOptions, optionsToCompare = defaultOptionsToCompare) => {
    return Object.values(
        decorationStylesOptions
    ).find(
        decorationStyleOptions =>
            // console.log("oe!",decorationStyleOptions)??
            areDecorationOptionsEquivalent(decorationStyleOptions, modelDecorationOptions, optionsToCompare)
    );
}

export default class SyntaxFragment {
    _syntaxWidget = null;
    _graphicalLocator = null;
    syntaxWidget = (syntaxWidget = undefined) => {
        if (syntaxWidget !== undefined) {
            this._syntaxWidget = syntaxWidget;
        }

        return this._syntaxWidget;

    };
    graphicalLocator = (graphicalLocator = undefined) => {
        if (graphicalLocator !== undefined) {
            this._graphicalLocator = graphicalLocator;
        }

        return this._graphicalLocator;

    };

    constructor(dale, zone, decorationStyles, isFunctionParams = false) {
        this.dale = dale;
        this.zone = zone;
        this.decorationStyles = decorationStyles;
        this.isFunctionParams = isFunctionParams;
        // console.log("zone", zone);
        const extraFragments = [];
        if (zone?.functionParams) {
            zone.functionParams.forEach(fp => {
                const {zone: fZone} = fp;
                fZone && extraFragments.push(new SyntaxFragment(dale, fZone, decorationStyles, true));
            });
            console.log("extraFragments", {extraFragments});
        }

        this.extraFragments = () => extraFragments;

        this.getSourceTextFocusRange = () => {
            return zone.node?.loc && dale.locToMonacoRange(zone.node.loc);
        }

        const expressionRange = this.getSourceTextFocusRange();
        this.expressionRange = () => expressionRange;

        this.rawRanges = [expressionRange];
        this.rawAlternateRanges = this.rawRanges;

        if (zone.locLiveZones) {
            this.rawRanges = zone.locLiveZones.getHighlights().map(
                loc => dale.locToMonacoRange(loc)
            );

            this.rawAlternateRanges = zone.locLiveZones.getAlternateHighlights().map(
                loc => dale.locToMonacoRange(loc)
            );
        }


        // console.log("ZE", zone);
        this.ranges = dale.rangeCompactor.compactRanges(this.rawRanges);
        this.alternateRanges = dale.rangeCompactor.compactRanges(this.rawAlternateRanges);


        const sourceTextFocusRange = this.getSourceTextFocusRange();
        const allRanges = [...this.ranges];
        sourceTextFocusRange && allRanges.unshift(sourceTextFocusRange);

        this.sourceText = dale.getValueInRanges(allRanges);

        this.sourceTextFocus = sourceTextFocusRange ? dale.getValueInRanges([sourceTextFocusRange]) : 'N/A';

        this.type = () => {
            return this.zone?.type;
        }

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

        this.expressionTest = () => {
            return this.zone?.key === "test";
        };

        this.forBlock = () => {
            return this.zone?.parentType === "ForStatement";
        }

        this.expressionInit = () => {
            return this.zone?.key === "init";
        };

        this.expressionUpdate = () => {
            return this.zone?.key === "update";
        };

        this.expressionRight = () => {
            return this.zone?.key === "right";
        };

        this.expressionLeft = () => {
            return this.zone?.key === "left";
        };

        this.forBlockInit = () => {
            return this.expressionInit() && !!this.dale?.getAleInstance?.()?.zale?.lookupZoneParentByType(this.zone, "ForStatement");
        };

        this.forXRight = () => {
            return (this.expressionRight() && !!this.dale?.getAleInstance?.()?.zale?.lookupZoneParentByTypes(this.zone, SyntaxTypeChecks.forX));
        }

        this.forXLeft = () => {
            return (this.expressionLeft() && !!this.dale?.getAleInstance?.()?.zale?.lookupZoneParentByTypes(this.zone, SyntaxTypeChecks.forX));
        }


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
            if (!this.ifBlock() && this.expressionTest()) {
                // console.log("loop?", zone.type, {zone, currentRanges, decorationStyle, value});
            }

            if (this.forXRight() || this.forXLeft()) {
                const focusRange = this.getSourceTextFocusRange();
                if (focusRange) {
                    currentRanges = [focusRange];
                }

                // console.log("forInRight", zone.type, {zone, currentRanges, decorationStyle, value});
            }

            if (zone.type === "CallExpression") {
                // console.log("zone", zone, value);

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
            const hoverOptions = decorationStyles[LiveZoneDecorationStyles.hover];

            if (decorationStyle === LiveZoneDecorationStyles.active) {
                if (zone.type === "VariableDeclarator" && zone.locLiveZones?.mainAnchor) {
                    const vRange = dale.locToMonacoRange(zone.locLiveZones.mainAnchor);
                    console.log("GOTCHA", vRange);
                    currentRanges = [vRange];
                }
            }

            const zoneDecorations = [...currentRanges.map(
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

            const hoverZoneDecorations = zoneDecorations.map(
                ({range}) => ({range, options: hoverOptions})
            );

            return [
                zoneDecorations,
                hoverZoneDecorations,
                hoverOptions.inlineClassName?.replaceAll(".", " ")
            ];

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
            if (this) {
                return;
            }


            const zd = [
                ...(this._zoneDecorations ?? []),
                ...zoneDecorations
            ];

            const decorationIds = {};
            zd.forEach((z) => {
                const zoneRange = z.range;
                const decorationsInRange = (this.dale.monacoEditor.getDecorationsInRange(zoneRange));
                // console.log("decorationsInRange", zoneRange, decorationsInRange);
                decorationsInRange?.forEach((decoration) => {
                        const {id, range, options} = decoration;

                        //todo filter by _decorationStyle
                        // const ff = ;
                        // // console.log("PP", ff, this.decorationStyles, decoration.options);
                        // ff && console.log("zd", ff, {
                        //     decoration,
                        //     zoneRange,
                        //     range
                        // });
                        // if (this._decorationStyle === LiveZoneDecoratio nStyles.active && !range.equalsRange(zoneRange)) {
                        //     return;
                        // }
                        if (areDecorationStylesEquivalent(this.decorationStyles, options)) {
                            decorationIds[id] = decoration;
                        }
                    }
                );
            });

            this.dale.monacoEditor.removeDecorations(Object.keys(decorationIds));
        };

        this._hovered = false;

        this.decorate = (
            decorationStyle = LiveZoneDecorationStyles.default,
            isReset = false,
            value = 0,
        ) => {


            if (decorationStyle && this._decorationStyle !== decorationStyle) {
                if (decorationStyle === LiveZoneDecorationStyles.hover) {
                    if (this._hoverZoneDecorations) {
                        // this.clear(this._hoverZoneDecorations);
                        // decoratorCollection?.clear();
                        if (isReset) {
                            decoratorCollection?.set(this._zoneDecorations);
                            this.syntaxWidget()?.hover();
                            this._hovered = false;
                        } else {
                            decoratorCollection?.set(
                                this._hoverZoneDecorations
                                // [...(this._zoneDecorations ?? []), ...this._hoverZoneDecorations]
                            );
                            this.syntaxWidget()?.hover(this._hoverClassName);
                            this._hovered = true;
                        }
                    }

                } else {
                    const [
                        zoneDecorations,
                        hoverZoneDecorations,
                        hoverClassName

                    ] = this.makeZoneDecorations(decorationStyle, value);
                    // this.clear(zoneDecorations);
                    // this.clear(hoverZoneDecorations);
                    // decoratorCollection?.clear();
                    decoratorCollection?.set(zoneDecorations);
                    this._decorationStyle = decorationStyle;
                    this._zoneDecorations = zoneDecorations;
                    this._hoverZoneDecorations = hoverZoneDecorations;
                    this._hoverClassName = hoverClassName;

                }
                // decoratorCollection?.clear();


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
                const [zoneDecorations, hoverZoneDecorations] = this.makeZoneDecorations(decorationStyle);
                // decoratorCollection?.clear();
                // this.clear(zoneDecorations);
                // this.clear(hoverZoneDecorations);
                decoratorCollection?.clear();
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

        this.startHover = () => {
            this.decorate(
                LiveZoneDecorationStyles.hover, false
            );
        }

        this.stopHover = () => {
            this.decorate(
                LiveZoneDecorationStyles.hover, true
            );
        }

        this.getHoverClassName = () => {
            return this._hoverClassName;
            // this._hovered?
            //     this._hoverClassName
            // : null
            // ;
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
