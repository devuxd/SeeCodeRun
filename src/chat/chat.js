/* global Firebase */
/* global $ */
import {draggable, resizable} from "jquery-ui";

import {useView} from 'aurelia-framework';

@useView('./chat.html')
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
    
    let chatFirebaseRef = new Firebase(this.baseURL + '/' + this.pastebinId + '/content/chat');
    let $chat = $('#chatDiv');
    
    $chat.hide();
    
    let attachedAfterHTML = function attachedAfterHTML(){
  
      let messageField = $('#messageInput');
      let nameField = $('#nameInput');
      let messageList = $('#seecoderun-messages');
  
      messageField.keypress(function(e) {
        if (e.keyCode == 13) {
          let username = nameField.val();
          let message = messageField.val();
  
          chatFirebaseRef.push({
            name: username,
            text: message
          });
          messageField.val('');
        }
      });
  
      chatFirebaseRef.limitToLast(10).on('child_added', function child_added(snapshot) {
  
          let data = snapshot.val();
          let username = data.name;
          let message = data.text;
    
          let messageElement = $("<li>");
          let nameElement = $("<strong class='seecoderun-chat-username'></strong>");
          nameElement.text(username);
          messageElement.text(message).prepend(nameElement);
    
          messageList.append(messageElement);
          messageList[0].scrollTop = messageList[0].scrollHeight;
      });
  
      $('#hide').click(function hideChatBox() {
        $chat.toggle();
      });
      
      
     $chat.draggable();
      
      
      $chat.resizable({
        handles: "n, e, s, w"
      });
      
    };
    
    this.attachedAfterHTML = attachedAfterHTML;

  }
}
