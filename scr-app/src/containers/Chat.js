import React, {
    memo,
    createRef,
    PureComponent,
    useState,
    useEffect
} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import classnames from 'classnames';
import {of} from 'rxjs';
import debounce from 'lodash/debounce';
import localStorage from 'store';
import isEqual from 'lodash/isEqual';
import {withStyles} from '@material-ui/core/styles';
import ButtonBase from '@material-ui/core/ButtonBase';
import Tooltip from '@material-ui/core/Tooltip';
import List from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import SendIcon from '@material-ui/icons/Send';
import CloseIcon from '@material-ui/icons/Close';
import TextField from '@material-ui/core/TextField';
import Divider from '@material-ui/core/Divider';
import Skeleton from '@material-ui/core/Skeleton';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';

import randomColor from "randomcolor";
import update from 'immutability-helper';
import {motion} from 'framer-motion';
import {ResizableBox} from 'react-resizable';

import {configureFirecoChat} from '../redux/modules/fireco';
import {firecoEditorsSetUserId} from '../redux/modules/fireco';
import PromiseAutoComplete from '../components/PromiseAutoComplete';
import InfinityChatList from './InfinityChatList';

const mapDispatchToProps = {configureFirecoChat, firecoEditorsSetUserId};

const LIST_SUBHEADER_HEIGHT = 72 + 1; //1 from divider
// const LIST_ITEM_HEIGHT = 60; //1 from divider
const LIST_ITEM_SKELETON_HEIGHT = 48; //1 from divider
const defaultChatStyle = {
    minWidth: LIST_SUBHEADER_HEIGHT * 4,
    minHeight: LIST_SUBHEADER_HEIGHT * 2,
    left: 'unset',
    right: 'unset',
    top: 'unset',
    bottom: 'unset',
    width: 'unset',
    height: 'unset',
};

