import {
    ScopeTypes,
    // TraceEvents,
    // ScopeExitTypes,
    LiveZoneTypes,
    LiveZoneDecorationStyles,
} from "../ALE";
// import {range} from "lodash";

import ContentWidgetManager from "./ContentWidgetManager";
import SyntaxFragment from "./SyntaxFragment";
import {MonacoExpressionClassNames} from "../../../themes";

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
    normal: 100,
    active: 200,
    hover: 300,
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

export const mouseActionTypes = {
    mousemove: "mousemove",
    mousedown: "mousedown",
    mouseleave: "mouseleave",
    contextmenu: "contextmenu"
};

const makeDALERefDefaultState = () => {
    return {
        syntaxFragments: null,
        syntaxFragmentsReset: null,
        syntaxFragmentsImports: null,
        syntaxFragmentsImportsReset: null,
    }
};

const DALE = ({monacoEditor, monaco, aleInstanceSubject, contentWidgetManager, onViewZoneChange}) => {
    const locToMonacoRange = configureLoc2Range(monaco);

    const rangeCompactor = configureRangeCompactor(monaco);


    const createCommentDecorator = (commentDecorator = {}) => {
        let commentDecorationsCollection = commentDecorator.commentDecorationsCollection;

        if (!commentDecorationsCollection || monacoEditor !== commentDecorator.monacoEditor) {
            commentDecorationsCollection?.clear();
            commentDecorationsCollection = monacoEditor.createDecorationsCollection();
        }

        const commentLocs2Ranges = (commentsLocs = []) => commentsLocs.map(loc => ({
            range: locToMonacoRange(loc),
            options: {
                isWholeLine: true,
                glyphMarginClassName: MonacoExpressionClassNames.commentGlyphMarginClassName,
            },
        }));
        const update = (commentsLocs = []) => {
            return commentDecorationsCollection.set(commentLocs2Ranges(commentsLocs));
        };

        return {
            ...commentDecorator,
            monacoEditor,
            update,
            commentDecorationsCollection,
            commentLocs2Ranges
        }
    };

    let aleInstance = null;

    const dale = {
        createCommentDecorator,
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

    dale.removeAll = () => {
        // const allDecorations = dale.monacoEditor?.getModel()?.getAllDecorations(undefined, true);
        // // console.log("allDecorations", allDecorations);
        // const removeIds = allDecorations?.map(d => d.id) ?? [];
        // // console.log("START", {zones, importZones}, removeIds);
        //
        // if (removeIds.length) {
        //     removeIds.forEach(id => {
        //             dale.contentWidgetManager.removeContentWidgetById(id);
        //         }
        //     );
        //     dale.monacoEditor?.removeDecorations(removeIds);
        // }
    };

    dale.start = (aleInstance) => {


        const {zale} = aleInstance.getModel();
        const {zones, importZones} = zale ?? {};

        // console.log("dale.start", aleInstance, {zones, importZones, zale});
        const {
            syntaxFragments,
            syntaxFragmentsNormalize,
            syntaxFragmentsReset,
        } = dale.makeSyntaxFragments(zones);

        // console.log("START", {zones, importZones, syntaxFragments});

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

    // dale.onDidChangeModelContentDisposer =
    //     dale.monacoEditor.onDidChangeModelContent(aleInstance.handleChangeContent);

    dale.onDidDisposeDisposer = monacoEditor.onDidDispose(dale.stop);
    // dale.onDidChangeModelDisposer = monacoEditor.onDidChangeModel(
    //     () => {
    //         aleInstance.handleChangeContent();
    //     }
    // );

    dale.dispose = () => {
        dale.stop();
        // dale.onDidChangeModelContentDisposer?.dispose();
        // dale.onDidChangeModelDisposer?.dispose();
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

    dale.makeSyntaxFragment = (zone, _dale = dale) => {
        const {liveZoneType, scopeType} = zone;
        return new SyntaxFragment(_dale, zone, ZoneDecorationType.resolve(liveZoneType, scopeType));
    };

    dale.inLay = (position, label)=>{
        const i =monaco.languages.registerInlayHintsProvider("javascript", {
            provideInlayHints(...p) {
                // console.log("p", p);
                return {
                    hints: [
                        {
                            kind: monaco.languages.InlayHintKind.Type,
                            position,
                            label,
                            whitespaceBefore: true, // see difference between a and b parameter
                        },
                    ],
                    dispose: () => {},
                };
            },
        });
    }

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
                const syntaxFragment = dale.makeSyntaxFragment(zone);
                syntaxFragments[expressionId] = syntaxFragment;
                // console.log("j = n;",syntaxFragment )
                // if (syntaxFragment.sourceText === "j = n;") {
                //     console.log("j = 0", syntaxFragment)
                // }

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
                const syntaxFragment = dale.makeSyntaxFragment(zone);
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
        // aleInstance = _aleInstance;
        dale.stop(aleInstance);
        return dale.start(aleInstance);
    };

    dale.onContentChange = () => {
        // if (dale.isStandAlone) {
        //     dale.defaultOnChangeHandler();
        //     return;
        // }
        dale.defaultOnChangeHandler();
        dale.onChangeLocLiveZoneDecorations?.(Date.now());
    };

    aleInstanceSubject().subscribe(({aleInstance: _aleInstance}) => {
        aleInstance = _aleInstance;
        if (!aleInstance) {
            return;
        }
        // console.log("aleInstanceSubject", aleInstanceSubject);
        dale.defaultOnChangeHandler(aleInstance);
        // dale.defaultOnChangeHandler(aleInstance);
    });

    return dale;
}

export default function decorateALEExpressions(aleFirecoPad) {
    const {
        aleInstanceSubject,
        monacoEditorSubject,
        contentWidgetManagerSubject,
        daleSubject
    } = aleFirecoPad.behaviors();

    const onViewZoneChange = aleFirecoPad;

    let contentWidgetManager = null;

    const next = ({monacoEditor, monaco,}) => {
        if (!(monacoEditor && monaco)) {
            return;
        }
        contentWidgetManager = new ContentWidgetManager(
            monacoEditor,
            monaco,
        );
        contentWidgetManager.observe();
        contentWidgetManagerSubject().next({contentWidgetManager});
        const dale = DALE({monacoEditor, monaco, aleInstanceSubject, contentWidgetManager, onViewZoneChange});
        daleSubject().next({dale});
    };

    const complete = () => {
        contentWidgetManager?.unobserve();
    };

    const error = complete;

    monacoEditorSubject().subscribe({
        next,
        error,
        complete,
    });
}
