import {customElement} from 'aurelia-framework';

import $ from 'jquery';
import { draggable, resizable } from 'jquery-ui';

@customElement('share-box')
export class ShareBox {

    constructor(firebaseManager) {
        this.firebaseManager = firebaseManager;
    }

    attached() {
        let self = this;
        $('#shareBox').hide();

        $('#shareButton').click(function hideShareBox() {
            $('#shareBox').toggle();
        });
        
        // $('#shareDiv').draggable();
        
        // $('#shareDiv').resizable({
        //   handles: "n, e, s, w"
        // });
        
        let firebaseManager = this.firebaseManager;
        this.pastebinIdshare = firebaseManager.makeNewPastebinFirebaseReferenceId();
        
        let oldRef = firebaseManager.makePastebinFirebaseReference();
        let newRef = firebaseManager.makePastebinFirebaseReference(this.pastebinIdshare);

        let shareFirebaseRef2 = 'https://seecode.run/#' + this.pastebinIdshare;
        let copyButton = document.getElementById("copyButton");
        let copyTarget = document.getElementById("copyTarget");
        copyTarget.value = shareFirebaseRef2;

        copyButton.addEventListener("click", function() {
            firebaseManager.makePastebinFirebaseReferenceCopy(oldRef, newRef);
            self.copyToClipboard(copyTarget);
        });
    }
    
    copyToClipboard(elem) {
        let target = undefined;
        let targetId = "_hiddenCopyText_";
        let isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
        let origSelectionStart, origSelectionEnd;
        if (isInput) {
            target = elem;
            origSelectionStart = elem.selectionStart;
            origSelectionEnd = elem.selectionEnd;
        }
        else {
            target = document.getElementById(targetId);
            if (!target) {
                target = document.createElement("textarea");
                target.style.position = "absolute";
                target.style.left = "-9999px";
                target.style.top = "0";
                target.id = targetId;
                document.body.appendChild(target);
            }
            target.textContent = elem.textContent;
        }
        let currentFocus = document.activeElement;
        target.focus();
        target.setSelectionRange(0, target.value.length);

        let succeed;
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