import 'react-resizable/css/styles.css';
import React, {
    createRef, PureComponent, useContext,
} from 'react';
/** @jsxImportSource @emotion/react */
import {jsx} from '@emotion/react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';
import {Responsive} from 'react-grid-layout';

import {withStyles} from '@mui/styles';
import {darken, hexToRgb} from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import Drawer from '@mui/material/Drawer';
import TvIcon from '@mui/icons-material/Tv';
import LanguageHtml5Icon from 'mdi-material-ui/LanguageHtml5';
import LanguageJavaScriptIcon from 'mdi-material-ui/LanguageJavascript';
import LanguageCss3Icon from 'mdi-material-ui/LanguageCss3';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import SortAscendingIcon from 'mdi-material-ui/SortAscending';
import SortDescendingIcon from 'mdi-material-ui/SortDescending';
import SortAlphabeticalAscendingIcon
    from 'mdi-material-ui/SortAlphabeticalAscending';
import SortAlphabeticalDescendingIcon
    from 'mdi-material-ui/SortAlphabeticalDescending';
import SortNumericAscendingIcon from 'mdi-material-ui/SortNumericAscending';
import SortNumericDescendingIcon from 'mdi-material-ui/SortNumericDescending';
import FunctionIcon from 'mdi-material-ui/Function';
import FolderHome from 'mdi-material-ui/FolderHome';
import FolderAccount from 'mdi-material-ui/FolderAccount';
import FolderDownload from 'mdi-material-ui/FolderDownload';


import isFunction from 'lodash/isFunction';

import {
    Inspector as BaseInspector,
    ObjectName as InspectorObjectName,
    ObjectValue as InspectorObjectValue,
    useStyles
} from 'react-inspector';

import ALE, {ErrorTypes, GraphicalQueryBase, MonacoOptions, RALE} from '../core/modules/ALE';

import {configureFindChunks, functionLikeExpressions} from '../utils/scrUtils';
import {VisualQueryManager} from '../core/modules/VisualQueryManager';

import Editor from './Editor';
import Playground from './Playground';
import SizeProvider from '../utils/SizeProvider';
import {
    configureDefaultGridLayoutFormatter
}
    from '../utils/reactGridLayoutUtils';
import {
    configureDefaultGridLayoutFormatter
        as configureDefaultGridLayoutCompactFormatter
} from '../utils/reactGridLayoutCompactUtils';
import DebugContainer from '../components/DebugContainer';
import TraceControls from '../components/TraceControls';
import PointOfView, {createPointOfViewTile} from '../components/PointOfView';
import ObjectExplorersContext, {
    objectExplorersAcceptor,
    useStateWithRestorer,
    objectValueFormatter
} from '../contexts/ObjectExplorersContext';
import {MonacoHighlightTypes} from '../themes';
import {makeGetExpandedPaths} from '../utils/pathUtils';
import JSEN from '../utils/JSEN';


import TopNavigationBar from '../components/TopNavigationBar';

import PastebinContext from '../contexts/PastebinContext';
import {ThemeContext} from '../themes';

import ALEContext from "../core/modules/rale/ALEContext";
import withPersistence from '../containers/withPersistence';
import LazyHighlighter from "../common/LazyHighlighter";
import {updateBundleFailure} from "../redux/modules/liveExpressionStore";

import {RALEContextProvider} from "../core/modules/rale/RALE";
import {IdiomaticProvider} from "../core/modules/rale/IdiomaticContext";
import IdiomaticView from "../core/modules/rale/IdiomaticView";
import {ArtifactContext} from "../core/modules/rale/ArtifactContext";

// import {isActivatePlayground} from "../utils/reduxUtils";

const withPastebinSearchContext = Component => {
    return props => {
        const context = useContext(PastebinContext);

        const searchValueHighlighter =
            context.searchState?.searchValueHighlighter;
        const aleInstance =
            context.aleContext?.aleInstance;

        return (
            <Component
                propertyValueFormatter={searchValueHighlighter}
                aleInstance={aleInstance}
                {...props}
            />
        );
    };
};

const vStyles = (theme) => {
    return {
        liveExpressionIconDefaultStyle: {
            fontSize: "0.75rem",
            marginBottom: "-0.2rem",
            color: 'white',
            fontWeight: 'bold',
            backgroundColor: theme.palette.mode === 'light' ?
                'rgb( 26,56, 172)' : 'rgb(63,86,  209)',
        },
        liveExpressionObjectType: {
            fontSize: "0.64rem",
            color: 'white',
            fontWeight: 'bold',
            backgroundColor: theme.palette.mode === 'light' ?
                'rgb( 26,56, 172)' : 'rgb(63,86,  209)',
        },
        liveExpressionObjectTypeDefault: {
            fontSize: "0.64rem",
            // color: 'white',
            fontWeight: 'bold',
            // backgroundColor: theme.palette.mode === 'light' ?
            //     'rgb( 26,56, 172)' : 'rgb(63,86,  209)',
        }

    };
};

// let i = 0;
const IdiomaticObjectValue = withStyles(vStyles)(({aleInstance, classes, ...props}) => {

    let objectValue = null;
    const {
        stateType,
        isFunctionType,
        location,
        info,
    } = aleInstance?.scr?.resolveStateInfo(props.object) ?? {};

    if (isFunctionType) {
        objectValue = <FunctionIcon className={classes.liveExpressionIconDefaultStyle}/>;
    } else {
        objectValue = <InspectorObjectValue {...props}/>;
    }

    switch (stateType) {
        // case "local":
        //     return <span> <FolderAccount className={classes.liveExpressionIconDefaultStyle}/>{objectValue}</span>;
        case "native":
            return <><FolderHome className={classes.liveExpressionIconDefaultStyle}/>{objectValue}</>;
        case "import":
            //<span>{JSON.stringify(info.importZoneExpressionData)}</span>
            return <><FolderDownload
                className={classes.liveExpressionIconDefaultStyle}/>{objectValue}</>;

        default:
            return objectValue;
    }

});

const IdiomaticObjectType = withStyles(vStyles)(({aleInstance, classes, object}) => {
    const f = aleInstance?.scr?.importsStates?.[0]?.rootState;
    // const ff = f === object;
    // the hell?
    // (ff || object?.Children) && console.log("IdiomaticObjectType", object, f, ff);
    const {
        stateType,
        isFunctionType,
        location,
        info,
        objectConstructorName,
        ...rest
    } = aleInstance?.scr?.resolveStateInfo(object) ?? {};
    // console.log("IdiomaticObjectType",aleInstance?.scr, object, {
    //     stateType,
    //     isFunctionType,
    //     location,
    //     info,
    // });

    // let objectConstructorName = getObjectClassName(object); // object?.constructor?.name ?? 'Object';
    // = null;
    // object?.constructor?.name; //object?.constructor ?// Symbol(obj).toString  and strip Symbol(...) then [object X]
    // // if (!objectConstructorName) {
    // try {
    //     // objectConstructorName = Symbol(object)?.toString();
    //     console.log("Symbol", Symbol(object)?.toString(), object);
    // } catch (e) {
    //     // objectConstructorName =
    //     //     object?.constructor?.name ?? 'Object';
    // }
    // }

    // return objectConstructorName === 'Object' ?
    //     '' : `${objectConstructorName} `;

    // let objectValueText = objectConstructorName === 'Object' ?
    //     '' : `${objectConstructorName} `;

    let objectValue = objectConstructorName === 'Object' ?
        '' : ` ${objectConstructorName} `;


    //
    // if (isFunctionType) {
    //     objectValue = <FunctionIcon className={classes.liveExpressionIconDefaultStyle}/>;
    // }
    //
    // // if (objectValueText.length) {
    // //     return objectValueText;
    // // }
    //
    //objectValue===""
    // aleInstance?.scr.nativeRootState.console === object && console.log("w", object, objectValue, info, rest);
    switch (stateType) {
        // case "local":
        //     return <span> <FolderAccount className={classes.liveExpressionIconDefaultStyle}/>{objectValue}</span>;
        case "native":
            objectValue.includes("conso") && console.log("w", objectValue, info, rest);
            return <span className={classes.liveExpressionObjectType}>{objectValue}</span>;
        case "import":
            //<span>{JSON.stringify(info.importZoneExpressionData)}</span>
            return <span className={classes.liveExpressionObjectType}>{objectValue}</span>;

        default:
            <span className={classes.liveExpressionObjectTypeDefault}>{objectValue}</span>;
        // return objectValue;
    }

});

