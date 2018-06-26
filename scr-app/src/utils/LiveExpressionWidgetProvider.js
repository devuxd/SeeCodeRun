import difference from 'lodash/difference';
import debounce from 'lodash.debounce';
// import {Subject} from 'rxjs/Subject';
// import {Observable} from 'rxjs/Observable';
import {monacoProps} from "./monacoUtils";
import {configureLocToMonacoRange, configureMonacoRangeToClassName} from "./scrUtils";

import AutoLogShift from '../seecoderun/modules/AutoLogShift';
import LiveExpressionStore from "../containers/LiveExpressionStore";


export const jExpressions = [];
const jIgnoreExpressions =
    ["Printable", "SourceLocation", "Node", "Comment", "Position", "File", /*"Program", "Statement", "Function",*/
        "Pattern", "Expression", "Statement", "Declaration"];
let j = null;

// console.log(jExpressions.reduce((acc='', cur)=>`${acc}\n${cur}`));


class LiveExpressionWidgetProvider {
    constructor(monaco, jRef, editorId, monacoEditor, defaultExpressionClassName, throttleTime = 500) {
        this.monaco = monaco;
        j = jRef;

        if (!jExpressions.length) {
            for (const k in j) {
                const expressionName = j[k].name;
                if (k && `${k[0]}` === `${k[0]}`.toUpperCase() && !jIgnoreExpressions.includes(expressionName)) {
                    jExpressions.push(expressionName);
                }// else{console.log("FU",  j[k].name);}
            }
        }

        this.contentWidgetPositionPreference =
            [this.monaco.editor.ContentWidgetPositionPreference.BELOW];
        this.locToMonacoRange = configureLocToMonacoRange(this.monaco);
        this.monacoRangeToClassName = configureMonacoRangeToClassName(`${editorId}-r`);
        this.editorId = editorId;
        this.monacoEditor = monacoEditor;
        this.defaultExpressionClassName = defaultExpressionClassName;
        this.decorators = [];
        this.contentWidgets = {};
        this.lineNumbersWitdhUpdates = {};
        this.throttleTime = throttleTime;
        this.branchNavigatorIds = {};
        this.siblings = {};
        this.livenumberExpressions = {};
    }

    getlineNumberScheduler(lineNumber) {
        if (!this.lineNumbersWitdhUpdates[lineNumber]) {
            this.lineNumbersWitdhUpdates[lineNumber] =
                debounce(update => update(),
                    this.throttleTime,
                    {maxWait: this.throttleTime * 3, leading: true, trailing: false}
                );
            // this.lineNumbersWitdhUpdates[lineNumber] = new Subject();
            // this.lineNumbersWitdhUpdates[lineNumber]
            //     .throttleTime(this.throttleTime)
            //     // .throttle(() => Observable.interval(this.throttleTime), {leading: true, trailing: false})
            //     // .debounceTime(100)
            //     .subscribe(update => update());

        }
        return this.lineNumbersWitdhUpdates[lineNumber];
    }

    afterWidgetize(callback) {
        if (callback && this.decorators.length) {
            callback({
                decorators: this.decorators,
                hasDecoratorIdsChanged: true,
                getLocationId: this.configureGetLocationId(),
            });
        }
        this.afterWidgetizeCallback = callback;
    }

    beforeRender() {
        for (const id in this.contentWidgets) {
            const contentWidget = this.contentWidgets[id];
            contentWidget.domNode.style.display = 'none';
        }
    }

    colorizeElement(domNode) {
        this.monaco.editor.colorizeElement(domNode);
    }

    afterRender(ignoreDisplayChange, ignoreDisplayBlock) {
        for (const id in this.contentWidgets) {
            const contentWidget = this.contentWidgets[id];
            !ignoreDisplayChange && this.monacoEditor.layoutContentWidget(contentWidget);
            setTimeout(() => {
                !ignoreDisplayBlock && contentWidget.domNode && (contentWidget.domNode.style.display = 'block');
            }, 50);
        }
    }

