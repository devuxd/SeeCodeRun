import {customElement} from 'aurelia-framework';

import $ from 'jquery';
import { draggable, resizable } from 'jquery-ui';

import FirepadUserList from '../../include/firepad-user-list';

@customElement('user-list')
export class UserList{
  constructor(firebaseManager, eventAggregator){
      this.firebaseManager = firebaseManager;
      this.eventAggregator = eventAggregator;
  }

  attached(){
      let userList = document.getElementById('userlist');
      let $userList = $(userList);
      $userList.hide();

      this.eventAggregator.subscribe("pastebinReady", () => {
          let pastebinFirebaseReference = this.firebaseManager.makePastebinFirebaseReference();

          this.userId = Math.floor(Math.random() * 9999999999).toString();
          this.firepadUserList = FirepadUserList.fromDiv(pastebinFirebaseReference.child('users'),
              userList, this.userId);

           $('#userlistButton').click(function hideUserList() {
             if($userList.is(":visible")){
                $("#userlistButton span").removeClass("navigation-bar-active-item");
                $("#userlistButton label").removeClass("navigation-bar-active-item");
            }else{
                $("#userlistButton span").addClass("navigation-bar-active-item");
                $("#userlistButton label").addClass("navigation-bar-active-item");
            }
            $userList.toggle();
           });

          $userList.draggable();
          $userList.resizable({
                handles: "n, e, s, w"
          });
      });

  }

}