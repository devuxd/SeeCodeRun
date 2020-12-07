import React, {memo, useState, useMemo, useCallback} from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import TableChartIcon from '@material-ui/icons/TableChart';
import TableChartOutlinedIcon from '@material-ui/icons/TableChartOutlined';
import {
    Inspector, ObjectValue, ObjectName
} from 'react-inspector';
import isArrayLikeObject from 'lodash/isArrayLikeObject';
import isObjectLike from 'lodash/isObjectLike';
// import Tooltip from '@material-ui/core/Tooltip';
// import deepDiff from 'deep-diff';

import {configureLocalMemo, isNode} from '../utils/scrUtils';
import {ThemeContext} from '../themes';
// import {HighlightPalette} from '../containers/LiveExpressionStore';
import GraphicalQuery from '../components/GraphicalQuery';
import {VisualQueryManager} from "../containers/Pastebin";

const {getVisualIdsFromRefs, isGraphicalElementSelected} = VisualQueryManager;

//start
// https://github.com/xyc/react-inspector/tree/master/src/object-inspector
/* NOTE: Chrome console.log is italic */
const styles = theme => ({
    preview: {
        fontStyle: 'italic',
    },
    objectClassName: {
        fontSize: '80%',
    },
    objectBraces: {
        fontFamily: 'Menlo, monospace',
        fontWeight: 'bold',
        fontStyle: 'normal',
        // color: 'white',
        color: theme.palette.mode === 'light' ?
            'rgb(136, 19, 145)' : 'rgb(227, 110, 236)',
        fontSize: '110%',
    },
    arrayBrackets: {
        fontFamily: 'Menlo, monospace',
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: theme.palette.mode === 'light' ?
            'rgb(28, 0, 207)' : 'rgb(153, 128, 255)',
        // fontSize: '110%',
    },
    stringQuote: {
        fontWeight: 'bold',
        fontStyle: 'normal',
        fontSize: '110%',
        color: theme.palette.mode !== 'light' ?
            'rgb(196, 26, 22)' : 'rgb(233, 63, 59)',
    },
    stringValue: {
        fontWeight: 100,
        // color: theme.palette.mode === 'light' ?
        // 'rgb(196, 26, 22)' : 'rgb(233, 63, 59)',
    },
    emptyStringValue: {
        fontFamily: 'Menlo, monospace',
        color: 'white',
        fontWeight: 'bold',
        backgroundColor: theme.palette.action.disabled,
    },
    booleanValue: {
        fontFamily: 'Menlo, monospace',
        fontSize: '90%',
        fontWeight: 'bold',
    },
    numberValue: {},
    undefinedValue: {
        fontFamily: 'Menlo, monospace',
        color: 'white',
        fontWeight: 'bold',
        backgroundColor: theme.palette.mode === 'light' ?
            'rgb(196, 26, 22)' : 'rgb(233, 63, 59)',
    },
    trueValue: {
        fontFamily: 'Menlo, monospace',
        color: 'white',
        fontWeight: 'bold',
        backgroundColor: theme.palette.mode === 'light' ?
            'rgb( 26,56, 172)' : 'rgb(63,86,  209)',
    },
    falseValue: {
        fontFamily: 'Menlo, monospace',
        color: 'white',
        fontWeight: 'bold',
        backgroundColor: theme.palette.mode === 'light' ?
            'rgb( 26, 22,196)' : 'rgb( 63, 59,233)',
    },
    nanValue: {
        fontFamily: 'Menlo, monospace',
        color: 'white',
        fontWeight: 'bold',
        background: `linear-gradient(-120deg, ${
            theme.palette.mode === 'light' ?
                'rgb( 260, 22,196)' : 'rgb( 263, 59,233)'
        } 0%, ${
            theme.palette.mode === 'light' ?
                'rgb( 260, 22,196)' : 'rgb( 263, 59,233)'
        } 46.5%, white 46.5%, white 54.5%, ${
            theme.palette.mode === 'light' ?
                'rgb( 260, 22,196)' : 'rgb( 263, 59,233)'
        } 54.5%,${
            theme.palette.mode === 'light' ?
                'rgb( 260, 22,196)' : 'rgb( 263, 59,233)'
        } 100%)`,
    },
    undefinedValueWarning: {
        fontFamily: 'Menlo, monospace',
        color: 'white',
        fontWeight: 'bold',
        backgroundColor: 'grey',
    },
});

/**
 * A preview of the object
 */
