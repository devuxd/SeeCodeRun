// import { v4 as uuid } from 'uuid';
import {BehaviorSubject, combineLatest} from 'rxjs';
// import {} from 'rxjs/operators';//combineLatestAll
import {CALE} from "./modules/ALE";
import DALE from "./modules/dale/DALE";
import RxMonacoEditor, {makeMonacoLanguageInlayHinter} from "./modules/cale/RxMonacoEditor";


//RX principles
// Everything is a function (abstraction unit) until used within functions (the context), from now on functions are RX behaviors (as from Numbers are Functions' paper, but functions are already defined in PLs)
// Category Classes are high-order categories, they organize functions into structures, objects are functions that are composable


// export const CheckResult = {
//     PENDING: "",
//     CHECKING: "",
//     CANCELED: "",
//     PASSED: "",
//     FAILED: "",
// }
// class Check{
//     constructor(result, reason) {
//         this.result = result;
//         this.reason = reason;
//     }
// }
//
// const checkCategoryValue = (value)=>{
//     if(!value){
//
//     }
//     const {objectFunctor, autoFunctor, compositionFunctor} =  value;
//
//     if(!objectFunctor){
//
//     }
//
//     if(objectFunctor, autoFunctor, compositionFunctor){
//
//     }
//
//     if(objectFunctor, autoFunctor, compositionFunctor){
//
//     }
// };
//
// class Category{
//     constructor() {
//         const observable =new BehaviorSubject({});
//         this.next = ()=>observable;
//
//         this.objects = ()=>objects;
//         this.compose = ()=>{
//
//         }
//     }
// }
//
// class Phenomena{
//     constructor(objects) {
//     }
// }
//
// class Emergence{
//
// }
//
// class Pattern{
//
// }
//
// class Dynamic{
//
// }
//
// class ReferenceFrame{
//
// }
//
// class Identity{
//     constructor(auto) {
//     }
// }
//
//
//
// class System{
//
// }

interface RxShape {
    [key: string]: any;
}

interface CaleShape extends RxShape {
    cale: any;
}

export interface MonacoEditorReadyShape extends RxShape {
    isMonacoEditorReady: boolean;
}

interface AleFirecoPadShape extends RxShape {
    aleFirecoPad: any;
}

//https://microsoft.github.io/monaco-editor/docs.html#interfaces/languages.InlayHint.html
export interface InLayHint {
    kind?: 1 | 2;
    label: string;
    paddingLeft?: boolean;
    paddingRight?: boolean;
    position: any;
    textEdits?: any;
    tooltip?: boolean;
}

// https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IModelDeltaDecoration.html
export interface IModelDeltaDecoration {
    option: RxShape;
    range: RxShape;
}

export interface IModelDeltaDecoration {
    option: RxShape;
    range: RxShape;
    expressionId: string;
}

export interface IModelDeltaDecoration {
    option: RxShape;
    range: RxShape;
    expressionId: string;
    expressionType: string;
}

export interface IModelDeltaDecoration {
    option: RxShape;
    range: RxShape;
    expressionId: string;
    expressionType: string;
    hintManager: HintManager;
}

interface InlayHintLabelPart {
    label: string;
    tooltip?: any;
    expressionType?: string;
}

interface InlayHintLabelPart {
    command?: any;
    label: string;
    location?: any;
    tooltip?: any;
    others?: any;
    expressionType?: string;
}

interface toHints {
    (ranges: Array<IModelDeltaDecoration>): Array<any>
}

export interface MonacoInlayHintsShape extends RxShape {
    toInLayHints(value: MonacoInlayHintsParam, toHints: toHints): Array<InLayHint>;

    commentRanges: Array<IModelDeltaDecoration>;
    callExpressionRanges: Array<IModelDeltaDecoration>;
}

type MonacoInlayHintsParam = Partial<Omit<MonacoInlayHintsShape, 'toInLayHints'>>;

export class ReducerBehaviorSubject<T extends RxShape> extends BehaviorSubject<T> {
    constructor(_value: T) {
        super(_value);
    }

