import {produce} from "immer";
import {instanceOf} from "prop-types";
import {defaultSimpleMonacoOptions, monacoEditorDefaultOptions} from "../../../utils/monacoUtils";
import {MonacoOptions} from "../ALE";
import {MonacoExpressionClassNames} from "../../../themes";
// export default function connectRequireToALE(scrObject, globalScrObjectString, onErrorDelay = 1000) { // connect ALE and browser
//    scrObject.require = {
//       scriptString:
//          `<script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js" integrity="sha512-c3Nl8+7g4LMSTdrm621y7kf9v3SDPnhxLNhcjFJbKECVnmZHTdo+IRO05sNLTH/D3vA6u1X32ehoLC7WFVdheg==" crossorigin="anonymous"></script>`,
//       fallbackOverrides: {},
//       onErrorTid: null,
//       errors: [],
//       onError: (err) => {
//          scrObject.require.errors.push(err);
//          clearTimeout(scrObject.require.onErrorTid);
//          scrObject.require.onErrorTid = setTimeout(() => {
//                scrObject.require.onRequireSyncLoaded(scrObject.require.errors, scrObject.require.fallbackOverrides);
//             },
//             onErrorDelay
//          )
//       },
//       requirejsLoad: (...params) => console.warn('requirejs.load is not set.', ...params),
//       aleRequirejsLoad: (context, moduleName, url) => {
//          scrObject.require.fallbackOverrides[moduleName] = url;
//          return scrObject.require.requirejsLoad(context, moduleName, url);
//       },
//       bindingCode: `
//       requirejs.onError = ${globalScrObjectString}.require.onError;
//       ${globalScrObjectString}.require.requirejsLoad = requirejs.load;
//       requirejs.load =${globalScrObjectString}.require.aleRequirejsLoad;
//       // Ensure Mock
//       var proto = Object.getPrototypeOf(requirejs);
//       Object.defineProperties(proto, {
//          ensure: {
//             writable: false,
//             value: function ensure (sources, cb) {
//                return cb(requirejs);
//             }
//          }
//       });`,
//    };
//
//    return scrObject.require;
//
// }


class AbstractionType {
    static GENERAL = "GENERAL";
}

class AbstractionLevel {
    id;
    type;
    domains;
    generalLevels;
    specificLevels;
    idiomaticLevels;
    idiosyncraticLevels;
}

class ReferenceFrame {
    abstractionLevelMap;
    macroConstraints;
    microLimitations
    abstractionLevelDefineElement;
    abstractionLevelDefineElementState;
    abstractionLevelDefineElementsInteraction;
    emergence
}

class Entity {
    constructor({id, instance}) {
        this.id = id;
        this.instance = instance;
    }
}

class ObjectInCategory {
    constructor(category, object) {
        this.category = category; // Reference to the category
        this.object = object; // The value of the object
        this.identity = new Morphism(this, this, `id_${this.value}`);
    }

    identityMorphism() {
        return this.identity;
    }
}

class Morphism {
    constructor(source, target, name) {
        this.source = source;
        this.target = target;
        this.name = name;
    }
}

class Functor {
    constructor(sourceCategory, targetCategory, morphismMap) {
        this.sourceCategory = sourceCategory;
        this.targetCategory = targetCategory;
        this.morphismMap = morphismMap;
    }

    applyToObject(object) {
        if (object.category === this.sourceCategory) {
            return this.morphismMap.get(object) || object.identityMorphism();
        } else {
            console.log(`Object does not belong to the source category.`);
            return null;
        }
    }
}

class Category {
    constructor() {
        this.objects = new Set();
        this.morphisms = new Set();
        this.functors = new Set();
    }

    addObject(object) {
        object.category = this; // Set the object's category reference
        this.objects.add(object);
    }

    addMorphism(morphism) {
        if (
            this.objects.has(morphism.source) &&
            this.objects.has(morphism.target)
        ) {
            this.morphisms.add(morphism);
        } else {
            console.log(
                `Morphism ${morphism.name} cannot be added due to invalid source or target.`
            );
        }
    }

    composeMorphisms(morphism1, morphism2) {
        if (morphism1.target === morphism2.source) {
            const composedName = `${morphism2.name}_${morphism1.name}`;
            const composedMorphism = new Morphism(
                morphism1.source,
                morphism2.target,
                composedName
            );
            this.addMorphism(composedMorphism);
            return composedMorphism;
        } else {
            console.log(
                `Composition not possible between ${morphism1.name} and ${morphism2.name}.`
            );
            return null;
        }
    }

    addFunctor(functor) {
        this.functors.add(functor);
    }
}

// Usage:

const category1 = new Category();
const category2 = new Category();

const obj1 = new ObjectInCategory(category1, 'Value1');
const obj2 = new ObjectInCategory(category1, 'Value2');
const obj3 = new ObjectInCategory(category2, 'Value3');

category1.addObject(obj1);
category1.addObject(obj2);
category2.addObject(obj3);

const morphism1 = new Morphism(obj1, obj2, 'f');
const morphism2 = new Morphism(obj2, obj1, 'g');

