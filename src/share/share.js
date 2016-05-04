/* global Firepad */
/* global Firebase */
/* global ace */
/* global $ */

export class Share {

    constructor() {
        this.baseURL = 'https://seecoderun.firebaseio.com';
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

        //New Firebase share Reference
        let firebase = new Firebase(this.baseURL);
        this.pastebinIdshare = firebase.push().key();


        //Create old and new references
        let baseURL = 'https://seecoderun.firebaseio.com';

        let oldRef = new Firebase(baseURL + '/' + this.pastebinId);
        let newRef = new Firebase(baseURL + '/' + this.pastebinIdshare);


        //Concatenate SeeCode.Run base URL and new Share ID 
        var shareFirebaseRef2 = 'https://seecode.run/#' + this.pastebinIdshare;

        //Place new share Firebase URL in Share text box
        document.getElementById("copyTarget").value = shareFirebaseRef2;

        //Copy Event Listener that triggers copying from the Old Pastebin ID to the New Shared One && Copying the New Pastebin Link
        document.getElementById("copyButton").addEventListener("click", function() {
            copyFbRecord(oldRef, newRef);
            copyToClipboard(document.getElementById("copyTarget"));
        });

        //Copy From Current Pastebin's Firebase ID to New Shared Pastebin's Firebase ID
        function copyFbRecord(oldFB, newFB) {
            oldFB.once("value", function(snapshot) {
                newFB.set(snapshot.val(), function(error) {
                    if (error && typeof(console) !== 'undefined' && console.error) {
                        console.error(error);
                    }
                    console.log(snapshot.val());

                });

            });

        }

        //Toggle Share Box
        $(document).ready(function setUpShareBox() {
            $('#shareDiv').hide();

            $('#share').click(function hideShareBox() {
                $('#shareDiv').toggle();
            });

        });

        //Copy Function
        function copyToClipboard(elem) {

            var targetId = "_hiddenCopyText_";
            var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
            var origSelectionStart, origSelectionEnd;
            if (isInput) {
                target = elem;
                origSelectionStart = elem.selectionStart;
                origSelectionEnd = elem.selectionEnd;
            }
            else {
                target = document.getElementById(targetId);
                if (!target) {
                    var target = document.createElement("textarea");
                    target.style.position = "absolute";
                    target.style.left = "-9999px";
                    target.style.top = "0";
                    target.id = targetId;
                    document.body.appendChild(target);
                }
                target.textContent = elem.textContent;
            }
            var currentFocus = document.activeElement;
            target.focus();
            target.setSelectionRange(0, target.value.length);

            var succeed;
            try {
                succeed = document.execCommand("copy");
            }
            catch (e) {
                succeed = false;
            }

            if (currentFocus && typeof currentFocus.focus === "function") {
                currentFocus.focus();
            }

            if (isInput) {

                elem.setSelectionRange(origSelectionStart, origSelectionEnd);
            }
            else {

                target.textContent = "";
            }
            return succeed;
        }
    }
}