    next = (nextProps: T) => {
        const nextValue: T = {...super.getValue(), ...nextProps};
        super.next(nextValue);
    }
}

const toInLayHints = ({
                          commentRanges,
                          callExpressionRanges
                      }: MonacoInlayHintsParam, toHints: toHints): Array<InLayHint> => {
    return toHints([...commentRanges, ...callExpressionRanges]);
};

class HintPart implements InlayHintLabelPart {
    static TS_SYMBOL_TYPE_ANY = "any";
    static TS_SYMBOL_TYPE_UNKNOWN = "?";
    static TS_SYMBOL_TYPE_UNKNOWN_TOOLTIP = "Dynamic Type not resolved yet: It will be resolved once the expression runs."
    static TS_SYMBOL_TYPE_NAME = "type";
    static TS_SYMBOL_TYPE_NAMES = "types";
    static TS_SYMBOL_TYPE = ":";
    static TS_SYMBOL_SEPARATOR = "";
    static TS_SYMBOL_TYPE_PLUS = "+";
    static TS_SYMBOL_ALTERNATE_TYPE = "|";

    expressionType: string;
    label: string;
    tooltip: { value: string };

    constructor() {
        this.expressionType = HintPart.TS_SYMBOL_TYPE_ANY;
        this.label = HintPart.TS_SYMBOL_TYPE_UNKNOWN;
        this.tooltip = {value: HintPart.TS_SYMBOL_TYPE_UNKNOWN_TOOLTIP};
    }

    resolve(expressionType: string, plusTypes: string[] = []) {
        const plural = plusTypes?.length > 1 ?? false;
        this.expressionType = expressionType;
        this.label = `${HintPart.TS_SYMBOL_TYPE}${HintPart.TS_SYMBOL_SEPARATOR}${expressionType}${plural ? HintPart.TS_SYMBOL_TYPE_PLUS : ""}`;
        const tooltip = plusTypes.join(HintPart.TS_SYMBOL_ALTERNATE_TYPE);
        const value = (
            `${
                plural ? HintPart.TS_SYMBOL_TYPE_NAMES : HintPart.TS_SYMBOL_TYPE_NAME
            }${
                HintPart.TS_SYMBOL_TYPE
            } ${expressionType} ${plural ? HintPart.TS_SYMBOL_TYPE_PLUS : ""}${tooltip}`
        );

        this.tooltip = {value};
    }
}

class HintManager {
    private static EMPTY_MONACO_HINT = [new HintPart()];
    private inlayHintLabelParts: Map<string, HintPart>;

    constructor() {
        this.inlayHintLabelParts = new Map<string, HintPart>();
    }

    updateHintParts(decoration: IModelDeltaDecoration): void {
        const expressionType = mapExpressionTypeToTypeScript(decoration.expressionType);
        if (!this.inlayHintLabelParts.has(expressionType)) {
            const hintPart = new HintPart();
            hintPart.resolve(expressionType);
            this.inlayHintLabelParts.set(expressionType, hintPart);
        }
    }

    getMonacoHints(index = 0): InlayHintLabelPart[] {
        if (this.inlayHintLabelParts.size < 1) {
            return HintManager.EMPTY_MONACO_HINT;
        }

        const ts = Array.from(this.inlayHintLabelParts.keys());

        const expressionType = ts[index];
        const plusTypes = ts.filter(t => t !== expressionType);
        const hintPart = new HintPart();
        hintPart.resolve(expressionType, plusTypes);

        return [hintPart];

    }
}

function mapExpressionTypeToTypeScript(expressionType: string | null | undefined): string {
    if (expressionType === null || expressionType === undefined || expressionType === "null" || expressionType === "undefined") {
        return 'void';
    }

    switch (expressionType) {
        case 'String':
            return 'string';
        case 'Number':
            return 'number';
        case 'Boolean':
            return 'boolean';
        default:
            return expressionType;
    }
}


