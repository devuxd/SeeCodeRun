import {customElement} from 'aurelia-framework';
import {BindingLanguage} from 'aurelia-framework';

import $ from 'jquery';
import { draggable, resizable } from 'jquery-ui';

//there is a simple way:
//http://stackoverflow.com/questions/221294/how-do-you-get-a-timestamp-in-javascript
// export function configure(aurelia)
// {
//   aurelia.use;
//     .standardConfiguration()
//     .developmentLogging();
//   aurelia.use.plugin('aurelia-date-observer');
  
// }
@customElement('chat')
export class Chat {
  currentUsername = ""; //defining variables
  currentUsercolor = "";
  isFirstToggle = true;
  constructor(firebaseManager) {
    this.firebaseManager = firebaseManager;
  }
  
  attached() {
    let chatFirebaseRef = this.firebaseManager.makeChatFirebase(); //declaring chatFirebaseRef variable and self
    let self = this;
    
    let $chat = $('#chatDiv');
    $chat.hide();                                 //hides the chat box

    let $chatToolbar= $('#chatToolbar');    //is this calling from html file?
    let $chatUserNameInput = $('#chatUserNameInput');
    let $chatMessages = $('#chatMessages');
    let $chatMessageInput = $('#chatMessageInput');
    
    let userToColorMap = {};  //??
    let colors = [];        //making array for colors
    
    chatFirebaseRef.on("value", function(snapshot) {
        let data = snapshot.val(); //is this taking value from firebase?
        if(!data){
          return;
        }
        let username = data.name; //data  from firebase
        let color = data.color;
        
        if(color){
          userToColorMap[username] = color; //??
          colors.push(color);   //adding to the array of colors
        }
    }, function (errorObject) {
      console.log("Chat read failed: " + errorObject.code); //raising error
    });
    
    $chatUserNameInput.keyup(function(e) {
      if (e.keyCode == 13) {
        $chatMessageInput.focus();
      }
        let username = $chatUserNameInput.val();
        if(!username.trim().length){
          username = "anonymous";
        }
        
        let color = userToColorMap[username];
        
        if(color){
          self.currentUsercolor = color;
          $chatToolbar.css("border-color", `#${color}`);
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
        let color = self.currentUsercolor;
        
        if(!color){
          do{
            color = "000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);});
          }while(colors.indexOf(color)> -1);
        }
        self.currentUsercolor = color;
        
        chatFirebaseRef.push({
          name: username,
          text: message,
          color: color
        });
        $chatMessageInput.val('');
        $("#chatMessageFeedbackSent").css("display", "inline").fadeOut(1000);
          
        $(`#${username} .seecoderun-chat-username`).each( function() {
          if($(this).html() === username){
            $(this).html('You');
          }
        });
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
        
        if(color){
          userToColorMap[username] = color;
          colors.push(color);
        }
  
        let $messageElement = $(`<li id =${username}>`);
        $messageElement.css("border-color", `#${color}`);
        let $nameElement = $(`<strong class='seecoderun-chat-username'></strong>`);
        $nameElement.text(username);
        $messageElement.text(message).prepend('<br />').prepend($nameElement);
  
        $chatMessages.append($messageElement);
        
        $("#chatMessageFeedbackSent").css("display", "inline").fadeOut(1000);
        
        if(self.currentUsername === username){
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
}
