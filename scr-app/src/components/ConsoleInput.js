import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import {withStyles} from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import CancelIcon from 'mdi-material-ui/Cancel';
import DeleteSweepIcon from '@material-ui/icons/DeleteSweep';

import {mountEditorFulfilled, monacoEditorContentChanged} from "../redux/modules/monacoEditor";
import {canDispatch, dispatch, clearConsole, preserveLogs} from "../seecoderun/modules/Trace";
import {defaultSimpleMonacoOptions} from "../utils/monacoUtils";

const mapStateToProps = ({firecoReducer}) => {
    const {isFirecoEditorsReady} = firecoReducer;
    return {
        activateConsole: isFirecoEditorsReady,
    };
};
const mapDispatchToProps = {mountEditorFulfilled, monacoEditorContentChanged};

const CONSOLE_INPUT_TOP_PADDING = 6;
const CONSOLE_INPUT_BOTTOM_PADDING = 6;
const CONSOLE_INPUT_PADDING =
    CONSOLE_INPUT_TOP_PADDING + CONSOLE_INPUT_BOTTOM_PADDING;
const CONSOLE_INPUT_LINE_HEIGHT = 20;
const CONSOLE_INPUT_MAX_HEIGHT = 110;

const defaultMonacoConsoleClassName = 'monaco-editor-console';