const updateInlayHint = (expressionShape: IModelDeltaDecoration) => {
    if (!expressionShape) {
        return;
    }

    expressionShape.hintManager ??= new HintManager();
    expressionShape.hintManager.updateHintParts(expressionShape);
}

const initFirecoPadBehaviors = (aleFirecoPad: any, appManager: any = null) => {
    const cale = new CALE();
    const caleSubject = new ReducerBehaviorSubject<CaleShape>({cale});
    const aleFirecoPadSubject = new ReducerBehaviorSubject<AleFirecoPadShape>({aleFirecoPad});

    const monacoInlayHintsSubject = new ReducerBehaviorSubject<MonacoInlayHintsShape>({
        toInLayHints,
        commentRanges: [],
        callExpressionRanges: []
    });

    const monacoInlayHintsSubjectNextCallExpression = (callExpressionShape: IModelDeltaDecoration) => {
        const nextValue = {...monacoInlayHintsSubject.value};
        nextValue.callExpressionRanges = [...(nextValue.callExpressionRanges ?? [])];
        const {callExpressionRanges} = nextValue;

        const previousCallExpressionShapeI = callExpressionRanges.findIndex(ces => callExpressionShape.expressionId === ces.expressionId);

        updateInlayHint(callExpressionShape);

        if (previousCallExpressionShapeI > -1) {
            //  callExpressionRanges[previousCallExpressionShapeI] = callExpressionShape;
        } else {
            callExpressionRanges.push(callExpressionShape);
        }

        // console.log("monacoInlayHintsSubjectNextCallExpression", {callExpressionShape, nextValue});
        monacoInlayHintsSubject.next(nextValue);
    }

    // const monacoInlayHintsSubjectNext = ({commentRanges, callExpressionRanges}:MonacoInlayHintsParam)=>{
    //     const nextValue:MonacoInlayHintsShape = {...monacoInlayHintsSubject.value};
    //     if(commentRanges){
    //         nextValue.commentRanges = commentRanges;
    //     }
    //
    //     if(){
    //
    //     }
    //
    //     monacoInlayHintsSubject.next(nextValue);
    // };
    const daleSubject = new ReducerBehaviorSubject<RxShape>({});
    const aleInstanceSubject = new ReducerBehaviorSubject<RxShape>({});
    const monacoEditorSubject = new ReducerBehaviorSubject<RxShape>({});
    const monacoEditorChangeSubject = new ReducerBehaviorSubject<RxShape>({});
    const seeSubject = new ReducerBehaviorSubject<RxShape>({});
    const codeSubject = new ReducerBehaviorSubject<RxShape>({});
    const runSubject = new ReducerBehaviorSubject<RxShape>({});
    const contentWidgetManagerSubject = new ReducerBehaviorSubject<RxShape>({});
    const codeChangesSubject = new ReducerBehaviorSubject<RxShape>({});
    const rxCloudStorePathSubject = new ReducerBehaviorSubject<RxShape>({});
    // const aleInstanceContext = combineLatest({aleFirecoPad: aleFirecoPadSubject, cale: caleSubject, dale: daleSubject});
    // aleInstanceContext.subscribe(v=>console.log("vvvv", v))

    let codeChangesSubjectUnsubscribable = null;
    let monacoLanguageInlayHinterSubjectUnsubscribable = null;
    const monacoEditorSubjectUnsubscribable = monacoEditorSubject.subscribe(({editorId, monacoEditor, monaco}) => {
        if (!(editorId && monacoEditor && monaco)) {
            return;
        }
        const decorationOptions = {
            // inlineClassName: "myInlineDecoration",
            zIndex: 1,
        };
        const decorationFilter = d => d.options?.zIndex === decorationOptions.zIndex;
        codeChangesSubjectUnsubscribable = RxMonacoEditor(editorId,
            monaco,
            monacoEditor,
            () => codeChangesSubject,
            () => monacoInlayHintsSubject,
            decorationFilter,
            decorationOptions
        );
        monacoLanguageInlayHinterSubjectUnsubscribable = makeMonacoLanguageInlayHinter(monaco, () => monacoInlayHintsSubject);
    });

    let _complete = null;
    const monacoEditorChangeComplete = (complete: () => void = null) => {
        if (complete) {
            _complete = complete;
            return;
        }
        _complete?.();
        _complete = null;
    };

    const monacoEditorChangeCompleter = {complete: monacoEditorChangeComplete}

    let unSubbed: boolean;
    const unSubAll = () => {
        if (unSubbed) {
            return;
        }
        for (let b of [
            monacoEditorSubjectUnsubscribable,
            codeChangesSubjectUnsubscribable,
            monacoLanguageInlayHinterSubjectUnsubscribable
        ]) {
            b?.unsubscribe();
        }
        unSubbed = true;
    };

    let completed: boolean;
    const completeAll = () => {
        if (completed) {
            return;
        }
        for (let b of [aleFirecoPadSubject,
            caleSubject,
            daleSubject,
            aleInstanceSubject,
            monacoEditorSubject,
            monacoEditorChangeSubject,
            monacoEditorChangeCompleter,
            seeSubject,
            codeSubject,
            runSubject,
            contentWidgetManagerSubject,
            codeChangesSubject,
            rxCloudStorePathSubject,
            // aleInstanceContext
        ]) {
            b.complete();
        }
        completed = true;
    };


    const behaviors = {
        aleFirecoPadSubject: () => aleFirecoPadSubject,
        caleSubject: () => caleSubject,
        daleSubject: () => daleSubject,
        aleInstanceSubject: () => aleInstanceSubject,
        monacoEditorSubject: () => monacoEditorSubject,
        monacoEditorChangeSubject: () => monacoEditorChangeSubject,
        monacoEditorChangeComplete,
        seeSubject: () => seeSubject,
        codeSubject: () => codeSubject,
        runSubject: () => runSubject,
        contentWidgetManagerSubject: () => contentWidgetManagerSubject,
        codeChangesSubject: () => codeChangesSubject,
        rxCloudStorePathSubject: () => rxCloudStorePathSubject,
        // aleInstanceContext: () => aleInstanceContext,
        completeAll,
        unSubAll,
        monacoInlayHintsSubjectNextCallExpression,
    };

    aleFirecoPad.behaviors = () => behaviors;


    DALE(aleFirecoPad);
}

