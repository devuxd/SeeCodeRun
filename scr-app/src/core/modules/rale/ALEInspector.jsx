// // /** @jsxImportSource @emotion/react */
// import {jsx, css} from '@emotion/react';
import {
    useMemo, useCallback, useState, useContext, memo, useEffect, useRef,
} from 'react';
import {BehaviorSubject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

import PropTypes from 'prop-types';

import {withStyles} from '@mui/styles';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

import TableChartIcon from '@mui/icons-material/TableChart';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FunctionIcon from 'mdi-material-ui/Function';
import FolderHome from 'mdi-material-ui/FolderHome';
import FolderAccount from 'mdi-material-ui/FolderAccount';
import FolderDownload from 'mdi-material-ui/FolderDownload';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
// import Badge from '@mui/material/Badge';

// import CheckIcon from '@mui/icons-material/Check';
// import ClearIcon from '@mui/icons-material/Clear';

// import PackageVariant from 'mdi-material-ui/PackageVariant';
// import PackageVariantCheck from 'mdi-material-ui/PackageVariantCheck';
// import PackageVariantClosed from 'mdi-material-ui/PackageVariantClosed';


import isArrayLikeObject from 'lodash/isArrayLikeObject';
import isObjectLike from 'lodash/isObjectLike';


import ALEContext from "./ALEContext";
import {useResizeAndOverflowDetector} from "../../../utils/reactUtils";
import {isTypeNaN} from "../../../utils/scrUtils";
import {useComputableProps} from "./GraphicalQueryBase";
import {ExecutionWarningIcon} from "../../../common/icons/Software";

const ALEProps = {arrayMaxProperties: 1, objectMaxProperties: 1};

//start
// https://github.com/xyc/react-inspector/tree/master/src/object-inspector
/* NOTE: Chrome console.log is italic */
const aleInspectorStyles = theme => {
    return ({
        preview: {
            fontStyle: 'italic',
            // color: "red",
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
                'rgb(296, 26, 222)' : 'rgb(233, 63, 259)',
        },
        trueValue: {
            fontFamily: 'Menlo, monospace',
            color: 'white',
            fontWeight: 'bold',
            backgroundColor: theme.palette.mode === 'light' ?
                'rgb(26, 156, 50)' : 'rgb(0, 176, 20)', // 'rgb( 26,56, 172)' : 'rgb(63,86,  209)'
        },
        falseValue: {
            fontFamily: 'Menlo, monospace',
            color: 'white',
            fontWeight: 'bold',
            backgroundColor: theme.palette.mode === 'light' ?
                'rgb(255, 166, 50)' : 'rgb(255, 166, 100)', // 'rgb( 26, 22,196)' : 'rgb( 63, 59,233)',
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
            backgroundColor: 'red',
        },
    })
};


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
        overflow: "auto", /// scroll breaks default size
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
// const intersperse = (arr, sep) => {
//     if (arr.length === 0) {
//         return [];
//     }
//
//     return arr.slice(1).reduce((xs, x) => xs.concat([sep, x]), [arr[0]]);
// };

const intersperse = (arr, sep) => {
    // Directly return an empty array for the empty input to avoid further processing
    if (arr.length === 0) {
        return [];
    }

    return arr.reduce((acc, item, index) => {
        // For the first item, just add it to the accumulator
        if (index === 0) {
            acc.push(item);
        } else {
            // For subsequent items, add the separator first, then the item
            acc.push(sep, item);
        }
        return acc;
    }, []); // Start with an empty array as the accumulator
};


// const isTypeNaN = (datum) => {
//    return (datum !== NaN.toString() && datum?.toString() === NaN.toString());
// };

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

const PreviewArray = memo(
    ({
         disableListGroup, object, maxProperties, isMaxPreviewDepth,
         ObjectValue, previewDepth, ellipsis, styles, classes,
         ...objectProps
     }) => {

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
        const label = arrayLength === 0 ? `` : `(${arrayLength})\xa0`;
        return (<>
            <span style={styles.objectDescription}>{label}</span>
            <span style={styles.preview}>
                 <span className={classes.arrayBrackets}>[</span>
                {intersperse(previewArray, ', ')}
                <span className={classes.arrayBrackets}>]</span>
            </span>
        </>);
    });

const stripConstructorFromObject = (object) => {
    const {constructor, ...obj} = object ?? {};
    return constructor?.name ? obj : object;
};

/**
 * A preview of the object
 */
export const ObjectPreview = memo(withStyles(aleInspectorStyles)(
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
            showConstructor = false,
        } = props;

        const {
            useStyles,
            ObjectType,
            ObjectValue,
            ObjectName,
            ...rest
        } = useContext(ALEContext);
        const styles = useStyles?.('ObjectPreview');

        // console.log("s", styles, classes);

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
                        undefined
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
                                className={classes.undefinedValue}>{'N'}
                            </span>
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
                        if (isGraphical) {
                            return <span>{objectValue}</span>;
                        }
                        return objectValue;
                }
            }

        }


        const isMaxPreviewDepth = previewDepth > maxPreviewDepth;

        if (Array.isArray(object)) {
            const maxProperties = (ALEProps.arrayMaxProperties ??
                arrayMaxProperties) ?? styles.arrayMaxProperties;
            return <PreviewArray
                {...{
                    ...props,
                    disableListGroup, object, maxProperties, isMaxPreviewDepth,
                    ObjectValue, previewDepth, ellipsis, styles, classes,
                }}
            />;
        } else {
            const maxProperties = (ALEProps.objectMaxProperties ??
                objectMaxProperties) ?? styles.objectMaxProperties;
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

                    const isConstructor = propertyName === "constructor" && !!propertyValue?.name;

                    if (!isConstructor || (isConstructor && showConstructor)) {
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

                        if (ellipsis) {
                            break;
                        }

                    }
                }
            }


            return (
                <>
                    <span style={styles.objectDescription}>
                        <ObjectType object={object}/>
                    </span>
                    <span style={styles.preview}>
                        <span className={classes.objectBraces}>{'{'}</span>
                        {intersperse(propertyNodes, ', ')}
                        <span className={classes.objectBraces}>{'}'}</span>
                    </span>
                </>
            );
        }
    }));