const defaultChatLayout = {
    width: LIST_SUBHEADER_HEIGHT * 4,
    height: LIST_SUBHEADER_HEIGHT * 2,
    left: LIST_SUBHEADER_HEIGHT * 4,
    top: LIST_SUBHEADER_HEIGHT * 2,
}

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
        position: 'absolute',
        top: 0,
        left: 0,
        boxShadow: theme.shadows[7],
        overflow: 'hidden',
    },
    hidden: {
        display: 'none',
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
        this.chatEl = createRef();
        this.chatListRef = createRef();
        this.chatAvatarEl = createRef();
        this.inputContainerRef = createRef();
        this.inputContainerResizeObserver = new window.ResizeObserver(
            this.updateHeightOffset
        );
        this.state = {
            ...defaultChatStyle,
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
        this.SERVER_TIMESTAMP = null;
        this.chatUserIdLocalStoragePath = null;
        this.updateMessagesInterval = null;
        this.updateMessagesIntervalTime = 300000;//fiveMins
        this.dayOfTheWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    }

    updateHeightOffset = (entry) => {
        const height =
            this.inputContainerRef.current.getBoundingClientRect().height;
        this.setState(
            {
                heightOffset: LIST_SUBHEADER_HEIGHT > height ?
                    LIST_SUBHEADER_HEIGHT : height
            }
        )
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

    updateLayout = (layout) => {
        if (!layout) {
            return;
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

        if (this.chatEl.current && layout.chatBoundingClientRect) {
            if (layout.chatBoundingClientRect.left > window.innerWidth
                || layout.chatBoundingClientRect.top > window.innerHeight) {
                layout.chatBoundingClientRect.left = defaultChatLayout.left;
                layout.chatBoundingClientRect.top = defaultChatLayout.top;
            }
            this.setState({
                ...layout.chatBoundingClientRect
            });

        }
    };

    listenToChatUsersData = () => {
        //const {isChatToggled} = this.props;
        const {chatMessagesLimit} = this.state;
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
                    this.firecoUsers.child(
                        `${snapshot.key}`
                    ).update({color: this.getValidColor()});
                }
            } else {
                this.userColors[data.color] = snapshot.key;
            }

            if (this.state.chatUserId === snapshot.key) {
                this.updateLayout(data.layout);
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

        this.firecoChat
            .child('messages')
            .limitToLast(chatMessagesLimit)
            .on('child_added', snapshot => {
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

    handleChangeBackdrop = (backdrop, isResizing, layoutData) => {
        const nextState = {backdrop, isResizing};
        if (layoutData && layoutData.point) {
            nextState.left = layoutData.point.x;
            nextState.top = layoutData.point.y;
        }
        if (layoutData && layoutData.size) {
            nextState.width = layoutData.size.width;
            nextState.height = layoutData.size.height;
        }
        this.setState(nextState);
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

    getOptionSelected = (option, value) => option.id === value.id;

    getOptionsPromise = of(() => [...this.userSuggestions]).toPromise();

    render() {
        const {
            classes,
            isChatToggled,
            chatClick,
            chatTitle,
            dragConstraintsRef,
        } = this.props;

        const {
            left, top, height, width, backdrop,
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
                <TextField
                    {...rest}
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

        let key = false;
        const initialDragValue = {};

        if (!(isNaN(top) || isNaN(left))) {
            key = true;
            initialDragValue.x = Math.max(
                left - defaultChatLayout.left,
                defaultChatLayout.left
            );
            initialDragValue.y = Math.max(
                top - defaultChatLayout.top,
                defaultChatLayout.top
            );
        } else {
            initialDragValue.x = defaultChatLayout.left;
            initialDragValue.y = defaultChatLayout.top;
        }

        const currentResizeValue = {};

        if (!(isNaN(width) || isNaN(height))) {
            currentResizeValue.width = width;
            currentResizeValue.height = height;
        } else {
            currentResizeValue.width = defaultChatLayout.width;
            currentResizeValue.height = defaultChatLayout.height;
        }

        const getSkeletonCount = () => Math.max(Math.floor(
            currentResizeValue.height / LIST_ITEM_SKELETON_HEIGHT
        ), 2);
        return (
            <div>
                {backdrop &&
                <div className={classes.backdrop}
                     onClick={this.hideBackdrop}/>}

                <motion.div
                    key={key}
                    initial={initialDragValue}
                    drag={!isResizing}
                    dragConstraints={dragConstraintsRef}
                    dragMomentum={false}
                    className={isChatToggled ? classes.chat : classes.hidden}
                    onDragStart={
                        (event, info) => this.handleChangeBackdrop(
                            true, false, info
                        )
                    }
                    onDragEnd={
                        (event, info) => this.handleChangeBackdrop(
                            false, false, info
                        )
                    }
                    ref={this.chatEl}
                >
                    <ResizableBox
                        {...currentResizeValue}
                        handleSize={[5, 5]}
                        resizeHandles={['ne', 'se', 'sw', 'nw']}
                        onResizeStart={
                            (e, data) => this.handleChangeBackdrop(
                                true,
                                true,
                                data,
                            )
                        }
                        onResizeStop={
                            (e, data) => this.handleChangeBackdrop(
                                false,
                                false,
                                data,
                            )
                        }
                        minConstraints={
                            [LIST_SUBHEADER_HEIGHT * 2,
                                LIST_SUBHEADER_HEIGHT * 2]
                        }
                    >
                        <>
                            {
                                (this.firecoChat && this.firecoUsers) &&
                                <List
                                    dense
                                    className={classes.list}
                                    onMouseEnter={
                                        () => this
                                            .ignoreChatListElScroll = true
                                    }
                                    onMouseLeave={
                                        () => this
                                            .ignoreChatListElScroll = false
                                    }
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
                                        primary={<TextField
                                            variant="standard"
                                            autoFocus
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
                                container={this.chatEl.current}
                                open={isAvatarMenuOpen}
                                onClose={this.handleAvatarClose}
                            >
                                <MenuItem
                                    dense
                                >
                                    <PromiseAutoComplete
                                        PopperProps={{
                                            container:
                                                () => this.chatEl.current,
                                            disablePortal: false,
                                            placement: "top-start",
                                            modifiers: [
                                                {
                                                    name: 'offset',
                                                    options: {
                                                        offset: [
                                                            0,
                                                            4
                                                        ],
                                                    },
                                                },
                                                {
                                                    name: 'flip',
                                                    enabled: false,
                                                },
                                                {
                                                    name: 'preventOverflow',
                                                    enabled: false,
                                                    options: {
                                                        // altAxis: true,
                                                        altBoundary: true,
                                                        // tether: false,
                                                        rootBoundary: 'viewport',
                                                        // padding: 8
                                                    }
                                                }
                                            ],
                                        }}
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
                                        getOptionSelected={
                                            this.getOptionSelected
                                        }
                                        onInputOrOptionChange={
                                            this.handleChatUserChange
                                        }
                                    />
                                </MenuItem>
                            </Menu>
                        </>
                    </ResizableBox>
                </motion.div>
            </div>
        );
    }

    onFirecoActive = (
        firecoChat,
        firecoUsers,
        SERVER_TIMESTAMP,
        chatUserIdLocalStoragePath
    ) => {
        this.firecoChat = firecoChat;
        this.firecoUsers = firecoUsers;
        this.SERVER_TIMESTAMP = SERVER_TIMESTAMP;
        this.chatUserIdLocalStoragePath = chatUserIdLocalStoragePath;
        this.listenToChatUsersData();
    };

    onDispose = () => {
        const {
            isTopNavigationToggled,
            themeType,
            isChatToggled,
            currentLayout
        } = this.props;
        const {
            chatUserId,
            left, top,
            height, width,
        } = this.state;
        if (chatUserId && this.firecoUsers) {

            const newLayout = {
                gridString: JSON.stringify(currentLayout()),
                isTopNavigationToggled,
                themeType,
                isChatToggled,
            };

            if (!(isNaN(left) || isNaN(top) || isNaN(height) || isNaN(width))) {
                newLayout.chatBoundingClientRect = {
                    left, top,
                    height, width,
                };
            }

            this.firecoUsers
                .child(`${chatUserId}/layout`)
                .update({...newLayout}, error => {
                    console.log(error);
                });
        }
    };

    componentDidMount() {
        if (this.inputContainerRef?.current) {
            this
                .inputContainerResizeObserver
                .observe(this.inputContainerRef.current);
            this.updateHeightOffset();
        }
        const {configureFirecoChat} = this.props;
        configureFirecoChat(this.onFirecoActive, this.onDispose);
    }

    componentWillUnmount() {
        this.inputContainerRef?.current &&
        this
            .inputContainerResizeObserver
            .unobserve(this.inputContainerRef.current);
    }

    componentDidUpdate(prevProps, prevState) {
        const {isChatToggled, firecoEditorsSetUserId} = this.props;
        const {users, chatUserId} = this.state;
        if (prevProps.isChatToggled !== isChatToggled) {
            clearInterval(this.updateMessagesInterval);
            if (isChatToggled) {
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

const LazyChat = (
    {activateChatReason, loadChat, loadChatDelay, ...props}
) => {
    const [activateChat, setActivateChat] = useState(false);
    const [activateTimeout, setActivateTimeout] = useState(null);

    useEffect(() => {
            if (activateChat) {
                return;
            }

            if (activateChatReason === 'user') {
                setActivateChat(true);
                return;
            }

            if (
                activateChatReason === 'system' && loadChat && !activateTimeout
            ) {
                setActivateTimeout(
                    setTimeout(
                        () => setActivateChat(true)
                        , loadChatDelay)
                );
                return;
            }
        },
        [
            activateChatReason, loadChat, loadChatDelay,
            activateChat, setActivateChat,
            activateTimeout, setActivateTimeout
        ]
    );

    return (activateChat && <Chat {...props}/>)
};

LazyChat.propTypes = {
    activateChatReason: PropTypes.string,
    loadChat: PropTypes.bool,
    loadChatDelay: PropTypes.number,
};

LazyChat.defaultProps = {
    loadChatDelay: 5000,
};

export default memo(connect(null, mapDispatchToProps)(
    withStyles(styles, {withTheme: true})(LazyChat)
));