    widgetize({ast}) {
        let hasDecoratorIdsChanged = true;
        let success = true;
        try {
            if (ast) {
                const prevDecoratorIds = this.jExpressionDecoratorIds || [];
                const prevContentWidgets = this.contentWidgets || {};

                this.decorators = this.createExpressionDecorators(ast);
                this.jExpressionDecoratorIds = this.monacoEditor
                    .deltaDecorations(prevDecoratorIds, this.decorators
                    );

                let id2i = {};
                this.jExpressionDecoratorIds.forEach((id, i) => {
                    this.decorators[i].id = id;
                    id2i[id] = i;
                });

                const deltaRemove = difference(prevDecoratorIds, this.jExpressionDecoratorIds);
                const deltaAdd = difference(this.jExpressionDecoratorIds, prevDecoratorIds);

                hasDecoratorIdsChanged = deltaRemove.length + deltaAdd.length > 0;
                this.contentWidgets = {...prevContentWidgets};
                for (const i in deltaRemove) {
                    const id = deltaRemove[i];
                    this.contentWidgets[id] && this.monacoEditor.removeContentWidget(this.contentWidgets[id]);
                    delete this.contentWidgets[id];
                }

                for (const i in deltaAdd) {
                    const id = deltaAdd[i];
                    const decorator = this.decorators[id2i[id]];
                    decorator.contentWidget =
                        this.configureLiveExpressionContentWidget(id, this.contentWidgetPositionPreference);
                    this.contentWidgets[id] = decorator.contentWidget;
                    this.monacoEditor.addContentWidget(decorator.contentWidget);
                }

                for (const i in this.decorators) {
                    const decorator = this.decorators[i];
                    if (!decorator.contentWidget) {
                        const contentWidget = this.contentWidgets[decorator.id];
                        if (contentWidget) {
                            decorator.contentWidget = contentWidget;
                        }
                    }
                }
                setTimeout(() => {
                    this.afterRender(false, true);
                }, 0);

            }
        } catch (error) {
            console.log("invalidate", error);
            success = false;
        }
        this.afterRender(true);

        if (success) {
            setTimeout(() => {
                this.afterWidgetizeCallback && this.afterWidgetizeCallback({
                    decorators: this.decorators,
                    hasDecoratorIdsChanged: hasDecoratorIdsChanged,
                    getLocationId: this.configureGetLocationId(),
                });
            }, 0);
        }

    }

    configureGetLocationId = () => {
        return (loc, expressionType) => {
            if (!loc || !expressionType) {
                return null;
            }
            const locRange = this.locToMonacoRange(loc);
            // console.log(loc, expressionType, locRange);
            const matchingDecorator = this.decorators.find(decorator => {
                return decorator.expressionType === expressionType && this.monaco.Range.equalsRange(decorator.range, locRange);
            });
            return matchingDecorator ? matchingDecorator.id : null;
        };
    };

    createExpressionDecorators(ast, decorators = []) {
        jExpressions.forEach(expressionType => {
            ast
                .find(j[expressionType])
                .forEach(p => {
                    if (!p.value.loc) {
                        //  console.log('inv', p.value);
                        return
                    }

                    const range = this.locToMonacoRange(p.value.loc);
                    const className = `${this.monacoRangeToClassName(range)}-${decorators.length}`;
                    decorators.push({
                        id: null, //set later, as well as others
                        selector: `.${className}`,
                        expressionType: expressionType,
                        range: range,
                        options: {
                            className: `${className} ${expressionType}`,
                            inlineClassName: `${this.defaultExpressionClassName} ${expressionType}`,
                            // hoverMessage: expressionType,
                        }
                    });
                });
        });
        this.branchNavigatorIds = {};
        this.siblings = {};
        this.livenumberExpressions = {};
        return decorators;
    }

    getDecorator = (decoratorId) => {
        return (this.decorators || []).find(decorator => decorator.id === decoratorId);
    };

    getDecorators = () => {
        return (this.decorators || []);
    };

