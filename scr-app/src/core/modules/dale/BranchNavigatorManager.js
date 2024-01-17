import BranchNavigator, {LogValue} from "./BranchNavigator";
import {LiveZoneDecorationStyles, ScopeExitTypes, ScopeTypes, TraceEvents} from "../ALE";
import {ZoneDecorationType} from "./DALE";

export default class BranchNavigatorManager {
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

    enterScope(uid, i, zone, tryBlockType, extraZone, paramsIdentifier, scopeEnterStateValues) {

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
        scope.enter(i, zone, paramsIdentifier, scopeEnterStateValues);
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

        let zone = zale.zones[scopeMap?.expressionId];
        return zone;
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

    locLiveZoneActiveDecorationsPush = (zone, logValues, locToMonacoRange, getBranchNavigator, forcePush = false, isImport = false, isError = false) => {
        const {dale} = this.aleInstance;
        // console.log("locLiveZoneActiveDecorationsPush", dale);
        const options = ZoneDecorationType.resolveType(
            zone, LiveZoneDecorationStyles.active
        );


        // console.log("locLiveZoneActiveDecorationsPush", this.locLiveZoneActiveDecorations, this.locLiveZoneActiveDecorations.find(locLiveZoneActiveDecoration => {
        //     const {expressionId} = locLiveZoneActiveDecoration?.zone ?? {};
        //     return expressionId ==6; //&& console.log("onDecorationsChange", {expressionId, locLiveZoneActiveDecoration});
        // }));

        let activate = false;

        if (isError) {
            activate = true;
            console.log("ERROR", zone);
        }

        // zone.locLiveZones.getHighlights().forEach(loc => {
        //    locLiveZoneActiveDecorations.push({
        //       options,
        //       range: locToMonacoRange?.(loc),
        //    });
        // });
        const loc = zone.locLiveZones.getMainAnchor();
        const range = locToMonacoRange?.(loc);
        // console.log("locToMonacoRange", locToMonacoRange);
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
        if (zone?.parentType === "IfStatement" || isError) { // && zone?.key !== 'test'
            // console.log('IfStatement ', {zone, range, logValues, found, b: getBranchNavigator()});
            syntaxFragment = dale.getSyntaxFragment(zone.expressionId)?.[2];
            activate = true;
        }

        if (logValues?.length && zone.type === "CallExpression") {
            const lv = logValues[0];
            const expressionId = lv.zone.expressionId;
            const expressionType = lv.entry.logValue.objectType;
            const syntaxFragment = dale.getSyntaxFragment(lv.zone.expressionId)?.[2];

            //const focusRange = syntaxFragment.getSourceTextFocusRange();
            const range = syntaxFragment.expressionRange();
            const rRange = syntaxFragment.ranges[syntaxFragment.ranges.length - 1];
            console.log("syntaxFragment.ranges[syntaxFragment.ranges.length - 1]", syntaxFragment, range, rRange);
            const aleFirecoPad = this.aleInstance.getModel().firecoPad;
            aleFirecoPad?.behaviors?.().monacoInlayHintsSubjectNextCallExpression({
                expressionId,
                expressionType,
                options: {kind: "Type"},
                range,
            });
            // console.log("CallExpression  c", zone, lv.getValue(), lv, focusRange, syntaxFragment);
            // dale.inLay();
        }

        if (zone?.parentType === "ForInStatement"
            // || zone?.parentType === "ForOfStatement"
        ) { // && zone?.key !== 'test' //zone?.parentType === "ForInStatement"
            if (logValues?.length) {
                const expressionId = logValues[0]?.zone.expressionId;
                if (expressionId) {
                    syntaxFragment = dale.getSyntaxFragment(expressionId)?.[2];
                    if (syntaxFragment) {
                        activate = true;
                    }
                }

                // const loopExpressionId = logValues[0]?.zone?.expressionId;
                //
                // if (loopExpressionId > -1 && logValues?.length) {
                //     syntaxFragment = dale.getSyntaxFragment(loopExpressionId)?.[2] ?? syntaxFragment;
                //     activate = true;
                // }
                // console.log('ForInStatement ', logValues?.length, {
                //     syntaxFragment,
                //     zone,
                //     range,
                //     logValues,
                //     found,
                //     b: getBranchNavigator()
                // });

            }
        }


        // if (zone?.functionParams) {
        //     console.log('functionParams', logValues?.length, {
        //         syntaxFragment,
        //         zone,
        //         range,
        //         logValues,
        //         found,
        //         b: getBranchNavigator()
        //     });
        // }


        if (isImport) {
            syntaxFragment = dale.getSyntaxFragmentImport(zone?.importSourceName, 0)?.[2];
            activate = true;
        }


        if (!activate && (forcePush || !found)) {
            syntaxFragment = dale.getSyntaxFragment(zone.expressionId)?.[2];
            activate = !!syntaxFragment;
            if (zone?.parentSnapshot?.type === "VariableDeclarator") {
                // && zone.liveZoneType === LiveZoneTypes.B
                const vRange = dale.locToMonacoRange(zone.parentSnapshot.locLiveZones.mainAnchor);
                parentSyntaxFragment = dale.getSyntaxFragment(zone.parentSnapshot.expressionId)?.[2];
                //todo
                //console.log("Fix declarator highlight here>>", zone, vRange, parentSyntaxFragment);
            }

        }

        //TODO: ADD THE LEFT FROM FORX !!!!! SEPARATE FROM BLOCK AND EXPRESSION IDS
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
        // if (activate) {
        //
        //
        //     const p = {
        //         // : false,
        //         isImport,
        //         zone,
        //         logValues,
        //         options,
        //         range,
        //         getBranchNavigator,
        //         syntaxFragment,
        //         parentSyntaxFragment,
        //     };
        //     const extraFragments = syntaxFragment.extraFragments();
        //
        //     if (extraFragments?.length) {
        //         extraFragments.forEach(ef => {
        //             const range = ef.getSourceTextFocusRange();
        //             this.locLiveZoneActiveDecorations.push({
        //                 ...p,
        //                 // isFunctionParams: true,
        //                 zone: ef.zone,
        //                 range,
        //                 parentSyntaxFragment: syntaxFragment
        //             });
        //         });
        //        // console.log("locLiveZoneActiveDecorationsPush", {zone, extraFragments});
        //     }
        //
        //
        //     // if (zone?.functionParams) {
        //     //     zone.functionParams.forEach(fp=>{
        //     //         const range = locToMonacoRange?.(fp.zone.loc);
        //     //         this.locLiveZoneActiveDecorations.push({...p, zone: fp.zone, range, parentSyntaxFragment: syntaxFragment});
        //     //     });
        //     //    // console.log("locLiveZoneActiveDecorationsPush", {zone, p});
        //     // }
        //
        //     this.locLiveZoneActiveDecorations.push(p);
        // }
    }

    handleTimelineChange = () => {
        // console.log("handleTimelineChange");
        if (!this.aleInstance) {
            return;
        }

        const {
            zale, bale, scr, dale, afterTraceChange, resetTimelineChange
        } = this.aleInstance.getModel();

        // console.log("c", {zale, bale, scr, dale, afterTraceChange, resetTimelineChange});

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
                tryBlockType, scopeExitType, paramsIdentifier, idValue
            } = entry;
            let zone = null;
            let branchNavigator = null;

            let ignore = false;
            let isImport = false;
            let isError = false;
            let expressionId = pre?.expressionId;
            switch (traceEventType) {
                case TraceEvents.L:
                    zone = zale.zones[pre?.expressionId];
                    values[expressionId] = values[expressionId] ?? [];
                    logValues = values[expressionId];
                    logValues.push(
                        new LogValue({
                            i,
                            uid,
                            zone,
                            entry,
                        })
                    );
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
                    const extraZone = zale.zones[extraExpressionId ?? uid];
                    expressionId = extraZone?.expressionId;
                    const {parentPathI} = zone;

                    let y = false;
                    if (zone?.parentType === "ForInStatement") { //|| zone?.parentType === "ForOfStatement"
                        y = true;
                        values[parentPathI] = values[parentPathI] ?? [];
                        logValues = values[parentPathI];
                    } else {
                        values[expressionId] = values[expressionId] ?? [];
                        logValues = values[expressionId];
                    }


                    const scopeEnterStateValues = entry;

                    branchNavigator = this.enterScope(
                        uid, i, zone, tryBlockType, extraZone, paramsIdentifier, scopeEnterStateValues
                    );


                    logValues.push(
                        new LogValue({
                            i,
                            uid,
                            zone: extraZone,
                            entry,
                        })
                    );
                    const cb = branchNavigator.current();
                    cb.logValues = logValues;


                    if (zone?.scopeType === "function") {
                        //paramsIdentifier
                        console.log('I', {
                            y,
                            parentPathI,
                            expressionId,
                            idValue,
                            values,
                            uid,
                            extraExpressionId,
                            zone,
                            entry,
                            extraZone,
                            branchNavigator,
                            logValues
                        });
                    }

                    break;
                case TraceEvents.R:
                    break;
                case TraceEvents.E:
                    zone = entry.zoneData?.[2];
                    isError = true;
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
                zone, logValues, locToMonacoRange, getBranchNavigator, false, isImport, isError
            );
        }

