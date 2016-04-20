/*global $*/
/*global ace */
/*global Firebase $*/
/*global Firepad $*/

export class HistoryViewer{
    constructor(seeCodeRunEditor, eventAggregator){
        this.seeCodeRunEditor = seeCodeRunEditor;
        this.eventAggregator = eventAggregator;
        this.sliderValue = 0;
    }
    attached(){
        let seeCodeRunEditor = this.seeCodeRunEditor;
        let parentEditor = seeCodeRunEditor.editor; // this is how you access the editor of the htmleditor
        let pastebinId = seeCodeRunEditor.pastebinId;
        
        let historyEditor = ace.edit("aceHtmlHistoryEditorDiv");
        //this.configureEditor(historyEditor);
       
        let historySession = historyEditor.getSession();
        //this.configureSession(historySession);
        this.historySession = historySession;
        
        let historySlider = document.getElementById("historySlider");
         this.hisDiv = document.getElementById("aceHtmlHistoryEditorDiv");
         this.htmlDiv = document.getElementById("aceHtmlEditorDiv");
        let editbutton = document.getElementById("editbutton");
        
        let setSliderValue = this.setSliderValue;
        let self = this;
        
        let onSliderChanged = function onSliderChanged(){
            console.log('onchange');
          // historyEditor.destroy();
           //firebase.child('temp').remove();
          setSliderValue(self);  
        };
        
        let clickedit = this.clickedit;
        let oneditclick = function oneditclick(){
            clickedit(self);
        };
        
        editbutton.onclick = oneditclick;
        historySlider.onchange = onSliderChanged ;
        
       
        
        let baseURL = 'https://seecoderun.firebaseio.com';
        let firebase = new Firebase(baseURL + '/' + pastebinId + '/content/html');
        //let tempfirebase = firebase.child('temp');
        //this.temporaryFirebase = tempfirebase;
        //tempfirebase.remove();
        

         firebase.child('history').once("value",function(snap){
          let num = snap.numChildren();
          let v = historySlider;
          v.max = num;
          v.value = num;
          document.getElementById('range').innerHTML = num;
         
              });
              
    
        
        this.firebase = firebase;
        this.historyEditor = historyEditor;
        this.historySlider = historySlider;
        this.parentEditor = parentEditor;
        //self = this;
        
    }
    
    
    
    
    setSliderValue(self){
    // TODO: USE JQUERY
   // let historySlider = this.historySlider;// this is how you get the reference
   console.log('reached');
    let newValue = document.getElementById('historySlider').value;
    //this.sliderValue = newValue;
    let historyDiv = document.getElementById('aceHtmlHistoryEditorDiv');
	historyDiv.style.display = 'block';
	
	let htmlDiv = document.getElementById('aceHtmlEditorDiv');
	htmlDiv.style.display = 'none';
	//console.log('slider value: '+ newValue);
	document.getElementById("range").innerHTML = newValue;
	
	   
	  // self.firebase.child('temp').remove();


  console.log('1'); 
  self.historyEditor.setValue('');
    
	let tempref = self.newupdateHistory();
	
	
	console.log('2');
	

	
var	historyfirepad = Firepad.fromACE(tempref,self.historyEditor);


	console.log('3');

  }
  
 
  
  clickedit(self){
    var g = document.getElementById('editbutton');
    g.disabled = true;
    
    //var cc = this.hiseditor.getValue();
    //this.editor.setValue(cc);
    
   // var tabh = document.getElementById('aceHTMLhisEditorDiv');
	self.hisDiv.style.display = 'none';
	
	//var tab = document.getElementById('aceHTMLEditorDiv');
	self.htmlDiv.style.display = 'block';
    
    var cc =self.historyEditor.getValue();
    console.log(cc);
    
    self.parentEditor.setValue(cc);
    
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
  
  newupdateHistory(){
   
    
      let historyEditor = this.historyEditor;
      let firebase = this.firebase;
      let temporaryFirebase = firebase.child('temp');
       
       
    var z = document.getElementById('editbutton');
	z.disabled = false;
	var y = document.getElementById('historySlider');
	
	var numberOnSlider = y.value;
	numberOnSlider = Number(numberOnSlider);
	

	temporaryFirebase.remove();

	
	firebase.child('users').once("value", function(s){
	   
	    let data = s.val();
	    temporaryFirebase.child('users').set(data);
	    
	});

	let temphistoryFirebase = temporaryFirebase.child('history');

	
	firebase.child('history').limitToFirst(numberOnSlider).once("value",function(snaphistory){
	    temphistoryFirebase.set(snaphistory.val());
	});
	

	return temporaryFirebase;
//	
	 

  }
  
 
  
  
  
  
  
  
    
}