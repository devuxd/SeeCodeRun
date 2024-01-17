import React, {
   createRef,
   memo,
   PureComponent,
} from 'react';
import {connect} from 'react-redux';
import classnames from 'classnames';
import {of} from 'rxjs';
import debounce from 'lodash/debounce';
import localStorage from 'store';
import isEqual from 'lodash/isEqual';
import {withStyles} from '@mui/styles';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import ListItem from '@mui/material/ListItem';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import {randomColor} from '../common/UI';
import update from 'immutability-helper';

import {ResizableBox} from 'react-resizable';

import {
   configureFirecoChat,
   firecoEditorsSetUserId
} from '../redux/modules/fireco';
import PromiseAutoComplete from '../components/PromiseAutoComplete';
import InfinityChatList from './InfinityChatList';
import MotionControlledXY from "../common/MotionControlledXY";
import TextFieldWithAutoFocus from "../common/TextFieldWithAutoFocus";
import {l} from "../core/modules/AutoLogShift";

const mapDispatchToProps = {configureFirecoChat, firecoEditorsSetUserId};

const LIST_SUBHEADER_HEIGHT = 72 + 1; //1 from divider
// const LIST_ITEM_HEIGHT = 60; //1 from divider
const LIST_ITEM_SKELETON_HEIGHT = 48; //1 from divider

const defaultChatLayout = {
   left: LIST_SUBHEADER_HEIGHT,
   top: LIST_SUBHEADER_HEIGHT,
   minLeft: 0,
   minTop: 0,
   width: LIST_SUBHEADER_HEIGHT * 4,
   height: LIST_SUBHEADER_HEIGHT * 2,
   minWidth: LIST_SUBHEADER_HEIGHT * 4,
   minHeight: LIST_SUBHEADER_HEIGHT * 2,
}

const defaultResizableBoxProps = {
   handleSize: [5, 5],
   resizeHandles: ['ne', 'se', 'sw', 'nw'],
   minConstraints: [defaultChatLayout.minWidth, defaultChatLayout.minHeight],
};


const rectifyChatBoundingClientRectValue = (
   chatBoundingClientRect, key,
) => {
   const value = chatBoundingClientRect[key];
   const defaultValue = defaultChatLayout[key];
   let newValue = (isNaN(value) ? defaultValue : value) ?? 0;
   
   let layoutKey = null;
   let globalKey = null;
   let dimensionKey = null;
   switch (key) {
      case 'left':
         layoutKey = 'minLeft';
         globalKey = 'innerWidth';
         dimensionKey = 'width';
         break;
      case 'width':
         layoutKey = 'minWidth';
         globalKey = 'innerWidth';
         break;
      case 'top':
         layoutKey = 'minTop';
         globalKey = 'innerHeight';
         dimensionKey = 'height';
         break;
      case 'height':
         layoutKey = 'minHeight';
         globalKey = 'innerHeight';
         break;
      default:
         return 0;
   }
   
   if (dimensionKey) {
      if (newValue > global[globalKey] + chatBoundingClientRect[dimensionKey]) {
         return (global[globalKey] - chatBoundingClientRect[dimensionKey]) * .9;
      }
   } else {
      if (newValue > global[globalKey]) {
         return global[globalKey] * .9;
      }
   }
   
   const minValue = defaultChatLayout[layoutKey];
   if (newValue < minValue) {
      return minValue;
   }
   
   return newValue;
};

const rectifyChatLayout = (chatLayout) => {
   chatLayout ??= {};
   chatLayout.chatBoundingClientRect ??= {};
   
   const {chatBoundingClientRect} = chatLayout;
   const rectifiedChatBoundingClientRect = {...chatBoundingClientRect};
   
   for (let key of ['width', 'height', 'left', 'top']) { // order matters
      rectifiedChatBoundingClientRect[key] = rectifyChatBoundingClientRectValue(
         rectifiedChatBoundingClientRect, key
      );
   }
   
   return {
      ...chatLayout,
      chatBoundingClientRect: rectifiedChatBoundingClientRect,
   };
};

