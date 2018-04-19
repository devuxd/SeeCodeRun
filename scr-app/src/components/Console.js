// fork of by https://github.com/CompuIves/codesandbox-client/blob/master/packages/app/src/app/components/
// Preview/DevTools/Console/index.js
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {listen, dispatch} from '../seecoderun/modules/Trace';
import debounce from 'lodash.debounce';
import update from 'immutability-helper';
import List from 'material-ui/List'

import {withStyles} from 'material-ui/styles';

import ClearIcon from '@material-ui/icons/Clear';
// import {Decode, Console as ConsoleFeed} from 'console-feed';

import ConsoleInput from './ConsoleInput';

// import {Container, Messages, inspectorTheme} from './elements';

// export
// type
// IMessage = {
//     type: 'message' | 'command' | 'return',
//     logType: 'log' | 'warn' | 'info' | 'error',
//     arguments: any[],
// };

const styles = (theme) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        maxHeight: 'calc(100% - 2rem)',
        // backgroundColor: '${props => props.theme.background4}',
    },
    header: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        fontSize: '0.875rem',
        height: '2rem',
        minHeight: '2rem',
        // backgroundColor: '${props => props.theme.background4}',
        color: 'rgba(255, 255, 255, 0.8)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.3)',
        boxShadow: '0 0 3px rgba(0, 0, 0, 0.3)',
        cursor: 'row-resize',
        flexDirection: 'row'
    },
    tab: {
        display: 'flex',
        alignItems: 'center',
        height: 'calc(2rem - 1px)',
        padding: '0 1rem',
        borderRight: '1px solid rgba(0, 0, 0, 0.3)',
        borderBottom: '1px solid transparent',
        cursor: 'pointer',
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: 600,
        backgroundColor: props => (props.active ? theme.palette.primary.main : 'transparent'),
        borderBottomColor: props => (props.active ? `1px solid ${theme.palette.primary.main}` : '1px solid transparent'),
    },
    actions: {
        position: 'absolute',
        right: '1rem',
        fontSize: '1.125rem',
        svg: {
            margin: '0 0.5rem',
            transition: '0.3s ease all',
            cursor: 'pointer',
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
                color: theme.palette.action.active,
            }
        }
    },
    messages: {
        flexGrow: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        whiteSpace: 'pre-wrap',
// > div {
//     overflow-y: auto;
//     overflow-x: hidden;
// }
    },
    iconContainer: {
        display: 'inline-flex',
        padding: '0.5rem 0',
        width: theme.spacing.unit * 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

const actions = [
    {
        title: 'Clear Console',
        onClick: () => {
            dispatch({type: 'clear-console'});
        },
        Icon: ClearIcon,
    },
];

export const decodeLog =(data)=>{

};

class Console extends Component {
    state = {
        messages: [],
        scrollToBottom: true,
        initialClear: true,
    };

    listener;

    constructor(props) {
        super(props);
        this.list = React.createRef();
        this.scrollToBottom = debounce(this.scrollToBottom, 1 / 60);
    }

    componentDidMount() {
        this.listener = listen(this.handleMessage);
    }

    componentWillUnmount() {
        if (this.listener) {
            this.listener();
        }
    }

    handleMessage = data => {
        switch (data.type) {
            case 'console': {
                const message = decodeLog(data.log);
                const {method, data: args} = message;

                switch (method) {
                    case 'clear': {
                        // If the event was done by the packager
                        const hideMessage = args && args[0] === '__internal__';

                        this.clearConsole(hideMessage);
                        break;
                    }
                    default: {
                        this.addMessage(method, args);
                        break;
                    }
                }
                break;
            }
            case 'clear-console': {
                if (this.state.initialClear) {
                    this.setState({
                        initialClear: false,
                    });
                } else {
                    this.clearConsole();
                }
                break;
            }
            case 'eval-result': {
                const {result, error} = data;

                const decoded = decodeLog(result);

                if (!error) {
                    this.addMessage('result', [decoded]);
                } else {
                    this.addMessage('error', [decoded]);
                }
                break;
            }
            case 'test-result': {
                const {result, error} = data;

                const aggregatedResults = decodeLog(result);
                if (!error) {
                    if (aggregatedResults) {
                        const {summaryMessage, failedMessages} = aggregatedResults;
                        this.addMessage('log', [summaryMessage]);
                        failedMessages.forEach(t => {
                            this.addMessage('warn', [t]);
                        });
                    } else {
                        this.addMessage('warn', [undefined]);
                    }
                } else {
                    this.addMessage('error', [error]);
                }
                break;
            }
            default: {
                break;
            }
        }
    };

    getType = (message: 'info' | 'log' | 'warn' | 'error') => {
        if (message === 'log' || message === 'info') {
            return 'info';
        }

        if (message === 'warn') {
            return 'warning';
        }

        return 'error';
    };

    addMessage(method, data) {
        if (this.props.updateStatus) {
            this.props.updateStatus(this.getType(method));
        }

        this.setState(state =>
            update(state, {
                messages: {
                    $push: [
                        {
                            method,
                            data,
                        },
                    ],
                },
            })
        );
    }

    list;

    componentWillReceiveProps(nextProps) {
        if (nextProps.sandboxId !== this.props.sandboxId) {
            this.clearConsole(true);
        }
    }

    clearConsole = (nothing) => {//boolean
        if (this.props.updateStatus) {
            this.props.updateStatus('clear');
        }

        const messages = nothing
            ? []
            : [
                {
                    method: 'log',
                    data: [
                        '%cConsole was cleared',
                        'font-style: italic; color: rgba(255, 255, 255, 0.3)',
                    ],
                },
            ];

        this.setState({
            messages,
        });
    };

    componentDidUpdate() {
        this.scrollToBottom();
    }

    scrollToBottom = () => {
        if (this.list.current) {
            this.list.current.scrollTop = this.list.current.scrollHeight;
        }
    };

    evaluateConsole = (command) => { //string
        this.addMessage('command', [command]);

        // TODO move everything of frames to store and this command too
        dispatch({type: 'evaluate', command});
    };

    render() {
        if (this.props.hidden) {
            return null;
        }
        const {classes} = this.props;
        return (
            <List className={classes.container}>
                <div className={classes.messages}
                    ref={this.list}
                >
                {/*this.state.messages*/}
                </div>
                <ConsoleInput evaluateConsole={this.evaluateConsole}/>
            </List>
        );
    }
}

Console.propTypes = {
    classes: PropTypes.object.isRequired,
    hidden: PropTypes.bool,
    updateStatus: PropTypes.func,
    sandboxId: PropTypes.string,
};

Console.defaultProps = {
    hidden: false
};

export default withStyles(styles)(Console);