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
    else {
      let firebase = new Firebase(this.baseURL);
      this.pastebinId = firebase.push().key();
    }
  }

  attached(params) {
    if (params.id) {
      this.pastebinId = params.id;
    }

    //New Firebase share Reference
    var shareFirebaseRef = new Firebase(this.baseURL + '/' + this.pastebinId);

    $(document).ready(function setUpShareBox() {
          $('#shareDiv').hide();
          
          $('#share').click(function hideShareBox() {
            $('#shareDiv').toggle();
          });
        
        });


    document.getElementById("copyTarget").value = shareFirebaseRef;
    
    document.getElementById("copyButton").addEventListener("click", function() {
        copyToClipboard(document.getElementById("copyTarget"));
    });
    
    function copyToClipboard(elem) {
    
        var targetId = "_hiddenCopyText_";
        var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
        var origSelectionStart, origSelectionEnd;
        if (isInput) {
            target = elem;
            origSelectionStart = elem.selectionStart;
            origSelectionEnd = elem.selectionEnd;
        } else {
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
        } catch(e) {
            succeed = false;
        }
    
        if (currentFocus && typeof currentFocus.focus === "function") {
            currentFocus.focus();
        }
        
        if (isInput) {
    
            elem.setSelectionRange(origSelectionStart, origSelectionEnd);
        } else {
    
            target.textContent = "";
        }
        return succeed;
    }
  }
}