// ObjectPreview intercepts
export const hasOwnTooltip = datum => !(
    datum === ""
    || datum === null
    || datum === undefined
    || (datum !== NaN.toString() && datum?.toString() === NaN.toString())
    || datum === true
    || datum === false
);
let currentLiveObjectNodeRenderer = null;
export const ObjectPreview = memo(withStyles(styles)(
    ({
         classes,
         data,
         maxProperties,
         compact,
         expressionType,
         iconTooltipDelay = 300
     }) => {
        const liveRef = currentLiveObjectNodeRenderer.parseLiveRefs(data);
        if (liveRef.isLive) {
            return null;
        }

        const object = data;
        if (
            typeof object !== 'object' ||
            object === null ||
            object instanceof Date ||
            object instanceof RegExp
        ) {
            if (typeof object === 'string') {
                if (object.length) {
                    return (
                        <span className={classes.stringValue}>{object}</span>);
                } else {
                    return (
                        <Tooltip
                            title="empty string"
                            enterDelay={iconTooltipDelay}
                        >
                            <span
                                className={classes.emptyStringValue}>{'E'}
                            </span>
                        </Tooltip>);
                }
            } else {

                if (
                    object !== NaN.toString() &&
                    object?.toString() === NaN.toString()
                ) {
                    return (
                        <Tooltip
                            title="not a number"
                            enterDelay={iconTooltipDelay}
                        >
                            <span
                                className={classes.nanValue}>{'7'}</span>
                        </Tooltip>
                    );
                }

                switch (object) {
                    case undefined :
                        return (<Tooltip
                            title="undefined"
                            enterDelay={iconTooltipDelay}
                        >
                    <span
                        className={
                            expressionType === 'VariableDeclarator'
                            || expressionType === 'AssignmentExpression' ?
                                classes.undefinedValue
                                : classes.undefinedValueWarning}
                    >
                        {'U'}
                        </span>
                        </Tooltip>);
                    case null:
                        return (
                            <Tooltip
                                title="null"
                                enterDelay={iconTooltipDelay}
                            >
                            <span
                                className={classes.undefinedValue}>{'N'}</span>
                            </Tooltip>
                        );
                    case true:
                        return (
                            <Tooltip
                                title="true"
                                enterDelay={iconTooltipDelay}
                            >
                            <span
                                className={classes.trueValue}>{'T'}</span>
                            </Tooltip>
                        );
                    case false:
                        return (
                            <Tooltip
                                title="false"
                                enterDelay={iconTooltipDelay}
                            >
                            <span
                                className={classes.falseValue}>{'F'}</span>
                            </Tooltip>
                        );
                    default:
                        return <ObjectValue object={object}/>;
                }
            }

        }

        if (Array.isArray(object)) {
            return (<span className={classes.preview}>
                <span className={classes.arrayBrackets}>{'['}</span>
                <span>
                {intersperse(
                    object.map(
                        (element, index) =>
                            <ObjectValue key={index} object={element}/>),
                    ', ',
                )}
                </span>
                <span className={classes.arrayBrackets}>{']'}</span>
        </span>);
        } else {
            let propertyNodes = [];
            for (let propertyName in object) {
                if (object.hasOwnProperty(propertyName)) {
                    let ellipsis;
                    if (
                        propertyNodes.length === maxProperties - 1 &&
                        Object.keys(object).length > maxProperties
                    ) {
                        ellipsis = <span key={'ellipsis'}>…</span>;
                    }
                    propertyNodes.push(
                        <span key={propertyName}>
            <ObjectName name={propertyName || `""`}/>
            :&nbsp;
                            <ObjectValue object={object[propertyName]}/>
                            {ellipsis}
          </span>,
                    );
                    if (ellipsis) break;
                }
            }
            const objectClassName = compact ?
                object.constructor.name === 'Object' ?
                    '' : object.constructor.name : object.constructor.name;
            return (
                <span className={classes.preview}>
                <span
                    className={classes.objectClassName}>
                    {`${objectClassName} `}
                </span>
                <span className={classes.objectBraces}>{'{'}</span>
                <span>{intersperse(propertyNodes, ', ')}</span>
                <span className={classes.objectBraces}>{'}'}</span>
            </span>
            );
        }
    }));

ObjectPreview.propTypes = {
    /**
     * max number of properties shown in the property view
     */
    maxProperties: PropTypes.number,
    compact: PropTypes.bool,
};
ObjectPreview.defaultProps = {
    maxProperties: 5,
};

/* intersperse arr with separator */
function intersperse(arr, sep) {
    if (arr.length === 0) {
        return [];
    }

    return arr.slice(1)
        .reduce((xs, x) => xs.concat([sep, x]), [arr[0]]);
}

