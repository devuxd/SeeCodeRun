import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from "prop-types";
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import isString from 'lodash/isString';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import {Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import JSAN from 'jsan';

import {withStyles} from '@material-ui/core/styles';

import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';

import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import {fade} from '@material-ui/core/styles/colorManipulator';
import {ObjectRootLabel/*, ObjectLabel*/, createLiveObjectNodeRenderer} from '../components/ObjectExplorer';

import LiveExpression from '../components/LiveExpression';
import AutoLog from "../seecoderun/modules/AutoLog";
import {updateBundle, updateBundleFailure, updateBundleSuccess} from "../redux/modules/liveExpressionStore";

import Portal from '@material-ui/core/Portal';

import {PastebinContext, VisualQueryManager} from './Pastebin';
import OverflowComponent from "../components/OverflowComponent";
import {NavigationTypes} from '../seecoderun/modules/AutoLogShift';
import {monacoProps} from "../utils/monacoUtils";
import {getVisualIdsFromRefs} from './GraphicalMapper';
import GraphicalQuery from '../components/GraphicalQuery';
import TimelineBranchManager from "../seecoderun/modules/TimelineBranchManager";

let monaco = null;

const mapStateToProps = ({monacoEditorsReducer, pastebinReducer}, {editorId}) => {
    monaco = monaco || window.monaco;
    const {monacoEditorsStates} = monacoEditorsReducer;
    const {editorsTexts} = pastebinReducer;
    const newFirecoPad = monacoEditorsStates && monacoEditorsStates[editorId] ?
        monacoEditorsStates[editorId].firecoPad : null;

    if (newFirecoPad && newFirecoPad.liveExpressionWidgetProvider) {
        return {editorsTexts, firecoPad: newFirecoPad};
    } else {
        return {editorsTexts};
    }
}
const mapDispatchToProps = {updateBundle, updateBundleFailure, updateBundleSuccess};

const goToTimelineBranchInactive = (timelineI) => {
};
let goToTimelineBranch = goToTimelineBranchInactive;

export const configureGoToTimelineBranch = () => {
    return goToTimelineBranch;
};


export const HighlightTypes = {
    text: 'monaco-editor-decoration-les-textHighlight-text',
    error: 'monaco-editor-decoration-les-textHighlight-error',
    graphical: 'monaco-editor-decoration-les-textHighlight-graphical',
    globalBranch: 'monaco-editor-decoration-les-textHighlight-global-branch',
    localBranch: 'monaco-editor-decoration-les-textHighlight-local-branch',
};

export const defaultExpressionClassName = 'monaco-editor-decoration-les-expression';
export const deadExpressionClassName = 'monaco-editor-decoration-les-expressionDead';
export const liveExpressionClassName = 'monaco-editor-decoration-les-expressionLive';
export const errorExpressionClassName = 'monaco-editor-decoration-les-expressionError';
export const branchExpressionClassName = 'monaco-editor-decoration-les-expressionBranch';

export let HighlightPalette = {
    text: {},
    error: {},
    graphical: {},
    globalBranch: {},
    localBranch: {},
};

const BRANCH_LINE_DECORATION_WIDTH = 3;

const styles = (theme) => {

    HighlightPalette = {
        text: theme.palette.action.hover,
        object: fade(theme.palette.primary.main, 0.2),
        graphical: fade(theme.palette.secondary.main, 0.08),
        error: fade(theme.palette.error.main, 0.08),
        //   callback: fade(theme.palette.secondary.main, 0.08),
        globalBranch: fade(theme.palette.primary.main, 0.08),
        localBranch: fade(theme.palette.secondary.main, 0.08),
    };
    // let baseAlpha = 0.04;
    // HighlightPalette.text = {
    //     baseAlpha,
    //     enabled: fade(theme.palette.primary.light, baseAlpha),
    //     hover: fade(theme.palette.primary.light, baseAlpha*2),
    //     focus: fade(theme.palette.primary.light, baseAlpha),
    //     selected: fade(theme.palette.primary.light, baseAlpha),
    //     activated: fade(theme.palette.primary.light, baseAlpha),
    //     pressed: fade(theme.palette.primary.light, baseAlpha),
    //     dragged: fade(theme.palette.primary.light, baseAlpha),
    // };

    return {
        '@global': {
            '.monaco-editor div.margin': {
                zIndex: '1000 !important',
            },
            [`.${defaultExpressionClassName}`]: {
                opacity: 0.4,
                filter: 'greyscale(85%)',
                // fontWeight: 100,
            },
            [`.${deadExpressionClassName}`]: {
                opacity: '0.4 !important',
                filter: 'greyscale(85%) !important',
                fontWeight: '100 !important',
                // opacity: 0.4,
                // filter: 'greyscale(85%)',
                // fontWeight: 100,
                //  border: '2px solid red'
            },
            [`.${liveExpressionClassName}`]: {
                opacity: '1',
                filter: 'unset',
                fontWeight: 'normal',
                border: 'none',
                transition: ['opacity', 'filter', 'fontWeight'],
                transitionDuration: 2000,
            },
            [`.${errorExpressionClassName}`]: {
                opacity: '1',
                filter: 'unset',
                fontWeight: 'bolder',
                borderTop: '1px solid red',
                borderBottom: '2px solid red',
                backgroundColor: HighlightPalette.error,
            },
            [`.${errorExpressionClassName}-lineDecoration`]: {
                backgroundColor: 'red',
                margin: theme.spacing(1),
                top: theme.spacing(0.5),
                height: `${theme.spacing(1)} !important`,
                width: `${theme.spacing(1)} !important`,
            },
            [`.${branchExpressionClassName}`]: {
                opacity: 1,
                filter: 'unset !important',
                fontWeight: 700,
            },
            [`.${HighlightTypes.text}`]: {
                backgroundColor: HighlightPalette.text,
            },
            [`.${HighlightTypes.text}-match`]: {
                backgroundColor: fade(theme.palette.primary.light, 0.15),
            },
            [`.${HighlightTypes.error}`]: {
                backgroundColor: HighlightPalette.error,
                border: '1px solid red',
            },
            [`.${HighlightTypes.graphical}`]: {
                backgroundColor: fade(HighlightPalette.graphical, 0.35),
            },
            [`.${HighlightTypes.graphical}-match`]: {
                backgroundColor: fade(theme.palette.secondary.light, 0.25),
            },
            [`.${HighlightTypes.globalBranch}`]: {
                //  backgroundColor: HighlightPalette.globalBranch,
                // borderTop: `1px solid${theme.palette.primary.main}`,
                // borderBottom: `1px solid${theme.palette.primary.main}`,
            },
            [`.${HighlightTypes.globalBranch}-decoration`]: {
                marginLeft: BRANCH_LINE_DECORATION_WIDTH,
                background: `linear-gradient(90deg, ${
                    theme.palette.primary.main
                } ${BRANCH_LINE_DECORATION_WIDTH}px, ${
                    HighlightPalette.globalBranch
                } ${BRANCH_LINE_DECORATION_WIDTH}px)`,
            },
            [`.${HighlightTypes.globalBranch}-default-decoration`]: {
                //  marginLeft: BRANCH_LINE_DECORATION_WIDTH,
                background: `red`,
                zIndex: 10000,
            },
            [`.${HighlightTypes.globalBranch}-delimiter-decoration`]: {
                marginLeft: BRANCH_LINE_DECORATION_WIDTH,
                background: `linear-gradient(0deg,  ${
                    'transparent'
                } ${monacoProps.lineOffSetHeight}px, ${
                    theme.palette.primary.main
                } ${monacoProps.lineOffSetHeight}px, ${
                    'transparent'
                } ${monacoProps.lineOffSetHeight + BRANCH_LINE_DECORATION_WIDTH}px)`,
            },
            [`.${HighlightTypes.localBranch}`]: {
                //  backgroundColor: HighlightPalette.localBranch,
                // borderTop: `1px solid${theme.palette.secondary.main}`,
                // borderBottom: `1px solid${theme.palette.secondary.main}`,
            },
            [`.${HighlightTypes.localBranch}-decoration`]: {
                marginLeft: BRANCH_LINE_DECORATION_WIDTH,
                background: `linear-gradient(90deg, ${
                    theme.palette.secondary.main
                } ${BRANCH_LINE_DECORATION_WIDTH}px, ${
                    HighlightPalette.localBranch
                } ${BRANCH_LINE_DECORATION_WIDTH}px)`,
            },
            [`.${HighlightTypes.localBranch}-delimiter-decoration`]: {
                marginLeft: BRANCH_LINE_DECORATION_WIDTH,
                background: `linear-gradient(0deg,  ${
                    HighlightPalette.localBranch
                } ${monacoProps.lineOffSetHeight}px, ${
                    theme.palette.secondary.main
                } ${monacoProps.lineOffSetHeight}px, ${
                    HighlightPalette.localBranch
                } ${monacoProps.lineOffSetHeight + BRANCH_LINE_DECORATION_WIDTH}px)`,
            },
        },
        popoverPaper: {
            overflow: 'auto',
            maxWidth: 'unset',
            maxHeight: 'unset',
        },
        popover: { // restricts backdrop from being modal
            width: 0,
            height: 0,
        },
        objectExplorer: {
            minWidth: 200,
            margin: theme.spacing(0.25),
        },
        rangeSlider: {
            padding: theme.spacing(1),
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
            paddingRight: theme.spacing(1),
            paddingBottom: 0,
        },
        liveExpressionContainerUpdated: {
            left: '50%',
            transition: ['filter', 'opacity', 'color',],
            transitionDuration: 1000,
            backgroundColor: theme.palette.type === 'light' ? '#fffffe' : '#1e1e1e',// monaco bg colors
        },
        liveExpressionCallExpressionContainerUpdated: {
            transition: ['filter', 'opacity', 'color',],
            transitionDuration: 1000,
            backgroundColor: theme.palette.type === 'light' ? '#fffffe' : '#1e1e1e',// monaco bg colors
        },
        liveExpressionContainerUpdating: {
            filter: 'greyscale(90%)',
            opacity: 0.70,
            backgroundColor: 'transparent',
        },
        liveExpressionPaper: {
            backgroundColor: theme.palette.type === 'light' ? '#fffffe' : '#1e1e1e',// monaco bg colors
        },
        liveExpressionContent: {
            // lineHeight: monacoProps.lineOffSetHeight,
            overflow: 'auto',
            position: 'relative',
            maxWidth: 'inherit',
            // paddingTop: theme.spacing(1),
            // paddingBottom: theme.spacing.unit * 2,
            // marginBottom: -theme.spacing(1),
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
            marginLeft: -2,
            marginRight: -4,
            padding: 2,
            // marginTop: -theme.spacing(1),
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
        getLocationId: null,
    };
    rt = 100;
    currentEditorsTexts = null;
    didUpdate = true;
    refreshRate = 1000 / 10;
    refreshInterval = null;
    isBundling = false;
    bundlingError = null;


    prevLiveExpressionWidgets = {};
    liveExpressionWidgets = {};

    static getDerivedStateFromProps(nextProps, prevState) {
        // console.log('timeline', nextProps.timeline);
        if (nextProps.isNew && prevState.updatingLiveExpressions) {
            return {updatingLiveExpressions: false, branchSelections: {}};
        }
        return null;
    }

    configureLiveExpressionWidgetsLayoutChange(firecoPad) {
        const {monacoEditor} = firecoPad;
        const widgetLayoutChange = throttle(() => {
            if (this.timeline && this.timeline.length) {
                this.setState({updatingLiveExpressions: true});
                this.timeline = [];
                this.logs = [];
                this.refreshTimeline();
            }
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

    handleCurrentContentWidgetId = (currentContentWidgetId, currentContentWidgetRange) => {
        const {handleFocusedLiveExpression} = this.props;
        if (currentContentWidgetId) {
            this.handleCloseContentWidgetDebounced(true);
            if (this.state.currentContentWidgetId) {
                if (currentContentWidgetId !== this.state.currentContentWidgetId) {
                    this.handleOpenContentWidget(currentContentWidgetId);
                    handleFocusedLiveExpression
                    && handleFocusedLiveExpression(currentContentWidgetId, currentContentWidgetRange);
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

    handleBranchChange =
        (navigationType, currentBranchId, currentBranchTimelineId, navigatorIndex, prevTimelineI) => {
            console.log('na',
                navigationType, currentBranchId, currentBranchTimelineId, navigatorIndex, prevTimelineI);
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

    getTryBlockLocs = (tryLocs) => {
        const lParLoc = {
            start: {
                line: tryLocs.loc.start.line,
                column: tryLocs.loc.start.column,
            },
            end: {
                line: tryLocs.extraLocs.block.blockLoc.start.line,
                column: tryLocs.extraLocs.block.blockLoc.start.column + 1,
            }
        };
        const rParLoc = {
            start: {
                line: tryLocs.extraLocs.block.blockLoc.end.line,
                column: tryLocs.extraLocs.block.blockLoc.end.column - 1,
            },
            end: {
                line: tryLocs.extraLocs.block.blockLoc.end.line,
                column: tryLocs.extraLocs.block.blockLoc.end.column,
            }
        };
        return [lParLoc, rParLoc];
    };
    getTryHandlerLocs = (tryLocs) => {
        const lParLoc = {
            start: {
                line: tryLocs.extraLocs.block.blockLoc.end.line,
                column: tryLocs.extraLocs.block.blockLoc.end.column,
            },
            end: {
                line: tryLocs.extraLocs.handler.blockLoc.start.line,
                column: tryLocs.extraLocs.handler.blockLoc.start.column + 1,
            }
        };
        const rParLoc = {
            start: {
                line: tryLocs.extraLocs.handler.blockLoc.end.line,
                column: tryLocs.extraLocs.handler.blockLoc.end.column - 1,
            },
            end: {
                line: tryLocs.extraLocs.handler.blockLoc.end.line,
                column: tryLocs.extraLocs.handler.blockLoc.end.column,
            }
        };
        return [lParLoc, rParLoc];
    };

    getTryFinalizerLocs = (tryLocs) => {
        const prev = tryLocs.extraLocs.handler || tryLocs.extraLocs.block;
        const lParLoc = {
            start: {
                line: prev.blockLoc.end.line,
                column: prev.blockLoc.end.column,
            },
            end: {
                line: tryLocs.extraLocs.finalizer.blockLoc.start.line,
                column: tryLocs.extraLocs.finalizer.blockLoc.start.column + 1,
            }
        };
        const rParLoc = {
            start: {
                line: tryLocs.extraLocs.finalizer.blockLoc.end.line,
                column: tryLocs.extraLocs.finalizer.blockLoc.end.column - 1,
            },
            end: {
                line: tryLocs.extraLocs.finalizer.blockLoc.end.line,
                column: tryLocs.extraLocs.finalizer.blockLoc.end.column,
            }
        };
        return [lParLoc, rParLoc];
    };

    configureNavigators = (
        navigationType, branches, branched, absoluteBranched, currentBranched,
        color, classes, style, liveExpressionContainerClassName, liveRanges, ignoreRanges) => {
        const {firecoPad} = this.props;
        const {
            decorators, branchSelections, currentContentWidgetId,
        } = this.state;
        const {
            /*currentBranchId,*/ currentBranchTimelineId, navigatorIndex,
            /*prevTimelineI,*/
        } = (branchSelections[navigationType] || {});
        const navigators = [];

        // console.log('start cont ------------------------', branchSelections[navigationType] );
        for (const id in branched) {
            const decorator = (decorators || []).find(dec => dec.id === id);
            if (decorator) {
                //  const {datum, widget} = this.prevLiveExpressionWidgets[i];
                //   console.log('bn', decorator);
                if (decorator && decorator.contentWidget) {
                    // console.log(id, branched[id])
                    //decorator.contentWidget.adjustWidth(true, true);

                    const branchIndex = branched[id].indexOf(currentBranchTimelineId);
                    const isSelected = currentContentWidgetId === id;
                    const branchSelection = currentBranched && currentBranched[id] ?
                        currentBranched[id].length
                        : branched[id].length; //branchIndex >= 0 ? branchIndex :
                    const branchTotal =
                        absoluteBranched && absoluteBranched[id] ? absoluteBranched[id].length : branched[id].length;
                    // const branchLabel = `${branchSelection}/${branchTotal}`;
                    const branchLabel = `${navigatorIndex || branchTotal}/${branchTotal}`;
                    const sliderRange = [navigatorIndex || branchTotal];
                    const branchNavigatorWidgetClassName = classes.branchNavigatorWidget;
                    const n = currentBranchTimelineId ?
                        this.timeline[this.timeline.length - currentBranchTimelineId] || {} : {};
                    const branch = (branches || []).find(b => b.id === id);

                    let isE = false;

                    if (branch.expression.extraLocs && branch.expression.extraLocs.isException) {
                        const tryLocs = branch.expression.extraLocs.tryLocs;
                        if (tryLocs) {
                            switch (branch.expression.extraLocs.name) {
                                case 'block':
                                    this.getTryBlockLocs(tryLocs).forEach(loc => {
                                        const range =
                                            firecoPad
                                                .liveExpressionWidgetProvider
                                                .locToMonacoRange(loc);
                                        range && liveRanges.push(range);
                                    });

                                    break;

                                case 'finalizer':
                                    this.getTryFinalizerLocs(tryLocs).forEach(loc => {
                                        const range =
                                            firecoPad
                                                .liveExpressionWidgetProvider
                                                .locToMonacoRange(loc);
                                        range && liveRanges.push(range);
                                    });

                                    break;
                                default:// handler
                                    // console.log('h', branch);
                                    this.getTryBlockLocs(tryLocs).forEach(loc => {
                                        const range =
                                            firecoPad
                                                .liveExpressionWidgetProvider
                                                .locToMonacoRange(loc);
                                        const index = range && liveRanges.findIndex(r => r.equalsRange(range));
                                        index >= 0 && liveRanges.splice(index, 1);
                                    });

                                    this.getTryHandlerLocs(tryLocs).forEach(loc => {
                                        const range =
                                            firecoPad
                                                .liveExpressionWidgetProvider
                                                .locToMonacoRange(loc);
                                        range && liveRanges.push(range);
                                    });
                                    isE = true;
                            }
                            if (!isE) {
                                continue;
                            }
                        }
                    }
                    if (color === 'secondary') {
                        // console.log('lo',
                        // branch, decorator,
                        // this.timeline[this.timeline.length - currentBranchTimelineId], branched[id]);
                    }
                    // if(branch.expression.expressionType === 'IfStatement'){
                    //     console.log('cont', branch);
                    // }
                    if (branch && branch.expression &&
                        branch.expression.expressionType !== 'IfStatement' && branch.expression.extraLocs
                        && (branch.expression.extraLocs.signature ||
                            branch.expression.extraLocs.test)) {
                        if (branch.expression.extraLocs.signature) {
                            const controlLParLoc = {
                                start: {
                                    line: branch.expression.extraLocs.signature.start.line,
                                    column: branch.expression.extraLocs.signature.start.column,
                                },
                                end: {
                                    line: branch.expression.blockLoc.start.line,
                                    column: branch.expression.blockLoc.start.column + 1,
                                }
                            };
                            const controlLParRange =
                                firecoPad
                                    .liveExpressionWidgetProvider
                                    .locToMonacoRange(controlLParLoc);
                            liveRanges.push(controlLParRange);

                            const controlRParLoc = {
                                start: {
                                    line: branch.expression.blockLoc.end.line,
                                    column: branch.expression.blockLoc.end.column - 1,
                                },
                                end: {
                                    line: branch.expression.blockLoc.end.line,
                                    column: branch.expression.blockLoc.end.column,
                                }
                            };
                            const controlRParRange =
                                firecoPad
                                    .liveExpressionWidgetProvider
                                    .locToMonacoRange(controlRParLoc);
                            liveRanges.push(controlRParRange);
                        }

                        if (branch.expression.extraLocs.test) {
                            const controlLParLoc = {
                                start: {
                                    line: branch.expression.loc.start.line,
                                    column: branch.expression.loc.start.column,
                                },
                                end: {
                                    line: branch.expression.extraLocs.test.start.line,
                                    column: branch.expression.extraLocs.test.start.column,
                                }
                            };
                            const controlLParRange =
                                firecoPad
                                    .liveExpressionWidgetProvider
                                    .locToMonacoRange(controlLParLoc);
                            liveRanges.push(controlLParRange);

                            const controlRParLoc = {
                                start: {
                                    line: branch.expression.extraLocs.test.end.line,
                                    column: branch.expression.extraLocs.test.end.column,
                                },
                                end: {
                                    line: branch.expression.blockLoc.start.line,
                                    column: branch.expression.blockLoc.start.column + 1,
                                }
                            };
                            const controlRParRange =
                                firecoPad
                                    .liveExpressionWidgetProvider
                                    .locToMonacoRange(controlRParLoc);
                            liveRanges.push(controlRParRange);

                            const controlEndLoc = {
                                start: {
                                    line: branch.expression.blockLoc.end.line,
                                    column: branch.expression.blockLoc.end.column - 1,
                                },
                                end: {
                                    line: branch.expression.blockLoc.end.line,
                                    column: branch.expression.blockLoc.end.column,
                                }
                            };
                            const controlEndRange =
                                firecoPad
                                    .liveExpressionWidgetProvider
                                    .locToMonacoRange(controlEndLoc);
                            liveRanges.push(controlEndRange);
                            //     console.log('while ranges', controlLParLoc, controlRParRange, controlEndRange);
                        }
                    }


                    if (branch && branch.type === 'IfStatement'
                        && branch.expression && branch.expression.extraLocs && branch.expression.extraLocs.test) {


                        if (branch.expression.extraLocs.test) {
                            //{start:{line:0, column:0}, end:{line:0, column:0}};
                            const controlLParLoc = {
                                start: {
                                    line: branch.expression.loc.start.line,
                                    column: branch.expression.loc.start.column,
                                },
                                end: {
                                    line: branch.expression.extraLocs.test.start.line,
                                    column: branch.expression.extraLocs.test.start.column,
                                }
                            };
                            const controlLParRange =
                                firecoPad
                                    .liveExpressionWidgetProvider
                                    .locToMonacoRange(controlLParLoc);
                            //  liveRanges.push(controlLParRange);

                            const controlRParLoc = {
                                start: {
                                    line: branch.expression.extraLocs.test.end.line,
                                    column: branch.expression.extraLocs.test.end.column,
                                },
                                end: {
                                    line: branch.expression.extraLocs.test.end.line,
                                    column: branch.expression.extraLocs.test.end.column + 1,
                                }
                            };
                            const controlRParRange =
                                firecoPad
                                    .liveExpressionWidgetProvider
                                    .locToMonacoRange(controlRParLoc);
                            //    liveRanges.push(controlRParRange);
                            // fix do while
                            if (branch.type === 'IfStatement') {
                                const ignoreName = branch.blockName === 'consequent' ? 'alternate' : 'consequent';
                                const range =
                                    branch.expression.extraLocs[ignoreName] ?
                                        firecoPad
                                            .liveExpressionWidgetProvider
                                            .locToMonacoRange(branch.expression.extraLocs[ignoreName]) : null;
                                //  console.log('control:',
                                // branch.blockName,'ommitting', ignoreName, branch.expression.extraLocs, range,);
                                //  range && ignoreRanges.push(range);
                            }

                            if (branch.type === 'IfStatement' && (branch.blockName === 'alternate')) {
                                const controlRParLoc = {
                                    start: {
                                        line: branch.expression.extraLocs.test.end.line,
                                        column: branch.expression.extraLocs.test.end.column + 1,
                                    },
                                    end: {
                                        line: branch.expression.extraLocs.consequent.end.line,
                                        column: branch.expression.extraLocs.consequent.end.column,
                                    }
                                };
                                const controlRParRange =
                                    firecoPad
                                        .liveExpressionWidgetProvider
                                        .locToMonacoRange(controlRParLoc);
                                //   liveRanges.push(controlRParRange);

                                const controlOpenBracketLoc = {
                                    start: {
                                        line: branch.expression.extraLocs.consequent.end.line,
                                        column: branch.expression.extraLocs.consequent.end.column,
                                    },
                                    end: {
                                        line: branch.expression.extraLocs.alternate.end.line,
                                        column: branch.expression.extraLocs.alternate.end.column + 1,
                                    }
                                };
                                const controlOpenBracketRange =
                                    firecoPad
                                        .liveExpressionWidgetProvider
                                        .locToMonacoRange(controlOpenBracketLoc);
                                //  liveRanges.push(controlOpenBracketRange);

                                const controlCloseBracketLoc = {
                                    start: {
                                        line: branch.expression.loc.end.line,
                                        column: branch.expression.loc.end.column,
                                    },
                                    end: {
                                        line: branch.expression.loc.end.line,
                                        column: branch.expression.loc.end.column + 1,
                                    }
                                };
                                const controlCloseBracketRange =
                                    firecoPad
                                        .liveExpressionWidgetProvider
                                        .locToMonacoRange(controlCloseBracketLoc);
                                //   liveRanges.push(controlCloseBracketRange);


                            } else {
                                if (branch.type !== 'DoWhileStatement') {
                                    const content = branch.type === 'IfStatement' ? 'consequent' : 'body';
                                    const controlRParOpenBracketLoc = {
                                        start: {
                                            line: branch.expression.extraLocs.test.end.line,
                                            column: branch.expression.extraLocs.test.end.column + 1,
                                        },
                                        end: {
                                            line: branch.expression.extraLocs[content].start.line,
                                            column: branch.expression.extraLocs[content].start.column,
                                        }
                                    };
                                    const controlRParOpenBracketRange =
                                        firecoPad
                                            .liveExpressionWidgetProvider
                                            .locToMonacoRange(controlRParOpenBracketLoc);
                                    //  liveRanges.push(controlRParOpenBracketRange);

                                }
                            }


                            // branch.expression.
// console.log('loce', branch.expression.extraLocs[branch.blockName]);
                            const locO = branch.expression.extraLocs[branch.blockName] ? {
                                start: {
                                    line: branch.expression.extraLocs[branch.blockName].start.line,
                                    column: branch.expression.extraLocs[branch.blockName].start.column,
                                },
                                end: {
                                    line: branch.expression.extraLocs[branch.blockName].start.line,
                                    column: branch.expression.extraLocs[branch.blockName].start.column + 1,
                                }
                            } : null;
                            const rangeO = locO ? firecoPad.liveExpressionWidgetProvider.locToMonacoRange(locO) : null;
                            // rangeO && liveRanges.push(rangeO);
                            const locC = branch.expression.extraLocs[branch.blockName] ? {
                                start: {
                                    line: branch.expression.extraLocs[branch.blockName].end.line,
                                    column: branch.expression.extraLocs[branch.blockName].end.column ?
                                        branch.expression.extraLocs[branch.blockName].end.column - 1
                                        : branch.expression.extraLocs[branch.blockName].end.column,
                                },
                                end: {
                                    line: branch.expression.extraLocs[branch.blockName].end.line,
                                    column: branch.expression.extraLocs[branch.blockName].end.column,
                                }
                            } : null;
                            const rangeC = locC ? firecoPad.liveExpressionWidgetProvider.locToMonacoRange(locC) : null;
                            //    rangeC && liveRanges.push(rangeC);
                            // console.log(branch.expression.extraLocs,
                            // branch.blockName, branch.expression.extraLocs[branch.blockName]);
                            //     this.highlightBranch(NavigationTypes.Local,
                            // branch.expression.extraLocs[branch.blockName])
                            //   : this.highlightBranch(NavigationTypes.Local);
                        }
                    } else {
                        navigators.push(
                            <React.Fragment key={`${id}:${navigationType}`}>
                                <Portal
                                    container={decorator.contentWidget.domNode}>
                                    <div onMouseEnter={() => {
                                        //  console.log(n);
                                        this.highlightSingleText(
                                            n.loc, n.isError ? HighlightTypes.error
                                                : n.isGraphical ?
                                                    HighlightTypes.graphical : HighlightTypes.text,
                                            this.traceSubscriber
                                                .getMatches(n.funcRefId, n.dataRefId, n.calleeId), false);
                                        this.handleCurrentContentWidgetId(id, n.range);
                                    }}
                                         onMouseLeave={() => {
                                             this.highlightSingleText();
                                             this.handleCurrentContentWidgetId();
                                         }}
                                         className={liveExpressionContainerClassName}
                                    >
                                        {isE ?
                                            <ObjectRootLabel
                                                data={branch.e.data}
                                                compact={true}
                                                expressionType={n.expressionType}
                                                iconify={false}
                                            />
                                            : <Paper className={classes.liveExpressionPaper}>
                                                {/*<OverflowComponent*/}
                                                {/*contentClassName={classes.liveExpressionContent}*/}
                                                {/*disableOverflowDetectionY={true}*/}
                                                {/*//  placeholder={<Typography>Yo</Typography>}*/}
                                                {/*//  placeholderClassName={classes.expressionCellContent}*/}
                                                {/*// placeholderDisableGutters={true}*/}
                                                {/*>*/}
                                                <Button variant="contained" color={color}
                                                        className={branchNavigatorWidgetClassName}>
                                                    {branchLabel}</Button>
                                                {/*<ObjectRootLabel data={branched[id]}/>*/}
                                                {/*</OverflowComponent>*/}
                                            </Paper>}

                                    </div>
                                </Portal>
                                {!isE && <LiveExpression
                                    style={style}
                                    color={color}
                                    expressionId={id}
                                    classes={classes}
                                    widget={decorator}
                                    data={[...branched[id]]}
                                    isOpen={isSelected && branched[id].length > 0}
                                    objectNodeRenderer={this.objectNodeRenderer}
                                    sliderRange={sliderRange}
                                    branchNavigatorChange={(timelineI, navigatorIndex, prevTimelineI) =>
                                        this.handleBranchChange(
                                            navigationType, id, timelineI, navigatorIndex, prevTimelineI
                                        )}
                                    //handleChange={this.handleObjectExplorerExpand}
                                />}
                            </React.Fragment>);


                    }
                }
            }
        }
        return navigators;
    };

    findFuncRefs(timeline, branches) {
        let branchSource = null, startIndex = 0;
        // console.log(timeline, branches);
        branches.forEach(branch => {
            if (branchSource) {
                console.log(branchSource.loc.start.line, 'range', startIndex, branch.timelineI
                );

                // timeline.reduce((r, e, i)=>((i>startIndex&& i<= branch.timelineI)?((r.push(e)|| true)&& r):r), []).forEach(
                //     entry=>{
                //         if(entry &&entry.type === 'AssignmentExpression'){
                //                     // console.log(entry);
                //                 }
                //     }
                // );
                for (let i = timeline.length - startIndex; i > timeline.length - branch.timelineI; i--) {

                    if (timeline[i] && timeline[i].type === 'AssignmentExpression') {
                        if (timeline[i].objectClassName === 'Function') {
                            console.log(timeline[i]);
                            //   console.log('other refs', timeline.filter(t => t.value === timeline[i].value));
                        }

                    }
                }
            }
            branchSource = branch;
            startIndex = branch.timelineI;
        });
    }

    adjustWidth = (liveExpresionDataInLineRaw) => {
        const {firecoPad} = this.props;
        const liveExpresionDataInLine = liveExpresionDataInLineRaw.sort((a, b) => {
            const aRange = a.range, bRange = b.range;
            if (aRange && bRange && aRange !== bRange) {
                if (aRange.containsRange(bRange)) {
                    if (aRange.equalsRange()) {
                        return 0;
                    } else {
                        return 1;
                    }
                } else {
                    if (aRange.startColumn < bRange.startColumn) {
                        return -1;
                    } else {
                        if (aRange.startColumn > bRange.startColumn) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }
                }
            }
            return 0;
        });

        class OffsetModel {
            constructor(lineNumber, el, align, startOffset, endOffset, marginLeft, maxWidth) {

            }

            isOccluding() {

            }

            conciliate() {

            }
        }

        const offsetModels = [];

        const toReAdjust = [];
        liveExpresionDataInLine.forEach(i => {
            let isIVisible = true, marginLeft = 0, isAlignRight = false;
            if (i.domNode.offsetParent === null) {
                isIVisible = false;
                if (i.domNode.dataset.marginLeft) {
                    marginLeft = parseFloat(i.domNode.dataset.marginLeft || '0');
                } else {
                    return;
                }
            }
            if (i.n.expressionType === 'CallExpression' && !isFunction(i.n.value)) {
                isAlignRight = true;

                marginLeft = isIVisible ?
                    firecoPad
                        .monacoEditor
                        .getOffsetForColumn(
                            i.range.endLineNumber, i.range.endColumn)
                    - firecoPad
                        .monacoEditor
                        .getOffsetForColumn(i.range.startLineNumber, i.range.startColumn)
                    : marginLeft;
                i.domNode.style.marginLeft = `${marginLeft - 7}px`;
                i.domNode.dataset.marginLeft = `${marginLeft}`;
                i.domNode.dataset.isAlignRight = 'true';
                toReAdjust.push(i.domNode);
            } else {
                if (i.n.expressionType === 'AssignmentExpression'
                    || i.n.expressionType === 'ReturnStatement'
                    || ((i.n.expressionType === 'CallExpression'
                        || i.n.expressionType === 'MemberExpression') && isFunction(i.n.value))
                    || i.n.expressionType === 'VariableDeclarator') {
                    i.domNode.style.maxWidth = '0px';
                    i.domNode.dataset.maxWidth = '0';
                    return;
                }

            }


            let leftBound = null;
            let marginBound = null;
            liveExpresionDataInLine.forEach(j => {

                if (j.n.expressionType === 'AssignmentExpression'
                    || j.n.expressionType === 'ReturnStatement'
                    || ((j.n.expressionType === 'CallExpression' || j.n.expressionType === 'MemberExpression')
                        && isFunction(j.n.value))
                    || j.n.expressionType === 'VariableDeclarator') {
                    return;
                }

                if (i.range !== j.range) {

                    if (!(j.range.containsRange(i.range) || i.range.containsRange(j.range))) {
                        if (i.range.startLineNumber === i.range.endLineNumber
                            && i.range.endLineNumber === j.range.endLineNumber) {
                            if (i.range.endColumn <= j.range.startColumn) {
                                if (leftBound) {
                                    if (j.range.startColumn <= leftBound.range.startColumn) {
                                        leftBound = j;
                                    }
                                } else {
                                    leftBound = j;
                                }
                            }
                        }

                    } else {
                        if (j.range.containsRange(i.range) && i.range.startLineNumber === i.range.endLineNumber
                            && i.range.startColumn === j.range.startColumn
                            && i.range.endLineNumber === j.range.endLineNumber) {
                            if (marginBound) {
                                if (marginBound.range.containsRange(j.range)) {
                                    marginBound = j;
                                }
                            } else {
                                marginBound = j;
                            }
                        }
                    }
                }
            });
            let leftBoundWidth = 0;

            if (leftBound && (leftBound.domNode.offsetParent !== null || i.domNode.dataset.maxWidth)) {
                leftBoundWidth = leftBound.domNode.offsetParent !== null ?
                    firecoPad
                        .monacoEditor
                        .getOffsetForColumn(
                            leftBound.range.startLineNumber, leftBound.range.startColumn)
                    - firecoPad
                        .monacoEditor
                        .getOffsetForColumn(i.range.startLineNumber, i.range.startColumn)
                    : i.domNode.dataset.maxWidth;
                i.domNode.style.maxWidth = `${leftBoundWidth - 7}px`;
                i.domNode.dataset.maxWidth = `${leftBoundWidth}`;
                toReAdjust.push(i.domNode);
            }

            if (marginBound) {
                if (!isAlignRight && !marginBound.domNode.dataset.isAlignRight) {
                    marginLeft = leftBoundWidth || isIVisible ?
                        firecoPad
                            .monacoEditor
                            .getOffsetForColumn(
                                i.range.endLineNumber, i.range.endColumn)
                        - firecoPad
                            .monacoEditor
                            .getOffsetForColumn(i.range.startLineNumber, i.range.startColumn)
                        : marginBound.domNode.dataset.marginLeft;

                    marginBound.domNode.style.marginLeft = `${marginLeft + 7}px`;
                    marginBound.domNode.dataset.marginLeft = `${marginLeft}`;
                    i.domNode.style.maxWidth = `${marginLeft}px`;
                    i.domNode.dataset.maxWidth = `${marginLeft}`;
                    toReAdjust.push(i.domNode);
                    toReAdjust.push(marginBound.domNode);
                } else {

                }
            }

        });
        toReAdjust.forEach((nodeI, i) => {
            for (let j = i; j < toReAdjust.length; j++) {
                // const nodeJ = toReAdjust[j];
                // const iStart = nodeI.dataset.isAlignRight?parseFloat(nodeI.style.marginLeft)
                // if(){
                //
                // }
            }
        });
        // console.log('RE', toReAdjust);
    };

    render() {
        const {classes, editorWidth, editorHeight, timeline, searchState, firecoPad,} = this.props;
        const {
            decorators, currentContentWidgetId, updatingLiveExpressions, branchSelections,
        } = this.state;

        const liveExpressionContainerClassName = updatingLiveExpressions ?
            classes.liveExpressionContainerUpdating : classes.liveExpressionContainerUpdated;

        const {
            currentBranchId, currentBranchTimelineId,
            /*navigatorIndex,*/ prevTimelineI,
        } = (branchSelections[NavigationTypes.Local] || branchSelections[NavigationTypes.Global] || {});
        //todo: pass all baranchSelections to Branch Manager

        const style = {
            width: 'calc(100%)',
        };

        if (editorHeight && editorWidth) {
            style.maxWidth = `${editorWidth}px`;
            style.maxHeight = `${Math.ceil(editorHeight / 2)}px`;
        }
        // const lee = document.querySelectorAll(`.${defaultExpressionClassName}`);
        // if(firecoPad){
        //     const {monacoEditor} = firecoPad;
        //     if(monacoEditor){
        //         const res =monacoEditor
        //             .getModel()
        //             .getAllDecorations()
        //             .filter(dec=>dec.options.inlineClassName.includes(defaultExpressionClassName))
        //         .map(dec=>dec.id);
        //         monacoEditor.deltaDecorations(res, []);
        //         console.log('decs', res);
        //     }
        // }


        this.unHighlightLiveExpressions();
        // this.unHighlightErrors();
        this.unHighlightBranches();

        const tbm =
            new TimelineBranchManager(
                branchSelections,
                this.traceSubscriber, this.timeline, prevTimelineI,
                currentBranchId, currentBranchTimelineId);
        this.timelineBranchManager = tbm;


        this.prevLiveExpressionWidgets = this.liveExpressionWidgets;

        const liveRanges = [], ignoreRanges = [];

        const globalNavigators =
            this.configureNavigators(
                NavigationTypes.Global,
                tbm.branches, tbm.globalBranches, tbm.absoluteGlobalBranches, tbm.currentGlobalBranches,
                'primary', classes, style, liveExpressionContainerClassName, liveRanges, ignoreRanges);
        const localNavigators =
            this.configureNavigators(
                NavigationTypes.Local,
                tbm.branches, tbm.localBranches, null, null, 'secondary',
                classes, style, liveExpressionContainerClassName, liveRanges, ignoreRanges);

        const currentTimeline = (currentBranchId && currentBranchTimelineId) ?
            timeline.slice(timeline.length - currentBranchTimelineId) : timeline;
        // console.log(currentBranchId, currentBranchTimelineId, currentTimeline, timeline.length);
        // console.log('---------');
        this.liveExpressionWidgets = {};
        // (tbm.globalBranchLocs && tbm.globalBranchLocs.loc) ?
        //     this.highlightBranch(NavigationTypes.Global, tbm.globalBranchLocs.loc)
        //     : this.highlightBranch(NavigationTypes.Global);
        //
        // (tbm.localBranchLocs && tbm.localBranchLocs.loc) ?
        //     this.highlightBranch(NavigationTypes.Local, tbm.localBranchLocs.loc)
        //     : this.highlightBranch(NavigationTypes.Local);
        const liveExpressions = (decorators || []).map(widget => {
            // console.log(widget.id, autoLog);
            let data = [];
            (currentTimeline || []).forEach(entry => {
                (entry.id === widget.id && entry.expressionType !== 'Literal') && data.unshift(entry);
            });//autoLogger.trace.getData(widget.id);

            if (data.length) {
                // widget.contentWidget.domNode.style.backgroundColor = 'orange';
                // widget.contentWidget.domNode.style.fontSize = '8px';


                let datum = null;
                let entry = null;
                try {
                    //todo needs parsed memoizing
                    datum =
                        data[data.length - 1].isError ?
                            data[data.length - 1].data : JSAN.parse(data[data.length - 1].data);
                    entry = data[data.length - 1];
                    // datum = isString(data[data.length - 1].data) ?
                    //     JSAN.parse(data[data.length - 1].data) : data[data.length - 1].data;
                } catch (e) {
                    console.log(data[data.length - 1], e)
                }

                if (entry &&
                    (entry.expression && entry.expression.expressionType === 'BinaryExpression') &&
                    (entry.parentExpression && entry.parentExpression.expressionType === 'WhileStatement')) {
                    // console.log('BE', entry);
                } else {
                    this.liveExpressionWidgets[widget.id] = {datum, widget, entry};
                }

                //todo assignemntexp
                if (entry && (entry.expression && entry.expression.expressionType === 'VariableDeclarator') && isFunction(entry.value)) {
                    const range = firecoPad.liveExpressionWidgetProvider.locToMonacoRange(entry.loc);
                    range && liveRanges.push(range);
                } else {

                    widget.range && liveRanges.push(widget.range);
                }

                // }
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

        //   this.highlightBranches(NavigationTypes.Global, ignoreRanges);
        let visualIds = [];

        const liveWidgets = [];

        for (const i in this.liveExpressionWidgets) {
            if (this.liveExpressionWidgets[i]) {
                const {datum, widget, entry} = this.liveExpressionWidgets[i];
                const n = entry;
                const isOutput = n.outputRefs && n.outputRefs.length;
                const isSelected = isOutput &&
                    n.outputRefs.find(ref => searchState.visualQuery && searchState.visualQuery.find(v => v === ref));

                const range = n.loc ? firecoPad.liveExpressionWidgetProvider.locToMonacoRange(n.loc) : null;
                const ignore = range && ignoreRanges.find(r => {
                    return r.containsRange(range);
                });

                const isIcon = range ?
                    range.startLineNumber === range.endLineNumber && range.endColumn - range.startColumn === 1 : false;
                const isAlignLeft = (entry.expression && entry.expression.isReturn) || entry.expressionType === 'CallExpression';

                // ignore && console.log('n', n, ignoreRanges, ignore);
                if (widget.contentWidget && n.expression && !ignore) {
                    const end =
                        firecoPad.liveExpressionWidgetProvider.locToMonacoRange(n.expression.statementEndLoc);
                    end && liveRanges.push(end);

                    if (n.expression.isJSX && n.expression.jsxElements && !n.expression.jsxElements.error) {
                        n.expression.jsxElements.openingElements.forEach(elem => {
                            const openingE = firecoPad.liveExpressionWidgetProvider.locToMonacoRange(elem);
                            openingE && liveRanges.push(openingE);
                        });
                        n.expression.jsxElements.closingElements.forEach(elem => {
                            const closingE = firecoPad.liveExpressionWidgetProvider.locToMonacoRange(elem);
                            closingE && liveRanges.push(closingE);
                        });
                        n.expression.jsxElements.attributes.forEach(elem => {
                            const att = firecoPad.liveExpressionWidgetProvider.locToMonacoRange(elem);
                            att && liveRanges.push(att);
                        });
                        n.expression.jsxElements.children.forEach(elem => {
                            const child = firecoPad.liveExpressionWidgetProvider.locToMonacoRange(elem);
                            child && liveRanges.push(child);
                        });
                        n.expression.jsxElements.parents.forEach(elem => {
                            const parent = firecoPad.liveExpressionWidgetProvider.locToMonacoRange(elem);
                            parent && liveRanges.push(parent);
                        });
                    }

                    if (n.expression.isTest && n.expression.extraLocs && n.expression.extraLocs.testableStatement) {
                        //n.expression.isTest && console.log('TEST', n.expression);
                        const testableLoc = n.expression.testableStatementType === 'DoWhileStatement' ? {
                            start: {
                                line: n.expression.extraLocs.body.end.line,
                                column: n.expression.extraLocs.body.end.column
                            }
                            , end: {
                                line: n.expression.extraLocs.testableStatement.end.line,
                                column: n.expression.extraLocs.testableStatement.end.column + 1,
                            }
                        } : {
                            start: {
                                line: n.expression.extraLocs.testableStatement.start.line,
                                column: n.expression.extraLocs.testableStatement.start.column
                            }
                            , end: n.expression.extraLocs.body ? {
                                line: n.expression.extraLocs.body.start.line,
                                column: n.expression.extraLocs.body.start.column,
                            } : n.expression.extraLocs.consequent ? {
                                line: n.expression.extraLocs.consequent.start.line,
                                column: n.expression.extraLocs.consequent.start.column,
                            } : {
                                line: n.expression.loc.end.line,
                                column: n.expression.loc.end.column,
                            }
                        };
                        const testableRange = firecoPad.liveExpressionWidgetProvider.locToMonacoRange(testableLoc);

                        testableRange && liveRanges.push(testableRange);
                        const branch = {
                            expression: n.parentExpression,
                            type: n.parentExpression ? n.parentExpression.expressionType : null,
                        };
                        branch.blockName =
                            branch.type === 'IfStatement' ? datum ? 'consequent' : 'alternate' : datum ? 'body' : null;

                        if (branch && branch.type === 'IfStatement'
                            && branch.expression && branch.expression.extraLocs && branch.expression.extraLocs.test) {

                            if (branch.expression.extraLocs.test) {
                                //{start:{line:0, column:0}, end:{line:0, column:0}};
                                const controlLParLoc = {
                                    start: {
                                        line: branch.expression.loc.start.line,
                                        column: branch.expression.loc.start.column,
                                    },
                                    end: {
                                        line: branch.expression.extraLocs.test.start.line,
                                        column: branch.expression.extraLocs.test.start.column,
                                    }
                                };
                                const controlLParRange =
                                    firecoPad
                                        .liveExpressionWidgetProvider
                                        .locToMonacoRange(controlLParLoc);
                                liveRanges.push(controlLParRange);

                                const controlRParLoc = {
                                    start: {
                                        line: branch.expression.extraLocs.test.end.line,
                                        column: branch.expression.extraLocs.test.end.column,
                                    },
                                    end: {
                                        line: branch.expression.extraLocs.test.end.line,
                                        column: branch.expression.extraLocs.test.end.column + 1,
                                    }
                                };
                                const controlRParRange =
                                    firecoPad
                                        .liveExpressionWidgetProvider
                                        .locToMonacoRange(controlRParLoc);
                                liveRanges.push(controlRParRange);
                                // fix do while
                                if (branch.type === 'IfStatement') {
                                    const ignoreName = branch.blockName === 'consequent' ? 'alternate' : 'consequent';
                                    const range = branch.expression.extraLocs[ignoreName] ?
                                        firecoPad
                                            .liveExpressionWidgetProvider
                                            .locToMonacoRange(branch.expression.extraLocs[ignoreName]) : null;
                                    //  console.log('control:',
                                    // branch.blockName,'ommitting', ignoreName, branch.expression.extraLocs, range,);
                                    range && ignoreRanges.push(range);
                                }

                                if (branch.type === 'IfStatement' && (branch.blockName === 'alternate')) {
                                    const controlRParLoc = {
                                        start: {
                                            line: branch.expression.extraLocs.test.end.line,
                                            column: branch.expression.extraLocs.test.end.column + 1,
                                        },
                                        end: {
                                            line: branch.expression.extraLocs.consequent.end.line,
                                            column: branch.expression.extraLocs.consequent.end.column,
                                        }
                                    };
                                    const controlRParRange =
                                        firecoPad
                                            .liveExpressionWidgetProvider
                                            .locToMonacoRange(controlRParLoc);
                                    liveRanges.push(controlRParRange);

                                    const controlOpenBracketLoc = branch.expression.extraLocs.alternate ? {
                                        start: {
                                            line: branch.expression.extraLocs.consequent.end.line,
                                            column: branch.expression.extraLocs.consequent.end.column,
                                        },
                                        end: {
                                            line: branch.expression.extraLocs.alternate.end.line,
                                            column: branch.expression.extraLocs.alternate.end.column + 1,
                                        }
                                    } : null;
                                    const controlOpenBracketRange = controlOpenBracketLoc ?
                                        firecoPad
                                            .liveExpressionWidgetProvider
                                            .locToMonacoRange(controlOpenBracketLoc) : null;
                                    controlOpenBracketRange && liveRanges.push(controlOpenBracketRange);

                                    const controlCloseBracketLoc = {
                                        start: {
                                            line: branch.expression.loc.end.line,
                                            column: branch.expression.loc.end.column,
                                        },
                                        end: {
                                            line: branch.expression.loc.end.line,
                                            column: branch.expression.loc.end.column + 1,
                                        }
                                    };
                                    const controlCloseBracketRange =
                                        firecoPad
                                            .liveExpressionWidgetProvider
                                            .locToMonacoRange(controlCloseBracketLoc);
                                    liveRanges.push(controlCloseBracketRange);


                                } else {
                                    if (branch.type !== 'DoWhileStatement') {
                                        const content = branch.type === 'IfStatement' ? 'consequent' : 'body';
                                        const controlRParOpenBracketLoc = {
                                            start: {
                                                line: branch.expression.extraLocs.test.end.line,
                                                column: branch.expression.extraLocs.test.end.column + 1,
                                            },
                                            end: {
                                                line: branch.expression.extraLocs[content].start.line,
                                                column: branch.expression.extraLocs[content].start.column,
                                            }
                                        };
                                        const controlRParOpenBracketRange =
                                            firecoPad
                                                .liveExpressionWidgetProvider
                                                .locToMonacoRange(controlRParOpenBracketLoc);
                                        liveRanges.push(controlRParOpenBracketRange);

                                    }
                                }


                                // branch.expression.
// console.log('loce', branch.expression.extraLocs[branch.blockName]);
                                const locO = branch.expression.extraLocs[branch.blockName] ? {
                                    start: {
                                        line: branch.expression.extraLocs[branch.blockName].start.line,
                                        column: branch.expression.extraLocs[branch.blockName].start.column,
                                    },
                                    end: {
                                        line: branch.expression.extraLocs[branch.blockName].start.line,
                                        column: branch.expression.extraLocs[branch.blockName].start.column + 1,
                                    }
                                } : null;
                                const rangeO = locO ?
                                    firecoPad.liveExpressionWidgetProvider.locToMonacoRange(locO) : null;
                                rangeO && liveRanges.push(rangeO);
                                const locC = branch.expression.extraLocs[branch.blockName] ? {
                                    start: {
                                        line: branch.expression.extraLocs[branch.blockName].end.line,
                                        column: branch.expression.extraLocs[branch.blockName].end.column ?
                                            branch.expression.extraLocs[branch.blockName].end.column - 1
                                            : branch.expression.extraLocs[branch.blockName].end.column,
                                    },
                                    end: {
                                        line: branch.expression.extraLocs[branch.blockName].end.line,
                                        column: branch.expression.extraLocs[branch.blockName].end.column,
                                    }
                                } : null;
                                const rangeC = locC ?
                                    firecoPad.liveExpressionWidgetProvider.locToMonacoRange(locC) : null;
                                rangeC && liveRanges.push(rangeC);
                                // console.log(branch.expression.extraLocs,
                                // branch.blockName, branch.expression.extraLocs[branch.blockName]);
                                //     this
                                // .highlightBranch(NavigationTypes.Local,
                                // branch.expression.extraLocs[branch.blockName])
                                //   : this.highlightBranch(NavigationTypes.Local);
                            }
                        }
                    }
                    if (n.expression.isVariableDeclarator && n.expression.extraLocs) {
                        const range = n.expression.extraLocs['kind'] ?
                            firecoPad.liveExpressionWidgetProvider.locToMonacoRange(n.expression.extraLocs['kind'])
                            : null;
                        range && liveRanges.push(range);

                        const endRange = n.expression.extraLocs['end'] ?
                            firecoPad.liveExpressionWidgetProvider.locToMonacoRange(n.expression.extraLocs['end'])
                            : null;
                        endRange && liveRanges.push(endRange);
                    }
                    if (n.expression.isReturn && n.expression.extraLocs) {
                        const returnLoc = {
                            start: {
                                line: n.expression.extraLocs.return.start.line,
                                column: n.expression.extraLocs.return.start.column
                            }
                            , end: {
                                line: n.expression.loc.start.line,
                                column: n.expression.loc.start.column,
                            }
                        };
                        const range = firecoPad.liveExpressionWidgetProvider.locToMonacoRange(returnLoc);
                        range && liveRanges.push(range);

                        const returnEndLoc = {
                            start: {
                                line: n.expression.loc.end.line,
                                column: n.expression.loc.end.column,
                            }
                            , end: {
                                line: n.expression.extraLocs.return.end.line,
                                column: n.expression.extraLocs.return.end.column
                            }
                        };
                        const rangeEnd = firecoPad.liveExpressionWidgetProvider.locToMonacoRange(returnEndLoc);
                        rangeEnd && liveRanges.push(rangeEnd);

                    }


                    //   widget.contentWidget.adjustWidth(true);
                    //n.isError && this.highlightErrors([range], ignoreRanges);
                    const contentRef = React.createRef();
                    liveWidgets.push({
                        contentRef,
                        n,
                        domNode: widget.contentWidget.domNode,
                        range,
                        configureLiveWidget: () =>
                            <Portal key={widget.id}
                                    container={widget.contentWidget.domNode}>
                                <div
                                    ref={contentRef}
                                    onMouseEnter={() => {
                                        // console.log(entry);
                                        this.highlightSingleText(
                                            n.loc, n.isError ? HighlightTypes.error
                                                : n.isGraphical ?
                                                    HighlightTypes.graphical : HighlightTypes.text,
                                            this.traceSubscriber
                                                .getMatches(n.funcRefId, n.dataRefId, n.calleeId), false);
                                        this.handleCurrentContentWidgetId(widget.id);
                                    }}
                                    onMouseLeave={() => {
                                        this.highlightSingleText();
                                        this.handleCurrentContentWidgetId();
                                    }}
                                    // className={n.expressionType === 'CallExpression' ?
                                    // classes.liveExpressionCallExpressionContainerUpdated
                                    // : liveExpressionContainerClassName}
                                    className={liveExpressionContainerClassName}
                                >
                                    <OverflowComponent
                                        overflowXClassName={classes.liveExpressionRoot}
                                        contentClassName={classes.liveExpressionContent}
                                        disableOverflowDetectionY={true}
                                        contentAlign={isAlignLeft ?
                                            'left' : 'center'
                                        }
                                        overflowXAdornment={<MoreHorizIcon className={classes.overflowXIcon}/>}
                                        //  placeholder={<Typography>Yo</Typography>}
                                        //  placeholderClassName={classes.expressionCellContent}
                                        // placeholderDisableGutters={true}
                                    >
                                        {/*<div>{n.expressionType}</div>*/}
                                        {isOutput ?
                                            <GraphicalQuery
                                                outputRefs={n.outputRefs}
                                                visualIds={getVisualIdsFromRefs(n.outputRefs)}
                                                selected={!!isSelected}
                                            />
                                            :
                                            <ObjectRootLabel
                                                data={datum}
                                                compact={true}
                                                expressionType={n.expressionType}
                                                iconify={isIcon}
                                            />
                                        }
                                    </OverflowComponent>
                                </div>
                            </Portal>
                    });
                }

            }
        }
        this.highlightLiveExpressions(liveRanges, ignoreRanges);
        const liveExpresionDataInLines = {};
        const finalLiveWidgets = liveWidgets.reduce((result, data) => {
            const {range, configureLiveWidget} = data;
            const ignore = ignoreRanges.find(r => {
                return r.containsRange(range);
            });

            liveExpresionDataInLines[range.startLineNumber] = liveExpresionDataInLines[range.startLineNumber] || [];
            liveExpresionDataInLines[range.startLineNumber].push(data);

            if (!ignore) {
                result.push(() => configureLiveWidget());
            }
            return result;
        }, []);
        this.onAdjustWidths = () => {
            Object.keys(liveExpresionDataInLines)
                .forEach(lineNumber => this.adjustWidth(liveExpresionDataInLines[lineNumber]));
        };
        this.onAdjustWidths();

        return (<React.Fragment>
            {liveExpressions}
            {finalLiveWidgets.map(cb => cb())}
            {globalNavigators}
            {localNavigators}
            {visualIds}
        </React.Fragment>);
    }

    updateLiveExpressionWidgetWidths = () => {
        clearTimeout(this.onAdjustWidthsTimeout);
        this.onAdjustWidths && (this.onAdjustWidthsTimeout = setTimeout(this.onAdjustWidths, 10));
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
    handleBundleDebounced = debounce(
        (currentEditorsTexts) => this.handleBundle(currentEditorsTexts),
        200,
        {leading: false, trailing: true});

    handleBundlingSubscription = () => {
        const {autorunDelay = 0} = this.props;
        this.bundlingSubject = this.bundlingSubject || new Subject();

        this.bundlingSubscription && this.bundlingSubscription.unsubscribe();

        this.bundlingSubscription =
            this.bundlingSubject.pipe(debounceTime(autorunDelay)).subscribe(this.handleBundle);
    };

    goToTimelineBranch = (entry) => {

        const timelineI = this.timeline ? this.timeline.length - this.timeline.indexOf(entry) : -1;
        if (timelineI > 0 && this.timelineBranchManager) {
            const branch = this.timelineBranchManager.getBranchByTimelineI(timelineI);
            console.log('tri', NavigationTypes.Global, entry.id, timelineI, branch);

            if (branch) {
                const prevTimelineI = branch.branches && branch.branches.length > 1 ?
                    branch.branches.find((ti, i) => (ti > timelineI && timelineI < branch.branches[i - 1])) : 0;
                console.log('tri', NavigationTypes.Global, entry.id, timelineI, '*'/*navigatorIndex*/, prevTimelineI);
                this.handleBranchChange(
                    NavigationTypes.Global, entry.id, timelineI, '*'/*navigatorIndex*/, prevTimelineI
                );
            }

        }
    };


    componentDidMount() {
        const {updateLiveExpressionWidgetWidths} = this.props
        updateLiveExpressionWidgetWidths && updateLiveExpressionWidgetWidths(this.updateLiveExpressionWidgetWidths);


        this.handleBundlingSubscription();
        this.handleBundlingSubscriptionDebounced =
            this.handleChangeDebounced(this.handleBundlingSubscription, 1500);

        goToTimelineBranch = this.goToTimelineBranch;
    }

    componentDidUpdate(prevProps/*, prevState, snapshot*/) {
        this.didUpdate = true;
        if (prevProps.autorunDelay !== this.props.autorunDelay) {
            this.handleBundlingSubscriptionDebounced();
        }
        const {firecoPad, editorsTexts, updateBundle} = this.props;
        if (firecoPad && firecoPad !== prevProps.firecoPad) {
            this.configureLiveExpressionWidgetsLayoutChange(firecoPad);
            this.updateLiveExpressionsTimeout = this.updateLiveExpressionsTimeout ||
                setTimeout(() =>
                    this.updateLiveExpressions(firecoPad.liveExpressionWidgetProvider), 0);
        }

        if (this.shouldBundle(editorsTexts)) {
            this.currentEditorsTexts = editorsTexts;
            clearInterval(this.refreshInterval);
            this.timeline = [];
            //  this.unHighlightLiveExpressions();
            updateBundle();
            this.bundlingSubject.next(this.currentEditorsTexts);
        }

    }

    componentWillUnmount() {
        this.bundlingSubject && this.bundlingSubject.complete();
        const {updateLiveExpressionWidgetWidths} = this.props
        updateLiveExpressionWidgetWidths && updateLiveExpressionWidgetWidths(null);

        goToTimelineBranch = goToTimelineBranchInactive;
    }

    updateBundle = async (currentEditorsTexts) => {
        const {updateBundleFailure, updateBundleSuccess, firecoPad} = this.props;
        const {/*, decorators*/ getLocationId} = this.state;

        let retries = 20;
        let tm = null;
        if (!firecoPad || !firecoPad.astResult || !getLocationId) {
            this.handleBundleDebounced(currentEditorsTexts);
            return;
        }
        if (!firecoPad.astResult.ast) {
            updateBundleFailure({js: firecoPad.astResult.astError});
            return;
        }
        const onAstReady = (astResult) => {
            clearTimeout(tm);
            if (!astResult.ast) {
                updateBundleFailure({js: astResult.astError});
                return;
            }

            if (!this.autoLog) {
                this.autoLog = new AutoLog(firecoPad.j);
            }

            const baseAlJs = astResult.ast.toSource();
            this.autoLog.transformWithLocationIds(astResult.ast, getLocationId)
                .then(autoLogger => {
                    const bundle = {
                        editorsTexts: currentEditorsTexts,
                        alJs: autoLogger.getCode(),
                        autoLog: this.autoLog,
                        autoLogger: autoLogger,
                    };
                    const dispatchBundle = () => {
                        if (this.traceSubscriber) {
                            this.traceSubscriber.unsubscribe();
                        }
                        // console.log('alJs', bundle.alJs);

                        this.objectNodeRenderer = createLiveObjectNodeRenderer(autoLogger);
                        this.timeline = [];
                        this.isNew = true;
                        this.depLocs = bundle.autoLogger.deps.dependencies;
                        //   this.unHighlightLiveExpressions();
                        this.refreshInterval = setInterval(this.refreshTimeline, this.refreshRate);
                        this.traceSubscriber = autoLogger.trace;
                        this.traceSubscriber.subscribe(this.handleTraceChange);

                        updateBundleSuccess(bundle);
                    };
                    // JsCodeShift silently does nothing while loading its dependencies. Bundling needs retrying
                    // until it is JsCodeShift is ready
                    // console.log(baseAlJs === bundle.alJs);
                    if ((bundle.editorsTexts.js && !bundle.alJs) || baseAlJs === bundle.alJs) {
                        if (retries--) {
                            tm = setTimeout(() => {
                                firecoPad
                                    .getAst()
                                    .then(onAstReady)
                                    .catch(error => console.log('Invalidated AST', error));
                            }, 100);

                        }

                    } else {
                        // clearTimeout()
                        dispatchBundle();
                    }

                })
        };
        firecoPad.getAst().then(onAstReady).catch(error => console.log('Invalidated AST', error));

    };

    handleTraceChange = ({timeline, logs, mainLoadedTimelineI}) => {
        this.timeline = timeline;
        this.logs = logs;
        this.mainLoadedTimelineI = mainLoadedTimelineI;
        this.refreshTimeline();
    };

    highlightLiveExpressions = (liveRanges, ignoreRanges, isReveal = false) => {
        const {firecoPad} = this.props;
        liveRanges = liveRanges.filter(ran => {
            return !ignoreRanges.find(r => {
                return r.containsRange(ran);
            });
        });

        if (this.mainLoadedTimelineI && this.depLocs) {
            Object.keys(this.depLocs).forEach(key => {
                const loc = this.depLocs[key];
                const range = loc ? firecoPad.liveExpressionWidgetProvider.locToMonacoRange(loc[0]) : null;
                range && liveRanges.push(range);
            });

        }
        const res = this.highlightTexts(
            liveRanges,
            {
                inlineClassName: liveExpressionClassName
            },
            this.prevDecorationIds,
            isReveal,
            true
        );
        this.prevDecorationIds = res ? res.decorationIds : [];
        const res2 = this.highlightTexts(
            ignoreRanges,
            {
                inlineClassName: deadExpressionClassName,
            },
            this.prevIgnoreDecorationIds,
            isReveal,
            true
        );
        this.prevIgnoreDecorationIds = res2 ? res2.decorationIds : [];
    };

    unHighlightLiveExpressions = () => {
        const {firecoPad} = this.props;
        if (this.prevDecorationIds && this.prevDecorationIds.length) {
            this.prevDecorationIds = firecoPad.monacoEditor.deltaDecorations(this.prevDecorationIds, []);
        }
        if (this.prevIgnoreDecorationIds && this.prevIgnoreDecorationIds.length) {
            this.prevIgnoreDecorationIds = firecoPad.monacoEditor.deltaDecorations(this.prevIgnoreDecorationIds, []);
        }
    };

    highlightErrors = (liveRanges, ignoreRanges, isReveal = false, isLoc = false) => {
        if (!liveRanges) {
            this.unHighlightErrors();
            return;
        }
        //  console.log('ignoreRanges', ignoreRanges);
        liveRanges = liveRanges.filter(ran => {
            return !ignoreRanges.find(r => {
                return r.containsRange(ran);
            });
        });
        // this.unHighlightLiveExpressions();
        const res = this.highlightTexts(
            liveRanges,
            {
                inlineClassName: errorExpressionClassName,
                linesDecorationsClassName: `${errorExpressionClassName}-lineDecoration`,
            },
            this.prevErrorDecorationIds,
            isReveal,
            !isLoc
        );
        this.prevErrorDecorationIds = res ? res.decorationIds : [];

    };

    unHighlightErrors = () => {
        if (this.prevErrorDecorationIds && this.prevErrorDecorationIds.length) {
            const {firecoPad} = this.props;
            this.prevErrorDecorationIds = firecoPad.monacoEditor.deltaDecorations(this.prevErrorDecorationIds, []);
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
        const {firecoPad} = this.props;
        if (this.prevBranch[navigationType] && this.prevBranch[navigationType].single.decorationIds.length) {
            this.prevBranch[navigationType].single.decorationIds =
                firecoPad.monacoEditor.deltaDecorations(this.prevBranch[navigationType].single.decorationIds, []);
            firecoPad.monacoEditor.restoreViewState(this.prevBranch[navigationType].single.viewState);
        }
        if (this.prevBranch[navigationType] &&
            this.prevBranch[navigationType].matches && this.prevBranch[navigationType].matches.decorationIds.length) {
            this.prevBranch[navigationType].matches.decorationIds =
                firecoPad.monacoEditor.deltaDecorations(this.prevBranch[navigationType].matches.decorationIds, []);
        }
    };

    highlightBranches = (navigationType, branches, matches, isReveal) => {
        const {firecoPad} = this.props;
        if (!firecoPad) {
            return;
        }
        const createMonacoRange = firecoPad.liveExpressionWidgetProvider.createMonacoRange;
        this.prevBranches = this.prevBranches || {};
        if (!branches) {
            this.unHighlightBranches(navigationType);
            return;
        }
        const type = NavigationTypes.Global === navigationType ?
            HighlightTypes.globalBranch : HighlightTypes.localBranch;

        this.prevBranches[navigationType] = {
            single: this.highlightTexts(
                branches,
                {
                    isWholeLine: true,
                    className: type,
                    linesDecorationsClassName: `${type}-default-decoration`,
                }, this.prevBranches[navigationType] ?
                    this.prevBranches[navigationType].single.decorationIds : [], isReveal, true)
            ,
            matches: null
        };
        // console.log('ffff', branches);
        const headers = branches.reduce((headers, branch) => {
            headers.push(createMonacoRange(branch.startLineNumber, 0, branch.startLineNumber, 0));
            headers.push(createMonacoRange(branch.endLineNumber, 0, branch.endLineNumber, 0));
            return headers;
        }, []);

        this.prevBranches[`${navigationType}-delimiter`] = {
            single: this.highlightTexts(
                headers,
                {
                    isWholeLine: true,
                    className: type,
                    linesDecorationsClassName: `${type}-delimiter-decoration`,
                }, this.prevBranches[navigationType] ?
                    this.prevBranches[navigationType].single.decorationIds : [], isReveal, true)
            ,
            matches: null
        }
    };

    unHighlightBranches = (navigationType) => {
        const {firecoPad} = this.props;
        if (this.prevBranches
            && this.prevBranches[navigationType] && this.prevBranches[navigationType].single.decorationIds.length) {
            this.prevBranches[navigationType].single.decorationIds =
                firecoPad.monacoEditor.deltaDecorations(this.prevBranches[navigationType].single.decorationIds, []);
            firecoPad.monacoEditor.restoreViewState(this.prevBranches[navigationType].single.viewState);
            this.prevBranches[`${navigationType}-delimiter`].single.decorationIds =
                firecoPad
                    .monacoEditor
                    .deltaDecorations(this.prevBranches[`${navigationType}-delimiter`].single.decorationIds, []);
            firecoPad.monacoEditor.restoreViewState(this.prevBranches[`${navigationType}-delimiter`].single.viewState);
        }
        // if (this.prevBranches[navigationType] &&
        //     this.prevBranches[navigationType].matches
        // && this.prevBranches[navigationType].matches.decorationIds.length) {
        //     const {firecoPad} = this.props;
        //     this.prevBranches[navigationType].matches.decorationIds =
        //         firecoPad.monacoEditor.deltaDecorations(this.prevBranches[navigationType].matches.decorationIds, []);
        // }
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
                },
                this.prevSingleTextState ?
                    this.prevSingleTextState.single.decorationIds : [], isReveal)
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
        const {firecoPad} = this.props;
        if (this.prevSingleTextState && this.prevSingleTextState.single.decorationIds.length) {
            this.prevSingleTextState.single.decorationIds =
                firecoPad.monacoEditor.deltaDecorations(this.prevSingleTextState.single.decorationIds, []);
            firecoPad.monacoEditor.restoreViewState(this.prevSingleTextState.single.viewState);
        }
        if (this.prevSingleTextState && this.prevSingleTextState.matches
            && this.prevSingleTextState.matches.decorationIds.length) {
            this.prevSingleTextState.matches.decorationIds =
                firecoPad.monacoEditor.deltaDecorations(this.prevSingleTextState.matches.decorationIds, []);
        }
    };

    setCursorToLocation = (loc) => {
        const {firecoPad} = this.props;
        const range = loc ? firecoPad.liveExpressionWidgetProvider.locToMonacoRange(loc) : null;
        if (range) {
            firecoPad.monacoEditor.setPosition(range.getStartPosition());
            this.prevSingleTextState &&
            (this.prevSingleTextState.single.viewState = firecoPad.monacoEditor.saveViewState());
        }
    };

    highlightTexts = (locs, options, prevDecorationIds, isReveal = false, areRanges = false) => {
        const {firecoPad} = this.props;

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
        const {firecoPad} = this.props;

        if (!firecoPad || !loc) {
            return;
        }

        return firecoPad
            .monacoEditor
            .getModel()
            .getValueInRange(firecoPad.liveExpressionWidgetProvider.locToMonacoRange(loc));
    };

    colorizeDomElement = (ref) => {
        const {firecoPad} = this.props;
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
                    this.highlightErrors,
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
        liveExpressionWidgetProvider && liveExpressionWidgetProvider.afterWidgetize(this.afterWidgetize);
    }

}

LiveExpressionStore.propTypes = {
    classes: PropTypes.object.isRequired,
    editorId: PropTypes.string.isRequired,
    liveExpressionStoreChange: PropTypes.func,
    updateBundle: PropTypes.func.isRequired,
};

const LiveExpressionStoreWithContext = props => (
    <PastebinContext.Consumer>
        {context => {
            return <LiveExpressionStore {...props} {...context}/>
        }}
    </PastebinContext.Consumer>
);
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(LiveExpressionStoreWithContext));
