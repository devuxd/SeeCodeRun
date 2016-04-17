/* global Firepad */
/* global Firebase */
/* global ace */

import '../mode-html';
import '../theme-chrome';



export class HtmlEditor {

  constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
    }
    
  activate(params) {
    if (params.id) {
      this.pastebinId = params.id;
    } 
  }
  attached(params) {
    if (params.id) {
      this.pastebinId = params.id;
    }

    this.pastebinId = params.id;

    let editor = ace.edit('aceHtmlEditorDiv');
    let hiseditor = ace.edit('aceHtmlhisEditorDiv');
    this.configureEditor(hiseditor);
    this.configureEditor(editor);
    
    this.hiseditor = hiseditor;
    this.editor = editor;

    let session = editor.getSession();
    this.configureSession(session);
    
    let hissession = hiseditor.getSession();
    this.configureSession(hissession);
    this.hissession = hissession;
    this.hisfirepad = this.createHisFirepad(hiseditor);

    let selection = editor.getSelection();

    this.session = session;
    this.selection = selection;
    this.firepad = this.createFirepad(editor);        
    this.setupSessionEvents(session);
    
     let baseURL = 'https://seecoderun.firebaseio.com';
    let firebase = new Firebase(baseURL + '/' + this.pastebinId + '/content/html');
    let tempfirebase = firebase.child('temp');
    
    firebase.child('history').on("child_added",function(snap){
      let num = snap.numChildren();
      let v = document.getElementById('slider');
      v.max = num;
      console.log(snap.numChildren());
          });
          
    firebase.once("value",function(snappp){
      console.log(snappp.val());
    });
  
  function shValue(newValue){
    var tabh = document.getElementById('aceHTMLhisEditorDiv');
	tabh.style.display = 'block';
	
	var tab = document.getElementById('aceHTMLEditorDiv');
	tab.style.display = 'none';
	
	document.getElementById("range").innerHTML=newValue;
	myfunction();
  }
  
  function myfunction(){
    var z = document.getElementById('editbutton');
	z.disabled = false;
	var y = document.getElementById('slider');
	var number = y.value;
	
	tempfirebase.remove();
	
	firebase.once("value",function(snapuser){
	  tempfirebase.set(snapuser.val());
	});
	this.hiseditor.setValue('');
	tempfirebase.child('history').remove();
	
	number = Number(number);
	
	firebase.limitToFirst(number).once("value", function(snaphis){
	  tempfirebase.child('history').set(snaphis.val());
	});
	//var t = hisfirepad.getText();
	
  }
  
  
  function clickedit(){
    var g = document.getElementById('editbutton');
    g.disabled = true;
    
    var cc = this.hiseditor.getValue();
    this.editor.setValue(cc);
    
    var tabh = document.getElementById('aceHTMLhisEditorDiv');
	tabh.style.display = 'none';
	
	var tab = document.getElementById('aceHTMLEditorDiv');
	tab.style.display = 'block';
    
  }
    
    
  }
  


  configureEditor(editor) {
    editor.setTheme('ace/theme/chrome');
    editor.setShowFoldWidgets(false);
  }

  configureSession(session) {
    session.setUseWrapMode(true);
    session.setUseWorker(false);
    session.setMode('ace/mode/html');
  } 

  createFirepad(editor) {
    let baseURL = 'https://seecoderun.firebaseio.com';
    let firebase = new Firebase(baseURL + '/' + this.pastebinId + '/content/html');
  return Firepad.fromACE(firebase, editor, 
    { defaultText: '<!DOCTYPE html>\n<html>\n<head>\n\t<meta charset="utf-8">\n\t<title>Coode</title>\n</head>\n'
            + '<body>\n\n</body>\n</html>' });
  }
  
  createHisFirepad(editor) {
    let baseURL = 'https://seecoderun.firebaseio.com';
    let firebase = new Firebase(baseURL + '/' + this.pastebinId + '/content/html');
    let tempfirebase = firebase.child('temp');
  return Firepad.fromACE(tempfirebase, editor);
  }



setupSessionEvents(session) {
      let ea = this.eventAggregator;
      let editor = this.editor;
      
      session.on('change', onEditorChanged);
      
      let editorChangedTimeout;
      
      function onEditorChanged(e) {
          clearTimeout(editorChangedTimeout);
          editorChangedTimeout = setTimeout(function pub() {
              ea.publish('onHtmlEditorChanged', editor.getValue());
          }, 2500);
      }
      
      this.editorChangedTimeout = editorChangedTimeout;
  }
  
  
}