const ObjectType = withPastebinSearchContext(IdiomaticObjectType);


const ObjectValue = withPastebinSearchContext(IdiomaticObjectValue);
const ObjectName = withPastebinSearchContext(InspectorObjectName);

const withPastebinSearchVisualQueryContext = Component => {
    return props => {
        const context = useContext(PastebinContext);
        // console.log("VQ", context.VisualQueryManager, props);
        return (
            <Component
                visualQuery={context.searchState?.visualQuery}
                {...props}
            />
        );
    };
};

// fix bas einspector

export const Inspector = (
    {
        inspectorThemeName,
        cacheId,
        ...props
    }
) => {
    const themeContext = useContext(ThemeContext);
    const pastebinContext = useContext(PastebinContext);
    const {obtainRestorer} = useContext(ObjectExplorersContext);

    const expandedPaths = useStateWithRestorer(obtainRestorer(cacheId));

    return (<BaseInspector
        theme={themeContext[inspectorThemeName] ?? themeContext?.inspectorTheme}
        getExpandedPaths={pastebinContext?.searchState?.getExpandedPaths}
        expandedPaths={expandedPaths}
        {...props}
    />);

};

export const GraphicalQuery =
    withPastebinSearchVisualQueryContext(GraphicalQueryBase);

Inspector.propTypes = {
    data: PropTypes.any,
    name: PropTypes.string,
    table: PropTypes.bool,
};

const isDebug = false;

export const TimeoutDelay = {
    NOW: 0,
    FAST: 10,
    NORMAL: 100,
    SLOW: 1000,
};
export const TABLE_ROW_HEIGHT = 22;


export const d = {
    //Matches PointOfView.createPointOfViewTile(...)
    log: (
        id, expressionText, expressionLanguage = 'typescript',
        fromData, toData, dataLanguage = 'json',
    ) => {
    },
};

const defaultSearchPlaceholderGreet = 'Search in trace for: ';
const defaultSearchPlaceholder = `${defaultSearchPlaceholderGreet} null`;
let isCompact = true;
let gridLayoutFormatter = isCompact ?
    configureDefaultGridLayoutCompactFormatter()
    : configureDefaultGridLayoutFormatter();

const animationId = `scr-a-id-${Date.now()}`;

const CONFIGURE_PASTEBIN_LAYOUT = 'CONFIGURE_PASTEBIN_LAYOUT';

export const pastebinConfigureLayout =
    (restoreGridLayouts, getCurrentGridLayouts) => {
        return {
            type: CONFIGURE_PASTEBIN_LAYOUT,
            restoreGridLayouts,
            getCurrentGridLayouts,
        };
    };

const mapStateToProps = null;
//     (reduxers) => {
//     const activatePlayground = isActivatePlayground(reduxers);
//     return {activatePlayground};
// };

const mapDispatchToProps = {pastebinConfigureLayout};


const sortOptions = [
    {
        time: true,
        asc: true,
        Icon: SortAscendingIcon,

    },
    {
        time: true,
        desc: true,
        Icon: SortDescendingIcon,
    },
    {
        expression: true,
        desc: true,
        Icon: SortAlphabeticalDescendingIcon,
    },
    {
        expression: true,
        asc: true,
        Icon: SortAlphabeticalAscendingIcon,

    },
    {
        value: true,
        desc: true,
        Icon: SortNumericDescendingIcon,
    },
    {
        value: true,
        asc: true,
        Icon: SortNumericAscendingIcon,

    }
];

const getSortIcon = (orderBy, orderFlow) => (
    (sortOptions[
        sortOptions.findIndex(
            sortOption => sortOption[orderBy] && sortOption[orderFlow]
        )
        ] || {}).Icon
);

const getNextSortOption = (orderBy, orderFlow) => (
    sortOptions[(
        sortOptions.findIndex(
            sortOption => sortOption[orderBy] && sortOption[orderFlow]
        )
        + 1
    ) % sortOptions.length] // returns first sort option  if not found
);

const defaultSearchWords = [''];

const styles = theme => {
    const container = {
        overflow: 'hidden',
        height: '100%',
        width: '100%',
        margin: 0,
        padding: 0,
        "& .react-resizable-handle::after": {
            right: theme.spacing(2.75),
        }
    };
    return ({
        '@global': {
            [`.${
                MonacoOptions.defaultMonacoEditorLiveExpressionClassName
            }.monaco-editor .cursors-layer > .cursor`]: {
                maxHeight: 18,
                marginTop: 7,
            },
            ".react-grid-layout": {
                position: "relative",
                transition: "height 200ms ease",
            },
            ".react-grid-item": {
                transition: "all 200ms ease",
                transitionProperty: "left, top",
            },
            ".react-grid-item.cssTransforms": {
                transitionProperty: "transform",
            },
            ".react-grid-item.resizing": {
                zIndex: 1,
                willChange: "width, height",
            },
            ".react-grid-item.react-draggable-dragging": {
                transition: "none",
                zIndex: 3,
                willChange: "transform",
            },
            ".react-grid-item > .react-resizable-handle": {
                position: "absolute",
                width: theme.spacing(0.5),
                height: "100%",
                bottom: "0",
                right: "0",
                marginRight: theme.spacing(-0.5),
                // cursor: "ew-resize",
                cursor: "nwse-resize",
                background: "transparent",
                zIndex: theme.zIndex.tooltip,
            },
            ".react-grid-item > .react-resizable-handle::after": {
                content: '""',
                position: "absolute",
                right: theme.spacing(1.5),
                bottom: theme.spacing(0.5),
                // marginRight: "6px",
                width: theme.spacing(3),
                height: theme.spacing(3),
                background: `linear-gradient(135deg, transparent ${theme.spacing(3.75)}, ${hexToRgb(theme.palette.primary.main)} 1%), transparent`,
                //     `url(\'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="${
                //     hexToRgb(theme.palette.primary.main)
                // }" d="M22,22H20V20H22V22M22,18H20V16H22V18M18,22H16V20H18V22M18,18H16V16H18V18M14,22H12V20H14V22M22,14H20V12H22V14Z" /></svg>\')`,
                // cursor: "nwse-resize", // overlaps with column handle!?
                zIndex: theme.zIndex.tooltip,
            },
            ".react-grid-item.react-grid-placeholder": {
                background: theme.palette.primary.main,
                opacity: 0.2,
                transitionDuration: "100ms",
                zIndex: 2,
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
                OUserSelect: "none",
                userSelect: "none",
            },
        },
        draggable: {
            position: 'absolute',
            zIndex: theme.zIndex.tooltip,
            bottom: theme.spacing(3.5),
            right: theme.spacing(2),
            color: theme.palette.primary.main,
            fontSize: theme.spacing(2),
            cursor: 'grab',
            '&:active': {
                cursor: 'grabbing',
            }
        },
        [`@keyframes ${animationId}`]: {
            to: {
                visibility: 'visible',
            },
            from: {
                visibility: 'hidden',
            }
        },
        loadingFeedback: {
            position: 'absolute',
            bottom: theme.spacing(1),
            left: '50%',
            color: theme.palette.secondary.main,
            visibility: 'hidden',
            animation: `${animationId} 1s linear 1s infinite alternate`,
        },
        layout: {
            overflow: 'visible',
        },
        button: {
            position: 'absolute',
            right: 0,
            bottom: 0,
            float: 'right',
            margin: theme.spacing(1),
        },
        icon: {
            position: 'absolute',
            zIndex: theme.zIndex.snackbar,
            right: theme.spacing(0.5),
            top: theme.spacing(0.25),
            color: darken(theme.palette.action.disabled, 0.5),
            fontSize: theme.spacing(3),
        },
        locatorButton: {
            position: 'absolute',
            zIndex: theme.zIndex.snackbar,
            bottom: theme.spacing(4),
            right: 0,
        },
        locator: {
            fontSize: theme.spacing(2.5),
        },
        debugContainer: {
            ...container
        },
        playgroundContainer: {
            ...container,
        },
    })
};

