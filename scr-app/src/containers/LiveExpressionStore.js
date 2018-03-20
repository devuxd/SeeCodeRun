import React, {Component} from 'react';
import PropTypes from "prop-types";
import {withStyles} from 'material-ui/styles';
import {chromeDark, chromeLight} from "react-inspector";
import _ from "lodash";
import {Subject} from 'rxjs';
// import {Observable} from "rxjs";

import {themeTypes} from '../components/withRoot';
import LiveExpression from '../components/LiveExpression';
import AutoLog from "../seecoderun/modules/AutoLog";
import {updateBundle, updateBundleFailure, updateBundleSuccess} from "../redux/modules/liveExpressionStore";
// import {configureLocToMonacoRange, configureMonacoRangeToClassName} from "../utils/scrUtils";

const styles = (theme) => ({
  popoverPaper: {
    // padding: theme.spacing.unit,
    overflow: 'auto',
  },
  popover: { // restricts backdrop from being modal
    width: 0,
    height: 0
    // pointerEvents: 'none',
  },
  objectExplorer: {
    padding: theme.spacing.unit,
  },
  rangeSlider: {
    padding: theme.spacing.unit,
  }
});

let monaco = null;

class LiveExpressionStore extends Component {
  state = {
    firecoPad: null,
    autoLogger: null,
    decorators: [],
    hasDecoratorIdsChanged: false,
  };
  rt = 100;
  currentEditorsTexts = null;
  t = false;

  render() {
    const {classes, themeType, currentContentWidgetId, editorWidth, editorHeight} = this.props;
    const theme = themeType === themeTypes.darkTheme ? chromeDark : chromeLight;
    const {decorators, autoLogger, timeline} = this.state;

    const style = {
      width: 'calc(100%)',
    };
    if (editorHeight && editorWidth) {
      style.maxWidth = `${editorWidth}px`;
      style.maxHeight = `${Math.ceil(editorHeight / 2)}px`;
    }
    // this.t = this.t || forceHideWidgets;
    return (<div>
      {
        (decorators || []).map(widget => {
          // console.log(widget.id, autoLog);
          let data = (timeline || []).filter(entry => {
            return entry.id === widget.id;
          });//autoLogger.trace.getData(widget.id);

          if (data.length) {
            widget.contentWidget.domNode.style.backgroundColor = 'orange';
          } else {
            widget.contentWidget.domNode.style.backgroundColor = 'transparent';
          }
          // widget.contentWidget.domNode.style.borderTop = '2px solid blue';

          return (<LiveExpression
            style={style}
            key={widget.id}
            theme={theme}
            classes={classes}
            widget={widget}
            data={data}
            isOpen={data.length > 0 && currentContentWidgetId === widget.id}
          />);
        })
      }
    </div>);

  }

  shouldBundle = (editorsTexts) => {
    if (!_.isEqual(this.currentEditorsTexts, editorsTexts)) {
      if (editorsTexts) {
        const {editorIds} = this.props;
        for (const editorId in editorIds) {
          if (!_.isString(editorsTexts[editorIds[editorId]])) {
            return false;
          }
        }
        return true;
      }
    }
    return false;
  };

  observeBundling = bundlingObservable => {
    return bundlingObservable
      .throttleTime(500)
      .debounceTime(1000)
      .subscribe(currentEditorsTexts => {
        if (this.isBundling) {
          return;
        }
        this.isBundling = true;
        this.updateBundle(currentEditorsTexts);
        this.isBundling = false;
      })
  };

