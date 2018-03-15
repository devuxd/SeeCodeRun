import $ from 'jquery';
import 'jquery-ui/themes/base/core.css';
import 'jquery-ui/themes/base/theme.css';
import 'jquery-ui/themes/base/draggable.css';
import 'jquery-ui/themes/base/resizable.css';
import 'jquery-ui/ui/core';
import 'jquery-ui/ui/widgets/draggable';
import 'jquery-ui/ui/widgets/resizable';
import classnames from 'classnames';
import React, {Component} from 'react';
import localStorage from 'store';
import {withStyles} from 'material-ui/styles';
import Card, {CardHeader, CardContent} from 'material-ui/Card';
import Avatar from 'material-ui/Avatar';
import IconButton from 'material-ui/IconButton';
import Menu, {MenuItem} from 'material-ui/Menu';
import ChatIcon from 'material-ui-icons/Chat';
import TextField from 'material-ui/TextField';

import {configureFirecoChat} from "../redux/modules/fireco";
import AutoComplete from "../components/AutoComplete";
import {List, ListItem} from "material-ui";

const defaultChatStyle = {
  minWidth: 300,
  minHeight: 88,
  left: 100,
  right: 'unset',
  top: 'unset',
  bottom: 0,
  width: 300,
  height: 168,
};