export default class RxApp {
    private readonly _appManager: any;
    private readonly _aleEditorId: string
    private _aleFirecoPad: any;

    /**
     * Returns a ReducerBehaviorSubject with an initial MonacoEditorReadyShape object.
     * @returns {ReducerBehaviorSubject<MonacoEditorReadyShape>} - The ReducerBehaviorSubject with the initial MonacoEditorReadyShape object.
     */
    static get initMonacoEditorReadySubject(): ReducerBehaviorSubject<MonacoEditorReadyShape> {
        // Create and return a new ReducerBehaviorSubject with an initial MonacoEditorReadyShape object.
        return new ReducerBehaviorSubject<MonacoEditorReadyShape>({isMonacoEditorReady: false});
    }

    constructor(appManager: any, aleEditorId: string) {
        this._appManager = appManager
        this._aleEditorId = aleEditorId;
        this.aleFirecoPad_ = appManager.firecoPads[aleEditorId];

        initFirecoPadBehaviors(this.aleFirecoPad_, this.appManager);

        this.aleFirecoPad_.behaviors().aleFirecoPadSubject().subscribe(
            (payload: AleFirecoPadShape): undefined => {
                if (!this.aleFirecoPad_ || this.aleFirecoPad_ === payload.aleFirecoPad) {
                    return;
                }

                this.aleFirecoPad_.behaviors().completeAll();

                this.aleFirecoPad_ = payload.aleFirecoPad;
                initFirecoPadBehaviors(this.aleFirecoPad_, this.appManager);
            }
        );

    }

    public get appManager() {
        return this._appManager;
    }

    public get aleEditorId() {
        return this._aleEditorId;
    }

    public get aleFirecoPad_() {
        return this._aleFirecoPad;
    }

