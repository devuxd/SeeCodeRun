import React from 'react';
import {render} from 'react-dom';
import {Inspector} from 'react-inspector';

import Button from 'material-ui/Button';
import Settings from 'material-ui-icons/Settings';
import {Observable} from "rxjs";

// import {setupMonacoTypecript} from '../utils/alm/monacoTypeScript';


export const monacoEditorDefaultOptions={
  model: null,  // handled in FirecoObservable
  glyphMargin: false,
  selectOnLineNumbers: true,
  nativeContextMenu: true,
  automaticLayout: true,
  fontLigatures: true,
  folding: true,
  hover: true,
  minimap: {enabled: false},
  scrollBeyondLastLine: false,
  formatOnPaste: true,
  scrollbar: {
    // Subtle shadows to the left & top. Defaults to true.
    useShadows: true,
    // Render vertical arrows. Defaults to false.
    verticalHasArrows: false,
    // Render horizontal arrows. Defaults to false.
    horizontalHasArrows: false,
    // Render vertical scrollbar.
    // Accepted values: 'auto', 'visible', 'hidden'.
    // Defaults to 'auto'
    vertical: 'auto',
    // Render horizontal scrollbar.
    // Accepted values: 'auto', 'visible', 'hidden'.
    // Defaults to 'auto'
    horizontal: 'auto',
    verticalScrollbarSize: 4,
    horizontalScrollbarSize: 4,
    arrowSize: 4
  },
  quickSuggestionsDelay: 750,
  lineHeight: 18 + 10
};

export const monacoEditorMouseEventTypes={
  mouseMove: 'mouseMove',
  mouseLeave: 'mouseLeave',
  mouseDown: 'mouseDown',
  contextMenu: 'contextMenu'
};

export function isApplePlatfom() {
  return (window && window.navigator && window.navigator.platform) ?
    window.navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i) ? true : false
    : true;
}

export function getTokensAtLine(model, lineNumber) {
  // Force line's state to be accurate
  model.getLineTokens(lineNumber, /*inaccurateTokensAcceptable*/false);
  // Get the tokenization state at the beginning of this line
  const freshState=model._lines[lineNumber - 1].getState().clone();
  // Get the human readable tokens on this line
  // return model._tokenizationSupport.tokenize(model.getLineContent(lineNumber), freshState, 0).tokens;
}

export function configureMonaco(monaco) {
  configureMonacoDefaults(monaco);
  // setupMonacoTypecript(monaco);
}

export function configureMonacoModel(monaco, editorId, text, language='js') {
  let extension=language;
  
  if (language.indexOf('js') >= 0 || language.indexOf('script') >= 0) {
    extension='jsx';
    
  }
  // else{
  //   const tokens= monaco.editor.tokenize(text, language);
  //   for(const i in tokens){
  //     console.log(tokens[i]);
  //   }
  // }
  return monaco.editor.createModel(text, language,
    isApplePlatfom() ?
      new monaco.Uri.file(`./${editorId}.${extension}`)
      : new monaco.Uri(`./${editorId}.${extension}`)
  );
}

export function configureMonacoEditor(monaco, editorDiv, customEditorOptions) {
  const options={...monacoEditorDefaultOptions, ...customEditorOptions};
  return monaco.editor.create(editorDiv, options);
}

export function configureMonacoEditorMouseEventsObservable(editor) {
  return Observable.create(observer => {
    editor.onMouseMove(event => {
      observer.next({
        type: monacoEditorMouseEventTypes.mouseMove,
        event: event
      });
    });
    editor.onMouseLeave(event => {
      observer.next({
        type: monacoEditorMouseEventTypes.mouseLeave,
        event: event
      });
    });
    editor.onMouseDown(event => {
      observer.next({
        type: monacoEditorMouseEventTypes.mouseDown,
        event: event
      });
    });
    editor.onContextMenu(event => {
      observer.next({
        type: monacoEditorMouseEventTypes.contextMenu,
        event: event
      });
    });
  });
}

let once=false;