        // this.setLastTimelineLength((scr.timeline.length || 1) - 1); // s1: solved changing to "to" value
        this.setLastTimelineLength(to);
        // todo: adds anchors deltas, group locs by anchor,
        //  and pass only delta anchors to afterTC, then render in rale
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
            scr.timeline, isTraceReset, timelineDataDelta, [from, to], this.getProgramEndTimelineI(), values, scr.errorsData
        );
    };

// handleMouseActionDecoration = (mouseActionDecorations) => {
//     if (!this.aleInstance) {
//         return;
//     }
//
//     const {
//         dale
//     } = this.aleInstance.getModel();
//
//     if (!dale?.locToMonacoRange) {
//         return;
//     }
//
//     console.log("handleMouseActionDecoration", mouseActionDecorations);
//     const zoneDecorations = [];
//     mouseActionDecorations.forEach(decoration => {
//         const zoneDecoration = this._getActiveZoneByDecorationId?.(decoration.id);
//         const zone = zoneDecoration?.zone;
//         zone?.locLiveZones.getHighlights().forEach(loc => {
//             zoneDecorations.push({
//                 options: ZoneDecorationType.resolveType(
//                     zone, LiveZoneDecorationStyles.hover
//                 ),
//                 range: dale.locToMonacoRange(loc),
//             });
//         });
//     });
//
//     return zoneDecorations;
// };
}
