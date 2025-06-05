import React, {useRef, useState, useMemo, useCallback, useEffect, useContext, createContext} from 'react';

import deferComponentRender, {
    makeTaskQueue
} from '../../../utils/renderingUtils'


import VALE from './VALE';
import {LiveZoneDecorationStyles, LiveZoneTypes, ScopeTypes} from "../ALE";
import ALEContext from "./ALEContext";
import PastebinContext from "../../../contexts/PastebinContext";

const getAllCurrentScopes = (navigationStates) => {
    const allCurrentScopes = {};
    for (let key in navigationStates) {
        const {branchNavigator, currentBranchEntry} = navigationStates[key];
        if (currentBranchEntry) {
            const uid = branchNavigator.uid();
            const loopScopeUID = branchNavigator.getLoopScopeUID();
            allCurrentScopes[uid] = {
                branchNavigator,
                currentBranchEntry
            };
            if (loopScopeUID) {
                allCurrentScopes[loopScopeUID] = allCurrentScopes[uid];
            }
        }
    }
    return allCurrentScopes;
};

const makeBranchesStates = (keys, contentWidgets, timestamp) => {
    const allBranchNavigators = {timestamp};
    const allBranches = [];
    const resetAllTimeBranches = [];

    // console.log("branchNavigator>>>>")
    keys.forEach(key => {
        const contentWidget = contentWidgets[key];
        const branchNavigator = contentWidget?.locLiveZoneActiveDecoration?.getBranchNavigator();

        if (!branchNavigator) {
            return;
        }

        const branches = [];
        branchNavigator.paths().forEach((path, pathI) => {
            path.forEach((branch, branchI) => {
                branches.push({
                    key,
                    path,
                    pathI,
                    branch,
                    branchI,
                    toString: () =>
                        `{key:'${key}',pathI:'${pathI}',branchI:'${branchI}'}`,
                    parentBranch: null, // isAbsolute
                    childrenBranches: [], // isLeaf
                });
            });
        });

        const branchNavigatorEntry = {
            branchNavigator,
            branches,
            relativeBranches: {},
            containingParents: {},
            pastBranches: [],
            presentBranches: [],
            futureBranches: [],
        };

        branchNavigatorEntry.resetTimeBranches = () => {
            branchNavigatorEntry.pastBranches = [];
            branchNavigatorEntry.presentBranches = [];
            branchNavigatorEntry.futureBranches = [];
        };

        resetAllTimeBranches.push(branchNavigatorEntry.resetTimeBranches);
        allBranchNavigators[key] = branchNavigatorEntry;
        allBranches.push(...branches);
    });

    allBranches.forEach(branchEntry => {
        if (branchEntry.branch.out < 0) {
            return;
        }

        allBranches.forEach(_branchEntry => {
            if (_branchEntry.branch.out < 0) {
                return;
            }
            if (branchEntry?.toString() === _branchEntry?.toString()) {
                return;
            }

            let parentBranchEntry = null;
            let parentBranchEntryString = null;
            let childBranchEntry = null;
            let childBranchEntryString = null;
            if (
                branchEntry.branch.in <= _branchEntry.branch.in &&
                _branchEntry.branch.out <= branchEntry.branch.out
            ) {
                parentBranchEntry = branchEntry;
                parentBranchEntryString = parentBranchEntry.toString();
                childBranchEntry = _branchEntry;
                childBranchEntryString = childBranchEntry.toString();
            }

            if (parentBranchEntry) {
                let relativeBranches =
                    allBranchNavigators[childBranchEntry.key]
                        .relativeBranches[parentBranchEntry.key];
                if (!relativeBranches) {
                    relativeBranches = {};
                    allBranchNavigators[childBranchEntry.key]
                        .relativeBranches[parentBranchEntry.key] = relativeBranches;
                }

                relativeBranches[childBranchEntryString] = childBranchEntry;

                allBranchNavigators[childBranchEntry.key]
                    .containingParents[parentBranchEntryString] = parentBranchEntry;

                const isSmallestParentBranch =
                    !childBranchEntry.parentBranch || (
                        parentBranchEntry.branch.in < childBranchEntry.parentBranch.branch.in
                        &&
                        childBranchEntry.parentBranch.branch.out <= parentBranchEntry.branch.out
                    );

                if (isSmallestParentBranch) {
                    const index =
                        childBranchEntry.parentBranch?.childrenBranches.indexOf(
                            childBranchEntry
                        );
                    if (index > -1) {
                        childBranchEntry.parentBranch.childrenBranches.splice(
                            index, 1
                        );
                    }
                    childBranchEntry.parentBranch = parentBranchEntry;
                    parentBranchEntry.childrenBranches.push(childBranchEntry);
                }
            }
        });
    });

    const resetTimeBranches = () => {
        resetAllTimeBranches.forEach(r => r());
    };

    const updateBranches = (selectedBranchEntry, setSelectedBranchEntry) => {
        const {
            in: pastI = -1,
            out: futureI = Infinity
        } = selectedBranchEntry?.branch ?? {};

        const selectedBranchEntryKey = selectedBranchEntry?.key;
        const selectedBranchEntryString = selectedBranchEntry?.toString();

        resetTimeBranches();

        allBranches.forEach((branchEntry) => {
            const {key, branch} = branchEntry;
            if (branch.in <= pastI && futureI <= branch.out) {
                allBranchNavigators[key].presentBranches.push(branchEntry);
                return;
            }

            if (branch.out <= pastI) {
                allBranchNavigators[key].pastBranches.push(branchEntry);
                return;
            }

            if (branch.in >= futureI) {
                allBranchNavigators[key].futureBranches.push(branchEntry);
                return;
            }

            allBranchNavigators[key].presentBranches.push(branchEntry);
        });
        const navigationStates = {};
        keys.forEach(k => {
            const branchNavigatorEntry = allBranchNavigators[k] ?? {};
            const {
                branchNavigator,
                branches,
                pastBranches,
                presentBranches,
                futureBranches,
                // relativeBranches,
                // containingParents,
            } = branchNavigatorEntry;

            const isSelected = selectedBranchEntryKey === k;
            const scopeType = branchNavigator?.zone?.scopeType;

            const absoluteMaxNavigationIndex = branches.length;
            let currentAbsoluteNavigationIndex;
            let relativeMaxNavigationIndex;
            let currentRelativeNavigationIndex;
            let currentBranchEntry = null;
            let currentBranches = [];

            const _selectedBranchEntry = branches.find(
                b => b.toString() === selectedBranchEntryString
            );
            const absoluteIndex = branches.indexOf(_selectedBranchEntry);
            // isSelected && console.log('branchNavigatorEntry', branchNavigatorEntry, absoluteIndex);
            if (absoluteIndex > -1) {
                currentAbsoluteNavigationIndex = absoluteIndex + 1;

                const pastIndex = pastBranches.indexOf(_selectedBranchEntry);
                if (pastIndex > -1) {
                    relativeMaxNavigationIndex = pastBranches.length;
                    currentRelativeNavigationIndex = pastIndex + 1;
                } else {
                    const presentIndex = presentBranches.indexOf(_selectedBranchEntry);
                    if (presentIndex > -1) {
                        relativeMaxNavigationIndex = presentBranches.length;
                        currentRelativeNavigationIndex = presentIndex + 1;
                    } else {
                        const futureIndex = futureBranches.indexOf(_selectedBranchEntry);
                        // if(futureIndex>-1){
                        relativeMaxNavigationIndex = futureBranches.length;
                        currentRelativeNavigationIndex = futureIndex + 1;
                        // }
                    }
                }

                // let parentBranchEntry = _selectedBranchEntry.parentBranch;
                //
                // while (parentBranchEntry) {
                //    if (
                //       parentBranchEntry.branch.in < branchEntry.branch.in &&
                //       branchEntry.branch.out < parentBranchEntry.branch.out
                //    ) {
                //       parentBranchEntry = _branchEntry;
                //       childBranchEntry = branchEntry;
                //    }
                //
                //    parentBranchEntry = parentBranchEntry.parentBranch
                // }


                currentBranchEntry = _selectedBranchEntry;
                // isSelected && console.log('branchNavigatorEntry', branchNavigatorEntry, absoluteIndex, relativeMaxNavigationIndex);
            } else {

                if (pastBranches.length === absoluteMaxNavigationIndex) {
                    currentAbsoluteNavigationIndex = absoluteMaxNavigationIndex;
                    relativeMaxNavigationIndex = pastBranches.length;
                    currentRelativeNavigationIndex = relativeMaxNavigationIndex;
                    currentBranchEntry =
                        pastBranches[currentRelativeNavigationIndex - 1];
                    currentBranches = pastBranches;
                } else {

                    if (futureBranches.length === absoluteMaxNavigationIndex) {
                        currentAbsoluteNavigationIndex = 0;
                        relativeMaxNavigationIndex = 0;
                        currentRelativeNavigationIndex = 0;
                        currentBranchEntry = null;
                        currentBranches = futureBranches;
                    } else {


                        currentAbsoluteNavigationIndex = pastBranches.length + presentBranches.length;
                        relativeMaxNavigationIndex = presentBranches.length;
                        currentRelativeNavigationIndex = relativeMaxNavigationIndex;
                        currentBranchEntry =
                            presentBranches[currentRelativeNavigationIndex - 1];
                        currentBranches = presentBranches;
                    }
                }
            }

            const handleChangeAbsoluteSelectedBranchEntry = (value) => {
                const nextSelectedBranchEntry = branches[value - 1];
                setSelectedBranchEntry({...nextSelectedBranchEntry});
            }

            const handleChangeRelativeSelectedBranchEntry = (value) => {
                const nextSelectedBranchEntry = currentBranches[value - 1];
                setSelectedBranchEntry({...nextSelectedBranchEntry});
            }

            const resetNavigation = () => {
                setSelectedBranchEntry(null);
            };

            navigationStates[k] = {
                branchNavigator,
                isSelected,
                scopeType,
                absoluteMaxNavigationIndex,
                currentAbsoluteNavigationIndex,
                relativeMaxNavigationIndex,
                currentRelativeNavigationIndex,
                currentBranchEntry,
                currentBranches,
                handleChangeAbsoluteSelectedBranchEntry,
                handleChangeRelativeSelectedBranchEntry,
                resetNavigation,
                branchNavigatorEntry,
            };
        });

        // console.log("navigationStates", navigationStates);

        return navigationStates;
    };

    return {
        allBranchNavigators,
        allBranches,
        resetTimeBranches,
        updateBranches
    };
};
//


