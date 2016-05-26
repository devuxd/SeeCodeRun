/* global $ */

import FirepadUserList from '../../include/firepad-user-list';

export class UserList{
  constructor(firebaseManager){
      this.firebaseManager = firebaseManager;
  }
  
  attached(){
      let $userList = $('#userlist');
      $userList.hide();
      let pastebinFirebaseReference = this.firebaseManager.makePastebinFirebaseReference();
      this.userId = Math.floor(Math.random() * 9999999999).toString();
      this.firepadUserList = FirepadUserList.fromDiv(pastebinFirebaseReference.child('users'),
          document.getElementById('userlist'), this.userId);
          
    $('#hideUserList').click(function hideUserList() {
      $userList.toggle();
      let isVisible = $userList.is( ":visible" );
      if(isVisible){
        $userList.draggable();
        $userList.resizable({
          handles: "n, e, s, w"
        });
      }
    });
  }
    
}