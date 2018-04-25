import React, {Component} from 'react';
import PropTypes from "prop-types";
import debounce from 'lodash.debounce';
import isString from 'lodash/isString';
import isEqual from 'lodash/isEqual';
import {Subject} from 'rxjs/Subject';
import JSAN from 'jsan';

import {withStyles} from 'material-ui/styles';
import {lighten, fade} from 'material-ui/styles/colorManipulator';
import {ObjectRootLabel/*, ObjectLabel*/, createLiveObjectNodeRenderer} from '../components/ObjectExplorer';

import LiveExpression from '../components/LiveExpression';
import AutoLog from "../seecoderun/modules/AutoLog";
import {updateBundle, updateBundleFailure, updateBundleSuccess} from "../redux/modules/liveExpressionStore";

import DOMPortal from "../components/DOMPortal";

import {PastebinContext} from './Pastebin';
import OverflowComponent from "../components/OverflowComponent";


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
        text: fade(lighten(theme.palette.primary.light, 0.25), 0.35),
        error: fade(lighten(theme.palette.error.light, 0.65), 0.35),
        graphical: fade(lighten(theme.palette.secondary.light, 0.65), 0.35),
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
                backgroundColor: fade(lighten(theme.palette.primary.light, 0.1), 0.5),
            },
            [`.${HighlightTypes.error}`]: {
                backgroundColor: HighlightPalette.error,
            },
            [`.${HighlightTypes.graphical}`]: {
                backgroundColor: HighlightPalette.graphical,
            },
            [`.${HighlightTypes.graphical}-match`]: {
                backgroundColor: fade(lighten(theme.palette.secondary.light, 0.1), 0.5),
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
        liveExpressionContent: {
            overflow: 'auto',
            position: 'relative',
            maxWidth: 'inherit',
            // paddingTop: theme.spacing.unit,
            // paddingBottom: theme.spacing.unit * 2,
            // marginBottom: -theme.spacing.unit,
        },
    }
};

let monaco = null;

// const objectIterator = createObjectIterator();

class LiveExpressionStore extends Component {
    state = {
        firecoPad: null,
        autoLogger: null,
        decorators: [],
        hasDecoratorIdsChanged: false,
        timeline: [],
        currentContentWidgetId: null,
        currentBranchId: null,
        currentBranchTimelineId: null,
    };
    rt = 100;
    currentEditorsTexts = null;
    didUpdate = true;
    refreshRate = 1000 / 4;
    refreshInterval = null;
    isBundling = false;
    bundlingError = null;


    prevLiveExpressionWidgets = {};
    liveExpressionWidgets = {};

    handleCloseContentWidget = (ignore) => {
        if (ignore) {
            return;
        }
        this.setState({currentContentWidgetId: null});
    };
    handleCloseContentWidgetDebounced = debounce(this.handleCloseContentWidget, 1000);

    handleOpenContentWidget = (currentContentWidgetId) => {
        this.setState({currentContentWidgetId});
    };
    handleOpenContentWidgetDebounced = debounce(this.handleOpenContentWidget, 1000);

    handleCurrentContentWidgetId = (currentContentWidgetId) => {
        if (currentContentWidgetId) {
            this.handleCloseContentWidgetDebounced(true);
            if (this.state.currentContentWidgetId) {
                if (currentContentWidgetId !== this.state.currentContentWidgetId) {
                    this.handleOpenContentWidget(currentContentWidgetId);
                }
            } else {
                this.handleOpenContentWidgetDebounced(currentContentWidgetId);
            }
        } else {
            // if (this.state.currentContentWidgetId) {
            this.handleCloseContentWidgetDebounced();
            // } else {
            //     this.handleCloseContentWidget();
            // }
        }
    };

