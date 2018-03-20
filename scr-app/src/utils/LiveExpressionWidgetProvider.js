import j from "jscodeshift";
import _ from 'lodash';
import './JSXColoringProvider.css';
import {monacoProps} from "./monacoUtils";
import {configureLocToMonacoRange, configureMonacoRangeToClassName} from "./scrUtils";


export const jExpressions = [];
const jIgnoreExpressions =
  ["Printable", "SourceLocation", "Node", "Comment", "Position", "File", /*"Program", "Statement", "Function",*/
    "Pattern", "Expression", "Statement", "Declaration"];
for (const k in j) {
  const expressionName = j[k].name;
  if (k && `${k[0]}` === `${k[0]}`.toUpperCase() && !jIgnoreExpressions.includes(expressionName)) {
    jExpressions.push(expressionName);
  }// else{console.log("FU",  j[k].name);}
}

// console.log(jExpressions);


class LiveExpressionWidgetProvider {
  constructor(monaco, editorId, monacoEditor) {
    this.monaco = monaco;
    this.contentWidgetPositionPreference =
      [this.monaco.editor.ContentWidgetPositionPreference.BELOW];
    this.locToMonacoRange = configureLocToMonacoRange(this.monaco);
    this.monacoRangeToClassName = configureMonacoRangeToClassName(`${editorId}-r`);
    this.editorId = editorId;
    this.monacoEditor = monacoEditor;
    this.decorators = [];
    this.contentWidgets = {};
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


  afterRender(ignoreDisplayChange) {
    for (const id in this.contentWidgets) {
      const contentWidget = this.contentWidgets[id];
      contentWidget.domNode.style.display = 'block';
      !ignoreDisplayChange && this.monacoEditor.layoutContentWidget(contentWidget);
    }
  }

  widgetize(ast) {
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

        const deltaRemove = _.difference(prevDecoratorIds, this.jExpressionDecoratorIds);
        const deltaAdd = _.difference(this.jExpressionDecoratorIds, prevDecoratorIds);

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
            this.configureLiveExpressionContentWidget(decorator, this.contentWidgetPositionPreference);
          this.contentWidgets[id] = decorator.contentWidget;
          this.monacoEditor.addContentWidget(decorator.contentWidget);
        }

        for (const i in this.decorators) {
          const decorator = this.decorators[i];
          if (!decorator.contentWidget) {
            const contentWidget = this.contentWidgets[decorator.id];
            if (contentWidget) {
              decorator.contentWidget = contentWidget;
            } else {
              console.log("[CRITICAL]");
              decorator.contentWidget =
                this.configureLiveExpressionContentWidget(decorator, this.contentWidgetPositionPreference);
              this.contentWidgets[decorator.id] = decorator.contentWidget;
              this.monacoEditor.addContentWidget(decorator.contentWidget);
            }
          }
        }
      }
    } catch (error) {
      console.log("invalidate");
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
          const range = this.locToMonacoRange(p.value.loc);
          const className = `${this.monacoRangeToClassName(range)}-${decorators.length}`;
          decorators.push({
            id: null, //set later, as well as others
            selector: `.${className}`,
            expressionType: expressionType,
            range: range,
            options: {
              className: `${className}`,
              //hoverMessage: expressionType,
            }
          });
        });
    });

    return decorators;
  }

  configureLiveExpressionContentWidget(decorator, preference) {
    return {
      allowEditorOverflow: true,
      suppressMouseDown: true,
      selector: decorator.selector,
      domNode: null,
      getDomNode: function () {
        if (this.domNode) {
          return this.domNode;
          this.domNode.style.display = 'block';
        }
        this.domNode = document.createElement('div');
        this.domNode.style.marginTop = `-${monacoProps.widgetOffsetHeight}px`;
        this.domNode.style.height = `${monacoProps.widgetVerticalHeight}px`;
        this.domNode.style.maxHeight = `${monacoProps.widgetVerticalHeight}px`;
        this.domNode.style.backgroundColor = monacoProps.widgetBackgroundColor;
        // decorator.domNode.style.backgroundColor = 'green'; //this.domNode.style.width = '50px';
        this.adjustWidth = () => {
          setTimeout(() => {
            const el = document.querySelector(this.selector);
            if (!el || !this.domNode) {
              return;
            }
            this.domNode.style.width = el.style.width;
          }, 0);
        };
        this.adjustWidth();
        return this.domNode;
      },
      getId: () => decorator.id,
      getPosition: function () {
        this.adjustWidth && this.adjustWidth();
        return {
          position: decorator.range.getStartPosition(),
          preference: preference,
        }
      },
    };
  }
}

export default LiveExpressionWidgetProvider;
