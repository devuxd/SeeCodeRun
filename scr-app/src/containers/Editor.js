import React, {Component} from 'react';
import PropTypes from "prop-types";
import {withStyles} from 'material-ui/styles';
import {mountEditorFulfilled} from "../redux/modules/monacoEditor";
import ExpressionPopover from "./ExpressionPopover";
import {monacoEditorMouseEventTypes} from "../utils/monacoUtils";
import {updatePlayground} from "../redux/modules/playground";

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
    this.context.store.dispatch(mountEditorFulfilled(this.props.editorId, this.editorDiv, this.dispatchFirecoActions, this.dispatchMouseEvents));
  }
  
  componentWillUnmount(){
    for(const i in this.unsubscribes){
      this.unsubscribes[i]();
    }
  }
  
  dispatchModelChanges (monacoEditorOnDidChangeModelContentSubject, store){
    const unsubscribe1= monacoEditorOnDidChangeModelContentSubject
      .throttleTime(1000)
      .subscribe(action =>{
        store.dispatch({...action, type: 'EDITOR_CHANGE'});
      });
  
    const unsubscribe2 = monacoEditorOnDidChangeModelContentSubject
      .debounceTime(2000)
      .subscribe(action =>{
       store.dispatch(action);
      });
    this.unsubscribes.push(unsubscribe1);
    this.unsubscribes.push(unsubscribe2);
  }
  
  dispatchFirecoActions = (monacoEditorOnDidChangeModelContentSubject, configureGetTextListener, configureSetTextListener, firecoObservable, setEditorText) => {
    const {store } =this.context;
    const unsubscribe0= firecoObservable.subscribe(payload => {
      switch (payload.type) {
        case 'FIRECO_WORKER_READY':// happens to all editor instances
          configureGetTextListener();
          configureSetTextListener();
          this.dispatchModelChanges(monacoEditorOnDidChangeModelContentSubject, store);
          break;
        case 'FIRECO_GET_TEXT_FULFILLED': // this is a class observer now
          setEditorText(payload.editorId, payload.text);
         monacoEditorOnDidChangeModelContentSubject.next(updatePlayground(payload.editorId, payload.text));
          break;
        default:
      }
    });
    this.unsubscribes.push(unsubscribe0);
  };
  
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
