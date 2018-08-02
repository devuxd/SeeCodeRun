import React, {Component} from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import {withStyles} from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import CancelIcon from 'mdi-material-ui/Cancel';
import DeleteSweepIcon from '@material-ui/icons/DeleteSweep';

import {mountEditorFulfilled} from "../redux/modules/monacoEditor";
import {canDispatch, dispatch, clearConsole, preserveLogs} from "../seecoderun/modules/Trace";

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
        left: theme.spacing.unit * 3,
        height: `calc(100%)`,
        width: `calc(100% - ${theme.spacing.unit * 10}px)`
    },
    iconContainer: {
        display: 'inline-flex',
        padding: '0.5rem 0',
        width: theme.spacing.unit * 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        color: theme.palette.primary.main,
        fontSize: theme.spacing.unit * 2,
    },
    actionContainer: {
        position: 'absolute',
        display: 'inline-flex',
        flexDirection: 'row',
        right: 0,
        // marginRight: -theme.spacing.unit * 3,
        margin: theme.spacing.unit / 2,
        width: theme.spacing.unit * 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionIconContainer: {
        color: theme.palette.secondary.main,
        width: theme.spacing.unit * 3,
        height: theme.spacing.unit * 3,
    },
    clearActionIconContainer: {
        color: theme.palette.primary.main,
        width: theme.spacing.unit * 3,
        height: theme.spacing.unit * 3,
    },
    actionIcon: {
        // color: theme.palette.secondary.main,
        width: theme.spacing.unit * 2,
        height: theme.spacing.unit * 2,

    },
    actionIconInactive: {
        color: theme.palette.action.active,
        width: theme.spacing.unit * 2,
        height: theme.spacing.unit * 2,
    },
});

const defaultMonacoOptions = {
    extraEditorClassName: defaultMonacoConsoleClassName,
    wordWrap: 'on',
    overviewRulerLanes: 0,
    glyphMargin: false,
    lineNumbers: 'off',
    folding: false,
    selectOnLineNumbers: false,
    selectionHighlight: false,
    cursorStyle: 'line',
    cursorWidth: 1,
    scrollbar: {
        useShadows: false,
        horizontal: 'hidden',
        verticalScrollbarSize: 9,
    },
    lineDecorationsWidth: 0,
    scrollBeyondLastLine: false,
    renderLineHighlight: 'none',
    minimap: {
        enabled: false,
    },
    contextmenu: false,
    ariaLabel: 'ConsoleInput',
    fontFamily: 'Menlo, monospace',
    fontSize: 12,
    lineHeight: 32,
};

class ConsoleInput extends Component {
    constructor(props) {
        super(props);
        this.editorDiv = React.createRef();
        this.monacoOptions = {...defaultMonacoOptions};
        this.state = {
            commandHistory: [],
            commandCursor: -1,
            editorHeight: CONSOLE_INPUT_LINE_HEIGHT,
            isPreserveLogs: false,
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
                    editorHeight: Math.min(
                        CONSOLE_INPUT_MAX_HEIGHT,
                        lineCount * CONSOLE_INPUT_LINE_HEIGHT
                    ),
                });
                this.resizeEditor();
                lastLineCount = lineCount;
            }
        });

        editor.onKeyDown(event => {
            const e = event.browserEvent;

            if (e.keyCode === 13) {
                // Enter
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
            } else if (e.keyCode === 38) {
                // Up arrow
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
            } else if (e.keyCode === 40) {
                // Down arrow
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
        const {classes} = this.props;
        const {isPreserveLogs} = this.state;
        return (
            <div style={{height: `${this.state.editorHeight + CONSOLE_INPUT_PADDING}px`}}>
                <span className={classes.iconContainer}>
                    <ChevronRightIcon className={classes.icon}/>
                </span>

                <span className={classes.editor}>
                    <div
                        ref={this.editorDiv}
                        className={classes.editorDiv}
                    />
                </span>
                <span className={classes.actionContainer}>
                    <Tooltip title="Clear Console">
                        <IconButton aria-label="Clear Console" className={classes.clearActionIconContainer}>
                            <CancelIcon
                                onClick={clearConsole}
                                className={classes.actionIcon}
                            />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Preserve Logs">
                        <IconButton aria-label="Preserve Logs" className={classes.actionIconContainer}>
                            <DeleteSweepIcon
                                className={isPreserveLogs ? classes.actionIcon : classes.actionIconInactive}
                                onClick={this.preserveLogs}
                            />
                         </IconButton>
                    </Tooltip>
                </span>
            </div>
        );
    }

    dispatchComponentMounted = (editorId, component) => {
        const {store} = this.context;
        store.dispatch(mountEditorFulfilled(editorId, component));
    };

    componentDidMount() {
        this.dispatchComponentMounted(this.props.editorId, this);
    }

    componentDidUpdate() {
        this.resizeEditorDebounced();
    }
}

ConsoleInput.propTypes = {
    classes: PropTypes.object.isRequired,
};

ConsoleInput.contextTypes = {
    store: PropTypes.object.isRequired
};

ConsoleInput.defaultProps = {
    editorId: 'consoleInput',
    isConsole: true,
};

export default withStyles(styles)(ConsoleInput);