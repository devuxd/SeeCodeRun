import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {withSnackbar} from 'notistack';

import isString from 'lodash/isString';

const makeSingleNotification = (message, snackbarMessageId) => {
    return (<span id={snackbarMessageId}>
      {message}
    </span>);
};

class NotificationCenter extends PureComponent {
    state = {
        defaultAutoHideDuration: 4000,
        snackbarMessageId: 'notification-center',
        snackbarVertical: 'bottom',
        snackbarHorizontal: 'center',
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
            isOnline, isConnected,
            changeShowNetworkState, getNetworkStateMessage,
            notification
        } = nextProps;
        const {snackbarMessageId, disconnectedTimeout} = prevState;

        const snackbarMessage = makeSingleNotification(
            getNetworkStateMessage(), snackbarMessageId
        );
        if (prevState.isConnected !== isConnected
            && prevState.isOnline !== isOnline) {
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
                        makeSingleNotification(
                            notification.message, snackbarMessageId
                        )
                        : notification.message,
                    snackbarAutoHideDuration: notification.autoHideDuration ||
                        prevState.defaultAutoHideDuration,
                };
            }
        }
        return null;
    }

    render() {
        return null;
    }

    componentDidUpdate() {
        const {
            enqueueSnackbar, closeSnackbar, getNetworkStateMessage,
            isConnected, isOnline
        } = this.props;
        const {
            isSnackbarOpen, defaultAutoHideDuration,
        } = this.state;
        if (isSnackbarOpen) {
            const isSuccess = isOnline && isConnected;
            this.prevId && closeSnackbar(this.prevId);
            const options = {
                // success (green) v error(red)  is not colorblind compliant
                key: isSuccess ? 'info' : 'warning',
                variant: isSuccess ? 'info' : 'warning',
                persist: true,
            };
            const notiId = enqueueSnackbar(getNetworkStateMessage(), options);
            if (isSuccess) {
                setTimeout(() => {
                    closeSnackbar(notiId);
                }, defaultAutoHideDuration);
            } else {
                this.prevId = notiId;
            }

        }
    }

    componentDidMount() {
        const {
            changeShowNetworkState,
            getNetworkStateMessage,
            didMountDisconnectTimeout
        } = this.props;

        const {snackbarMessageId} = this.state;

        const disconnectedTimeout = setTimeout(
            () => {
                const snackbarMessage = makeSingleNotification(
                    getNetworkStateMessage(), snackbarMessageId
                );
                this.setState({
                    isSnackbarOpen: true,
                    snackbarMessage: snackbarMessage,
                    isSnackbarFirstOnlineConnected: false,
                });
                changeShowNetworkState(true);
            }, didMountDisconnectTimeout
        );
        this.setState({disconnectedTimeout});
    }
}

NotificationCenter.propTypes = {
    getNetworkStateMessage: PropTypes.func.isRequired,
    changeShowNetworkState: PropTypes.func.isRequired,
    didMountDisconnectTimeout: PropTypes.number,
    enqueueSnackbar: PropTypes.func.isRequired,
    closeSnackbar: PropTypes.func.isRequired,
};

NotificationCenter.defaultProps = {
    didMountDisconnectTimeout: 20000,
};

export default withSnackbar(NotificationCenter);
