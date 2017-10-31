// /*global $ */
// import {bindable} from 'aurelia-framework';
//
// import {UserList} from '../userList/user-list';
// import {ShareBox} from '../share/share-box';
// import {Chat} from '../chat/chat';
//
// import {HistoryViewer} from '../historyViewer/history-viewer';
//
// export class NavigationBar {
//   @bindable router = null;
//
//   constructor(firebaseManager, eventAggregator) {
//     this.firebaseManager = firebaseManager;
//     this.shareBox = new ShareBox(firebaseManager, eventAggregator);
//     this.userList = new UserList(firebaseManager, eventAggregator);
//     this.chatBox = new Chat(firebaseManager, eventAggregator);
//     this.historyViewer = new HistoryViewer(firebaseManager, eventAggregator);
//   }
//
//   attached() {
//     this.makeRightNavigationCompact();
//     this.shareBox.attached();
//     this.userList.attached();
//     this.chatBox.attached();
//     this.historyViewer.attached();
//
//     $('.navbar-toggle').click();
//   }
//
//   makeRightNavigationCompact(){
//     $("#navbar-collapse-right > li").each(function eachNavItem(){
//       let $navItem = $(this);
//
//       $navItem.find("label").css("display","none");
//       let navItemTitle = $navItem.find("label").text();
//       $navItem.attr("title", navItemTitle);
//     });
//   }
// }


import React, {Component} from 'react';
import scrLogo from '../res/scrLogo.png';
import {Navbar, NavbarBrand, NavbarToggler, Collapse, Nav, NavItem, NavLink} from 'reactstrap';

class NavigationBar extends Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.shareClick = this.shareClick.bind(this);
    this.chatClick = this.chatClick.bind(this);

    this.state = {
      isOpen: false,
      isShareToggled:false,
      isChatToggled:false
    };
  }

  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }

  logoClick() {
    window.open('https://seecode.run/', '_blank');
  }

  shareClick(){
    this.setState({
      isShareToggled: !this.state.isShareToggled
    });
  }

  chatClick(){
    this.setState({
      isChatToggled: !this.state.isChatToggled
    });
  }

  helpClick(){
    window.open('https://github.com/tlatoza/SeeCodeRun/wiki/SeeCode.Run-Help!', '_blank');
  }

  contactUsClick(){
    window.open('mailto:contact@seecode.run', '_blank');
  }

  aboutClick(){
    window.open('https://github.com/tlatoza/SeeCodeRun/wiki/About-SeeCode.Run', '_blank');
  }

  render() {
    return (
      <Navbar light expand="md" className="fixed-top">
        <NavbarBrand href="#">
          <img src={scrLogo} className="scr-logo" alt="SCR" onClick={this.logoClick}/>
        </NavbarBrand>
        <NavbarToggler onClick={this.toggle}/>
        <Collapse isOpen={this.state.isOpen} navbar>
          <Nav className="navbar-left" navbar>
            <NavItem id="historyListItem">
              <NavLink>
                <div id="historyBox">
                  {/*<history-viewer historyViewer.bind="historyViewer"></history-viewer>*/}
                </div>
                <span id="historyButton">
                  History
                  {/*History<i class="material-icons">history</i>*/}
                </span>
              </NavLink>
            </NavItem>
          </Nav>
          <Nav className="ml-auto" navbar>

            <NavItem>
                <div id="shareBox">
                  {/*<share-box shareBox.bind="shareBox"></share-box>*/}
                </div>
                <NavLink href="#" onClick={this.shareClick} active={this.state.isShareToggled} id="shareButton" >
                  Share
                </NavLink>
            </NavItem>
            <NavItem>
              <NavLink href="#" onClick={this.chatClick} active={this.state.isChatToggled} id="chatButton">
                Chat
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink href="#" onClick={this.helpClick}>
                Help
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink href="#" onClick={this.contactUsClick}>
                Contact Us
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink href="#" onClick={this.aboutClick}>
                About
              </NavLink>
            </NavItem>
          </Nav>
        </Collapse>
      </Navbar>

    );
  }
}

export default NavigationBar;





