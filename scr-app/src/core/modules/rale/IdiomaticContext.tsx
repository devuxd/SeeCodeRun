import {
    useRef,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
    useState,
    useSyncExternalStore
} from "react";
import IdiomaticIndicator from "./IdiomaticIndicator";
import {useRxCloudStore} from "../../../contexts/RxCloudStore";

const lowerFirstLetter = (str: string) => str && typeof str === 'string' ? str.charAt(0).toLowerCase() + str.slice(1) : str;


const IdiomaticContext = createContext<IdiomaticContextShape>(null);
const IdiomaticDispatchContext = createContext<IdiomaticDispatchShape>(null);

export const useIdiomaticContext = () => useContext(IdiomaticContext);
export const useIdiomaticDispatchContext = () => useContext(IdiomaticDispatchContext);
export const idiomaticContextRxCloudStorePath = `idiomaticContext`;

const dispatchHistoryValueToIdiomaticContext = (historyVal: {
    data: any;
    historyUpdateKey: any;
}, idiomaticDispatchValue: IdiomaticDispatchShape) => {
    const idiomaticContextValue = historyVal.data;
    const historyUpdateKey = historyVal.historyUpdateKey;
    const idiomaticDispatchFns = [];
    for (let idiomaticKind in IdiomaticKind) {
        idiomaticKind = lowerFirstLetter(idiomaticKind);
        const idiomaticDispatchFnName = `${idiomaticKind}Dispatch`;
        const idiomaticDispatchFn = idiomaticDispatchValue[idiomaticDispatchFnName];
        const idiomaticContextValueName = `${idiomaticKind}s`;
        const idiomaticContextReduced = idiomaticContextValue[idiomaticContextValueName];

        if (idiomaticDispatchFn && idiomaticContextReduced) {
            idiomaticDispatchFns.push(() => idiomaticDispatchFn(idiomaticLoaderAction(idiomaticContextReduced)));
        }
    }

    for (const fn of idiomaticDispatchFns) {
        fn();
    }

    return historyUpdateKey;
}