function observeAddViewZone(monacoEditor, afterLineNumber) {
  return Observable.create(observer => {
    const viewZone={};
    monacoEditor.changeViewZones(function (changeAccessor) {
      console.log(changeAccessor);
      
      viewZone.domNode=document.createElement('div');
      // viewZone.domNode.style.background = 'lightgreen';
      // viewZone.domNode.style['z-index'] = 300;
      //   viewZone.domNode.innerText=JSON.stringify(changeAccessor);
      
      viewZone.domNode.innerText=afterLineNumber;
      const viewZoneConf={
        afterLineNumber: afterLineNumber,
        heightInLines: 0.5,
        // height: '50px',
        domNode: viewZone.domNode
      };
      viewZone.viewZoneId=changeAccessor.addZone(viewZoneConf);
      // render(<Inspector data={viewZoneConf}/>, viewZone.domNode);
      observer.next(viewZone);
      observer.complete();
      if (!once) {
        console.log("CA", changeAccessor);
        once=true;
      }
      
    });
  });
}

function viewZoneChangeAccesorObservable(monacoEditor) {
  return Observable.create(observer => {
    monacoEditor.changeViewZones(function (changeAccessor) {
      // console.log("CAAAa", changeAccessor);
      // changeAccessor.addZone({
      //   afterlineNumber: 0,
      //   domNode: document.createElement('div')
      // });
      // changeAccessor.addZone= changeAccessor.addZone;
      observer.next({...changeAccessor});
    });
  });
}

function addLiveLine(changeAccessor, afterLineNumber) {
  const viewZone={};
  viewZone.domNode=document.createElement('div');
  viewZone.domNode.style="font-size:10px;";
  viewZone.domNode.innerText=afterLineNumber;
  const viewZoneConf={
    afterLineNumber: afterLineNumber,
    heightInLines: 0.5,
    domNode: viewZone.domNode
  };
  viewZone.viewZoneId=changeAccessor.addZone(viewZoneConf);
  setTimeout(() => changeAccessor.layoutZone(viewZone.viewZoneId), 100);
  return viewZone;
}