const styles = theme => ({
   backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: theme.palette.action.disabledBackground,
   },
   chat: {
      display: 'block',
      position: 'absolute',
      top: 0,
      left: 0,
      boxShadow: theme.shadows[7],
      overflow: 'hidden',
   },
   chatHidden: {
      display: 'none'
   },
   avatarMenu: {
      overflow: 'auto',
      maxHeight: 'calc(100% - 32px)',
   },
   avatar: {
      alignItems: 'center',
      backgroundColor: theme.palette.grey[400],
   },
   avatarSet: {
      backgroundColor: theme.palette.primary.main,
   },
   root: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.palette.background.paper,
   },
   list: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.palette.background.paper,
      position: 'relative',
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
      marginBottom: theme.spacing(-.25),
   },
   chatMessageSticky: {
      bottom: 0,
      top: 'unset',
      zIndex: 0,
   },
   listItemTextField: {
      paddingRight: theme.spacing(1),
   },
   closeIcon: {
      backgroundColor: theme.palette.background.paper,
      position: 'absolute',
      top: theme.spacing(1),
      right: theme.spacing(1),
      zIndex: theme.zIndex.speedDial,
      '&:hover': {
         backgroundColor: theme.palette.background.default,
      },
      
   }
});

const getMessageLoadingSkeletons = (classes, getCount = () => 4) => {
   const count = getCount();
   const skeletons = [];
   const ListItemTextSkeleton = ({alignRight}) => (
      <ListItemText
         primary={
            <Skeleton
               animation="wave"
               height={10}
               width={!!alignRight ? "100%" : "80%"}
               style={{marginBottom: 6}}
            />}
         secondary={
            <Skeleton
               animation="wave"
               height={10}
               width={!!alignRight ? null : "40%"}
               style={!!alignRight ? {marginLeft: "40%"} : null}
            />}
      />);
   for (let i = 0; i < count; i++) {
      skeletons.push(
         <ListItem
            button={false}
            disableGutters
            key={i}
         >
            <ListItemAvatar>
               <Skeleton animation="wave" variant="circular" width={40}
                         height={40}/>
            </ListItemAvatar>
            {i % 2 ?
               <ListItemSecondaryAction style={{width: '50%'}}>
                  <ListItemTextSkeleton alignRight={true}/>
               </ListItemSecondaryAction>
               : <ListItemTextSkeleton/>
            }
         
         </ListItem>);
   }
   return skeletons;
};

const LOADING = 1;
const LOADED = 2;
let itemStatusMap = {};

const isItemLoaded = index => !!itemStatusMap[index];
const loadMoreItems = (startIndex, stopIndex) => {
   for (let index = startIndex; index <= stopIndex; index++) {
      itemStatusMap[index] = LOADING;
   }
   return new Promise(resolve => {
      for (let index = startIndex; index <= stopIndex; index++) {
         itemStatusMap[index] = LOADED;
      }
      resolve();
   });
};


class Chat extends PureComponent {
   constructor(props) {
      super(props);
      this.styleRef = createRef();
      this.rootRef = createRef();
      this.chatElRef = createRef();
      this.chatListRef = createRef();
      this.chatAvatarEl = createRef();
      this.inputContainerRef = createRef();
      this.inputContainerResizeObserver = new window.ResizeObserver(
         this.updateHeightOffset
      );
      
      this.state = {
         ...defaultChatLayout,
         isAvatarMenuOpen: false,
         chatUserId: null,
         chatUserName: '',
         chatMessageText: '',
         chatAvatarWarning: null,
         chatMessageWarning: null,
         chatError: null,
         users: null,
         messages: [],
         self: this,
         backdrop: false,
         isChatMessagesLoading: true,
         isChatUsersLoading: true,
         chatMessagesLimit: 100,
         heightOffset: 0,
      };
      
      this.prevUsers = null;
      this.userSuggestions = [];
      this.userColors = {};
      
      this.firecoChat = null;
      this.serverTimestamp = () => null;
      this.chatUserIdLocalStoragePath = null;
      this.updateMessagesInterval = null;
      this.updateMessagesIntervalTime = 300000;//fiveMins
      this.dayOfTheWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
   }
   
   getCurrentChatLayout = (forceValid = false) => {
      const {
         isTopNavigationToggled,
         themeType,
         isChatToggled,
         currentLayout
      } = this.props;
      
      const {
         height, width,
      } = this.state;
      
      
      const {current} = this.styleRef;
      const left = current?.x.get();
      const top = current?.y.get();
      
      if (forceValid &&
         isNaN(left) || isNaN(top) || isNaN(width) || isNaN(height)) {
         return null;
      }
      
      const layout = {
         gridString: JSON.stringify(currentLayout?.() ?? null),
         isTopNavigationToggled,
         themeType,
         isChatToggled,
      };
      
      layout.chatBoundingClientRect = {
         left, top,
         height, width,
      };
      
      return rectifyChatLayout(layout);
   };
   