// export function IdiomaticProvider({children}) {
//     const [subscribe, getSnapshot, updateData, ready] = useRxCloudStore(idiomaticContextRxCloudStorePath);
//     const rxSubscribe = useCallback(
//         (listener: (historyVal: any) => void) => subscribe(listener, []),
//         [subscribe]
//     );
//
//     const historyVal = useSyncExternalStore(rxSubscribe, getSnapshot);
//     const id = historyVal?.data?.id ?? initialIdiomaticContextShape.id;
//
//     const [idiomaticPlans, idiomaticPlanDispatch] = useReducer(
//         idiomaticPlanReducer,
//         initialIdiomaticContextShape.idiomaticPlans
//     );
//     const [idiomaticActions, idiomaticActionDispatch] = useReducer(
//         idiomaticActionReducer,
//         initialIdiomaticContextShape.idiomaticActions
//     );
//
//     const [idiomaticIndicators, idiomaticIndicatorDispatch] = useReducer(
//         idiomaticIndicatorReducer,
//         initialIdiomaticContextShape.idiomaticIndicators
//     );
//
//     const [idiomaticArtifacts, idiomaticArtifactDispatch] = useReducer(
//         idiomaticArtifactReducer,
//         initialIdiomaticContextShape.idiomaticArtifacts
//     );
//
//     const idiomaticContextValue: IdiomaticContextShape = useMemo(
//         () => ({
//             id,
//             idiomaticPlans,
//             idiomaticActions,
//             idiomaticIndicators,
//             idiomaticArtifacts
//         }), [
//             id,
//             idiomaticPlans,
//             idiomaticActions,
//             idiomaticIndicators,
//             idiomaticArtifacts
//         ]
//     );
//
//     const idiomaticDispatchValue: IdiomaticDispatchShape = useMemo(() => {
//         return {
//             idiomaticPlanDispatch,
//             idiomaticActionDispatch,
//             idiomaticIndicatorDispatch,
//             idiomaticArtifactDispatch,
//             idiomaticChangerAction
//         }
//     }, [
//         idiomaticPlanDispatch,
//         idiomaticActionDispatch,
//         idiomaticIndicatorDispatch,
//         idiomaticArtifactDispatch,
//     ]);
//
//
//     const [loaded, setLoaded] = useState<boolean>(false);
//
//     const [currentHistoryUpdateKey, setCurrentHistoryUpdateKey] = useState<string>(null);
//     const [updateHistoryUpdateKey, setUpdateHistoryUpdateKey] = useState<string>(null);
//     const historyValRef = useRef(null);
//     const currentHistoryUpdateKeyRef = useRef<string>(null);
//
//     const firstTimeRef = useRef(null);
//     // const firstTimeRef = useRef(null);
//
//     useEffect(() => {
//         if (!ready) {
//             return;
//         }
//
//         if (historyVal) {
//             return;
//         }
//
//         if (id === demoIdiomaticContextShape.id) {
//             return;
//         }
//
//         if (id !== initialIdiomaticContextShape.id) {
//             return;
//         }
//
//         firstTimeRef.current = demoIdiomaticContextShape.id;
//
//         const updateHistoryUpdateKey = updateData(demoIdiomaticContextShape);
//         setUpdateHistoryUpdateKey(updateHistoryUpdateKey);
//         console.log("[IC] -1 first-time, context (demo) => snapshot", firstTimeRef.current, firstTimeRef.current === demoIdiomaticContextShape.id);
//
//     }, [id, ready, historyVal, updateData]);
//
//     useEffect(() => {
//         if (!updateHistoryUpdateKey) {
//             return;
//         }
//
//         if (!historyVal) {
//             return
//         }
//
//         // dispatchHistoryValueToIdiomaticContext(_historyVal, idiomaticDispatchValue);
//         console.log("[IC] 0 after update", updateHistoryUpdateKey, historyVal);
//     }, [updateHistoryUpdateKey, historyVal]);
//
//
//     useEffect(() => {
//         if (!(ready && !historyVal)) {
//             return;
//         }
//
//         if (currentHistoryUpdateKeyRef.current) {
//             return;
//         }
//
//         currentHistoryUpdateKeyRef.current = updateData(demoIdiomaticContextShape);
//         const _historyVal = {
//             data: demoIdiomaticContextShape,
//             historyUpdateKey: currentHistoryUpdateKeyRef.current
//         };
//         dispatchHistoryValueToIdiomaticContext(_historyVal, idiomaticDispatchValue);
//         console.log("[IC] 0 first-time, context (demo) => snapshot", {
//             _historyVal,
//             initialIdiomaticContextShape,
//         });
//
//     }, [ready, historyVal, updateData]);
//
//     useEffect(() => {
//
//         if (!(ready && historyVal)) {
//             return;
//         }
//
//         const {historyUpdateKey} = historyVal;
//
//         console.log("[IC] [0=>1] historyVal", {historyVal, currentHistoryUpdateKey});
//
//     if (!historyUpdateKey) {
//         console.log("[IC] x. historyUpdateKey error");
//         return;
//     }
//
//     if (historyUpdateKey === currentHistoryUpdateKey) {
//         return;
//     }
//
//     const tid = setTimeout(() => {
//         console.log("[IC] 1: snapshot ready", historyUpdateKey, {historyVal});
//         historyValRef.current = historyVal;
//         setCurrentHistoryUpdateKey(historyUpdateKey);
//     }, 100);
//
//     return () => clearTimeout(tid);
//
//     }, [ready, historyVal, currentHistoryUpdateKey]);
//
//     useEffect(() => {
//         if (!(updateHistoryUpdateKey && currentHistoryUpdateKey)) {
//             return;
//         }
//
//         if (updateHistoryUpdateKey === currentHistoryUpdateKey) {
//             return;
//         }
//
//
//
//         if (historyValRef.current.historyUpdateKey === currentHistoryUpdateKey) {
//             return;
//         }
//
//         const tid = setTimeout(() => {
//             console.log("[IC] 2.b idiomaticContextValue snapshot => context", historyValRef.current);
//             const historyUpdateKey = dispatchHistoryValueToIdiomaticContext(historyValRef.current, idiomaticDispatchValue);
//             setUpdateHistoryUpdateKey(historyUpdateKey);
//             setCurrentHistoryUpdateKey(historyUpdateKey);
//         }, 100);
//
//         return () => clearTimeout(tid);
//
//     }, [updateHistoryUpdateKey, currentHistoryUpdateKey, updateData, idiomaticDispatchValue]);
//
//
//     useEffect(() => {
//         if (!(idiomaticContextValue)) {
//             return;
//         }
//
//         if (!(updateHistoryUpdateKey && currentHistoryUpdateKey)) {
//             return;
//         }
//
//         if (updateHistoryUpdateKey === currentHistoryUpdateKey) {
//             return;
//         }
//
//         const tid = setTimeout(() => {
//             console.log("[IC] 3. idiomaticContextValue state", {
//                 historyVal: historyValRef.current,
//                 idiomaticContextValue
//             });
//             const historyUpdateKey = updateData(idiomaticContextValue);
//             setUpdateHistoryUpdateKey(historyUpdateKey);
//         }, 100);
//
//         return () => clearTimeout(tid);
//
//
//     }, [idiomaticContextValue, currentHistoryUpdateKey, updateHistoryUpdateKey, updateData]);
//
//
//     return (
//         <IdiomaticContext.Provider value={idiomaticContextValue}>
//             <IdiomaticDispatchContext.Provider value={idiomaticDispatchValue}>
//                 {children}
//             </IdiomaticDispatchContext.Provider>
//         </IdiomaticContext.Provider>
//     );
// }