const useNavigationStates = (keys, contentWidgets, searchState, timestamp) => {
    // console.log("useNavigationStates", {keys, contentWidgets, searchState, timestamp});
    const {value} = searchState ?? {};
    const [selectedBranchEntry, setSelectedBranchEntry] = useState({});
    const activeBranchEntry = value?.length ? null : selectedBranchEntry;


    const branchesStates = useMemo(
        () => {
            return makeBranchesStates(keys, contentWidgets, timestamp);
        },
        [keys, contentWidgets, timestamp]
    );

    return useMemo(
        () => {
            const navigationStates =
                branchesStates.updateBranches(activeBranchEntry, setSelectedBranchEntry);

            return {
                navigationStates,
                allCurrentScopes: getAllCurrentScopes(navigationStates)
            };

        },
        [branchesStates, activeBranchEntry]
    );
};


const emptyState = {};

const useRALE = () => {
    const {data, searchState} = useContext(PastebinContext);
    const {aleInstance} = useContext(ALEContext);
    const {
        // objectNodeRenderer,
        // getVisualIdsFromRefs,
        // cacheId,
        // onChange,
        bale,
        dale,
        scr,
        branchNavigatorManager,
    } = aleInstance?.getModel() ?? {};

    const objectNodeRenderer = scr?.objectNodeRenderer;

    const programUID = branchNavigatorManager?.programUID();
    const contentWidgets = dale?.contentWidgetManager?.getContentWidgets();
    // console.log("contentWidgets", aleInstance);

    // const r = useMemo(() => {
    //     console.log(">>>>> contentWidgets", contentWidgets);
    // }, [contentWidgets]);

    // Object.values(contentWidgets).forEach((contentWidget) => {
    //     contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.sourceTextFocus === "let n" && console.log("TTTTTTT", contentWidget);
    // });

    const resizeContentWidgets = dale?.contentWidgetManager?.resize;
    const timeline = data ?? [];

    // console.log("contentWidgets", timeline.length, Object.keys(contentWidgets).reduce((r, e)=>{
    //     const sourceText =contentWidgets[e]?.locLiveZoneActiveDecoration?.syntaxFragment?.sourceText;
    //     if(sourceText){
    //         r[sourceText] ??=[];
    //         r[sourceText].push(contentWidgets[e]);
    //     }
    //     return r;
    // }, {}));//, dale, contentWidgets);


    const [progress, setProgress] = useState(0);
    const [lastContentChangeTimestamp, setLastContentChangeTimestamp] = useState(() => Date.now());
    const [decorationRefs, setDecorationsRef] = useState({});
    const [isUpdating, setIsUpdating] = useState(true);
    const [timelineDelta, setTimelineDelta] = useState([0]);
    const [timelineData, setTimelineData] = useState({});
    const timelineDataVisibleRef = useRef({});
    const deltaTimelineDataRef = useRef({});
    const [timestamp, setTimestamp] = useState(null);

    const current = decorationRefs;

    // Object.values(contentWidgets ?? {}).forEach(contentWidget => {
    //     const {expressionId} = contentWidget?.locLiveZoneActiveDecoration?.zone ?? {};
    //     contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.sourceText === "let n" && console.log("navigator", {
    //         expressionId,
    //         contentWidget
    //     });
    // });


    const contentWidgetKeys = useMemo(
        () => Object.keys(contentWidgets ?? {}),
        [contentWidgets, current]
    );

    const navigatorKeys = useMemo(() => {
        const visited = [];
        const visitedKeys = [];
        // console.log("branchNavigator >>>>>");
        contentWidgetKeys.forEach((key) => {
            const contentWidget = contentWidgets[key];
            const z = contentWidget?.locLiveZoneActiveDecoration?.zone
            const {expressionId} = z ?? {};
            // contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.sourceText?.includes("let n") && console.log("navigatorKeys", {expressionId, z, contentWidget}); // expressionId == 14
            if (LiveZoneTypes.B !== contentWidget.locLiveZoneActiveDecoration?.zone.liveZoneType) {
                return;
            }
            const branchNavigator = contentWidget?.locLiveZoneActiveDecoration?.getBranchNavigator();

            if (!branchNavigator) {
                return
            }
            if (visited.indexOf(branchNavigator.zone()) > -1) {
                return;
            }

            visited.push(branchNavigator.zone());
            visitedKeys.push(key);

            // console.log("branchNavigator", {branchNavigator, key, contentWidget});
        });
// console.log("branchNavigator", {visitedKeys, visited, contentWidgetKeys, ss: new Set(contentWidgetKeys), contentWidgets});
        return visitedKeys;
    }, [contentWidgetKeys, current]);

    const {
        navigationStates,
        allCurrentScopes
    } = useNavigationStates(
        navigatorKeys, contentWidgets, searchState, timestamp
    );


    const handleChangeLocLiveZoneDecorations = useCallback(
        (lastContentChangeTimestamp) => {
            setLastContentChangeTimestamp(lastContentChangeTimestamp);
        },
        []
    );

    // const onUpdateCallback =
    //     useCallback(
    //         (taskHandle, currentTaskNumber, totalTaskCount, timestamp) => {
    //
    //             setProgress(100 * (currentTaskNumber / totalTaskCount));
    //
    //             if (currentTaskNumber !== totalTaskCount) {
    //                 return timestamp;
    //             }
    //
    //             setTimelineData(timelineData => {
    //                 setIsUpdating(false);
    //                 setTimelineDelta(timelineDelta);
    //
    //                 const nextTimelineData = {
    //                     // ...timelineData,
    //                     ...deltaTimelineDataRef.current,
    //                 };
    //
    //                 //  deltaTimelineDataRef.current = {};
    //                 return nextTimelineData;
    //             });
    //             setTimestamp(timestamp);
    //         },
    //         []
    //     );
    //
    // const queueTask =
    //     useMemo(
    //         () => {
    //             return makeTaskQueue(onUpdateCallback);
    //         },
    //         [onUpdateCallback]
    //     );

    //
    // const onTraceChange = useCallback(
    //     (timeline, isTraceReset, timelineDataDelta, timelineDelta, programEndI) => {
    //
    //         // console.log("onTraceChange", {timeline, isTraceReset, timelineDataDelta, timelineDelta, programEndI});
    //
    //         if (isTraceReset) {
    //             //todo
    //             // timelineDataVisibleRef.current = {};
    //             // setTimelineData({});
    //         }
    //
    //         // const [from, to] = timelineDelta;
    //
    //         // const deltaTimelineData = {};
    //         //  console.log(">>", timeline, timelineDataDelta, values);
    //
    //         for (let key in timelineDataDelta) {
    //             const extra = timelineDataDelta[key];
    //             const entry = timeline[extra?.i];
    //             // console.log(extra, entry);
    //             queueTask(() => {
    //                     const serialized = entry?.logValue?.serialized;
    //                     if (serialized) {
    //                         deltaTimelineDataRef.current[key] = deltaTimelineDataRef.current[key] ?? [];
    //                         deltaTimelineDataRef.current[key].push({
    //                             i: extra?.i,
    //                             visible: true,
    //                             value: null,//JSEN.parse(serialized),
    //                             entry,
    //                             extra,
    //                         });
    //                     }
    //                     // console.log(key, serialized, deltaTimelineDataRef.current[key]);
    //                 }
    //             );
    //         }
    //     },
    //     [queueTask]
    // );


    // useEffect(() => {
    //     if (!aleInstance) {
    //         return;
    //     }
    //     console.log("FU");
    //     aleInstance.setAfterTraceChange(onTraceChange);
    //     return () => {
    //         aleInstance.setAfterTraceChange(null);
    //     }
    // }, [aleInstance]);

    useEffect(() => {
        if (!dale) {
            return;
        }
        dale.setOnChangeLocLiveZoneDecorations(handleChangeLocLiveZoneDecorations);
        return () => {
            dale.setOnChangeLocLiveZoneDecorations(null);
        }
    }, [dale]);

    useEffect(() => {
        if (!dale) {
            return;
        }
        setDecorationsRef(dale.ref);
    }, [dale, lastContentChangeTimestamp]);

    useEffect(
        () => {
            current && setIsUpdating(true);
        },
        [current]
    );

    useEffect(
        () => {
            if (
                // contentWidgetKeys &&
                timelineData && resizeContentWidgets) {
                resizeContentWidgets(timelineDataVisibleRef.current);
            }
        },
        [timelineData, resizeContentWidgets,
            // contentWidgetKeys
        ]
    );

    // console.log("contentWidgetKeys", contentWidgetKeys);
// console.log("contentWidgets", contentWidgets);
    // console.log("BI", contentWidgetKeys.filter((key) => !!(contentWidgets[key]?.locLiveZoneActiveDecoration?.zone.type === "BinaryExpression")));
    // <div>{progress}%</div>
    const getNavigationStateInfo = (key) => {
        const variant = navigationStates[key] ? 'block' : 'expression';
        const navigationState = navigationStates[key] ?? emptyState;
        const {
            branchNavigator,
            isSelected,
            absoluteMaxNavigationIndex,
            currentAbsoluteNavigationIndex,
            relativeMaxNavigationIndex,
            currentRelativeNavigationIndex,
            currentBranchEntry,
            currentBranches,
            handleChangeAbsoluteSelectedBranchEntry,
            handleChangeRelativeSelectedBranchEntry,
            resetNavigation,
            branchNavigatorEntry,
        } = navigationState;

        const color = branchNavigator?.getScopeType() === ScopeTypes.F ? 'primary' : 'secondary';
        const isRelative = currentBranches && !!currentBranches.find(b => b.parentBranch);
        const blockVariant = isRelative ? 'outlined' : 'contained';
        const value =
            isRelative ? currentRelativeNavigationIndex ?? relativeMaxNavigationIndex
                : currentAbsoluteNavigationIndex ?? absoluteMaxNavigationIndex
        const max =
            isRelative ? relativeMaxNavigationIndex
                : absoluteMaxNavigationIndex;
        return {
            variant,
            navigationState,
            color,
            isRelative,
            blockVariant,
            value,
            max,
            currentRelativeNavigationIndex,
            absoluteMaxNavigationIndex,
            isSelected
        };
    };

    return [
        {
            contentWidgets,
            contentWidgetKeys,
            navigationStates,
            isUpdating,
            allCurrentScopes,
            programUID,
            getNavigationStateInfo
        },
        {}
    ];
};