  componentDidMount() {
    this.autoLog = new AutoLog();
    this.bundlingSubject = new Subject();
    this.observeBundling(this.bundlingSubject);
    const {store} = this.context;
    const {editorId} = this.props;
    this.unsubscribe = store.subscribe(() => {
      monaco = monaco || window.monaco;
      const state = store.getState();
      const firecoPad =
        state.monacoEditorsReducer.monacoEditorsStates && state.monacoEditorsReducer.monacoEditorsStates[editorId] ?
          state.monacoEditorsReducer.monacoEditorsStates[editorId].firecoPad : null;

      if (firecoPad && firecoPad !== this.state.firecoPad) {
        this.setState({firecoPad: firecoPad});
        const liveExpressionWidgetProvider = firecoPad ? firecoPad.liveExpressionWidgetProvider : null;
        setTimeout(() => this.updateLiveExpressions(liveExpressionWidgetProvider), 0);
      }

      const editorsTexts = store.getState().pastebinReducer.editorsTexts;
      if (this.shouldBundle(editorsTexts)) {
        this.currentEditorsTexts = editorsTexts;
        store.dispatch(updateBundle(Date.now()));
        this.bundlingSubject.next(this.currentEditorsTexts);
      }
    })
  }

  componentWillUnmount() {
    this.unsubscribe && this.unsubscribe();
    this.bundlingSubject && this.bundlingSubject.complete();
  }

  updateBundle = (currentEditorsTexts) => {
    const {store} = this.context;
    const {firecoPad, decorators, getLocationId} = this.state;

    if (!firecoPad || !getLocationId) {
      //console.log('Not ready');
      if (this.rt) {
        clearTimeout(this.tm);
        this.tm = setTimeout(() => {
          this.rt--;
          this.updateBundle(currentEditorsTexts)
        }, 100);
      }
      return;
    }

    if (!firecoPad.ast) {
      store.dispatch(updateBundleFailure(firecoPad.astError));
      return;
    }

    const autoLogger = this.autoLog.transformWithLocationIds(firecoPad.ast, getLocationId);
    const bundle = {
      editorsTexts: currentEditorsTexts,
      alJs: autoLogger.code,
      autoLog: this.autoLog,
      autoLogger: autoLogger,
    };

    if (this.traceSubscriber) {
      this.traceSubscriber.unsubscribe();
      this.setState({timeline: []});
    }
    this.traceSubscriber = autoLogger.trace;
    this.traceSubscriber.subscribe(this.handleTraceChange);

    store.dispatch(updateBundleSuccess(bundle));
  };

  handleTraceChange = (payload) => {
    setTimeout(() => {
      this.setState(prevState => ({timeline: prevState.timeline ? [...prevState.timeline, payload] : [payload]}));
    }, 0);
  };

  configureLiveExpressions(locationMap) {
    // const {classes} = this.props;
    const liveExpressions = [];
    for (const i in locationMap) {
      // const monacoRange = this.locToMonacoRange(locationMap[i].loc);
      // const className = this.monacoRangeToClassname(monacoRange);
      // liveExpressions.push(this.configureLiveExpressionDecorator(monacoRange, className, classes));
    }
    return liveExpressions;
  }

  afterWidgetize = (payload) => {//decorators
    this.setState({...payload});
  };

  updateAutolog() {
    // const autoLog = this.autoLog;
    // try {
    //   ast = autoLog.toAst(js);
    //   al = autoLog.transform(ast);
    //   alJs = al.code;
    //   store.dispatch(updatePlaygroundInstrumentationSuccess('js', al));
    // } catch (error) {
    //   store.dispatch(updatePlaygroundInstrumentationFailure('js', error));
    // }
  }

  updateLiveExpressions(liveExpressionWidgetProvider) {
    if (!liveExpressionWidgetProvider) {
      return;
    }
    liveExpressionWidgetProvider.afterWidgetize(this.afterWidgetize);
  }

  addBranchNavigator = (expression, lineNumber) => {

  };

}

LiveExpressionStore.contextTypes = {
  store: PropTypes.object.isRequired
};

LiveExpressionStore.propTypes = {
  classes: PropTypes.object.isRequired,
  editorId: PropTypes.string.isRequired,
};

export default withStyles(styles)(LiveExpressionStore);