export function IdiomaticProvider({children}) {
    const [subscribe, getSnapshot, updateData, ready] = useRxCloudStore(idiomaticContextRxCloudStorePath);
    const rxSubscribe = useCallback(
        (listener: (historyVal: any) => void) => subscribe(listener, []),
        [subscribe]
    );

    const historyVal = useSyncExternalStore(rxSubscribe, getSnapshot);

    // Extract necessary data from historyVal
    const [id, setId] = useState<string>(null);
    const idRef = useRef<string>(null);

    // Reducers for managing various parts of the state
    const [idiomaticPlans, idiomaticPlanDispatch] = useReducer(idiomaticPlanReducer, initialIdiomaticContextShape.idiomaticPlans);
    const [idiomaticActions, idiomaticActionDispatch] = useReducer(idiomaticActionReducer, initialIdiomaticContextShape.idiomaticActions);
    const [idiomaticIndicators, idiomaticIndicatorDispatch] = useReducer(idiomaticIndicatorReducer, initialIdiomaticContextShape.idiomaticIndicators);
    const [idiomaticArtifacts, idiomaticArtifactDispatch] = useReducer(idiomaticArtifactReducer, initialIdiomaticContextShape.idiomaticArtifacts);

    // Memoize context values to avoid unnecessary re-renders
    const idiomaticContextValue = useMemo(() => ({
        id,
        idiomaticPlans,
        idiomaticActions,
        idiomaticIndicators,
        idiomaticArtifacts
    }), [id, idiomaticPlans, idiomaticActions, idiomaticIndicators, idiomaticArtifacts]);

    const idiomaticDispatchValue = useMemo(() => ({
        idiomaticChangerAction,
        idiomaticPlanDispatch,
        idiomaticActionDispatch,
        idiomaticIndicatorDispatch,
        idiomaticArtifactDispatch
    }), [idiomaticPlanDispatch, idiomaticActionDispatch, idiomaticIndicatorDispatch, idiomaticArtifactDispatch, idiomaticChangerAction]);


    // Initial data load or update
    useEffect(() => {
        //console.log("historyVal", ready, historyVal);
        if (!ready) return;
        // if (!historyVal) return;
        // console.log("historyVal", historyVal);
        const {data} = historyVal??{};
        if (data|| id) return;
    }, [id,historyVal, ready, updateData]);

    // useEffect(() => {
    //     if (!historyVal) return;
    //
    //     if (historyVal.historyUpdateKey !== id) {
    //         idRef.current = historyVal.historyUpdateKey;
    //         dispatchHistoryValueToIdiomaticContext(historyVal, idiomaticDispatchValue);
    //         return;
    //     }
    //
    //     if (historyVal.historyUpdateKey === id) {
    //         return;
    //     }
    //
    //     setId(updateData(idiomaticContextValue));
    //     console.log("Data sent to historyVal:", idiomaticContextValue, historyVal);
    // }, [historyVal, idiomaticContextValue, id]);

    return (
        <IdiomaticContext.Provider value={idiomaticContextValue}>
            <IdiomaticDispatchContext.Provider value={idiomaticDispatchValue}>
                {children}
            </IdiomaticDispatchContext.Provider>
        </IdiomaticContext.Provider>
    );
}


export enum ReducerActionType {
    loaded = 'loaded',
    added = 'added',
    changed = 'changed',
    deleted = 'deleted',
}

interface ReducerAction {
    type: string;
    payload: any;
}

