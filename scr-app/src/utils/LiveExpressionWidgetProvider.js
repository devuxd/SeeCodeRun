import difference from 'lodash/difference';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {monacoProps} from "./monacoUtils";
import {configureLocToMonacoRange, configureMonacoRangeToClassName} from "./scrUtils";

import AutoLogShift from '../seecoderun/modules/AutoLogShift';


export const jExpressions = [];
const jIgnoreExpressions =
    ["Printable", "SourceLocation", "Node", "Comment", "Position", "File", /*"Program", "Statement", "Function",*/
        "Pattern", "Expression", "Statement", "Declaration"];
let j = null;

// console.log(jExpressions.reduce((acc='', cur)=>`${acc}\n${cur}`));


class LiveExpressionWidgetProvider {
    constructor(monaco, jRef, editorId, monacoEditor, defaultExpressionClassName, throttleTime = 50) {
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
    }

    getLineNumberSubject(lineNumber) {
        if (!this.lineNumbersWitdhUpdates[lineNumber]) {
            this.lineNumbersWitdhUpdates[lineNumber] = new Subject();
            this.lineNumbersWitdhUpdates[lineNumber]
                .throttle(() => Observable.interval(this.throttleTime), {leading: true, trailing: false})
                .debounceTime(100)
                .subscribe(update => update());

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
                return decoratorA.range.startColumn - decoratorB.range.startColumn;
            });
    };

    getWidgetAvailableWidth = (decoratorId, ignoreVisible, isBranchNavigator) => {
        const sourceDecorator = this.getDecorator(decoratorId);
        if (!sourceDecorator) {
            return;
        }
        if (isBranchNavigator) {
            if (sourceDecorator.contentWidget && !ignoreVisible) {
                const domNode = sourceDecorator.contentWidget.domNode;
                const onWidthAdjust = sourceDecorator.contentWidget.onWidthAdjust;
                if (!domNode) {
                    return;
                }
                domNode.style.maxWidth = '100%';
                domNode.style.zIndex = '1000';
                onWidthAdjust && onWidthAdjust(domNode.style.width);
            }
            return;
        }
        const lineNumber = sourceDecorator.range.startLineNumber;
        const lineNumberDecorators = this.getDecoratorsInLineNumber(lineNumber);
        const lineNumberSubject = this.getLineNumberSubject(lineNumber);
        const updates = [];
        lineNumberDecorators.forEach((decorator) => {
            if (!AutoLogShift.supportedLiveExpressions.includes(decorator.expressionType)) {
                // setTimeout(() => {
                if (decorator.contentWidget && !ignoreVisible) {
                    const domNode = decorator.contentWidget.domNode;
                    const onWidthAdjust = decorator.contentWidget.onWidthAdjust;
                    if (!domNode) {
                        return;
                    }
                    domNode.style.maxWidth = '0px';
                    onWidthAdjust && onWidthAdjust(domNode.style.width);
                }

                //}, 0);
                return;
            }


            const i = lineNumberDecorators.indexOf(decorator);
            let hideSib = false;
            let rightSibling = (i <= 0 || i >= lineNumberDecorators.length) ? null : lineNumberDecorators[i + 1];
            rightSibling = (rightSibling && AutoLogShift.supportedLiveExpressions.includes(rightSibling.expressionType)) ?
                rightSibling : null;
            if (rightSibling && rightSibling.range.equalsRange(decorator.range)) {
                hideSib = true;
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
                        }
                        const ll = (el.style.left || '0').replace('px', '');
                        const lr = (sel.style.left || width).replace('px', '');
                        width = `${parseInt(lr, 10) - parseInt(ll, 10)}px`;
                    }
                }
                // console.log('w', width);
                domNode.style.maxWidth = width;
                onWidthAdjust && onWidthAdjust(domNode.style.width);
            });
        });

        lineNumberSubject.next(() => updates.forEach(update => update()));
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
