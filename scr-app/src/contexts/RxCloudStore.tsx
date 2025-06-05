import React, {
    createContext,
    useRef,
    useEffect,
    useState,
    useCallback,
    useContext,
    useMemo,
    useReducer
} from 'react';
import {BehaviorSubject, UnaryFunction, Observable} from 'rxjs';
import {debounceTime, filter} from 'rxjs/operators';


/*
    const [subscribe, getSnapshot, updateData, ready] = useRxCloudStore(idiomaticContextRxCloudStorePath);
    const data = useSyncExternalStore(subscribe, getSnapshot);
 */

interface FirebaseDatabaseReference {
    orderByKey?: () => FirebaseDatabaseReference;
    limitToLast?: (last: number) => FirebaseDatabaseReference
    once?: Function
    on?: Function,
    off?: Function,
    child?: Function
    set?: Function;
    push?: Function,
}

interface FirebaseDatabaseSnapshot {
    val?: Function
}

interface FirepadHeadless<T = string> {
    setText: (text: T, callback: (err: any, committed: boolean) => void) => void;
    setHtml: (html: T, callback: (err: any, committed: boolean) => void) => void;
    getText: (callback: (text: T) => void) => void;
    getHtml: (callback: (html: T) => void) => void;
    dispose: () => void;
}

interface RxCloudDataShape<H = any> {
    subscribe: (callback: (data: H) => void, pipeline: UnaryFunction<Observable<any>, Observable<any>>[]) => () => void;
    getSnapshot: () => H;
}

interface RxCloudStoreShape<D = any> {
    updateData: (newData: D) => string;
}

interface RxCloudStoresShape {
    [key: string]: CloudSyncStore;
}

interface RxCloudStoreContextShape {
    dataStores: RxCloudStoresShape;
    firebaseDbRefReady: boolean;
    dataPaths: string[];
    dispatchDataPaths: React.Dispatch<ReducerAction>;
}

enum ActionType {
    added = "added",
    deleted = "deleted",
}

interface ReducerAction {
    type: ActionType;
    payload: string
}

function actionReducer(dataPaths: string[], action: ReducerAction) {
    const {type, payload} = action;

    switch (type) {
        case ActionType.added:
            if (dataPaths.includes(payload)) {
                return dataPaths;
            }
            return [...dataPaths, payload];
        case ActionType.deleted: {
            return dataPaths.filter(t => t !== payload);
        }
        default: {
            throw Error('Unknown action: ' + type);
        }
    }
}

export const RxCloudStore = createContext<RxCloudStoreContextShape>(null);

const initialDataPaths = [];

interface CurrentVal {
    currentHistoryUpdateKey: string;
    timestamp: string;
}

interface HistoryVal<D = any> {
    historyUpdateKey: string;
    data: D;
    timestamp: string;
}

class CloudSyncStore<D = any, C extends CurrentVal = CurrentVal, H extends HistoryVal = HistoryVal<D>> {
    path: string;
    subject: BehaviorSubject<H>;
    updateSubject: BehaviorSubject<D>;
    dataRef: FirebaseDatabaseReference;
    currentDataRef: FirebaseDatabaseReference;
    historyDataRef: FirebaseDatabaseReference;
    serverTimestamp: Function;
    historyUpdateKey: string;
    private _dueTime: number = 1000;

    constructor(path: string, firebaseDatabaseReference: FirebaseDatabaseReference, serverTimestamp: Function) {
        this.subject = new BehaviorSubject<H>(null);
        this.updateSubject = new BehaviorSubject<D>(null);
        this.serverTimestamp = serverTimestamp
        this.dataRef = firebaseDatabaseReference.child(path);
        this.currentDataRef = this.dataRef.child('current');
        this.historyDataRef = this.dataRef.child('history');
        this.setupListeners();
    }

    dueTime = (dueTime: number = -1) => {
        if (dueTime > -1) {
            this._dueTime = dueTime;
        }
        return this._dueTime;
    }

    setupListeners = (): void => {
        this.currentDataRef.on('value', this.valueChangeListener);
        this.updateSubject.pipe(filter((v, i) => v !== null), debounceTime(this.dueTime())).subscribe(this.updateHistoryVal);
    }

    initValue = (): void => {
        this.subject.next(null);
    }

