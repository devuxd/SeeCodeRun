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
        let parentEditor = seeCodeRunEditor.editor; 
        let pastebinId = seeCodeRunEditor.pastebinId;
       
       
      
       
       // Define history firepad
        var historyfirepad;
         this.historyfirepad = historyfirepad;
        let historyEditor = ace.edit("aceHtmlHistoryEditorDiv");
        this.configureEditor(historyEditor);
        let historySession = historyEditor.getSession();
        this.configureSession(historySession);
        this.historySession = historySession;
        
        
        // define historyslider , history div , html div , edit button
        var historySlider = $('#historySlider');
         var historyDiv = $('#aceHtmlHistoryEditorDiv');
         var htmlDiv = $('aceHtmlEditorDiv');
        
        
        let setSliderValue = this.setSliderValue;
        let self = this;
        self.historyfirepad = historyfirepad;
        
        
        // Function for the event of slider change
        let onSliderChanged = function onSliderChanged(){
            historyEditor.setValue('');
          setSliderValue(self);  
        };
        
        
       
        historySlider.change(onSliderChanged);
        
       
        
        let baseURL = 'https://seecoderun.firebaseio.com';
        let firebase = new Firebase(baseURL + '/' + pastebinId + '/content/html');
       let tref = firebase.child('temp');
       
       
       // update the history slider as more children are added to the history of the firebase
         firebase.child('history').on("child_added",function(snap){
             firebase.child('history').once("value",function(sna){
                 
          let num = sna.numChildren();
          
          $('#historySlider').attr("max",num.toString());
          $('#historySlider').val(num);
          $('#range').text(num.toString());
             });
              });
              
              
        var historyDivision = $('#aceHtmlHistoryEditorDiv');
        historyDivision.keypress(function(e) {
              
   
    
    // Switch from the History div to the HTML div
	$('#aceHtmlHistoryEditorDiv').css("display","none");
	$('#aceHtmlEditorDiv').css("display","block");
	
	
	// Get the values from the editor and copy them to the html editor
    var cc =self.historyEditor.getValue();
    self.parentEditor.setValue('');
    self.parentEditor.setValue(cc);
    
            
        });
              
    
        
        this.firebase = firebase;
        this.historyEditor = historyEditor;
        this.historySlider = historySlider;
        this.parentEditor = parentEditor;
        
        
    }
    
    
    
    // function to set the slider value
    setSliderValue(self){
    
   
     var historySlider= $('#historySlider');
     var historyDiv = $('#aceHtmlHistoryEditorDiv');
     var htmlDiv = $('#aceHtmlEditorDiv');
     
    let newValue = historySlider.val();
    console.log(newValue);
    
    
    //Switch from the HTML Div to the History Div
	historyDiv.css("display","block");
	htmlDiv.css("display","none");
	
	//update the value displayed under the slider
	$('#range').text(newValue.toString());
	
	   
	  
    	self.firebase.on("value",function (c){
	   
	});
    

// calls the update function
let tref = self.updateHistory();

	
// Clear the Editor
 self.historyEditor.setValue('');

    // Get the values from the history firebase and display it to the history editor 
	self.historyfirepad = Firepad.fromACE(tref,self.historyEditor);


  }
  
 updateHistory(){
     
      let historyEditor = this.historyEditor;
      let firebase = this.firebase;
      let temporaryFirebase = firebase.child('temp');
       
     
   
	
	// Get the value from the slider
	var hitstorySlider = $("#historySlider");
	var numberOnSlider = hitstorySlider.val();

	numberOnSlider = Number(numberOnSlider);
	
	// Remove the temp folder from the firebase
	firebase.child('temp').remove();
	
	
	// Copy the entire firebase to the temporary firebase 
	firebase.once("value",function(snap){
	    firebase.child('temp').set(snap.val());
	});
	
	this.historyEditor.setValue('');
	
	// Remove the history from the temporary firebase
	firebase.child('temp/history').remove();
	this.historyEditor.setValue('');
	
	
	// Copy history from the firebase to the temorary firebase to display values till a specific point in history.
	firebase.child('history').limitToFirst(numberOnSlider).once("value",function(snap){
	    firebase.child('temp/history').set(snap.val());
	});
	
	
	// return the temporary firebase address
	return firebase.child('temp');
	
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
  
    
}