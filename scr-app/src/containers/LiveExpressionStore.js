import React, {
    PureComponent,
} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import isString from 'lodash/isString';
import isEqual from 'lodash/isEqual';

import {withStyles} from '@mui/styles';
import {alpha} from '@mui/material/styles';

import AutoLog from '../core/modules/AutoLog';
import {
    updateBundle,
    updateBundleFailure,
    updateBundleSuccess
} from "../redux/modules/liveExpressionStore";

import PastebinContext from '../contexts/PastebinContext';
import {NavigationTypes} from '../core/modules/AutoLogShift';
import {monacoProps} from '../utils/monacoUtils';
import {
    MonacoExpressionClassNames,
    MonacoHighlightTypes,
    ThemesRef,
} from '../themes';

const mapStateToProps = (
    {monacoEditorsReducer, pastebinReducer}
    , {editorId}
) => {
    const {monacoEditorsStates} = monacoEditorsReducer;
    const {editorsTexts} = pastebinReducer;
    const firecoPad = monacoEditorsStates?.[editorId]?.firecoPad;

    return firecoPad ? {editorsTexts, firecoPad} : {editorsTexts}; // do not replace if none found
}
const mapDispatchToProps = {
    updateBundle,
    updateBundleFailure,
    updateBundleSuccess,
};

const goToTimelineBranchInactive = (/*timelineI*/) => {
};
let goToTimelineBranch = goToTimelineBranchInactive;

export const configureGoToTimelineBranch = () => {
    return goToTimelineBranch;
};


const BRANCH_LINE_DECORATION_WIDTH = 3;


