import {PureComponent, createRef} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import {withStyles} from '@mui/styles';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CancelIcon from 'mdi-material-ui/Cancel';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

import {
    monacoEditorContentChanged,
    mountEditorFulfilled
} from "../redux/modules/monacoEditor";
import {
    canDispatch,
    clearConsole,
    dispatch,
    preserveLogs
} from "../core/modules/Trace";
import {defaultSimpleMonacoOptions} from '../utils/monacoUtils';

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
            color: `${theme.palette.success.light} !important`,
        },
        [`.${defaultMonacoConsoleClassName} .mtk12.PropertyAssignment`]: {
            color: theme.palette.success.light,
        },
        [`.${
            defaultMonacoConsoleClassName
        } .mtk12.PropertyAssignment.PropertyAccessExpression`]: {
            color: theme.palette.warning.light,
        },
        [
        `.${
            defaultMonacoConsoleClassName
        } .Identifier.CallExpression .OpenParenToken.CallExpression` +
        ' .Identifier.CallExpression'
            ]: {
            color: `${theme.palette.warning.light} !important`,
        },
        [`.${
            defaultMonacoConsoleClassName
        }.monaco-editor .cursors-layer > .cursor`]: {
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
        width: `calc(100% - ${theme.spacing(10)})`
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
        fontSize: theme.typography.pxToRem(16),
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

class ConsoleInput extends PureComponent {
    constructor(props) {
        super(props);
        this.editorRef = createRef();
        this.monacoOptions = {...defaultMonacoOptions};
        this.state = {
            commandHistory: [],
            commandCursor: -1,
            isPreserveLogs: false,
            ...(getHeights()),
        };
        this.editor = null;
        this.containerStyle = {height: this.state.containerHeight};
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
        //onDidChangeModelContentOrError
        editor.onDidChangeModelContent((changes) => {

            // console.log("onDidChangeModelContent", changes);
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

                const newCursor =
                    Math.max(this.state.commandCursor - 1, -1);
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
        const {isPreserveLogs} = this.state;
        return (
            <div style={this.containerStyle}>
                <span className={classes.iconContainer}>
                    <ChevronRightIcon className={classes.icon}/>
                </span>

                <span className={classes.editor}>
                    {activateConsole &&
                        <div
                            ref={this.editorRef}
                            className={classes.editorDiv}
                        />
                    }
                </span>
                <span className={classes.actionContainer}>
                    <Tooltip title="Clear Console">
                        <IconButton aria-label="Clear Console"
                                    className={classes.clearActionIconContainer}
                                    onClick={clearConsole}>
                            <CancelIcon
                                className={classes.actionIcon}
                            />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Preserve Logs">
                        <IconButton aria-label="Preserve Logs"
                                    className={classes.actionIconContainer}
                                    onClick={this.preserveLogs}>
                            <DeleteSweepIcon
                                className={isPreserveLogs ?
                                    classes.actionIcon
                                    : classes.actionIconInactive
                                }
                            />
                         </IconButton>
                    </Tooltip>
                </span>
            </div>
        );
    }

    done = false;

    componentDidUpdate(prevProps, prevState) {
        const {activateConsole, onHeightChange} = this.props
        if (activateConsole && activateConsole !== prevProps.activateConsole) {
            const {
                editorId,
                mountEditorFulfilled,
                monacoEditorContentChanged,
                isConsole
            } = this.props;
            const {
                editorRef, /*dispatchMouseEvents,*/
                editorDidMount, monacoOptions
            } = this;

            if (!this.done) {
                mountEditorFulfilled(editorId, {
                    editorRef, monacoEditorContentChanged, /*dispatchMouseEvents,*/
                    editorDidMount, isConsole, monacoOptions
                });
                this.done = true;
            }
        }
        const {editorHeight, containerHeight} = this.state
        if (editorHeight !== prevState.editorHeight) {
            this.containerStyle.height = containerHeight;
            onHeightChange &&
            onHeightChange(null, {editorHeight, containerHeight});
        }
        this.resizeEditorDebounced();
    }
}

ConsoleInput.propTypes = {
    editorId: PropTypes.string,
    isConsole: PropTypes.bool,
    classes: PropTypes.object.isRequired,
    mountEditorFulfilled: PropTypes.func.isRequired,
    onHeightChange: PropTypes.func,
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withStyles(styles)(ConsoleInput));
