import j from 'jscodeshift';
import './JSXColoringProvider.css';
import {configureLocToMonacoRange} from './scrUtils'

export const JSXTypes = {
  JSXOpeningElement: {
    options: {
      inlineClassName: 'mtk12.Identifier.JsxOpeningElement.Identifier',
    },
  },
  JSXClosingElement: {
    options: {
      inlineClassName: 'mtk12.Identifier.JsxClosingElement.Identifier',
    },
  },
  JSXAttribute: {
    options: {
      inlineClassName: 'mtk12.Identifier.JsxAttribute.Identifier',
    },
  },
};

class JSXColoringProvider {
  constructor(monaco, editorId, monacoEditor) {
    this.monaco = monaco;
    this.locToMonacoRange = configureLocToMonacoRange(this.monaco);
    this.editorId = editorId;
    this.monacoEditor = monacoEditor;
  }

  afterColorize(callback){
    this.afterColorizeCallback = callback;
  }

  colorize(ast) {
    if (ast) {
      const decorators = this.createJSXElementDecorators(ast);
      for (const jsxType in JSXTypes) {
        this.createDecoratorsByType(ast, jsxType, JSXTypes[jsxType].options, decorators);
      }
      this.JSXDecoratorIds = this.monacoEditor
        .deltaDecorations(this.JSXDecoratorIds || [], decorators
        );
      this.afterColorizeCallback && this.afterColorizeCallback([...this.JSXDecoratorIds]);
    }
  }

  createJSXElementDecorators(ast, decorators = []) {
    ast
      .findJSXElements()
      .forEach(p => {
        const loc = p.value.loc;
        const openingElement = p.value.openingElement;
        let elementName = null;
        if (openingElement) {
          const oLoc = openingElement.loc;
          elementName = openingElement.name.name;
          decorators.push({
            range: new this.monaco.Range(
              oLoc.start.line,
              oLoc.start.column + 1,
              oLoc.start.line,
              oLoc.start.column + 2
            ),
            options: {
              inlineClassName: 'mtk12.Identifier.JsxElement.Bracket',
            }
          });
          decorators.push({
            range: new this.monaco.Range(
              oLoc.end.line,
              oLoc.end.column + (openingElement.selfClosing ? -1 : 0),
              oLoc.end.line,
              oLoc.end.column + 1
            ),
            options: {
              inlineClassName: 'mtk12.Identifier.JsxElement.Bracket',
            }
          });
        }
        const closingElement = p.value.closingElement;
        if (closingElement) {
          const cLoc = closingElement.loc;
          decorators.push({
            range: new this.monaco.Range(
              cLoc.start.line,
              cLoc.start.column + 1,
              cLoc.start.line,
              cLoc.start.column + 3
            ),
            options: {
              inlineClassName: 'mtk12.Identifier.JsxElement.Bracket',
            }
          });
          decorators.push({
            range: new this.monaco.Range(
              cLoc.end.line,
              cLoc.end.column,
              cLoc.end.line,
              cLoc.end.column + 1
            ),
            options: {
              inlineClassName: 'mtk12.Identifier.JsxElement.Bracket',
            }
          });
        }

        decorators.push({
          range: this.locToMonacoRange(loc),
          options: {
            glyphMarginClassName: 'glyph.Identifier.JsxElement',
            glyphMarginHoverMessage: `JSX Element${elementName ? ': ' + elementName : ''}`
          }
        });
      });
    return decorators;
  }

  createDecoratorsByType(ast, jsxType, options, decorators = []) {
    ast
      .find(j[jsxType])
      .find(j.JSXIdentifier)
      .forEach(p => {
        const loc = p.value.loc;
        // const opts = {...options, ...{hoverMessage: `(${jsxType})`}};
        decorators.push({
          range: this.locToMonacoRange(loc),
          options: options
        });
      });
    return decorators;
  }

}

export default JSXColoringProvider;