const compactedStyle = {
    fontSize: '85%',
};

const Compacted = ({children}) => {
    return (
        <span css={compactedStyle}>
      {children}
      </span>
    );
};

const StringQuoted = ({children}) => {
    const styles = useStyles('ObjectValue');
    return (<>
        <span css={styles.objectValueStringQuote}>'</span>
        {children}
        <span css={styles.objectValueStringQuote}>'</span>
    </>);
};

const BigIntNoted = ({children}) => {
    const styles = useStyles('ObjectValue');
    return (<>
        {children}
        <span css={styles.objectValueStringQuote}>n</span>
    </>);
};

class Pastebin extends PureComponent {
    debouncedOnDebugContainerResizeEnd = debounce(() => {
        this.handleChangeDebugLoading(false);
    }, 50);
    firstNotNullCaseId = -1;

    onGridResize = (isResizing) => this.resizeListener?.(isResizing);

    handleChangeDebugLoading = (isLoading) => {
        this.setState({isDebugLoading: isLoading});
    };

    getCurrentGridLayouts = () => {
        return gridLayoutFormatter.currentGridLayouts;
    };
    firstNotNullCaseEntry = null;
    prevLiveExpressionStoreIsNew = false;
    handleChangePlaying = debounce((id, play) => {
        this.setState((prevState) => {
            let {
                isPlaying, lastHandleChangePlayingId
            } = prevState;
            const {
                orderBy,
                order,
                timeline,
                liveTimeline,
                logs,
                liveLogs,
            } = prevState;

            if (id === 'table') {
                if (!isPlaying && !lastHandleChangePlayingId) {
                    return;
                }

                if (play) {
                    lastHandleChangePlayingId = null;
                    isPlaying = false;
                } else {
                    lastHandleChangePlayingId = id;
                    isPlaying = true;
                }

            }
            let currentTimeline = isPlaying ? timeline : liveTimeline;
            let currentLogs = isPlaying ? logs : liveLogs;
            const data = this.createData(currentTimeline);
            const logData = this.createLogData(currentLogs);
            const sortedData =
                orderBy === 'time' && order === 'desc' ? data
                    : this.sortData(data, orderBy, order);

            return {
                isPlaying: !isPlaying,
                lastHandleChangePlayingId,
                timeline: currentTimeline,
                logs: currentLogs,
                data: sortedData,
                logData
            };
        });
    }, 100);

    constructor(props) {
        super(props);
        this.setUpdateMonacoEditorLayouts = {};
        this.updateMonacoEditorLayouts = {};
        this.debugScrollerRefSnapshots = {};
        VisualQueryManager.onChange = this.onVisualQueryChange;
        d.log = this.handleChangePointOfViewTiles;
        this.textInLocCacheResetThreshold = 1000;
        this.cleanEditorTextInLocCache();
        this.cacheRef = createRef({});
    }

    //layout: Layout, oldItem: LayoutItem, newItem: LayoutItem,
    // placeholder: LayoutItem, e: MouseEvent, element: HTMLElement
    onResizeStart = (layout, oldItem, newItem,
                     placeholder, e, element) => {
        // gridLayoutFormatter.formatLayout(layout, oldItem, newItem);
        this.onGridResize(true);
    };

    onVisualQueryChangeTid = null;
    onVisualQueryChange = (newVisualQuery = [], visualIds, action) => {
        this.setState(({searchState = {}}) => {
            let {visualQueryPreview = [], visualQuery = []} = searchState;
            switch (action) {
                case 'select':
                    const newQuery = [...visualQuery, ...newVisualQuery];
                    visualQuery = newQuery.filter(
                        (el, i) => (
                            !(newVisualQuery.indexOf(el) >= 0
                                && visualQuery.indexOf(el) >= 0)
                        )
                    );
                    break;
                case 'preview':
                    visualQueryPreview = newVisualQuery === visualQueryPreview ?
                        []
                        : newVisualQuery;
                    break;
                default:
                    console.warn(
                        "Unknown onVisualQueryChange action", action
                    );
            }

            searchState = {
                ...searchState,
                visualQuery,
                visualQueryPreview,
            };
            clearTimeout(this.onVisualQueryChangeTid);
            this.onVisualQueryChangeTid = setTimeout(() => {
                this.setState(state => {
                    const {
                        orderBy,
                        order,
                        timeline,
                        getEditorTextInLoc
                    } = state;

                    const defaultData = this.createData(timeline);
                    const data = orderBy === 'time' && order === 'desc' ?
                        defaultData
                        : this.sortData(defaultData, orderBy, order);

                    return {
                        data,
                    };
                });

            }, TimeoutDelay.NOW);

            return {
                searchState
            }
        });
    };

    onResize = (layout, oldItem, newItem
                /*, placeholder, e, element*/) => {
        gridLayoutFormatter.formatLayout(layout, oldItem, newItem);
        this.handleAutomaticLayoutThrottled();
    };

    setResizeListener = resizeListener => (
        this.resizeListener = resizeListener
    );

    onResizeStop = (layout, oldItem, newItem
                    /*, placeholder, e, element*/) => {
        gridLayoutFormatter.formatLayout(layout, oldItem, newItem);
        // if (newItem.i === 'debugContainer') {
        this.onDebugContainerResizeEnd(false);
        // }
        this.handleAutomaticLayoutDebounced();
        this.onGridResize(false);
    };

    formatDrag = layout => {
        gridLayoutFormatter.layoutDragPositionInvariant(layout);
    };

    onDragStart = itemCallback => {
        this.formatDrag(itemCallback);
    };
    onDrag = itemCallback => {
        this.formatDrag(itemCallback);
    };
    onDragStop = itemCallback => {
        this.formatDrag(itemCallback);
    };

    onLayoutChange = (newLayout, newGridLayouts) => {
        gridLayoutFormatter.currentGridLayouts = newGridLayouts;
        this.handleAutomaticLayoutDebounced();
    };

    onBreakpointChange = (newBreakpoint /*, newCols*/) => {
        gridLayoutFormatter.onBreakpointChange(newBreakpoint);
        this.handleAutomaticLayoutDebounced();
    };

