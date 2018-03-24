import React, {Component} from 'react';
import PropTypes from "prop-types";
import {withStyles} from 'material-ui/styles';
import {chromeDark, chromeLight} from "react-inspector";
import {ObjectRootLabel} from 'react-inspector'
import {ObjectLabel} from 'react-inspector'
import _ from "lodash";
import {Subject} from 'rxjs';
// import {Observable} from "rxjs";

import {themeTypes} from '../components/withRoot';
import LiveExpression from '../components/LiveExpression';
import AutoLog from "../seecoderun/modules/AutoLog";
import {updateBundle, updateBundleFailure, updateBundleSuccess} from "../redux/modules/liveExpressionStore";
import './LiveExpressionStore.css';
// import {configureLocToMonacoRange, configureMonacoRangeToClassName} from "../utils/scrUtils";


const muiChromeLight = {...chromeLight, ...({BASE_BACKGROUND_COLOR: 'transparent'})};
const muiChromeDark = {...chromeDark, ...({BASE_BACKGROUND_COLOR: 'transparent'})};
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
    margin: theme.spacing.unit / 4,
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
  didUpdate = true;
  refreshRate = 1000 / 6;
  refreshInterval = null;

  render() {
    const {classes, themeType, currentContentWidgetId, editorWidth, editorHeight} = this.props;
    this.theme = themeType === themeTypes.darkTheme ? muiChromeDark : muiChromeLight;
    const {decorators, autoLogger, timeline} = this.state;

    const style = {
      width: 'calc(100%)',
    };
    if (editorHeight && editorWidth) {
      style.maxWidth = `${editorWidth}px`;
      style.maxHeight = `${Math.ceil(editorHeight / 2)}px`;
    }
    // this.t = this.t || forceHideWidgets;
    const liveRanges = [];
    const liveExpressions = (decorators || []).map(widget => {
      // console.log(widget.id, autoLog);
      let data = (timeline || []).filter(entry => {
        return entry.id === widget.id;
      });//autoLogger.trace.getData(widget.id);

      if (data.length) {
        widget.contentWidget.domNode.style.backgroundColor = 'orange';
        widget.range && liveRanges.push(widget.range);
      } else {
        widget.contentWidget.domNode.style.backgroundColor = 'transparent';
      }
      // widget.contentWidget.domNode.style.borderTop = '2px solid blue';

      return (<LiveExpression
        style={style}
        key={widget.id}
        theme={this.theme}
        classes={classes}
        widget={widget}
        data={data}
        isOpen={data.length > 0 && currentContentWidgetId === widget.id}
        objectNodeRenderer={this.objectNodeRenderer}
      />);
    });
    this.highlightLiveExpressions(liveRanges);
    return (<div>
      {liveExpressions}
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
    const {editorId, setLiveExpressionStoreChange} = this.props;
    setLiveExpressionStoreChange && setLiveExpressionStoreChange(this.liveExpressionStoreChange);
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
        clearInterval(this.refreshInterval);
        this.timeline = [];
        this.unHighlightLiveExpressions();
        store.dispatch(updateBundle(Date.now()));
        this.bundlingSubject.next(this.currentEditorsTexts);
      }
    })
  }

  componentWillReceiveProps(nextProps) {
    const {liveExpressionStoreChange} = nextProps;
    if (this.liveExpressionStoreChange !== liveExpressionStoreChange) {
      this.liveExpressionStoreChange = liveExpressionStoreChange;
    }
  }

  componentDidUpdate() {
    this.didUpdate = true;
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
    }

    this.objectNodeRenderer = ({depth, name, data, isNonenumerable, expanded}) => {
      //todo handle array and obj
      const liveRef=autoLogger.trace.getLiveRef(data);
      return depth === 0
        ? <ObjectRootLabel name={name} data={liveRef || data}/>
        : <ObjectLabel name={name} data={liveRef || data} isNonenumerable={isNonenumerable}/>;
    };

    this.setState({timeline: []});
    this.unHighlightLiveExpressions();
    this.refreshInterval = setInterval(this.refreshTimeline, this.refreshRate);
    this.traceSubscriber = autoLogger.trace;
    this.traceSubscriber.subscribe(this.handleTraceChange);

    store.dispatch(updateBundleSuccess(bundle));
  };

  handleTraceChange = (payload) => {
    this.timeline = this.timeline ? [...this.timeline, payload] : [payload];
    this.refreshTimeline();
  };

  highlightLiveExpressions = (liveRanges, isReveal = false) => {
    this.prevDecorationIds = this.highlightTexts(
      liveRanges,
      {
        inlineClassName: 'monaco-editor-decoration-les-expressionLive'
      },
      this.prevDecorationIds,
      isReveal,
      true
    );
  };

  unHighlightLiveExpressions = () => {
    if (this.prevDecorationIds && this.prevDecorationIds.length) {
      const {firecoPad} = this.state;
      this.prevDecorationIds = firecoPad.monacoEditor.deltaDecorations(this.prevDecorationIds, []);
    }
  };

  highlightSingleText = (loc, isReveal = true) => {
    if (!loc) {
      this.unHighlightSingleText();
      return;
    }

    this.prevSingleTextDecorationId = this.highlightTexts(
      [loc],
      {
        className: 'monaco-editor-decoration-les-textHighlight'
      }, this.prevSingleTextDecorationId, isReveal);

  };

  unHighlightSingleText = () => {
    if (this.prevSingleTextDecorationId && this.prevSingleTextDecorationId.length) {
      const {firecoPad} = this.state;
      this.prevSingleTextDecorationId = firecoPad.monacoEditor.deltaDecorations(this.prevSingleTextDecorationId, []);
    }
  };

  highlightTexts = (locs, options, prevDecorationIds, isReveal = false, areRanges = false) => {
    const {firecoPad} = this.state;

    if (!firecoPad || !locs) {
      return;
    }

    const decorations = locs.map(loc => ({
      range: areRanges ? loc : firecoPad.liveExpressionWidgetProvider.locToMonacoRange(loc),
      options: options
    }));

    isReveal && decorations.length && this.revealText(firecoPad.monacoEditor, decorations[decorations.length - 1].range);

    return firecoPad.monacoEditor.deltaDecorations(prevDecorationIds || [], decorations);
  };

  revealText = (monacoEditor, range, ifOutsideViewport) => {
    ifOutsideViewport ?
      monacoEditor.revealRangeInCenterIfOutsideViewport(range)
      : monacoEditor.revealRangeInCenter(range);
  };

  getEditorTextInLoc = (loc) => {
    const {firecoPad} = this.state;

    if (!firecoPad || !loc) {
      return;
    }

    return firecoPad.monacoEditor.getModel().getValueInRange(firecoPad.liveExpressionWidgetProvider.locToMonacoRange(loc));
  };

  colorizeDomElement=(ref)=>{
    const {firecoPad} = this.state;
    return firecoPad.liveExpressionWidgetProvider.colorizeElement(ref);
  };

  refreshTimeline = () => {
    if (this.timeline !== this.state.timeline) {
      if (this.didUpdate) {
        this.didUpdate = false;
        this.setState({timeline: this.timeline});
        this.liveExpressionStoreChange && this.liveExpressionStoreChange(this.timeline, this.theme, this.highlightSingleText, this.getEditorTextInLoc, this.colorizeDomElement, this.objectNodeRenderer);//set via props
      }
    }
  };

  afterWidgetize = (payload) => {//decorators
    this.setState({...payload});
  };

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
  liveExpressionStoreChange: PropTypes.func,
};

export default withStyles(styles)(LiveExpressionStore);
