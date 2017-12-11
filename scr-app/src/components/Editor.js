import React, {Component} from 'react';
import PropTypes from "prop-types";
import {withStyles} from 'material-ui/styles';
import {mountEditorFulfilled} from "../redux/modules/monacoEditor";
import {firecoGetTextFulfilled, firecoSetTextFulfilled} from "../redux/modules/fireco";

const styles = () => ({
  editor: {
    height: '100%'
  }
});

class JsEditor extends Component {

  render() {
    const classes = this.props.classes;
    return <div id={this.props.editorId} className={classes.editor}></div>
  }

  componentDidMount() {
    this.context.store.dispatch(mountEditorFulfilled(this.props.editorId, this.dispatchFirecoActions));
  }

  dispatchFirecoActions = (configureGetTextListener, configureSetTextListener, firecoObservable, setEditorText) => {
    const editorId = this.props.editorId;
    // const store = this.context.store;

    firecoObservable.filter(action => action.type === 'FIRECO_WORKER_READY').do(() => {
      configureGetTextListener();
      configureSetTextListener();
      console.log("CONFIG", editorId)
    }).subscribe(() => (console.log("FILTERED", editorId)));
    //.filter(action => action.editorId === editorId)
    firecoObservable.subscribe(payload => {
      // if (payload.editorId !== editorId) {
      //   console.log(editorId, "IGNORE", payload);
      //   return;
      // }
      switch (payload.type) {
        case 'FIRECO_GET_TEXT_FULFILLED':
          console.log(payload.editorId , "DO", payload);
          setEditorText(payload.editorId , payload.text);
          break;
        default:
          console.log(payload.editorId , "PASS", payload);
      }
    });
  }

}

JsEditor.contextTypes = {
  store: PropTypes.object.isRequired
};

JsEditor.propTypes = {
  editorId: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(JsEditor);
