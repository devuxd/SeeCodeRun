import React, {useCallback, useEffect, useMemo, useState,} from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import TableChartIcon from '@material-ui/icons/TableChart';
import TableChartOutlinedIcon from '@material-ui/icons/TableChartOutlined';
import {Inspector, ObjectName, ObjectValue} from 'react-inspector';
import isArrayLikeObject from 'lodash/isArrayLikeObject';
import isObjectLike from 'lodash/isObjectLike';

import {configureLocalMemo, isNode} from '../utils/scrUtils';
import {ThemeContext} from '../themes';
import GraphicalQuery from '../components/GraphicalQuery';
import {VisualQueryManager} from '../seecoderun/modules/VisualQueryManager';
// import {autoLogName} from '../seecoderun/modules/AutoLog';

const TIMEOUT_DEBOUNCE_MS = 100;

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


export const ExplorerTooltip = withStyles((theme) => ({
    tooltip: {
        backgroundColor: 'transparent',
        maxWidth: 800,
        minHeight: theme.spacing(2.5),
        border: 'none',
        padding: 0,
        margin: 0,
        marginLeft: theme.spacing(-0.25),
    },
}))(Tooltip);

export const ExplorerTooltipContainer = withStyles((theme) => ({
    root: {
        padding: theme.spacing(0.5),
        paddingRight: theme.spacing(1),
    },
}))(Paper);

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
export const ObjectPreview = (withStyles(styles)(
    ({
         classes,
         data,
         maxProperties,
         compact,
         expressionType,
         iconTooltipDelay = 300
     }) => {
        const liveRef = currentLiveObjectNodeRenderer?.parseLiveRefs(data);
        if (!liveRef || liveRef.isLive) {
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
                        <ExplorerTooltip
                            title={
                                <ExplorerTooltipContainer>
                                    empty string
                                </ExplorerTooltipContainer>
                            }
                            enterDelay={iconTooltipDelay}
                        >
                            <span
                                className={classes.emptyStringValue}>{'E'}
                            </span>
                        </ExplorerTooltip>);
                }
            } else {

                if (
                    object !== NaN.toString() &&
                    object?.toString() === NaN.toString()
                ) {
                    return (
                        <ExplorerTooltip
                            title={
                                <ExplorerTooltipContainer>
                                    not a number
                                </ExplorerTooltipContainer>
                            }
                            enterDelay={iconTooltipDelay}
                        >
                            <span
                                className={classes.nanValue}>{'7'}</span>
                        </ExplorerTooltip>
                    );
                }

                switch (object) {
                    case undefined :
                        return (
                            <ExplorerTooltip
                                title={
                                    <ExplorerTooltipContainer>
                                        undefined
                                    </ExplorerTooltipContainer>
                                }
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
                            </ExplorerTooltip>);
                    case null:
                        return (
                            <ExplorerTooltip
                                title={
                                    <ExplorerTooltipContainer>
                                        null
                                    </ExplorerTooltipContainer>
                                }
                                enterDelay={iconTooltipDelay}
                            >
                            <span
                                className={classes.undefinedValue}>{'N'}</span>
                            </ExplorerTooltip>
                        );
                    case true:
                        return (
                            <ExplorerTooltip
                                title={
                                    <ExplorerTooltipContainer>
                                        true
                                    </ExplorerTooltipContainer>
                                }
                                enterDelay={iconTooltipDelay}
                            >
                            <span
                                className={classes.trueValue}>{'T'}</span>
                            </ExplorerTooltip>
                        );
                    case false:
                        return (
                            <ExplorerTooltip
                                title={
                                    <ExplorerTooltipContainer>
                                        false
                                    </ExplorerTooltipContainer>
                                }
                                enterDelay={iconTooltipDelay}
                            >
                            <span
                                className={classes.falseValue}>{'F'}</span>
                            </ExplorerTooltip>
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

export const ObjectRootLabelPre = (
    {
        name,
        data,
        compact,
        expressionType,
        inspectorCompactTheme,
        inspectorTheme,
        disableCompactTheme,
    }
) => {
    const renderer = useCallback(
        () => (
            <ObjectRootLabeler
                name={name} data={data} compact={compact}
                expressionType={expressionType}
            />
        ),
        [name, data]
    );
    return <Inspector
        theme={disableCompactTheme ? inspectorTheme : inspectorCompactTheme}
        data={null}
        nodeRenderer={renderer}
    />
};

export const ObjectRootLabel = props => (<ThemeContext.Consumer>
    {context => <ObjectRootLabelPre {...context} {...props}/>}
</ThemeContext.Consumer>);

const ObjectRootLabeler = ({name, data, compact, expressionType}) => {
    if (typeof name === 'string') {
        return (
            <span>
        <ObjectName name={name}/>
        <span>: </span>
        <ObjectPreview
            data={data}
            compact={compact}

            expressionType={expressionType}
        />
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
const liveObjectNodeRenderMemo = configureLocalMemo();

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

    liveObjectNodeRenderer.render = liveObjectNodeRenderMemo(
        () => ({depth, data, ...rest}) => {
            //todo handle array and obj
            const liveRef = useMemo(
                () => liveObjectNodeRenderer.parseLiveRefs(
                    data, liveObjectNodeRenderer.hideLiveRefs
                ),
                [data, liveObjectNodeRenderer]
            );
            const isRoot = depth === 0;
            const objectLabel = isRoot ?
                <ObjectRootLabeler data={liveRef.data} {...rest}/>
                : <ObjectLabel data={liveRef.data} {...rest}/>;

            const liveData = useMemo(() => {
                let fData = liveRef.data;
                if (liveRef.data && liveRef.data.liveRef) {
                    fData = {...liveRef.data};
                    delete fData.liveRef;
                }
                return fData;
            }, [liveRef]);

            return liveRef.isLive ?
                isRoot ?
                    objectLabel :
                    <ul style={ulStyle}>
                        <Inspector data={liveData}
                                   nodeRenderer={liveObjectNodeRenderer.render}
                                   windowRef={liveObjectNodeRenderer.getWindowRef()}
                                   {...rest}
                        />
                    </ul>
                : objectLabel;
        },
        [liveObjectNodeRenderer]
    );

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

const tableChartIconStyle = {
    position: 'absolute',
    right: 0,
    top: 0,
    marginTop: '-0.25rem',
    marginRight: '-0.25rem',
    fontSize: '0.5rem',
    cursor: 'pointer',
    opacity: 1,
};

const tableOn = (
    <TableChartIcon style={tableChartIconStyle}/>
);

const tableOff = (
    <TableChartOutlinedIcon
        style={{
            ...tableChartIconStyle,
            opacity: 0.2,
        }}/>
);

const GraphicalInspectorWrapper = (
    {
        containerClassName,
        connectorClassName,
        overlayClassName,
        outputRefs,
        visualIds,
        selected,
        inspectorProps,
        isPreview,
        isGraphical,
    }
) => {

    const objectInspector = (isPreview ?
        <ObjectRootLabel
            data={inspectorProps.data}
            compact={false}
            iconify={false}
            disableCompactTheme
        />
        : <Inspector
            {...inspectorProps}
        />);

    return (isGraphical ?
            <div
                className={containerClassName}
            >
                <div
                    className={connectorClassName}
                />
                <div className={overlayClassName}>
                    <GraphicalQuery
                        outputRefs={outputRefs}
                        visualIds={visualIds}
                        selected={selected}
                    />
                </div>
                {objectInspector}
            </div>
            : objectInspector
    );
};

const inspectorTableIconContainerStyle = {position: 'relative'};

const MemoizedInspector = ((
    {
        classes,
        variant,
        data,
        windowRef,
        nodeRenderer,
        outputRefs,
        inspectorTheme,
        inspectorGraphicalTheme,
        showNonenumerable,
        isLazyLoading,
        isPreviewFirst,
    }
) => {
    const isMarker = variant === 'marker';
    const [isFastLoading, setIsFastLoading] = useState(!isLazyLoading);
    const [isPreview, setIsPreview] = useState(isPreviewFirst);
    const [isTable, setIsTable] = useState(false);
    const handleChangeIsPreview = useCallback(
        () => setIsPreview(false)
        , [setIsPreview]
    );
    const handleToggleTable = useCallback(
        () => setIsTable(v => !v)
        , [setIsTable]
    );
    const isSupportTable = useMemo(
        () => isArrayLikeObject(data) || isObjectLike(data)
        , [data]
    );

    const isGraphical = useMemo(
        () => isNode(data, windowRef) || (outputRefs?.length),
        [outputRefs, data, windowRef, outputRefs]
    );

    const inspectorPropsObject = useMemo(
        () => {
            const objectProps = {
                theme: isGraphical ? inspectorGraphicalTheme : inspectorTheme,
                data,
                nodeRenderer,
                showNonenumerable,
            };

            if (isGraphical) {
                const fData = data.liveRef ? {...data} : data;
                delete fData.liveRef;
                objectProps.data = fData;
            }

            return objectProps;
        },
        [
            isGraphical, inspectorTheme, inspectorGraphicalTheme,
            data, nodeRenderer, showNonenumerable
        ]
    );

    inspectorPropsObject.table = isTable;

    const inspectorPropsGraphical = useMemo(
        () => {
            let graphicalProps = {};
            if (isGraphical) {
                const theRefs = outputRefs?.length ? outputRefs : [data];
                const isSelected =
                    !!theRefs.find(el => isGraphicalElementSelected(el));
                const visualIds = getVisualIdsFromRefs(theRefs);
                graphicalProps = {
                    containerClassName:
                        isMarker ? classes.containerMarker : classes.container,
                    connectorClassName:
                        isMarker ? classes.connectorMarker : classes.connector,
                    overlayClassName:
                        isMarker ? classes.overlayMarker : classes.overlay,
                    outputRefs: theRefs,
                    visualIds,
                    selected: isSelected
                };
            }
            return graphicalProps
        }, [
            isGraphical,
            isMarker,
            classes,
            data,
            outputRefs,
        ]);

    useEffect(
        () => {
            const tid = setTimeout(
                () => setIsFastLoading(true),
                TIMEOUT_DEBOUNCE_MS
            );
            return () => clearTimeout(tid);
        },
        [setIsFastLoading]
    );

    return (
        <div
            style={inspectorTableIconContainerStyle}
            onMouseEnter={handleChangeIsPreview}
        >
            {isFastLoading &&
            <GraphicalInspectorWrapper
                isPreview={isPreview}
                isGraphical={isGraphical}
                {...inspectorPropsGraphical}
                inspectorProps={inspectorPropsObject}
            />}
            {isSupportTable &&
            <div
                onClick={handleToggleTable}>{isTable ? tableOn : tableOff}
            </div>
            }
        </div>
    );

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


const ObjectExplorer = (
    {
        data,
        objectNodeRenderer,
        expressionId,
        outputRefs,
        ...rest
    }
) => {
    const parseLiveRefs = objectNodeRenderer?.parseLiveRefs;
    const liveRef = useMemo(
        () => parseLiveRefs?.(data),
        [parseLiveRefs, data]
    );
    return (liveRef && !liveRef.isLive ?
            <EnhancedInspector
                key={expressionId}
                data={liveRef.data}
                nodeRenderer={objectNodeRenderer.render}
                windowRef={objectNodeRenderer.getWindowRef()}
                showNonenumerable={false}
                outputRefs={outputRefs}
                {...rest}
            />
            : null
    );
};

ObjectExplorer.propTypes = {
    data: PropTypes.any,
    name: PropTypes.string,
    table: PropTypes.bool,
    outputRefs: PropTypes.array,
    variant: PropTypes.oneOf(["marker", "default"]),
};

export default ObjectExplorer;