interface IdiomaticReducerAction<T extends IdiomaticShape> extends ReducerAction {
    type: ReducerActionType;
    payload: T;
    payloads?: T[],
}

function idiomaticLoaderAction<T extends IdiomaticShape = IdiomaticShape>(payloads: T[]): IdiomaticReducerAction<T> {
    return {
        type: ReducerActionType.loaded,
        payload: null,
        payloads,
    };
}

function idiomaticChangerAction<T extends IdiomaticShape = IdiomaticShape>(payload: T): IdiomaticReducerAction<T> {
    console.log("idiomaticChangerAction c", payload);
    return {
        type: ReducerActionType.changed,
        payload,
    };
}

function idiomaticPlanReducer(idiomaticShapes: IdiomaticPlan[], action: IdiomaticReducerAction<IdiomaticPlan>) {
    return idiomaticReducer<IdiomaticPlan>(idiomaticShapes, action);
}

function idiomaticActionReducer(idiomaticShapes: IdiomaticAction[], action: IdiomaticReducerAction<IdiomaticAction>) {
    return idiomaticReducer<IdiomaticAction>(idiomaticShapes, action);
}

function idiomaticIndicatorReducer(idiomaticShapes: IdiomaticIndicator[], action: IdiomaticReducerAction<IdiomaticIndicator>) {
    return idiomaticReducer<IdiomaticIndicator>(idiomaticShapes, action);
}

function idiomaticArtifactReducer(idiomaticShapes: IdiomaticArtifact[], action: IdiomaticReducerAction<IdiomaticArtifact>) {
    return idiomaticReducer<IdiomaticArtifact>(idiomaticShapes, action);
}

function idiomaticReducer<T extends IdiomaticShape>(idiomaticShapes: T[], action: IdiomaticReducerAction<T>) {
    const {type, payload, payloads} = action;
    switch (type) {
        case  ReducerActionType.loaded: {
            return [...payloads];
        }
        case  ReducerActionType.added: {
            return [...idiomaticShapes, {
                ...payload,
                done: false
            }];
        }
        case ReducerActionType.changed: {
            return idiomaticShapes.map(t => {
                if (t.id === payload.id) {
                    return payload;
                } else {
                    return t;
                }
            });
        }
        case ReducerActionType.deleted: {
            return idiomaticShapes.filter(t => t.id !== payload.id);
        }
        default: {
            throw Error('Unknown ReducerActionType: ' + type);
        }
    }
}

export enum InteractionType {
    Emulation = 'Emulation',
    Simulacra = 'Simulacra',
    Simulation = 'Simulation',
}

export enum KnowledgeType {
    Analytic = 'Analytic',
    Synthetic = 'Synthetic',
    Idiomatic = 'Idiomatic',
    Idiosyncratic = 'Idiosyncratic',
}

export enum AdjudicationType {
    Certainty = 'Certainty',
    Credence = 'Credence',
    Causal = 'Causal',
}

export enum ArtifactType {
    RequirementFacet = 'RequirementFacet',
    NarrativeFacet = 'NarrativeFacet',
    ExternalFacet = 'ExternalFacet',
    OfficialDocumentation = 'OfficialDocumentation',
    AlternativeDocumentation = 'AlternativeDocumentation',
    SourceCode = 'SourceCode',
    ExecutionState = 'ExecutionState',
    ExecutionVisualization = 'ExecutionVisualization',
}

export enum IdiomaticKind { // used for dispatch
    MorphismShape = 'MorphismShape',
    IdiomaticShape = 'IdiomaticShape',
    IdiomaticPlan = 'IdiomaticPlan',
    IdiomaticAction = 'IdiomaticAction',
    IdiomaticIndicator = 'IdiomaticIndicator',
    IdiomaticArtifact = 'IdiomaticArtifact'
}

interface IdealShape {
    kind?: any;
    id: string;
    titleMarkdownString: string;
    contentMarkdownString?: string;
    active?: boolean;
    done?: boolean;
    crossShape?: any;
}

interface MorphismShape extends IdealShape {
    kind: IdiomaticKind.MorphismShape;
    fromId: string;
    fromKind: IdiomaticKind;
    toId: string;
    toKind: IdiomaticKind;
    relation: IdealShape;
}

interface IdiomaticShape extends IdealShape {
    morphisms: MorphismShape[];
}

