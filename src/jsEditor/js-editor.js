/* global $ */
/* global ace */

export class JsEditor {
  aceJsEditorDiv = "aceJsEditorDiv";
  isFirstLoad = true;
  editorCompactedText = "";
  editorChangedTimeout = null;
  hasErrors = false;
  height = 700;
  
  constructor(eventAggregator, firebaseManager, aceUtils) {
    this.eventAggregator = eventAggregator;
    this.firebaseManager = firebaseManager;
    this.aceUtils = aceUtils;
  }
  
  onWindowResize(){
    let editor = this.editor;
    let gutterLayout = this.aceUtils.getGutterLayout(editor);
    let $editorDiv =$(`#${this.aceJsEditorDiv}`);
    $editorDiv
    .css(
        "height",
        `${
          $("#codeContent").height()
          - $("#codeTabs").height()
        }px`
    );
    $('.line_height').css("font-size", $editorDiv.css("font-size"));
    $('.line_height').css("font-family", $editorDiv.css("font-family"));
    
    $('.highlight_gutter').css("font-size", $editorDiv.css("font-size"));
    $('.highlight_gutter').css("font-family", $editorDiv.css("font-family"));
    
    for(let line = gutterLayout.firstLineNumber; line < gutterLayout.lastRow; line++){
      $('#line'+ line).css("height", gutterLayout.getRowHeight(line -1));
    }
  }
  
  attached() {
    let editor = ace.edit(this.aceJsEditorDiv);
    this.aceUtils.configureEditor(editor);
    this.firepad = this.firebaseManager.makeJsEditorFirepad(editor);

    let session = editor.getSession();
    this.aceUtils.configureSession(session);

    let selection = editor.getSelection();
    this.selection = selection;
    this.setupSessionEvents(editor, session);
    this.subscribe(session);
    
    this.session = session;
    this.editor = editor;
    this.onWindowResize();
  }


  
  setupSessionEvents(editor, session) {
    let self = this;
    let ea = this.eventAggregator;

    let publishEditorChanged = function publishEditorChanged() {
        let jsCode = editor.getValue();
        let curs = editor.getCursorPosition().row + 1;
        if(jsCode){
          let editorCompactedText = jsCode;
          
          if (self.editorChangedText !== editorCompactedText ) {
            self.editorChangedText = editorCompactedText; 
            ea.publish('onJsEditorChanged', {
              js: jsCode,
              length: session.getLength(),
              cursor: curs
            });
          }
        }
    };

    let onEditorChanged = function onEditorChanged(e) {
      if(self.isFirstLoad){
        self.isFirstLoad = false;
        publishEditorChanged();
        ea.publish("onEditorReady", editor);
      }else{
        clearTimeout(self.editorChangedTimeout);
        self.editorChangedTimeout = setTimeout(publishEditorChanged, 2500);
      }
    };
    
    session.on('change',
      onEditorChanged);

    let onAnnotationChanged = function onAnnotationChanged() {
      let annotations = session.getAnnotations();
      for (let key in annotations) {
        if (annotations.hasOwnProperty(key) && annotations[key].type === 'error') {
          ea.publish('onAnnotationChanged', {
            hasErrors: true,
            annotation: annotations[key]
          });
        }
      }
      ea.publish('onAnnotationChanged', {
        hasErrors: false,
        annotation: null
      });
    };
    session.on('changeAnnotation',
      onAnnotationChanged);

    //For gutter
    session.selection.on('changeCursor', () => {
      let cursorPosition =this.editor.getCursorPosition();
      
      if(!cursorPosition){
        return;
      }
      
      let info = {
        cursor: cursorPosition.row + 1,
        lastVisibleRow: session.getLength(),
        position: cursorPosition
      };
      ea.publish('onCursorMoved', info);
    });
    
    //For expressions selection
    editor.on("click", ()=>{
        ea.publish("onEditorClick");
    });
    
    editor.getSession().on('changeScrollTop', function(scrollTop) {
        let info = {
            top: scrollTop
        };

        ea.publish('jsEditorchangeScrollTop', info);
    });
    
    editor.renderer.on('resize', function() {
      self.onWindowResize();
      let config = editor.renderer.layerConfig;
      ea.publish('jsEditorResize', config);
    });
    
    editor.renderer.on('beforeRender', function() {
      let config = editor.renderer.layerConfig;
      ea.publish('jsEditorBeforeRender', config);
    });
    
    editor.renderer.on('afterRender', function() {
      let config = editor.renderer.layerConfig;
      ea.publish('jsEditorAfterRender', config);
    });
  }

  subscribe(session) {
    let ea = this.eventAggregator;
    let self = this;
    
    ea.subscribe("windowResize", dimensions =>{
        self.onWindowResize();
      }
    );
      
    ea.subscribe('onAnnotationChanged', payload => {
      self.hasErrors = payload.hasErrors;

      if (payload.hasErrors) {
        console.log('has errors at: ' + payload.annotation);
      }
      else {
        console.log('no errors');
      }
    });


    // This  event is published by js-gutter.js to scroll the JS editor. 
    ea.subscribe('onScrolled', info => {
      session.setScrollTop(info.top);
    });
    
    ea.subscribe('jsGutterLineClick', lineNumber => {
      this.editor.gotoLine(lineNumber);
    });
    
    ea.subscribe('selectionRangeRequested', () => {
      let selection = {
        range: session.selection.getRange()
      };
      ea.publish('selectionRangeResponse', selection);
    });

  }

  setEditorText(hash) {
    this.editorText = hash;
  }

}
