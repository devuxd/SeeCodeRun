/* global Firepad */
/* global Firebase */
/* global ace */
import '../mode-javascript';
import '../theme-chrome';

export class JsEditor {

  constructor(eventAggregator, router) {
    this.eventAggregator = eventAggregator;
    this.router = router;
    this.hasErrors = false;
  }

  activate(params) {
    if (params.id) {
      this.pastebinId = params.id;
    } else {
      let baseURL = 'https://seecoderun.firebaseio.com';
      let firebase = new Firebase(baseURL);
      let pastebinId = firebase.push().key();
    }
  }
  attached(params) {
    if (params.id) {
      this.pastebinId = params.id;
    }

    let editor = ace.edit('aceJsEditorDiv');
    this.configureEditor(editor);
    
    this.editor = editor;
    
    let session = editor.getSession();
    this.configureSession(session);

    let selection = editor.getSelection();
    this.session = session;
    this.selection = selection;
    this.firepad = this.createFirepad(editor);        
    this.setupSessionEvents(session);
    this.subscribe(session);
  }

  configureEditor(editor) {
    editor.setTheme('ace/theme/chrome');
    editor.setShowFoldWidgets(false);
  }

  configureSession(session) {
    session.setUseWrapMode(true);
    session.setUseWorker(false);
    session.setMode('ace/mode/javascript');
    session.addGutterDecoration(0, 'label label-info');
  }

  setupSessionEvents(session) {
    let ea = this.eventAggregator;
    let editor = this.editor;
    session.on('change',
      onEditorChanged);

    let editorChangedTimeout;
    
    function onEditorChanged(e) {
	  
      clearTimeout(editorChangedTimeout);
	  
      editorChangedTimeout = setTimeout(function pub() { 
        let js = editor.getValue();
        let curs = editor.getCursorPosition().row+1;  
       
        // subscribe to this event to be notified with the following data when the JS-editor changed.   
        //TODO: make this smarter by only publishing the event when there is an actual input i.e. not empty space.
        
         ea.publish('onJsEditorChanged', {
            js: js, 
            length: session.getLength(), 
            cursor: curs
        });
      }, 2500);
}
     
     
 

    this.editorChangedTimeout = editorChangedTimeout;

    session.on('changeAnnotation',
      onAnnotationChanged);

    function onAnnotationChanged() {
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
    }
      

      // Copy event for Vis-viewer
      editor.on('copy', expression =>
      {
           ea.publish('onEditorCopy', {
            expression: expression,
            row: editor.getCursorPosition().row +1,
            column: editor.getCursorPosition().column+1
            
      });});

       //For gutter
    session.selection.on
           ('changeCursor', () => {

           let info =
           {
              cursor : this.editor.getCursorPosition().row+1,
              lastVisibleRow: session.getLength()
               
           }; 
            ea.publish('onCursorMoved', info );
          });
  }

  createFirepad(editor) {
    let baseURL = 'https://seecoderun.firebaseio.com';
    let firebase = new Firebase(baseURL + '/' + this.pastebinId + '/content/js');

    return Firepad.fromACE(
      firebase,
      editor,
      {
        defaultText: 'go(); \n\nfunction go() {\n  var message = "Hello, world.";\n  console.log(message);\n}'
      });
  }

  subscribe(session) {
    let ea = this.eventAggregator;
    let hasErrors = this.hasErrors;
    let editor = this.editor;


    ea.subscribe('onAnnotationChanged', payload => {
      hasErrors = payload.hasErrors;

      if (payload.hasErrors) {
        console.log('has errors at: ' + payload.annotation);
      } else {
        console.log('no errors');
      }
    });

    
    // This is event is published by js-gutter.js to scroll the JS editor. 
     ea.subscribe('onScrolled', info =>  {     
      session.setScrollTop(info.top);
    });
  
}
 
}

