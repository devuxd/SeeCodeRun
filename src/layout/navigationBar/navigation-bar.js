/*global $ */ 
import {bindable} from 'aurelia-framework';


import {UserList} from '../../userList/user-list';
import {ShareBox} from '../../share/share-box';
import {Chat} from '../../chat/chat';

export class NavigationBar {
  @bindable router = null
  
  constructor(firebaseManager){
      this.firebaseManager = firebaseManager;
      this.shareBox = new ShareBox(firebaseManager);
      this.userList = new UserList(firebaseManager);
      this.chatBox = new Chat(firebaseManager);
  }
  
  attached(){
      this.shareBox.attached();
      this.userList.attached();
      this.chatBox.attached();
      
      $('.navbar-toggle').click();
  }
}