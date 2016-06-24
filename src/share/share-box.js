import $ from 'jquery';

export class ShareBox {
    selectedEffect = "fold";

    constructor(firebaseManager) {
        this.firebaseManager = firebaseManager;
    }

    attached() {
        let self = this;
        $('#shareBox').hide();
        $('#shareButton').click(function hideShareBox() {
            if($("#shareBox").is(":visible")){
                $("#shareButton span").removeClass("navigation-bar-active-item");
                $("#shareButton label").removeClass("navigation-bar-active-item");
            }else{
                $("#shareButton span").addClass("navigation-bar-active-item");
                $("#shareButton label").addClass("navigation-bar-active-item");
            }
            $("#shareBox").toggle("slide", { direction: "right" }, 1000);
        });
        
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