category1.addMorphism(morphism1);
category1.addMorphism(morphism2);

const functor = new Functor(category1, category2, new Map([
    [obj1, morphism2],
    [obj2, morphism1]
]));

category1.addFunctor(functor);

const mappedMorphism1 = functor.applyToObject(obj1);
const mappedMorphism2 = functor.applyToObject(obj2);
//
// console.log(mappedMorphism1); // Output: Morphism { source: ObjectInCategory { category: Category {...}, value: 'Value1' }, target: ObjectInCategory { category: Category {...}, value: 'Value3' }, name: 'g' }
// console.log(mappedMorphism2); // Output: Morphism { source: ObjectInCategory { category: Category {...}, value: 'Value2' }, target: ObjectInCategory { category: Category {...}, value: 'Value2' }, name: 'id_Value2' }


class Model {
    timeline;
}

class ModelChecker {

}

class LogicCheck {
    commandPattern;
    commandAction;

    constructor(commandPattern, commandAction) {
        this.commandPattern = commandPattern;
        this.commandAction = commandAction;
    }

    check(model) {

        // if(){
        //
        // }
    }
}

export const CommentCheckType = {
    s: "SEE",
    c: "CODE",
    r: "RUN",
};

export const CommentCheckAction = {
    IGNORE_LINE: "IGNORE_LINE",
};


export const commentCheckTypeAction = (commentCheckType, command) => {
    switch (commentCheckType) {
        case CommentCheckType.s:
            break;
        case CommentCheckType.c:
            const stripCommand = command.replace(/\s+/, '');
            if (stripCommand === "!line") {
                return CommentCheckAction.IGNORE_LINE;
            }
            break;
        case CommentCheckType.r:
            break;
        default:
    }
}


class CommentCheck {
    comment;
    type;
    id;
    command;

    constructor(comment) {
        this.comment = comment;
    }

    getModel = () => {
        const {comment, type, id, command} = this;
        const afterLineNumber = comment.loc.end.line;
        const loc = {...(comment.loc.end.line ?? {})};
        const commentCheckType = CommentCheckType[type];
        const commentCheckAction = commentCheckTypeAction(commentCheckType, command);
        return {
            loc, commentCheckType, id, afterLineNumber, commentCheckAction
        };
    }

}

export const commentPattern = {
    regex: /^\s*:\s*(([scr])\d+)\s*:\s*(.+)$/gi,
    map: [
        "all", "id", "type", "command"
    ]
};

commentPattern.reify = (commentCheck, m) => {
    const {map} = commentPattern;
    for (let i = 1; i < map.length; i++) {
        const prop = map[i];
        commentCheck[prop] = m[i];
    }
    return commentCheck;
};