const styles = theme => ({
  chat: {
    boxShadow: '0px 5px 50px rgba(0, 0, 0, .4)',
    overflow: 'hidden',
    position: 'fixed',
    minWidth: defaultChatStyle.minWidth,
    minHeight: defaultChatStyle.minHeight,
  },
  chatContent: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column-reverse',
  },
  hidden: {
    display: 'none',
  },
  avatarMenu: {
    overflow: 'auto',
  },
  input: {
    // margin: 'auto',
  },
  messageChatIcon: {
    // margin: 'auto',
  },
  messageTextField: {
    // margin: 'auto',
  },
  subHeader: {
    color: 'blue',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  actions: {
    order: 1,
    flexDirection: 'row',
    flexGrow: 0,
    height: defaultChatStyle.minHeight,
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  },
  expand: {
    display: 'block',
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'transparent',
    transform: 'rotate(0deg)',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  chatMessages: {
    order: 2,
    flexBasis: 'fit-content',
    overflow: 'auto',
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
  avatar: {
    backgroundColor: theme.palette.grey[400],
  },
  avatarSet: {
    backgroundColor: theme.palette.primary.main,
  },
});

class Chat extends Component {
  state = {
    ...defaultChatStyle,
    avatarAnchorEl: null,
    chatUserId: null,
    chatUserName: '',
    chatMessageText: '',
    chatAvatarWarning: null,
    chatMessageWarning: null,
    chatError: null,
    users: null,
    messages: []
    // restoreHeight: defaultChatStyle.height,
  };

  prevUsers = null;
  userSuggestions = null;

  firecoChat = null;
  SERVER_TIMESTAMP = null;
  chatUserIdLocalStoragePath = null;
  updateMessagesInterval = null;
  updateMessagesIntervalTime = 86400000;
  dayOfTheWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];


  handleMessageTextChange = e => {
    const chatMessageText = e.target.value || '';
    this.setState({
      chatMessageText: chatMessageText,
      chatAvatarWarning: this.state.chatUserId ? null : this.state.chatAvatarWarning,
      chatMessageWarning: null,
      chatError: null,
    })
  };

  handleMessageInputEnter = e => {
    if (e.keyCode === 13) {
      this.handleSendMessage();
    }
  };

  handleSendMessage = () => {
    const {
      chatUserId,
      chatMessageText
    } = this.state;

    if (!chatUserId) {
      this.setState({
        chatAvatarWarning: 'Select an user first.',
        chatMessageWarning: null,
        chatError: null,
      });
    } else {
      if (chatMessageText.trim().length) {
        this.firecoChat.child('messages').push({
          chatUserId: chatUserId,
          text: chatMessageText,
          timestamp: this.SERVER_TIMESTAMP
        }, error => {
          this.setState({
            chatAvatarWarning: null,
            chatMessageWarning: null,
            chatError: error ? 'Message could not be sent.' : null,
            chatMessageText: error ? chatMessageText : '',
          });
        });

      } else {
        this.setState({
          chatAvatarWarning: null,
          chatMessageWarning: 'Message cannot be empty.',
          chatError: null,
        });
      }
    }
  };

  getFormattedTime(timestamp) {
    if (!timestamp) {
      return '';
    }
    const date = new Date(timestamp);
    const currentTime = new Date();
    const elapsedTimeInMs = currentTime.getTime() - date.getTime();
    const hours = date.getHours() > 9 ? date.getHours() : `0${date.getHours()}`;
    const minutes = date.getMinutes() > 9 ? date.getMinutes() : `0${date.getMinutes()}`;
    let formattedTime = `at ${hours}:${minutes}`;

    if (elapsedTimeInMs > 86400000 * 7) {//WeekInMs
      formattedTime = `${date.getMonth()}/${date.getDay()}${date.getFullYear() === currentTime.getFullYear() ? '' : '/' + date.getFullYear()} ${formattedTime}`;
    } else {
      if (elapsedTimeInMs > 86400000) {//dayInMs
        formattedTime = `${this.dayOfTheWeek[date.getDay()]} ${formattedTime}`;
      } else {
        if (elapsedTimeInMs < 60000) {//minuteInMs
          formattedTime = 'some seconds ago...'
        } else {
          if (elapsedTimeInMs < 600000) {//tenMinInMs
            formattedTime = 'some minutes ago...'
          }
        }
      }
    }

    return formattedTime;
  }

  onFirecoActive = (firecoChat, SERVER_TIMESTAMP, chatUserIdLocalStoragePath) => {
    this.firecoChat = firecoChat;
    this.SERVER_TIMESTAMP = SERVER_TIMESTAMP;
    this.chatUserIdLocalStoragePath = chatUserIdLocalStoragePath;
    this.listenToChatUsersData();
  };

  // handleExpandClick=() => {
  //   let {expanded, restoreHeight, height}=this.state;
  //
  //   if (expanded) {
  //     restoreHeight=this.chatEl.getBoundingClientRect().height;
  //     height=defaultChatStyle.minHeight;
  //   } else {
  //     height=restoreHeight;
  //   }
  //
  //   this.setState({
  //     expanded: !expanded,
  //     restoreHeight: restoreHeight,
  //     height: height,
  //     // width: offsetWidth,
  //   });
  // };

  setUserId = (chatUserId, saveLocally = true) => {
    saveLocally && localStorage.set(this.chatUserIdLocalStoragePath, chatUserId);
    this.setState({
      chatUserId: chatUserId,
      chatAvatarWarning: chatUserId ? null : 'Please select an user.',
    });
  };

  handleAvatarMenu = event => {
    this.setState({avatarAnchorEl: event.currentTarget});
  };

  handleAvatarClose = () => {
    let {chatUserId, chatUserName, users} = this.state;
    this.setState({
      avatarAnchorEl: null,
    });
    if (!chatUserName.trim().length) {
      if (chatUserId && users[chatUserId].chatUserName) {
        this.setState({
          chatUserName: users[chatUserId].chatUserName,
          chatAvatarWarning: 'Name was not changed.',
        });
      } else {
        this.setState({
          chatUserName: '',
          chatAvatarWarning: 'Name cannot be empty',
        });
      }
    } else {
      if (chatUserId) {
        if (users[chatUserId].chatUserName !== chatUserName) {
          this.firecoChat.child(`users/${chatUserId}`).set({chatUserName: chatUserName}, error => {
            this.setState({
              chatAvatarWarning: null,
              chatMessageWarning: null,
              chatError: error ? 'Could not save name change.' : null,
            });
          });
        }
      } else {
        const firecoChatUserPushPromise = this.firecoChat.child('users').push({chatUserName: chatUserName});
        this.setUserId(firecoChatUserPushPromise.key);
        firecoChatUserPushPromise.catch(error => {
          this.setUserId(null);
          this.setState({
            chatAvatarWarning: null,
            chatMessageWarning: null,
            chatError: error ? 'Could not create user.' : null,
          });
        });
      }
    }
  };

  handleAvatarInputEnter = e => {
    if (e.keyCode === 13) {
      this.handleAvatarClose();
    }
  };

  listenToChatUsersData = () => {
    if (!this.firecoChat) {
      console.log('this.firecoChat must be set');
      return;
    }

    const chatUserId = localStorage.get(this.chatUserIdLocalStoragePath);
    if (chatUserId) {
      this.setUserId(chatUserId, false);
      this.firecoChat
        .child(`users/${chatUserId}/layout`)
        .once('value', snapshot => {
          if (snapshot.exists()) {
            const layout = snapshot.val();
            const {isChatToggled, chatClick} = this.props;
            if (chatClick && layout.isChatToggled !== isChatToggled) {
              chatClick();
            }
            if (this.chatEl && layout.chatBoundingClientRect) {
              if (layout.chatBoundingClientRect.left > window.innerWidth
                || layout.chatBoundingClientRect.top > window.innerHeight) {
                layout.chatBoundingClientRect.left = defaultChatStyle.left;
                layout.chatBoundingClientRect.top = defaultChatStyle.top;
                layout.chatBoundingClientRect.bottom = defaultChatStyle.bottom;
              }
              this.setState({
                ...layout.chatBoundingClientRect
              });
            }
          }
        });
    }

    const pushUser = (users, snapshot) => {
      const data = snapshot.val();
      users[snapshot.key] = data;
      if (this.state.chatUserId === snapshot.key) {
        this.setState({
          chatUserName: data.chatUserName || '',
        });
      }
    };

    const onChildData = snapshot => {
      let {users} = this.state;
      users = users ? {...users} : {};
      pushUser(users, snapshot);
      this.setState({users: users});
    };

    this.firecoChat
      .child('users')
      .once('value', snapshot => {
        let {users} = this.state;
        users = users ? {...users} : {};
        snapshot.forEach(data => {
          pushUser(users, data);
        });
        this.setState({users: users});
      });

    this.firecoChat
      .child('users')
      .on('child_added', onChildData);
    this.firecoChat
      .child('users')
      .on('child_changed', onChildData);
    //so far, users cannot be deleted

    this.firecoChat
      .child('messages')
      .limitToLast(100)
      .on('child_added', snapshot => {
        const chatMessage = snapshot.val();
        this.setState((prevState)=>({
          lastMessageReceivedOwnerId: chatMessage.chatUserId,
          lastMessageReceivedTimestamp: chatMessage.timestamp,
          messages: [...prevState.messages, {
            key: snapshot.key,
            chatUserId: chatMessage.chatUserId,
            text: chatMessage.text,
            timestamp: chatMessage.timestamp
          }]
        }));
      });
  };

  handleChatUsersToSuggestions = users => {
    if (users === this.prevUsers) {
      this.userSuggestions = this.userSuggestions || [];
      return;
    }
    const userSuggestions = [];
    for (const chatUserId in users) {
      const userData = users[chatUserId];
      if (userData.chatUserName) {
        userSuggestions.push({
          id: chatUserId,
          label: userData.chatUserName,
        });
      }
    }
    this.userSuggestions = userSuggestions;
  };

  getChatUserSuggestions = value => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    let count = 0;

    return inputLength === 0
      ? [...this.userSuggestions]
      : this.userSuggestions.filter(suggestion => {
        const keep =
          count < 5 && suggestion.label.toLowerCase().slice(0, inputLength) === inputValue;

        if (keep) {
          count += 1;
        }
        return keep;
      });
  };

  getChatUserSuggestion = suggestion => suggestion;

  handleChatUserChange = (event, autoCompleteEvent) => {
    const {newValue, method} = autoCompleteEvent;
    let {chatUserId, chatUserName, chatAvatarWarning} = this.state;
    switch (method) {
      case 'type':
        chatUserName = newValue;
        chatAvatarWarning = newValue.trim().length ? null : 'Name cannot be empty.';
        break;
      case 'click':
        chatUserId = newValue.id;
        chatUserName = newValue.label;
        chatAvatarWarning = null;
        break;
      case 'enter':
        chatUserId = newValue.id;
        chatUserName = newValue.label;
        chatAvatarWarning = null;
        break;
      default:
        return;
    }

    chatUserId && this.setUserId(chatUserId);
    this.setState({
      chatUserName: chatUserName,
      chatAvatarWarning: chatAvatarWarning,
    });
  };

  makeDraggableAndResizable = ref => {
    if (ref && this.chatEl !== ref && this.mounted) {
      this.isDraggableAndResizable = false;
      this.chatEl = ref;
    }
    if (!ref) {
      clearTimeout(this.drt);
    } else {
      if (!this.isDraggableAndResizable) {
        this.drt = setTimeout(() => {
          $(this.chatEl).draggable();
          $(this.chatEl).resizable({
            handles: "n, e, s, w, sw"
          });
          this.isDraggableAndResizable = true;
        }, 2000);
      }
    }
  };

  getMessageOwner = chatUserId => {
    if (chatUserId) {
      const {users} = this.state;
      if (users && users[chatUserId]) {
        if (chatUserId === this.state.chatUserId) {
          return 'You';
        } else {
          return users[chatUserId].chatUserName;
        }
      }
    }
    return '';
  };

  getLastActivityMessage = () => {
    const {
      chatUserId,
      chatAvatarWarning,
      chatMessageWarning,
      chatError,
      lastMessageReceivedOwnerId,
      lastMessageReceivedTimestamp
    } = this.state;

    if (!chatUserId) {
      return 'Please select an user.';
    }
    if (chatAvatarWarning) {
      return chatAvatarWarning;
    }
    if (chatMessageWarning) {
      return chatMessageWarning;
    }
    if (chatError) {
      return chatError;
    }
    const username = this.getMessageOwner(lastMessageReceivedOwnerId);
    const time = this.getFormattedTime(lastMessageReceivedTimestamp);
    if (username && time) {
      return `${username} typed ${time}`;
    }
    return '';
  };

  hasErrors = () => {
    const {
      chatUserId, chatAvatarWarning, chatError, chatMessageWarning,
    } = this.state;
    return !!(!chatUserId || chatAvatarWarning || chatError || chatMessageWarning);
  };

  chatPreHideLayout = (isChatToggled/*, expanded*/) => {
    if (isChatToggled || !this.chatEl) {
      return;
    }
    let elBoundingClientRect = this.chatEl.getBoundingClientRect();

    this.preHideChatEl = {
      left: elBoundingClientRect.left,
      right: elBoundingClientRect.right,
      top: elBoundingClientRect.top,
      bottom: elBoundingClientRect.bottom,
      width: elBoundingClientRect.width,
      height: elBoundingClientRect.height,
      // expanded: expanded,
    };
  };

  render() {
    // clearTimeout(this.lt);
    // this.lt=setTimeout(()=>{
    //   this.onDispose();
    // },1000);
    const {classes, isChatToggled, chatClick, chatTitle} = this.props;

    const {
      left, right, top, bottom, height, width,
      chatUserName, chatMessageText,
      /*expanded,*/ avatarAnchorEl, users, messages
    } = this.state;

    const errors = this.hasErrors();

    const avatarMenuOpen = !!avatarAnchorEl;

    const chatCurrentStyle = {
      left: left,
      right: right,
      top: top,
      bottom: bottom,
      height: height,
      width: width
    };


    this.handleChatUsersToSuggestions(users);

    const chatUserNameInputProps = {
      classes,
      value: chatUserName,
      onChange: this.handleChatUserChange,
      onKeyUp: this.handleAvatarInputEnter,
    };

    const renderChatUserNameInput = inputProps => {
      const {classes, ref, ...other} = inputProps;
      return (
        <TextField
          error={!chatUserName}
          label={chatUserName ? 'Chat Name' : 'Enter your chat name'}
          fullWidth
          inputRef={ref}
          InputProps={{
            classes: {
              input: classes.input,
            },
            ...other,
          }}
        />
      );
    };

    this.chatPreHideLayout(isChatToggled/*, expanded*/);

    return (
      <div id="chatDiv" className={classnames(classes.chat, {
        [classes.hidden]: !isChatToggled,
      })}
           style={chatCurrentStyle}
           ref={ref => this.makeDraggableAndResizable(ref)}>
        {
          this.firecoChat &&
          <Card className={classes.chatContent}>
            {/*<IconButton*/}
            {/*className={classnames(classes.expand, {*/}
            {/*[classes.expandOpen]: expanded,*/}
            {/*})}*/}
            {/*onClick={this.handleExpandClick}*/}
            {/*aria-expanded={expanded}*/}
            {/*aria-label="Show Messages"*/}
            {/*>*/}
            {/*<ExpandMoreIcon/>*/}
            {/*</IconButton>*/}
            {/*<Collapse in={expanded} timeout="auto" unmountOnExit>*/}
            <CardContent className={classes.chatMessages}>
              <List>
              {
                messages.map(message => <ListItem key={message.key}>{message.text}</ListItem>)
              }
              </List>
            </CardContent>
            {/*</Collapse>*/}
            <CardHeader
              className={classes.actions}
              avatar={
                <div>
                  <Avatar
                    aria-label="name"
                    className={
                      classnames(classes.avatar, {
                        [classes.avatarSet]: !!chatUserName,
                      })
                    }
                    onClick={this.handleAvatarMenu}

                    aria-owns={avatarMenuOpen ? 'menu-avatar' : null}
                    aria-haspopup="true"
                    title={chatUserName || "click to type you user name"}
                  >
                    {chatUserName ? chatUserName[0].toUpperCase() : '?'}
                  </Avatar>
                  <Menu
                    id="menu-avatar"
                    className={classes.avatarMenu}
                    anchorEl={avatarAnchorEl}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={avatarMenuOpen}
                    onClose={this.handleAvatarClose}
                  >
                    <AutoComplete
                      renderInputComponent={renderChatUserNameInput}
                      inputProps={chatUserNameInputProps}
                      getSuggestions={this.getChatUserSuggestions}
                      getSuggestionValue={this.getChatUserSuggestion}
                    />
                  </Menu>
                </div>
              }
              action={
                <IconButton title={chatTitle} onClick={chatClick}
                            className={classes.messageChatIcon}
                            color={isChatToggled ? "secondary" : "default"}>
                  <ChatIcon/>
                </IconButton>
              }
              title={
                <TextField
                  fullWidth
                  error={errors}
                  placeholder="type message..."
                  value={chatMessageText}
                  className={classes.messageTextField}
                  onChange={this.handleMessageTextChange}
                  onKeyUp={this.handleMessageInputEnter}
                />
              }
              subheader={this.getLastActivityMessage()}
            />
          </Card>}
      </div>
    );
  }

  onDispose = () => {
    const {isChatToggled} = this.props;
    const {chatUserId/*, expanded, restoreHeight*/} = this.state;
    if (chatUserId && this.firecoChat && this.chatEl) {
      let elBoundingClientRect = this.preHideChatEl;
      if (isChatToggled) {
        elBoundingClientRect = this.chatEl.getBoundingClientRect();
      }
      const chatBoundingClientRect = {
        left: elBoundingClientRect.left,
        right: elBoundingClientRect.right,
        top: elBoundingClientRect.top,
        bottom: elBoundingClientRect.bottom,
        width: elBoundingClientRect.width,
        height: elBoundingClientRect.height,
        //height: expanded ? elBoundingClientRect.height : restoreHeight,
        //expanded: expanded,
      };

      //never used case
      if (!chatBoundingClientRect.left
        && !chatBoundingClientRect.right
        && !chatBoundingClientRect.top
        && !chatBoundingClientRect.height) {
        return;
      }
      this.firecoChat
        .child(`users/${chatUserId}/layout`)
        .set({
          isChatToggled: isChatToggled,
          chatBoundingClientRect: chatBoundingClientRect,
        }, error => {
          console.log(error);
        });
    }
  };

  componentDidMount() {
    this.mounted = true;
    const {dispatch} = this.props;
    dispatch(configureFirecoChat(this.onFirecoActive, this.onDispose));
  }
}

export default withStyles(styles)(Chat);