const styles = (theme) => {
    const {highlighting: HighlightPalette} = ThemesRef.current;

    return {
        '@global': {
            '.monaco-editor div.margin': {
                zIndex: '1000 !important',
            },
            [`.${MonacoExpressionClassNames.defaultExpressionClassName}`]: {
                opacity: 0.4,
                filter: 'greyscale(85%)',
                // fontWeight: 100,
            },
            [`.${MonacoExpressionClassNames.deadExpressionClassName}`]: {
                opacity: '0.467 !important',
                filter: 'greyscale(85%) !important',
                fontWeight: '100 !important',
                // opacity: 0.4,
                // filter: 'greyscale(85%)',
                // fontWeight: 100,
                //  border: '2px solid red'
            },
            [`.${MonacoExpressionClassNames.liveExpressionClassName}`]: {
                opacity: '1',
                filter: 'unset',
                fontWeight: 'normal',
                border: 'none',
                transition: ['opacity', 'filter', 'fontWeight'],
                transitionDuration: 2000,
            },
            [`.${MonacoExpressionClassNames.liveExpressionNavClassName}`]: {
                paddingLeft: theme.spacingUnit(2),
                // zIndex: theme.zIndex.tooltip,
            },
            [`.${
                MonacoExpressionClassNames.liveExpressionDependencyClassName
            }`]: {
                opacity: '1 !important',
                filter: 'unset',
                fontWeight: 'bolder',
                border: 'none',
                transition: ['opacity', 'filter', 'fontWeight'],
                transitionDuration: 2000,
            },
            [`.${MonacoExpressionClassNames.errorExpressionClassName}`]: {
                opacity: '1',
                filter: 'unset',
                fontWeight: 'bolder',
                borderTop: '1px solid red',
                borderBottom: '2px solid red',
                backgroundColor: HighlightPalette.error,
            },
            [`.${
                MonacoExpressionClassNames.errorExpressionClassName
            }-lineDecoration`]: {
                backgroundColor: 'red',
                margin: theme.spacing(1),
                top: theme.spacing(0.5),
                height: `${theme.spacing(1)} !important`,
                width: `${theme.spacing(1)} !important`,
            },
            [`.${MonacoExpressionClassNames.branchExpressionClassName}`]: {
                opacity: 1,
                filter: 'unset !important',
                fontWeight: 700,
            },
            [`.${MonacoHighlightTypes.text}`]: {
                backgroundColor: HighlightPalette.text,
            },
            [`.${MonacoHighlightTypes.text}-match`]: {
                backgroundColor: alpha(theme.palette.primary.light, 0.15),
            },
            [`.${MonacoHighlightTypes.error}`]: {
                backgroundColor: HighlightPalette.error,
                border: '1px solid red',
            },
            [`.${MonacoHighlightTypes.graphical}`]: {
                backgroundColor: alpha(HighlightPalette.graphical, 0.35),
            },
            [`.${MonacoHighlightTypes.graphical}-match`]: {
                backgroundColor: alpha(theme.palette.secondary.light, 0.25),
            },
            [`.${MonacoHighlightTypes.globalBranch}`]: {
                //  backgroundColor: HighlightPalette.globalBranch,
                // borderTop: `1px solid${theme.palette.primary.main}`,
                // borderBottom: `1px solid${theme.palette.primary.main}`,
            },
            [`.${MonacoHighlightTypes.globalBranch}-decoration`]: {
                marginLeft: BRANCH_LINE_DECORATION_WIDTH,
                background: `linear-gradient(90deg, ${
                    theme.palette.primary.main
                } ${BRANCH_LINE_DECORATION_WIDTH}px, ${
                    HighlightPalette.globalBranch
                } ${BRANCH_LINE_DECORATION_WIDTH}px)`,
            },
            [`.${MonacoHighlightTypes.globalBranch}-default-decoration`]: {
                //  marginLeft: BRANCH_LINE_DECORATION_WIDTH,
                background: `red`,
                zIndex: 10000,
            },
            [`.${MonacoHighlightTypes.globalBranch}-delimiter-decoration`]: {
                marginLeft: BRANCH_LINE_DECORATION_WIDTH,
                background: `linear-gradient(0deg,  ${
                    'transparent'
                } ${monacoProps.lineOffSetHeight}px, ${
                    theme.palette.primary.main
                } ${monacoProps.lineOffSetHeight}px, ${
                    'transparent'
                } ${
                    monacoProps.lineOffSetHeight + BRANCH_LINE_DECORATION_WIDTH
                }px)`,
            },
            [`.${MonacoHighlightTypes.localBranch}`]: {
                //  backgroundColor: HighlightPalette.localBranch,
                // borderTop: `1px solid${theme.palette.secondary.main}`,
                // borderBottom: `1px solid${theme.palette.secondary.main}`,
            },
            [`.${MonacoHighlightTypes.localBranch}-decoration`]: {
                marginLeft: BRANCH_LINE_DECORATION_WIDTH,
                background: `linear-gradient(90deg, ${
                    theme.palette.secondary.main
                } ${BRANCH_LINE_DECORATION_WIDTH}px, ${
                    HighlightPalette.localBranch
                } ${BRANCH_LINE_DECORATION_WIDTH}px)`,
            },
            [`.${MonacoHighlightTypes.localBranch}-delimiter-decoration`]: {
                marginLeft: BRANCH_LINE_DECORATION_WIDTH,
                background: `linear-gradient(0deg,  ${
                    HighlightPalette.localBranch
                } ${monacoProps.lineOffSetHeight}px, ${
                    theme.palette.secondary.main
                } ${monacoProps.lineOffSetHeight}px, ${
                    HighlightPalette.localBranch
                } ${
                    monacoProps.lineOffSetHeight + BRANCH_LINE_DECORATION_WIDTH
                }px)`,
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
            position: 'absolute',
            zIndex: 10,
            bottom: 0,
            left: 0,
            background: 'red',
            margin: 0,
            padding: 0,
            width: 2,
            height: 2,
        },
        liveExpressionRoot: {
            // zIndex: 1000,
            position: 'relative',
            overflow: 'hidden',
            paddingRight: theme.spacing(1),
            paddingBottom: 0,
        },
        liveExpressionContainerUpdated: {
            left: '50%',
            transition: ['filter', 'opacity', 'color',],
            transitionDuration: 1000,
            backgroundColor: theme.palette.mode === 'light' ?
                '#fffffe' : '#1e1e1e',// monaco bg colors
        },
        liveExpressionCallExpressionContainerUpdated: {
            transition: ['filter', 'opacity', 'color',],
            transitionDuration: 1000,
            backgroundColor: theme.palette.mode === 'light' ?
                '#fffffe' : '#1e1e1e',// monaco bg colors
        },
        liveExpressionContainerUpdating: {
            filter: 'greyscale(90%)',
            opacity: 0.70,
            backgroundColor: 'transparent',
        },
        liveExpressionPaper: {
            backgroundColor: theme.palette.mode === 'light' ?
                '#fffffe' : '#1e1e1e',// monaco bg colors
        },
        liveExpressionContent: {
            // lineHeight: monacoProps.lineOffSetHeight,
            overflow: 'auto',
            position: 'relative',
            maxWidth: 'inherit',
            // paddingTop: theme.spacing(1),
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
            zIndex: 9999,
            // marginBottom: monacoProps.widgetMaxHeight,
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
            // marginTop: theme.spacing(-1),
            fontSize: monacoProps.lineOffSetHeight,
        },
        updated: {
            transition: ['color'],
            transitionDuration: 2000,
        },
        updating: {
            color: theme.palette.secondary.main
        },
        navigatorLabelIndex: {
            fontSize: 11,
        },
        navigatorLabelTotal: {
            fontSize: 9,
            paddingTop: 3
        },
    }
};

class LiveExpressionStore extends PureComponent {
    autoLog = new AutoLog();
    state = {
        autoLogger: null,
        decorators: [],
        hasDecoratorIdsChanged: false,
        timeline: [],
        currentContentWidgetId: null,
        // userBranches: [],
        branchSelections: {},
        showLiveExpressions: true,
        updatingLiveExpressions: false,
        getLocationId: null,
    };
    rt = 100;
    currentEditorsTexts = null;
    didUpdate = true;

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
                // this.timeline = [];
                // this.logs = [];
                // this.refreshTimeline();
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
    handleCloseContentWidgetDebounced =
        debounce(this.handleCloseContentWidget, 1000);

    handleOpenContentWidget = (currentContentWidgetId) => {
        this.setState({currentContentWidgetId});
    };
    handleOpenContentWidgetDebounced =
        debounce(this.handleOpenContentWidget, 1000);


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

    handleBranchChange = (
        navigationType,
        currentBranchId,
        currentBranchTimelineId,
        navigatorIndex,
        prevTimelineI,
    ) => {
        this.setState((prevState) => {
            let {branchSelections} = prevState;
            const globalB = (
                branchSelections[NavigationTypes.Global] || {}
            );
            const globalCurrentBranchId = globalB.currentBranchId;
            branchSelections = {
                ...branchSelections, [navigationType]: {
                    currentBranchId,
                    currentBranchTimelineId,
                    navigatorIndex,
                    prevTimelineI,
                    globalCurrentBranchId,
                }
            };

            if (globalCurrentBranchId
                && branchSelections[
                    NavigationTypes.Local
                    ]?.globalCurrentBranchId !== globalCurrentBranchId) {
                branchSelections[NavigationTypes.Local] = null;
            }
            return {branchSelections};
        });
    };

    render() {
        return null;
    }

    shouldBundle = (editorsTexts) => {
        if (!isEqual(this.currentEditorsTexts, editorsTexts)) {
            if (editorsTexts) {
                const {editorIds} = this.props;
                for (const editorId in editorIds) {
                    if (!isString(editorsTexts[editorIds[editorId]])) {
                        return false;
                    }
                }
                this.currentEditorsTexts = editorsTexts;
                return true;
            }
        }
        return false;
    };


    getGoToTimelineBranch = (
        timeline, handleBranchChange, getBranchByTimelineI
    ) => (
        entry
    ) => {
        if (!getBranchByTimelineI) {
            return;
        }

        const timelineI = entry ? entry.i : -1;

        if (entry && timelineI > -1) {
            const branchResult =
                getBranchByTimelineI(timelineI);
            const {
                branch, isGlobal, navigatorIndex, prevTimelineI
            } = branchResult;
            if (branch) {
                console.log(
                    'tri',
                    branch,
                    isGlobal,
                    timelineI,
                    navigatorIndex,
                    prevTimelineI
                );
                handleBranchChange(
                    isGlobal ? NavigationTypes.Global : NavigationTypes.Local,
                    entry.id,
                    timelineI,
                    navigatorIndex,
                    prevTimelineI
                );
            }

        }
    };


    componentDidMount() {

    }

    handleTraceChange = ({timeline, logs, mainLoadedTimelineI}) => {
        if (timeline && this.prevTimeline !== timeline) {
            // console.log("TIMELINE RESET");
            this.prevTimeline = this.timeline;
            this.isRefresh = true;
            this.prevTimelineLength = 0;
        }

        if (logs && this.prevLogs !== logs) {
            // console.log("LOG RESET");
            this.prevLogs = this.log;
            this.isRefresh = true;
            this.prevLogLength = 0;
        }

        this.timeline = timeline;
        this.logs = logs;
        this.mainLoadedTimelineI = mainLoadedTimelineI;
    };

    componentDidUpdate(prevProps/*, prevState, snapshot*/) { // move the update logic to ale
        // making call from wrong component? store cancel is coming from store instead of playground
        const {
            autorunDelay = 1000,
            firecoPad,
            editorsTexts,
            aleContext
        } = this.props;

        // const {/*, decorators*/ getLocationId} = this.state;
        if (!firecoPad) {
            return;
        }

        if (firecoPad && firecoPad !== prevProps.firecoPad) {
            this.configureLiveExpressionWidgetsLayoutChange(firecoPad);
        }

        const timeline = aleContext?.aleInstance?.scr?.timeline ?? (this.timeline ?? []);
        const logs = aleContext?.aleInstance?.scr?.logs ?? (this.logs ?? []);
        const mainLoadedTimelineI = 0;
        this.handleTraceChange({timeline, logs, mainLoadedTimelineI});

        if (!editorsTexts || prevProps.editorsTexts === editorsTexts) {
            return;
        }

        clearTimeout(this.updateBundleTimeout);
        this.updateBundleTimeout = setTimeout(
            // () => {
            //     // console.log("updateBundleTimeout", autorunDelay);
            // this.updateBundle
            //     ();//this.currentEditorsTexts
            // }
            this.updateBundle
            ,
            autorunDelay
        );
    }

    componentWillUnmount() {
        goToTimelineBranch = goToTimelineBranchInactive;
        clearInterval(this.updateBundleTimeout);
    }

    updateBundle = () => {
        const {
            editorsTexts,
            updateBundle,
            aleContext,
            firecoPad,
        } = this.props;

        const {monacoEditor} = firecoPad ?? {};

        const {activateAleInstance, setAleInstance} = aleContext;


        updateBundle(
            editorsTexts,
            this.autoLog,
            () => {

                const aleInstance = activateAleInstance(monacoEditor);

                if (aleInstance) {
                    // console.log("aleInstance", this.refreshRate);

                    //reset
                    this.handleTraceChange({
                        timeline: [], logs: [], mainLoadedTimelineI: 0
                    });
                    aleInstance.setAfterTraceChange(this.onTraceChange);
                }

                return [aleInstance, () => setAleInstance(aleInstance)];
                // const {/*, decorators*/ getLocationId} = this.state;
                // console.log("updateBundle");

            }
        );
    };

    highlightSingleText = (loc, type = MonacoHighlightTypes.text, matches, isReveal = true) => {
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
        if (!firecoPad) {
            return;
        }
        //todo
        // console.log("NANI");
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
        const {firecoPad, aleContext} = this.props;
        if (!firecoPad) {
            return;
        }
        const locToMonacoRange = aleContext.locToMonacoRange;
        const range = loc ? locToMonacoRange(loc) : null;
        if (range) {
            firecoPad.monacoEditor.setPosition(range.getStartPosition());
            this.prevSingleTextState &&
            (this.prevSingleTextState.single.viewState = firecoPad.monacoEditor.saveViewState());
        }
    };

    highlightTexts = (
        locs, options, prevDecorationIds, isReveal = false, areRanges = false
    ) => {
        const {firecoPad, aleContext} = this.props;

        if (!firecoPad || !locs) {
            return;
        }
        //todo
        // console.log("NANI highlightTexts");
        const locToMonacoRange = aleContext.locToMonacoRange;

        const decorations = locs.map(loc => ({
            range: areRanges ? loc : locToMonacoRange(loc),
            options: options
        }));
        let viewState = null;
        if (isReveal && decorations.length) {
            viewState = firecoPad.monacoEditor.saveViewState();
            this.revealText(firecoPad.monacoEditor, decorations[decorations.length - 1].range);
        }

        return {
            viewState,
            decorationIds: firecoPad.monacoEditor.deltaDecorations(prevDecorationIds || [], decorations)
        };
    };

    revealText = (monacoEditor, range, ifOutsideViewport) => {
        ifOutsideViewport ?
            monacoEditor.revealRangeInCenterIfOutsideViewport(range)
            : monacoEditor.revealRangeInCenter(range);
    };

    getEditorTextInLoc = (loc) => {
        const {firecoPad, aleContext} = this.props;

        if (!firecoPad?.monacoEditor?.getModel
            || !aleContext?.locToMonacoRange) {
            console.warn("Monaco editor's text in loc not ready.");
            return '';
        }

        if (!loc) {
            console.log("No text location provided.");
            return '';
        }

        return firecoPad.monacoEditor.getModel().getValueInRange(
            aleContext.locToMonacoRange(loc)
        );
    };


    onTraceChange = () => {
        //todo:
        // make it the timeline refresh active after bundle is ready : done
        //change refresh after each liveExpressionStoreChange, confirm is triggered by WALE push in timeline


        //  let isRefresh = this.timeline !== this.prevTimeline || this.logs !== this.prevLogs;
        //let isRefresh = this.timeline !== this.validTimeline || this.logs !== this.prevLogs;

        const {liveExpressionStoreChange} = this.props;
        // console.log("refreshTimeline", liveExpressionStoreChange, this.isRefresh, this.timeline);

        if (this.isRefresh) {
            // console.log("refreshTimeline T");
            // if (this.didUpdate) {
            this.didUpdate = false;
            this.isRefresh = false;
            this.prevTimeline = this.timeline;
            this.prevLogs = this.logs;
            // this.validTimeline =
            //     this.timeline && this.timeline.length?
            //     this.timeline:this.validTimeline||[];
            // console.log("refreshTimeline TT");
            liveExpressionStoreChange?.(this, true);//set via props
            // }
        } else {
            // console.log("refreshTimeline F");
            const timeline = this.timeline;
            if (this.prevTimelineLength !== timeline?.length) {
                this.prevTimelineLength = timeline.length;
                // console.log("refreshTimeline FF");

                liveExpressionStoreChange?.(this, false);//set via props
            }
        }
    };
}

LiveExpressionStore.propTypes = {
    classes: PropTypes.object.isRequired,
    editorId: PropTypes.string.isRequired,
    liveExpressionStoreChange: PropTypes.func,
    updateBundle: PropTypes.func.isRequired,
};

const LiveExpressionStoreWithContext = props => (
    <PastebinContext.Consumer>
        {context => <LiveExpressionStore {...props} {...context}/>}
    </PastebinContext.Consumer>
);
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(LiveExpressionStoreWithContext));