    private set aleFirecoPad_(aleFirecoPad: any) {
        this._aleFirecoPad = aleFirecoPad;
    }

    onRxCloudStorePath = (rxCloudStorePath: string, firebaseDb: any) => {
        this.aleFirecoPad_?.behaviors().rxCloudStorePathSubject().next({rxCloudStorePath, firebaseDb});
    }

    aleFirecoPad = () => this.aleFirecoPad_;
    onFirebaseDbRef = (listener: (data: RxShape[]) => void): void => {
        const observable1: BehaviorSubject<RxShape> = this.aleFirecoPad_?.behaviors().aleFirecoPadSubject();
        const observable2: BehaviorSubject<RxShape> = this.aleFirecoPad_?.behaviors().rxCloudStorePathSubject();
        combineLatest([observable1, observable2]).subscribe(
            ([, {rxCloudStorePath, firebaseDb}]) => {
                if (rxCloudStorePath && firebaseDb) {
                    // console.log("onAleFirebaseRef", rxCloudStorePath, firebaseDb);
                    const firebaseDbReference = firebaseDb.ref(rxCloudStorePath);
                    const aleFirecoPad = this.aleFirecoPad_;
                    listener([firebaseDbReference, aleFirecoPad]);
                }
            }
        );
    }
}

// const makeSubjectConfigs = (aleFirecoPad, cale, additionalParams)=> ({
//     cale: () => new ReducerBehaviorSubject<CaleShape>({ cale }),
//     aleFirecoPad: () => new ReducerBehaviorSubject<AleFirecoPadShape>({aleFirecoPad}),
//     monacoInlayHints: (additionalParams) => new ReducerBehaviorSubject<MonacoInlayHintsShape>({
//         toInLayHints: additionalParams.toInLayHints,
//         commentRanges: [],
//         callExpressionRanges: []
//     }),
//     dale: () => new ReducerBehaviorSubject<RxShape>({}),
//     aleInstance: () => new ReducerBehaviorSubject<RxShape>({}),
//     monacoEditor: () => new ReducerBehaviorSubject<RxShape>({}),
//     monacoEditorChange: () => new ReducerBehaviorSubject<RxShape>({}),
//     see: () => new ReducerBehaviorSubject<RxShape>({}),
//     code: () => new ReducerBehaviorSubject<RxShape>({}),
//     run: () => new ReducerBehaviorSubject<RxShape>({}),
//     contentWidgetManager: () => new ReducerBehaviorSubject<RxShape>({}),
//     codeChanges: () => new ReducerBehaviorSubject<RxShape>({}),
//     rxCloudStorePath: () => new ReducerBehaviorSubject<RxShape>({})
// });
//
// interface SubjectMap {
//     [key: string]: ReducerBehaviorSubject<any>;
// }
//
// class BehaviorManager {
//     subjects: Record<string, ()=>ReducerBehaviorSubject<any>> = {};
//     codeChangesSubjectUnsubscribable = null;
//     monacoLanguageInlayHinterSubjectUnsubscribable = null;
//     monacoEditorSubjectUnsubscribable = null;
//     unSubbed = false;
//     completed = false;
//
//     constructor(aleFirecoPad, additionalParams) {
//         const cale = new CALE();
//         const subjectConfigs = makeSubjectConfigs(aleFirecoPad, cale);
//         // Iterate over subjectConfigs to initialize subjects
//         Object.entries(subjectConfigs).forEach(([key, config]) => {
//
//             this.subjects[key] = config;
//         });
//
//         this.subscribeToSubjects();
//     }
//
//     subscribeToSubjects() {
//         this.monacoEditorSubjectUnsubscribable = this.subjects.monacoEditor.subscribe(({editorId, monacoEditor, monaco}) => {
//             if (!(editorId && monacoEditor && monaco)) return;
//             const decorationOptions = { zIndex: 1 };
//             const decorationFilter = d => d.options?.zIndex === decorationOptions.zIndex;
//             this.codeChangesSubjectUnsubscribable = RxMonacoEditor(editorId, monaco, monacoEditor,
//                 () => this.subjects.codeChanges,
//                 () => this.subjects.monacoInlayHints,
//                 decorationFilter, decorationOptions);
//             this.monacoLanguageInlayHinterSubjectUnsubscribable = makeMonacoLanguageInlayHinter(monaco, () => this.subjects.monacoInlayHints);
//         });
//     }
//
//     monacoInlayHintsSubjectNextCallExpression(callExpressionShape) {
//         const monacoInlayHints = this.subjects.monacoInlayHints.getValue();
//         monacoInlayHints.callExpressionRanges = monacoInlayHints.callExpressionRanges || [];
//         const index = monacoInlayHints.callExpressionRanges.findIndex(ces => ces.expressionId === callExpressionShape.expressionId);
//
//         if (index > -1) {
//             monacoInlayHints.callExpressionRanges[index] = updateInlayHint(monacoInlayHints.callExpressionRanges[index], callExpressionShape);
//         } else {
//             monacoInlayHints.callExpressionRanges.push(callExpressionShape);
//         }
//
//         console.log("monacoInlayHintsSubjectNextCallExpression", {callExpressionShape, monacoInlayHints});
//         this.subjects.monacoInlayHints.next(monacoInlayHints);
//     }
//
//     unSubAll() {
//         if (this.unSubbed) return;
//         [this.monacoEditorSubjectUnsubscribable, this.codeChangesSubjectUnsubscribable, this.monacoLanguageInlayHinterSubjectUnsubscribable]
//             .forEach(subscription => subscription?.unsubscribe());
//         this.unSubbed = true;
//     }
//
//     completeAll() {
//         if (this.completed) return;
//         Object.values(this.subjects).forEach(subject => subject.complete());
//         this.completed = true;
//     }
//     // Methods (subscribeToSubjects, monacoInlayHintsSubjectNextCallExpression, unSubAll, completeAll) remain the same
// }


