import React, {Component} from 'react';
import PropTypes from "prop-types";
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import isString from 'lodash/isString';
import isEqual from 'lodash/isEqual';
import {Subject} from 'rxjs/Subject';
import JSAN from 'jsan';

import {withStyles} from 'material-ui/styles';

import Button from 'material-ui/Button';

import MoreVertIcon from '@material-ui/icons/MoreVert';
import {lighten, fade} from 'material-ui/styles/colorManipulator';
import {ObjectRootLabel/*, ObjectLabel*/, createLiveObjectNodeRenderer} from '../components/ObjectExplorer';

import LiveExpression from '../components/LiveExpression';
import AutoLog from "../seecoderun/modules/AutoLog";
import {updateBundle, updateBundleFailure, updateBundleSuccess} from "../redux/modules/liveExpressionStore";

import DOMPortal from "../components/DOMPortal";

import {PastebinContext} from './Pastebin';
import OverflowComponent from "../components/OverflowComponent";
import {NavigationTypes} from '../seecoderun/modules/AutoLogShift';
import {monacoProps} from "../utils/monacoUtils";


export const HighlightTypes = {
    text: 'monaco-editor-decoration-les-textHighlight-text',
    error: 'monaco-editor-decoration-les-textHighlight-error',
    graphical: 'monaco-editor-decoration-les-textHighlight-graphical',
    globalBranch: 'monaco-editor-decoration-les-textHighlight-global-branch',
    localBranch: 'monaco-editor-decoration-les-textHighlight-local-branch',
};

export const defaultExpressionClassName = 'monaco-editor-decoration-les-expression';
export const liveExpressionClassName = 'monaco-editor-decoration-les-expressionLive';

export let HighlightPalette = {
    text: 'transparent',
    error: 'transparent',
    graphical: 'transparent',
    globalBranch: 'transparent',
    localBranch: 'transparent',
};

const BRANCH_LINE_DECORATION_WIDTH = 3;

