import {
    useMemo, useCallback, useState, useContext, memo, useEffect,
} from 'react';
/** @jsxImportSource @emotion/react */
import {jsx} from '@emotion/react';
import PropTypes from 'prop-types';

import {withStyles} from '@mui/styles';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

import TableChartIcon from '@mui/icons-material/TableChart';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';


import isArrayLikeObject from 'lodash/isArrayLikeObject';
import isObjectLike from 'lodash/isObjectLike';

import ALEContext from "./ALEContext";
import {useResizeAndOverflowDetector} from "../../../utils/reactUtils";


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
        fontSize: '105%',
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
        fontSize: '105%',
        color: theme.palette.mode !== 'light' ?
            'rgb(196, 26, 22)' : 'rgb(233, 63, 59)',
    },
    // stringValue: {
    //    fontWeight: 100,
    //    // color: theme.palette.mode === 'light' ?
    //    // 'rgb(196, 26, 22)' : 'rgb(233, 63, 59)',
    // },
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


export const ExplorerTooltip = withStyles(({spacing}) => ({
    tooltip: {
        backgroundColor: 'transparent',
        maxWidth: 800,
        minHeight: spacing(2.5),
        border: 'none',
        padding: 0,
        margin: 0,
        marginLeft: spacing(-0.25),
        marginTop: -14,
    },
}))(Tooltip);

export const ExplorerTooltipContainer = withStyles(({spacing}) => ({
    root: {
        position: "relative",
        marginTop: -14,
        padding: spacing(0.5),
        paddingRight: spacing(1),
        overflow: "scroll",
    },
}))(Paper);


//from react-inspector/src/utils/objectPrototype
const hasOwnProperty = Object.prototype.hasOwnProperty;

//from react-inspector/src/utils/propertyUtils
const getPropertyValue = (object, propertyName) => {
    const propertyDescriptor = Object.getOwnPropertyDescriptor(
        object, propertyName
    );
    if (propertyDescriptor?.get) {
        try {
            return propertyDescriptor.get()
        } catch {
            return propertyDescriptor.get
        }
    }

    return object[propertyName];
};

/* intersperse arr with separator */
const intersperse = (arr, sep) => {
    if (arr.length === 0) {
        return [];
    }

    return arr.slice(1).reduce((xs, x) => xs.concat([sep, x]), [arr[0]]);
};

// const isTypeNaN = (datum) => {
//    return (datum !== NaN.toString() && datum?.toString() === NaN.toString());
// };
const nan = [NaN];
const isTypeNaN = (datum) => {
    return nan.includes(datum);
};
// prevent other tooltip providers from duplicating tooltips
export const hasOwnTooltip = datum => (
    datum === ""
    || datum === null
    || datum === undefined
    || isTypeNaN(datum)
    || datum === true
    || datum === false
);


const defaultEllipsis = (<span key="ellipsis">…</span>);

const groupCountStyle = ({palette, spacing}) => ({
    root: {
        paddingLeft: spacing(.125),
        fontStyle: "italic",
        fontSize: "80%",
        color: palette.text.secondary
    }
});

const GroupCount = withStyles(groupCountStyle)(({classes, count}) => {
    return (<span
        className={classes.root}>x{count}</span>);
});

const makePreviewArray = (
    array, maxProperties, mapPreviewComponent, ellipsis
) => {
    const previewArray = array.slice(0, maxProperties).map(mapPreviewComponent);

    if (array.length > maxProperties) {
        previewArray.push(ellipsis);
    }
    return previewArray;
};

const makeGroupedPreviewArray = (
    array, maxProperties, mapPreviewComponent, ellipsis
) => {
    let currentElement = null;
    let needsEllipsis = false;
    const previewArray = [];
    for (let i in array) {
        const element = array[i];
        if (!currentElement || currentElement.element !== element) {
            currentElement = {element, count: 1};
            if (previewArray.length <= maxProperties) {
                previewArray.push(currentElement);
            } else {
                needsEllipsis = true;
                break;
            }
        } else {
            currentElement.count++
        }
    }

    const result = previewArray.map(mapPreviewComponent);
    if (needsEllipsis) {
        result.push(ellipsis);
    }
    return result;
};