export const ObjectRootLabel = ({name, data, compact, expressionType}) => {
    if (typeof name === 'string') {
        return (
            <span>
        <ObjectName name={name}/>
        <span>: </span>
        <ObjectPreview data={data} compact={compact}
                       expressionType={expressionType}/>
      </span>
        );
    } else {
        return <ObjectPreview data={data} compact={compact}
                              expressionType={expressionType}/>;
    }
};

/**
 * if isNonenumerable is specified, render the name dimmed
 */
export const ObjectLabel = ({name, data, isNonenumerable}) => {
    const object = data;

    return (
        <span>
      <ObjectName name={name} dimmed={isNonenumerable}/>
      <span>: </span>
      <ObjectValue object={object}/>
    </span>
    );
};

ObjectLabel.propTypes = {
    /** Non enumerable object property will be dimmed */
    isNonenumerable: PropTypes.bool,
};

ObjectLabel.defaultProps = {
    isNonenumerable: false,
};
// end https://github.com/xyc/react-inspector/tree/master/src/object-inspector

const ulStyle = {marginLeft: -12, marginTop: -12};

const liveObjectNodeRendererMemo = configureLocalMemo();

export const createLiveObjectNodeRenderer = (traceProvider) => {
    const liveObjectNodeRenderer = liveObjectNodeRendererMemo(() => ({
            getWindowRef: () => traceProvider.trace.window,
            handleChange: null,
            expandPathsState: null,
            getExpandedPaths: (expandPathsState) => {
                if (expandPathsState) {
                    return Object
                        .keys(expandPathsState)
                        .filter(path => expandPathsState[path]);
                } else {
                    return [];
                }
            },
            hideLiveRefs: false,
            parseLiveRefs: traceProvider.trace.parseLiveRefs,
        })
        , [traceProvider]);

    liveObjectNodeRenderer.render = (props) => {
        const {depth, data, ...rest} = props;
        // const paths = liveObjectNodeRenderer.expandPathsState || {};
        // paths[path] = expanded;
        // if (expanded) {
        //   clearTimeout(this.leto);
        //   this.leto = setTimeout(() => {
        //     this.objectNodeRenderer.handleChange
        //     && this.objectNodeRenderer.handleChange();
        //   }, 500);
        // }
        //todo handle array and obj
        const liveRef = traceProvider.trace.parseLiveRefs(
            data, liveObjectNodeRenderer.hideLiveRefs
        );
        const isRoot = depth === 0;
        const objectLabel = isRoot ?
            <ObjectRootLabel data={liveRef.data} {...rest}/>
            : <ObjectLabel data={liveRef.data} {...rest}/>;

        let fData = liveRef.data;
        if (liveRef.data && liveRef.data.liveRef) {
            fData = {...liveRef.data};
            delete fData.liveRef;
        }

        return liveRef.isLive ?
            isRoot ?
                objectLabel :
                <ul style={ulStyle}>
                    <Inspector data={fData}
                               nodeRenderer={liveObjectNodeRenderer.render}
                               windowRef={liveObjectNodeRenderer.getWindowRef()}
                               {...rest}
                    />
                </ul>
            : objectLabel;
    };
    currentLiveObjectNodeRenderer = liveObjectNodeRenderer;
    return currentLiveObjectNodeRenderer;
};

const inspectorStyles = theme => ({
    container: {
        paddingLeft: theme.spacing(4.5),
        position: 'relative'
    },
    containerMarker: {
        paddingLeft: theme.spacing(2.5),
        position: 'relative'
    },
    overlay: {
        maxWidth: theme.spacing(4),
        overflow: 'auto',
        position: 'absolute',
        marginTop: theme.spacing(-0.5),
        left: 0,
    },
    overlayMarker: {
        maxWidth: theme.spacing(4),
        overflow: 'auto',
        position: 'absolute',
        marginTop: theme.spacing(-0.5),
        marginLeft: theme.spacing(-2),
        left: 0,
    },
    connector: {
        maxWidth: theme.spacing(4.25),
        width: theme.spacing(4.25),
        overflow: 'auto',
        position: 'absolute',
        paddingTop: 0,
        left: 0,
        borderBottom:
            `${theme.spacing(0.25)} dotted ${theme.palette.secondary.main}`,
        paddingBottom: theme.spacing(0.75),
    },
    connectorMarker: {
        maxWidth: theme.spacing(2.25),
        width: theme.spacing(2.25),
        overflow: 'auto',
        position: 'absolute',
        paddingTop: 0,
        left: 0,
        borderBottom:
            `${theme.spacing(0.25)} dotted ${theme.palette.secondary.main}`,
        paddingBottom: theme.spacing(0.75),
    }
});


const tableOn =
    (<TableChartIcon style={{
        position: 'absolute', right: 2, top: 2,
        fontSize: '0.5rem',
        opacity: 1,
        cursor: 'pointer',
    }}/>);
