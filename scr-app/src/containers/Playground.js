import React, {Component} from 'react';
import PropTypes from "prop-types";
import {withStyles} from 'material-ui/styles';
import _ from 'lodash';
import {Subject} from "rxjs";

import AutoLog from "../seecoderun/modules/AutoLog";
import {updatePlaygroundInstrumentationSuccess} from "../redux/modules/playground";
import {updatePlaygroundInstrumentationFailure} from "../redux/modules/playground";

const styles=() => ({
  playground: {
    height: '100%',
    width: '100%',
    // margin: 0,
    // padding: 0,
    // border: 0,
    '-webkit-font-smoothing': 'unset',
    boxSizing: 'unset'
  }
});


class Playground extends Component {
  playgroundDOMNode=null;
  isBundling=false;
  currentEditorsTexts=null;
  unsubscribes=[];
  
  render() {
    const classes=this.props.classes;
    return (<div className={classes.playground} ref={(DOMNode) => {
      this.playgroundDOMNode=DOMNode;
    }}></div>);
  }
  
  observeBundling=bundlingObservable => {
    return bundlingObservable
      .throttleTime(500)
      .debounceTime(1000)
      .subscribe(currentEditorsTexts => {
        this.isBundling=true;
        // console.log("B", currentEditorsTexts);
        this.bundle(currentEditorsTexts);
        this.isBundling=false;
      })
  };
  
  componentDidMount() {
    this.autoLog=new AutoLog();
    this.unsubscribes=[];
    const {store}=this.context;
    this.bundlingSubject=new Subject();
    const unsubscribe0=store.subscribe(() => {
      // if(!store.getState().firecoReducer.areFirecoEditorsConfigured){
      //   return;
      // }
      if (!_.isEqual(this.currentEditorsTexts, store.getState().pastebinReducer.editorsTexts)) {
        this.currentEditorsTexts = store.getState().pastebinReducer.editorsTexts;
        if (this.runIframe) {
          this.playgroundDOMNode.removeChild(this.runIframe);
          this.runIframe = null;
        }
        this.bundlingSubject.next(this.currentEditorsTexts);
      }
    });
    
    this.unsubscribes.push(unsubscribe0);
    this.unsubscribes.push(this.observeBundling(this.bundlingSubject));
  }
  
  componentWillUnmount() {
    this.bundlingSubject.complete();
    for (const i in this.unsubscribes) {
      this.unsubscribes[i]();
    }
  }
  
  /**
   *
   * @param {Object} editorsTexts - Requires editorsTexts.html,
   * editorsTexts.css and editorsTexts.js to contain text.
   */
  bundle(editorsTexts) {
    
    const playgroundDOMNode=this.playgroundDOMNode;
    if (!playgroundDOMNode) {
      return;
    }
    
    const {store}=this.context;
    
    const html=editorsTexts.html;
    const css=editorsTexts.css;
    const js=editorsTexts.js;
    let alJs=js;
    
    const autoLog=this.autoLog;
    let al = null;
    
    try {
      al = autoLog.transform(js);
      alJs= al.code;
      // store.dispatch({type: 'INST', al:al});
      // console.log('js', al);
      store.dispatch(updatePlaygroundInstrumentationSuccess('js',al));
    } catch (e) {
      // console.log("error", e);
      //store.dispatch();
  
      store.dispatch(updatePlaygroundInstrumentationFailure('js', e));
    }
    
    const runIframe=document.createElement('iframe');

    autoLog.configureIframe(runIframe, store, al, html, css, js, alJs);
    
    // if (this.runIframe) {
    //   playgroundDOMNode.removeChild(this.runIframe);
    // }
    
    playgroundDOMNode.appendChild(runIframe);
    this.runIframe=runIframe;
  }
  
}

Playground.contextTypes={
  store: PropTypes.object.isRequired
};

Playground.propTypes={
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Playground);
