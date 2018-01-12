import React from 'react';
import {render} from 'react-dom';
import {Inspector} from 'react-inspector';

import Button from 'material-ui/Button';
import Settings from 'material-ui-icons/Settings';
import {Observable} from "rxjs";


export const monacoEditorDefaultOptions = {
  model: null,  // handled in Fireco
  glyphMargin: false,
  nativeContextMenu: true,
  automaticLayout: true,
  fontLigatures: true,
  hover: true,
  minimap: {enabled: false}
};

export function configureMonaco(monaco) {
  configureMonacoDefaults(monaco);
}

export function configureMonacoModel(monaco, text, language) {
  return monaco.editor.createModel(text, language);
}

export function configureMonacoEditor(monaco, editorId, customEditorOptions) {
  const options = {...monacoEditorDefaultOptions, customEditorOptions};
  return monaco.editor.create(document.getElementById(editorId), options);
}

let once = false;
function observeAddViewZone(monacoEditor, afterLineNumber){
  return Observable.create(observer =>{
    const viewZone = {};
    monacoEditor.changeViewZones(function(changeAccessor) {

      viewZone.domNode = document.createElement('div');
      // viewZone.domNode.style.background = 'lightgreen';
      viewZone.domNode.style['z-index'] = 300;
      const viewZoneConf = {
        afterLineNumber: afterLineNumber,
        heightInLines: 2,
        // height: '50px',
        domNode: viewZone.domNode
      };
      viewZone.viewZoneId = changeAccessor.addZone(viewZoneConf);
      render(<Inspector data={viewZoneConf}/>, viewZone.domNode);
      observer.next(viewZone);
      observer.complete();
      if(!once){
        console.log("CA", changeAccessor);
        once=true;
      }

    });
  });
}

export function configureMonacoEditorWidgets(monaco, editorId, monacoEditor) {
  let lineNumberDomSelectors = {};
  let viewZones ={};
  let ignoreLocalGetText = false;

  monacoEditor.updateOptions({
    lineNumbers: lineNumber => {
      if (lineNumber === 1) { // is refresh
        lineNumberDomSelectors = {};
      }
      if(!viewZones[lineNumber]){
        observeAddViewZone(monacoEditor, lineNumber).subscribe(viewZone=>{viewZones[lineNumber]=viewZone});
      }
      lineNumberDomSelectors[lineNumber] ={selector: `#${editorId} .line-number-${lineNumber}`} ;
      return `<div><div class="line-number-${lineNumber}">${lineNumber}</div></div>`;
    }
  });

  var overlayWidget2 = {
    domNode: null,
    getId: function () {
      return 'my.overlay.widget2';
    },
    getDomNode: function () {
      if (!this.domNode) {
        this.domNode = document.createElement('div');
        render(<Button fab color="primary" aria-label="add"><Settings/></Button>, this.domNode);

      }
      return this.domNode;
    },
    getPosition: function () {
      return {
        preference: monaco.editor.OverlayWidgetPositionPreference.BOTTOM_RIGHT_CORNER
      };

    }
  };
  monacoEditor.addOverlayWidget(overlayWidget2);
  let decorations = monacoEditor.deltaDecorations([], [
    {
      range: new monaco.Range(1, 1, 1, 6),
      options: {
        isWholeLine: false,
        className: 'myContentClass',
        glyphMarginClassName: 'myGlyphMarginClass',
        glyphMarginHoverMessage: '<button>tong</button>',
        beforeContentClassName: 'myGlyphMarginClass',
        afterContentClassName: 'myGlyphMarginClass',
        marginClassName: 'myContentClass'
      }
    },

    {
      range: new monaco.Range(1, 10, 3, 1),
      options: {
        isWholeLine: false,
        className: 'myContentClass',
        hoverMessage: '<button>boing</button>'
      }
    }
  ]);

}


//previousState = []
//new monaco.Range(3, 1, 3, 1)
// options: {
// isWholeLine: true,
//   className: 'myContentClass',
//   glyphMarginClassName: 'myGlyphMarginClass'
// }
export function addNavigators(editor, previousState = [], range, options) {
  return editor.deltaDecorations(previousState, [
    {
      range: range,
      options: options
    }
  ]);
}

function addCodeLens(monaco, editor) {
  let commandId = editor.addCommand(0, function () {
    // services available in `ctx`
    // console.log("c", arguments);

  }, '');

  monaco.languages.registerCodeLensProvider('javascript', {
    provideCodeLenses: function (model, token) {
      return [
        {
          range: {
            startLineNumber: 2,
            startColumn: 1,
            endLineNumber: 2,
            endColumn: 1
          },
          id: "First Line",
          command: {
            id: commandId,
            title: "First Line: blaaaaaa",
            content: "bluuuuuuuuu"
          }
        }
      ];
    },
    resolveCodeLens: function (model, codeLens, token) {
      // console.log(arguments);
      return codeLens;
    }
  });
}

function addCompletionProviders() {
  let monaco = this.state.monaco;

  function createDependencyProposals() {
    // returning a static list of proposals, not even looking at the prefix (filtering is done by the Monaco editor),
    // here you could do a server side lookup
    return [
      {
        label: '"lodash"',
        kind: monaco.languages.CompletionItemKind.Function,
        documentation: "The Lodash library exported as Node.js modules.",
        insertText: '"lodash": "*"'
      },
      {
        label: '"express"',
        kind: monaco.languages.CompletionItemKind.Function,
        documentation: "Fast, unopinionated, minimalist web framework",
        insertText: '"express": "*"'
      },
      {
        label: '"mkdirp"',
        kind: monaco.languages.CompletionItemKind.Function,
        documentation: "Recursively mkdir, like <code>mkdir -p</code>",
        insertText: '"mkdirp": "*"'
      }
    ];
  }


  monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems: function (model, position) {
      // find out if we are completing a property in the 'dependencies' object.
      var textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });
      var match = textUntilPosition.match(/"dependencies"\s*:\s*{\s*("[^"]*"\s*:\s*"[^"]*"\s*,\s*)*("[^"]*)?$/);
      // console.log(match);
      if (match) {
        return createDependencyProposals();
      }
      return [];
    }
  });

}

function configureMonacoDefaults(monaco) {
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false
  });

// compiler options
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES6,
    allowNonTsExtensions: true
  });

// extra libraries
//   monaco.languages.typescript.javascriptDefaults.addExtraLib([
//     'declare class Facts {',
//     '    /**',
//     '     * Returns the next fact',
//     '     */',
//     '    static next():string',
//     '}',
//   ].join('\n'), 'filename/facts.d.ts');

}
