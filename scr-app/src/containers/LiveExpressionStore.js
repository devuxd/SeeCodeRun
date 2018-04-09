import React, {Component} from 'react';
import PropTypes from "prop-types";
import _ from 'lodash';
import {Subject} from 'rxjs';
import JSAN from 'jsan';

import {withStyles} from 'material-ui/styles';
import {lighten, fade} from 'material-ui/styles/colorManipulator';
import {ObjectRootLabel, ObjectLabel} from 'react-inspector';

import LiveExpression from '../components/LiveExpression';
import AutoLog from "../seecoderun/modules/AutoLog";
import {updateBundle, updateBundleFailure, updateBundleSuccess} from "../redux/modules/liveExpressionStore";
import {createObjectIterator, end$} from "../utils/scrUtils";

import {Inspector} from "../components/ObjectExplorer";
import DOMPortal from "../components/DOMPortal";
import debounce from 'lodash.debounce';

import {PastebinContext} from './Pastebin';

export const HighlightTypes = {
    text: 'monaco-editor-decoration-les-textHighlight-text',
    error: 'monaco-editor-decoration-les-textHighlight-error',
    graphical: 'monaco-editor-decoration-les-textHighlight-graphical',
};

export const defaultExpressionClassName = 'monaco-editor-decoration-les-expression';
export const liveExpressionClassName = 'monaco-editor-decoration-les-expressionLive';

export let HighlightPalette = {
    text: 'transparent',
    error: 'transparent',
    graphical: 'transparent',
};

const styles = (theme) => {
    HighlightPalette = {
        text: fade(lighten(theme.palette.primary.light, 0.25), 0.25),
        error: fade(lighten(theme.palette.error.light, 0.65), 0.75),
        graphical: fade(lighten(theme.palette.secondary.light, 0.65), 0.75),
    };

    return {
        '@global': {
            [`.${defaultExpressionClassName}`]: {
                opacity: 0.70,
                filter: 'grayscale(30%)',
                fontWeight: 100,
            },
            [`.${liveExpressionClassName}`]: {
                opacity: 1,
                filter: 'unset !important',
                fontWeight: 600,
            },
            [`.${HighlightTypes.text}`]: {
                backgroundColor: HighlightPalette.text,
            },
            [`.${HighlightTypes.text}-match`]: {
                backgroundColor: fade(lighten(theme.palette.primary.light, 0.1), 0.2),
            },
            [`.${HighlightTypes.error}`]: {
                backgroundColor: HighlightPalette.error,
            },
            [`.${HighlightTypes.graphical}`]: {
                backgroundColor: HighlightPalette.graphical,
            },
            [`.${HighlightTypes.graphical}-match`]: {
                backgroundColor: fade(lighten(theme.palette.secondary.light, 0.1), 0.2),
            }
        },
        popoverPaper: {
            overflow: 'auto',
        },
        popover: { // restricts backdrop from being modal
            width: 0,
            height: 0,
        },
        objectExplorer: {
            minWidth: 200,
            margin: theme.spacing.unit / 4,
        },
        rangeSlider: {
            padding: theme.spacing.unit,
        },
        badgeRoot: {
            position: 'relative',
            display: 'inline-flex',
            // For correct alignment with the text.
            verticalAlign: 'middle',
        },
        liveBadge: {
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            position: 'absolute', zIndex: 10, bottom: 0, left: 0, background: 'red', margin: 0, padding: 0,
            width: 2,
            height: 2,
        },
    }
};

let monaco = null;

const objectIterator = createObjectIterator();

class LiveExpressionStore extends Component {
    state = {
        firecoPad: null,
        autoLogger: null,
        decorators: [],
        hasDecoratorIdsChanged: false,
        timeline: [],
    };
    rt = 100;
    currentEditorsTexts = null;
    t = false;
    didUpdate = true;
    refreshRate = 1000 / 4;
    refreshInterval = null;
    leto = null;