const styles = (theme) => {
    HighlightPalette = {
        text: fade(lighten(theme.palette.primary.light, 0.25), 0.35),
        error: fade(lighten(theme.palette.error.light, 0.65), 0.35),
        graphical: fade(lighten(theme.palette.secondary.light, 0.65), 0.35),
        globalBranch: fade(lighten(theme.palette.primary.light, 0.075), 0.075),
        localBranch: fade(lighten(theme.palette.secondary.light, 0.1), 0.1),
    };

    return {
        '@global': {
            '.monaco-editor div.margin': {
                zIndex: '1000 !important',
            },
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
            },
            [`.${HighlightTypes.globalBranch}`]: {
                backgroundColor: HighlightPalette.globalBranch,
            },
            [`.${HighlightTypes.globalBranch}-decoration`]: {
                marginLeft: BRANCH_LINE_DECORATION_WIDTH,
                background: `linear-gradient(90deg, ${
                    theme.palette.primary.main
                    } ${BRANCH_LINE_DECORATION_WIDTH}px, ${
                    HighlightPalette.globalBranch
                    } ${BRANCH_LINE_DECORATION_WIDTH}px)`,
            },
            [`.${HighlightTypes.localBranch}`]: {
                backgroundColor: HighlightPalette.localBranch,
            },
            [`.${HighlightTypes.localBranch}-decoration`]: {
                marginLeft: BRANCH_LINE_DECORATION_WIDTH,
                background: `linear-gradient(90deg, ${
                    theme.palette.secondary.main
                    } ${BRANCH_LINE_DECORATION_WIDTH}px, ${
                    HighlightPalette.localBranch
                    } ${BRANCH_LINE_DECORATION_WIDTH}px)`,
            },
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
        liveExpressionRoot: {
            position: 'relative',
            overflow: 'hidden',
            paddingRight: theme.spacing.unit,
            paddingBottom: 0,
        },
        liveExpressionContainerUpdated: {
            transition: ['filter', 'opacity'],
            transitionDuration: 1000,
        },
        liveExpressionContainerUpdating: {
            filter: 'grayscale(90%)',
            opacity: 0.70,
        },
        liveExpressionContent: {
            // lineHeight: monacoProps.lineOffSetHeight,
            overflow: 'auto',
            position: 'relative',
            maxWidth: 'inherit',
            // paddingTop: theme.spacing.unit,
            // paddingBottom: theme.spacing.unit * 2,
            // marginBottom: -theme.spacing.unit,
        },
        branchNavigatorWidget: {
            lineHeight: 1,
            fontSize: 10,
            maxHeight: 14,
            minWidth: 0,
            minHeight: 0,
            paddingTop: 2,
            paddingRight: 4,
            paddingBottom: 2,
            paddingLeft: 2,
            margin: 0,
            width: '100%',
            height: '100%',
            borderRadius: 0,
        },
        overflowXIcon: {
            color: 'default',
            position: 'absolute',
            top: 2,
            right: 0,
            marginTop: -2,
            marginRight: -4,
            padding: 2,
            // marginTop: -theme.spacing.unit,
            fontSize: monacoProps.lineOffSetHeight,
        },
        updated: {
            transition: ['color'],
            transitionDuration: 2000,
        },
        updating: {
            color: theme.palette.secondary.main
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
        // userBranches: [],
        branchSelections: {},
        // currentBranchId: null,
        // currentBranchTimelineId: null,
        // navigatorIndex: 0,
        // prevTimelineI: null,
        showLiveExpressions: true,
        updatingLiveExpressions: false,

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

    static getDerivedStateFromProps(nextProps, prevState) {
        // console.log('timeline', nextProps.timeline);
        if (nextProps.isNew && prevState.updatingLiveExpressions) {
            return {updatingLiveExpressions: false};
        }
        return null;
    }

    configureLiveExpressionWidgetsLayoutChange(firecoPad) {
        const {monacoEditor} = firecoPad;
        const widgetLayoutChange = throttle(() => {
            this.setState({updatingLiveExpressions: true});
            this.timeline = [];
            this.logs = [];
            this.refreshTimeline();
        }, 100, {leading: true, trailing: true});

        monacoEditor.onDidScrollChange(throttle(() => {
            // this.setState({});
            if (this.state.currentContentWidgetId) {
                this.setState({currentContentWidgetId: null});
            }
        }, 100, {leading: true, trailing: true}));
        firecoPad.widgetLayoutChange = widgetLayoutChange;
    }

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

    handleBranchChange = (navigationType, currentBranchId, currentBranchTimelineId, navigatorIndex, prevTimelineI) => {
        // const userBranches = [...this.state.userBranches];
        // if (userBranches.length) {
        //     if (userBranches[userBranches.length - 1].currentBranchId === currentBranchId) {
        //         userBranches[userBranches.length - 1] = {
        //             navigationType, currentBranchId, currentBranchTimelineId, navigatorIndex, prevTimelineI
        //         };
        //     } else {
        //         userBranches.push({
        //             navigationType, currentBranchId, currentBranchTimelineId, navigatorIndex, prevTimelineI
        //         });
        //     }
        // } else {
        //     userBranches.push({
        //         navigationType, currentBranchId, currentBranchTimelineId, navigatorIndex, prevTimelineI
        //     });
        // }
        let {branchSelections} = this.state;
        const globalB = (branchSelections[NavigationTypes.Global] || {});
        const globalCurrentBranchId = globalB.currentBranchId;
        branchSelections = {
            ...branchSelections, [navigationType]: {
                currentBranchId, currentBranchTimelineId, navigatorIndex, prevTimelineI,
                globalCurrentBranchId,
            }
        };

        if (globalCurrentBranchId && branchSelections[NavigationTypes.Local]
            && branchSelections[NavigationTypes.Local].globalCurrentBranchId !== globalCurrentBranchId) {
            branchSelections[NavigationTypes.Local] = null;
        }

        this.setState({branchSelections});
    };

    configureNavigators = (navigationType, branched, absoluteBranched, color, classes, style, liveExpressionContainerClassName) => {
        const {
            decorators, branchSelections, currentContentWidgetId,
        } = this.state;
        const {
            /*currentBranchId,*/ currentBranchTimelineId, navigatorIndex,
            /*prevTimelineI,*/
        } = (branchSelections[navigationType] || {});
        const navigators = [];
        for (const id in branched) {
            const decorator = (decorators || []).find(dec => dec.id === id);
            if (decorator) {
                //  const {datum, widget} = this.prevLiveExpressionWidgets[i];
                //   console.log('bn', decorator);
                if (decorator && decorator.contentWidget) {
                    // console.log(id, branched[id])
                    decorator.contentWidget.adjustWidth(true, true);

                    const branchIndex = branched[id].indexOf(currentBranchTimelineId);
                    const isSelected = currentContentWidgetId === id;
                    const branchSelection = branchIndex >= 0 ? branchIndex : branched[id].length;

                    // const lastTimeLineI =branched[id].length>1? branched[id][branched[id].length - 2]: branched[id][0];
                    // const absoluteBranchIndex =
                    //     absoluteBranched[id] && lastTimeLineI >= 0 ? absoluteBranched[id].indexOf(lastTimeLineI) : -1;
                    // const absoluteBranchSelection = absoluteBranched[id] ? id !== currentBranchId ?
                    //     absoluteBranchIndex >= 0 ? absoluteBranchIndex : absoluteBranched[id].length
                    //     : absoluteBranched[id].length : -1;
                    // let absoluteBranchLabel = `${absoluteBranched[id] && absoluteBranchSelection > 0 ?
                    //     absoluteBranchSelection + '/' + absoluteBranched[id].length : ''
                    //     }`;//console.log(id, branched[id], absoluteBranched[id]) ||
                    // absoluteBranchLabel = absoluteBranchLabel ? ` [${absoluteBranchLabel}]` : absoluteBranchLabel;
                    //${absoluteBranchLabel}
                    const branchLabel = `${branchSelection}/${branched[id].length}`;
                    const sliderRange = isSelected ? [navigatorIndex] : null;
                    const branchNavigatorWidgetClassName = classes.branchNavigatorWidget;
                    navigators.push(
                        <React.Fragment key={`${id}:${navigationType}`}>
                            <DOMPortal
                                parentEl={decorator.contentWidget.domNode}>
                                <div onMouseEnter={() => this.handleCurrentContentWidgetId(id)}
                                     onMouseLeave={() => this.handleCurrentContentWidgetId()}
                                     className={liveExpressionContainerClassName}
                                >
                                    <OverflowComponent
                                        contentClassName={classes.liveExpressionContent}
                                        disableOverflowDetectionY={true}
                                        //  placeholder={<Typography>Yo</Typography>}
                                        //  placeholderClassName={classes.expressionCellContent}
                                        // placeholderDisableGutters={true}
                                    >
                                        <Button variant="raised" color={color}
                                                className={branchNavigatorWidgetClassName}>
                                            {branchLabel}</Button>
                                        {/*<ObjectRootLabel data={branched[id]}/>*/}
                                    </OverflowComponent>

                                </div>
                            </DOMPortal>
                            <LiveExpression
                                style={style}
                                color={color}
                                expressionId={id}
                                classes={classes}
                                widget={decorator}
                                data={[...branched[id]]}
                                isOpen={isSelected && branched[id].length > 0}
                                objectNodeRenderer={this.objectNodeRenderer}
                                sliderRange={sliderRange}
                                branchNavigatorChange={(timelineI, navigatorIndex, prevTimelineI) => this.handleBranchChange(navigationType, id, timelineI, navigatorIndex, prevTimelineI)}
                                //handleChange={this.handleObjectExplorerExpand}
                            />
                        </React.Fragment>);
                }

            }
        }
        return navigators;
    };

    render() {
        const {classes, editorWidth, editorHeight, timeline} = this.props;
        const {
            decorators, currentContentWidgetId, updatingLiveExpressions, branchSelections
        } = this.state;

        const {
            currentBranchId, currentBranchTimelineId,
            /*navigatorIndex,*/ prevTimelineI,
        } = (branchSelections[NavigationTypes.Global] || {});

        const localBranchSelection = (branchSelections[NavigationTypes.Local] || {});
        const currentLocalBranchId = localBranchSelection.currentBranchId;
        const currentLocalBranchTimelineId = localBranchSelection.currentBranchTimelineId;
        const prevLocalTimelineI = localBranchSelection.prevTimelineI;


        const liveExpressionContainerClassName = updatingLiveExpressions ?
            classes.liveExpressionContainerUpdating : classes.liveExpressionContainerUpdated;

        const style = {
            width: 'calc(100%)',
        };

        if (editorHeight && editorWidth) {
            style.maxWidth = `${editorWidth}px`;
            style.maxHeight = `${Math.ceil(editorHeight / 2)}px`;
        }

        const branches = this.traceSubscriber && this.timeline.length ? this.traceSubscriber.branches || [] : [];
        //const mainLoadedTimelineI = this.traceSubscriber ? this.traceSubscriber.mainLoadedTimelineI : 0;
        const globalBranches = {};
        let globalBranchLocs = null;
        const absoluteGlobalBranches = {};
        const localBranches = {};
        let localBranchLocs = null;
        if (currentBranchId && currentBranchTimelineId) {
            branches.forEach(branch => {
                const {id, timelineI, navigationType, loc, blockLoc} = branch;
                const branched = navigationType === NavigationTypes.Global ? globalBranches : localBranches;
                if (branch.id === currentLocalBranchId) {
                    localBranchLocs = {loc, blockLoc};
                }

                if (branch.id === currentBranchId) {
                    branched[id] = branched[id] || [];
                    branched[id].push(timelineI);
                    globalBranchLocs = {loc, blockLoc};
                } else {
                    if (timelineI < currentBranchTimelineId) {
                        if (navigationType === NavigationTypes.Local) {
                            if (!prevTimelineI || timelineI >= prevTimelineI) {
                                branched[id] = branched[id] || [];
                                branched[id].push(timelineI);
                            }

                        } else {
                            branched[id] = branched[id] || [];
                            branched[id].push(timelineI);
                        }

                    }
                    if (navigationType === NavigationTypes.Global) {
                        absoluteGlobalBranches[id] = absoluteGlobalBranches[id] || [];
                        absoluteGlobalBranches[id].push(timelineI);
                    }

                }
            });
            for (const id in globalBranches) {
                if (id !== currentBranchId) {
                    globalBranches[id][globalBranches[id].length - 1] = currentBranchTimelineId;
                }
            }

        } else {
            branches.forEach(branch => {
                const {id, timelineI, navigationType} = branch;
                const branched = navigationType === NavigationTypes.Global ? globalBranches : localBranches;
                branched[id] = branched[id] || [];
                // if(!timelineI){
                //     if(branched[id].length && branched[id][branched[id].length-1] <= mainLoadedTimelineI){
                //         branched[id].push(mainLoadedTimelineI);
                //     }else{
                //         branched[id].push(timelineI);
                //     }
                // }else{
                branched[id].push(timelineI);
                // }
            });

        }

        this.prevLiveExpressionWidgets = this.liveExpressionWidgets;

        const globalNavigators =
            this.configureNavigators(
                NavigationTypes.Global,
                globalBranches, absoluteGlobalBranches, 'primary', classes, style, liveExpressionContainerClassName);
        const localNavigators =
            this.configureNavigators(
                NavigationTypes.Local,
                localBranches, {}, 'secondary', classes, style, liveExpressionContainerClassName);

        const currentTimeline = (currentBranchId && currentBranchTimelineId) ?
            timeline.slice(timeline.length - currentBranchTimelineId) : timeline;
        // console.log(currentBranchId, currentBranchTimelineId, currentTimeline, timeline.length);
        const liveRanges = [];
        this.liveExpressionWidgets = {};
        (currentBranchId && currentBranchTimelineId && globalBranchLocs && globalBranchLocs.loc) ?
            this.highlightBranch(NavigationTypes.Global, globalBranchLocs.loc)
            : this.highlightBranch(NavigationTypes.Global);

        (currentLocalBranchId && currentLocalBranchTimelineId && localBranchLocs && localBranchLocs.loc) ?
            this.highlightBranch(NavigationTypes.Local, localBranchLocs.loc)
            : this.highlightBranch(NavigationTypes.Local);
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
                                 className={liveExpressionContainerClassName}
                            >
                                <OverflowComponent
                                    overflowXClassName={classes.liveExpressionRoot}
                                    contentClassName={classes.liveExpressionContent}
                                    disableOverflowDetectionY={true}
                                    overflowXAdornment={<MoreVertIcon className={classes.overflowXIcon}/>}
                                    //  placeholder={<Typography>Yo</Typography>}
                                    //  placeholderClassName={classes.expressionCellContent}
                                    // placeholderDisableGutters={true}
                                >
                                    <ObjectRootLabel data={datum} compact={true}/>
                                </OverflowComponent>

                            </div>
                        </DOMPortal>);
                }

            }
        }
        return (<React.Fragment>
            {liveExpressions}
            {liveWidgets}
            {globalNavigators}
            {localNavigators}
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

    componentDidUpdate(prevProps, prevState/*, snapshot*/) {
        this.didUpdate = true;
        if (prevProps.autorunDelay !== this.props.autorunDelay) {
            this.handleBundlingSubscriptionDebounced();
        }
        const {firecoPad} = this.state;
        if (firecoPad && firecoPad !== prevState.firecoPad) {
            this.configureLiveExpressionWidgetsLayoutChange(firecoPad);
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

    highlightBranch = (navigationType, loc, matches, isReveal) => {
        this.prevBranch = this.prevBranch || {};
        if (!loc) {
            this.unHighlightBranch(navigationType);
            return;
        }
        const type = NavigationTypes.Global === navigationType ?
            HighlightTypes.globalBranch : HighlightTypes.localBranch;

        this.prevBranch[navigationType] = {
            single: this.highlightTexts(
                [loc],
                {
                    isWholeLine: true,
                    className: type,
                    linesDecorationsClassName: `${type}-decoration`,
                }, this.prevBranch[navigationType] ?
                    this.prevBranch[navigationType].single.decorationIds : [], isReveal)
            ,
            matches: matches ? this.highlightTexts(
                matches,
                {
                    className: `${type}-match`
                }, this.prevBranch[navigationType] && this.prevBranch[navigationType].matches ?
                    this.prevBranch[navigationType].matches.decorationIds : [], false)
                : null
        }
    };

    unHighlightBranch = (navigationType) => {
        if (this.prevBranch[navigationType] && this.prevBranch[navigationType].single.decorationIds.length) {
            const {firecoPad} = this.state;
            this.prevBranch[navigationType].single.decorationIds =
                firecoPad.monacoEditor.deltaDecorations(this.prevBranch[navigationType].single.decorationIds, []);
            firecoPad.monacoEditor.restoreViewState(this.prevBranch[navigationType].single.viewState);
        }
        if (this.prevBranch[navigationType] &&
            this.prevBranch[navigationType].matches && this.prevBranch[navigationType].matches.decorationIds.length) {
            const {firecoPad} = this.state;
            this.prevBranch[navigationType].matches.decorationIds =
                firecoPad.monacoEditor.deltaDecorations(this.prevBranch[navigationType].matches.decorationIds, []);
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
                }, this.prevSingleTextState && this.prevSingleTextState.matches ?
                    this.prevSingleTextState.matches.decorationIds : [], false)
                : null
        }
    };

    unHighlightSingleText = () => {
        if (this.prevSingleTextState && this.prevSingleTextState.single.decorationIds.length) {
            const {firecoPad} = this.state;
            this.prevSingleTextState.single.decorationIds =
                firecoPad.monacoEditor.deltaDecorations(this.prevSingleTextState.single.decorationIds, []);
            firecoPad.monacoEditor.restoreViewState(this.prevSingleTextState.single.viewState);
        }
        if (this.prevSingleTextState && this.prevSingleTextState.matches
            && this.prevSingleTextState.matches.decorationIds.length) {
            const {firecoPad} = this.state;
            this.prevSingleTextState.matches.decorationIds =
                firecoPad.monacoEditor.deltaDecorations(this.prevSingleTextState.matches.decorationIds, []);
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

        return firecoPad
            .monacoEditor
            .getModel()
            .getValueInRange(firecoPad.liveExpressionWidgetProvider.locToMonacoRange(loc));
    };

    colorizeDomElement = (ref) => {
        const {firecoPad} = this.state;
        return firecoPad.liveExpressionWidgetProvider.colorizeElement(ref);
    };


    refreshTimeline = () => {
        let isRefresh = this.timeline !== this.prevTimeline || this.logs !== this.prevLogs;
        //let isRefresh = this.timeline !== this.validTimeline || this.logs !== this.prevLogs;
        if (isRefresh) {
            if (this.didUpdate) {
                this.didUpdate = false;
                this.prevTimeline = this.timeline;
                this.prevLogs = this.logs;

                // this.validTimeline =
                //     this.timeline && this.timeline.length? this.timeline:this.validTimeline||[];

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
        {context => {
            return <LiveExpressionStore {...props} {...context}/>
        }}
    </PastebinContext.Consumer>
);
export default withStyles(styles)(LiveExpressionStoreWithContext);
