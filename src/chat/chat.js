import {customElement} from 'aurelia-framework';

import $ from 'jquery';
import { draggable, resizable } from 'jquery-ui';

@customElement('chat')
export class Chat {
  seecoderunChatTimestampSelector = ".seecoderun-chat-timestamp";
  updateMessagesIntervalTime = 86400000;
  currentUsername = "";
  currentUsercolor = "";
  isFirstToggle = true;
  colors = [];
  userToColorMap = {};

  constructor(firebaseManager) {
    this.firebaseManager = firebaseManager;
  }

  updateMessagesTimes(){
    let self = this;
    $(self.seecoderunChatTimestampSelector).each( function updateMessageTimeText(){
        let timestamp = $(this).data("timestamp");
        if(timestamp){
          $(this).text(self.getFormattedTime(timestamp));
        }
      });
  }

  updateMessageUsername(username){
    $(".seecoderun-chat-username").each( function() {
          let messageUsername = $(this).data("username");
          if(username === messageUsername){
            $(this).text("You");
          }else if(messageUsername && messageUsername !== $(this).text()){
            $(this).text(messageUsername);
          }
    });
  }

  updateMessagesColors(){
      $(".seecoderun-chat ul li").each( function() {
          let messageColor = $(this).data("color");
          if(!messageColor){
            return;
          }
          messageColor = `#${messageColor}`;
          if($(this).css("border-color") !== messageColor){
            $(this).css("border-color", messageColor);
          }
      });
  }

  attached() {
    let self = this;
    let chatFirebaseRef = this.firebaseManager.makeChatFirebase();

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
          timestamp: self.firebaseManager.SERVER_TIMESTAMP

        });
        $chatMessageInput.val('');
        $("#chatMessageFeedbackSent").css("display", "inline").fadeOut(1000);
        self.updateMessageUsername(username);
      }
    });
    let previousUsername = null;
    let previousFormattedTime = null;
    chatFirebaseRef.limitToLast(100).on('child_added', function child_added(snapshot) {

        let data = snapshot.val();
        if(!data){
          return;
        }

        let username = data.name;
        let message = data.text;
        let color = data.color;
        let timestamp = data.timestamp;
        let formattedTime = self.getFormattedTime(timestamp);

        if(color){
          self.updateUserToColorMapping(color, username);
        }

        let $messageElement = $(`<li data-color ='${color}'>`);
        $messageElement.css("border-color", `#${color}`);
        let $nameElement = $(`<strong class='seecoderun-chat-username' data-username ='${username}'></strong>`);
        $nameElement.text(username);
        let $timestampElement = $(`<span class='seecoderun-chat-timestamp'data-timestamp ='${timestamp}'></span>`);
        $timestampElement.text(formattedTime);

      if (previousUsername == username && previousFormattedTime == formattedTime) {
        $messageElement.text(message);
      } else {
        $messageElement.text(message).prepend('<br/>').prepend($timestampElement).prepend($nameElement);
      }
      previousUsername = username;
      previousFormattedTime = formattedTime;

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
        if($chat.is(":visible")){
            $("#chatButton span").removeClass("navigation-bar-active-item");
            $("#chatButton label").removeClass("navigation-bar-active-item");
            clearInterval(self.updateMessagesInterval);
        }else{
            $("#chatButton span").addClass("navigation-bar-active-item");
            $("#chatButton label").addClass("navigation-bar-active-item");
            self.updateMessagesTimes();
            self.updateMessagesInterval = window.setInterval(
              function updateMessagesInterval()
              {
                self.updateMessagesTimes();
              },
            self.updateMessagesIntervalTime);
        }

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

  getFormattedTime(timestamp){
    //Facebook Messenger Format
    let date = new Date(timestamp);
    let currentTime = new Date();
    let elapsedTimeInMs = currentTime.getTime() - date.getTime();
    let formattedTime = date.getHours() + ":" + date.getMinutes();
    let dayInMs = 86400000;
    if (elapsedTimeInMs > dayInMs)
    {
      let dayOfTheWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      formattedTime = dayOfTheWeek[date.getDay()] + " AT " + formattedTime;
    }

    return formattedTime;
  }

}