const PreviewArray = memo((
    {
        disableListGroup, object, maxProperties, isMaxPreviewDepth,
        ObjectValue, previewDepth, ellipsis, styles, classes,
        ...objectProps
    }
) => {
    const previewArray = disableListGroup ? makePreviewArray(
        object,
        maxProperties,
        (element, index) => (
            isMaxPreviewDepth ? <ObjectValue key={index} object={element}/>
                : <ObjectPreview key={index} {...objectProps} data={element}
                                 previewDepth={previewDepth + 1}/>
        ),
        ellipsis
    ) : makeGroupedPreviewArray(
        object,
        maxProperties,
        ({element, count}, index) => {
            const preview = isMaxPreviewDepth ?
                <ObjectValue key={index} object={element}/>
                : <ObjectPreview key={index} {...objectProps} data={element}
                                 previewDepth={previewDepth + 1}/>;
            return (
                count > 1 ? <span key={index}>{preview}<GroupCount
                        count={count}/></span>
                    : preview
            );
        },
        ellipsis
    );
    const arrayLength = object.length;
    return (
        <>
        <span css={styles.objectDescription}>
          {arrayLength === 0 ? `` : `(${arrayLength})\xa0`}
        </span>
            <span css={styles.preview}>
                  <span className={classes.arrayBrackets}>[</span>
                {intersperse(previewArray, ', ')}
                <span className={classes.arrayBrackets}>]</span>
               </span>
        </>
    );
});

/**
 * A preview of the object
 */
