// import { v4 as uuid } from 'uuid';
import {BehaviorSubject} from 'rxjs';
// import {combineLatest} from 'rxjs/operators';
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
    inlayHintLabelParts: Array<InlayHintLabelPart>;
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

const initFirecoPadBehaviors = (aleFirecoPad: any) => {
    const cale = new CALE();
    const caleSubject = new ReducerBehaviorSubject<CaleShape>({cale});
    const aleFirecoPadSubject = new ReducerBehaviorSubject<AleFirecoPadShape>({aleFirecoPad});

    const monacoInlayHintsSubject = new ReducerBehaviorSubject<MonacoInlayHintsShape>({
        toInLayHints,
        commentRanges: [],
        callExpressionRanges: []
    });

    const monacoInlayHintsSubjectNextCallExpression = (callExpressionShape: IModelDeltaDecoration) => {
        const nextValue: MonacoInlayHintsShape = {...monacoInlayHintsSubject.value};
        // console.log("monacoInlayHintsSubjectNextCallExpression", {callExpressionShape, nextValue});
        let isNew = true;
        nextValue.callExpressionRanges = nextValue.callExpressionRanges.reduce((r, e) => {
            if (callExpressionShape.expressionId === e.expressionId) {
                const {expressionType} = callExpressionShape;
                const inlayHintLabelParts = e.inlayHintLabelParts ?? [];
                let currentInlayHintLabelPart = inlayHintLabelParts[0];
                let othersInlayHintLabelPart = inlayHintLabelParts[1];

                if (expressionType !== currentInlayHintLabelPart.expressionType) {
                    inlayHintLabelParts[0] = {expressionType, label: expressionType, tooltip: "current type"};
                    if (othersInlayHintLabelPart) {
                        const other = currentInlayHintLabelPart.expressionType;
                        const others = inlayHintLabelParts[1].others;
                        others[other] = other;
                        inlayHintLabelParts[1].tooltip.value = `\`\`\`typescript\n${Object.keys(others).reduce((r, e) => `${r}${r.length ? '|' : ''}${e}`, ``)}\n\`\`\``;
                    } else {
                        const other = currentInlayHintLabelPart.expressionType;
                        const others = {};
                        others[other] = other;
                        inlayHintLabelParts[1] = {
                            label: "|+",
                            tooltip: {value: `\`\`\`typescript\n${other}\n\`\`\``},
                            others
                        };
                    }
                }

                r.push(callExpressionShape);
                isNew = false;
            } else {
                r.push(e);
            }
            return r;
        }, []);

        if (isNew) {
            //side effect!
            callExpressionShape.inlayHintLabelParts = [{
                expressionType: callExpressionShape.expressionType,
                label: ":" + callExpressionShape.expressionType,
                tooltip: "current type"
            }];

            nextValue.callExpressionRanges.push(callExpressionShape);
            console.log("nextValue.callExpressionRanges", nextValue.callExpressionRanges)
        }
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
    const seeSubject = new ReducerBehaviorSubject<RxShape>({});
    const codeSubject = new ReducerBehaviorSubject<RxShape>({});
    const runSubject = new ReducerBehaviorSubject<RxShape>({});
    const contentWidgetManagerSubject = new ReducerBehaviorSubject<RxShape>({});
    const codeChangesSubject = new ReducerBehaviorSubject<RxShape>({});
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
            seeSubject,
            codeSubject,
            runSubject,
            contentWidgetManagerSubject,
            codeChangesSubject,
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
        seeSubject: () => seeSubject,
        codeSubject: () => codeSubject,
        runSubject: () => runSubject,
        contentWidgetManagerSubject: () => contentWidgetManagerSubject,
        codeChangesSubject: () => codeChangesSubject,
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

    constructor(appManager: any, aleEditorId: string) {
        this._appManager = appManager
        this._aleEditorId = aleEditorId;
        this.aleFirecoPad_ = appManager.firecoPads[aleEditorId];

        initFirecoPadBehaviors(this.aleFirecoPad_);

        this.aleFirecoPad_.behaviors().aleFirecoPadSubject().subscribe(
            (payload: AleFirecoPadShape): undefined => {
                if (!this.aleFirecoPad_ || this.aleFirecoPad_ === payload.aleFirecoPad) {
                    return;
                }
                // console.log("cAGADA");
                this.aleFirecoPad_.behaviors().completeAll();

                this.aleFirecoPad_ = payload.aleFirecoPad;
                initFirecoPadBehaviors(this.aleFirecoPad_);
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

    aleFirecoPad = () => this.aleFirecoPad_;
}
