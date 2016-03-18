/* global Firepad */
/* global Firebase */
/* global ace */
import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import '../mode-javascript';
import '../theme-chrome';

@inject(EventAggregator)
export class Chat {
  
  constructor(eventAggregator) {
    this.eventAggregator = eventAggregator;
  }
  
  attached() {
    
    //New Firebasechat Reference
    var chatFirebaseRef = new Firebase(baseURL + '/' + uniqueCodeURL)
    
    
        // CREATE A REFERENCE TO FIREBASE
     // var messagesRef = new Firebase('https://j3v3r219xav.firebaseio-demo.com/');
    
      // REGISTER DOM ELEMENTS
      var messageField = $('#messageInput');
      var nameField = $('#nameInput');
      var messageList = $('#seecoderun-messages');
    
      // LISTEN FOR KEYPRESS EVENT
      messageField.keypress(function (e) {
        if (e.keyCode == 13) {
          //FIELD VALUES
          var username = nameField.val();
          var message = messageField.val();
    
          //SAVE DATA TO FIREBASE AND EMPTY FIELD
          chatFirebaseRef.push({name:username, text:message});
          messageField.val('');
        }
      });
    
      // Add a callback that is triggered for each chat message.
      chatFirebaseRef.limitToLast(10).on('child_added', function (snapshot) {
        //GET DATA
        var data = snapshot.val();
        var username = data.name;
        var message = data.text;
    
        //CREATE ELEMENTS MESSAGE & SANITIZE TEXT
        var messageElement = $("<li>");
        var nameElement = $("<strong class='seecoderun-chat-username'></strong>")
        nameElement.text(username);
        messageElement.text(message).prepend(nameElement);
    
        //ADD MESSAGE
        messageList.append(messageElement)
    
        //SCROLL TO BOTTOM OF MESSAGE LIST
        messageList[0].scrollTop = messageList[0].scrollHeight;
      });
    
    //End Firebase Code
    
    
    	//Chat show/hide
	
		$(document).ready(function(){
    $('#chatDiv').hide();
    $('#hide').click(function(){
        $('#chatDiv').toggle();
    });        
});
    //Chat box draggable       
    $(function() {
    $( "#chatDiv" ).draggable();
  });
  
  
  
  //Chat box resizable    
      $(function() {
    $( "#chatDiv" ).resizable({ handles: "n, e, s, w, ne, se, sw, nw"});
  });
    
   
    this.subscribe();
  }

  
  subscribe() {
    let ea = this.eventAggregator;
    let session = this.session;
    
    ea.subscribe('onEditorChanged', payload => {
      let doc = session.doc;
      
      doc.removeLines(0, doc.getLength());
      
      // TODO: fix uncaught length error
      doc.insertLines(0, new Array(payload.length - 1));
      
      for(let result of payload.syntax) {
        doc.insertInLine({
          row: result.location.row,
          column: result.location.col
        }, result.content);
      }
    });
  }
}

