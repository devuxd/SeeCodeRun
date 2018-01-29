import React, {Component} from 'react';
import PropTypes from "prop-types";
import {withStyles} from 'material-ui/styles';
import {mountEditorFulfilled} from "../redux/modules/monacoEditor";
import ExpressionPopover from "./ExpressionPopover";
import {monacoEditorMouseEventTypes} from "../utils/MonacoUtils";

const styles = () => ({
  container: {
    height: '100%'
  },
  editor: {
    height: '100%'
  }
});

class Editor extends Component {
  state = {
    anchorEl: null,
    mouseEvent: null,
    ignoreFirstEvent: false,
  };

  render() {
    const {editorId, classes} = this.props;
    const {anchorEl, mouseEvent} = this.state;
    return (<div className={classes.container}>
      <div id={editorId} className={classes.editor}></div>
      <ExpressionPopover anchorEl={anchorEl} mouseEvent={mouseEvent}/>
    </div>);
  }

  componentDidMount() {
    this.context.store.dispatch(mountEditorFulfilled(this.props.editorId, this.dispatchFirecoActions, this.dispatchMouseEvents));
  }

  dispatchFirecoActions = (configureGetTextListener, configureSetTextListener, firecoObservable, setEditorText) => {
    firecoObservable.subscribe(payload => {
      switch (payload.type) {
        case 'FIRECO_WORKER_READY':// happens to all editor instances
          configureGetTextListener();
          configureSetTextListener(this.context.store);
          break;
        case 'FIRECO_GET_TEXT_FULFILLED': // this is a class observer now
          setEditorText(payload.editorId, payload.text);
          break;
        default:
      }
    });
  };

  dispatchMouseEvents = monacoEditorMouseEventsObservable => {
    monacoEditorMouseEventsObservable
      .debounceTime(500)
      .subscribe(mouseEvent => {
        switch (mouseEvent.type) {
          case monacoEditorMouseEventTypes.mouseMove:
              this.setState({anchorEl: mouseEvent.event.target.element, mouseEvent: mouseEvent, ignoreFirstEvent: true});
            break;
          case monacoEditorMouseEventTypes.mouseDown:
              this.setState({anchorEl: null, mouseEvent: null});
            break;
          case monacoEditorMouseEventTypes.contextMenu:
            this.setState({anchorEl: null, mouseEvent: null});
            break;
          case monacoEditorMouseEventTypes.mouseLeave:
            // console.log("le", mouseEvent.event);
            const {ignoreFirstEvent} = this.state;
            if (ignoreFirstEvent) {
              this.setState({ignoreFirstEvent: false});
            } else {
              this.setState({anchorEl: null, mouseEvent: null});
            }
            break;
          default:
        }
      });
  };
}

Editor.contextTypes = {
  store: PropTypes.object.isRequired
};

Editor.propTypes = {
  editorId: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Editor);