    render() {
        const {classes, editorWidth, editorHeight, timeline} = this.props;
        const {decorators, currentContentWidgetId, currentBranchId, currentBranchTimelineId} = this.state;
        let currentTimeline = timeline;
        const style = {
            width: 'calc(100%)',
        };

        if (editorHeight && editorWidth) {
            style.maxWidth = `${editorWidth}px`;
            style.maxHeight = `${Math.ceil(editorHeight / 2)}px`;
        }

        const branches = this.traceSubscriber ? this.traceSubscriber.branches || [] : [];

        // console.log(branches);
        const branched = {};
        branches.forEach(branch => {
            const {id, timelineI} = branch;
            branched[id] = branched[id] || [];
            branched[id].push(timelineI);
        });
        // console.log(branched);

        this.prevLiveExpressionWidgets = this.liveExpressionWidgets;
        const branchNavigators = [];
        for (const id in branched) {
            const decorator = (decorators || []).find(dec => dec.id === id);
            if (decorator) {
                //  const {datum, widget} = this.prevLiveExpressionWidgets[i];
                //   console.log('bn', decorator);
                if (decorator && decorator.contentWidget) {
                    decorator.contentWidget.adjustWidth(true);
                    branchNavigators.push(
                        <React.Fragment key={`${id}:nav`}>
                            <DOMPortal
                                parentEl={decorator.contentWidget.domNode}>
                                <div onMouseEnter={() => this.handleCurrentContentWidgetId(id)}
                                     onMouseLeave={() => this.handleCurrentContentWidgetId()}
                                >
                                    <OverflowComponent
                                        contentClassName={classes.liveExpressionContent}
                                        disableOverflowDetectionY={true}
                                        //  placeholder={<Typography>Yo</Typography>}
                                        //  placeholderClassName={classes.expressionCellContent}
                                        // placeholderDisableGutters={true}
                                    >
                                        {`${branched[id].length}/${branched[id].length}`}
                                        {/*<ObjectRootLabel data={branched[id]}/>*/}
                                    </OverflowComponent>

                                </div>
                            </DOMPortal>
                            <LiveExpression
                                style={style}

                                expressionId={id}
                                classes={classes}
                                widget={decorator}
                                data={branched[id]}
                                isOpen={branched[id].length > 0 && currentContentWidgetId === id}
                                objectNodeRenderer={this.objectNodeRenderer}
                                //handleChange={this.handleObjectExplorerExpand}
                            />
                        </React.Fragment>);
                }

            }
        }


        const liveRanges = [];
        this.liveExpressionWidgets = {};
        const liveExpressions = (decorators || []).map(widget => {
            // console.log(widget.id, autoLog);
            let data = [];
            (currentTimeline || []).forEach(entry => {
                (entry.id === widget.id) && data.unshift(entry);
            });//autoLogger.trace.getData(widget.id);

            if (data.length) {
                // widget.contentWidget.domNode.style.backgroundColor = 'orange';
                // widget.contentWidget.domNode.style.fontSize = '8px';
                widget.range && liveRanges.push(widget.range);
                let datum = null;
                try {
                    datum = data[data.length - 1].isError ? data[data.length - 1].data : JSAN.parse(data[data.length - 1].data);
                    // datum = isString(data[data.length - 1].data) ?
                    //     JSAN.parse(data[data.length - 1].data) : data[data.length - 1].data;
                } catch (e) {
                    console.log(data[data.length - 1], e)
                }

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
                if (widget.contentWidget) {
                    widget.contentWidget.adjustWidth(true);
                    liveWidgets.push(
                        <DOMPortal key={widget.id}
                                   parentEl={widget.contentWidget.domNode}>
                            <div onMouseEnter={() => this.handleCurrentContentWidgetId(widget.id)}
                                 onMouseLeave={() => this.handleCurrentContentWidgetId()}
                            >
                                <OverflowComponent
                                    contentClassName={classes.liveExpressionContent}
                                    disableOverflowDetectionY={true}
                                    //  placeholder={<Typography>Yo</Typography>}
                                    //  placeholderClassName={classes.expressionCellContent}
                                    // placeholderDisableGutters={true}
                                >
                                    <ObjectRootLabel data={datum}/>
                                </OverflowComponent>

                            </div>
                        </DOMPortal>);
                }

            }
        }
        return (<React.Fragment>
            {liveExpressions}
            {liveWidgets}
            {branchNavigators}
        </React.Fragment>);
    }

    updateLiveExpressionWidgetWidths = () => {
        if (!this.liveExpressionWidgets) {
            return;
        }
        for (const i in this.liveExpressionWidgets) {
            if (this.liveExpressionWidgets[i]) {
                const {widget} = this.liveExpressionWidgets[i];
                if (widget.contentWidget) {
                    widget.contentWidget.adjustWidth(true);
                }
            }
        }
    };

    shouldBundle = (editorsTexts) => {
        if (!isEqual(this.currentEditorsTexts, editorsTexts)) {
            if (editorsTexts) {
                const {editorIds} = this.props;
                for (const editorId in editorIds) {
                    if (!isString(editorsTexts[editorIds[editorId]])) {
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

    onBundlingEnd = (err) => {
        this.isBundling = false;
        this.bundlingError = err;
    };

    handleBundle = currentEditorsTexts => {
        this.isBundling = true;
        this.updateBundle(currentEditorsTexts)
            .then(this.onBundlingEnd)
            .catch(this.onBundlingEnd);
    };
    handleBundleDebounced = debounce(this.handleBundle, 100);

    handleBundlingSubscription = () => {
        if (!this.bundlingSubject) {
            return;
        }

        if (this.bundlingSubscription) {
            this.bundlingSubscription.unsubscribe();
        }

        this.bundlingSubscription =
            this.bundlingSubject
                .debounceTime(this.props.autorunDelay)
                .subscribe(this.handleBundle);
    };


    componentDidMount() {
        this.bundlingSubject = new Subject();
        if (this.props.exports) {
            this.props.exports.updateLiveExpressionWidgetWidths = this.updateLiveExpressionWidgetWidths;
        }
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

            if (firecoPad && firecoPad.liveExpressionWidgetProvider && firecoPad !== this.state.firecoPad) {
                this.setState({firecoPad: firecoPad});
                setTimeout(() => this.updateLiveExpressions(firecoPad.liveExpressionWidgetProvider), 0);
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

    updateBundle = async (currentEditorsTexts) => {
        const {store} = this.context;
        const {firecoPad/*, decorators*/, getLocationId} = this.state;

        if (!firecoPad || !firecoPad.astResult || !getLocationId) {
            this.handleBundleDebounced(currentEditorsTexts);
            return;
        }
        if (!firecoPad.astResult.ast) {
            store.dispatch(updateBundleFailure(firecoPad.astResult.astError));
            return;
        }

        firecoPad.getAst().then((astResult) => {
            if (!this.autoLog) {
                this.autoLog = new AutoLog(firecoPad.j);
            }

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

            this.objectNodeRenderer = createLiveObjectNodeRenderer(autoLogger);
            this.timeline = [];
            this.isNew = true;
            this.unHighlightLiveExpressions();
            this.refreshInterval = setInterval(this.refreshTimeline, this.refreshRate);
            this.traceSubscriber = autoLogger.trace;
            this.traceSubscriber.subscribe(this.handleTraceChange);

            store.dispatch(updateBundleSuccess(bundle));
        });
    };

    handleTraceChange = ({timeline, logs}) => {
        this.timeline = timeline;
        this.logs = logs;
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
        const isRefresh = this.timeline !== this.prevTimeline || this.logs !== this.prevLogs;
        if (isRefresh) {
            if (this.didUpdate) {
                this.didUpdate = false;
                if (this.timeline !== this.prevTimeline) {
                    this.prevTimeline = this.timeline;
                }
                if (this.logs !== this.prevLogs) {
                    this.prevLogs = this.logs;
                }
                // this.setState({timeline: this.timeline});
                this.props.liveExpressionStoreChange &&
                this.props.liveExpressionStoreChange(
                    this.traceSubscriber,
                    this.timeline,
                    this.logs,
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
    exports: PropTypes.object,
};

const LiveExpressionStoreWithContext = props => (
    <PastebinContext.Consumer>
        {({liveExpressionStoreChange, timeline, autorunDelay, handleChangePlaying}) => {
            return <LiveExpressionStore {...props}
                                        liveExpressionStoreChange={liveExpressionStoreChange}
                                        timeline={timeline}
                                        autorunDelay={autorunDelay}
                                        handleChangePlaying={handleChangePlaying}
            />
        }}
    </PastebinContext.Consumer>
);
export default withStyles(styles)(LiveExpressionStoreWithContext);