ObjectPreview.displayName = 'ObjectPreview';


const liveExpressionIconDefaultStyle = {
    fontSize: "0.75rem",
    color: 'white',
    fontWeight: 'bold',
    backgroundColor: 'rgb(153, 128, 255)',
};

const labelStyles = (theme) => {
    const baseIconStyle = {
        height: 10,
        fontSize: "0.75rem",
        // marginBottom: "-0.2rem",
        color: 'white',
        fontWeight: 'bold',
    };
    return {
        liveExpressionIconDefaultStyle: {
            ...baseIconStyle,
            marginBottom: "-0.1rem",
            backgroundColor: theme.palette.mode === 'light' ?
                'rgb( 26,56, 172)' : 'rgb(63,86,  209)',
        },
        liveExpressionTextDefaultStyle: {
            ...baseIconStyle,
            fontSize: "0.55rem",
            backgroundColor: theme.palette.mode === 'light' ?
                'rgb( 26,56, 172)' : 'rgb(63,86,  209)',
        }
    };
};

const ObjectRootLabel = withStyles(labelStyles)(({classes, name, ...rest}) => {
    const {ObjectName, aleInstance} = useContext(ALEContext);
    const obj = rest.data;
    const resolveStateInfo = aleInstance?.scr?.resolveStateInfo;
    const {
        objectConstructorName,
        stateType,
        isFunctionType,
        location,
        info,
    } = useMemo(() => {
            return resolveStateInfo?.(obj) ?? {};
        },
        [obj, resolveStateInfo]
    );

    let objectName = null;


    // if (typeof nn === 'string') {
    //     objectName = <ObjectName name={nn}/>;
    // }

    if (typeof name === 'string') {
        objectName = <ObjectName name={name}/>;
    } else {

        // const nn = (objectConstructorName ?? name);
        // if (!nn) {
        //     console.log("FFF", {
        //         name, obj,
        //         objectConstructorName,
        //         stateType,
        //         isFunctionType,
        //         location,
        //         info,
        //     });
        // }

    }

    let objectPreview = null;

    if (isFunctionType) {
        objectPreview = <FunctionIcon className={classes.liveExpressionIconDefaultStyle}/>;
    } else {
        objectPreview = <ObjectPreview {...rest}/>;
    }

    let idiomaticState = objectPreview; //objectName ??
    //
    switch (stateType) {
        case "native":
            idiomaticState = <><FolderHome
                className={classes.liveExpressionIconDefaultStyle}/>{JSON.stringify(location)}</>;
            break
        case "import":
            //<span>{JSON.stringify(info.importZoneExpressionData)}</span>
            // console.log("import", info);
            idiomaticState = <><FolderDownload
                className={classes.liveExpressionIconDefaultStyle}/><span
                className={classes.liveExpressionTextDefaultStyle}>{info.importZoneExpressionData.sourceText}</span></>;
    }

    // if (objectName) {
    //     objectName = idiomaticState;
    // } else {
    objectPreview = idiomaticState;
    // }

    return (objectName) ?
        (<span>{objectName}<span>: </span>{objectPreview}</span>)
        : objectPreview;
});

