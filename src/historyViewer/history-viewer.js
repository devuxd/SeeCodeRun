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
  historyEditors = [];

 constructor(firebaseManager, eventAggregator) {
  this.eventAggregator = eventAggregator;
  this.firebaseManager = firebaseManager;
 }
 attached() {
  let self = this;
   let $historyBox = $('#historyBox');
   $historyBox.hide();

  $('#historyButton').click( function toggleHistoryBox() {
      let willBeVisible = true;
    if ($historyBox.is(":visible")) {
          willBeVisible = false;
          $("#historyButton span").removeClass("navigation-bar-active-item");
          $("#historyButton label").removeClass("navigation-bar-active-item");
      }else{
          self.eventAggregator.publish("historyBoxShown");
          $("#historyButton span").addClass("navigation-bar-active-item");
          $("#historyButton label").addClass("navigation-bar-active-item");
      }
    if (!$historyBox.is(":animated")) {
      $historyBox.toggle("slide", {direction: "left"}, self.slideAnimationDuration,
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
    if ($historyBox.is(":visible")) {
          $("#historyButton").click();
     }
  });

  $("#historyChangeButton").click(function historyChangeButtonClick(){
    self.backToTheFuture();
    $("#historyButton span").removeClass("navigation-bar-active-item");
    $("#historyButton label").removeClass("navigation-bar-active-item");
    $historyBox.toggle();
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
     $historyBox.toggle("slide", {direction: "left"}, self.slideAnimationDuration);
    $("#historyButton span").removeClass("navigation-bar-active-item");
    $("#historyButton label").removeClass("navigation-bar-active-item");
   };
   $('#historyListItem').mouseenter(function historyListItemMouseEnter(){
       clearTimeout(self.toggleHistoryBoxTimeout);
   }).mouseleave(function historyListItemMouseLeave(){
     if ($historyBox.is(":visible")) {
           self.toggleHistoryBoxTimeout = setTimeout(toggleHistoryBoxTimeoutCallback, self.hideTimeout);
       }
   });
  }

  this.subscribe();
 }

 slideHistoryViewer() {
   // console.log("slider val", this.sliderValue, this.subjectFirebase, this.historyFirebase );
   if (!this.activeHistoryEditor) {
   return;
  }


  if(!this.subjectFirebase || !this.historyFirebase){
   return;
  }

  this.sliderValue = Number(this.sliderValue);

  // this.backToThePast();
  this.firebaseManager.slideHistoryViewerFirepad(this.subjectFirebase, this.historyFirebase, this.sliderValue, this.activeHistoryEditor);
 }

  updateActiveHistoryEditor() {
    this.activeHistoryEditor.resize();
  }

 subscribe(){
  this.eventAggregator.subscribe("activeEditorChange", activeEditorData =>{

    let historyEditorId = null;

    if (activeEditorData.activeEditor.aceJsEditorDiv) {
      historyEditorId = "aceJsEditorDivHistory";
      this.activeFirebaseContentEditorTag = "js";
    } else {
      if (activeEditorData.activeEditor.aceHtmlEditorDiv) {
        historyEditorId = "aceHtmlEditorDivHistory";
        this.activeFirebaseContentEditorTag = "html";
      } else {// css
        historyEditorId = "cssEditorDivHistory";
        this.activeFirebaseContentEditorTag = "css";
      }
    }
    if (!this.historyEditors[historyEditorId]) {
      this.historyEditors[historyEditorId] = ace.edit(historyEditorId);
      this.historyEditors[historyEditorId].setValue("");
      // this.historyEditors[historyEditorId].setReadOnly(true);
    }

    this.activeHistoryEditor = this.historyEditors[historyEditorId];
    this.activeHistoryEditorSelector = "#" + historyEditorId;
  });
 }

  updateSliderMaxValue(sliderMaxValue) {
    this.sliderMaxValue = sliderMaxValue;
    $('#historySlider').slider('option', {min: 1, max: this.sliderMaxValue, value: this.sliderMaxValue});
 }

  dettachHistorySliderUpdater(){
   let self = this;
   if(!self.subjectFirebase){
    return;
   }
   self.subjectFirebase.child('history').off("child_added");
  }

 backToThePast(){
   if (!this.activeHistoryEditor) {
   return;
  }
   this.activeHistoryEditor.setValue("");
  let historyViewerFireData =
   this.firebaseManager.makeHistoryViewerFirepad(this.activeFirebaseContentEditorTag, this.activeHistoryEditor, this);

  this.sliderMaxValue = historyViewerFireData.sliderMaxValue;
  this.subjectFirebase = historyViewerFireData.subjectFirebase;
  this.historyFirebase = historyViewerFireData.historyFirebase;
   // console.log("SL", historyViewerFireData);

   let activeEditorSelector = this.activeHistoryEditorSelector.replace("History", "");
   console.log(activeEditorSelector, this.activeHistoryEditorSelector);
   $(this.activeHistoryEditorSelector).css({display: "block"});
   $(activeEditorSelector).css({display: "none"});

   let self = this;

   // this.historyFirebase.child("history").on("child_added", function(){
   //   self.activeHistoryEditor.setValue("");
   //   Firepad.fromACE(self.historyFirebase, self.activeHistoryEditor, {defaultText: ""});
   // });
 }

 backToThePresent(){
   if (!this.activeHistoryEditor) {
   return;
  }

   let activeEditorSelector = this.activeHistoryEditorSelector.replace("History", "");
   $(this.activeHistoryEditorSelector).css({display: "none"});
   $(activeEditorSelector).css({display: "block"});

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
