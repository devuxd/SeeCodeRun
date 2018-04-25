// fork of by https://github.com/CompuIves/codesandbox-client/blob/master/packages/app/src/app/components/
// Preview/DevTools/Console/index.js
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {listen, dispatch, configureHookConsole} from '../seecoderun/modules/Trace';
import {Hook, Console as ConsoleFeed, Decode} from 'console-feed';
import debounce from 'lodash.debounce';
import update from 'immutability-helper';
// import List from 'material-ui/List';
// import Paper from 'material-ui/Paper';


import {withStyles} from 'material-ui/styles';
import {withTheme} from 'material-ui/styles';

import ClearIcon from '@material-ui/icons/Clear';

import {PastebinContext} from '../containers/Pastebin';
import ConsoleTable from "./ConsoleTable";


// import {Container, Messages, inspectorTheme} from './elements';

// export
// type
// IMessage = {
//     type: 'message' | 'command' | 'return',
//     logType: 'log' | 'warn' | 'info' | 'error',
//     arguments: any[],
// };

const Methods = [
    'log'
    , 'warn'
    , 'error'
    , 'info'
    , 'debug'
    , 'command'
    , 'result'
];

const styles = (theme) => ({
    consoleContainer: {
        paddingTop: theme.spacing.unit * 8,
        width: '100%',
        height: '100%',
    },
    consoleInput: {},
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


class Console extends Component {
    constructor(props){
        super(props);
        this.containerRef = React.createRef();
        this.list = React.createRef();
        this.scrollToBottom = debounce(this.scrollToBottom, 1000 / 24);

        this.state = {
            logs: [],
            messages: [],
            scrollToBottom: true,
            initialClear: true,
        };

        this.listener = null;
    }

    handleMessage = data => {
        switch (data.type) {
            case 'console': {
                const message = Decode(data.log);
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

                const decoded = Decode(result);

                if (!error) {
                    this.addMessage('result', [decoded]);
                } else {
                    this.addMessage('error', [decoded]);
                }
                break;
            }
            case 'test-result': {
                const {result, error} = data;

                const aggregatedResults = Decode(result);
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
//: 'info' | 'log' | 'warn' | 'error'
    getType = (message) => {
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

    scrollToBottom = () => {
        if (this.list.current) {
            this.list.current.scrollTop = this.list.current.scrollHeight;
        }
    };

    evaluateConsole = (command) => { //string
        // this.addMessage('command', [command]);
        // console.log('f', command);
        dispatch({type: 'evaluate', command});
    };

    render() {
        if (this.props.hidden) {
            return null;
        }
        const {classes, theme, handleTotalChange, index, ScrollingListContainers} = this.props;
        return (
           // <div ref={this.containerRef} className={classes.consoleContainer}>
                <ConsoleTable handleTotalChange={handleTotalChange}
                            index={index}
                            ScrollingListContainers={ScrollingListContainers}
                />
          //      {/*<ConsoleFeed logs={this.state.logs} filter={Methods} variant={"light"}/>*/}
           // </div>
        );
    }

    hookConsole = (console = window.console) => {
        Hook(console, (log) => {
            this.setState((prevState) => {
                    //preservelog
                    const nextState = update(prevState, {logs: {$push: [Decode(log)]}});
                    this.totalMatches = nextState.logs.length;
                    return nextState;
                }
            )
        });


        this.listener = listen(this.handleMessage);
    };

    componentDidMount(){
        if (this.props.exports) {
            this.props.exports.evaluateConsole = this.evaluateConsole;
        }
       // configureHookConsole(this.hookConsole);
        // const {index, ScrollingListContainers}= this.props;
        // if(ScrollingListContainers){
        //     ScrollingListContainers[index] = this.containerRef;
        // }
    }

    // componentDidUpdate() {
    //     const {handleTotalChange} = this.props;
    //     if (handleTotalChange && this.consoleTotal !== this.totalMatches) {
    //         this.consoleTotal = this.totalMatches;
    //         handleTotalChange(this.consoleTotal);
    //     }
    //     //this.scrollToBottom();
    // }

    componentDidCatch(error){
        console.log("fffff")
    }


    componentWillUnmount() {
        if (this.listener) {
            this.listener();
        }
        configureHookConsole(null);
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

// const ConsoleWithContext = props => (
//     <PastebinContext.Consumer>
//         {(context) => {
//             return <Console {...context} {...props} />
//         }}
//     </PastebinContext.Consumer>
// );

export default withStyles(styles)(withTheme()((Console)));