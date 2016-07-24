/*global $ */
import {bindable} from 'aurelia-framework';

import {UserList} from '../userList/user-list';
import {ShareBox} from '../share/share-box';
import {Chat} from '../chat/chat';

import {HistoryViewer} from '../historyViewer/history-viewer';

export class NavigationBar {
  @bindable router = null;

  constructor(firebaseManager, eventAggregator){
      this.firebaseManager = firebaseManager;
      this.shareBox = new ShareBox(firebaseManager);
      this.userList = new UserList(firebaseManager);
      this.chatBox = new Chat(firebaseManager);
      this.historyViewer = new HistoryViewer(firebaseManager, eventAggregator);
  }

  attached(){
      this.shareBox.attached();
      this.userList.attached();
      this.chatBox.attached();
      this.historyViewer.attached();

      $('.navbar-toggle').click();
  }
}