    valueChangeListener = (currentSnapshot: FirebaseDatabaseSnapshot): void => {
        const currentVal: C = currentSnapshot.val();

        if (!currentVal) {
            this.initValue();
            return;
        }
        const {currentHistoryUpdateKey} = currentVal;

        if (!currentHistoryUpdateKey) {
            this.initValue();
            return;
        }

        if (this.historyUpdateKey === currentHistoryUpdateKey) {
            //sync
            return;
        }


        this.historyDataRef.child(currentHistoryUpdateKey).once('value', (historySnapshot: FirebaseDatabaseSnapshot) => {
            const historyVal: H = historySnapshot.val();
            if (!historyVal) {
                this.initValue();
                return;
            }

            const {historyUpdateKey, data} = historyVal;

            if (!(historyUpdateKey)) {
                this.initValue();
                return;
            }

            if (this.historyUpdateKey === historyUpdateKey) {
                //sync
                return;
            }

            // console.log("historyVal snapshot", {path: this.currentDataRef, currentSnapshot, currentVal, data, historyVal});
            this.historyUpdateKey = currentHistoryUpdateKey;
            this.subject.next(historyVal);
        })
        ;
    }

    subscribe: RxCloudDataShape<H>["subscribe"] = (listener, pipeline) => {
        const subscription = this.subject.pipe.apply(null,
            [filter((v, i) => v !== undefined),
                ...pipeline]
        ).subscribe(listener);
        return () => {
            subscription.unsubscribe();
            this.updateSubject.complete();
            this.updateHistoryVal(this.updateSubject.getValue());
        };
    }

    getSnapshot: RxCloudDataShape<H>["getSnapshot"] = () => this.subject.getValue();

    updateData: RxCloudStoreShape<D>["updateData"] = (data) => {
        this.historyUpdateKey ??= this.historyDataRef.push().key;
        this.updateSubject.next(data);
        return this.historyUpdateKey;
    }

    updateHistoryVal = (data: D) => {
        const historyUpdateKey = this.historyUpdateKey;
        this.historyUpdateKey = null;
        const timestamp = this.serverTimestamp();

        const currentValue: { data: D; historyUpdateKey: string; timestamp: string } = {
            data,
            timestamp,
            historyUpdateKey
        };

        this.currentDataRef.set({currentHistoryUpdateKey: historyUpdateKey, timestamp}, (error: any) => {
            if (error) {
                console.log("FB::currentDataRef", error);
                return;
            }
            this.historyDataRef.child(historyUpdateKey).set(currentValue, (error: any) => {
                if (error) {
                    console.log("FB::historyDataRef", error);
                    return;
                }
                this.subject.next(currentValue as H);
            });

        });

        // console.log("updateData", {historyUpdateKey, currentValue, timestamp});
    }

    dispose = () => {
        this.currentDataRef.off('value', this.valueChangeListener);
        this.subject.complete();
        this.updateSubject.complete();
    }
}


interface AleFirecoPad {
    firepadHeadless: FirepadHeadless;
    serverTimestamp: Function;
}


