import React, {Component} from 'react';
import PropTypes from "prop-types";
import {withStyles} from 'material-ui/styles';
import AutoLog from "../seecoderun/modules/AutoLog";
import _ from 'lodash';
import localStorage from 'store';
import JSAN from 'jsan';
// import {loadMonacoSucceded} from '../redux/modules/monaco'

const styles = theme => ({
  playground: {
    height: '100%',
    width: '100%'
  }
});

let currentEditorsTexts = {};
let ignore = false;

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
      if(this.state.isFirstRun && store.getState().pastebinReducer.pastebinId){
        this.setState({
          isFirstRun: false,
        });
       const localEditorsTexts = localStorage.get(`scr_monacoEditorsSavedStates#${store.getState().pastebinReducer.pastebinId}`);
       if(localEditorsTexts){
         currentEditorsTexts={
           js: localEditorsTexts["js"].text, html: localEditorsTexts["html"].text, css: localEditorsTexts["css"].text,
         };
         this.doRun();
         return;
       }

      }

      if (this.state.isFirstRun && store.getState().pastebinReducer.isPastebinFetched) {
        this.setState({
          isFirstRun: false,
        });
        currentEditorsTexts=store.getState().pastebinReducer.initialEditorsTexts;
        this.doRun();
        return;
      }

      // if (this.state.editorsTexts !== store.getState().updatePlaygroundReducer.editorsTexts) {
      //   this.setState({
      //     isUpdated: true,
      //     editorsTexts: store.getState().updatePlaygroundReducer.editorsTexts
      //   });
      //   this.doRun();
      // }

      let newCurrentEditorsTexts = {...currentEditorsTexts, ...store.getState().updatePlaygroundReducer.editorsTexts};
      if (!ignore&& !_.isEqual(newCurrentEditorsTexts, currentEditorsTexts)) {
        currentEditorsTexts = newCurrentEditorsTexts;
        // console.log(store.getState().updatePlaygroundReducer.editorsTexts, currentEditorsTexts);
        // console.log(_.isEqual(store.getState().updatePlaygroundReducer.editorsTexts, currentEditorsTexts),store.getState().updatePlaygroundReducer.editorsTexts, currentEditorsTexts);

        this.doRun();
      }

    });
  }

  doRun=()=> {
    ignore = true;
    const {store} = this.context;
    const editorsTexts = currentEditorsTexts;
    const runContainer = document.querySelector("#playground");
    let code =editorsTexts.js;
    let autoLog = {};
    if (editorsTexts.js) {
       autoLog = new AutoLog(editorsTexts.js);
      try {
        code = autoLog.toSource();
        // console.log(editorsTexts.js, );
      } catch (e) {
        console.log(editorsTexts.js, e);
      }
    }
    // console.log("ddd");

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
        runIframe.contentWindow._0= function(id, data){

         store.dispatch({type:'TRACE', action: {loc: autoLog.locationMap[id].loc,id: id, data:JSAN.stringify(data)} });
         //  console.log(autoLog.locationMap[id].loc, id, data);
        };
        if (runIframe.contentWindow.load) {
          runIframe.contentWindow.load(code, editorsTexts.css);
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
    //this.setState({isUpdated: true});
    this.runIframe = runIframe;
    ignore = false;
  }


  // doRun2() {
  //
  //   //const {store} = this.context;
  //   const editorsTexts = this.state.editorsTexts;
  //   const runContainer = document.querySelector("#playground");
  //   if (editorsTexts.js) {
  //     const autoLog = new AutoLog(editorsTexts.js);
  //     try {
  //       // console.log(editorsTexts.js, autoLog.toSource());
  //     } catch (e) {
  //       console.log(editorsTexts.js, e);
  //     }
  //   }
  //
  //   let runIframe = this.runIframe;
  //
  //   if (runIframe) {
  //     runContainer.removeChild(runIframe);
  //   }
  //   runIframe = document.createElement('iframe');
  //   runIframe.id = 'runner';
  //   runIframe.srcdoc = editorsTexts.html;
  //   runIframe.className = 'run-iframe';
  //   runContainer.appendChild(runIframe);
  //
  //   runIframe.addEventListener('load', function () {
  //     if (runIframe.contentWindow) {
  //       if (runIframe.contentWindow.load) {
  //         runIframe.contentWindow.load(editorsTexts.js, editorsTexts.css);
  //       }
  //       const log = runIframe.contentWindow.console.log;
  //       runIframe.contentWindow.console.log = function (type, info = {}, params = []) {
  //         if (type === 'SCR_LOG' && info.location) {
  //           // store.dispatch();
  //         } else {
  //           log(...params);
  //         }
  //
  //       };
  //       // store.dispatch();
  //       return;
  //     }
  //     // store.dispatch();
  //   });
  //   //this.setState({isUpdated: true});
  //   this.runIframe = runIframe;
  // }
}

Playground.contextTypes = {
  store: PropTypes.object.isRequired
};

Playground.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Playground);