export interface IdiomaticPlan extends IdiomaticShape {
    kind: IdiomaticKind.IdiomaticPlan;
    contentSeparator?: boolean;
    demoMode?: boolean;
    adjudicationType: AdjudicationType;
}

export interface IdiomaticAction extends IdiomaticShape {
    kind: IdiomaticKind.IdiomaticAction;
    knowledgeType: KnowledgeType;
}

export interface IdiomaticIndicator extends IdiomaticShape {
    kind: IdiomaticKind.IdiomaticIndicator;
    interactionType: InteractionType;
}

export interface IdiomaticArtifact extends IdiomaticShape {
    kind: IdiomaticKind.IdiomaticArtifact;
    artifactType: ArtifactType;
    artifactCommand: string;
}


interface IdiomaticContextShape {
    id: string;
    idiomaticPlans: IdiomaticPlan[];
    idiomaticActions: IdiomaticAction[];
    idiomaticIndicators: IdiomaticIndicator[];
    idiomaticArtifacts: IdiomaticArtifact[];
}

interface IdiomaticDispatchShape {
    idiomaticPlanDispatch: Function;
    idiomaticActionDispatch: Function;
    idiomaticIndicatorDispatch: Function;
    idiomaticArtifactDispatch: Function;
    idiomaticChangerAction: Function;
}

export function isMorphism(morphismShape: MorphismShape, from: IdealShape, to: IdealShape): boolean {
    if (!(morphismShape && from && to)) {
        return false;
    }

    if (!(morphismShape.fromKind === from.kind && morphismShape.toKind === to.kind)) {
        return false;
    }

    if (!(morphismShape.fromId === from.id && morphismShape.toId === to.id)) {
        return false;
    }
    return true;
}

export function fromShapesToShapes<T1 extends IdiomaticShape, T2 extends IdiomaticShape>(fromShapes: T1[], toShapes: T2[]) {
    return fromShapes.reduce((re, fromShape) => {
        if (!fromShape.morphisms.reduce) {
            console.log("fromShape", {fromShape, fromShapes, toShapes});
        }
        re[fromShape.id] = fromShape.morphisms.reduce((r, e) => {
            const morphicShapes = toShapes.find(idiomaticAction => isMorphism(e, fromShape, idiomaticAction));
            if (morphicShapes) {
                r.push(morphicShapes);
            }
            return r;
        }, []);
        return re;
    }, {});
}

const initialIdiomaticContextShape: IdiomaticContextShape = {
    id: "initialIdiomaticContextShape",
    idiomaticPlans: [],
    idiomaticActions: [],
    idiomaticIndicators: [],
    idiomaticArtifacts: [],
};


