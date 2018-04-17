import React, {Component} from 'react';
import PropTypes from "prop-types";
import {Subject} from 'rxjs/Subject';
import classNames from 'classnames';
import {withStyles} from 'material-ui/styles';
import Button from 'material-ui/Button';
import CloseIcon from '@material-ui/icons/Close';
// import WarningIcon from '@material-ui/icons/Warning';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import SettingsIcon from '@material-ui/icons/Settings';
import Snackbar from 'material-ui/Snackbar';
import {mountEditorFulfilled} from "../redux/modules/monacoEditor";
import {monacoEditorMouseEventTypes} from "../utils/monacoUtils";
import {end$} from "../utils/scrUtils";
import LiveExpressionStore from './LiveExpressionStore';

const styles = theme => ({
    container: {
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    editor: {
        height: '100%'
    },
    menuButton: {
        marginLeft: -12,
        marginRight: 20,
    },
    button: {
        marginBottom: theme.spacing.unit,
    },
    fab: {
        position: 'absolute',
        bottom: theme.spacing.unit * 2,
        right: theme.spacing.unit * 2,
    },
    fabMoveUp: {
        transform: 'translate3d(0, -46px, 0)',
        transition: theme.transitions.create('transform', {
            duration: theme.transitions.duration.enteringScreen,
            easing: theme.transitions.easing.easeOut,
        }),
    },
    fabMoveDown: {
        transform: 'translate3d(0, 0, 0)',
        transition: theme.transitions.create('transform', {
            duration: theme.transitions.duration.leavingScreen,
            easing: theme.transitions.easing.sharp,
        }),
    },
    snackbar: {
        //position: 'absolute',
    },
    snackbarContent: {
        maxWidth: 'inherit',
        width: '100%',
    },
});

class Editor extends Component {
    constructor(props) {
        super(props);
        this.editorDiv = React.createRef();
        this.state = {
            focused: false,
            settingsOpen: false,
            errorSnackbarOpen: false,
            anchorEl: null,
            mouseEvent: null,
            errors: null,
            currentContentWidgetId: null,
            forceHideWidgets: false,
        };
        this.monacoEditorMouseEventsObservable = null;
        this.dispatchMouseEventsActive = false;
        this.maxLineNumber = -1;
    }


    handleClick = () => {
        this.setState(prevState =>
            ({errorSnackbarOpen: !prevState.errorSnackbarOpen})
        );
    };

    handleClose = () => {
        this.setState({errorSnackbarOpen: false});
    };

    onContentChangedAction = () => {
    };

    render() {
        const {classes, observeLiveExpressions, editorId, themeType, liveExpressionStoreChange} = this.props;
        const {
            settingsOpen, errorSnackbarOpen, errors,
            currentContentWidgetId,// forceHideWidgets
        } = this.state;
        const fabClassName =
            classNames(
                classes.fab, errorSnackbarOpen ? classes.fabMoveUp : classes.fabMoveDown
            );

        return (<div className={classes.container}>
                <div id={editorId}
                     ref={this.editorDiv}
                     className={classes.editor}
                />
                {observeLiveExpressions &&
                <LiveExpressionStore
                    // container={this}
                    editorId={editorId}
                    editorWidth={this.editorWidth}
                    editorHeight={this.editorHeight}
                    themeType={themeType}
                    currentContentWidgetId={currentContentWidgetId}
                    // forceHideWidgets={forceHideWidgets}
                    liveExpressionStoreChange={liveExpressionStoreChange}
                />
                }
                <Snackbar
                    open={errorSnackbarOpen}
                    onClose={this.handleClose}
                    SnackbarContentProps={{
                        'aria-describedby': 'snackbar-fab-message-id',
                        className: classes.snackbarContent,
                    }}
                    message={<span id="snackbar-fab-message-id"><ErrorOutlineIcon
                        color="error"/><span>{JSON.stringify(errors)}</span></span>}
                    action={
                        <Button size="small" color="inherit" onClick={this.handleClose}>
                            <CloseIcon/>
                        </Button>
                    }
                    className={classes.snackbar}
                />
                {settingsOpen ?
                    (
                        <Button variant="fab" mini color="secondary" aria-label="settings"
                                className={fabClassName}
                                onClick={this.handleClick}>
                            <SettingsIcon/>
                        </Button>)
                    : null
                }
            </div>
        );
    }

    componentDidMount() {
        this.unsubscribes = [];
        const {editorId} = this.props;
        const {store} = this.context;
        this.onContentChangedAction = action => {
            store.dispatch(action);
        };
        store.dispatch(mountEditorFulfilled(this.props.editorId, this));
        const unsubscribe0 = store.subscribe(() => {
            const currentErrors =
                store.getState().updatePlaygroundReducer.runtimeErrors ?
                    store.getState().updatePlaygroundReducer.runtimeErrors[editorId]
                    : null;
            if (currentErrors !== this.state.errors) {
                if (currentErrors) {
                    console.log("rrrrrrr", currentErrors.loc, currentErrors.stack);
                } else {
                    console.log("EMPTY");
                }

                this.setState({
                    errorSnackbarOpen: !!currentErrors,
                    errors: currentErrors,
                });
            }
        });
        this.unsubscribes.push(unsubscribe0);
    }

    componentDidUpdate() {
        clearTimeout(this.tmw);
        const delay = this.editorWidth || !this.wt ? 0 : 100;
        this.wt = this.wt ? this.wt - 1 : 5;
        this.tmw = setTimeout(() => {
            if (this.editorDiv.current) {
                this.editorWidth = this.editorDiv.current.offsetWidth;
                this.editorHeight = this.editorDiv.current.offsetHeight;
            }
        }, delay);
    }

    componentWillUnmount() {
        for (const i in this.unsubscribes) {
            console.log(i, this.unsubscribes[i]);
            this.unsubscribes[i] && this.unsubscribes[i]();
        }
        this.monacoEditorMouseEventsObservable && this.monacoEditorMouseEventsObservable.takeUntil(end$);
        const {contentWidgetMouseEventSubjects} = this;
        contentWidgetMouseEventSubjects &&
        (contentWidgetMouseEventSubjects.mouseMove.complete() || contentWidgetMouseEventSubjects.mouseLeave.complete());
    }


    dispatchMouseEvents = monacoEditorMouseEventsObservable => {
        const {observeMouseEvents} = this.props;
        if (monacoEditorMouseEventsObservable) {
            this.monacoEditorMouseEventsObservable = monacoEditorMouseEventsObservable;
        }

        if (!observeMouseEvents
            || !this.monacoEditorMouseEventsObservable
            || this.dispatchMouseEventsActive) {
            return;
        }
        let contentWidgetMouseEventSubjects = {
            mouseMove: new Subject(),
            mouseLeave: new Subject(),
        };

        contentWidgetMouseEventSubjects.mouseMove
            .throttleTime(100)
            .debounceTime(500)
            .subscribe(payload => {
                this.setState({currentContentWidgetId: null});
                setTimeout(() => {
                    this.setState(payload);
                }, 0);
            });

        contentWidgetMouseEventSubjects.mouseLeave
            .throttleTime(50)
            .debounceTime(100)
            .subscribe(payload => {
                this.setState(payload);
            });

        this.contentWidgetMouseEventSubjects = contentWidgetMouseEventSubjects;

        this.monacoEditorMouseEventsObservable // debounce or throttle will mess mouseleave, blur, and focus
            .subscribe(mouseEvent => {
                if (this.props.mouseEventsDisabled) {
                    return;
                }
                switch (mouseEvent.type) {
                    case monacoEditorMouseEventTypes.focusEditor:
                        this.setState({
                            mouseEvent: mouseEvent,
                            focused: true,
                            currentContentWidgetId: null,
                            forceHideWidgets: true,
                        });
                        return;
                    case monacoEditorMouseEventTypes.blurEditor:
                        this.setState({
                            anchorEl: null,
                            mouseEvent: mouseEvent,
                            focused: false,
                        });
                        return;
                    case monacoEditorMouseEventTypes.mouseMove:
                        if (mouseEvent.event.target.type ===
                            window.monaco.editor.MouseTargetType.CONTENT_WIDGET) {
                            // console.log('m', 'CONTENT_WIDGET',
                            //   mouseEvent.event.target.detail
                            // );
                            contentWidgetMouseEventSubjects.mouseMove.next({
                                currentContentWidgetId: mouseEvent.event.target.detail,
                                forceHideWidgets: false
                            });
                        } else {
                            contentWidgetMouseEventSubjects.mouseLeave.next({
                                currentContentWidgetId: null,
                                forceHideWidgets: false
                            });
                        }

                        if (!this.state.focused) {
                            return;
                        }

                        this.setState({
                            anchorEl: mouseEvent.event.target.element,
                            mouseEvent: mouseEvent,
                        });
                        return;
                    case monacoEditorMouseEventTypes.mouseDown:
                        if (!this.state.focused) {
                            return;
                        }
                        this.setState({anchorEl: null, mouseEvent: null});
                        break;
                    case monacoEditorMouseEventTypes.contextMenu:
                        if (!this.state.focused) {
                            return;
                        }
                        this.setState({anchorEl: null, mouseEvent: null});
                        break;
                    case monacoEditorMouseEventTypes.mouseLeave:
                        contentWidgetMouseEventSubjects.mouseLeave.next({
                            currentContentWidgetId: null,
                            forceHideWidgets: false
                        });
                        if (!this.state.focused) {
                            return;
                        }
                        this.setState({anchorEl: null, mouseEvent: null});
                        break;
                    default:
                }
            });
        this.dispatchMouseEventsActive = true;
    };
}

Editor.contextTypes = {
    store: PropTypes.object.isRequired
};

Editor.propTypes = {
    editorId: PropTypes.string.isRequired,
    classes: PropTypes.object.isRequired,
    observeMouseEvents: PropTypes.bool,
    mouseEventsDisabled: PropTypes.bool,
    observeLiveExpressions: PropTypes.bool,
    setLiveExpressionStoreChange: PropTypes.func,
};

export default withStyles(styles)(Editor);
