import React, { Component } from 'react';
import PropTypes from "prop-types";
import {withStyles} from 'material-ui/styles';
// import {loadMonacoSucceded} from '../redux/modules/monaco'

const styles = theme => ({
  playground: {
    height: '100%',
    width: '100%'
  }
});


class Playground extends Component {
  constructor(props){
    super(props);
    this.state = {
      isFirstRun: true,
      isBundle: false,
      isLoaded: false,
      isRunning: false,
      errors: null,
      editorsTexts: null
    };
  }
  render() {
    const classes = this.props.classes;
    return <div id="playground" className={classes.playground}></div>
  }

  componentDidMount(){
    const {store} = this.context;
    store.subscribe( () =>{
      if(this.state.isFirstRun && store.getState().pastebinReducer.isPastebinFetched){
        this.setState((prevState) => {
          return {...prevState, isFirstRun: false, editorsTexts:{...store.getState().pastebinReducer.initialEditorsTexts}};
        });
        this.doRun();
      }
    });
  }

  doRun() {
    const editorsTexts = this.state.editorsTexts;
    const runContainer =  document.querySelector("#playground");
    let runIframe = this.runIframe;

      if (runIframe) {
        runContainer.removeChild(runIframe);
      }
      runIframe = document.createElement('iframe');
      runIframe.id = 'runner';
      runIframe.srcdoc = editorsTexts.html;
      runIframe.className = 'run-iframe';
      runContainer.appendChild(runIframe);

      runIframe.addEventListener('load', function() {
       // runIframe.contentWindow.load(editorsTexts.js, editorsTexts.css);
      });
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