    handleChangeTimeFlow = (event, property, order) => {
        this.setState((prevState) => {
            let {timeFlow, data, logData} = prevState;
            const orderBy = 'time';
            if (!order) {
                order = timeFlow;
                if (prevState.orderBy === orderBy) {
                    if (timeFlow === 'desc') {
                        order = 'asc';
                        timeFlow = order;
                    } else {
                        order = 'desc';
                        timeFlow = order;
                    }
                }
            } else {
                timeFlow = order;
            }

            data = this.sortData(data, orderBy, order);
            logData = this.sortData(logData, orderBy, order);
            return {data, logData, order, orderBy, timeFlow};
        });
    };

    handleRequestSort = (event, orderBy, order) => {
        this.setState((prevState) => {
            let {data, logData} = prevState;
            if (!order) {
                order = 'desc';
                if (prevState.orderBy === orderBy &&
                    prevState.order === 'desc') {
                    order = 'asc';
                }
            }

            data = this.sortData(data, orderBy, order);
            logData = this.sortData(logData, orderBy, order);
            return {data, logData, order, orderBy};
        });
    };

    restoreGridLayouts = gridLayouts => {
        gridLayouts = gridLayoutFormatter.validateLayout(
            gridLayouts, gridLayoutFormatter.currentBreakPoint
        );
        this.setState({gridLayouts});
        gridLayoutFormatter.currentGridLayouts = gridLayouts;
        this.onDebugContainerResizeEnd(false);
    };

    sortData = (data, orderBy, order) => {
        return order === 'desc' ?
            data.sort((a, b) => (b[orderBy] < a[orderBy] ? -1 : 1))
            : data.sort((a, b) => (a[orderBy] < b[orderBy] ? -1 : 1));
    };

    handleSelectAllClick = (event, checked) => {
        if (checked) {
            this.setState({selected: this.state.data.map(n => n.id)});
            return;
        }
        this.setState({selected: []});
    };

    handleSelectClick = (event, id) => {
        const {selected} = this.state;
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }

