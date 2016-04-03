/* global Firepad */
/* global Firebase */
/* global ace */



export class Chat {
  
  constructor(baseURL, pastebinId) {
    this.baseURL = baseURL;
    this.pastebinId = pastebinId;
  }
  

  attached() {
    
    //New Firebase chat Reference
    var chatFirebaseRef = new Firebase(this.baseURL + '/' + this.pastebinId + '/content/chat');
    
    
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
    
    //Chat Box User Interface
    
		$(document).ready(function(){
    $('#chatDiv').hide();
    $('#hide').click(function(){
        $('#chatDiv').toggle();
    }); 
    
     $('#chatDiv').draggable();
    
 });
 
  
  //Chat box draggable   	
    $(function() {
    $("#chatDiv").draggable();
  });
  
  //Chat box resizable    
    $(function() {
    $("#chatDiv").resizable({ handles: "n, e, s, w, ne, se, sw, nw"});
  });
 
   
  }
}