export const makeCommentCheck = (commentCheck, str, commentPattern) => {
    const {regex, reify, map} = commentPattern;
    let m;

    while ((m = regex.exec(str)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        if (m.length === map.length) {
            return reify(commentCheck, m);
        }
    }

    return null;
}


class SyntaxCommentModelParser {
    static commentPattern = commentPattern;
    static makeCommentCheck = makeCommentCheck;
    static getCommentCheck = (comment, commentText) => {
        const commentCheck = new CommentCheck(comment);
        return SyntaxCommentModelParser.makeCommentCheck(commentCheck, commentText, SyntaxCommentModelParser.commentPattern);
    }
}


class ComputationalChecker {
    constructor(initialDraft = {}) {
        const states = [];
        states.unshift(
            initialDraft
        );
        const zeroI = 0;
        const identity = () => states[zeroI];
        this.identity = identity;
        this.history = () => [...states];
        this.update = (updateDrafter) => {
            if (updateDrafter) {
                //produce(identity(), updateDrafter)
                let ni = identity();
                if (Array.isArray(ni)) {
                    ni = [...ni];
                } else {
                    ni = {...ni};
                }
                updateDrafter(ni)
                // const ni = {...identity()}
                states.unshift(ni);
            }
            return identity();
        }
    }
}

class CodeCommentChecker {
    constructor() {
        const computationalCheckedComments = new ComputationalChecker({});
        this.onCodeComment = (onCodeCommentCheck) => {
            const codeCommentCheck = onCodeCommentCheck(SyntaxCommentModelParser.getCommentCheck);
            if (codeCommentCheck) {

                const cm = codeCommentCheck.getModel();
                // console.log("codeCommentCheck", cm, codeCommentCheck);
                const {id} = cm;
                const updateDrafter = draft => {
                    if (draft[id]) {
                        draft[id].update(d => d.push(cm));
                    } else {
                        draft[id] = new ComputationalChecker([cm]);
                    }
                };
                computationalCheckedComments.update(updateDrafter);
            }
        };

        this.computationalCheckedComments = () => {
            const ccs = computationalCheckedComments.identity();
            const c = Object.keys(ccs).reduce((r, e) => {
                const v = ccs[e].identity();
                const {codeCommentCheck} = v;
                // console.log("computationalCheckedComments", v, codeCommentCheck);
                r[e] = v;
                return r;
            }, {});
            // console.log("computationalCheckedComments", ccs, c);
            return c;
        };

        let dale = null;
        let commentCheckerEditor = null;
        const es = {};
        // console.log("e", es);
        this.commentChecks = () => {
            const ccs = this.computationalCheckedComments();
            const ids = Object.keys(ccs);
            for (let id of ids) {
                const co = ccs[id];
                const va = co[0];
                let ref = es[id];
                if (!ref) {
                    ref = new Reference({configured: false});
                    es[id] = ref;
                }
                ref.update(va);
            }
            return Object.values(es);
        };

        this.commentChecksByType = (commentCheckType = CommentCheckType.c) => {
            return this.commentChecks().filter(ref => ref.current().commentCheckType === commentCheckType).map(r => r.current());
        };

        this.update = (_dale) => {

            // const {monacoEditor} = _dale ?? {};
            //
            // if (!dale || dale.monacoEditor !== monacoEditor) {
            //     if (dale) {
            //         for (let ref of this.commentChecks()) {
            //             const cu = ref.current();
            //             cu.dispose();
            //             delete es[cu.id];
            //         }
            //     }
            //     dale = _dale;
            // }


            // for (let ref of this.commentChecks()) {
            //     let cu = ref.current();
            //     if (!cu.configured) {
            //         configureCommentCheckerEditor(ref, dale.monacoEditor, dale.monaco);
            //         cu = ref.current();
            //     }
            //     cu.updateViewZone();
            // }
        }
    }
}

const aleCommentGlyphMarginClassName = "ale.commentGlyph";

const configureCommentCheckerEditor = (ref, editor, monaco, active) => {
    const {initialText} = ref.current();
    const {model, ...restOfOptions} = {...monacoEditorDefaultOptions, ...MonacoOptions.liveEditorConstructionOptions};

    const domNode = document.createElement("div");
    // domNode.style.marginTop = `-${restOfOptions.lineHeight}px`;
    domNode.style.zIndex = "10";
    domNode.style.height = "100%";
    // console.log("configureCommentCheckerEditor", restOfOptions, ref, editor, monaco);
    const commentEditor = monaco.editor.create(domNode, {
        ...restOfOptions,
        value: initialText,
        // language: "javascript",
        // automaticLayout: true,
        // minimap: false,
        glyphMargin: true,
        // folding: false,
        lineNumbers: "off",
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 0,
    });


    commentEditor.createDecorationsCollection([
        {
            range: commentEditor.getModel().getFullModelRange(),
            options: {
                isWholeLine: true,
                glyphMarginClassName: MonacoExpressionClassNames.commentGlyphMarginClassName,
            },
        },
    ]);

    let viewState = null;
    // Add a zone to make hit testing more interesting
    let viewZoneId = null;
    const removeZone = () => {
        editor.changeViewZones(accessor => {
            viewZoneId && accessor.removeZone(viewZoneId);
            viewZoneId = null;
            ref.update({viewZoneId});
        });
    };

    let ti = null;
    let _heightInLines = -1, _afterLineNumber = -1;
    const updateViewZone = () => {
        const {heightInLines, afterLineNumber} = ref.current();
        if ((_heightInLines < 0 || _afterLineNumber < 0) || (_heightInLines !== heightInLines || _afterLineNumber !== afterLineNumber)) {
            _heightInLines = heightInLines;
            _afterLineNumber = afterLineNumber;
        } else {
            return;
        }

        removeZone();
        editor.changeViewZones((changeAccessor) => {
            viewZoneId = changeAccessor.addZone({
                afterLineNumber,
                heightInLines,
                domNode,
            });

            ref.update({viewZoneId});

            if (viewState) {
                clearTimeout(ti);
                ti = setTimeout(() => {
                    commentEditor.layout();
                    commentEditor.focus();
                    commentEditor.restoreViewState(viewState);
                }, 0);

            }
        });

    }

    let currentLineCount = 1;
    commentEditor.onDidChangeModelContent(() => {
        const nlc = commentEditor.getModel().getLineCount();
        if (nlc < 1 || currentLineCount === nlc) {
            return;
        }
        viewState = commentEditor.saveViewState();
        currentLineCount = nlc;
        ref.update({heightInLines: currentLineCount});
        updateViewZone();
    });

    let disposed = false;
    const dispose = () => {
        if (disposed) {
            return;
        }
        disposed = true;
        clearTimeout(ti);
        removeZone();
        commentEditor.dispose();
    };

    ref.update({
        configured: true,
        viewZoneId,
        updateViewZone,
        removeZone,
        dispose,
        commentEditor,
        domNode
    }, false);

};

class Reference {
    _current;
    listenerFunc;

    constructor(initialValue = {}, listenerFunc = null,) {
        this.listenerFunc = listenerFunc;
        this._current = initialValue;
    }

    current = () => {
        return this._current;
    }

    update = (props = {}, listenerCall = true) => {
        this._current = {...this.current(), ...props};
        listenerCall && this.listenerFunc?.(this.current());
    };
}

export default function ComputationCheckALE() {
    return new CodeCommentChecker();
}
