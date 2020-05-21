import React, {Component} from 'react';
import PropTypes from "prop-types";
import Snackbar from '@material-ui/core/Snackbar';
import Slide from '@material-ui/core/Slide';
import {withSnackbar} from 'notistack';
import {withStyles} from '@material-ui/core/styles';

import isString from 'lodash/isString';
import debounce from 'lodash/debounce';

const styles = () => ({
    snackbarContentNetWorkStatus: {
        // minWidth: 360,
        // width: 360,
    }
});

const makeSingleNotification = (message, snackbarMessageId) => {
    return (<span id={snackbarMessageId}>
      {message}
    </span>);
};

class NotificationCenter extends Component {
    state = {
        defaultAutoHideDuration: 4000,
        snackbarMessageId: 'notification-center',
        snackbarVertical: 'bottom',
        snackbarHorizontal: 'center',
        snackbarTransition: props => <Slide direction="up" {...props} />,
        snackbarAutoHideDuration: null,
        isSnackbarOpen: false,
        snackbarMessage: null,
        isSnackbarFirstOnlineConnected: true,
        isOnline: null,
        isConnected: null,
        notification: null,
        disconnectedTimeout: null,
    };

    handleClose = () => {
        this.setState({isSnackbarOpen: false});
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const {
            isOnline, isConnected, changeShowNetworkState, getNetworkStateMessage,
            notification
        } = nextProps;
        const {snackbarMessageId, disconnectedTimeout} = prevState;

        const snackbarMessage = makeSingleNotification(getNetworkStateMessage(), snackbarMessageId);
        if (prevState.isConnected !== isConnected && prevState.isOnline !== isOnline) {
            if (prevState.isSnackbarFirstOnlineConnected) {
                if (isOnline && isConnected) {
                    clearTimeout(disconnectedTimeout);
                    changeShowNetworkState(true);
                    return {
                        isSnackbarFirstOnlineConnected: false,
                        isOnline: isOnline,
                        isConnected: isConnected,
                    };
                }
            } else {
                clearTimeout(disconnectedTimeout);
                return {
                    isSnackbarOpen: true,
                    snackbarMessage: snackbarMessage,
                    isOnline,
                    isConnected,
                    snackbarAutoHideDuration: isOnline && isConnected ?
                        prevState.defaultAutoHideDuration : null,
                };
            }
        } else {
            if (notification && notification !== prevState.notification) {
                return {
                    notification: notification,
                    isSnackbarOpen: true,
                    snackbarMessage: isString(notification.message) ?
                        makeSingleNotification(notification.message, snackbarMessageId)
                        : notification.message,
                    snackbarAutoHideDuration: notification.autoHideDuration ||
                        prevState.defaultAutoHideDuration,
                };
            }
        }
        return null;
    }

    debouncedEnqueueSnackbar = debounce((enqueueSnackbar, ...params) => enqueueSnackbar(...params), 2000);

    render() {
        const {
            classes, enqueueSnackbar, getNetworkStateMessage,
            isConnected, isOnline,
        } = this.props;
        const {
            snackbarAutoHideDuration, snackbarVertical, snackbarHorizontal,
            isSnackbarOpen, snackbarTransition, snackbarMessageId,
        } = this.state;
        isSnackbarOpen && this.debouncedEnqueueSnackbar(enqueueSnackbar, getNetworkStateMessage(), {variant: isOnline && isConnected ? 'success' : 'error'});
        return null;
    }

    componentDidMount() {
        const {changeShowNetworkState, getNetworkStateMessage, didMountDisconnectTimeout} = this.props;
        const {snackbarMessageId} = this.state;

        const disconnectedTimeout = setTimeout(() => {
            const snackbarMessage = makeSingleNotification(getNetworkStateMessage(), snackbarMessageId);
            this.setState({
                isSnackbarOpen: true,
                snackbarMessage: snackbarMessage,
                isSnackbarFirstOnlineConnected: false,
            });
            changeShowNetworkState(true);
        }, didMountDisconnectTimeout);
        this.setState({disconnectedTimeout});
    }
}

NotificationCenter.propTypes = {
    getNetworkStateMessage: PropTypes.func.isRequired,
    changeShowNetworkState: PropTypes.func.isRequired,
    classes: PropTypes.object.isRequired,
    didMountDisconnectTimeout: PropTypes.number,
    enqueueSnackbar: PropTypes.func.isRequired,
};
NotificationCenter.defaultProps = {
    didMountDisconnectTimeout: 20000
};

export default withStyles(styles)(withSnackbar(NotificationCenter));
