import React, {Component} from 'react';
import PropTypes from "prop-types";
import {withStyles} from 'material-ui/styles';
import AutoLog from "../seecoderun/modules/AutoLog";
// import {loadMonacoSucceded} from '../redux/modules/monaco'

const styles = theme => ({
  playground: {
    height: '100%',
    width: '100%'
  }
});


class Playground extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isFirstRun: true,
      isUpdated: false,
      isBundled: false,
      isLoaded: false,
      isRunning: false,
      errors: null,
      editorsTexts: null
    };
  }

  render() {
    const classes = this.props.classes;
    return <div id="playground" className={classes.playground}></div>;
  }

  componentDidMount() {
    const {store} = this.context;
    store.subscribe(() => {
      if (this.state.isFirstRun && store.getState().pastebinReducer.isPastebinFetched) {
        this.setState((prevState) => {
          return {
            ...prevState,
            isFirstRun: false,
            editorsTexts: {...store.getState().pastebinReducer.initialEditorsTexts}
          };
        });
        this.doRun();
      }
      if (this.state.editorsTexts !== store.getState().updatePlaygroundReducer.editorsTexts) {
        this.setState((prevState) => {
          return {...prevState, isUpdated: true, editorsTexts: store.getState().updatePlaygroundReducer.editorsTexts};
        });
        this.doRun();
      }
    });
  }

  doRun() {
    //const {store} = this.context;
    const editorsTexts = this.state.editorsTexts;
    const runContainer = document.querySelector("#playground");
    if(editorsTexts.js){
      const autoLog = new AutoLog(editorsTexts.js);
      try{
        console.log( editorsTexts.js, autoLog.toSource());
      }catch (e){
        console.log( editorsTexts.js, e);
      }
    }

    let runIframe = this.runIframe;

    if (runIframe) {
      runContainer.removeChild(runIframe);
    }
    runIframe = document.createElement('iframe');
    runIframe.id = 'runner';
    runIframe.srcdoc = editorsTexts.html;
    runIframe.className = 'run-iframe';
    runContainer.appendChild(runIframe);

    runIframe.addEventListener('load', function () {
      if (runIframe.contentWindow) {
        if (runIframe.contentWindow.load) {
          runIframe.contentWindow.load(editorsTexts.js, editorsTexts.css);
        }
        const log = runIframe.contentWindow.console.log;
        runIframe.contentWindow.console.log = function (type, info = {}, params = []) {
          if (type === 'SCR_LOG' && info.location) {
            // store.dispatch();
          } else {
            log(...params);
          }

        };
        // store.dispatch();
        return;
      }
      // store.dispatch();
    });
    this.setState(...this.state, {isUpdated: false});
    this.runIframe = runIframe;
  }
}

Playground.contextTypes = {
  store: PropTypes.object.isRequired
};

Playground.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Playground);