/**
 * if isNonenumerable is specified, render the name dimmed
 */
const ObjectLabel = withStyles(labelStyles)(({classes, name, data, isNonenumerable = false}) => {
    const {ObjectValue, ObjectName, aleInstance} = useContext(ALEContext);
    const object = data;
    const obj = object;
    const resolveStateInfo = aleInstance?.scr?.resolveStateInfo;
    const {
        stateType,
        isFunctionType,
        location,
        info,
    } = useMemo(() => {
            return resolveStateInfo?.(obj) ?? {};

        },
        [obj, resolveStateInfo]
    );

    let objectName = null;
    const isConstructor = name === "constructor" && !!object?.name;

    if (typeof name === 'string' && name.length) {
        objectName = <ObjectName name={name} dimmed={isNonenumerable || isConstructor}/>;
    } else {
        objectName = <ObjectPreview data={name}/>;
    }

    let objectValue = null;

    if (isFunctionType) {
        objectValue = <FunctionIcon className={classes.liveExpressionIconDefaultStyle}/>;
    } else {

        objectValue = <ObjectValue object={object}/>;
    }

    let idiomaticState = objectValue; //objectName ??

    if (isFunctionType) {

        switch (stateType) {
            case "native":
                idiomaticState = <><FolderHome className={classes.liveExpressionIconDefaultStyle}/>{idiomaticState}</>;
                break
            case "import":
                //<span>{JSON.stringify(info.importZoneExpressionData)}</span>
                idiomaticState = <><FolderDownload
                    className={classes.liveExpressionIconDefaultStyle}/>{idiomaticState}</>;
        }
    }

    // if (objectName) {
    //     objectName = idiomaticState;
    // } else {
    objectValue = idiomaticState;
    // }


    return (<span>
            {objectName}<span>: </span>{objectValue}
        </span>
    );
});

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
    <TableChartIcon sx={tableChartIconStyleOn}/>
);

const tableOff = (
    <TableChartOutlinedIcon
        sx={tableChartIconStyleOff}/>
);

const tableChartIconStyleOnChart =
    {...tableChartIconStyleOn, marginTop: 0, marginRight: 0};

const tooltipTableOn = (
    <TableChartIcon
        sx={tableChartIconStyleOnChart}/>
);

const tableChartIconStyleOffChart =
    {...tableChartIconStyleOff, marginTop: 0, marginRight: 0};

const tooltipTableOff = (
    <TableChartOutlinedIcon
        sx={tableChartIconStyleOffChart}/>
);