const styles = theme => ({
    '@global': {
        [`.${defaultMonacoConsoleClassName}`]: {
            overflow: 'visible !important',
        },
        [`.${defaultMonacoConsoleClassName} .mtk5`]: {
            color: '#99c794 !important',
        },
        [`.${defaultMonacoConsoleClassName} .mtk12.PropertyAssignment`]: {
            color: '#99c794',
        },
        [`.${defaultMonacoConsoleClassName} .mtk12.PropertyAssignment.PropertyAccessExpression`]: {
            color: '#fac863',
        },
        [`.${defaultMonacoConsoleClassName} .Identifier.CallExpression .OpenParenToken.CallExpression .Identifier.CallExpression`]: {
            color: '#fac863 !important',
        },
        [`.${defaultMonacoConsoleClassName}.monaco-editor .cursors-layer > .cursor`]: {
            maxHeight: 18,
            marginTop: 7,
        }
    },
    container: {
        flexShrink: 0,
        position: 'relative',
        height: props => `${props.height}px`,
        minHeight: '2rem',
        maxHeight: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
    },
    input: {
        height: '100%',
        paddingTop: CONSOLE_INPUT_TOP_PADDING,
        paddingBottom: CONSOLE_INPUT_BOTTOM_PADDING,
        boxSizing: 'border-box',
        width: '100%',
    },
    editorDiv: {
        position: 'absolute',
        top: 0,
        left: theme.spacing(3),
        height: `calc(100%)`,
        width: `calc(100% - ${theme.spacing(10)}px)`
    },
    iconContainer: {
        display: 'inline-flex',
        padding: '0.5rem 0',
        width: theme.spacing(3),
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        color: theme.palette.primary.main,
        fontSize: theme.spacing(2),
    },
    actionContainer: {
        position: 'absolute',
        display: 'inline-flex',
        flexDirection: 'row',
        right: 0,
        // marginRight: -theme.spacing.unit * 3,
        margin: theme.spacing(0.5),
        width: theme.spacing(6),
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionIconContainer: {
        color: theme.palette.secondary.main,
        width: theme.spacing(3),
        height: theme.spacing(3),
        padding: 0,
    },
    clearActionIconContainer: {
        color: theme.palette.primary.main,
        width: theme.spacing(3),
        height: theme.spacing(3),
        padding: 0,
    },
    actionIcon: {
        // color: theme.palette.secondary.main,
        width: theme.spacing(2),
        height: theme.spacing(2),

    },
    actionIconInactive: {
        color: theme.palette.action.active,
        width: theme.spacing(2),
        height: theme.spacing(2),
    },
});

const defaultMonacoOptions = {
    ...defaultSimpleMonacoOptions,
    extraEditorClassName: defaultMonacoConsoleClassName,
    ariaLabel: 'ConsoleInput',
    fontFamily: 'Menlo, monospace',
    fontSize: 12,
    lineHeight: 32,
};

const getHeights = (lineCount) => {
    const editorHeight = isNaN(lineCount) ? CONSOLE_INPUT_LINE_HEIGHT
        : Math.min(
            CONSOLE_INPUT_MAX_HEIGHT,
            Math.max(lineCount, 1) * CONSOLE_INPUT_LINE_HEIGHT
        );
    return {
        editorHeight,
        containerHeight: editorHeight + CONSOLE_INPUT_PADDING,
    }
};

class ConsoleInput extends Component {
    constructor(props) {
        super(props);
        this.editorDiv = React.createRef();
        this.monacoOptions = {...defaultMonacoOptions};
        this.state = {
            commandHistory: [],
            commandCursor: -1,
            isPreserveLogs: false,
            ...(getHeights()),
        };
        this.editor = null;
    }

    preserveLogs = () => {
        this.setState(prevState => {
            const isPreserveLogs = !prevState.isPreserveLogs;
            preserveLogs(isPreserveLogs);
            return {isPreserveLogs};
        })
    };

    resizeEditor = (ignore) => {
        if (ignore) {
            return;
        }
        this.editor && this.editor.layout();
    };

    resizeEditorDebounced = debounce(this.resizeEditor, 2500);

    editorDidMount = (editor) => {
        this.editor = editor;

        let lastLineCount = 1;
        editor.onDidChangeModelContent(() => {
            const lineCount = editor.getModel().getLineCount();
            if (lineCount !== lastLineCount) {
                this.setState({
                    ...getHeights(lineCount),
                });
                this.resizeEditor();
                lastLineCount = lineCount;
            }
        });

        editor.onKeyDown(event => {
            const e = event.browserEvent;

            if (e.key === 'Enter' || e.keyCode === 13) {
                if (e.shiftKey) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                const command = editor.getModel().getValue();
                if (!command || !canDispatch()) {
                    return;
                }
                editor.setValue('');
                this.evaluateConsole(command);
                if (this.state.commandHistory[0] === command) {
                    return;
                }

                this.setState({
                    commandCursor: -1,
                    commandHistory: [command, ...this.state.commandHistory],
                });
            } else if (e.key === 'ArrowUp' || e.keyCode === 38) {
                const lineNumber = editor.getPosition().lineNumber;
                if (lineNumber !== 1) {
                    return;
                }

                const newCursor = Math.min(
                    this.state.commandCursor + 1,
                    this.state.commandHistory.length - 1
                );
                editor.setValue(this.state.commandHistory[newCursor] || '');
                this.setState({
                    commandCursor: newCursor,
                });
            } else if (e.key === 'ArrowDown' || e.keyCode === 40) {
                const lineNumber = editor.getPosition().lineNumber;
                const lineCount = editor.getModel().getLineCount();
                if (lineNumber !== lineCount) {
                    return;
                }

                const newCursor = Math.max(this.state.commandCursor - 1, -1);
                editor.setValue(this.state.commandHistory[newCursor] || '');
                this.setState({
                    commandCursor: newCursor,
                });
            }
        });
        const {onHeightChange} = this.props;
        const {editorHeight, containerHeight} = this.state
        onHeightChange && onHeightChange(null, {editorHeight, containerHeight});
    };

    componentWillUnmount() {
        if (this.editor) {
            this.editor.dispose();
        }
    }

    evaluateConsole = (command) => {
        dispatch({type: 'evaluate', command});
    };

    render() {
        const {classes, activateConsole} = this.props;
        const {isPreserveLogs, containerHeight} = this.state;
        return (
            <div style={{height: containerHeight}}>
                <span className={classes.iconContainer}>
                    <ChevronRightIcon className={classes.icon}/>
                </span>

                <span className={classes.editor}>
                    {activateConsole &&
                    <div
                        ref={this.editorDiv}
                        className={classes.editorDiv}
                    />
                    }
                </span>
                <span className={classes.actionContainer}>
                    <Tooltip title="Clear Console">
                        <IconButton aria-label="Clear Console" className={classes.clearActionIconContainer}
                                    onClick={clearConsole}>
                            <CancelIcon
                                className={classes.actionIcon}
                            />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Preserve Logs">
                        <IconButton aria-label="Preserve Logs" className={classes.actionIconContainer}
                                    onClick={this.preserveLogs}>
                            <DeleteSweepIcon
                                className={isPreserveLogs ? classes.actionIcon : classes.actionIconInactive}
                            />
                         </IconButton>
                    </Tooltip>
                </span>
            </div>
        );
    }


    componentDidUpdate(prevProps, prevState) {
        const {activateConsole, onHeightChange} = this.props
        if (activateConsole && activateConsole !== prevProps.activateConsole) {
            const {editorId, mountEditorFulfilled, monacoEditorContentChanged, isConsole} = this.props;
            const {
                editorDiv, /*dispatchMouseEvents,*/
                editorDidMount, monacoOptions
            } = this;
            mountEditorFulfilled(editorId, {
                editorDiv, monacoEditorContentChanged, /*dispatchMouseEvents,*/
                editorDidMount, isConsole, monacoOptions
            });
        }
        const {editorHeight, containerHeight} = this.state
        if (onHeightChange && editorHeight !== prevState.editorHeight) {
            onHeightChange(null, {editorHeight, containerHeight});
        }
        this.resizeEditorDebounced();
    }
}

ConsoleInput.propTypes = {
    classes: PropTypes.object.isRequired,
    isConsole: PropTypes.bool,
    mountEditorFulfilled: PropTypes.func.isRequired,
    onHeightChange: PropTypes.func,
};

ConsoleInput.defaultProps = {
    editorId: 'consoleInput',
    isConsole: true,
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ConsoleInput));