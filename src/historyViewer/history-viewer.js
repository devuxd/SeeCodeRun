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
        
        let historySlider = document.getElementById("historySlider");
        
        let setSliderValue = this.setSliderValue;
        let self = this;
        
        let onSliderChanged = function onSliderChanged(){
            console.log('onchange');
          setSliderValue(self);  
        };
        
        historySlider.onchange = onSliderChanged ;
        
        let historySession = historyEditor.getSession();
        seeCodeRunEditor.configureSession(historySession);
        this.historySession = historySession;
        
        let baseURL = 'https://seecoderun.firebaseio.com';
        let firebase = new Firebase(baseURL + '/' + pastebinId + '/content/html');
        let tempfirebase = firebase.child('temp');
        this.temporaryFirebase = tempfirebase;

        this.historyFirepad = Firepad.fromACE(tempfirebase, historyEditor);

         firebase.child('history').on("child_added",function(snap){
          let num = snap.numChildren();
          let v = historySlider;
          v.max = num;
          console.log(snap.numChildren());
              });
              
        firebase.once("value",function(snappp){
          console.log(snappp.val());
        });
        
        this.firebase = firebase;
        this.historyEditor = historyEditor;
        this.historySlider = historySlider;
        this.parentEditor = parentEditor;
    }
    
    setSliderValue(self){
    // TODO: USE JQUERY
   // let historySlider = this.historySlider;// this is how you get the reference
   console.log('reached');
    let newValue = self.sliderValue;
    let historyDiv = document.getElementById('aceHtmlHistoryEditorDiv');
	historyDiv.style.display = 'block';
	
	let htmlDiv = document.getElementById('aceHtmlEditorDiv');
	htmlDiv.style.display = 'none';
	
	document.getElementById("range").innerHTML = newValue;
	
	self.updateHistory();
  }
  
   updateHistory(){
       let firebase = this.firebase;
       let temporaryFirebase = this.temporaryFirebase;
    var z = document.getElementById('editbutton');
	z.disabled = false;
	var y = document.getElementById('historySlider');
	var number = y.value;
	
	temporaryFirebase.remove();
	
	firebase.once("value",function(snapuser){
	  temporaryFirebase.set(snapuser.val());
	});
	this.historyEditor.setValue('');
	temporaryFirebase.child('history').remove();
	
	number = Number(number);
	
	firebase.limitToFirst(number).once("value", function(snaphis){
	  temporaryFirebase.child('history').set(snaphis.val());
	  
	});
	//var t = hisfirepad.getText();
	this.historyFirepad = Firepad.fromACE(temporaryFirebase, this.historyEditor);
	
	//console.log(this.historyFirepad.getText());
	
  }
  
  clickedit(){
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