import {customElement} from 'aurelia-framework';

import $ from 'jquery';
import { draggable, resizable } from 'jquery-ui';

@customElement('chat')
export class Chat {
  currentUsername = "";
  currentUsercolor = "";
  isFirstToggle = true;
  colors = [];
  userToColorMap = {};
  
  constructor(firebaseManager) {
    this.firebaseManager = firebaseManager;
  }
  
  attached() {
    let chatFirebaseRef = this.firebaseManager.makeChatFirebase();
    let self = this;
    
    let $chat = $('#chatDiv');
    $chat.hide();

    let $chatToolbar= $('#chatToolbar');
    let $chatUserNameInput = $('#chatUserNameInput');
    let $chatMessages = $('#chatMessages');
    let $chatMessageInput = $('#chatMessageInput');
    
    chatFirebaseRef.on("value", function(snapshot) {
        let data = snapshot.val();
        if(!data){
          return;
        }
        let username = data.name;
        let color = data.color;
        
        if(color){
          self.updateUserToColorMapping(color, username);
        }
    }, function (errorObject) {
      console.log("Chat read failed: " + errorObject.code);
    });
    
    $chatUserNameInput.keyup(function(e) {
      if (e.keyCode == 13) {
        $chatMessageInput.focus();
      }
        let username = $chatUserNameInput.val();
        if(!username.trim().length){
          username = "anonymous";
        }
        
        self.currentUsercolor = self.userToColorMap[username];
        
        if(self.currentUsercolor){
          $chatToolbar.css("border-color", `#${self.currentUsercolor}`);
        }else{
          $chatToolbar.css("border-color", "initial");
        }
        
        if(!username){
          username = "anonymous";
        }
        
        self.currentUsername = username;
    });
    
    $chatMessageInput.keypress(function(e) {
      if (e.keyCode == 13) {
        
        let message = $chatMessageInput.val();
        
        if(!message.trim().length){
          $("#chatMessageFeedbackNotSent").css("display", "inline").fadeOut(750);
          return;
        }
        
        let username = $chatUserNameInput.val();
        if(!username.trim().length){
          username = "anonymous";
        }
        self.currentUsername = username;
        
        if(!self.currentUsercolor){
          self.currentUsercolor =self.getRandomColor(self.currentUsercolor);
          self.updateUserToColorMapping(self.currentUsercolor, username);
        }
        
        chatFirebaseRef.push({
          name: username,
          text: message,
          color: self.currentUsercolor,
          timestamp: Firebase.ServerValue.TIMESTAMP
          
        });
        $chatMessageInput.val('');
        $("#chatMessageFeedbackSent").css("display", "inline").fadeOut(1000);
        
        // todo: if user changes names or a match happens while it type, it corrupts naming. needs shadow ids
        // $(`#${username} .seecoderun-chat-username`).each( function() {
        //   if($(this).html() === username){
        //     $(this).html('You');
        //   }
        // });
      }
    });
    
    chatFirebaseRef.limitToLast(100).on('child_added', function child_added(snapshot) {

        let data = snapshot.val();
        if(!data){
          return;
        }
        
        let username = data.name;
        let message = data.text;
        let color = data.color;
        let timestamp = data.timestamp;
        
        if(color){
          self.updateUserToColorMapping(color, username);
        }
  
        let $messageElement = $(`<li id =${username}>`);
        $messageElement.css("border-color", `#${color}`);
        let $nameElement = $(`<strong class='seecoderun-chat-username'></strong>`);
        $nameElement.text(username);
        let $timestampElement = $(`<strong class='seecoderun-chat-timestamp'></strong>`);
        $timestampElement.text(timestamp);
        
        $messageElement.text(message).prepend('<br />').prepend($timestampElement).prepend($nameElement);
  
        $chatMessages.append($messageElement);
        
        $("#chatMessageFeedbackSent").css("display", "inline").fadeOut(1000);
        
        if(self.currentUsername === username){
          $chatToolbar.css("border-color", `#${color}`);
          $chatMessages.stop().animate({
            scrollTop: $chatMessages[0].scrollHeight
          }, 1000);
        }
    });
    
    
    $('#chatButton').click(function hideChatBox() {
      $chat.toggle();
      if(self.isFirstToggle){
        $chatMessages.scrollTop($chatMessages[0].scrollHeight);
        $chatUserNameInput.focus();
        self.isFirstToggle = false;
      }else{
        $chatMessageInput.focus();
      }
    });

    $chat.draggable();
    $chat.resizable({
      handles: "n, e, s, w"
    });
  }
  
  getRandomColor(color, colors = this.colors){
    do{
        color = "000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);});
      }while(colors.indexOf(color)> -1);
    return color;
  }
  
  updateUserToColorMapping(color, username, self = this){
    self.userToColorMap[username] = color;
    self.colors.push(color);
  }
    
}
