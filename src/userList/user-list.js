import {customElement} from 'aurelia-framework';

import $ from 'jquery';
import { draggable, resizable } from 'jquery-ui';

import FirepadUserList from '../../include/firepad-user-list';

@customElement('user-list')
export class UserList{
  constructor(firebaseManager){
      this.firebaseManager = firebaseManager;
  }
  
  attached(){
      let $userList = $('#userlist');
      $userList.hide();
      let userList = document.getElementById('userlist');
      let pastebinFirebaseReference = this.firebaseManager.makePastebinFirebaseReference();
      this.userId = Math.floor(Math.random() * 9999999999).toString();
      this.firepadUserList = FirepadUserList.fromDiv(pastebinFirebaseReference.child('users'),
          userList, this.userId);
          
      $('#userlistButton').click(function hideUserList() {
        $userList.toggle();
       });
      
      $userList.draggable();
      $userList.resizable({
            handles: "n, e, s, w"
      });
  }
    
}