const RALEContext = createContext({});

export function useRALEContext() {
    return useContext(RALEContext);
}

export function RALEContextProvider({children}) {
    return <RALEContext.Provider value={useRALE()}>
        {children}
    </RALEContext.Provider>
}

export function RALE(
    {
        VisualizerComponent = VALE
    }
) {
    const [{
        contentWidgets,
        contentWidgetKeys,
        navigationStates,
        isUpdating,
        allCurrentScopes,
        programUID,
        getNavigationStateInfo
    }] = useRALEContext();

    return (<>
            {contentWidgetKeys.map((key) => {
                const contentWidget = contentWidgets[key];
                // contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.sourceTextFocus === "let n" && console.log("rale", contentWidget);
                const {expressionId} = contentWidget?.locLiveZoneActiveDecoration?.zone ?? {};
                // console.log("rale", {expressionId, contentWidget});
                // const forBlock = contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.forBlock();
                // const expressionTest = contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.expressionTest();
                // // const expressionInit = contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.expressionInit();
                // const expressionUpdate = contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.expressionUpdate();
                // console.log("contentWidgets", key, contentWidget);
                // const expressionInit = contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.forBlockInit();
                // const t = expressionInit;
                //     //contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.zone?.key;
                // (t) && console.log("Widget", t, { //allCurrentScopes?.[uid]
                //     contentWidget
                // });

                return <VisualizerComponent
                    key={key}
                    id={key}
                    isLoading={isUpdating}
                    contentWidget={contentWidget}
                    navigationStates={navigationStates}
                    getNavigationStateInfo={getNavigationStateInfo}
                    allCurrentScopes={allCurrentScopes}
                    programUID={programUID}
                />;
            })}
        </>
    );
}

const DeferredRALE = deferComponentRender(RALE);
export default DeferredRALE;
