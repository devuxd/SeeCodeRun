import {NavigationTypes} from "./AutoLogShift";

class TimelineBranchManager {
    globalBranches = {};
    globalBranchLocs = null;
    absoluteGlobalBranches = {};
    currentGlobalBranches = {};
    localBranches = {};
    localBranchLocs = null;
    functionBranches = {};
    controlBranches = {};

    constructor(branchSelections, traceSubscriber, timeline, prevTimelineI, currentBranchId, currentBranchTimelineId) {
        const localBranchSelection = (branchSelections[NavigationTypes.Local] || {});
        const currentLocalBranchId = localBranchSelection.currentBranchId;
        const currentLocalBranchTimelineId = localBranchSelection.currentBranchTimelineId;
        //const prevLocalTimelineI = localBranchSelection.prevTimelineI;


        const branches = traceSubscriber && timeline.length ? traceSubscriber.branches || [] : [];
        // console.log('timeline', this.timeline, this.traceSubscriber?this.traceSubscriber.branches:null);
        //  if(this.timeline && this.timeline.length && this.traceSubscriber && this.traceSubscriber.branches){
        //      this.findFuncRefs(this.timeline, this.traceSubscriber.branches);
        //  }
        //const mainLoadedTimelineI = this.traceSubscriber ? this.traceSubscriber.mainLoadedTimelineI : 0;
        const globalBranches = {};
        let globalBranchLocs = null;
        const absoluteGlobalBranches = {};
        const currentGlobalBranches = {};
        const localBranches = {};
        let localBranchLocs = null;
        if (currentBranchId && currentBranchTimelineId) {
            branches.forEach(branch => {
                const {id, timelineI, navigationType, loc, blockLoc} = branch;
                const branched = navigationType === NavigationTypes.Global ? globalBranches : localBranches;

                if (navigationType === NavigationTypes.Global) {
                    absoluteGlobalBranches[id] = absoluteGlobalBranches[id] || [];
                    absoluteGlobalBranches[id].push(timelineI);
                    if (timelineI < currentBranchTimelineId) {
                        currentGlobalBranches[id] = currentGlobalBranches[id] || [];
                        currentGlobalBranches[id].push(timelineI);
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

                        }

                    }
                    if (navigationType === NavigationTypes.Global) {
                        branched[id] = branched[id] || [];
                        branched[id].push(timelineI);
                    }

                }
            });


        } else {
            branches.forEach(branch => {
                const {id, timelineI, navigationType} = branch;
                const branched = navigationType === NavigationTypes.Global ? globalBranches : localBranches;
                branched[id] = branched[id] || [];
                // if(!timelineI){
                //     if(branched[id].length && branched[id][branched[id].length-1] <= mainLoadedTimelineI){
                //         branched[id].push(mainLoadedTimelineI);
                //     }else{
                //         branched[id].push(timelineI);
                //     }
                // }else{
                branched[id].push(timelineI);
                // }
            });

            // branches.forEach(branch => {
            //     const {id, timelineI, navigationType, loc, blockLoc} = branch;
            //
            //     if (navigationType === NavigationTypes.Global) {
            //         absoluteGlobalBranches[id] = absoluteGlobalBranches[id] || [];
            //         absoluteGlobalBranches[id].push(timelineI);
            //             currentGlobalBranches[id] = currentGlobalBranches[id] || [];
            //             currentGlobalBranches[id].push(timelineI);
            //     }
            // });

        }


        const functionBranches = {}, controlBranches = {};
        branches.filter(branch => branch.navigationType === NavigationTypes.Global).forEach(branch => {
            const {id, timelineI, loc, blockLoc} = branch;
            const branched = functionBranches;
            branched[id] = branched[id] || {
                isSelected: false,
                current: 0,
                branches: [],
            };

            let newLength = branched[id].branches.push({start: timelineI, end: 0, loc, blockLoc, localBranches: {}});
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

        branches.filter(branch => branch.navigationType === NavigationTypes.Local).forEach(branch => {
            const {id, timelineI, loc, blockLoc} = branch;
            const branched = controlBranches;
            branched[id] = branched[id] || {
                isSelected: false,
                current: 0,
                branches: [],
            };

            let newLength = branched[id].branches.push({
                start: timelineI, end: 0, loc, blockLoc,
                functionBranch: null
            });
            let functionBranch = {start: 0, end: 0}, functionBranchFound = false;
            for (let fId in functionBranches) {
                const func = functionBranches[fId];
                func.branches.forEach(fBranch => {
                    //     console.log('fb', fBranch);
                    if (functionBranch.start < fBranch.start && fBranch.start < timelineI && timelineI < fBranch.end) {
                        functionBranch = fBranch;
                        functionBranchFound = true;
                    }
                });
            }
            branched[id].branches[newLength - 1].functionBranch = functionBranchFound ? functionBranch : null;

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
        //      console.log('nb', currentBranchTimelineId, functionBranches, controlBranches, timeline);
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
            console.log('f', functionBranches, timelineI);
            for (let fId in functionBranches) {
                const func = functionBranches[fId];

                func.branches.forEach(fBranch => {
                    if (functionBranch) {
                        if (functionBranch.start < fBranch.start && fBranch.start < timelineI && timelineI < fBranch.end) {
                            functionBranch = fBranch;
                        }
                    } else {
                        functionBranch = fBranch;
                    }

                });


            }
            return functionBranch;
        };
    }

}

export default TimelineBranchManager;