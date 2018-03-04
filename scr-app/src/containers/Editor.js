import React, {Component} from 'react';
import PropTypes from "prop-types";
import {withStyles} from 'material-ui/styles';
import {mountEditorFulfilled} from "../redux/modules/monacoEditor";
import ExpressionPopover from "./ExpressionPopover";
import {monacoEditorMouseEventTypes} from "../utils/monacoUtils";

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
      <div id={editorId} ref={el=>{this.editorDiv = el}} className={classes.editor}></div>
      <ExpressionPopover anchorEl={anchorEl} mouseEvent={mouseEvent}/>
    </div>);
  }

  componentDidMount() {
    this.unsubscribes = [];
    this.context.store.dispatch(mountEditorFulfilled(this.props.editorId, this.editorDiv, this.dispatchMouseEvents));
  }
  
  componentWillUnmount(){
    for(const i in this.unsubscribes){
      this.unsubscribes[i]();
    }
  }
  
  
  dispatchMouseEvents = monacoEditorMouseEventsObservable => {
    const unsubscribe4 =
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
            // avoids popover's enter-leave events on open
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
    this.unsubscribes.push(unsubscribe4);
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
