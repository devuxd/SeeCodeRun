import React, {Component} from 'react';
import PropTypes from "prop-types";
import debounce from 'lodash.debounce';
import throttle from 'lodash/throttle';
import isString from 'lodash/isString';
import isEqual from 'lodash/isEqual';
import {Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import JSAN from 'jsan';

import {withStyles} from '@material-ui/core/styles';

import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import Portal from '@material-ui/core/Portal';
import Button from '@material-ui/core/Button';

import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import {lighten, fade} from '@material-ui/core/styles/colorManipulator';
import {ObjectRootLabel/*, ObjectLabel*/, createLiveObjectNodeRenderer} from '../components/ObjectExplorer';

import LiveExpression from '../components/LiveExpression';
import AutoLog from "../seecoderun/modules/AutoLog";
import {updateBundle, updateBundleFailure, updateBundleSuccess} from "../redux/modules/liveExpressionStore";

import DOMPortal from "../components/DOMPortal";

import {PastebinContext, VisualQueryManager} from './Pastebin';
import OverflowComponent from "../components/OverflowComponent";
import {NavigationTypes} from '../seecoderun/modules/AutoLogShift';
import {monacoProps} from "../utils/monacoUtils";
import {getVisualIdsFromRefs} from './GraphicalMapper';
import GraphicalQuery from '../components/GraphicalQuery';
import TimelineBranchManager from "../seecoderun/modules/TimelineBranchManager";

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
                // opacity: '1 !important',
                // filter: 'unset !important',
                // fontWeight: 'normal !important',
                opacity: '1',
                filter: 'unset',
                fontWeight: 'normal',
                border: 'none'

                // transition: ['opacity', 'filter', 'fontWeight'],
                //   transitionDuration: 2000,
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
            marginLeft: -2,
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
            return {updatingLiveExpressions: false};
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
                    handleFocusedLiveExpression && handleFocusedLiveExpression(currentContentWidgetId, currentContentWidgetRange);
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
        //  console.log('na', navigationType, currentBranchId, currentBranchTimelineId, navigatorIndex, prevTimelineI);
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

    configureNavigators = (
        navigationType, branches, branched, absoluteBranched, currentBranched,
        color, classes, style, liveExpressionContainerClassName, liveRanges, ignoreRanges) => {
        const {
            decorators, branchSelections, currentContentWidgetId,
        } = this.state;
        const {
            /*currentBranchId,*/ currentBranchTimelineId, navigatorIndex,
            /*prevTimelineI,*/
        } = (branchSelections[navigationType] || {});
        const navigators = [];
        const {firecoPad} = this.state;
      //  console.log('start cont ------------------------',);
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
                    const branchSelection = currentBranched && currentBranched[id] ?
                        currentBranched[id].length
                        : branchIndex >= 0 ? branchIndex : branched[id].length;

                    const branchLabel = `${branchSelection}/${
                        absoluteBranched && absoluteBranched[id] ? absoluteBranched[id].length : branched[id].length
                        }`;
                    const sliderRange = isSelected ? [navigatorIndex] : null;
                    const branchNavigatorWidgetClassName = classes.branchNavigatorWidget;
                    const n = currentBranchTimelineId ?
                        this.timeline[this.timeline.length - currentBranchTimelineId] || {} : {};
                    const branch = (branches || []).find(b => b.id === id);
                    if (color === 'secondary') {
                        // console.log('lo', branch, decorator, this.timeline[this.timeline.length - currentBranchTimelineId], branched[id]);
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
                                const range = branch.expression.extraLocs[ignoreName] ? firecoPad.liveExpressionWidgetProvider.locToMonacoRange(branch.expression.extraLocs[ignoreName]) : null;
                                //  console.log('control:', branch.blockName,'ommitting', ignoreName, branch.expression.extraLocs, range,);
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
                            // console.log(branch.expression.extraLocs,branch.blockName, branch.expression.extraLocs[branch.blockName]);
                            //     this.highlightBranch(NavigationTypes.Local, branch.expression.extraLocs[branch.blockName])
                            //   : this.highlightBranch(NavigationTypes.Local);
                        }
                    } else {
                        navigators.push(
                            <React.Fragment key={`${id}:${navigationType}`}>
                                <DOMPortal
                                    parentEl={decorator.contentWidget.domNode}>
                                    <div onMouseEnter={() => {
                                        //  console.log(n);
                                        this.highlightSingleText(
                                            n.loc, n.isError ? HighlightTypes.error
                                                : n.isGraphical ?
                                                    HighlightTypes.graphical : HighlightTypes.text,
                                            this.traceSubscriber.getMatches(n.funcRefId, n.dataRefId, n.calleeId), false);
                                        this.handleCurrentContentWidgetId(id, n.range);
                                    }}
                                         onMouseLeave={() => {
                                             this.highlightSingleText();
                                             this.handleCurrentContentWidgetId();
                                         }}
                                         className={liveExpressionContainerClassName}
                                    >
                                        <Paper className={classes.liveExpressionPaper}>
                                            {/*<OverflowComponent*/}
                                            {/*contentClassName={classes.liveExpressionContent}*/}
                                            {/*disableOverflowDetectionY={true}*/}
                                            {/*//  placeholder={<Typography>Yo</Typography>}*/}
                                            {/*//  placeholderClassName={classes.expressionCellContent}*/}
                                            {/*// placeholderDisableGutters={true}*/}
                                            {/*>*/}
                                            <Button variant="raised" color={color}
                                                    className={branchNavigatorWidgetClassName}>
                                                {branchLabel}</Button>
                                            {/*<ObjectRootLabel data={branched[id]}/>*/}
                                            {/*</OverflowComponent>*/}
                                        </Paper>

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
                                    branchNavigatorChange={(timelineI, navigatorIndex, prevTimelineI) =>
                                        this.handleBranchChange(
                                            navigationType, id, timelineI, navigatorIndex, prevTimelineI
                                        )}
                                    //handleChange={this.handleObjectExplorerExpand}
                                />
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

    render() {
        const {classes, editorWidth, editorHeight, timeline, searchState} = this.props;
        const {
            decorators, currentContentWidgetId, updatingLiveExpressions, branchSelections,
            firecoPad,
        } = this.state;

        const liveExpressionContainerClassName = updatingLiveExpressions ?
            classes.liveExpressionContainerUpdating : classes.liveExpressionContainerUpdated;

        const {
            currentBranchId, currentBranchTimelineId,
            /*navigatorIndex,*/ prevTimelineI,
        } = (branchSelections[NavigationTypes.Global] || {});

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
                tbm.branches, tbm.localBranches, null, null, 'secondary', classes, style, liveExpressionContainerClassName, liveRanges, ignoreRanges);

        const currentTimeline = (currentBranchId && currentBranchTimelineId) ?
            timeline.slice(timeline.length - currentBranchTimelineId) : timeline;
        // console.log(currentBranchId, currentBranchTimelineId, currentTimeline, timeline.length);

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
                widget.range && liveRanges.push(widget.range);
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


                this.liveExpressionWidgets[widget.id] = {datum, widget, entry};
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
                const ignore = ignoreRanges.find(r => {
                    const range = n.loc ? firecoPad.liveExpressionWidgetProvider.locToMonacoRange(n.loc) : null;
                    return r.containsRange(range);
                });

                //   console.log('n', n);
                if (widget.contentWidget && !ignore) {

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
                        const range = firecoPad.liveExpressionWidgetProvider.locToMonacoRange(testableLoc);

                        range && liveRanges.push(range);
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
                                    const range = branch.expression.extraLocs[ignoreName] ? firecoPad.liveExpressionWidgetProvider.locToMonacoRange(branch.expression.extraLocs[ignoreName]) : null;
                                    //  console.log('control:', branch.blockName,'ommitting', ignoreName, branch.expression.extraLocs, range,);
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
                                const rangeO = locO ? firecoPad.liveExpressionWidgetProvider.locToMonacoRange(locO) : null;
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
                                const rangeC = locC ? firecoPad.liveExpressionWidgetProvider.locToMonacoRange(locC) : null;
                                rangeC && liveRanges.push(rangeC);
                                // console.log(branch.expression.extraLocs,branch.blockName, branch.expression.extraLocs[branch.blockName]);
                                //     this.highlightBranch(NavigationTypes.Local, branch.expression.extraLocs[branch.blockName])
                                //   : this.highlightBranch(NavigationTypes.Local);
                            }
                        }
                    }
                    // n.expression && console.log('nnnnnnnnnnnnn', n);
                    if (n.expression && n.expression.isVariableDeclarator && n.expression.extraLocs) {
                        const range = n.expression.extraLocs['kind'] ? firecoPad.liveExpressionWidgetProvider.locToMonacoRange(n.expression.extraLocs['kind']) : null;
                        //           console.log('dfff', n.expression, n.expression.extraLocs['kind'], range);
                        range && liveRanges.push(range);

                    }
                    if (n.expression && n.expression.isReturn && n.expression.extraLocs) {
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
                        //           console.log('dfff', n.expression, n.expression.extraLocs['kind'], range);
                        range && liveRanges.push(range);

                    }


                    widget.contentWidget.adjustWidth(true);
                    liveWidgets.push(
                        <DOMPortal key={widget.id}
                                   parentEl={widget.contentWidget.domNode}>
                            <div
                                onMouseEnter={() => {
                                    // console.log(entry);
                                    this.highlightSingleText(
                                        n.loc, n.isError ? HighlightTypes.error
                                            : n.isGraphical ?
                                                HighlightTypes.graphical : HighlightTypes.text,
                                        this.traceSubscriber.getMatches(n.funcRefId, n.dataRefId, n.calleeId), false);
                                    this.handleCurrentContentWidgetId(widget.id);
                                }}
                                onMouseLeave={() => {
                                    this.highlightSingleText();
                                    this.handleCurrentContentWidgetId();
                                }}
                                // className={n.expressionType === 'CallExpression' ? classes.liveExpressionCallExpressionContainerUpdated : liveExpressionContainerClassName}
                                className={liveExpressionContainerClassName}
                            >
                                <OverflowComponent
                                    overflowXClassName={classes.liveExpressionRoot}
                                    contentClassName={classes.liveExpressionContent}
                                    disableOverflowDetectionY={true}
                                    contentAlign={n.expression.isReturn || n.expression.isCallExpression ? 'left' : 'center'}
                                    overflowXAdornment={<MoreHorizIcon className={classes.overflowXIcon}/>}
                                    //  placeholder={<Typography>Yo</Typography>}
                                    //  placeholderClassName={classes.expressionCellContent}
                                    // placeholderDisableGutters={true}
                                >{isOutput ?
                                    <GraphicalQuery
                                        outputRefs={n.outputRefs}
                                        visualIds={getVisualIdsFromRefs(n.outputRefs)}
                                        selected={!!isSelected}
                                    />
                                    : <ObjectRootLabel data={datum} compact={true} expressionType={n.expressionType}/>
                                }
                                </OverflowComponent>
                            </div>
                        </DOMPortal>);
                }

            }
        }
        this.highlightLiveExpressions(liveRanges, ignoreRanges);
        return (<React.Fragment>
            {liveExpressions}
            {liveWidgets}
            {globalNavigators}
            {localNavigators}
            {visualIds}
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
    handleBundleDebounced = debounce((currentEditorsTexts) => this.handleBundle(currentEditorsTexts), 100);

    handleBundlingSubscription = () => {
        if (!this.bundlingSubject) {
            return;
        }

        if (this.bundlingSubscription) {
            this.bundlingSubscription.unsubscribe();
        }

        this.bundlingSubscription =
            this.bundlingSubject.pipe(debounceTime(this.props.autorunDelay)).subscribe(this.handleBundle);
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
                //  this.unHighlightLiveExpressions();
                store.dispatch(updateBundle(Date.now()));
                this.bundlingSubject.next(this.currentEditorsTexts);
            }
        });

        goToTimelineBranch = this.goToTimelineBranch;
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
        goToTimelineBranch = goToTimelineBranchInactive;
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
        let retries = 10;
        const onAstReady = (astResult) => {
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

                        this.objectNodeRenderer = createLiveObjectNodeRenderer(autoLogger);
                        this.timeline = [];
                        this.isNew = true;
                        //   this.unHighlightLiveExpressions();
                        this.refreshInterval = setInterval(this.refreshTimeline, this.refreshRate);
                        this.traceSubscriber = autoLogger.trace;
                        this.traceSubscriber.subscribe(this.handleTraceChange);

                        store.dispatch(updateBundleSuccess(bundle));
                    };
                    // JsCodeShift silently does nothing while loading its dependencies. Bundling needs retrying
                    // until it is JsCodeShift is ready
                    if (baseAlJs === bundle.alJs) {
                        if (retries--) {
                            setTimeout(() => {
                                onAstReady(astResult);
                            }, 100);

                        }

                    } else {
                        dispatchBundle();
                    }

                })
        };
        firecoPad.getAst().then(onAstReady).catch(error => console.log('Invalidated AST', error));

    };

    handleTraceChange = ({timeline, logs}) => {
        this.timeline = timeline;
        this.logs = logs;
        this.refreshTimeline();
    };

    highlightLiveExpressions = (liveRanges, ignoreRanges, isReveal = false) => {
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
        if (this.prevDecorationIds && this.prevDecorationIds.length) {
            const {firecoPad} = this.state;
            this.prevDecorationIds = firecoPad.monacoEditor.deltaDecorations(this.prevDecorationIds, []);
        }
        if (this.prevIgnoreDecorationIds && this.prevIgnoreDecorationIds.length) {
            const {firecoPad} = this.state;
            this.prevIgnoreDecorationIds = firecoPad.monacoEditor.deltaDecorations(this.prevIgnoreDecorationIds, []);
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

    highlightBranches = (navigationType, branches, matches, isReveal) => {
        const {firecoPad} = this.state;
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

        if (this.prevBranches && this.prevBranches[navigationType] && this.prevBranches[navigationType].single.decorationIds.length) {
            const {firecoPad} = this.state;
            this.prevBranches[navigationType].single.decorationIds =
                firecoPad.monacoEditor.deltaDecorations(this.prevBranches[navigationType].single.decorationIds, []);
            firecoPad.monacoEditor.restoreViewState(this.prevBranches[navigationType].single.viewState);
            this.prevBranches[`${navigationType}-delimiter`].single.decorationIds =
                firecoPad.monacoEditor.deltaDecorations(this.prevBranches[`${navigationType}-delimiter`].single.decorationIds, []);
            firecoPad.monacoEditor.restoreViewState(this.prevBranches[`${navigationType}-delimiter`].single.viewState);
        }
        // if (this.prevBranches[navigationType] &&
        //     this.prevBranches[navigationType].matches && this.prevBranches[navigationType].matches.decorationIds.length) {
        //     const {firecoPad} = this.state;
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