// class BehaviorManager{
//     const cale = new CALE();
//     const caleSubject = new ReducerBehaviorSubject<CaleShape>({cale});
//     const aleFirecoPadSubject = new ReducerBehaviorSubject<AleFirecoPadShape>({aleFirecoPad});
//
//     const monacoInlayHintsSubject = new ReducerBehaviorSubject<MonacoInlayHintsShape>({
//         toInLayHints,
//         commentRanges: [],
//         callExpressionRanges: []
//     });
//
//     const monacoInlayHintsSubjectNextCallExpression = (callExpressionShape: IModelDeltaDecoration) => {
//         const nextValue = {...monacoInlayHintsSubject.value};
//         nextValue.callExpressionRanges = [...(nextValue.callExpressionRanges ?? [])];
//         const {callExpressionRanges} = nextValue;
//
//         const previousCallExpressionShapeI = callExpressionRanges.findIndex(ces => callExpressionShape.expressionId === ces.expressionId);
//
//         const nextCallExpressionShape = updateInlayHint(callExpressionRanges[previousCallExpressionShapeI], callExpressionShape);
//
//         if (previousCallExpressionShapeI > -1) {
//             callExpressionRanges[previousCallExpressionShapeI] = nextCallExpressionShape;
//         } else {
//             callExpressionRanges.push(nextCallExpressionShape);
//         }
//
//         console.log("monacoInlayHintsSubjectNextCallExpression", {callExpressionShape, nextValue});
//         monacoInlayHintsSubject.next(nextValue);
//     }
//
//     // const monacoInlayHintsSubjectNext = ({commentRanges, callExpressionRanges}:MonacoInlayHintsParam)=>{
//     //     const nextValue:MonacoInlayHintsShape = {...monacoInlayHintsSubject.value};
//     //     if(commentRanges){
//     //         nextValue.commentRanges = commentRanges;
//     //     }
//     //
//     //     if(){
//     //
//     //     }
//     //
//     //     monacoInlayHintsSubject.next(nextValue);
//     // };
//     const daleSubject = new ReducerBehaviorSubject<RxShape>({});
//     const aleInstanceSubject = new ReducerBehaviorSubject<RxShape>({});
//     const monacoEditorSubject = new ReducerBehaviorSubject<RxShape>({});
//     const monacoEditorChangeSubject = new ReducerBehaviorSubject<RxShape>({});
//     const seeSubject = new ReducerBehaviorSubject<RxShape>({});
//     const codeSubject = new ReducerBehaviorSubject<RxShape>({});
//     const runSubject = new ReducerBehaviorSubject<RxShape>({});
//     const contentWidgetManagerSubject = new ReducerBehaviorSubject<RxShape>({});
//     const codeChangesSubject = new ReducerBehaviorSubject<RxShape>({});
//     const rxCloudStorePathSubject = new ReducerBehaviorSubject<RxShape>({});
//     // const aleInstanceContext = combineLatest({aleFirecoPad: aleFirecoPadSubject, cale: caleSubject, dale: daleSubject});
//     // aleInstanceContext.subscribe(v=>console.log("vvvv", v))
//
//     let codeChangesSubjectUnsubscribable = null;
//     let monacoLanguageInlayHinterSubjectUnsubscribable = null;
//     const monacoEditorSubjectUnsubscribable = monacoEditorSubject.subscribe(({editorId, monacoEditor, monaco}) => {
//         if (!(editorId && monacoEditor && monaco)) {
//             return;
//         }
//         const decorationOptions = {
//             // inlineClassName: "myInlineDecoration",
//             zIndex: 1,
//         };
//         const decorationFilter = d => d.options?.zIndex === decorationOptions.zIndex;
//         codeChangesSubjectUnsubscribable = RxMonacoEditor(editorId,
//             monaco,
//             monacoEditor,
//             () => codeChangesSubject,
//             () => monacoInlayHintsSubject,
//             decorationFilter,
//             decorationOptions
//         );
//         monacoLanguageInlayHinterSubjectUnsubscribable = makeMonacoLanguageInlayHinter(monaco, () => monacoInlayHintsSubject);
//     });
//
//     let unSubbed: boolean;
//     const unSubAll = () => {
//         if (unSubbed) {
//             return;
//         }
//         for (let b of [
//             monacoEditorSubjectUnsubscribable,
//             codeChangesSubjectUnsubscribable,
//             monacoLanguageInlayHinterSubjectUnsubscribable
//         ]) {
//             b?.unsubscribe();
//         }
//         unSubbed = true;
//     };
//
//     let completed: boolean;
//     const completeAll = () => {
//         if (completed) {
//             return;
//         }
//         for (let b of [aleFirecoPadSubject,
//             caleSubject,
//             daleSubject,
//             aleInstanceSubject,
//             monacoEditorSubject,
//             monacoEditorChangeSubject,
//             seeSubject,
//             codeSubject,
//             runSubject,
//             contentWidgetManagerSubject,
//             codeChangesSubject,
//             rxCloudStorePathSubject,
//             // aleInstanceContext
//         ]) {
//             b.complete();
//         }
//         completed = true;
//     };
//
//
//     const behaviors = {
//         aleFirecoPadSubject: () => aleFirecoPadSubject,
//         caleSubject: () => caleSubject,
//         daleSubject: () => daleSubject,
//         aleInstanceSubject: () => aleInstanceSubject,
//         monacoEditorSubject: () => monacoEditorSubject,
//         monacoEditorChangeSubject: ()=>monacoEditorChangeSubject,
//         seeSubject: () => seeSubject,
//         codeSubject: () => codeSubject,
//         runSubject: () => runSubject,
//         contentWidgetManagerSubject: () => contentWidgetManagerSubject,
//         codeChangesSubject: () => codeChangesSubject,
//         rxCloudStorePathSubject: () => rxCloudStorePathSubject,
//         // aleInstanceContext: () => aleInstanceContext,
//         completeAll,
//         unSubAll,
//         monacoInlayHintsSubjectNextCallExpression,
//     };
// }