const defaultContentStyle = {
    display: 'inline-flex',
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

const defaultOverFlowPipelineRx = debounceTime(1000);

const ALEInspector = (
    props
) => {
    const {
        isImport,
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
        overFlowPipelineRx = defaultOverFlowPipelineRx,
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

    const [cssText, nonComputableProps, propValues] = useComputableProps(data);

    const [overflowed, setOverflowed] = useState(false);

    const rxRef = useRef(null);
    if (!rxRef.current) {
        const bs = new BehaviorSubject(null);
        const nextValue = (value) => bs.next(value);
        rxRef.current = {
            bs,
            nextValue,
        };
    }

    useEffect(
        () => {
            const uns = rxRef.current.bs.pipe(overFlowPipelineRx).subscribe((overflowed) => {
                setOverflowed(overflowed);
            });

            return () => uns.unsubscribe();
        }, [overFlowPipelineRx]
    );


    const {ref, containerRef} = useResizeAndOverflowDetector(rxRef.current.nextValue);

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

            const _graphical = aleObject?.isDomLiveRef?.(object); //?.ref??object
            // console.log("_graphical", _graphical, object);
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
                    data={object}
                />;
                if (isCompact) {
                    return graphicalQuery;
                }
                return (
                    <>
                        <Box className={containerClassName}>{objectLabel}</Box>
                        <Box className={connectorClassName}/>
                        <Box className={overlayClassName}>{graphicalQuery}</Box>
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

    const [toggleStyle, setToggleStyle] = useState(false);


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


            let tooltipInspector = inline && isStrictLiteral ? null : (
                (<Inspector
                    inspectorThemeName={tooltipInspectorTheme}
                    cacheId={cacheId}
                    nodeRenderer={tooltipNodeRenderer}
                    data={data}
                    table={isTable}
                    resizable

                    {...rest}
                />)
            );

            if (tooltipInspector && nonComputableProps.length) {
                tooltipInspector = (
                    <Stack spacing={1}>
                        <Stack direction="row" spacing={1}>
                            <Chip
                                label={`unknown css styles (${nonComputableProps.length})`} variant={"filled"}
                                color={"warning"} size={"small"}
                                icon={<ExecutionWarningIcon/>}
                            />
                            {
                                nonComputableProps.map(
                                    p => (
                                        <Chip key={p} label={p} variant={"outlined"} color={"default"} size={"small"}/>)
                                )
                            }
                        </Stack>
                        <Divider flexItem variant={"middle"}/>
                        {tooltipInspector}
                    </Stack>);
            }

            const disableInteractive =
                !inline || !showTooltip ||
                (!overflowed && !isSupportTable);

            return {inspector, tooltipInspector, disableInteractive};
        },
        [
            Inspector, inline, graphical, expressionId, isStrictLiteral,
            data, nodeRenderer, tooltipNodeRenderer, overflowed, isTable,
            isSupportTable, nonComputableProps, toggleStyle, cssText
        ]
    );

    // console.log('objectNodeRenderer',dataZoneEntry);

    const tableHandle = isSupportTable &&
        <Box
            onClick={handleToggleTable}>{isTable ? tableOn : tableOff}
        </Box>;

    const tooltipTableHandle = isSupportTable &&
        <Box
            onClick={handleToggleTable}>
            {isTable ? tooltipTableOn : tooltipTableOff}
        </Box>;

    const aleInspector = (<div
        ref={containerRef}
        style={containerStyle}
    >
        {inline && overflowed && <Box sx={sxContainer}/>}
        {overflowed && <MoreHorizIcon sx={inline ? sxIcon : sxIconInline}/>}
        {!inline && tableHandle}
        <div
            ref={ref}
            style={contentStyle}
        >
            {inspector}
        </div>
    </div>);


    // console.log("LiveExpression", _aleObject, data, expressionId, expressionType);
    useEffect(() => {
        _aleObject && setValue?.(1);
    }, [_aleObject, setValue]);


    if (expressionType === "CallExpression" && (_aleObject?.objectType === "undefined" || _aleObject?.objectType === "null")) {
        // console.log("is function call")
        return null;
    }
    return (isImport ?
            <FolderDownload style={liveExpressionIconDefaultStyle}/>
            :
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
    isImport: PropTypes.bool,
};

export default withStyles(inspectorStyles)(ALEInspector);
