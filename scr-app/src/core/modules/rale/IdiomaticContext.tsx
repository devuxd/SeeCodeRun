import {createContext, useContext, useMemo, useReducer} from "react";
import IdiomaticIndicator from "./IdiomaticIndicator";

const IdiomaticContext = createContext<IdiomaticContextShape>(null);
const IdiomaticDispatchContext = createContext<IdiomaticDispatchShape>(null);

export const useIdiomaticContext = () => useContext(IdiomaticContext);
export const useIdiomaticDispatchContext = () => useContext(IdiomaticDispatchContext);

export function IdiomaticProvider({children}) {
    const [idiomaticPlans, idiomaticPlanDispatch] = useReducer(
        idiomaticPlanReducer,
        initialIdiomaticContextShape.idiomaticPlans
    );
    const [idiomaticActions, idiomaticActionDispatch] = useReducer(
        idiomaticActionReducer,
        initialIdiomaticContextShape.idiomaticActions
    );

    const [idiomaticIndicators, idiomaticIndicatorDispatch] = useReducer(
        idiomaticIndicatorReducer,
        initialIdiomaticContextShape.idiomaticIndicators
    );

    const [idiomaticArtifacts, idiomaticArtifactDispatch] = useReducer(
        idiomaticArtifactReducer,
        initialIdiomaticContextShape.idiomaticArtifacts
    );

    const idiomaticContextValue: IdiomaticContextShape = {
        idiomaticPlans,
        idiomaticActions,
        idiomaticIndicators,
        idiomaticArtifacts
    };

    const idiomaticDispatchValue: IdiomaticDispatchShape = useMemo(() => {
        return {
            idiomaticPlanDispatch,
            idiomaticActionDispatch,
            idiomaticIndicatorDispatch,
            idiomaticArtifactDispatch,
        }
    }, []);

    return (
        <IdiomaticContext.Provider value={idiomaticContextValue}>
            <IdiomaticDispatchContext.Provider value={idiomaticDispatchValue}>
                {children}
            </IdiomaticDispatchContext.Provider>
        </IdiomaticContext.Provider>
    );
}

export enum ReducerActionType {
    // loaded = 'loaded',
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
    const {type, payload} = action;
    switch (type) {
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

export enum IdiomaticKind {
    MorphismShape,
    IdiomaticShape,
    IdiomaticPlan,
    IdiomaticAction,
    IdiomaticIndicator,
    IdiomaticArtifact
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
    idiomaticPlans: [
        {
            demoMode: true,
            adjudicationType: AdjudicationType.Certainty,
            kind: IdiomaticKind.IdiomaticPlan,
            id: "0",
            titleMarkdownString: 'Computational Statements',
            contentMarkdownString: "SCR demo",
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
            ],
        },
    ],
    idiomaticActions: [
        {
            knowledgeType: KnowledgeType.Idiomatic,
            kind: IdiomaticKind.IdiomaticAction,
            id: "0",
            titleMarkdownString: 'Identify computational expressions in your code',
            contentMarkdownString: "You can follow executed code with highlights",
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