    getDecoratorsInLineNumber = (lineNumber) => {
        return (this.decorators || [])
            .filter(decorator => decorator.range.startLineNumber === lineNumber)
            .sort((decoratorA, decoratorB) => {
                let diff = decoratorA.range.startColumn - decoratorB.range.startColumn;
                diff = diff === 0 ? decoratorB.range.endLineNumber - decoratorA.range.endLineNumber : diff;
                diff = diff === 0 ? decoratorB.range.endColumn - decoratorA.range.endColumn : diff;
                return diff;
            });
    };

    raiseBranchWidget = (domNode, onWidthAdjust) => {
        if (!domNode) {
            return;
        }
        domNode.style.maxWidth = '100% !important';
        domNode.style.width = '100% !important';
        domNode.style.zIndex = '1000';
        onWidthAdjust && onWidthAdjust(domNode.style.width);
    };

    static containsDecorator = (decorators, decorator) => {
        return decorators.find(current => current.range.containsRange(decorator.range));
    };

    static isValidLiveDecorator = (decorator) =>
        (!decorator.expressionType.endsWith('rty')
            && !decorator.expressionType.endsWith('tement')
            && !decorator.expressionType.startsWith('Sequence')
            // && !decorator.expressionType.startsWith('Variable')
            && !decorator.expressionType.startsWith('Variable')
            && !decorator.expressionType.startsWith('JSX')
            && !decorator.expressionType.startsWith('Arrow')
        );

    getLineNumberExpressions = (lineNumber) => {
        if (!this.livenumberExpressions[lineNumber]) {
            const AllLineNumberDecorators = this.getDecoratorsInLineNumber(lineNumber);
            const lineNumberDecorators = [];
            let current = null;
            AllLineNumberDecorators.forEach(decorator => {
                if (current) {
                    //LiveExpressionWidgetProvider.containsDecorator(lineNumberDecorators, decorator))
                    if (current.range.containsRange(decorator.range)) {
                        if (!this.branchNavigatorIds[decorator.id] && decorator.contentWidget.domNode) {
                            decorator.contentWidget.domNode.style.maxWidth = '0px';
                        }
                    } else {
                        current = null;
                    }
                }

                if (!current && LiveExpressionWidgetProvider.isValidLiveDecorator(decorator)) {
                    current = decorator;
                    lineNumberDecorators.push(current);
                }
            });
            this.livenumberExpressions[lineNumber] = {
                lineNumberDecorators,
                AllLineNumberDecorators
            };
        }
        if (lineNumber === 92) {
            console.log(lineNumber, this.livenumberExpressions[lineNumber]);
        }
        return this.livenumberExpressions[lineNumber];
    };