        this.setState({selected: newSelected});
    };


    isSelected = id => this.state.selected.indexOf(id) !== -1;

    resetGridLayout = layout => {
        this.restoreGridLayouts(gridLayoutFormatter.getLayoutDummy(layout));
        setTimeout(() => {
            this.restoreGridLayouts(
                layout || gridLayoutFormatter.getDefaultGridLayouts()
            );
        }, TimeoutDelay.NOW);

    };

    onDebugContainerResizeEnd = (isUpdate) => {
        this.handleChangeDebugLoading(true);
        this.debouncedOnDebugContainerResizeEnd(isUpdate);
    };

    handleAutomaticLayout = () => {
        if (this.props.disableGridAutomaticEditorLayout) {
            return;
        }
        for (const editorId in this.updateMonacoEditorLayouts) {
            this.updateMonacoEditorLayouts[editorId]
            && this.updateMonacoEditorLayouts[editorId]();
        }
    };

    handleAutomaticLayoutThrottled =
        throttle(() => this.handleAutomaticLayout(), 250);
    handleAutomaticLayoutDebounced =
        debounce(() => this.handleAutomaticLayout(), 250);

    getSortInfo = () => {
        const {order, orderBy, timeFlow} = this.state;
        const orderFlow = orderBy === 'time' ?
            timeFlow : order;
        return {
            handleGetNextSortOption: event => {
                const orderFlow = orderBy === 'time' ? timeFlow : order;
                const nextOptions = getNextSortOption(
                    orderBy,
                    orderFlow
                );
                const nextOptionsKeys = Object.keys(
                    nextOptions
                );

                if (nextOptions.time) {
                    this.handleChangeTimeFlow(event, ...nextOptionsKeys);
                } else {
                    this.handleRequestSort(event, ...nextOptionsKeys);
                }
            },
            SortIcon: getSortIcon(orderBy, orderFlow),
            sortTitle: `Order by ${
                orderBy
            } ${
                orderFlow === 'desc' ?
                    'descending' : 'ascending'
            }`
        };
    };

    timelineSearchFilter = entry => {
        const {searchState} = this.state;
        return (entry.isError || !searchState.visualQuery?.length) ||
            (entry.isOutput && searchState.visualQuery.find(
                    q => entry.outputRefs?.includes(q)
                )
            );
    };

    // timelineLiveExpressionFilter = (entry = {}) => {
    //     const {zone} = entry;
    //
    //     switch(zone.type){
    //         case "Literal":
    //             return false;
    //         default:
    //             return true;
    //     }
    // };


    cleanEditorTextInLocCache = () => {
        if (!this.textInLocCacheResetCounter) {
            this.textInLocCache = {};
            this.textInLocCacheResetCounter = this.textInLocCacheResetThreshold;
        }
        this.textInLocCacheResetCounter--;
    }

    getEditorTextInLoc = () => {
        console.warn("Monaco editor's must replace this placeholder");
        return '';
    }

    getEditorTextInLocCache = (id, loc) => {
        const {textInLocCache, getEditorTextInLoc} = this;

        if (!textInLocCache[id] || textInLocCache[id].loc !== loc) {
            textInLocCache[id] = {
                loc,
                text: getEditorTextInLoc(loc),
            };
        }
        return textInLocCache[id].text;
    };

    createData(
        timeline
    ) {
        //     console.log("timeline",timeline);
        // .filter(
        //         this.timelineLiveExpressionFilter
        //     )
        return (timeline || []).filter(
            this.timelineSearchFilter
        ).map((entry, i) => ({
            id: entry.reactKey,
            time: entry.i,
            // time: entry.timestamp,
            // expression: this.getEditorTextInLocCache(entry.id, entry.loc),
            expression: entry.expression,
            value: entry.data,
            loc: {...entry.loc},
            expressionId: entry.id,
            entry: entry,
            isError: entry.isError,
            isGraphical: entry.isDOM,
            funcRefId: entry.funcRefId,
            dataRefId: entry.dataRefId,
        }));
    }

    createLogData(log) {
        return (log || []).map((entry, i) => {
            if (entry.isLog) {
                return {
                    id: entry.reactKey,
                    time: entry.i,
                    // time: entry.timestamp,
                    expression:
                        this.getEditorTextInLocCache(entry.id, entry.loc),
                    value: entry.data,
                    loc: {...entry.loc},
                    expressionId: entry.id,
                    entry: entry,
                    isError: entry.isError,
                    isGraphical: entry.isDOM,
                    funcRefId: entry.funcRefId,
                    dataRefId: entry.dataRefId,
                }
            } else {
                return {
                    id: entry.reactKey,
                    time: entry.i,
                    // time: entry.timestamp,
                    isFromInput: true,
                    value: entry.data,
                    entry: entry,
                    isResult: entry.isResult,
                    isError: entry.isError,
                }
            }
        });
    }

    findSearchPlaceholderExample = (sortedData) => {
        let {searchState} = this.state;

        if (this.firstNotNullCaseEntry) {
            this.firstNotNullCaseId =
                sortedData.indexOf(this.firstNotNullCaseEntry);
        }

        if (this.firstNotNullCaseId < 0) {

            this.firstNotNullCaseId = sortedData.findIndex(
                (entry) => {
                    if (!(typeof entry.value === 'string')) {
                        return false;
                    }
                    const noExpressionMatchesVarDefiniton =
                        entry.expression?.match(
                            /[let|const|var]\s+/
                        ) === null;

                    const value = JSEN.parse(entry.value);
                    return (
                        noExpressionMatchesVarDefiniton &&
                        value === null
                    );
                }
            );
        }

        if (this.firstNotNullCaseId > -1) {
            this.firstNotNullCaseEntry =
                sortedData[this.firstNotNullCaseId];
        }

        if (this.firstNotNullCaseEntry) {
            const {expression = ''} = this.firstNotNullCaseEntry;
            const placeholder = `${
                defaultSearchPlaceholderGreet
            } ${expression.split(/[^\w+]|null/)[0]} null`;
            searchState = {...searchState, placeholder};
        }
        return searchState;
    };

    traceSubscriber = {
        getMatches: () => null,
    };

    liveExpressionStoreChange = ( // liveExpressionStore obj's ref
        {
            traceSubscriber = this.traceSubscriber,
            timeline: pureTimeline,
            logs,
            highlightSingleText, highlightErrors,
            setCursorToLocation, getEditorTextInLoc, colorizeDomElement,
            objectNodeRenderer, handleChange
        },
        isNew
    ) => {
        const zones = this.state.aleContext?.aleInstance.zale?.zones;

        const getSourceText = expressionId => (zones?.[expressionId]?.sourceText ?? "");
        const getSourceLoc = expressionId => (zones?.[expressionId]?.loc ?? {});
        const timeline = pureTimeline
            // .filter(e => !!e.pre)
            .map((entry, i) => {

                const expressionId = entry?.expressionId ?? entry?.pre?.expressionId;
                return ({
                    reactKey: i,
                    i,
                    expressionId,
                    // time: entry.timestamp,
                    expression: getSourceText(expressionId),
                    value: entry?.logValue?.serialized,
                    loc: getSourceLoc(expressionId),//{...(entry?.node?.loc ?? {})},

                    entry: entry,
                    isError: entry.isError,
                    isGraphical: entry.isDOM,
                    funcRefId: entry.funcRefId,
                    dataRefId: entry.dataRefId,
                })
            });
        this.getEditorTextInLoc = getEditorTextInLoc;
        isNew && !timeline.length && this.cleanEditorTextInLocCache();

        const {orderBy, order, isPlaying} = this.state;
        isPlaying && this.handleChangeDebugLoading(true);


        const ee = pureTimeline?.find(e => e.isError);
        ee && console.log("PRE liveExpressionStoreChange", ee);
        // this.prevLiveExpressionStoreIsNew &&
        clearTimeout(
            this.liveExpressionStoreChangeTimeout
        );

        this.prevLiveExpressionStoreIsNew = isNew;


        this.liveExpressionStoreChangeTimeout = setTimeout(() => {
            // why puretimline is still []: check this obj
            // console.log("liveExpressionStoreChange", pureTimeline, isNew, zones);
            if (isPlaying || isNew) {
                let currentTimeline = isPlaying ?
                    timeline : this.state.timeline;
                let currentLogs = isPlaying ? logs : this.state.logs;
                const data = this.createData(currentTimeline);
                const logData = this.createLogData(currentLogs);

                ee && console.log("data liveExpressionStoreChange", {
                    data,
                    timeline,
                    currentTimeline
                }, data?.find(e => e.isError));

                const sortedData = this.sortData(data, orderBy, order);
                const sortedLogData = this.sortData(
                    logData, orderBy, order
                );

                const searchState = this.findSearchPlaceholderExample(
                    sortedData
                );

                const configureMappingEventListeners = (n) => {
                    let onMouseEnter = null, onMouseLeave = null,
                        onClick = null;
                    if (!n.isFromInput) {
                        onMouseEnter = () =>
                            highlightSingleText(
                                n.loc, n.isError ? MonacoHighlightTypes.error
                                    : n.isGraphical ?
                                        MonacoHighlightTypes.graphical
                                        : MonacoHighlightTypes.text,
                                traceSubscriber.getMatches(
                                    n.funcRefId,
                                    n.dataRefId,
                                    n.entry.calleeId
                                )
                            )
                        onMouseLeave = () => highlightSingleText();
                        onClick = () => setCursorToLocation(n.loc)
                    }
                    return {onMouseEnter, onMouseLeave, onClick};
                };
                this.setState((prevState) => {

                    // todo: ? ee && console.log("liveExpressionStoreChange", {sortedData});
                    return ({
                        searchState,
                        isNew,
                        isPlaying: isNew || prevState.isPlaying,
                        traceSubscriber,
                        timeline: currentTimeline,
                        liveTimeline: timeline,
                        logs: currentLogs,
                        liveLogs: logs,
                        data: sortedData,
                        logData: sortedLogData,
                        highlightSingleText,
                        highlightErrors,
                        setCursorToLocation,
                        colorizeDomElement,
                        objectNodeRenderer,
                        handleChange,
                        configureMappingEventListeners
                    })
                });
                this.handleChangeDebugLoading(false);
            } else {
                this.setState(() => ({
                    liveTimeline: timeline,
                    liveLogs: logs,
                    isNew
                }));
            }
        }, isNew ? TimeoutDelay.NOW : TimeoutDelay.NORMAL);
    };

    handleChangeTab = (event, tabOptions) => {
        if (tabOptions?.length) {
            this.setState({tabOptions});
        }
    };

    setSearchState = (searchState) => {
        const {value, findChunks, isWord, isRegExp} = searchState;
        const searchWords = isWord || isRegExp ? [value] :
            value.split(/[\f\t\r\e\n\s]+/m).filter(v => v.trim().length);
        return {
            searchState: {...searchState, searchWords}
        };
    };

    handleChangePartialSearchValue = searchState => {
        this.setState(prevState => (
            this.setSearchState({...prevState.searchState, ...searchState})
        ));
    };

    handleChangeSearchValue = value => {
        this.setState(prevState => (
            this.setSearchState({...prevState.searchState, value})
        ));
    };

    handleChangeSearchFilterClick = (filter) => {
        const {searchState} = this.state;
        const nextSearchState = {
            ...searchState,
            [filter]: !searchState[filter]
        };
        if (nextSearchState.isWord && nextSearchState.isRegExp) {
            if (filter === 'isWord') {
                nextSearchState.isRegExp = false;
            } else {
                nextSearchState.isWord = false;
            }
        }

        const hasFilter = nextSearchState.isFunctions
            || nextSearchState.isExpressions || nextSearchState.isValues;

        if (!hasFilter) {
            if (filter === 'isFunctions'
                || filter === 'isExpressions'
                || filter === 'isValues') {
                nextSearchState[filter] = true;
            } else {
                nextSearchState.isFunctions = true;
            }
        }

        nextSearchState.findChunks = configureFindChunks(
            !nextSearchState.isRegExp,
            nextSearchState.isCase,
            nextSearchState.isWord
        );
        this.setState(this.setSearchState(nextSearchState));
    };

    handleChangeAutoExpand = () => {
        this.setState(
            prevState => ({isAutoLogActive: !prevState.isAutoLogActive})
        );
    };

    matchesFilterConsole = (data) => {
        const {searchState} = this.state;
        const {value, searchWords, findChunks, isWord, isRegExp} = searchState;
        const _findChunks = (textToHighlight) => {
            return findChunks({
                searchWords,
                textToHighlight
            })
        };
        const result = {
            found: false,
            functions: [],
            expressions: [],
            values: [],
        };

        const isAnyText = !value.trim().length;

        if (isAnyText) {
            result.found = true;
            return result;
        }

        result.values = _findChunks(data.expression);
        result.found = !!result.values.length;

        if (!result.found) {
            result.values = _findChunks(data.value);
            result.found = !!result.values.length;
        }

        return result;
    };

    matchesFilterTrace = (data) => {
        const {searchState} = this.state;
        const {
            value,
            searchWords,
            findChunks: _findChunks,
            isWord,
            isRegExp,
            isFunctions,
            isExpressions,
            isValues,
            functionLikeExpressions,
        } = searchState;

        const findChunks = (textToHighlight) => {
            return _findChunks(
                {searchWords, textToHighlight}
            );
        };

        const result = {
            found: false,
            functions: [],
            expressions: [],
            values: [],
            expressionChunks: [],
            // isAlternative: false,
            isCodeMatch: false,
            isStateMatch: false,
        };

        //  const expressionType = data.entry?.expressionType;

        //const hasFilters = isFunctions || isExpressions || isValues;

        const isAnyText = !value.trim().length;

        if (isAnyText) {
            result.found = true;
            return result;
        }

        // if (isFunctions && functionLikeExpressions.includes(expressionType)) {
        //    result.functions = isAnyText ? [] : findChunks(data.expression);
        //    result.isCodeMatch = !!result.functions.length;
        // }

        const {expression: expressionText, value: valueText} =
            data?.isValueOnly ? data : data?.entry ?? {};

        if (isExpressions) {
            result.expressions = isAnyText ? [] : findChunks(expressionText);
            result.isCodeMatch = !!result.expressions.length;
        }

        if (isValues) {
            result.values = isAnyText ? [] : findChunks(valueText);
            result.isStateMatch = !!result.values.length;
        }

        result.expressionChunks = result.expressions;

        if (isExpressions && isValues) {
            result.found = (result.isCodeMatch && result.isStateMatch);
            // console.log("C", {expressionText, valueText}, result);
        } else {
            result.found = (result.isCodeMatch || result.isStateMatch);
        }

        return result;
    };

    searchValueHighlighterFindChunks = ({textToHighlight}) => {
        return this.matchesFilterTrace({
            isValueOnly: true,
            expression: '',
            value: textToHighlight
        }).values;
    };

    searchStateTextHighlighter = (textToHighlight, findChunks, searchWords) => {
        const {
            searchWords: _searchWords,
        } = this.state.searchState;
        return (
            <LazyHighlighter
                searchWords={searchWords ?? _searchWords}
                textToHighlight={textToHighlight}
                autoEscape={true}
                findChunks={findChunks ?? this.searchValueHighlighterFindChunks}
            />
        );
    };

    searchValueHighlighter = (object, type) => {
        const text = objectValueFormatter(object, type);
        const result = this.searchStateTextHighlighter(text);
        switch (type) {
            case 'Array':
            case 'Object':
            case 'Buffer':
            case 'Class':
                return <Compacted>{result}</Compacted>;
            case 'string':
                return <StringQuoted>{result}</StringQuoted>;
            case 'bigint':
                return <BigIntNoted>{result}</BigIntNoted>;
            default:
                return result;
        }
    };

    checkSearchActive = () => this.state.searchState?.value?.length > 0;

    searchValueFilterGetExpandedPaths = (textToHighlight) => {
        return this.searchValueHighlighterFindChunks(
            {textToHighlight}
        ).length > 0;
    }

    setAleInstance = (aleInstance) => {
        this.setState(({aleContext: _aleContext}) => {
            const same = aleInstance === _aleContext?.aleInstance;
            const aleContext = same ? _aleContext : {..._aleContext, aleInstance};

            if (!same) {
                // _aleContext?.aleInstance?.dale.stop();
                // // aleContext?.aleInstance?.dispose();
                // aleInstance?.dale?.start(aleContext?.aleInstance?.dale);

                if (aleContext.VisualQueryManager) {
                    aleContext.VisualQueryManager.visualQuery = [];
                }
            }


            return {
                aleContext
            };
        });
    }

    // onOutputChange = () => {
    //     this._onOutputChange?.();
    // };

    activateAleInstance = () => { // propates exception, catch for user reporting
        // this._onOutputChange = onOutputChange;
        const {dependencies} = this.props;
        const {appManager} = dependencies;
        // let aleInstance = null;
        // const {aleInstanceSubject, aleInstanceContext} = appManager.rxApp().aleFirecoPad().behaviors();
        // // console.log("activateAleInstance", appManager.rxApp().aleFirecoPad(), appManager.rxApp().aleFirecoPad().behaviors(), aleInstanceContext());
        //
        // aleInstanceContext()
        //     .subscribe(
        //         ({aleFirecoPad, cale, dale}) => {
        //             console.log("activateAleInstance", aleInstanceContext());
        //             if (!(aleFirecoPad && cale && dale)) {
        //                 return;
        //             }
        //
        //             aleInstance?.dispose?.();
        //
        //             aleInstance = ALE(
        //                 aleFirecoPad.id,
        //                 cale,
        //                 dale,
        //                 null,
        //                 null,
        //                 global.top ?? global,
        //                 true,
        //                 // onUnsafeAct,
        //             );
        //             aleInstance.activateTraceChanges();
        //             // console.log("aleInstance", aleInstance);
        //             aleInstanceSubject().next({aleInstance});
        //
        //         }
        //     );

        //
        appManager.rxApp().aleFirecoPad().behaviors().aleFirecoPadSubject?.().subscribe(({aleFirecoPad}) => {
            if (!aleFirecoPad) {
                return;
            }

            const {caleSubject, daleSubject, aleInstanceSubject} = aleFirecoPad.behaviors() ?? {};

            let aleInstance = null;
            caleSubject().subscribe(({cale}) => {
                daleSubject().subscribe(({dale}) => {
                    if (!(cale && dale)) {
                        return;
                    }

                    aleInstance?.dispose?.();

                    aleInstance = ALE(
                        aleFirecoPad,
                        cale,
                        dale,
                        null,
                        null,
                        global.top ?? global,
                        true,
                        // onUnsafeAct,
                    );
                    aleInstance.activateTraceChanges();
                    // console.log("aleInstance", aleInstance);
                    aleInstanceSubject().next({aleInstance});
                    this.setAleInstance(aleInstance);
                });

            });


        });


        // aleInstance.setOnOutputChange(this.onOutputChange);

        // aleInstance.attachDALE(monaco, monacoEditor, () => {
        // }, console.log);
        // console.log("attachDALE", aleInstance);
        // this.setAleInstance(aleInstance);
        return null;
    };

    handleChangeGraphicalLocator = () => this.setState(
        prevState => {
            const isGraphicalLocatorActive =
                !prevState.isGraphicalLocatorActive;
            // const searchState = {...prevState.searchState};
            // if (isGraphicalLocatorActive) {
            //     searchState.isExpressionsTemp = searchState.isExpressions;
            //     searchState.isExpressions = true;
            // } else {
            //     searchState.visualQuery = [];
            //     searchState.visualId = null;
            //     searchState.isExpressions = searchState.isExpressionsTemp;
            // }
            return {
                isGraphicalLocatorActive,
                // searchState
            }
        });

    state = {
        demo: false,
        VisualQueryManager,
        gridLayouts: gridLayoutFormatter.getDefaultGridLayouts(),
        isDebugLoading: false,
        isSelectable: false,
        tabOptions: ['trace'],
        order: 'asc',
        orderBy: 'time',
        selected: [],
        data: [],
        logData: [],
        page: 0,
        rowsPerPage: 10,
        minRows: 10,
        defaultRowsPerPage: 10,
        rowsPerPageIncrement: 100,
        timeline: [],
        logs: [],
        liveTimeline: [],
        liveLogs: [],
        isPlaying: true,
        timeFlow: 'asc',
        isAutoLogActive: true,
        width: 800,
        height: 600,
        hoveredCellKey: null,
        isGraphicalLocatorActive: false,
        pointOfViewTiles: [],
        liveExpressionStoreChange: this.liveExpressionStoreChange,
        handleChangeDebugLoading: this.handleChangeDebugLoading,
        handleSelectClick: this.handleSelectClick,
        handleSelectAllClick: this.handleSelectAllClick,
        handleRequestSort: this.handleRequestSort,
        isRowSelected: this.isSelected,
        handleChangePlaying: this.handleChangePlaying,
        getSortInfo: this.getSortInfo,
        handleChangeTimeFlow: this.handleChangeTimeFlow,
        handleChangeAutoExpand: this.handleChangeAutoExpand,
        handleChangeGraphicalLocator: this.handleChangeGraphicalLocator,
        highlightSingleText: () => {
        },
        colorizeDomElement: () => {
        },
        configureMappingEventListeners: () => () => {
        },
        searchState: {
            placeholder: defaultSearchPlaceholder,
            disableMultiWord: false,
            isFunctions: true,
            isExpressions: false,
            isValues: true,
            isCase: false,
            isWord: false,
            isRegExp: false,
            visualQuery: [],
            visualKey: null,
            value: '',
            searchWords: defaultSearchWords,
            setSearchState: this.setSearchState,
            handleChangeValue: this.handleChangeSearchValue,
            handleFilterClick: this.handleChangeSearchFilterClick,
            matchesFilterTrace: this.matchesFilterTrace,
            matchesFilterConsole: this.matchesFilterConsole,
            searchValueHighlighter: this.searchValueHighlighter,
            searchStateTextHighlighter: this.searchStateTextHighlighter,
            checkSearchActive: this.checkSearchActive,
            getExpandedPaths: makeGetExpandedPaths(
                this.searchValueFilterGetExpandedPaths,
                this.checkSearchActive,
                // 7
            ),
            findChunks: configureFindChunks(true),
            functionLikeExpressions: functionLikeExpressions,
            handleChangePartialSearchValue: this.handleChangePartialSearchValue,
        },
        aleContext: {
            Inspector,
            ObjectType,
            ObjectValue,
            ObjectName,
            useStyles,
            GraphicalQuery,
            aleInstance: null,
            setAleInstance: this.setAleInstance,
            activateAleInstance: this.activateAleInstance,
            locToMonacoRange: (...p) => this.state.aleContext.aleInstance?.dale?.locToMonacoRange(...p),
            // getTheme:this.getTheme,
            VisualQueryManager,
        },
        // jsErrorState: null,
    };

    isDemo = () => {
        return this.state.demo;
    };

    setIsDemo = (demo) => {
        this.setState({demo});
    };

    openDemo = () => {
        this.setIsDemo(true);
    };

    closeDemo = () => {
        this.setIsDemo(false);
    };

    handleClickDemo = () => {
        this.setState(({demo}) => ({demo: !demo}));
    }

    // getTheme = ()=>this.props.muiTheme;

    handleChangePointOfViewTiles = (...params) => {
        if (params.length) {
            this.setState(
                prevState => ({
                    pointOfViewTiles: [
                        ...prevState.pointOfViewTiles,
                        createPointOfViewTile(...params)
                    ]
                }));
        } else {
            this.setState({pointOfViewTiles: []});
        }
    };


    setAutorunDelay = autorunDelay => {
        const {data, changeData} = this.props;
        changeData({
            ...data,
            autorunDelay
        })
    };

    updateMonacoEditorLayout = (editorId) => {
        if (!this.setUpdateMonacoEditorLayouts[editorId]) {
            this.setUpdateMonacoEditorLayouts[editorId] =
                (monacoEditorLayout) => {
                    this.updateMonacoEditorLayouts[editorId] =
                        monacoEditorLayout;
                }
        }
        return this.setUpdateMonacoEditorLayouts[editorId];
    };

    handleChangeHoveredCellKey = (event, hoveredCellKey) => {
        this.setState({hoveredCellKey});
    }


    handleChangeEnterCellScriptContainer =
        event => this.handleChangeHoveredCellKey(
            event, 'scriptContainer'
        );
    handleChangeLeaveCellScriptContainer =
        event => this.handleChangeHoveredCellKey(event, null);
    handleChangeEnterCellHtmlContainer =
        event => this.handleChangeHoveredCellKey(
            event, 'htmlContainer'
        );
    handleChangeLeaveCellHtmlContainer =
        event => this.handleChangeHoveredCellKey(event, null)
    handleChangeEnterCellCssContainer =
        event => this.handleChangeHoveredCellKey(
            event, 'cssContainer'
        );
    handleChangeLeaveCellCssContainer =
        event => this.handleChangeHoveredCellKey(event, null);
    handleChangeEnterCellDebugContainer =
        event => this.handleChangeHoveredCellKey(
            event, 'debugContainer'
        );
    handleChangeLeaveCellDebugContainer =
        event => this.handleChangeHoveredCellKey(event, null);
    handleChangeEnterCellPlaygroundContainer =
        event => this.handleChangeHoveredCellKey(
            event, 'playgroundContainer'
        );
    handleChangeLeaveCellPlaygroundContainer =
        event => this.handleChangeHoveredCellKey(event, null);

    handleUnsafeAct = (type, editorId, exception, errors, ...rest) => {
        console.log("handleUnsafeAct", {type, editorId, exception, errors, rest});
        //here it is, put all error logic here
        switch (type) {
            case ErrorTypes.P:
            //start with
            case ErrorTypes.B:
                console.log("XC", {type, editorId, exception, errors});
                updateBundleFailure(editorId, exception, errors, type, ...rest);
                break;

            case ErrorTypes.R:
                //  updatePlaygroundLoadFailure('js', exception, errors, rest);
                break;
            default:
                throw new Error(`handleUnsafeAct: unsupported type: ${type}`);
        }
        // this.setState({jsErrorState:{
        //       type,
        //       exception,
        //       errors,
        //       ...rest
        //    }});
    };

    render() {
        const {
            gridRef,
            theme, classes,
            TopNavigationBarProps,
            isTopNavigationToggled,
            width,
            height,
            data,
            dependencies,
            // activatePlayground,
        } = this.props;

        const editorIds = dependencies?.appManager?.editorIds;

        const {
            gridLayouts,
            isDebugLoading,
            tabOptions,
            hoveredCellKey,
            isGraphicalLocatorActive,
            isAutoLogActive,
            pointOfViewTiles,
            isPlaying,
            searchState,
            aleContext,
            demo,
            // jsErrorState,
        } = this.state;

        const {aleInstance} = aleContext;

        const {appUnits} = theme;

        const {autorunDelay = "1500",} = data;
        VisualQueryManager.visualQuery = searchState?.visualQuery || [];

        const rowHeight = Math.floor(
            height / gridLayoutFormatter.grid.rows[
                gridLayoutFormatter.currentBreakPoint
                ]
        );
        gridLayoutFormatter.rowHeights[
            gridLayoutFormatter.currentBreakPoint
            ] = rowHeight - appUnits.margin;

        // const debugDrawer = (isDebug && global.monaco && global.monaco.editor
        //     && isAutoLogActive &&
        //     <Drawer anchor={"bottom"} open={isAutoLogActive}
        //             onClose={this.handleChangeAutoExpand}>
        //         <PointOfView monaco={global.monaco}
        //                      tiles={pointOfViewTiles}/>
        //     </Drawer>);

        const _rowHeight = gridLayoutFormatter.rowHeights[
            gridLayoutFormatter.currentBreakPoint
            ];


        const rale = (
            (aleInstance
                // &&
                // activatePlayground
            ) &&
            <>
                <RALE
                    // data={this.state.data}
                    // aleInstance={aleInstance}
                    // cacheRef={this.cacheRef}
                />
                {/*<div>YOLO</div>*/}
            </>
        );

        return (
            <PastebinContext.Provider
                value={this.state}
            >
                <ArtifactContext.Provider value={{searchState}}>
                    <ALEContext.Provider value={aleContext}>
                        <RALEContextProvider>
                            <IdiomaticProvider>
                                {rale}
                                {/*{debugDrawer}*/}
                                <TopNavigationBar {...TopNavigationBarProps} demo={demo}
                                                  handleClickDemo={this.handleClickDemo}/>
                                <Responsive
                                    innerRef={gridRef}
                                    width={width}
                                    breakpoints={gridLayoutFormatter.gridBreakpoints}
                                    layouts={gridLayouts}
                                    cols={gridLayoutFormatter.grid.cols}
                                    verticalCompact={true}
                                    compactType={'vertical'}
                                    autoSize={true}
                                    margin={appUnits.marginArray}
                                    containerPadding={appUnits.marginArray}
                                    rowHeight={_rowHeight}
                                    onResizeStart={this.onResizeStart}
                                    onResize={this.onResize}
                                    onResizeStop={this.onResizeStop}
                                    draggableHandle={`.${classes.draggable}`}
                                    onDragStart={this.onDragStart}
                                    onDrag={this.onDrag}
                                    onDragStop={this.onDragStop}
                                    onLayoutChange={this.onLayoutChange}
                                    onBreakpointChange={this.onBreakpointChange}
                                >
                                    <Paper
                                        elevation={1}
                                        key="scriptContainer"
                                        onMouseEnter={
                                            this.handleChangeEnterCellScriptContainer
                                        }
                                        onMouseLeave={
                                            this.handleChangeLeaveCellScriptContainer
                                        }
                                    >
                                        <Editor
                                            editorId={editorIds['js']}
                                            observeMouseEvents
                                            observeLiveExpressions={true}
                                            updateMonacoEditorLayout={
                                                this.updateMonacoEditorLayout(
                                                    editorIds['js']
                                                )
                                            }
                                            // errorState = {jsErrorState}
                                            locToMonacoRange={aleContext?.locToMonacoRange}
                                        />
                                        {hoveredCellKey === 'scriptContainer' ?
                                            null
                                            : <LanguageJavaScriptIcon
                                                className={classes.icon}
                                            />
                                        }
                                    </Paper>
                                    <Paper
                                        elevation={1}
                                        key="htmlContainer"
                                        onMouseEnter={
                                            this.handleChangeEnterCellHtmlContainer
                                        }
                                        onMouseLeave={
                                            this.handleChangeLeaveCellHtmlContainer
                                        }
                                    >
                                        <Editor editorId={editorIds['html']}
                                                updateMonacoEditorLayout={
                                                    this.updateMonacoEditorLayout(
                                                        editorIds['html']
                                                    )
                                                }
                                        />
                                        {hoveredCellKey === 'htmlContainer' ?
                                            null
                                            : <LanguageHtml5Icon
                                                className={classes.icon}
                                            />
                                        }
                                    </Paper>
                                    <Paper
                                        elevation={1}
                                        key="cssContainer"
                                        onMouseEnter={
                                            this.handleChangeEnterCellCssContainer
                                        }
                                        onMouseLeave={
                                            this.handleChangeLeaveCellCssContainer
                                        }
                                    >
                                        <Editor
                                            editorId={editorIds['css']}
                                            updateMonacoEditorLayout={
                                                this.updateMonacoEditorLayout(
                                                    editorIds['css']
                                                )
                                            }
                                        />
                                        {hoveredCellKey === 'cssContainer' ?
                                            null
                                            : <LanguageCss3Icon
                                                className={classes.icon}
                                            />
                                        }
                                    </Paper>
                                    <Paper
                                        elevation={1}
                                        key="debugContainer"
                                        className={classes.debugContainer}
                                        onMouseEnter={
                                            this.handleChangeEnterCellDebugContainer
                                        }
                                        onMouseLeave={
                                            this.handleChangeLeaveCellDebugContainer
                                        }
                                    >

                                        <DebugContainer
                                            tabOptions={tabOptions}
                                            handleChangeTab={this.handleChangeTab}
                                            handleChangePlaying={
                                                this.handleChangePlaying
                                            }
                                            isPlaying={isPlaying}
                                        />


                                        {isDebugLoading ?
                                            <span
                                                className={classes.loadingFeedback}
                                            >
                                        <MoreHorizIcon/>
                                    </span>
                                            : null}
                                    </Paper>
                                    <Paper
                                        elevation={1}
                                        key="playgroundContainer"
                                        className={classes.playgroundContainer}
                                        onMouseEnter={
                                            this.handleChangeEnterCellPlaygroundContainer
                                        }
                                        onMouseLeave={
                                            this.handleChangeLeaveCellPlaygroundContainer
                                        }
                                    >
                                        <DragHandleIcon
                                            className={classes.draggable}
                                        />
                                        <Playground
                                            autorunDelay={autorunDelay}
                                            editorIds={editorIds}
                                            isAutoLogActive={isAutoLogActive}
                                            // isGraphicalLocatorActive={
                                            //     isGraphicalLocatorActive
                                            // }
                                            // handleChangeGraphicalLocator={
                                            //     this.handleChangeGraphicalLocator
                                            // }
                                            resizeListener={this.setResizeListener}
                                            onUnsafeAct={this.handleUnsafeAct}
                                        />
                                        {hoveredCellKey === 'playgroundContainer' ?
                                            null
                                            : <TvIcon
                                                className={classes.icon}
                                            />
                                        }
                                    </Paper>
                                </Responsive>
                                <TraceControls
                                    isTopNavigationToggled={isTopNavigationToggled}
                                    autorunDelay={autorunDelay}
                                    setAutorunDelay={this.setAutorunDelay}
                                />
                                {demo ? <IdiomaticView open={demo} handleClose={this.closeDemo}/> : null}
                            </IdiomaticProvider>
                        </RALEContextProvider>
                    </ALEContext.Provider>
                </ArtifactContext.Provider>
            </PastebinContext.Provider>
        );
    }

    componentDidMount() {
        const {setGridLayoutCallbacks, pastebinConfigureLayout} = this.props;
        setGridLayoutCallbacks(
            this.resetGridLayout, this.getCurrentGridLayouts
        );

        pastebinConfigureLayout(
            this.restoreGridLayouts, this.getCurrentGridLayouts
        );
        this.onDebugContainerResizeEnd();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.handleAutomaticLayoutDebounced();
    }

    componentWillUnmount() {
        VisualQueryManager.visualQuery = [];
    }
}

Pastebin.propTypes = {
    classes: PropTypes.object.isRequired,
    dependencies: PropTypes.object.isRequired,
    setGridLayoutCallbacks: PropTypes.func.isRequired,
    disableGridAutomaticEditorLayout: PropTypes.bool,
    data: PropTypes.object.isRequired,
    changeData: PropTypes.func.isRequired,
    persistablePath: PropTypes.string.isRequired
};

export default connect(
    mapStateToProps,
    mapDispatchToProps)(
    withStyles(styles, {withTheme: true})(
        SizeProvider(
            objectExplorersAcceptor(
                withPersistence(Pastebin)
            )
        )
    )
);
