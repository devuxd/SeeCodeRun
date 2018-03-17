import React, {Component} from 'react';
import PropTypes from "prop-types";
import {withStyles} from 'material-ui/styles';
import LiveExpression from './LiveExpression';
import {
  configureMonacoRangeToClassname,
  configureToMonacoRange
} from "../utils/scrUtils";
import {Observable} from "rxjs";

const styles = (/*theme*/) => ({

});

class LiveExpressionStore extends Component {
  state={

  };
  render(){
    const {editorId, monacoEditor} =this.props;

    return (monacoEditor? <div> hi</div>:null);

  }
  // constructor(monaco, editorId, monacoEditor, autoLog) {
  //   this.monaco=monaco;
  //   this.monacoEditor=monacoEditor;
  //   this.editorId=editorId;
  //   this.autoLog = autoLog;
  //   this.toMonacoRange=configureToMonacoRange(monaco);
  //   this.monacoRangeToClassname = configureMonacoRangeToClassname(`${this.editorId}-r`);
  //   this.onDidChangeModelDecorationsObservable= Observable.create(observer=>{
  //     this.monacoEditor.onDidChangeModelDecorations(deltaDecorations=> {
  //       setTimeout(()=>{
  //         observer.next(deltaDecorations);
  //       }, 0);
  //     });
  //   });
  //
  //   this.state={
  //     locationMap:[],
  //     liveExpressions:[],
  //     decorators:[],
  //   };
  //
  //   this.autoLog.subscribe(t =>{
  //     console.log("TP", t);
  //     this.decs =monacoEditor.deltaDecorations(/*this.decs||*/[], {
  //       range: this.toMonacoRange(t.loc),
  //       options:{
  //         hoverMessage: `${t.id}: ${t.data}`
  //       }
  //     });
  //   });
  // }

  
  updateLiveExpressions(locationMap) {
    const liveExpressions=this.configureLiveExpressions(locationMap);
    const {decorators} = this.state;
    const newDecorators = this.monacoEditor.deltaDecorations(decorators, this.getDecorators(liveExpressions));
    this.setState({
      locationMap: locationMap,
      liveExpressions: liveExpressions,
      decorators: newDecorators
    });
  }

  addBranchNavigator = (expression, lineNumber) => {
    const el = this.getElementbyLineNumber(lineNumber);
    if (el) {

    }
  };

  getDecorators(liveExpressions) {
    const decorators=[];
    for (const i in liveExpressions) {
      decorators.push(liveExpressions[i].getDecorator())
    }
    return decorators;
  }
  
  getDomElements(liveExpressions) {
    const domElements=[];
    for (const i in liveExpressions) {
      domElements.push(liveExpressions[i].getDomElement())
    }
    return domElements;
  }
  
  configureLiveExpressions(locationMap) {
    const liveExpressions=[];
    for (const i in locationMap) {
      const monacoRange = this.toMonacoRange(locationMap[i].loc);
      const className = this.monacoRangeToClassname(monacoRange);
      liveExpressions.push(new LiveExpression(monacoRange, className));
    }
    return liveExpressions;
  }
}

LiveExpressionStore.contextTypes = {
  store: PropTypes.object.isRequired
};

LiveExpressionStore.propTypes = {
  classes: PropTypes.object.isRequired,
  editorId: PropTypes.string.isRequired,
  monacoEditor: PropTypes.object,
};

export default withStyles(styles)(LiveExpressionStore);
