import React, {Component} from 'react';
import PropTypes from "prop-types";
import {withStyles} from 'material-ui/styles';
import {mountEditorFulfilled} from "../redux/modules/monacoEditor";

import {updatePlayground} from "../redux/modules/playground";
import {firecoGetTextFulfilled, firecoSetTextFulfilled} from "../redux/modules/fireco";

const styles = () => ({
  editor: {
    height: '100%'
  }
});

class Editor extends Component {

  render() {
    const classes = this.props.classes;
    return <div id={this.props.editorId} className={classes.editor}></div>
  }

  componentDidMount() {
    this.context.store.dispatch(mountEditorFulfilled(this.props.editorId, this.dispatchFirecoActions));
  }

  dispatchFirecoActions = (configureGetTextListener, configureSetTextListener, firecoObservable, setEditorText) => {
    firecoObservable.subscribe(payload => {
      switch (payload.type) {
        case 'FIRECO_WORKER_READY':// happens to all editor instances
          configureGetTextListener();
          configureSetTextListener();
          break;
        case 'FIRECO_GET_TEXT_FULFILLED': // this is a class observer now
          setEditorText(payload.editorId , payload.text);
          break;
        default:
      }
    });
  }
}

Editor.contextTypes = {
  store: PropTypes.object.isRequired
};

Editor.propTypes = {
  editorId: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Editor);
