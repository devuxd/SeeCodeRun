import {NavigationTypes} from './AutoLogShift';

class TimelineBranchManager {
    globalBranches = {};
    globalBranchLocs = null;
    absoluteGlobalBranches = {};
    currentGlobalBranches = {};
    localBranches = {};
    localBranchLocs = null;
    functionBranches = {};
    controlBranches = {};

    constructor(
        branchSelections, traceSubscriber, timeline, prevTimelineI,
        currentBranchId, currentBranchTimelineId
    ) {
        const localBranchSelection = (
            branchSelections[NavigationTypes.Local] || {}
        );
        const currentLocalBranchId = localBranchSelection.currentBranchId;
        const currentLocalBranchTimelineId =
            localBranchSelection.currentBranchTimelineId;
        // const currentLocalBranchTimelineIdStart =
        //     (branchSelections[NavigationTypes.Global] || {}).prevTimelineI;
        // const prevLocalTimelineI = localBranchSelection.prevTimelineI;
        // console.log(
        // "BM", currentLocalBranchTimelineIdStart, branchSelections,
        // traceSubscriber, timeline, prevTimelineI, currentBranchId,
        // currentBranchTimelineId
        // );


        const branches =
            traceSubscriber && timeline.length ?
                traceSubscriber.branches || [] : [];

        currentBranchTimelineId =
            currentLocalBranchTimelineId || currentBranchTimelineId;
        const mainLoadedTimelineI =
            traceSubscriber ? traceSubscriber.mainLoadedTimelineI : 0;
        const globalBranches = {};
        let globalBranchLocs = null;
        const absoluteGlobalBranches = {};
        const currentGlobalBranches = {};
        const localBranches = {};
        let localBranchLocs = null;

        if (currentBranchId && currentBranchTimelineId) {
            branches.forEach(branch => {
                const {id, timelineI, navigationType, loc, blockLoc} = branch;
                const branched =
                    navigationType === NavigationTypes.Global ?
                        globalBranches : localBranches;
                // console.log(
                // 'G', currentLocalBranchTimelineIdStart, timelineI,
                // currentBranchTimelineId
                // );
                if (navigationType === NavigationTypes.Global) {
                    absoluteGlobalBranches[id] =
                        absoluteGlobalBranches[id] || [];
                    absoluteGlobalBranches[id].push(timelineI);
                    if (timelineI < currentBranchTimelineId) {
                        currentGlobalBranches[id] =
                            currentGlobalBranches[id] || [];
                        currentGlobalBranches[id].push(timelineI);
                        // console.log(
                        // 'G', currentLocalBranchTimelineIdStart, timelineI,
                        // currentBranchTimelineId
                        // );
                    }
                }

                if (branch.id === currentLocalBranchId) {
                    localBranchLocs = {loc, blockLoc};
                }


                if (branch.id === currentBranchId) {
                    branched[id] = branched[id] || [];
                    branched[id].push(timelineI);
                    globalBranchLocs = {loc, blockLoc};
                } else {
                    if (timelineI < currentBranchTimelineId) {
                        if (navigationType === NavigationTypes.Local) {
                            if (!prevTimelineI || timelineI >= prevTimelineI) {
                                branched[id] = branched[id] || [];
                                branched[id].push(timelineI);
                            }

                        } else {
                            if (navigationType === NavigationTypes.Global) {
                                branched[id] = branched[id] || [];
                                branched[id].push(timelineI);
                            }
                        }

                    }


                }
            });


        } else {
            branches.forEach(branch => {
                const {id, timelineI, navigationType} = branch;
                const branched =
                    navigationType === NavigationTypes.Global ?
                        globalBranches : localBranches;
                branched[id] = branched[id] || [];
                if (!timelineI) {
                    if (
                        branched[id].length &&
                        branched[id][branched[id].length - 1]
                        <= mainLoadedTimelineI
                    ) {
                        branched[id].push(mainLoadedTimelineI);
                    } else {
                        branched[id].push(timelineI);
                    }
                } else {
                    branched[id].push(timelineI);
                }
            });

            branches.forEach(branch => {
                const {
                    id, timelineI, navigationType,
                    // loc, blockLoc
                } = branch;

                if (navigationType === NavigationTypes.Global) {
                    absoluteGlobalBranches[id] =
                        absoluteGlobalBranches[id] || [];
                    absoluteGlobalBranches[id].push(timelineI);
                    currentGlobalBranches[id] =
                        currentGlobalBranches[id] || [];
                    currentGlobalBranches[id].push(timelineI);
                }
            });

        }


        const functionBranches = {}, controlBranches = {};
        branches.filter(
            branch => branch.navigationType === NavigationTypes.Global
        ).forEach(branch => {
            const {id, timelineI, loc, blockLoc, extraLocs} = branch;
            const branched = functionBranches;
            branched[id] = branched[id] || {
                isSelected: false,
                current: 0,
                branches: [],
                extraLocs,
            };

            let newLength = branched[id].branches.push({
                start: timelineI,
                end: 0,
                loc,
                blockLoc,
                localBranches: []
            });
            if (newLength - 2 >= 0) {
                branched[id].branches[newLength - 2].end = timelineI;
            }

            // if (currentBranchId && currentBranchTimelineId) {
            //     if (branch.id === currentBranchId) {
            //         branched[id].isSelected = true;
            //     }
            //     if (timelineI < currentBranchTimelineId) {
            //         branched[id].current++;
            //     }
            // }

        });

        let prevBranchId = null;
        let lastBranchId = null;
        for (let branchId in functionBranches) {
            if (functionBranches.hasOwnProperty(branchId) && prevBranchId) {
                const prevBranches =
                    functionBranches[prevBranchId].branches;
                const currBranches =
                    functionBranches[branchId].branches;
                prevBranches[prevBranches.length - 1].end =
                    currBranches[currBranches.length - 1].start - 1;
            }
            prevBranchId = branchId;
            lastBranchId = branchId;
        }
        if (lastBranchId) {
            const currBranches = functionBranches[lastBranchId].branches;
            currBranches[currBranches.length - 1].end = timeline.length - 1;
        }
        // console.log("FB", functionBranches);

        branches.filter(
            branch => branch.navigationType === NavigationTypes.Local
        ).forEach(branch => {
            const {id, timelineI, loc, blockLoc, extraLocs} = branch;
            const branched = controlBranches;
            branched[id] = branched[id] || {
                isSelected: false,
                current: 0,
                branches: [],
                extraLocs
            };

            let newLength = branched[id].branches.push({
                start: timelineI, end: 0, loc, blockLoc,
                functionBranch: null
            });
            let functionBranch = {start: 0, end: 0},
                functionBranchFound = false;

            const funcBranch = fBranch => {

                //todo: inspect here
                const fBranchLoc = fBranch.blockLoc;
                // console.log(
                // 'f block', fBranch, branch.blockLoc, fBranch.blockLoc,
                // fBranch.loc
                // );

                if (functionBranch.start < fBranch.start
                    && fBranch.start < timelineI
                    && timelineI < fBranch.end
                    && (fBranchLoc && !(fBranchLoc
                        && fBranchLoc.start.line
                        <= branch.blockLoc.start.line
                        && fBranchLoc.start.column
                        <= branch.blockLoc.start.column
                        && fBranchLoc.end.line
                        >= branch.blockLoc.end.line
                        && fBranchLoc.end.column
                        >= branch.blockLoc.end.column))
                ) {
                    functionBranch = fBranch;
                }
            };

            for (let fId in functionBranches) {
                const func = functionBranches[fId];
                func.branches.forEach(funcBranch);
            }
            branched[id].branches[newLength - 1].functionBranch =
                functionBranchFound ? functionBranch : null;

            if (newLength - 2 >= 0) {
                branched[id].branches[newLength - 2].end = timelineI;
            }

            if (currentBranchId && currentBranchTimelineId) {
                if (branch.id === currentBranchId) {
                    branched[id].isSelected = true;
                }
                if (timelineI < currentBranchTimelineId) {
                    branched[id].current++;
                }
            }

        });
        //      console.log(
        //      'nb', currentBranchTimelineId, functionBranches,
        //      controlBranches, timeline
        //      );

        this.branches = branches;
        this.globalBranches = globalBranches;
        this.globalBranchLocs = globalBranchLocs;
        this.absoluteGlobalBranches = absoluteGlobalBranches;
        this.currentGlobalBranches = currentGlobalBranches;
        this.localBranches = localBranches;
        this.localBranchLocs = localBranchLocs;
        this.functionBranches = functionBranches;
        this.controlBranches = controlBranches;
        this.getBranchByTimelineI = (timelineI) => {
            let functionBranch = null;
            let isGlobal = true;
            // console.log('f', localBranches, controlBranches, functionBranches,);
            let navigatorIndex = 0;
            let prevTimelineI = 0;//timeline.length;

            const funcEach = fBranch => {
                navigatorIndex++;
                if (functionBranch) {
                    if (
                        functionBranch.start < fBranch.start
                        && fBranch.start < timelineI
                        && timelineI < fBranch.end
                    ) {
                        functionBranch = fBranch;
                    }
                } else {
                    functionBranch = fBranch;
                }

            };
            for (let fId in functionBranches) {
                const func = functionBranches[fId];
                navigatorIndex = 0;
                func.branches.forEach(funcEach);
            }
            if (!functionBranch) {
                isGlobal = false;
                for (let fId in controlBranches) {
                    const func = controlBranches[fId];
                    navigatorIndex = 0;
                    func.branches.forEach(funcEach);
                }
            }

            if (!functionBranch) {
                isGlobal = true;
                navigatorIndex = 0;
            }

            // prevTimelineI = functionBranch?.end || prevTimelineI;

            return {
                branch: functionBranch,
                isGlobal,
                navigatorIndex,
                prevTimelineI
            };
        };

        // console.log('TBM',this);
    }

}

export default TimelineBranchManager;