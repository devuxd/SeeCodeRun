import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from "prop-types";
import debounce from 'lodash.debounce';
import {Subject} from 'rxjs';
import {throttleTime} from 'rxjs/operators';
import classNames from 'classnames';
import {withStyles} from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';

import SettingsIcon from '@material-ui/icons/SettingsSharp';

import {monacoEditorContentChanged, mountEditorFulfilled} from "../redux/modules/monacoEditor";
import {monacoEditorMouseEventTypes} from "../utils/monacoUtils";
import {end$} from "../utils/scrUtils";
import LiveExpressionStore from './LiveExpressionStore';
import Notification from "../components/Notification";

const mapStateToProps = (state) => {
    const {updateBundleReducer, updatePlaygroundReducer} = state;

    return {
        runTimeErrors: updatePlaygroundReducer.runtimeErrors,
        bundleErrors: updateBundleReducer.errors
    };

};
const mapDispatchToProps = {mountEditorFulfilled, monacoEditorContentChanged};

export const defaultMonacoEditorLiveExpressionClassName = 'monaco-editor-live-expression';
const styles = theme => ({
    '@global': {
        [`.${defaultMonacoEditorLiveExpressionClassName}.monaco-editor .cursors-layer > .cursor`]: {
            maxHeight: 18,
            marginTop: 7,
        }
    },
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
        marginBottom: theme.spacing(1),
    },
    fab: {
        position: 'absolute',
        bottom: theme.spacing(2),
        right: theme.spacing(2),
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
            currentContentWidgetId: null,
            forceHideWidgets: false,
            automaticLayout: false,
        };
        this.monacoEditorMouseEventsObservable = null;
        this.dispatchMouseEventsActive = false;
        this.maxLineNumber = -1;
        this.firecoPad = null;
        this.exports = {};
    }


    handleClose = (event, reason, isOpen) => {
        if (reason === 'clickaway') {
            return;
        }
        this.setState({errorSnackbarOpen: isOpen});
    };

    handleSettingsClick = () => {
        //todo: enable settings
    }

    static getDerivedStateFromProps(props) {
        const {runtimeErrors, bundleErrors, editorId} = props;
        if ((runtimeErrors && runtimeErrors[editorId]) || (bundleErrors && bundleErrors[editorId])) {
            return {
                errors: (runtimeErrors && runtimeErrors[editorId]) || (bundleErrors && bundleErrors[editorId]),
            };
        } else {
            return {
                errors: null,
            };
        }
    }

    render() {
        const {
            editorId, classes, observeLiveExpressions, themeType, liveExpressionStoreChange,
        } = this.props;
        const {
            settingsOpen, errorSnackbarOpen, errors
            //currentContentWidgetId,// forceHideWidgets
        } = this.state;
        const fabClassName =
            classNames(
                classes.fab, errorSnackbarOpen ? classes.fabMoveUp : classes.fabMoveDown
            );
        const notificationType = errors ? 'error' : ''
        return (<div className={classes.container}>
                <div ref={this.editorDiv}
                     className={classes.editor}
                />
                {observeLiveExpressions &&
                <LiveExpressionStore
                    // container={this}
                    editorId={editorId}
                    editorWidth={this.editorWidth}
                    editorHeight={this.editorHeight}
                    themeType={themeType}
                    exports={this.exports}
                    //currentContentWidgetId={currentContentWidgetId}
                    // forceHideWidgets={forceHideWidgets}
                    liveExpressionStoreChange={liveExpressionStoreChange}
                />
                }
                {errors && <Notification
                    type={notificationType}
                    onClose={this.handleClose}
                    message={errors}/>}
                {settingsOpen ?
                    (
                        <Fab mini="true" color="secondary" aria-label="settings"
                             className={fabClassName}
                             onClick={this.handleSettingsClick}>
                            <SettingsIcon/>
                        </Fab>)
                    : null
                }
            </div>
        );
    }

    firecoPadDidMount = (firecoPad) => {
        this.firecoPad = firecoPad;
        const {updateMonacoEditorLayout} = this.props;
        updateMonacoEditorLayout && updateMonacoEditorLayout(() => {
            if (this.firecoPad && this.firecoPad.monacoEditor) {
                this.firecoPad.monacoEditor.layout();
            }
        });

        if (this.exports.updateLiveExpressionWidgetWidths) {
            if (this.firecoPad.monacoEditor) {
                this.firecoPad.monacoEditor.onDidScrollChange(this.exports.updateLiveExpressionWidgetWidths);
            }
        }
    };

    componentDidMount() {
        const {editorId, mountEditorFulfilled, monacoEditorContentChanged, isConsole} = this.props;
        const {
            editorDiv, /*dispatchMouseEvents,*/
            firecoPadDidMount, monacoOptions
        } = this;
        mountEditorFulfilled(editorId, {
            editorDiv, monacoEditorContentChanged, /*dispatchMouseEvents,*/
            firecoPadDidMount, isConsole, monacoOptions
        });
        this.updateEditorDimensions();
    }

    updateEditorDimensions = debounce(() => {
        if (this.editorDiv.current) {
            this.editorWidth = this.editorDiv.current.offsetWidth;
            this.editorHeight = this.editorDiv.current.offsetHeight;
        }
    }, 100);

    componentDidUpdate() {
        this.updateEditorDimensions();
    }

    componentWillUnmount() {
        this.monacoEditorMouseEventsObservable && this.monacoEditorMouseEventsObservable.takeUntil(end$);
        const {contentWidgetMouseEventSubjects} = this;
        contentWidgetMouseEventSubjects &&
        (contentWidgetMouseEventSubjects.mouseMove.complete() || contentWidgetMouseEventSubjects.mouseLeave.complete());

        const {updateMonacoEditorLayout} = this.props;
        updateMonacoEditorLayout && updateMonacoEditorLayout(null);
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
            // .throttleTime(100)
            .debounceTime(500)
            .subscribe(payload => {
                this.setState({currentContentWidgetId: null});
                setTimeout(() => {
                    this.setState(payload);
                }, 0);
            });

        contentWidgetMouseEventSubjects.mouseLeave
            .pipe(throttleTime(50))
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

Editor.propTypes = {
    editorId: PropTypes.string.isRequired,
    classes: PropTypes.object.isRequired,
    updateMonacoEditorLayout: PropTypes.func,
    observeMouseEvents: PropTypes.bool,
    mouseEventsDisabled: PropTypes.bool,
    observeLiveExpressions: PropTypes.bool,
    setLiveExpressionStoreChange: PropTypes.func,
    mountEditorFulfilled: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Editor));
