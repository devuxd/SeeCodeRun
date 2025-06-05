import difference from 'lodash/difference';
import debounce from 'lodash/debounce';

import {monacoProps} from './monacoUtils';
import {
    configureCreateMonacoRange,
    configureMonacoRangeToClassName
} from './scrUtils';

import './LiveExpressionWidgetProvider.css';
import {MonacoExpressionClassNames} from '../themes';

export const jExpressions = [];
const jIgnoreExpressions =
    ["Printable", "SourceLocation", "Node", "Comment", "Position", "File", /*"Program", "Statement", "Function",*/
        "Pattern", "Expression", "Statement", "Declaration"];
let j = null;

// console.log(jExpressions.reduce((acc='', cur)=>`${acc}\n${cur}`));


class LiveExpressionWidgetProvider {
    constructor(monaco, jRef, monacoEditor, editorId, defaultExpressionClassName, throttleTime = 500) {
        this.monaco = monaco;
        j = jRef;

        if (!jExpressions.length) {
            for (const k in j) {
                const expressionName = j[k].name;
                if (k && `${k[0]}` === `${k[0]}`.toUpperCase() && !jIgnoreExpressions.includes(expressionName)) {
                    jExpressions.push(expressionName);
                }
            }
        }

        this.contentWidgetPositionPreference =
            [this.monaco.editor.ContentWidgetPositionPreference.BELOW];
        const a = async () => {
            const {configureLoc2Range} = await import ('monaco-jsx-highlighter');
            console.log("YOLLLLLLLL");
            this.locToMonacoRange = configureLoc2Range(this.monaco);
        };
        a();
        this.createMonacoRange = configureCreateMonacoRange(this.monaco);
        this.monacoRangeToClassName = configureMonacoRangeToClassName(`${editorId}-r`);
        this.editorId = editorId;
        this.monacoEditor = monacoEditor;
        this.defaultExpressionClassName =
            MonacoExpressionClassNames.defaultExpressionClassName;
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

    count = 0;

    widgetize({ast}) {
        console.log("here");
        let hasDecoratorIdsChanged = true;
        let success = true;
        try {
            if (ast) {
                const prevDecoratorIds = this.jExpressionDecoratorIds || [];
                const prevContentWidgets = this.contentWidgets || {};

                if (this.decorators) {
                    if (this.count++ > 3) {
                        const res = this.monacoEditor
                            .getModel()
                            .getAllDecorations()
                            .filter(dec => dec.options.inlineClassName && dec.options.inlineClassName.includes(this.defaultExpressionClassName))
                            .map(dec => dec.id);
                        this.monacoEditor.deltaDecorations(res, []);
                    }

                }


                this.decorators = this.createExpressionDecorators(ast);
                this.jExpressionDecoratorIds =
                    this.monacoEditor.deltaDecorations(
                        prevDecoratorIds, this.decorators
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
                        this.configureLiveExpressionContentWidget(id);
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
                return decorator.expressionType === expressionType &&
                    this.monaco.Range.equalsRange(decorator.range, locRange);
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
                            className: `${className}`,// ${expressionType}`,
                            inlineClassName: `${this.defaultExpressionClassName}`,// ${expressionType}`,
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
        const deco = (this.decorators || [])
            .filter(decorator =>
                (decorator.range.startLineNumber === lineNumber || decorator.range.endLineNumber === lineNumber))
            .sort((decoratorA, decoratorB) => {
                let diff = decoratorA.range.startColumn - decoratorB.range.startColumn;
                diff = diff === 0 ? decoratorB.range.endLineNumber - decoratorA.range.endLineNumber : diff;
                diff = diff === 0 ? decoratorB.range.endColumn - decoratorA.range.endColumn : diff;
                return diff;
            })
        const rdeco = this.monacoEditor.getDecoratorsInLineNumber(lineNumber);

        console.log(lineNumber, deco, rdeco);
        return deco;
    };

    raiseBranchWidget = (domNode, onWidthAdjust) => {
        if (!domNode) {
            return;
        }
        domNode.style.maxWidth = '100% !important';//'100% !important';
        domNode.style.width = '100% !important';//'100% !important';
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
            && !decorator.expressionType.startsWith('Program')
        );

    getLineNumberExpressions = (lineNumber) => {
        if (!this.livenumberExpressions[lineNumber]) {
            const AllLineNumberDecorators = this.getDecoratorsInLineNumber(lineNumber);
            const lineNumberDecorators = [];
            let current = null;
            AllLineNumberDecorators.forEach(decorator => {
                if (lineNumber === 1) {
                    //     console.log('LE', current && current.type, decorator.expressionType,);
                }

                switch (decorator.expressionType) {
                    case 'BinaryExpression':
                        decorator.contentWidget.domNode.style.height = '0px';
                        return;
                    // break;
                    case 'ReturnStatement':
                        decorator.contentWidget.domNode.style.height = '0px';
                        return;
                    // decorator.contentWidget.domNode.style.marginLeft = '-40px';
                    // decorator.contentWidget.domNode.style.backgroundColor = 'red';
                    // break;

                    default:
                    // decorator.contentWidget.domNode.style.maxWidth = '0px';
                }

                if (current) {
                    //LiveExpressionWidgetProvider.containsDecorator(lineNumberDecorators, decorator))
                    if (current.range.containsRange(decorator.range)) {
                        if (!this.branchNavigatorIds[decorator.id] && decorator.contentWidget.domNode) {
                            if (!['BinaryExpression', 'ReturnStatement', 'Identifier']
                                .includes(current.expressionType)) {
                                // decorator.contentWidget.domNode.style.maxWidth = '0px';
                            }

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
            //    console.log(lineNumber, this.livenumberExpressions[lineNumber]);
        }
        return this.livenumberExpressions[lineNumber];
    };

    getVisibleTopLeftMostEl(nodeList) {
        if (nodeList) {
            let topLeftMost = null;
            nodeList.forEach(el => {
                if ((el.offsetParent === null)) {
                    // !(el.offsetWidth > 0 && el.offsetHeight > 0)
                    return;
                }
                if (topLeftMost) {
                    const elTop = el.getBoundingClientRect().top;
                    const tlmTop = topLeftMost.getBoundingClientRect().top;
                    const elLeft = el.getBoundingClientRect().left;
                    const tlmLeft = topLeftMost.getBoundingClientRect().left;

                    if (elTop < tlmTop) {
                        topLeftMost = el;
                    } else {
                        if (elTop === tlmTop && elLeft <= tlmLeft) {
                            topLeftMost = el;
                        }
                    }
                } else {
                    topLeftMost = el;
                }
            });
            return topLeftMost;
        }
        return null;
    }

    getWidgetAvailableWidth = (decoratorId, ignoreVisible, isBranchNavigator) => {
        const sourceDecorator = this.getDecorator(decoratorId);
        if (!sourceDecorator) {
            return;
        }

        // if (isBranchNavigator) {
        //     // this.branchNavigatorIds[decoratorId] = {raised: false};
        //     // if (sourceDecorator.contentWidget) {
        //     //     this.raiseBranchWidget(
        //     //         sourceDecorator.contentWidget.domNode,
        //     //         sourceDecorator.contentWidget.onWidthAdjust
        //     //     );
        //     //     this.branchNavigatorIds[decoratorId].raised = true;
        //     // }
        //     return;
        // }

        const lineNumber = sourceDecorator.range.startLineNumber;
        const {lineNumberDecorators} = this.getLineNumberExpressions(lineNumber);

        // let prev = null;
        // const domys = [];
        lineNumberDecorators.forEach((decorator, i) => {
            if (decorator.contentWidget) {
                const domNode = decorator.contentWidget.domNode;
                const el = this.getVisibleTopLeftMostEl(document.querySelectorAll(decorator.selector));
                console.log("lineNumberDecorators", {decorator, domNode, el});
                //  if (decorator.expressionType === 'CallExpression'
                //     || decorator.expressionType === 'MemberExpression'
                //     || decorator.expressionType === 'ReturnStatement'
                //     || decorator.expressionType === 'AssignmentExpression') {
                //     console.log("lineNumberDecorators", {decorator, domNode, el});
                // }
                //   domys.push({expressionType: decorator.expressionType, domNode, el});
                if (!domNode || !el) {
                    return;
                }
                domNode.style.zIndex = 1200 - i;

                if (lineNumberDecorators.length === i + 1) {
                    domNode.style.maxWidth = '100%';
                    return;
                }


                let width = el.style.width;
                if (width !== '0px') {
                    // if (decorator.expressionType === 'CallExpression'
                    //     || decorator.expressionType === 'MemberExpression'
                    //     || decorator.expressionType === 'ReturnStatement'
                    //     || decorator.expressionType === 'AssignmentExpression') {
                    //     width = '0px';
                    // }
                    domNode.style.maxWidth = width;

                }
                // lineNumber === 11 && console.log('W', el.style.width, domNode.style.maxWidth, domNode, el, document.querySelectorAll(decorator.selector));
                //
                // prev = {expressionType: decorator.expressionType, domNode, el};

            }

        });
        //  lineNumber === 11 && console.log('L', lineNumberDecorators, domys);
        // if (lineNumber === 1) {
        //     //   console.log('ld', lineNumberDecorators);
        // }
        // const lineNumberScheduler = this.getlineNumberScheduler(lineNumber);
        // const updates = [];
        // lineNumberDecorators.reverse().forEach((decorator, i) => {
        //     if (!AutoLogShift.supportedLiveExpressions.includes(decorator.expressionType)) {
        //         if (decorator.contentWidget && !ignoreVisible && !this.branchNavigatorIds[decorator.id]) {
        //             const domNode = decorator.contentWidget.domNode;
        //             const onWidthAdjust = decorator.contentWidget.onWidthAdjust;
        //             if (!domNode) {
        //                 return;
        //             }
        //           //  domNode.style.maxWidth = '0px !important';
        //             onWidthAdjust && onWidthAdjust(domNode.style.width);
        //         }
        //         return;
        //     }
        //
        //
        //     // const i = lineNumberDecorators.indexOf(decorator);
        //     let hideSib = false; //todo make siblings an array, and children as well
        //     let rightSibling = (i <= 0 || i >= lineNumberDecorators.length) ? null : lineNumberDecorators[i + 1];
        //     rightSibling =
        //         (rightSibling && AutoLogShift.supportedLiveExpressions.includes(rightSibling.expressionType)) ?
        //         rightSibling : null;
        //     this.siblings[decorator.id] = this.siblings[decorator.id] || rightSibling;
        //     rightSibling = this.siblings[decorator.id];
        //
        //     // if (rightSibling && decorator.range.containsRange(rightSibling.range)) {
        //     //     hideSib = true;
        //     // }
        //
        //     if (this.branchNavigatorIds[decorator.id] || (rightSibling && this.branchNavigatorIds[rightSibling.id])) {
        //         const dec = this.branchNavigatorIds[decorator.id] ? decorator : rightSibling;
        //         if (dec.contentWidget && !this.branchNavigatorIds[dec.id].raised) {
        //             this.raiseBranchWidget(
        //                 dec.contentWidget.domNode,
        //                 dec.contentWidget.onWidthAdjust
        //             );
        //             this.branchNavigatorIds[dec.id].raised = true;
        //         }
        //         return;
        //     }
        //
        //     updates.push(() => {
        //         if (!decorator.contentWidget) {
        //             return;
        //         }
        //         let marginLeft = '0px';
        //         const domNode = decorator.contentWidget.domNode;
        //         const onWidthAdjust = decorator.contentWidget.onWidthAdjust;
        //         if (!domNode) {
        //             return;
        //         }
        //         const el = document.querySelector(decorator.selector);
        //         if (!el) {
        //             return;
        //         }
        //         let width = el.style.width;
        //         let changeMargin = false;
        //         if (decorator.expressionType === 'CallExpression'
        //             || decorator.expressionType === 'MemberExpression'
        //             || decorator.expressionType === 'ReturnStatement') {
        //         } else {
        //             changeMargin = true;
        //             const lr = (width).replace('px', '');
        //             const wl = parseInt(lr, 10);
        //             marginLeft = `${wl / 2}px`;
        //         }
        //         if (rightSibling) {
        //             const sel = document.querySelector(rightSibling.selector);
        //             if (sel) {
        //                 if (hideSib) {
        //                     sel.style.maxWidth = '0px';
        //                 } else {
        //                     const ll = (el.style.left || '0').replace('px', '');
        //                     const lr = (sel.style.left || width).replace('px', '');
        //                     const wl = parseInt(lr, 10) - parseInt(ll, 10);
        //                     marginLeft = `${wl / 2}px`;
        //                     width = `${Math.abs(wl)}px`;
        //                 }
        //             } else {
        //                 width = '100%';
        //             }
        //         } else {
        //             width = '100%';
        //         }
        //         // console.log('w', width);
        //         // domNode.style.width = width;
        //         domNode.style.maxWidth = width;
        //         //    changeMargin && (domNode.style.marginLeft = marginLeft);
        //         onWidthAdjust && onWidthAdjust(domNode.style.width);
        //     });
        // });
        //
        // lineNumberScheduler(() => updates.forEach(update => update()));
        // console.log(decorator.range.startLineNumber, i, decorator, rightSibling);
    };

    _strategies = {
        availableWidth: this.getWidgetAvailableWidth,
        currentDecorator: this.getDecorator,
        monacoPropsToNode: this.getMonacoProps,
        widgetPositionPreference: this.widgetPositionPreference
    };

    get strategies_() {
        return this._strategies;
    }

    getMonacoProps = (node, firstRender = false) => {
        if (!firstRender) {
            return;
        }

        node.style.overflow = 'hidden';
        node.style.whiteSpace = 'nowrap';
        node.style.marginTop = `-${monacoProps.widgetOffsetHeight}px`;
        node.style.height = `${monacoProps.widgetMaxHeight}px`;
        node.style.maxHeight = `${monacoProps.widgetMaxHeight}px`;
        node.style.backgroundColor = monacoProps.widgetBackgroundColor;
        node.style.fontSize = `${monacoProps.widgetFontSize}px`;
        node.style.maxWidth = `0px`;
    };

    widgetPositionPreference = () => {
        return this.contentWidgetPositionPreference;
    }

    configureLiveExpressionContentWidget(decoratorId) {
        //const getDecorators = this.getDecorators;
        console.log("configureLiveExpressionContentWidget", decoratorId);
        return new LiveExpressionWidget(decoratorId, this.strategies_);
    }
}

class LiveExpressionWidget {
    constructor(decoratorId, strategies_) {
        this.decoratorId = decoratorId;
        this.allowEditorOverflow = true;
        this.suppressMouseDown = true;
        this.domNode = null;
        this.strategies_ = strategies_; // Object containing getWidthStrategy and getDecoratorStrategy
    }

    getId() {
        return this.decoratorId;
    }

    adjustWidth(ignoreVisible, isBranchNavigator) {
        if (typeof this.strategies_.availableWidth === 'function') {
            this.strategies_.availableWidth(this.decoratorId, ignoreVisible, isBranchNavigator);
        } else {
            console.error("availableWidth is not a function");
        }
    }

    getDomNode() {
        const firstRender = !!this.domNode;
        this.domNode ??= document.createElement('div');
        this.strategies_.monacoPropsToNode(this.domNode, firstRender);
        this.adjustWidth(false, false);
        return this.domNode;
    }

    getPosition() {
        if (typeof this.strategies_.currentDecorator === 'function') {
            const decorator = this.strategies_.currentDecorator(this.decoratorId);
            if (!decorator) {
                console.error("decorator not found");
                return null;
            }
            return {
                position: decorator.range.getStartPosition(),
                preference: this.strategies_.widgetPositionPreference()
            };
        } else {
            console.error("currentDecorator is not a function");
            return null;
        }
    }
}


export default LiveExpressionWidgetProvider;