    prevLiveExpressionWidgets = {};
    liveExpressionWidgets = {};

    render() {
        const {classes, currentContentWidgetId, editorWidth, editorHeight, timeline} = this.props;
        const {decorators} = this.state;

        const style = {
            width: 'calc(100%)',
        };

        if (editorHeight && editorWidth) {
            style.maxWidth = `${editorWidth}px`;
            style.maxHeight = `${Math.ceil(editorHeight / 2)}px`;
        }

        const liveRanges = [];
        this.prevLiveExpressionWidgets = this.liveExpressionWidgets;
        this.liveExpressionWidgets = {};
        const liveExpressions = (decorators || []).map(widget => {
            // console.log(widget.id, autoLog);
            let data = [];
            (timeline || []).forEach(entry => {
                (entry.id === widget.id) && data.unshift(entry);
            });//autoLogger.trace.getData(widget.id);

            if (data.length) {
                // widget.contentWidget.domNode.style.backgroundColor = 'orange';
                // widget.contentWidget.domNode.style.fontSize = '8px';
                widget.range && liveRanges.push(widget.range);
                let datum = JSAN.parse(data[data.length - 1].data);
                this.liveExpressionWidgets[widget.id] = {datum, widget};
                //  if (hasChildNodes(datum, objectIterator)) {
                //    // let text = '';
                //    // for (let {name, data, ...props} of objectIterator(datum)) {
                //    //   text = `${text}, ${name}`;
                //    // }
                //    const val = objectIterator(datum).next().value;
                //    console.log(val);
                //    widget.contentWidget.getElement().innerText = `{${val ? val.name : val}}`;
                //    // console.log(objectIterator(datum).next().value)
                //  } else {
                //    const val = objectIterator(datum).next().value;
                //    widget.contentWidget.getElement().innerText = `${val ? val.name : val}`;
                //  }
                //  widget.contentWidget.getElement().className='';
                // liveExpressionWidgetProvider.colorizeElement(widget.contentWidget.getElement());

            } else {
                // widget.contentWidget.getElement().innerText = '';
                //  widget.contentWidget.domNode.style.backgroundColor = 'transparent';
            }
            //  liveExpressionWidgetProvider.colorizeElement(widget.contentWidget.getElement());
            // widget.contentWidget.domNode.style.borderTop = '2px solid blue';

            return (<LiveExpression
                style={style}
                key={widget.id}
                expressionId={widget.id}
                classes={classes}
                widget={widget}
                data={data}
                isOpen={data.length > 0 && currentContentWidgetId === widget.id}
                objectNodeRenderer={this.objectNodeRenderer}
                //handleChange={this.handleObjectExplorerExpand}
            />);
        });
        this.highlightLiveExpressions(liveRanges);
        const liveWidgets = [];
        for (const i in this.liveExpressionWidgets) {
            if (this.liveExpressionWidgets[i]) {
                const {datum, widget} = this.liveExpressionWidgets[i];
                liveWidgets.push(<DOMPortal key={widget.id}
                                            parentEl={widget.contentWidget.domNode}><ObjectRootLabel
                    data={datum}/></DOMPortal>);
            }
        }

        return (<React.Fragment>
            {liveExpressions}
            {liveWidgets}
        </React.Fragment>);
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

    handleChangeDebounced = (handleChange, debounceTime) => {
        return debounce(value => handleChange(value), debounceTime);
    };

    handleBundlingSubscription = () => {
        if (!this.bundlingSubject) {
            return;
        }

        if (this.bundlingSubscription) {
            this.bundlingSubscription.unsubscribe();
        }

        this.bundlingSubscription =
            this.bundlingSubject
                .debounceTime(this.props.autorunDelay)  // .throttleTime(500)
                .subscribe(currentEditorsTexts => {
                    if (this.isBundling) {
                        return;
                    }
                    this.isBundling = true;
                    this.updateBundle(currentEditorsTexts);
                    this.isBundling = false;
                });
    };

    componentDidMount() {
        this.autoLog = new AutoLog();
        this.bundlingSubject = new Subject();
        this.handleBundlingSubscription();
        this.handleBundlingSubscriptionDebounced = this.handleChangeDebounced(this.handleBundlingSubscription, 1500);
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
                clearInterval(this.refreshInterval);
                this.timeline = [];
                this.unHighlightLiveExpressions();
                store.dispatch(updateBundle(Date.now()));
                this.bundlingSubject.next(this.currentEditorsTexts);
            }
        })
    }

    componentDidUpdate(prevProps/*, prevState, snapshot*/) {
        this.didUpdate = true;
        if (prevProps.autorunDelay !== this.props.autorunDelay) {
            this.handleBundlingSubscriptionDebounced();
        }
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

        if (!firecoPad.astResult.ast) {
            store.dispatch(updateBundleFailure(firecoPad.astResult.astError));
            return;
        }
        const astResult = firecoPad.getAst();
        const autoLogger = this.autoLog.transformWithLocationIds(astResult.ast, getLocationId);
        const bundle = {
            editorsTexts: currentEditorsTexts,
            alJs: autoLogger.code,
            autoLog: this.autoLog,
            autoLogger: autoLogger,
        };

        if (this.traceSubscriber) {
            this.traceSubscriber.unsubscribe();
        }

        this.objectNodeRenderer = {
            getWindowRef: () => autoLogger.trace.window,
            handleChange: null,
            expandPathsState: null,
            getExpandedPaths: (expandPathsState) => {
                if (expandPathsState) {
                    return Object.keys(expandPathsState).filter(path => expandPathsState[path]);
                } else {
                    return [];
                }
            },
            hideLiveRefs: false,
            render: (props) => {
                const {depth, name, data, isNonenumerable, expanded, path} = props;
                const paths = this.objectNodeRenderer.expandPathsState || {};
                // paths[path] = expanded;
                // if (expanded) {
                //   clearTimeout(this.leto);
                //   this.leto = setTimeout(() => {
                //     this.objectNodeRenderer.handleChange && this.objectNodeRenderer.handleChange();
                //   }, 500);
                // }
                //todo handle array and obj
                const liveRef = autoLogger.trace.parseLiveRefs(data, this.objectNodeRenderer.hideLiveRefs);
                const isRoot = depth === 0;
                const objectLabel = isRoot ?
                    <ObjectRootLabel name={name} data={liveRef.data}/>
                    : <ObjectLabel name={name} data={liveRef.data} isNonenumerable={isNonenumerable}/>;

                return liveRef.isLive ?
                    isRoot ?
                        objectLabel :
                        <ul style={{marginLeft: -12, marginTop: -12}}>
                            <Inspector data={liveRef.data}/>
                        </ul>
                    : objectLabel;
            },
            parseLiveRefs: autoLogger.trace.parseLiveRefs,
        };

        this.timeline = [];
        this.isNew = true;
        this.unHighlightLiveExpressions();
        this.refreshInterval = setInterval(this.refreshTimeline, this.refreshRate);
        this.traceSubscriber = autoLogger.trace;
        this.traceSubscriber.subscribe(this.handleTraceChange);

        store.dispatch(updateBundleSuccess(bundle));
    };

    handleTraceChange = (payload) => {
        this.timeline = payload;
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

    highlightSingleText = (loc, type = HighlightTypes.text, matches, isReveal = true) => {
        if (!loc) {
            this.unHighlightSingleText();
            return;
        }

        this.prevSingleTextState = {
            single: this.highlightTexts(
                [loc],
                {
                    className: type
                }, this.prevSingleTextState ? this.prevSingleTextState.single.decorationIds : [], isReveal)
            ,
            matches: matches ? this.highlightTexts(
                matches,
                {
                    className: `${type}-match`
                }, this.prevSingleTextState && this.prevSingleTextState.matches ? this.prevSingleTextState.matches.decorationIds : [], false)
                : null
        }
    };

    unHighlightSingleText = () => {
        if (this.prevSingleTextState && this.prevSingleTextState.single.decorationIds.length) {
            const {firecoPad} = this.state;
            this.prevSingleTextState.single.decorationIds = firecoPad.monacoEditor.deltaDecorations(this.prevSingleTextState.single.decorationIds, []);
            firecoPad.monacoEditor.restoreViewState(this.prevSingleTextState.single.viewState);
        }
        if (this.prevSingleTextState && this.prevSingleTextState.matches && this.prevSingleTextState.matches.decorationIds.length) {
            const {firecoPad} = this.state;
            this.prevSingleTextState.matches.decorationIds = firecoPad.monacoEditor.deltaDecorations(this.prevSingleTextState.matches.decorationIds, []);
        }
    };

    setCursorToLocation = (loc) => {
        const {firecoPad} = this.state;
        const range = loc ? firecoPad.liveExpressionWidgetProvider.locToMonacoRange(loc) : null;
        if (range) {
            firecoPad.monacoEditor.setPosition(range.getStartPosition());
            this.prevSingleTextState &&
            (this.prevSingleTextState.single.viewState = firecoPad.monacoEditor.saveViewState());
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
        let viewState = null;
        if (isReveal && decorations.length) {
            viewState = firecoPad.monacoEditor.saveViewState();
            this.revealText(firecoPad.monacoEditor, decorations[decorations.length - 1].range);
        }

        return {
            viewState: viewState,
            decorationIds: firecoPad.monacoEditor.deltaDecorations(prevDecorationIds || [], decorations)
        };
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

    colorizeDomElement = (ref) => {
        const {firecoPad} = this.state;
        return firecoPad.liveExpressionWidgetProvider.colorizeElement(ref);
    };


    refreshTimeline = () => {
        if (this.timeline !== this.prevTimeline) {
            if (this.didUpdate) {
                this.didUpdate = false;
                this.prevTimeline = this.timeline;
                // this.setState({timeline: this.timeline});
                this.props.liveExpressionStoreChange &&
                this.props.liveExpressionStoreChange(
                    this.traceSubscriber,
                    this.timeline,
                    this.isNew,
                    HighlightTypes,
                    this.highlightSingleText,
                    this.setCursorToLocation,
                    this.getEditorTextInLoc,
                    this.colorizeDomElement,
                    this.objectNodeRenderer,
                    // this.handleObjectExplorerExpand
                );//set via props
                this.isNew = false;
            }
        }
    };

    afterWidgetize = ({decorators, hasDecoratorIdsChanged, getLocationId}) => {//decorators
        this.setState({decorators, hasDecoratorIdsChanged, getLocationId});
    };

    updateLiveExpressions(liveExpressionWidgetProvider) {
        if (!liveExpressionWidgetProvider) {
            return;
        }
        liveExpressionWidgetProvider.afterWidgetize(this.afterWidgetize);
    }

}

LiveExpressionStore.contextTypes = {
    store: PropTypes.object.isRequired
};

LiveExpressionStore.propTypes = {
    classes: PropTypes.object.isRequired,
    editorId: PropTypes.string.isRequired,
    liveExpressionStoreChange: PropTypes.func,
};

const LiveExpressionStoreWithContext = props => (
    <PastebinContext.Consumer>
        {({liveExpressionStoreChange, timeline, autorunDelay}) => {
            return <LiveExpressionStore {...props}
                                        liveExpressionStoreChange={liveExpressionStoreChange}
                                        timeline={timeline}
                                        autorunDelay={autorunDelay}
            />
        }}
    </PastebinContext.Consumer>
);
export default withStyles(styles)(LiveExpressionStoreWithContext);