export function RxCloudStoreProvider<D = any, C extends CurrentVal = CurrentVal, H extends HistoryVal = HistoryVal<D>>(
    props: any
): JSX.Element {
    const children: React.ReactNode = props?.children;
    const onFirebaseDbRef: (callback: ([FirebaseDatabaseReference, AleFirecoPad]) => void) => void // firebase.database.Reference
        = props?.onFirebaseDbRef;
    const [
        dataPaths, // concrete model
        dispatchDataPaths    // concrete viewModel
    ] = useReducer(
        actionReducer, // abstract viewModel
        initialDataPaths  // abstract model
    );

    const [firebaseDbRefReady, setFirebaseDbRefReady] = useState(false);
    const [readyDataPaths, setReadyDataPaths] = useState<string[]>([]);
    const firebaseDbRef = useRef<[FirebaseDatabaseReference, AleFirecoPad]>(null);
    const firebaseDbRefHandler: (data: any) => void = useCallback(([firebaseDbReference, aleFirecoPad]) => {
        firebaseDbRef.current = [firebaseDbReference, aleFirecoPad];
        setFirebaseDbRefReady(true);
    }, []);

    useEffect(() => {
        onFirebaseDbRef?.(firebaseDbRefHandler);
        return () => {
            // firebaseDbRef.current.off() // done by FB
        }

    }, [onFirebaseDbRef, firebaseDbRefHandler]);
    const dataStoresRef = useRef<{ [key: string]: CloudSyncStore<D, C, H> }>({});

    useEffect(() => {
        const [firebaseDatabaseReference, aleFirecoPad] = firebaseDbRef.current ?? [];
        const {serverTimestamp} = aleFirecoPad ?? {};
        const dataStoresRefCurrent = dataStoresRef.current;
        if (!(firebaseDbRefReady && firebaseDatabaseReference && dataStoresRefCurrent && serverTimestamp)) {
            return;
        }

        let changed = false;
        dataPaths.forEach(path => {
            if (dataStoresRefCurrent[path]) {
                return;
            }
            dataStoresRefCurrent[path] = new CloudSyncStore<D, C, H>(path, firebaseDatabaseReference, serverTimestamp);
            changed = true;
        });

        Object.keys(dataStoresRefCurrent).forEach(existingPath => {
            if (!dataPaths.includes(existingPath)) {
                dataStoresRefCurrent[existingPath]?.dispose();
                delete dataStoresRefCurrent[existingPath];
                changed = true;
            }
        });

        setReadyDataPaths(changed ? [...dataPaths] : dataPaths);

        return (): void => {
            Object.values(dataStoresRefCurrent).forEach(cloudSyncStore => {
                cloudSyncStore?.dispose();
            });
        }


    }, [firebaseDbRefReady, dataPaths]);

    const rxCloudStoreContext: RxCloudStoreContextShape = useMemo(() => ({
        dataStores: dataStoresRef.current,
        firebaseDbRefReady,
        dataPaths: readyDataPaths,
        dispatchDataPaths
    }), [dispatchDataPaths, readyDataPaths, firebaseDbRefReady]);

    return (
        <RxCloudStore.Provider value={rxCloudStoreContext}>
            {children}
        </RxCloudStore.Provider>
    );
};


export function useRxCloudStore<D = any, C extends CurrentVal = CurrentVal, H extends HistoryVal = HistoryVal<D>>
(path: string, firepadHeadLess: boolean = false):
    [CloudSyncStore<D, C, H>['subscribe'], CloudSyncStore<D, C, H>['getSnapshot'], CloudSyncStore<D, C, H>['updateData'], boolean] {
    const {
        dataPaths,
        dataStores,
        firebaseDbRefReady,
        dispatchDataPaths
    } = useContext(RxCloudStore) ?? {};
    const rxCloudDataRef = useRef<RxCloudDataShape<H>>(null);
    const rxCloudStoreRef = useRef<RxCloudStoreShape<D>>(null);
    const dataStore = dataStores[path];
    const dataPathReady = dataPaths.includes(path);
    const ready = !!(dataPathReady && dataStore);

    if (firebaseDbRefReady && ready) {
        const {subscribe, getSnapshot, updateData} = dataStores[path] as CloudSyncStore<D, C, H>;

        if (rxCloudDataRef.current.subscribe !== subscribe) {
            rxCloudDataRef.current = {
                subscribe,
                getSnapshot,
            }
            rxCloudStoreRef.current = {
                updateData
            }
        }

    } else {
        if (!rxCloudDataRef.current) {
            const subscribe: CloudSyncStore<D, C, H>['subscribe'] = () => () => undefined;
            const getSnapshot: CloudSyncStore<D, C, H>['getSnapshot'] = () => null;
            const updateData: CloudSyncStore<D, C, H>['updateData'] = () => null;

            rxCloudDataRef.current = {
                subscribe,
                getSnapshot,
            }
            rxCloudStoreRef.current = {
                updateData
            }
        }

    }

    // Handle the case where the store is not immediately available

    const subscribe: CloudSyncStore<D, C, H>['subscribe'] = useCallback((listener, pipeline) => {
        // console.log("historyVal subscribe", listener);
        return rxCloudDataRef.current.subscribe(listener, pipeline)
    }, []);

    const getSnapshot: CloudSyncStore<D, C, H>['getSnapshot'] = useCallback(() => {
        const ss = rxCloudDataRef.current.getSnapshot();
        // console.log("historyVal getSnapshot", ss, rxCloudDataRef.current.getSnapshot, dataStores[path]);
        return ss;
    }, []);

    const updateData: CloudSyncStore<D, C, H>['updateData'] = useCallback((data) => {
        // console.log("historyVal updateData", data);
        return rxCloudStoreRef.current.updateData(data);
    }, []);

    useEffect(() => {
        dispatchDataPaths({type: ActionType.added, payload: path});
        // return () => dispatchDataPaths({type: ActionType.deleted, payload: path});
    }, [path, dispatchDataPaths]);

    return [subscribe, getSnapshot, updateData, ready];
}
