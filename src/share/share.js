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
    let firebase = new Firebase(this.baseURL);
    this.pastebinIdshare = firebase.push().key();
   
   //Concatenate SeeCode.Run base URL and new Share ID 
    var shareFirebaseRef2 = 'https://seecode.run/#' + this.pastebinIdshare;

    //Place new share Firebase URL in Share text box
    document.getElementById("copyTarget").value = shareFirebaseRef2;
    
    //Copy Event Listener that triggers copying from the Old Pastebin ID to the New Shared One && Copying the New Pastebin Link
    document.getElementById("copyButton").addEventListener("click", function() {
        copyToClipboard(document.getElementById("copyTarget"));
        copyFbRecord(this.pastebinId, this.pastebinIdshare);
    });
    
     //Copy From Current Pastebin's Firebase ID to New Shared Pastebin's Firebase ID
    function copyFbRecord(oldFB, newFB) {   
              let shareBaseURL = 'https://seecoderun.firebaseio.com';
              //let firebase = new Firebase(shareBaseURL);
              //let fb = new Firebase(shareBaseURL);
    
              
              var oldFbRef = new Firebase(shareBaseURL + '/' + oldFB);
              var newFbRef = new Firebase(shareBaseURL + '/' + newFB);
              
              //ignore child, want to call val() from baseURL + '/' + oldFB (needs to be a string)
              //then set to baseURL + '/' + newFB
              
            //var fredRef = new Firebase("https://docs-examples.firebaseio.com/samplechat/users/fred");
            // fredRef.once("value", function(snapshot) {
            //   var data = snapshot.val();
            //  data equals { "name": { "first": "Fred", "last": "Flintstone" }, "age": 53 }
              
           
           
            //   let fbOld = fb.child(oldFB);
            //   let fbNew = fb.child(newFB);
              
             oldFbRef.once('value', function(snapshot)  {
                  newFbRef.set( snapshot.val(), function(error) {
                       if( error && typeof(console) !== 'undefined' && console.error ) {  console.error(error); }
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