export function configureMonacoEditorWidgets(monaco, editorId, monacoEditor) {
  const lineNumberThreshold=10;
  let maxLineNumber=0;
  let lineNumberDomSelectors={};
  let viewZones=[];
  
  const resetViewZones=() => {
    lineNumberDomSelectors={};
    // if ( viewZones.length > maxLineNumber + lineNumberThreshold) {
    //   const newViewZones=[];
    //   for (let i=0; i < maxLineNumber; i++) {
    //     newViewZones[i]=viewZones[i];
    //   }
    //   for (let i=maxLineNumber; i < viewZones.length; i++) {
    //     viewZones[i] && viewZones[i].domNode && viewZones[i].domNode.remove();
    //   }
    //   viewZones=newViewZones;
    // }
    maxLineNumber=0;
  };
  
  let viewZonesUpdaterTimeout=null;
  const viewZonesUpdater=viewZone => {
    viewZones[0]=viewZone;
    clearTimeout(viewZonesUpdaterTimeout);
    setTimeout(() => monacoEditor.layout(true), 100);
  };
  // observeAddViewZone(monacoEditor, 0).subscribe(viewZonesUpdater);
  
  const lineNumberUpdateSubject=Observable.create(observer => {
    monacoEditor.updateOptions({
      lineNumbers: lineNumber => {
        //observer.next(lineNumber);
        // console.log("l", lineNumber);
        if (lineNumber === 1) { // is refresh
          resetViewZones();
        }
        if (lineNumber > maxLineNumber) {
          maxLineNumber=lineNumber;
        }
        
        lineNumberDomSelectors[lineNumber]={selector: `#${editorId} .line-number-${lineNumber}`};
        return `<div><div class="line-number-${lineNumber}">${lineNumber}</div></div>`;
      }
    });
  });
  
  viewZoneChangeAccesorObservable(monacoEditor).subscribe(changeAccessor => {
    lineNumberUpdateSubject.subscribe(lineNumber => {
      if (viewZones[lineNumber]) {
        console.log(viewZones[lineNumber]);
        changeAccessor.removeZone(viewZones[lineNumber].viewZoneId);
      }
      // setTimeout(()=>{
      viewZones[lineNumber]=addLiveLine(changeAccessor, lineNumber);
      // },200);
      
    });
  });
  
  
  var overlayWidget2={
    domNode: null,
    getId: function () {
      return 'my.overlay.widget2';
    },
    getDomNode: function () {
      if (!this.domNode) {
        this.domNode=document.createElement('div');
        render(<Button variant="fab" color="primary"
                       aria-label="add"><Settings/></Button>, this.domNode);
        
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
  // let decorations = monacoEditor.deltaDecorations([], [
  //   {
  //     range: new monaco.Range(1, 1, 1, 6),
  //     options: {
  //       isWholeLine: false,
  //       className: 'myContentClass',
  //       glyphMarginClassName: 'myGlyphMarginClass',
  //       glyphMarginHoverMessage: '<button>tong</button>',
  //       beforeContentClassName: 'myGlyphMarginClass',
  //       afterContentClassName: 'myGlyphMarginClass',
  //       marginClassName: 'myContentClass'
  //     }
  //   },
  //
  //   {
  //     range: new monaco.Range(1, 10, 3, 1),
  //     options: {
  //       isWholeLine: false,
  //       className: 'myContentClass',
  //       hoverMessage: '<button>boing</button>'
  //     }
  //   }
  // ]);
  
}


//previousState = []
//new monaco.Range(3, 1, 3, 1)
// options: {
// isWholeLine: true,
//   className: 'myContentClass',
//   glyphMarginClassName: 'myGlyphMarginClass'
// }
export function addNavigators(editor, previousState=[], range, options) {
  return editor.deltaDecorations(previousState, [
    {
      range: range,
      options: options
    }
  ]);
}

function addCodeLens(monaco, editor) {
  let commandId=editor.addCommand(0, function () {
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
  let monaco=this.state.monaco;
  
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
      var textUntilPosition=model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });
      var match=textUntilPosition.match(/"dependencies"\s*:\s*{\s*("[^"]*"\s*:\s*"[^"]*"\s*,\s*)*("[^"]*)?$/);
      // console.log(match);
      if (match) {
        return createDependencyProposals();
      }
      return [];
    }
  });
  
}

function configureMonacoDefaults(monaco) {
  const hasNativeTypescript=false;//this.hasNativeTypescript();
  
  const compilerDefaults={
    jsxFactory: 'React.createElement',
    reactNamespace: 'React',
    jsx: monaco.languages.typescript.JsxEmit.React,
    target: monaco.languages.typescript.ScriptTarget.ES2016,
    allowNonTsExtensions: !hasNativeTypescript,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: hasNativeTypescript
      ? monaco.languages.typescript.ModuleKind.ES2015
      : monaco.languages.typescript.ModuleKind.System,
    experimentalDecorators: true,
    noEmit: true,
    allowJs: true,
    typeRoots: ['node_modules/@types'],
    
    forceConsistentCasingInFileNames: hasNativeTypescript,
    noImplicitReturns: hasNativeTypescript,
    noImplicitThis: hasNativeTypescript,
    noImplicitAny: hasNativeTypescript,
    strictNullChecks: hasNativeTypescript,
    suppressImplicitAnyIndexErrors: hasNativeTypescript,
    noUnusedLocals: hasNativeTypescript,
  };
  
  monaco.languages.typescript.typescriptDefaults.setMaximunWorkerIdleTime(-1);
  monaco.languages.typescript.javascriptDefaults.setMaximunWorkerIdleTime(-1);
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
    compilerDefaults
  );
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions(
    compilerDefaults
  );
  
  monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
  monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
  
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: !hasNativeTypescript,
    noSyntaxValidation: !hasNativeTypescript,
  });
  
  // monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
  //   noSemanticValidation: false,
  //   noSyntaxValidation: false
  // });

// compiler options
//   monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
//     target: monaco.languages.typescript.ScriptTarget.ES2017,
//     allowNonTsExtensions: true,
//     jsx: "react"
//   });

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