export const ObjectPreview = memo(withStyles(styles)(
    (props) => {
        const {
            classes,
            data,
            liveData,
            expressionType,
            iconTooltipDelay = 300,
            disableListGroup = false,
            arrayMaxProperties,
            objectMaxProperties,
            ellipsis = defaultEllipsis,
            previewDepth = 0,
            maxPreviewDepth = 1,
        } = props;
        const {useStyles, ObjectValue, ObjectName} = useContext(ALEContext);
        const styles = useStyles?.('ObjectPreview');

        const object = liveData ? liveData.getSnapshot() : data;
        const {isGraphical} = liveData ?? {};
        if (
            typeof object !== 'object' ||
            object === null ||
            object instanceof Date ||
            object instanceof RegExp
        ) {
            if (typeof object === 'string') {
                if (object.length) {
                    return <ObjectValue object={object}/>;
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

                if (isTypeNaN(object)) {
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
                                className={classes.nanValue}>{'1'}</span>
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
                        const objectValue = <ObjectValue object={object}/>;
                        ;
                        if (isGraphical) {
                            return <span>{objectValue}</span>;
                        }
                        return objectValue;
                }
            }

        }


        const isMaxPreviewDepth = previewDepth > maxPreviewDepth;

        if (Array.isArray(object)) {
            const maxProperties =
                arrayMaxProperties ?? styles.arrayMaxProperties;
            return <PreviewArray
                {...{
                    ...props,
                    disableListGroup, object, maxProperties, isMaxPreviewDepth,
                    ObjectValue, previewDepth, ellipsis, styles, classes,
                }}
            />;
        } else {
            const maxProperties = objectMaxProperties ?? styles.objectMaxProperties;
            let propertyNodes = [];
            for (const propertyName in object) {
                if (hasOwnProperty.call(object, propertyName)) {
                    let ellipsis;
                    if (
                        propertyNodes.length === maxProperties - 1 &&
                        Object.keys(object).length > maxProperties
                    ) {
                        ellipsis = <span key={'ellipsis'}>…</span>;
                    }

                    const propertyValue = getPropertyValue(object, propertyName);
                    const preview = isMaxPreviewDepth ?
                        <ObjectValue object={propertyValue}/>
                        : <ObjectPreview {...props} data={propertyValue}
                                         previewDepth={previewDepth + 1}/>;
                    propertyNodes.push(
                        <span key={propertyName}>
            <ObjectName name={propertyName || `""`}/>
            :&nbsp;
                            {preview}
                            {ellipsis}
          </span>
                    );
                    if (ellipsis) break;
                }
            }

            const objectConstructorName = object.constructor ?
                object.constructor.name : 'Object';

            return (
                <>
              <span css={styles.objectDescription}>
                 {objectConstructorName === 'Object' ?
                     '' : `${objectConstructorName} `}
              </span>
                    <span css={styles.preview}>
                <span className={classes.objectBraces}>{'{'}</span>
                        {intersperse(propertyNodes, ', ')}
                        <span className={classes.objectBraces}>{'}'}</span>
              </span>
                </>
            );
        }
    }));
ObjectPreview.displayName = 'ObjectPreview';

const ObjectRootLabel = ({name, ...rest}) => {
    const {ObjectName} = useContext(ALEContext);
    const objectPreview = <ObjectPreview {...rest}/>;
    return (typeof name === 'string') ?
        (<span><ObjectName name={name}/><span>: </span>{objectPreview}</span>)
        : objectPreview;
};

/**
 * if isNonenumerable is specified, render the name dimmed
 */
const ObjectLabel = ({name, data, isNonenumerable = false}) => {
    const {ObjectValue, ObjectName} = useContext(ALEContext);
    const object = data;

    return (
        <span>
      {(typeof name === 'string' && name.length) ? (
          <ObjectName name={name} dimmed={isNonenumerable}/>
      ) : (
          <ObjectPreview data={name}/>
      )}
            <span>: </span>
      <ObjectValue object={object}/>
    </span>
    );
};

// end https://github.com/xyc/react-inspector/tree/master/src/object-inspector

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
        top: theme.spacing(0.5),
        left: 0,
    },
    overlayMarker: {
        maxWidth: theme.spacing(4),
        overflow: 'auto',
        position: 'absolute',
        marginLeft: theme.spacing(-1),
        top: 1,
        left: 0,
    },
    connector: {
        maxWidth: theme.spacing(4.25),
        width: theme.spacing(4.25),
        overflow: 'auto',
        position: 'absolute',
        paddingTop: 0,
        top: theme.spacing(0.5),
        left: 0,
        marginLeft: theme.spacing(1),
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
        top: 0,
        left: 0,
        marginLeft: theme.spacing(1),
        borderBottom:
            `${theme.spacing(0.25)} dotted ${theme.palette.secondary.main}`,
        paddingBottom: theme.spacing(0.75),
    }
});

const tableChartIconStyleOn = {
    zIndex: 1,
    position: 'absolute',
    right: 0,
    top: 0,
    marginTop: '0.25rem',
    marginRight: '0.25rem',
    fontSize: '0.5rem',
    cursor: 'pointer',
    opacity: 1,
};

const tableChartIconStyleOff = {
    ...tableChartIconStyleOn,
    opacity: 0.2,
};

const tableOn = (
    <TableChartIcon css={tableChartIconStyleOn}/>
);

const tableOff = (
    <TableChartOutlinedIcon
        css={tableChartIconStyleOff}/>
);

const tableChartIconStyleOnChart =
    {...tableChartIconStyleOn, marginTop: 0, marginRight: 0};

const tooltipTableOn = (
    <TableChartIcon
        css={tableChartIconStyleOnChart}/>
);

const tableChartIconStyleOffChart =
    {...tableChartIconStyleOff, marginTop: 0, marginRight: 0};

const tooltipTableOff = (
    <TableChartOutlinedIcon
        css={tableChartIconStyleOffChart}/>
);

const defaultContentStyle = {
    width: "fit-content",
}

const containerStyle = {
    width: "100%",
    height: "100%",
    position: "relative",
    display: "flex",
    alignItems: "center",
};

