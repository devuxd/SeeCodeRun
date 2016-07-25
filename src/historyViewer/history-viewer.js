/*global $*/
/*global ace */
/*global Firebase $*/
/*global Firepad $*/

export class HistoryViewer {
 selectedEffect = "fold";
 hideTimeout = 15000;
 slideAnimationDuration = 500;
 seeCodeRunEditor = null;
 hasAutoHide = false;
 sliderValue = 0;
 sliderMaxValue = 10;

 constructor(firebaseManager, eventAggregator) {
  this.eventAggregator = eventAggregator;
  this.firebaseManager = firebaseManager;
 }
 attached() {
  let self = this;
  $('#historyBox').hide();
  $('#historyButton').click( function toggleHistoryBox() {
      let willBeVisible = true;
      if($("#historyBox").is(":visible")){
          willBeVisible = false;
          $("#historyButton span").removeClass("navigation-bar-active-item");
          $("#historyButton label").removeClass("navigation-bar-active-item");
      }else{
          self.eventAggregator.publish("historyBoxShown");
          $("#historyButton span").addClass("navigation-bar-active-item");
          $("#historyButton label").addClass("navigation-bar-active-item");
      }
      if(!$("#historyBox").is(":animated")){
          $("#historyBox").toggle("slide", { direction: "left" }, self.slideAnimationDuration,
                function historyBoxShown(){
                     if(willBeVisible){
                      self.backToThePast();
                     }else{
                      self.backToThePresent();
                     }
                }
          );
      }
  });

  self.eventAggregator.subscribe("shareBoxShown", () => {
    if($("#historyBox").is(":visible")){
          $("#historyButton").click();
     }
  });

  $("#historyChangeButton").click(function historyChangeButtonClick(){
    self.backToTheFuture();
    $("#historyButton span").removeClass("navigation-bar-active-item");
    $("#historyButton label").removeClass("navigation-bar-active-item");
    $("#historyBox").toggle();
  });


  $('#historySlider').slider({
                      slide: function onHistorySliderChanged(event, ui) {
                          if(self.sliderValue !== ui.value){
                            self.sliderValue = ui.value;
                            self.slideHistoryViewer();
                          }
                      }
                    });
  $('#historySlider').slider('option', {min: 1, max: self.sliderMaxValue, value: self.sliderValue});
  $('#historySlider').show();

  if(this.hasAutoHide){
   let toggleHistoryBoxTimeoutCallback = function toggleHistoryBoxTimeoutCallback(){
    $("#historyBox").toggle("slide", { direction: "left" }, self.slideAnimationDuration);
    $("#historyButton span").removeClass("navigation-bar-active-item");
    $("#historyButton label").removeClass("navigation-bar-active-item");
   };
   $('#historyListItem').mouseenter(function historyListItemMouseEnter(){
       clearTimeout(self.toggleHistoryBoxTimeout);
   }).mouseleave(function historyListItemMouseLeave(){
       if($("#historyBox").is(":visible")){
           self.toggleHistoryBoxTimeout = setTimeout(toggleHistoryBoxTimeoutCallback, self.hideTimeout);
       }
   });
  }

  this.subscribe();
 }

 slideHistoryViewer() {

  if(!this.activeEditor){
   return;
  }

  if(!this.activeEditor.editor){
   return;
  }

  if(!this.subjectFirebase || !this.historyFirebase){
   return;
  }

  this.sliderValue = Number(this.sliderValue);

  // this.backToThePast();
  this.firebaseManager.
   slideHistoryViewerFirepad(this.subjectFirebase, this.historyFirebase, this.activeEditor.editor, this.sliderValue);
 }

 subscribe(){
  this.eventAggregator.subscribe("activeEditorChange", activeEditorData =>{
   if($("#historyBox").is(":visible")){
    return;
   }
   this.activeEditor = activeEditorData.activeEditor;
  });
 }

 attachHistorySliderUpdater(){
  let self = this;
  if(!self.sliderMaxValue){
   return;
  }
  $('#historySlider').slider('option', {min: 1, max: self.sliderMaxValue, value: self.sliderValue});
  // update the history slider as more children are added to the history of the firebase
  // self.subjectFirebase.child('history').on("child_added", function (snap) {
  //  self.subjectFirebase.child('history').once("value", function (sna) {
  //   self.sliderMaxValue = sna.numChildren();
  //   $('#historySlider').slider('option', {min: 1, max: self.sliderMaxValue, value: self.sliderValue});
  //  });
  // });

 }

  dettachHistorySliderUpdater(){
   let self = this;
   if(!self.subjectFirebase){
    return;
   }
   self.subjectFirebase.child('history').off("child_added");
  }

 backToThePast(){
  if(!this.activeEditor){
   return;
  }
  if(!this.activeEditor.firepad){
   return;
  }
  this.activeEditor.firepad.dispose();

  this.activeEditor.editor.setValue("");
  this.activeEditor.editor.setReadOnly(true);

  let historyViewerFireData =
   this.firebaseManager.
    makeHistoryViewerFirepad(this.activeEditor.firebaseTag, this.activeEditor.editor);

  this.sliderMaxValue = historyViewerFireData.sliderMaxValue;
  this.subjectFirebase = historyViewerFireData.subjectFirebase;
  this.historyFirebase = historyViewerFireData.historyFirebase;
  this.activeEditor.firepad = historyViewerFireData.historyFirepad;
  // this.attachHistorySliderUpdater();
 }

 backToThePresent(){
  if(!this.activeEditor){
   return;
  }
  this.activeEditor.editor.setReadOnly(false);
  this.activeEditor.firepad.dispose();
  this.dettachHistorySliderUpdater();
  this.subjectFirebase = null;

  this.activeEditor.editor.setValue("");
  this.activeEditor.firepad = this.firebaseManager.
    makeFirepad(this.activeEditor.firebaseTag, this.activeEditor.editor, "");
 }

 backToTheFuture(){// move past to present
  if(!this.activeEditor){
   return;
  }
  this.activeEditor.editor.setReadOnly(false);
  let pastValue = this.activeEditor.editor.getValue();
  this.activeEditor.firepad.dispose();
  this.dettachHistorySliderUpdater();
  this.subjectFirebase = null;

  this.activeEditor.editor.setValue("");
  this.activeEditor.firepad = this.firebaseManager.
    makeFirepad(this.activeEditor.firebaseTag, this.activeEditor.editor, "");
  this.activeEditor.editor.setValue("");
  this.activeEditor.editor.setValue(pastValue);
 }

}