   updateHeightOffset = (entry) => {
      cancelAnimationFrame(this.rid);
      this.rid = requestAnimationFrame(() => {
         const inputEl = this.inputContainerRef.current;
         
         if (!inputEl) {
            return;
         }
         
         const height = inputEl.getBoundingClientRect().height;
         
         this.setState(
            {
               heightOffset: LIST_SUBHEADER_HEIGHT > height ?
                  LIST_SUBHEADER_HEIGHT : height
            }
         );
      });
      
   };
   
   handleUpdateChatBoundingClientRect = () => {
      cancelAnimationFrame(this.ridChat);
      this.ridChat = requestAnimationFrame(() => {
         this.updateChatBoundingClientRect({
            layout: this.getCurrentChatLayout()
         });
      });
      
   };
   
   handleMessageTextChange = e => {
      const chatMessageText = e.target.value || '';
      this.setState({
         chatMessageText: chatMessageText,
         chatAvatarWarning: this.state.chatUserId ?
            null : this.state.chatAvatarWarning,
         chatMessageWarning: null,
         chatError: null,
      })
   };
   
   handleMessageInputEnter = e => {
      if (e.key === 'Enter' || e.keyCode === 13) {
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
               chatUserId,
               text: chatMessageText,
               timestamp: this.serverTimestamp()
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
   
   getFormattedTime = (timestamp) => {
      if (!timestamp) {
         return '';
      }
      const date = new Date(timestamp);
      const currentTime = new Date();
      const elapsedTimeInMs = currentTime.getTime() - date.getTime();
      const hours = date.getHours() > 9 ?
         date.getHours() : `0${date.getHours()}`;
      const minutes = date.getMinutes() > 9 ?
         date.getMinutes() : `0${date.getMinutes()}`;
      let formattedTime = `at ${hours}:${minutes}`;
      if (elapsedTimeInMs > 86400000 * 7) {//WeekInMs
         formattedTime = `${
            date.getMonth()
         }/${
            date.getDay()
         }${
            date.getFullYear() === currentTime.getFullYear() ?
               '' : '/' + date.getFullYear()
         } ${
            formattedTime
         }`;
      } else {
         if (elapsedTimeInMs > 86400000) {//dayInMs
            formattedTime = `${
               this.dayOfTheWeek[date.getDay()]
            } ${
               formattedTime
            }`;
         } else {
            if (elapsedTimeInMs < 60000) {//minuteInMs
               formattedTime = 'some seconds ago...'
            } else {
               if (elapsedTimeInMs < 300000) {//fiveMinInMs
                  formattedTime = 'some minutes ago...'
               } else {
                  formattedTime = `today ${formattedTime}`;
               }
            }
         }
      }
      
      return formattedTime;
   };
   
   
   setUserId = (chatUserId, saveLocally = true) => {
      saveLocally && localStorage.set(
         this.chatUserIdLocalStoragePath,
         chatUserId,
      );
      this.setState({
         chatUserId,
         chatAvatarWarning: chatUserId ? null : 'Please select an user.',
      });
   };
   
   handleAvatarMenu = () => {
      this.setState(
         prevState => ({isAvatarMenuOpen: !prevState.isAvatarMenuOpen})
      );
   };
   
   handleAvatarClose = () => {
      let {chatUserId, chatUserName, users} = this.state;
      this.setState({
         isAvatarMenuOpen: false,
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
                  chatUserName,
               }, error => {
                  this.setState({
                     chatAvatarWarning: null,
                     chatMessageWarning: null,
                     chatError: error ?
                        'Could not save name change.' : null,
                  });
               });
            }
         } else {
            const firecoChatUserPushPromise = this.firecoUsers.push({
               chatUserName,
               color: this.getValidColor(),
               layout: {
                  creationTimestamp: this.serverTimestamp(),
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
      if (e.key === 'Enter' || e.keyCode === 13) {
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
   
   updateChatBoundingClientRect = (data) => {
      if (!data?.layout) {
         return null;
      }
      
      data.layout = rectifyChatLayout(data.layout);
      const {layout} = data;
      
      const {left, top, width, height} = layout.chatBoundingClientRect;
      
      if (this.chatElRef.current && this.styleRef.current) {
         this.styleRef.current.x.set(left);
         this.styleRef.current.y.set(top);
      }
      
      this.setState({width, height});
      
      return layout;
   };
   
   updateLayout = (data) => {
      const layout = this.updateChatBoundingClientRect(data);
      
      if (!layout) {
         return null;
      }
      
      const {
         themeType,
         switchTheme,
         isChatToggled,
         chatClick,
         isTopNavigationToggled,
         logoClick,
         currentLayout,
         resetLayoutClick
      } = this.props;
      
      if (chatClick && layout.isChatToggled && !isChatToggled) {
         chatClick(null, true);
      }
      if (logoClick
         && layout.isTopNavigationToggled
         && !isTopNavigationToggled) {
         logoClick(null, true);
      }
      const grid = currentLayout && currentLayout();
      const layoutGrid = layout.gridString ?
         JSON.parse(layout.gridString) : null;
      if (resetLayoutClick
         && grid
         && layoutGrid
         && !isEqual(layoutGrid, grid)) {
         resetLayoutClick(layoutGrid);
      }
      
      if (switchTheme && layout.themeType && layout.themeType !== themeType) {
         switchTheme(null, layout.themeType);
      }
   };
   
   listenToChatUsersData = () => {
      const {chatMessagesLimit} = this.state;
      if (!this.firecoChat || !this.firecoUsers) {
         console.warn('this.firecoChat and this.firecoUsers must be set');
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
               this.firecoUsers.child(
                  `${snapshot.key}`
               ).update({color: this.getValidColor()});
            }
         } else {
            this.userColors[data.color] = snapshot.key;
         }
         
         if (this.state.chatUserId === snapshot.key) {
            this.updateLayout(data);
            if (this.state.chatUserName !== data.chatUserName) {
               this.setState({
                  chatUserName: data.chatUserName || '',
               });
            }
         }
      };
      
      const onChildData = snapshot => {
         let {users} = this.state;
         users = users ? {...users} : {};
         pushUser(users, snapshot);
         this.setState({users});
      };
      
      this.firecoUsers
         .once('value', snapshot => {
            let {users} = this.state;
            users = users ? {...users} : {};
            snapshot.forEach(data => {
               pushUser(users, data);
            });
            this.setState({users, isChatUsersLoading: false});
         });
      
      this.firecoUsers
         .on('child_added', onChildData);
      this.firecoUsers
         .on('child_changed', onChildData);
      //so far, users cannot be deleted
      
      let chatMessagesLoadingTimeout = setTimeout(() => {
         this.setState({
            ...defaultChatLayout,
            isChatMessagesLoading: false,
         });
      }, 2000);
      
      let batchedState = null;
      const debouncedSetState = debounce(() => {
         this.setState(batchedState);
         batchedState = null;
         this.scrollToBottom();
      }, 2000, {leading: false, trailing: true, maxWait: 4000});
      
      const messagesOnChildData = snapshot => {
         chatMessagesLoadingTimeout &&
         (chatMessagesLoadingTimeout =
            clearTimeout(chatMessagesLoadingTimeout));
         const chatMessage = snapshot.val();
         const {messages} = this.state;
         batchedState = {
            isChatMessagesLoading: false,
            lastMessageReceivedOwnerId: chatMessage.chatUserId,
            lastMessageReceivedTimestamp: chatMessage.timestamp,
            messages: update(batchedState ?
               batchedState.messages : messages, {
               $push: [{
                  key: snapshot.key,
                  chatUserId: chatMessage.chatUserId,
                  text: chatMessage.text,
                  timestamp: chatMessage.timestamp,
                  color: chatMessage.color
               }],
            }),
         };
         debouncedSetState();
      };
      this.firecoChat
         .child('messages')
         .limitToLast(chatMessagesLimit)
         .on('child_added', messagesOnChildData);
      
      const result = {disposed: false, error: null};
      
      this.firecoChatDispose = () => {
         
         if (result.disposed) {
            return result;
         }
         
         try {
            this.firecoUsers
               .off('child_added', onChildData);
            
            this.firecoUsers
               .off('child_changed', onChildData);
            
            this.firecoChat
               .child('messages')
               .off('child_added', messagesOnChildData);
         } catch (e) {
            result.error = e;
            return result;
         }
         
         result.disposed = true;
         result.error = null;
         
         return result;
      };
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
      this.getOptionsPromise = of(() => [...this.userSuggestions]).toPromise();
   };
   
   handleChatUserChange = (event, option, reason) => {
      const {id: chatUserId, label: chatUserName} = option;
      let chatAvatarWarning = chatUserName.trim().length ?
         '' : 'Name cannot be empty.';
      if (chatUserId && reason === 'input') {
         chatAvatarWarning =
            `${
               (chatAvatarWarning || '')}${(chatAvatarWarning ? '. ' : '')
            }Editing user name.`;
      }
      
      this.setUserId(chatUserId);
      this.setState({
         chatUserName,
         chatAvatarWarning,
      });
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
      return !!(
         !chatUserId || chatAvatarWarning || chatError || chatMessageWarning
      );
   };
   
   filterOptions = (options, params, filter) => {
      const filtered = filter(
         options,
         params.label,
         {keys: ['label']}
      );
      if (params.label !== ''
         && !filtered.length) {
         filtered.push({
            id: null,
            inputValue:
            params.label,
            label: `Add "${
               params.label
            }"`,
         });
      }
      
      return filtered;
   };
   
   isOptionEqualToValue = (option, value) => option.id === value.id;
   
   getOptionsPromise = of(() => [...this.userSuggestions]).toPromise();
   
   handleChangeBackdrop = (
      backdrop, isResizing, event, layoutData = {}
   ) => {
      const nextState = {backdrop, isResizing};
      const {size} = layoutData;
      if (size) { // onResizeStart, onResizeStop
         nextState.width =
            rectifyChatBoundingClientRectValue(size, 'width');
         nextState.height =
            rectifyChatBoundingClientRectValue(size, 'height');
      }
      
      this.setState(nextState);
   };
   
   onDragStart = (...p) => this.handleChangeBackdrop(
      true, false, ...p
   );
   
   onDragEnd = (...p) => this.handleChangeBackdrop(
      false, false, ...p
   );
   
   onResizeStart = (...p) => this.handleChangeBackdrop(
      true, true, ...p
   );
   
   onResizeStop = (...p) => this.handleChangeBackdrop(
      false, false, ...p
   );
   
   ignoreChatListElScrollTrue = () => {this.ignoreChatListElScroll = true};
   
   ignoreChatListElScrollFalse = () => {this.ignoreChatListElScroll = false};
   
   render() {
      const {
         classes,
         isChatToggled,
         chatClick,
         chatTitle,
         dragConstraintsRef,
         resizableBoxProps = defaultResizableBoxProps
      } = this.props;
      
      const {
         width,
         height,
         backdrop,
         chatUserId, chatUserName, chatMessageText,
         isAvatarMenuOpen,
         users, messages, isChatMessagesLoading,
         chatMessageWarning, isChatUsersLoading,
         heightOffset, isResizing
      } = this.state;
      const errors = this.hasErrors();
      
      
      this.handleChatUsersToSuggestions(users);
      
      const chatUserNameInputProps = {
         classes: {
            input: classes.input,
         },
         onKeyUp: this.handleAvatarInputEnter,
      };
      
      const renderChatUserNameInput = ({InputProps, ...rest}) => {
         return (
            <TextFieldWithAutoFocus
               {...rest}
               focusOnDelay={1000}
               error={!chatUserName}
               label={chatUserName ?
                  chatUserId ? 'Editing your chat name'
                     : 'Your chat name' : 'Enter your chat name'
               }
               InputProps={{
                  ...InputProps,
                  ...chatUserNameInputProps,
                  endAdornment: (
                     <>
                        {isChatUsersLoading ?
                           <CircularProgress color="inherit"
                                             size={20}/> : null}
                        {InputProps.endAdornment}
                     </>
                  ),
               }}
            />
         );
      };
      
      const getSkeletonCount = () => Math.max(Math.floor(
         height / LIST_ITEM_SKELETON_HEIGHT
      ), 2);
      
      return (
         <div ref={this.rootRef}>
            {
               backdrop && <div className={classes.backdrop}/>
            }
            <MotionControlledXY
               drag={!isResizing}
               dragConstraints={dragConstraintsRef}
               dragMomentum={false}
               className={isChatToggled ? classes.chat : classes.chatHidden}
               initial={{opacity: 0}}
               animate={{opacity: isChatToggled ? 1 : 0}}
               onDragStart={this.onDragStart}
               onDragEnd={this.onDragEnd}
               styleRef={this.styleRef}
               ref={this.chatElRef}
            >
               <ResizableBox
                  {...resizableBoxProps}
                  width={width}
                  height={height}
                  onResizeStart={this.onResizeStart}
                  onResizeStop={this.onResizeStop}
               >
                  <>
                     {
                        (this.firecoChat && this.firecoUsers) &&
                        <List
                           dense
                           className={classes.list}
                           onMouseEnter={this.ignoreChatListElScrollTrue}
                           onMouseLeave={this.ignoreChatListElScrollFalse}
                        >
                           {isChatMessagesLoading ?
                              getMessageLoadingSkeletons(
                                 classes,
                                 getSkeletonCount
                              ) :
                              messages.length ?
                                 <InfinityChatList
                                    heightOffset={-heightOffset}
                                    messages={messages}
                                    chatUserId={chatUserId}
                                    getMessageOwner={
                                       this.getMessageOwner
                                    }
                                    chatListRef={this.chatListRef}
                                    getUserColor={this.getUserColor}
                                    getFormattedTime={
                                       this.getFormattedTime
                                    }
                                    classes={classes}
                                    isItemLoaded={isItemLoaded}
                                    loadMoreItems={loadMoreItems}
                                 />
                                 : <ListItem
                                    button={false}
                                    disableGutters
                                 >
                                    <ListItemAvatar>
                                       <Avatar/>
                                    </ListItemAvatar>
                                    <ListItemText
                                       primary={'No messages yet'}
                                       secondary={''}
                                    />
                                 </ListItem>
                           }
                           <ListItem/>
                        </List>
                        
                     }
                     <ListSubheader
                        ref={this.inputContainerRef}
                        component={'div'}
                        className={classes.chatMessageSticky}
                        style={{
                           visibility: isChatMessagesLoading ?
                              'hidden' : 'visible'
                        }}
                     >
                        <Divider variant="middle"/>
                        <ListItem
                           disableGutters
                           dense
                        >
                           <ListItemAvatar
                              ref={this.chatAvatarEl}>
                              <Tooltip
                                 title={
                                    chatUserName
                                    || 'Tap to type your user name'
                                 }
                              >
                                 <ButtonBase>
                                    <Avatar
                                       className={
                                          classnames(
                                             classes.avatar,
                                             {
                                                [classes.avatarSet]:
                                                   !!chatUserName,
                                             })
                                       }
                                       onClick={
                                          this.handleAvatarMenu
                                       }
                                    >
                                       {
                                          chatUserName ?
                                             chatUserName[0]
                                                .toUpperCase()
                                             : '?'}
                                    
                                    </Avatar>
                                 </ButtonBase>
                              </Tooltip>
                           </ListItemAvatar>
                           <ListItemText
                              className={classes.listItemTextField}
                              primary={<TextFieldWithAutoFocus
                                 key={`${isChatToggled}-${isChatMessagesLoading}`}
                                 variant="standard"
                                 fullWidth
                                 error={errors}
                                 placeholder="type message..."
                                 value={chatMessageText}
                                 onChange={
                                    this.handleMessageTextChange
                                 }
                                 onKeyUp={
                                    this.handleMessageInputEnter
                                 }
                              />}
                              secondary={
                                 <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    display="block"
                                    noWrap
                                 >
                                    {this.getLastActivityMessage()}
                                 </Typography>
                              }
                           />
                           <ListItemSecondaryAction>
                              <IconButton
                                 title={chatTitle}
                                 onClick={this.handleSendMessage}
                                 color={
                                    chatMessageWarning ?
                                       "secondary" : "primary"
                                 }
                                 edge="end"
                                 aria-label="send"
                              >
                                 <SendIcon/>
                              </IconButton>
                           </ListItemSecondaryAction>
                        </ListItem>
                     </ListSubheader>
                     <IconButton
                        size="small"
                        color="secondary"
                        component="span"
                        onClick={chatClick}
                        aria-label="close chat"
                        classes={{root: classes.closeIcon}}
                     >
                        <CloseIcon/>
                     </IconButton>
                     <Menu
                        classes={{paper: classes.avatarMenu}}
                        anchorEl={this.chatAvatarEl.current}
                        open={isAvatarMenuOpen}
                        onClose={this.handleAvatarClose}
                     >
                        <MenuItem
                           dense
                        >
                           <PromiseAutoComplete
                              freeSolo
                              fullWidth
                              includeInputInList
                              style={{width: 300}}
                              defaultValue={{
                                 label: chatUserName,
                                 id: chatUserId
                              }}
                              filterOptions={this.filterOptions}
                              renderInput={renderChatUserNameInput}
                              getOptionsPromise={
                                 this.getOptionsPromise
                              }
                              isOptionEqualToValue={
                                 this.isOptionEqualToValue
                              }
                              onInputOrOptionChange={
                                 this.handleChatUserChange
                              }
                           />
                        </MenuItem>
                     </Menu>
                  </>
               </ResizableBox>
            </MotionControlledXY>
         </div>
      );
   }
   
   onFirecoActive = (
      firecoChat,
      firecoUsers,
      serverTimestamp,
      chatUserIdLocalStoragePath
   ) => {
      this.firecoChat = firecoChat;
      this.firecoUsers = firecoUsers;
      this.serverTimestamp = serverTimestamp;
      this.chatUserIdLocalStoragePath = chatUserIdLocalStoragePath;
      this.listenToChatUsersData();
   };
   
   
   disposeFirecoChat = () => {
      const {
         chatUserId,
      } = this.state;
      
      if (chatUserId && this.firecoUsers) {
         const layout = this.getCurrentChatLayout(true);
         
         if (!layout) {
            return;
         }
         
         this.firecoUsers
            .child(`${chatUserId}/layout`)
            .update(layout).catch(error => {
            console.warn(
               `User (${chatUserId}) layout was not persisted.`, error
            );
         });
      }
      
      this.firecoChatDispose?.();
   };
   
   componentDidMount() {
      if (this.inputContainerRef?.current) {
         this
            .inputContainerResizeObserver
            .observe(this.inputContainerRef.current);
         this.updateHeightOffset();
      }
      
      global.addEventListener(
         'resize', this.handleUpdateChatBoundingClientRect
      );
      
      
      const {configureFirecoChat} = this.props;
      configureFirecoChat(this.onFirecoActive, this.disposeFirecoChat);
   }
   
   componentWillUnmount() {
      this.disposeFirecoChat();
      this.inputContainerRef?.current &&
      this.inputContainerResizeObserver.unobserve(
         this.inputContainerRef.current
      );
      
      global.removeEventListener(
         'resize', this.handleUpdateChatBoundingClientRect
      );
      
      cancelAnimationFrame(this.rid);
      cancelAnimationFrame(this.ridChat);
      
   }
   
   componentDidUpdate(prevProps, prevState) {
      const {isChatToggled, firecoEditorsSetUserId} = this.props;
      const {users, chatUserId} = this.state;
      
      if (prevProps.isChatToggled !== isChatToggled) {
         clearInterval(this.updateMessagesInterval);
         
         if (isChatToggled) {
            this.handleUpdateChatBoundingClientRect();
            this.updateMessagesInterval = setInterval(() => {
               this.setState(prevState => ({
                  messages: prevState.messages
               }));
            }, this.updateMessagesIntervalTime);
            this.scrollToBottom();
         }
      }
      
      if (prevState.chatUserId !== chatUserId) {
         this.isFirecoEditorsSetUserIdPending = true;
      }
      
      if (this.isFirecoEditorsSetUserIdPending && users) {
         const userColor = users[chatUserId] ?
            users[chatUserId].color : null;
         firecoEditorsSetUserId(chatUserId, userColor);
         this.isFirecoEditorsSetUserIdPending = false;
      }
      
   }
   
   scrollToBottom = () => {
      clearTimeout(this.scrollToBottomTimeout);
      this.scrollToBottomTimeout = setTimeout(() => {
         const {messages} = this.state;
         const shouldScroll = (!this.ignoreChatListElScroll
            && messages && messages.length);
         const currentRef = (this.chatListRef.current
            && this.chatListRef.current._listRef);
         (shouldScroll && currentRef && currentRef.scrollToItem
            && currentRef.scrollToItem(messages.length - 1, "center"));
      }, 500);
   };
   
}

export default memo(connect(null, mapDispatchToProps)(
   withStyles(styles, {withTheme: true})(Chat)
));
