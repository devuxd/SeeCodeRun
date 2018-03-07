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
    const {classes}=this.props;
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
      if (!_.isEqual(this.currentEditorsTexts, store.getState().pastebinReducer.editorsTexts)) {
        this.currentEditorsTexts=store.getState().pastebinReducer.editorsTexts;
        if (this.runIframe) {
          this.playgroundDOMNode.removeChild(this.runIframe);
          this.runIframe=null;
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
    const {editorIds}=this.props;
    const {store}=this.context;
    
    const html=editorsTexts[editorIds['html']];
    const css=editorsTexts[editorIds['css']];
    const js=editorsTexts[editorIds['js']];
    
    if(!_.isString(html)||!_.isString(css)||!_.isString(js)){
      console.log("[CRITICAL ERROR]: editor[s] text[s] missing", html, css, js);
    }
    let alJs=js;// Auto-logged script.
    
    const autoLog=this.autoLog;
  
    let ast = null;
    let al=null;
    try {
      ast = autoLog.toAst(js);
      al=autoLog.transform(ast);
      alJs=al.code;
      store.dispatch(updatePlaygroundInstrumentationSuccess('js', al));
    } catch (error) {
      store.dispatch(updatePlaygroundInstrumentationFailure('js', error));
    }
    if(al){
      console.log("al");
      const runIframe=document.createElement('iframe');
      autoLog.configureIframe(runIframe, store, al, html, css, js, alJs);
      playgroundDOMNode.appendChild(runIframe);
      this.runIframe=runIframe;
    }else{
      if(ast){
        console.log("ast");
        const runIframe=document.createElement('iframe');
        autoLog.configureIframe(runIframe, store, al, html, css, js, js);
        playgroundDOMNode.appendChild(runIframe);
        this.runIframe=runIframe;
      }
      
    }
    

  }
  
}

Playground.contextTypes={
  store: PropTypes.object.isRequired
};

Playground.propTypes={
  editorIds: PropTypes.object.isRequired,
};

Playground.propTypes={
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Playground);
