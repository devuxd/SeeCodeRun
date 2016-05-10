/* global Firebase */
/* global $ */

export class Chat {

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

    var chatFirebaseRef = new Firebase(this.baseURL + '/' + this.pastebinId + '/content/chat');

    var messageField = $('#messageInput');
    var nameField = $('#nameInput');
    var messageList = $('#seecoderun-messages');

    messageField.keypress(function(e) {
      if (e.keyCode == 13) {
        var username = nameField.val();
        var message = messageField.val();

        chatFirebaseRef.push({
          name: username,
          text: message
        });
        messageField.val('');
      }
    });

    chatFirebaseRef.limitToLast(10).on('child_added', function(snapshot) {

        var data = snapshot.val();
        var username = data.name;
        var message = data.text;
  
        var messageElement = $("<li>");
        var nameElement = $("<strong class='seecoderun-chat-username'></strong>");
        nameElement.text(username);
        messageElement.text(message).prepend(nameElement);
  
        messageList.append(messageElement);
        messageList[0].scrollTop = messageList[0].scrollHeight;
    });

    $('#chatDiv').hide();
    
    $('#hide').click(function hideChatBox() {
      $('#chatDiv').toggle();
    });
    
    if( $('#chatDiv').draggable){
      $('#chatDiv').draggable();
    }
    
    $('#chatDiv').resizable({
      handles: "n, e, s, w"
    });

  }
}
