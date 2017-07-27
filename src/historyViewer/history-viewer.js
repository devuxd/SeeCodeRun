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
  sliderValues = [];

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

    $historyBox.toggle("slide", {direction: "left"}, self.slideAnimationDuration,
      function historyBoxShown() {
        if (willBeVisible) {
          self.backToThePast();
        } else {
          // self.backToThePresent();
          self.backToEditing();
        }
      }
    );

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
   if (!this.activeHistoryEditor) {
   return;
  }

  if(!this.subjectFirebase || !this.historyFirebase){
   return;
  }

  this.sliderValue = Number(this.sliderValue);

   let self = this;
   clearTimeout(self.slideHistoryTimeout);
   self.slideHistoryTimeout = setTimeout(function () {
     self.sliderValues[self.activeHistoryEditorSelector] = self.sliderValue;
     self.firebaseManager.slideHistoryViewerFirepad(self.subjectFirebase, self.historyFirebase, self.sliderValue, self.activeHistoryEditor, self);
   }, 250);

 }


 subscribe(){
  this.eventAggregator.subscribe("activeEditorChange", activeEditorData =>{

    let historyEditorId = null;
    let aceSessionMode = "ace/mode/javascript";
    if (activeEditorData.activeEditor.aceJsEditorDiv) {
      historyEditorId = "aceJsEditorDivHistory";
      this.activeFirebaseContentEditorTag = "js";
    } else {
      if (activeEditorData.activeEditor.aceHtmlEditorDiv) {
        historyEditorId = "aceHtmlEditorDivHistory";
        this.activeFirebaseContentEditorTag = "html";
        aceSessionMode = "ace/mode/html";
      } else {// css
        historyEditorId = "cssEditorDivHistory";
        this.activeFirebaseContentEditorTag = "css";
        aceSessionMode = "ace/mode/css";
      }
    }
    if (!this.historyEditors[historyEditorId]) {
      this.historyEditors[historyEditorId] = ace.edit(historyEditorId);
      activeEditorData.activeEditor.aceUtils.configureEditor(this.historyEditors[historyEditorId]);
      let session = this.historyEditors[historyEditorId].getSession();
      activeEditorData.activeEditor.aceUtils.configureSession(session, aceSessionMode);
      this.historyEditors[historyEditorId].setValue("");
      this.historyEditors[historyEditorId].setReadOnly(true);
    }
    this.activeEditor = activeEditorData.activeEditor;
    this.activeHistoryEditor = this.historyEditors[historyEditorId];
    this.activeHistoryEditorSelector = "#" + historyEditorId;

    if ($('#historySlider').is(":visible")) {
      this.backToThePast();
    }
  });
 }

  updateSliderMaxValue(sliderMaxValue) {
    this.sliderMaxValue = sliderMaxValue;

    let previousSliderValue = this.sliderValues[this.activeHistoryEditorSelector];
    if (previousSliderValue) {
      this.sliderValue = previousSliderValue;
      this.slideHistoryViewer();
    } else {
      this.sliderValue = this.sliderMaxValue;
    }
    $('#historySlider').slider('option', {min: 1, max: this.sliderMaxValue, value: this.sliderValue});
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
   this.historyFirepadHeadless = historyViewerFireData.historyFirepadHeadless;


   let activeEditorSelector = this.activeHistoryEditorSelector.replace("History", "");
   $(this.activeHistoryEditorSelector).css({display: "block"});
   $(activeEditorSelector).css({display: "none"});
 }


 backToTheFuture(){// move past to present
   if (!this.activeEditor) {
     return;
   }
   if (!this.activeHistoryEditor) {
     return;
   }
   let pastValue = this.activeHistoryEditor.getValue();
  this.activeEditor.editor.setValue(pastValue);
   this.backToEditing();
 }

  backToEditing() {
    $("#aceJsEditorDivHistory").css({display: "none"});
    $("#aceJsEditorDiv").css({display: "block"});

    $("#aceHtmlEditorDivHistory").css({display: "none"});
    $("#aceHtmlEditorDiv").css({display: "block"});

    $("#cssEditorDivHistory").css({display: "none"});
    $("#cssEditorDiv").css({display: "block"});

  }


}
