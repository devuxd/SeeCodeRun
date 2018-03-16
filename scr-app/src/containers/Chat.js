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
import _ from 'lodash';
import {withStyles} from 'material-ui/styles';
import ListSubheader from 'material-ui/List/ListSubheader';
import List, {ListItem, ListItemSecondaryAction, ListItemText} from 'material-ui/List';
import {CardHeader} from 'material-ui/Card';
import Avatar from 'material-ui/Avatar';
import IconButton from 'material-ui/IconButton';
import Menu from 'material-ui/Menu';
import ChatIcon from 'material-ui-icons/Chat';
import TextField from 'material-ui/TextField';
import randomColor from "randomcolor";

import {configureFirecoChat} from '../redux/modules/fireco';
import AutoComplete from '../components/AutoComplete';


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
  hidden: {
    display: 'none',
  },
  avatarMenu: {
    overflow: 'auto',
  },
  avatar: {
    backgroundColor: theme.palette.grey[400],
  },
  avatarSet: {
    backgroundColor: theme.palette.primary.main,
  },
  root: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.palette.background.paper,
    position: 'relative',
    overflow: 'auto',
    padding: theme.spacing.unit * 1.2,
    paddingTop: 0,
  },
  chatMessageSticky: {
    paddingTop: theme.spacing.unit,
    paddingLeft: 0,
    paddingRight: theme.spacing.unit,
  },
  chatMessageCardHeader: {
    padding: 0,
  }
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
  userColors = {};

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
          } else {
            formattedTime = `today ${formattedTime}`;
          }
        }
      }
    }

    return formattedTime;
  }

  onFirecoActive = (firecoChat, firecoUsers, SERVER_TIMESTAMP, chatUserIdLocalStoragePath) => {
    this.firecoChat = firecoChat;
    this.firecoUsers = firecoUsers;
    this.SERVER_TIMESTAMP = SERVER_TIMESTAMP;
    this.chatUserIdLocalStoragePath = chatUserIdLocalStoragePath;
    this.listenToChatUsersData();
  };

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
          this.firecoUsers.child(`${chatUserId}`).update({
            chatUserName: chatUserName,
          }, error => {
            this.setState({
              chatAvatarWarning: null,
              chatMessageWarning: null,
              chatError: error ? 'Could not save name change.' : null,
            });
          });
        }
      } else {
        const firecoChatUserPushPromise = this.firecoUsers.push({
          chatUserName: chatUserName,
          color: this.getValidColor(),
          layout: {
            creationTimestamp: this.SERVER_TIMESTAMP,
          }
        });
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

  getValidColor = (color = randomColor()) => {
    let tries = 100;
    while (--tries && this.userColors[color]) {
      color = randomColor();
    }
    return color;
  };

  updateLayout = (layout) => {
    if (layout) {
      const {
        themeType, switchTheme,
        isChatToggled, chatClick, isTopNavigationToggled, logoClick, currentLayout, resetLayoutClick
      } = this.props;
      if (chatClick && layout.isChatToggled !== isChatToggled) {
        chatClick();
      }
      if (logoClick && layout.isTopNavigationToggled !== isTopNavigationToggled) {
        logoClick();
      }
      const grid = currentLayout && currentLayout();
      if (resetLayoutClick && grid && !_.isEqual(layout.grid, grid)) {
        //todo is still having an outdated version
        // resetLayoutClick(layout.grid);
      }

      if (switchTheme && layout.themeType && layout.themeType !== themeType) {
        switchTheme(layout.themeType);
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
  };

  listenToChatUsersData = () => {
    if (!this.firecoChat || !this.firecoUsers) {
      console.log('this.firecoChat and this.firecoUsers must be set');
      return;
    }

    const chatUserId = localStorage.get(this.chatUserIdLocalStoragePath);
    if (chatUserId) {
      this.setUserId(chatUserId, false);
    }

    const pushUser = (users, snapshot) => {
      const data = snapshot.val();
      users[snapshot.key] = data;
      if (this.userColors[data.color]) {
        if (this.userColors[data.color] !== snapshot.key) {
          this.firecoUsers.child(`${snapshot.key}`).update({color: this.getValidColor()});
        }
      } else {
        this.userColors[data.color] = snapshot.key;
      }

      if (this.state.chatUserId === snapshot.key) {
        console.log('f', data.layout);
        this.updateLayout(data.layout);
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

    this.firecoUsers
      .once('value', snapshot => {
        let {users} = this.state;
        users = users ? {...users} : {};
        snapshot.forEach(data => {
          pushUser(users, data);
        });
        this.setState({users: users});
      });

    this.firecoUsers
      .on('child_added', onChildData);
    this.firecoUsers
      .on('child_changed', onChildData);
    //so far, users cannot be deleted

    this.firecoChat
      .child('messages')
      .limitToLast(100)
      .on('child_added', snapshot => {
        const chatMessage = snapshot.val();
        this.setState((prevState) => ({
          lastMessageReceivedOwnerId: chatMessage.chatUserId,
          lastMessageReceivedTimestamp: chatMessage.timestamp,
          messages: [...prevState.messages, {
            key: snapshot.key,
            chatUserId: chatMessage.chatUserId,
            text: chatMessage.text,
            timestamp: chatMessage.timestamp,
            color: chatMessage.color
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

    const suggestions = inputLength === 0
      ? [...this.userSuggestions]
      : this.userSuggestions.filter(suggestion => {
        const keep =
          count < 5 && suggestion.label.toLowerCase().slice(0, inputLength) === inputValue;

        if (keep) {
          count += 1;
        }
        return keep;
      });

    return {suggestions: suggestions, isShowAll: !inputLength};
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
            handles: "e, se, s, sw, w"
          });
          this.isDraggableAndResizable = true;
        }, 1500);
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

  getUserColor = chatUserId => {
    if (chatUserId) {
      const {users} = this.state;
      if (users && users[chatUserId]) {
        return users[chatUserId].color;
      }
    }
    return 'grey';
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

  chatPreHideLayout = (isChatToggled) => {
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
    };
  };

  render() {
    const {classes, isChatToggled, chatClick, chatTitle} = this.props;

    const {
      left, right, top, bottom, height, width,
      chatUserId, chatUserName, chatMessageText, avatarAnchorEl, users, messages
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
    isChatToggled && this.scrollToBottom();

    return (
      <div id="chatDiv" className={classnames(classes.chat, {
        [classes.hidden]: !isChatToggled,
      })}
           style={chatCurrentStyle}
           ref={ref => this.makeDraggableAndResizable(ref)}>
        {
          (this.firecoChat && this.firecoUsers) &&
          <List className={classes.root}
                subheader={<li/>}
                dense={true}
          >
            <ListSubheader className={classes.chatMessageSticky}>
              <CardHeader className={classes.chatMessageCardHeader}
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
            </ListSubheader>
            {messages.map((message, i, array) => {
                const skipInfo = i && message.chatUserId === array[i - 1].chatUserId;
                const skipTime = i && ((new Date(message.timestamp)).getTime() - (new Date(array[i - 1].timestamp).getTime())) < 30000;
                const messageOwner = this.getMessageOwner(message.chatUserId);
                return <div key={message.key}
                            ref={ref => {
                              this.chatListEl = ref
                            }}
                            onMouseEnter={() => this.ignoreChatListElScroll = true}
                            onMouseLeave={() => this.ignoreChatListElScroll = false}
                >
                  <ListItem button={true}
                            disableGutters={true}
                  >
                    {chatUserId === message.chatUserId || skipInfo ?
                      <Avatar/>
                      : <Avatar
                        title={messageOwner}
                        style={{backgroundColor: this.getUserColor(message.chatUserId)}}
                      >
                        {messageOwner ? messageOwner[0].toUpperCase() : '?'}
                      </Avatar>
                    }
                    {chatUserId === message.chatUserId ?
                      <ListItemSecondaryAction>
                        <ListItemText primary={message.text}
                                      secondary={skipTime ? null : this.getFormattedTime(message.timestamp)}
                        />
                      </ListItemSecondaryAction>
                      : <ListItemText primary={message.text}
                                      secondary={skipTime ? null : this.getFormattedTime(message.timestamp)}
                      />
                    }
                  </ListItem>
                </div>;
              }
            )}
          </List>
        }
      </div>
    );
  }

  onDispose = () => {
    const {isTopNavigationToggled, themeType, isChatToggled, currentLayout} = this.props;
    const {chatUserId} = this.state;
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
      };

      const newLayout = {
        grid: currentLayout(),
        isTopNavigationToggled: isTopNavigationToggled,
        themeType: themeType,
        isChatToggled: isChatToggled,
      };

      if (!chatBoundingClientRect.left
        && !chatBoundingClientRect.right
        && !chatBoundingClientRect.top
        && !chatBoundingClientRect.height) {
        //never used case
      } else {
        newLayout.chatBoundingClientRect = chatBoundingClientRect;
      }
      this.firecoUsers
        .child(`${chatUserId}/layout`)
        .update(newLayout, error => {
          console.log(error);
        });
    }
  };

  componentDidMount() {
    this.mounted = true;
    const {dispatch} = this.props;
    dispatch(configureFirecoChat(this.onFirecoActive, this.onDispose));
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  scrollToBottom() {
    clearTimeout(this.scrollToBottomTimeout);
    this.scrollToBottomTimeout = setTimeout(() => {
      (!this.ignoreChatListElScroll) && this.chatListEl && this.chatListEl.scrollIntoView({behavior: 'smooth'});
    }, 500);
  }

}

export default withStyles(styles)(Chat);