const demoIdiomaticContextShape: IdiomaticContextShape = {
    id: "demoIdiomaticContextShape",
    idiomaticPlans: [
        {
            demoMode: true,
            adjudicationType: AdjudicationType.Certainty,
            kind: IdiomaticKind.IdiomaticPlan,
            id: "0",
            titleMarkdownString: `SeeCode.run 101`,
            contentMarkdownString: ` Explore your code as it runs and seek information everywhere anywhere all at once*.`,
            done: false,
            morphisms: [
                {
                    kind: IdiomaticKind.MorphismShape,
                    id: "0",
                    titleMarkdownString: "",
                    fromId: "0",
                    fromKind: IdiomaticKind.IdiomaticPlan,
                    toId: "0",
                    toKind: IdiomaticKind.IdiomaticAction,
                    relation: {
                        id: "0",
                        titleMarkdownString: ""
                    }
                },
                {
                    kind: IdiomaticKind.MorphismShape,
                    id: "1",
                    titleMarkdownString: "",
                    fromId: "1",
                    fromKind: IdiomaticKind.IdiomaticPlan,
                    toId: "0",
                    toKind: IdiomaticKind.IdiomaticAction,
                    relation: {
                        id: "0",
                        titleMarkdownString: ""
                    }
                },
                {
                    kind: IdiomaticKind.MorphismShape,
                    id: "2",
                    titleMarkdownString: "",
                    fromId: "2",
                    fromKind: IdiomaticKind.IdiomaticPlan,
                    toId: "0",
                    toKind: IdiomaticKind.IdiomaticAction,
                    relation: {
                        id: "0",
                        titleMarkdownString: ""
                    }
                },
            ],
        },
    ],
    idiomaticActions: [
        {
            knowledgeType: KnowledgeType.Idiomatic,
            kind: IdiomaticKind.IdiomaticAction,
            id: "0",
            titleMarkdownString: 'Seek everything', //navigating, and manipulating it searching, navigating, and manipulating it
            contentMarkdownString: " Query your source code, program execution values, or application visuals as they run",
            done: false,
            morphisms: [
                {
                    kind: IdiomaticKind.MorphismShape,
                    id: "0",
                    titleMarkdownString: "",
                    contentMarkdownString: "",
                    fromId: "0",
                    fromKind: IdiomaticKind.IdiomaticAction,
                    toId: "0",
                    toKind: IdiomaticKind.IdiomaticIndicator,
                    relation: {
                        id: "0",
                        titleMarkdownString: ""
                    }
                },
            ]
        },
        {
            knowledgeType: KnowledgeType.Idiomatic,
            kind: IdiomaticKind.IdiomaticAction,
            id: "1",
            titleMarkdownString: 'Identify computational expressions in your code',
            contentMarkdownString: "Find executed code as strongly highlighted",
            done: false,
            morphisms: [
                {
                    kind: IdiomaticKind.MorphismShape,
                    id: "0",
                    titleMarkdownString: "",
                    contentMarkdownString: "",
                    fromId: "0",
                    fromKind: IdiomaticKind.IdiomaticAction,
                    toId: "0",
                    toKind: IdiomaticKind.IdiomaticIndicator,
                    relation: {
                        id: "0",
                        titleMarkdownString: ""
                    }
                },
            ]
        },
        {
            knowledgeType: KnowledgeType.Idiomatic,
            kind: IdiomaticKind.IdiomaticAction,
            id: "2",
            titleMarkdownString: `Confirm each computational expression's execution result`,
            contentMarkdownString: "They are snapshots of what the value was at that time.",
            done: false,
            morphisms: [
                {
                    kind: IdiomaticKind.MorphismShape,
                    id: "0",
                    titleMarkdownString: "",
                    contentMarkdownString: "",
                    fromId: "0",
                    fromKind: IdiomaticKind.IdiomaticAction,
                    toId: "0",
                    toKind: IdiomaticKind.IdiomaticIndicator,
                    relation: {
                        id: "0",
                        titleMarkdownString: ""
                    }
                },
            ]
        },
        {
            knowledgeType: KnowledgeType.Idiomatic,
            kind: IdiomaticKind.IdiomaticAction,
            id: "3",
            titleMarkdownString: 'Navigate in time about the results changes of each computational expression',
            contentMarkdownString: "Iterative blocks such as functions and loops allow you to traverse any of their executions",
            done: false,
            morphisms: [
                {
                    kind: IdiomaticKind.MorphismShape,
                    id: "0",
                    titleMarkdownString: "",
                    contentMarkdownString: "",
                    fromId: "0",
                    fromKind: IdiomaticKind.IdiomaticAction,
                    toId: "0",
                    toKind: IdiomaticKind.IdiomaticIndicator,
                    relation: {
                        id: "0",
                        titleMarkdownString: ""
                    }
                },
            ]
        },
    ],

    idiomaticIndicators: [
        {
            interactionType: InteractionType.Simulation,
            kind: IdiomaticKind.IdiomaticIndicator,
            id: "0",
            titleMarkdownString: 'These are some computational expressions',
            contentMarkdownString: "Vivid highlights indicate execute code",
            done: false,
            morphisms: [
                {
                    kind: IdiomaticKind.MorphismShape,
                    id: "0",
                    titleMarkdownString: "",
                    fromId: "0",
                    fromKind: IdiomaticKind.IdiomaticIndicator,
                    toId: "0",
                    toKind: IdiomaticKind.IdiomaticArtifact,
                    relation: {
                        id: "0",
                        titleMarkdownString: ""
                    }
                },
            ]
        },
    ],
    idiomaticArtifacts: [
        {
            artifactType: ArtifactType.SourceCode,
            kind: IdiomaticKind.IdiomaticArtifact,
            id: "0",
            titleMarkdownString: 'A expression that executed',
            contentMarkdownString: "Vivid highlights indicate execute code",
            artifactCommand: `{\"value\": \"array\", \"isFunctions\":true,\"isExpressions\":true,\"isValues\":false,\"isCase\":false,\"isWord\":false,\"isRegExp\":false,\"visualQuery\":[]}`,
            done: false,
            morphisms: []
        },
    ],
};


// const initialIdiomaticContextShape: IdiomaticContextShape = demoIdiomaticContextShape;
