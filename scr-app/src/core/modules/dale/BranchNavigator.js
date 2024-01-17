export class LogValue {

    i = -1;
    uid = null;
    zone = null;
    entry = null;
    isRead = false;

    constructor({
                    i,
                    uid,
                    zone,
                    entry,
                    isReady = false,
                }) {
        this.i = i;
        this.uid = uid;
        this.zone = zone;
        this.entry = entry;
        this.isReady = isReady;
    }

    getValue = () => this.entry?.logValue?.getSnapshot();
}


class Branch {
    paramsIdentifier = null;
    scopeEnterStateValues = null;
    scopeEnterState = null;
    i = null;
    in = null;
    out = null;
    zones = null;

    constructor({paramsIdentifier, scopeEnterStateValues, i, in: _in, out, zones}) {
        this.paramsIdentifier = paramsIdentifier;
        this.scopeEnterStateValues = scopeEnterStateValues;
        this.scopeEnterState = new ScopeEnterState(scopeEnterStateValues);
        this.i = i;
        this.in = _in;
        this.out = out;
        this.zones = zones;
    }
}

class ScopeEnterState {
    values = null;
    states = null;

    constructor(values) {
        // console.log("ScopeEnterState", values);
        if (values) {

        }
        this.values = values;
    }
}

export default class BranchNavigator {
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

    enter(i, zone, paramsIdentifier, scopeEnterStateValues) {
        this.currentBranch = this.currentEnter(
            paramsIdentifier ?? `${i}`, zone
        );

        if (this.currentBranch === 0) {
            const branches = [];
            this._paths.push(branches);
            this.branches = branches;
        }

        const branch = new Branch({
            paramsIdentifier,
            scopeEnterStateValues,
            i: this.currentBranch,
            in: i,
            out: -1,
            zones: {in: zone, out: null}
        });

        this.branches[this.currentBranch] = branch;

        // console.log("ScopeEnterState", branch);

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