const tableOff =
    (<TableChartOutlinedIcon
        style={{
            position: 'absolute', right: 2, top: 2,
            fontSize: '0.5rem',
            opacity: 0.08,
            cursor: 'pointer',
        }}/>);


const MemoizedInspector = (({
                                classes,
                                variant,
                                data,
                                windowRef,
                                nodeRenderer,
                                outputRefs,
                                inspectorTheme,
                                showNonenumerable,
                            }) => {
    const isMarker = variant === 'marker';
    const [isTable, setIsTable] = useState(false);
    const handleToggleTable = useCallback(
        () => setIsTable(!isTable)
        , [setIsTable, isTable]);
    const isSupportTable = useMemo(
        () => isArrayLikeObject(data) || isObjectLike(data)
        , [data]
    );

    const inspectorMemo = useMemo(() => {

        if (isNode(data, windowRef) || (outputRefs && outputRefs.length)) {
            const theRefs = outputRefs && outputRefs.length ?
                outputRefs : [data];
            const isSelected = !!theRefs
                .find(el => isGraphicalElementSelected(el));
            const visualIds = getVisualIdsFromRefs(theRefs);

            const fData = data.liveRef ? {...data} : data;
            delete fData.liveRef;
            return (<div className={
                isMarker ? classes.containerMarker : classes.container
            }>
                <div className={
                    isMarker ? classes.connectorMarker : classes.connector
                }/>
                <div className={
                    isMarker ? classes.overlayMarker : classes.overlay
                }>
                    <GraphicalQuery
                        outputRefs={theRefs}
                        visualIds={visualIds}
                        selected={isSelected}
                    />
                </div>

                <Inspector
                    theme={inspectorTheme}
                    data={fData}
                    nodeRenderer={nodeRenderer}
                    showNonenumerable={showNonenumerable}
                    table={isTable}
                />
            </div>);
        }

        return <Inspector
            theme={inspectorTheme}
            data={data}
            nodeRenderer={nodeRenderer}
            showNonenumerable={showNonenumerable}
            table={isTable}
        />;
    }, [
        isMarker,
        classes,
        data,
        windowRef,
        nodeRenderer,
        outputRefs,
        inspectorTheme,
        showNonenumerable,
        isTable,
    ]);

    return (<>{inspectorMemo}
        {isSupportTable &&
        <div
            onClick={handleToggleTable}>{isTable ? tableOn : tableOff}
        </div>
        }
    </>);

});
export const EnhancedInspector = (withStyles(inspectorStyles)((
    {
        classes,
        variant,
        data,
        windowRef,
        nodeRenderer,
        outputRefs,
        showNonenumerable
    }
) => {

    return <ThemeContext.Consumer>
        {context => {
            return (<MemoizedInspector
                {...{
                    classes,
                    variant,
                    data,
                    windowRef,
                    nodeRenderer,
                    outputRefs,
                    showNonenumerable,
                    ...context
                }}
            />);
        }}
    </ThemeContext.Consumer>;
}));

EnhancedInspector.propTypes = {
    data: PropTypes.any,
    name: PropTypes.string,
    table: PropTypes.bool,
    outputRefs: PropTypes.array,
};

// const diffToExpandPaths = (prevData, data) => {
//     return (deepDiff(prevData, data) || []).map(change => {
//         return change.path ?
//         change.path.reduce((a, c) => `${a}.${c}`, '$') : '$';
//     });
// };

class ObjectExplorer extends React.Component {
    state = {
        isInit: false,
        prevData: null,
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const {data} = nextProps;
        const {prevData} = prevState;

        if (data === prevData) {
            return null;
        }

        return {
            isInit: true,
            prevData: data,
        };
    }


    render() {
        const {
            theme, data, objectNodeRenderer, expressionId, handleChange,
            outputRefs, ...rest
        } = this.props;
        if (!objectNodeRenderer) {
            return null;
        }
        const liveRef = objectNodeRenderer.parseLiveRefs(data);
        return (!liveRef.isLive && <EnhancedInspector
            key={expressionId}
            data={liveRef.data}
            nodeRenderer={objectNodeRenderer.render}
            windowRef={objectNodeRenderer.getWindowRef()}
            showNonenumerable={false}
            outputRefs={outputRefs}
            {...rest}
        />);
    }
}

ObjectExplorer.propTypes = {
    data: PropTypes.any,
    name: PropTypes.string,
    table: PropTypes.bool,
    outputRefs: PropTypes.array,
    variant: PropTypes.oneOf(["marker", "default"]),
};

export default React.memo(ObjectExplorer);
