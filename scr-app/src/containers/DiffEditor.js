class DiffEditor {

    constructor(firebaseManager, eventAggregator) {
        this.eventAggregator = eventAggregator;
        this.firebaseManager = firebaseManager;
    }

    attached() {
        const historySlider = {};

        historySlider.on("slide",
            function onHistorySliderChanged(event, ui) {
                if (self.sliderValue !== ui.value) {
                    self.sliderValue = ui.value;
                    self.slideHistoryViewer();
                }
            }
        );
        historySlider.slider('option', {min: 1, max: self.sliderMaxValue, value: self.sliderValue});

        this.subscribe();
    }

    slideHistoryViewer() {
        if (!this.activeHistoryEditor) {
            return;
        }

        if (!this.subjectFirebase || !this.historyFirebase) {
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


    subscribe() {
        this.eventAggregator.subscribe("activeEditorChange", activeEditorData => {

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

            // if ($('#historySlider').is(":visible")) {
            //   this.backToThePast();
            // }
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
        // $('#historySlider').slider('option', {min: 1, max: this.sliderMaxValue, value: this.sliderValue});
    }


    backToThePast() {
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
    }


    backToTheFuture() {// move past to present
        if (!this.activeEditor) {
            return;
        }
        if (!this.activeHistoryEditor) {
            return;
        }
        let pastValue = this.activeHistoryEditor.getValue();
        this.activeEditor.editor.setValue(pastValue);
    }

    makeHistoryViewerFirepad(subject, editor, context) {
        let subjectURL = `${this.baseURL}/${this.pastebinId}/content/${subject}`;
        let subjectFirebase = new Firebase(subjectURL);

        let subjectHistoryURL = `${this.baseURL}/${this.pastebinId}/historyViewer/${subject}`;
        let historyFirebase = new Firebase(subjectHistoryURL);

        // Copy the entire firebase to the history firebase
        subjectFirebase.once("value", function (snapshot) {
            historyFirebase.set(snapshot.val());
        });


        subjectFirebase.child('history').once("value", function (snapshot) {
            let sliderMaxValue = snapshot.numChildren();
            context.updateSliderMaxValue(sliderMaxValue);
        });

        let headless = Firepad.Headless(historyFirebase);
        headless.getText(function (text) {
            editor.setValue(text);
        });
        return {
            subjectFirebase: subjectFirebase,
            historyFirebase: historyFirebase,
            historyFirepadHeadless: headless
        };
    }

    slideHistoryViewerFirepad(subjectFirebase, historyFirebase, sliderValue, activeHistoryEditor, context) {
        context.historyFirepadHeadless.dispose();
        // Copy history from the firebase to the history firebase to display values till a specific point in history.
        subjectFirebase.child('history').limitToFirst(sliderValue).once("value", function (snapshot) {
            historyFirebase.child('history').set(snapshot.val());
            context.historyFirepadHeadless = Firepad.Headless(historyFirebase);
            context.historyFirepadHeadless.getText(function (text) {
                activeHistoryEditor.setValue(text);
            });

        });
    }

    stopReceivingHistoryUpdates(firebaseRef) {
        if (!firebaseRef) {
            return;
        }
        firebaseRef.child('history').off("child_added");
    }
}

export default DiffEditor;