    getWidgetAvailableWidth = (decoratorId, ignoreVisible, isBranchNavigator) => {
        const sourceDecorator = this.getDecorator(decoratorId);
        if (!sourceDecorator) {
            return;
        }

        if (isBranchNavigator) {
            this.branchNavigatorIds[decoratorId] = {raised: false};
            if (sourceDecorator.contentWidget) {
                this.raiseBranchWidget(
                    sourceDecorator.contentWidget.domNode,
                    sourceDecorator.contentWidget.onWidthAdjust
                );
                this.branchNavigatorIds[decoratorId].raised = true;
            }
            return;
        }

        const lineNumber = sourceDecorator.range.startLineNumber;
        const {lineNumberDecorators} = this.getLineNumberExpressions(lineNumber);
        const lineNumberScheduler = this.getlineNumberScheduler(lineNumber);
        const updates = [];
        lineNumberDecorators.forEach((decorator, i) => {
            if (!AutoLogShift.supportedLiveExpressions.includes(decorator.expressionType)) {
                if (decorator.contentWidget && !ignoreVisible && !this.branchNavigatorIds[decorator.id]) {
                    const domNode = decorator.contentWidget.domNode;
                    const onWidthAdjust = decorator.contentWidget.onWidthAdjust;
                    if (!domNode) {
                        return;
                    }
                    domNode.style.maxWidth = '0px';
                    onWidthAdjust && onWidthAdjust(domNode.style.width);
                }
                return;
            }


            // const i = lineNumberDecorators.indexOf(decorator);
            let hideSib = false; //todo make siblings an array, and children as well
            let rightSibling = (i <= 0 || i >= lineNumberDecorators.length) ? null : lineNumberDecorators[i + 1];
            rightSibling = (rightSibling && AutoLogShift.supportedLiveExpressions.includes(rightSibling.expressionType)) ?
                rightSibling : null;
            this.siblings[decorator.id] = this.siblings[decorator.id] || rightSibling;
            rightSibling = this.siblings[decorator.id];

            // if (rightSibling && decorator.range.containsRange(rightSibling.range)) {
            //     hideSib = true;
            // }

            if (this.branchNavigatorIds[decorator.id] || (rightSibling && this.branchNavigatorIds[rightSibling.id])) {
                const dec = this.branchNavigatorIds[decorator.id] ? decorator : rightSibling;
                if (dec.contentWidget && !this.branchNavigatorIds[dec.id].raised) {
                    this.raiseBranchWidget(
                        dec.contentWidget.domNode,
                        dec.contentWidget.onWidthAdjust
                    );
                    this.branchNavigatorIds[dec.id].raised = true;
                }
                return;
            }

            updates.push(() => {
                if (!decorator.contentWidget) {
                    return;
                }
                const domNode = decorator.contentWidget.domNode;
                const onWidthAdjust = decorator.contentWidget.onWidthAdjust;
                if (!domNode) {
                    return;
                }
                const el = document.querySelector(decorator.selector);
                if (!el) {
                    return;
                }
                let width = el.style.width;
                if (rightSibling) {
                    const sel = document.querySelector(rightSibling.selector);
                    if (sel) {
                        if (hideSib) {
                            sel.style.maxWidth = '0px';
                        } else {
                            const ll = (el.style.left || '0').replace('px', '');
                            const lr = (sel.style.left || width).replace('px', '');
                            width = `${parseInt(lr, 10) - parseInt(ll, 10)}px`;
                        }
                    } else {
                        width = '100%';
                    }
                } else {
                    width = '100%';
                }
                // console.log('w', width);
                // domNode.style.width = width;
                domNode.style.maxWidth = width;
                onWidthAdjust && onWidthAdjust(domNode.style.width);
            });
        });

        lineNumberScheduler(() => updates.forEach(update => update()));
        // console.log(decorator.range.startLineNumber, i, decorator, rightSibling);
    };

    configureLiveExpressionContentWidget(decoratorId, preference) {
        //const getDecorators = this.getDecorators;
        const getDecorator = this.getDecorator;
        const getWidgetAvailableWidth = this.getWidgetAvailableWidth;
        return {
            allowEditorOverflow: true,
            suppressMouseDown: true,
            selector: null,
            domNode: null,
            onWidthAdjust: null,
            getId: function () {
                return decoratorId;
            },
            adjustWidth: function (ignoreVisible, isBranchNavigator) {
                getWidgetAvailableWidth(decoratorId, ignoreVisible, isBranchNavigator);
            },
            getDomNode: function () {
                if (this.domNode) {
                    // this.adjustWidth(false);
                    return this.domNode;
                }
                this.domNode = document.createElement('div');
                this.domNode.style.overflow = 'hidden';
                this.domNode.style.whiteSpace = 'nowrap';
                this.domNode.style.marginTop = `-${monacoProps.widgetOffsetHeight}px`;
                this.domNode.style.height = `${monacoProps.widgetMaxHeight}px`;
                this.domNode.style.maxHeight = `${monacoProps.widgetMaxHeight}px`;
                this.domNode.style.backgroundColor = monacoProps.widgetBackgroundColor;
                this.domNode.style.fontSize = `${monacoProps.widgetFontSize}px`;
                this.domNode.style.maxWidth = `0px`;
                return this.domNode;
            },
            getPosition: function () {
                // this.adjustWidth(false);
                return {
                    position: getDecorator(decoratorId).range.getStartPosition(),
                    preference: preference,
                }
            },
        };
    }
}

export default LiveExpressionWidgetProvider;