const sxContainer = {
    height: 14,
    width: 7.24,
    position: "absolute",
    right: 0,
    top: 0,
    color: 'text.secondary',
    bgcolor: 'background.default',
    borderRadius: "25%",
};

const sxIcon = {
    fontSize: 10,
    position: "absolute",
    right: 0,
    top: "50%",
    color: 'text.secondary',
    bgcolor: 'background.paper',
    borderRadius: "50%",
};

const sxIconInline = {
    ...sxIcon,
    fontSize: 7.24,
    top: 3.61,
};

const ALEInspector = (
    props
) => {
    const {
        setValue,
        classes,
        variant,
        connectorVariant,
        aleObject: _aleObject,
        zone,
        data: _data,
        contentStyle = defaultContentStyle,
        ...rest
    } = props;
    const {
        Inspector,
        GraphicalQuery,
        VisualQueryManager,
    } = useContext(ALEContext);

    // console.log('AI', props);
    const inline = variant === 'inline';
    const marker = connectorVariant === 'marker';
    const data = _aleObject ? _aleObject.getSnapshot() : _data;
    const showTooltip = !hasOwnTooltip(data);
    const aleObject = _aleObject ?? {};
    const {expressionId, type: expressionType, isStrictLiteral} = zone ?? {};
    const {isGraphical, isDomLiveRef, isLiveRef} = aleObject;
    const graphical = isGraphical?.();

    const [overflowed, setOverflowed] = useState(false);
    const onOverflow = useCallback(
        (overflowed) => {
            setOverflowed(overflowed);
        },
        []
    );

    const {ref, containerRef} = useResizeAndOverflowDetector(
        {onOverflow}
    );

    const graphicalClasses = useMemo(
        () => {
            return {
                containerClassName:
                    marker ? classes.containerMarker : classes.container,
                connectorClassName:
                    marker ? classes.connectorMarker : classes.connector,
                overlayClassName:
                    marker ? classes.overlayMarker : classes.overlay,
            };
        },
        [classes, marker]
    );

    const makeNodeRenderer = useCallback(
        (isCompact) => ({depth, name, data: _data, isNonenumerable}) => {
            const {
                containerClassName,
                connectorClassName,
                overlayClassName,
            } = graphicalClasses;
            let object = depth === 0 ? data : _data;

            const _graphical = aleObject?.isDomLiveRef?.(object);
            const _aleObject =
                depth === 0 ? aleObject
                    : aleObject?.getLiveRefOfDomLiveRef?.(object);
            const outputRefs = _aleObject?.getOutputRefs?.();
            const visualIds = [_aleObject?.getGraphicalId?.()];
            // (_graphical) && console.log("NR",
            //    {
            //       indexOfDomLiveRef: aleObject?.indexOfDomLiveRef(object),
            //       domLiveRefs: aleObject?.domLiveRefs,
            //       f: aleObject?.domLiveRefs.indexOf(object),
            //       _graphical,
            //       depth,
            //       object,
            //       outputRefs,
            //       visualIds,
            //       aleObject
            //    }
            // );
            const objectLabel = (depth === 0
                ? <ObjectRootLabel name={name}
                                   data={object}/>
                : <ObjectLabel name={name} data={object}
                               isNonenumerable={isNonenumerable}/>);
            if (_graphical) {
                const graphicalQuery = <GraphicalQuery
                    outputRefs={outputRefs}
                    visualIds={visualIds}
                />;
                if (isCompact) {
                    return graphicalQuery;
                }
                return (
                    <>
                  <span
                      className={containerClassName}
                  >
                     {objectLabel}
                  </span>
                        <span
                            className={connectorClassName}
                        />
                        <span className={overlayClassName}>
                     {graphicalQuery}
                  </span>
                    </>
                );
            }
            return objectLabel;

        },
        [
            data, ObjectRootLabel, ObjectLabel, aleObject, graphicalClasses,
            VisualQueryManager,
        ]
    );

    const [nodeRenderer, tooltipNodeRenderer] = useMemo(
        () => {
            return [
                makeNodeRenderer(inline),
                makeNodeRenderer(false)
            ];
        },
        [inline, makeNodeRenderer]
    );

    const [isTable, setIsTable] = useState(false);
    const handleToggleTable = useCallback(
        () => setIsTable(v => !v),
        [setIsTable]
    );
    const isSupportTable = useMemo(
        () => isArrayLikeObject(data) || isObjectLike(data)
        , [data]
    );

    const {inspector, tooltipInspector, disableInteractive} = useMemo(
        () => {
            const inspectorThemeName =
                inline && graphical ? "inspectorCompactGraphicalTheme"
                    : inline ? "inspectorCompactTheme"
                        : graphical ? "inspectorGraphicalTheme" : "inspectorTheme";
            const cacheId = expressionId;
            const inspector = inline && isStrictLiteral ? null : (
                <Inspector
                    inspectorThemeName={inspectorThemeName}
                    // cacheId={cacheId}
                    nodeRenderer={nodeRenderer}
                    data={inline ? null : data}
                    table={!inline && isTable}
                    resizable
                    {...rest}
                />
            );

            const tooltipInspectorTheme =
                graphical ? "inspectorGraphicalTheme" : "inspectorTheme";

            const tooltipInspector = inline && isStrictLiteral ? null : (
                <Inspector
                    inspectorThemeName={tooltipInspectorTheme}
                    cacheId={cacheId}
                    nodeRenderer={tooltipNodeRenderer}
                    data={data}
                    table={isTable}
                    resizable
                    {...rest}
                />
            );

            const disableInteractive =
                !inline || !showTooltip ||
                (!overflowed && !isSupportTable);

            return {inspector, tooltipInspector, disableInteractive};
        },
        [
            Inspector, inline, graphical, expressionId, isStrictLiteral,
            data, nodeRenderer, tooltipNodeRenderer, overflowed, isTable,
            isSupportTable
        ]
    );

    // console.log('objectNodeRenderer',dataZoneEntry);

    const tableHandle = isSupportTable &&
        <div
            onClick={handleToggleTable}>{isTable ? tableOn : tableOff}
        </div>;

    const tooltipTableHandle = isSupportTable &&
        <div
            onClick={handleToggleTable}>
            {isTable ? tooltipTableOn : tooltipTableOff}
        </div>;

    const aleInspector = (<div
        ref={containerRef}
        css={containerStyle}
    >
        {inline && overflowed && <Box sx={sxContainer}/>}
        {overflowed && <MoreHorizIcon sx={inline ? sxIcon : sxIconInline}/>}
        {!inline && tableHandle}
        <div
            ref={ref}
            css={contentStyle}
        >
            {inspector}
        </div>
    </div>);


    // console.log("LiveExpression", _aleObject, data, expressionId, expressionType);
    useEffect(() => {
        _aleObject && setValue?.(1);
    }, [_aleObject, setValue]);

    return (
        <ExplorerTooltip
            key={`${showTooltip}`}
            placement="bottom-start"
            title={
                disableInteractive ?
                    ""
                    : <ExplorerTooltipContainer>
                        {tooltipTableHandle}
                        {tooltipInspector}
                    </ExplorerTooltipContainer>
            }
        >
            {aleInspector}
        </ExplorerTooltip>
    );
};

ALEInspector.propTypes = {
    setValue: PropTypes.func,
    name: PropTypes.string,
    data: PropTypes.any,
    table: PropTypes.bool,
    outputRefs: PropTypes.array,
    variant: PropTypes.oneOf(["inline", "normal", "default"]),
    connectorVariant: PropTypes.oneOf(["marker", "normal", "default"]),
    expandedPaths: PropTypes.array,
    getExpandedPaths: PropTypes.func,
};

export default withStyles(inspectorStyles)(ALEInspector);
