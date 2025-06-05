import React, {
    useRef, useMemo, useCallback, useEffect, useState, useContext,
} from 'react';
import PropTypes from 'prop-types';
import Slider from '@mui/material/Slider';
import Tooltip, {tooltipClasses} from '@mui/material/Tooltip';
import Button from '@mui/material/Button';

import {
    darken,
    styled,
} from '@mui/material/styles';
import {withStyles} from '@mui/styles';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Input from '@mui/material/Input';
import InputAdornment from '@mui/material/InputAdornment';

import Portal from '@mui/material/Portal';

import {FocusBox} from "../../../common/UI";
import {LiveZoneDecorationStyles, ScopeTypes} from "../ALE";
import {StickyAction} from "../../../components/StickyAction";
import ALEInspector from "./ALEInspector";


export const formatBlockValue = (aValue = '-', max = '-') => {
    return `${
        '0'.repeat(max.toString().length - aValue.toString().length)
    }${aValue}`;
};

const SliderContainer = styled(Paper)(({theme}) => ({
    width: theme.spacing(50), //todo: make size relative to editor width
    maxWidth: theme.spacing(50),
    height: '100%',
    paddingLeft: theme.spacing(),
    paddingRight: theme.spacing(),
}));

const SliderPropsDefault = {};
const PaperPropsDefault = {elevation: 0, square: true, variant: "outlined"};

const BlockNavigator = (
    {
        min,
        max,
        value,
        showLabel,
        color = 'primary',
        handleSliderChange,
        SliderProps = SliderPropsDefault,
        PaperProps = PaperPropsDefault,
        ...rest
    }
) => {
    const sliderSx = useMemo(
        () => ({color: `${color ?? 'primary'}.main`}),
        [color]
    );
    const [isSticky, setIsSticky] = useState(false);
    const handleChangeIsSticky = useCallback(
        () => setIsSticky(isSticky => !isSticky),
        []
    );

    const [onChange, handleInputChange, handleBlur] = useMemo(
        () => {
            const onChange = (event, newValue) => (
                newValue !== value && handleSliderChange(event, newValue)
            );
            const handleInputChange = (event) => {
                const newValue = (event.target.value === '' ? '' : Number(event.target.value));
                !isNaN(newValue) && handleSliderChange(event, newValue);
            };
            const handleBlur = (event) => {
                if (value < min) {
                    handleSliderChange(event, min);
                } else if (value > max) {
                    handleSliderChange(event, max);
                }
            };

            return [onChange, handleInputChange, handleBlur];
        },
        [value, handleSliderChange]
    );

    const inputProps = {
        step: 1,
        min,
        max,
        type: 'number',
        'aria-labelledby': "branch-slider",
    };

    return (
        <SliderContainer
            {...PaperProps}
            {...rest}
        >
            <Grid container spacing={2} alignItems="center">
                <Grid item>
                    <StickyAction
                        isSticky={isSticky}
                        onStickyChange={handleChangeIsSticky}
                    />
                </Grid>
                <Grid item xs>
                    <Slider
                        sx={sliderSx}
                        aria-label="branch navigator slider"
                        valueLabelDisplay="auto"
                        step={1}
                        min={min}
                        max={max}
                        value={value}
                        onChange={onChange}
                        {...SliderProps}
                        aria-labelledby="branch-slider"
                    />
                </Grid>
                <Grid item>
                    <Input
                        value={value}
                        variant="filled"
                        size="small"
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        inputProps={inputProps}
                        endAdornment={
                            <InputAdornment position="end">
                                | {max}
                            </InputAdornment>
                        }
                    />
                </Grid>
            </Grid>
        </SliderContainer>
    );

};

BlockNavigator.propTypes = {
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    color: PropTypes.string,
    handleSliderChange: PropTypes.func.isRequired,
    handleSliderChangeCommitted: PropTypes.func,
    showLabel: PropTypes.bool
};

const NavigatorTooltip = styled(({className, ...props}) => (
    <Tooltip {...props} classes={{popper: className}}/>
))((/*{theme}*/) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        // backgroundColor: theme.palette.background.paper,
        backgroundColor: 'transparent',
        maxWidth: "none",
        border: 'none',
        padding: 0,
        margin: 0,
        paddingBottom: 4,
    },
}));


const buttonRootContainedStyle = {
    lineHeight: 1,
    fontSize: 9,
    maxHeight: 14 - 1,
    minWidth: 0,
    minHeight: 0,
    paddingTop: 2,
    paddingRight: 4,
    paddingBottom: 2,
    paddingLeft: 2,
    margin: 0,
    // width: '100%',
    height: '100%',
    borderRadius: 0,
    zIndex: 9999,
};

const buttonRootOutlinedStyle = {
    ...buttonRootContainedStyle,
    // backgroundColor: 'white',
};

const NavigatorContainedButton = withStyles(() => ({
    root: buttonRootContainedStyle,
}))(Button);

const NavigatorOutlinedButton = withStyles(() => ({
    root: buttonRootOutlinedStyle,
}))(Button);

const liveBlockLabelDefaultStyle = {fontSize: 9};

export function NavigationSignifier(divStyle, navigationIndicator) {
    return <div style={divStyle}>
        {navigationIndicator}
    </div>;
}

function NavigationIndicator(
    {
        isIfBlock,
        value,
        variant,
        color,
        isRelative,
        currentRelativeNavigationIndex,
        max,
        isSelected,
        NavigatorButton
    }
) {
    const divStyle = {visibility: isIfBlock ? value ? 'visible' : 'hidden' : 'visible'};
    const navigationIndicator = isIfBlock ? (
        null
        //value ? labelStyle : {...labelStyle, color: "transparent"}
        // ifBlockKey === "consequent" ? <CheckIcon style={labelStyle}/> : <ClearIcon style={labelStyle}/>
        // <Skeleton variant="circular" width={40} height={40} />
        // null
    ) : (
        <NavigatorButton
            variant={variant}
            color={color}
            // disabled={!showNavigatorTooltip}
        >
                  <span
                      style={{fontSize: 11}}
                  >
                 {formatBlockValue(
                     isRelative ? currentRelativeNavigationIndex : value,
                     max
                 )}
               </span>
            <span
                style={{padding: 1, fontSize: 12}}
            >
                   |
                </span>
            <span
                style={{fontSize: 9, paddingTop: 3}}
            >
                  {max}

               </span>
            {isSelected ?
                <FocusBox
                    variant={'Line'}
                    travelValue={-0.5}
                    scale={[1, 1, 1]}
                /> : null}
        </NavigatorButton>
    );
    return {divStyle, navigationIndicator};
}

function NavigatorShape(isRelative) {
    const NavigatorButton = isRelative ?
        NavigatorOutlinedButton : NavigatorContainedButton;
    return NavigatorButton;
}

export function NavigatorComponent({
                                       isIfBlock,
                                       absoluteMaxNavigationIndex,
                                       isRelative,
                                       value,
                                       variant,
                                       color,
                                       currentRelativeNavigationIndex,
                                       max,
                                       isSelected
                                   }) {
    const showNavigatorTooltip = !isIfBlock && !!absoluteMaxNavigationIndex;
    const NavigatorButton = NavigatorShape(isRelative);
    const {
        divStyle,
        navigationIndicator
    } = NavigationIndicator({
        isIfBlock,
        value,
        variant,
        color,
        isRelative,
        currentRelativeNavigationIndex,
        max,
        isSelected,
        NavigatorButton
    });
    return {showNavigatorTooltip, divStyle, navigationIndicator};
}

const LiveBlock = (
    props
) => {
    const {
        autoHideAbsoluteIndex,
        tooltipProps = {
            placement: "top-start",
            enterDelay: 250,
            leaveDelay: 200,
            // open: true,
        },
        navigationState = {},
        navigationStateInfo = {},
        labelStyle = liveBlockLabelDefaultStyle,
        decorate,
        isIfBlock,
        ifBlockKey
    } = props;

    const {
        branchNavigator,
        isSelected,
        absoluteMaxNavigationIndex,
        currentAbsoluteNavigationIndex,
        relativeMaxNavigationIndex,
        currentRelativeNavigationIndex,
        currentBranchEntry,
        currentBranches,
        handleChangeAbsoluteSelectedBranchEntry,
        handleChangeRelativeSelectedBranchEntry,
        resetNavigation,
        branchNavigatorEntry,
    } = navigationState;

    const {color, isRelative, blockVariant: variant, value, max} = navigationStateInfo;


    // const color = useMemo(() => {
    //         return branchNavigator?.getScopeType() === ScopeTypes.F ? 'primary' : 'secondary';
    //     },
    //     [branchNavigator]
    // );

    // const isRelative = useMemo(
    //     () => {
    //         // console.log(currentBranches, );
    //         return !!currentBranches.find(b => b.parentBranch);
    //
    //     },
    //     [currentBranches]
    // );

    // const variant = isRelative ? 'outlined' : 'contained';

    //  console.log('F', branchNavigator?.paths()?.length, absoluteMaxNavigationIndex, currentNavigationIndex, resetNavigation);
    const [, _setValue] = useState(absoluteMaxNavigationIndex);
    // const value =
    //     isRelative ? currentRelativeNavigationIndex ?? relativeMaxNavigationIndex
    //         : currentAbsoluteNavigationIndex ?? absoluteMaxNavigationIndex
    // const max =
    //     isRelative ? relativeMaxNavigationIndex
    //         : absoluteMaxNavigationIndex;

    const setValueRef = useRef();
    setValueRef.current =
        (isRelative ?
            handleChangeRelativeSelectedBranchEntry
            : handleChangeAbsoluteSelectedBranchEntry) ?? _setValue;
    const handleSliderChange = useCallback((event, newValue) => {
        setValueRef.current(newValue);
    }, []);


    // const isIfBlock = branchNavigator?.zone()?.parentType === "IfStatement";

    // isIfBlock && console.log("LiveBlock", branchNavigator?.zone(), value );
    const {
        showNavigatorTooltip,
        divStyle,
        navigationIndicator
    } = NavigatorComponent({
            isIfBlock,
            absoluteMaxNavigationIndex,
            isRelative,
            value,
            variant,
            color,
            currentRelativeNavigationIndex,
            max,
            isSelected
        }
    );

    // const isLoop
    //todo: exit scopes

    useEffect(
        () => {
            let undecorate = null;

            const tid = setTimeout(() => {
                undecorate = decorate?.(value);
            }, 10);

            return () => {
                clearTimeout(tid);
                undecorate?.(value);
            }
        },
        [value, decorate]
    );
    return (
        // <span>
        <NavigatorTooltip
            key={`nt0_${showNavigatorTooltip}`}
            title={
                <BlockNavigator
                    color={color}
                    min={showNavigatorTooltip ? 1 : 0}
                    value={value}
                    max={max}
                    handleSliderChange={handleSliderChange}
                />
            }

            {...(showNavigatorTooltip ? {arrow: false} : {open: false})}
            {...tooltipProps}
        >
            {NavigationSignifier(divStyle, navigationIndicator)}
        </NavigatorTooltip>
    );
};

const LiveExpression = ({isImport, decorate, ...props}) => {
    const [value, setValue] = useState(0);
    useEffect(
        () => {
            let undecorate = null;

            const tid = setTimeout(() => {
                undecorate = decorate?.(value);
            }, 10);

            return () => {
                clearTimeout(tid);
                undecorate?.(value);
            }
        },
        [value, decorate]
    );

    return (<ALEInspector variant="inline" isImport={isImport} setValue={setValue} {...props} />);
};

const Noop = () => {
    return null;
}


const VALE = ({
                  contentWidget,
                  navigationStates,
                  id: key,
                  isLoading,
                  allCurrentScopes,
                  programUID,
                  getNavigationStateInfo,
                  ...rest
              }) => {

    const container = contentWidget.getDomNode();
    const {expressionId} = contentWidget?.locLiveZoneActiveDecoration?.zone ?? {};
    const {
        zone: _zone = {}, logValues = []
    } = contentWidget.locLiveZoneActiveDecoration ?? {};

    const {uid, type, parentType} = _zone;
    // expressionId == 6 && console.log("VALE", {expressionId, contentWidget});
    //contentWidget?.getDomNode(),
    // console.log("VALE",  contentWidget?.getId(), contentWidget?.locLiveZoneActiveDecoration?.syntaxFragment?.getDecorationIds(),{contentWidget, container, variant, rest});

    let data = null;
    let aleObject = null;
    let zone = null;
    let currentEntry = null;
    const navigationStateInfo = getNavigationStateInfo(key);
    const {
        variant,
        navigationState
    } = navigationStateInfo;
    // console.log("navigationStates", navigationStates);
    // const variant = navigationStates[key] ? 'block' : 'expression';
    // const navigationState = navigationStates[key] ?? emptyState;
    let forceVisible = false;
    const isImport = contentWidget.locLiveZoneActiveDecoration?.isImport;
    const isIfBlock = contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.ifBlock();
    const ifBlockKey = contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.ifBlockKey();

    // (isIfBlock )&& console.log("navigationStates", contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.ifBlockAlternate());//, navigationState, contentWidget.locLiveZoneActiveDecoration?.syntaxFragment, );


    let isUseful = true;

    if (variant === 'block') {
        forceVisible = true;
    } else { // expression variant
        if (isImport) {
            // console.log("rale", {contentWidget, navigationState, variant});
            forceVisible = true;
            // data = currentEntry.getValue();
            // aleObject = currentEntry.entry?.logValue;
            // zone = _zone;
        } else {

        }
    }


    // if (type === "CallExpression") {
    //     console.log("TR>>", _zone);
    //
    // }


    // if (parentType === 'BinaryExpression' || parentType === 'LogicalExpression') {
    //     if (type !== 'BinaryExpression' && type !== 'LogicalExpression') {
    //         isUseful = false;
    //     }
    // }
    const branchType = contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.branchType();// _zone?.liveZoneType === "branch";//
    const listKeyBody = contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.listKeyBody();

    if (isUseful && !listKeyBody) {
        const expressionTest = contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.expressionTest();
        const forBlock = contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.forBlock();
        const forBlockInit = contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.forBlockInit();
        const expressionUpdate = contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.expressionUpdate();
        const forXRight = contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.forXRight();
        const forXLeft = contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.forXLeft();


        let branchEntry = allCurrentScopes?.[uid]?.currentBranchEntry;

        const _logValues = (branchEntry?.branch?.logValues) ?? logValues;

        const branchAny = {in: 0, out: Infinity};
        const currentBranch = (
                ((forBlockInit || branchType) ? (branchEntry?.branch ? {
                            in: 0,
                            out: branchEntry?.branch?.in
                        } : branchAny) :
                        (expressionTest || forXRight || (forBlock && expressionUpdate)) ?
                            branchEntry?.branch ?
                                {in: branchEntry?.branch?.in ?? 0, out: Infinity}
                                : branchAny
                            : null
                )
            )
            ?? (branchEntry?.branch ?? (programUID == uid ? branchAny : null));

        const forXBranch = (currentBranch && (forXRight)) && _logValues.reverse().find(entry => {
            if (
                currentBranch.in >= entry.i
            ) {
                return true;
            } else {
                return false;
            }
        });
        let lvs = logValues;


        if (lvs.length < 1 && currentBranch) {
            if (variant === 'block') {
                lvs = currentBranch.logValues ?? lvs;
            } else {
                if (variant === 'expression') {
                    lvs = _logValues;
                }
            }
        }

        currentEntry = forXBranch || (currentBranch && lvs.find(entry => {
            if (
                currentBranch.in <= entry.i &&
                entry.i <= currentBranch.out
            ) {
                return true;
            } else {
                return false;
            }
        }));


        //_zone.parentType =="ForInStatement"

        //_zone.type =="ArrayExpression" &&console.log("contentWidget.locLiveZoneActiveDecoration",{forin, currentBranch,branchEntry, currentEntry, logValues}, contentWidget.locLiveZoneActiveDecoration, contentWidget?.locLiveZoneActiveDecoration?.getBranchNavigator());


        //bring the branch and collect the in entry
        if (currentEntry) {

            forceVisible = true;
            aleObject = (currentEntry.entry?.idValue) ?? currentEntry.entry?.logValue;
            zone = (currentEntry?.zone) ?? _zone;
            if (branchType) {
                aleObject = currentEntry.entry.paramsValue;
                zone = _zone;
            }


            data = currentEntry.getValue() ?? aleObject;

            // if (logValues?.length) {
            //     zone = logValues[0]?.zone ?? _zone;
            // } else {
            //     zone = (currentEntry.entry?.idValue?.zone) ?? _zone;
            // }

            // functionBlock && console.log("functionBlock", {
            //     _zone,
            //     _logValues,
            //     branchEntry,
            //     currentEntry,
            //     lvs,
            //     currentBranch,
            //     x: contentWidget.locLiveZoneActiveDecoration,
            //     aleObject,
            //     data,
            //     zone
            // });

            // console.log("currentEntry", currentEntry);
            //the zone of the vraible is changed to the forloop, perhaps in contentmangaer. evidence in the widget infor, as is using parent ingot not its own
        }

        // (variant === 'block')
        // currentEntry && forXLeft
        // && console.log(variant, {
        //     expressionId,
        //     contentWidget,
        //     // branchNavigator: contentWidget.getLocLiveZoneActiveDecoration().getBranchNavigator(),
        //     // forXRight,
        //     logValues,
        //     currentBranch,
        //     // type,
        //     // logValues,
        //     currentEntry,
        //     data,
        //     aleObject,
        //     zone,
        // });

        // (expressionTest) && console.log("expressionTest", { //allCurrentScopes?.[uid]
        //     contentWidget,
        //     variant,
        //     navigationState,
        //     aleObject,
        //     currentBranch,
        //     currentEntry,
        //     logValues
        // });
        // (forBlockInit) && console.log("forBlock", { //allCurrentScopes?.[uid]
        //     contentWidget,
        //     variant,
        //     navigationState,
        //     aleObject,
        //     currentBranch,
        //     currentEntry,
        //     logValues
        // });

        // (expressionTest) && console.log("expressionTest", {contentWidget, variant, navigationState, aleObject, currentEntry});//, navigationState, contentWidget.locLiveZoneActiveDecoration?.syntaxFragment, );


    }


    const decorate = useCallback((value = 0) => {
        // const isImport = contentWidget.locLiveZoneActiveDecoration?.isImport;
        if (isImport) {
            // console.log("rale", {contentWidget, navigationState});
            contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.decorate(LiveZoneDecorationStyles.active, false);
            return;
        }

        // contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.sourceText === "let n" && console.log("BL", contentWidget.locLiveZoneActiveDecoration?.syntaxFragment, contentWidget);


        if (variant === 'block') {
            //  contentWidget.locLiveZoneActiveDecoration?.syntaxFragment && console.log("BL", contentWidget.locLiveZoneActiveDecoration?.syntaxFragment, contentWidget);

            //navigationState?.absoluteMaxNavigationIndex
            if (value) {
                // if(isIfBlock){
                //     console.log("BL A isIfBlock", contentWidget.locLiveZoneActiveDecoration?.syntaxFragment, contentWidget);
                // }
                contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.decorate(LiveZoneDecorationStyles.active, false, value);
                // console.log("BL A", contentWidget.locLiveZoneActiveDecoration?.syntaxFragment, contentWidget, navigationState);
            } else {
                // console.log("BL", contentWidget, navigationState,contentWidget.locLiveZoneActiveDecoration?.syntaxFragment);
                contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.decorate(LiveZoneDecorationStyles.default, false, value);
            }
        } else {
            //why widget is not aligned with expression node
            // }
            if (value) {
                // if(isIfBlock){
                //     console.log("BL A isIfBlock", contentWidget.locLiveZoneActiveDecoration?.syntaxFragment, contentWidget);
                // }
                contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.decorate(LiveZoneDecorationStyles.active, false, value);
                // console.log("BL A", contentWidget.locLiveZoneActiveDecoration?.syntaxFragment, contentWidget, navigationState);
            } else {
                // console.log("BL", contentWidget, navigationState,contentWidget.locLiveZoneActiveDecoration?.syntaxFragment);
                contentWidget.locLiveZoneActiveDecoration?.syntaxFragment?.decorate(LiveZoneDecorationStyles.default, false, value);
            }
        }

    }, [contentWidget, isImport, variant]);

    const LiveArtifact = forceVisible ? (variant === 'block' ? LiveBlock : LiveExpression) : Noop;


    const props = {
        ...rest,
        data,
        isLoading,
        aleObject,
        zone,
        navigationState,
        navigationStateInfo,
        decorate,
        isImport,
        isIfBlock,
        ifBlockKey,
        branchType
    };

    // branchType && console.log("VALE LiveArtifact", {container, props, variant, zone, functionParams: zone?.functionParams});

    return (
        <Portal container={container}>
            <LiveArtifact
                {...props}
                // data={data}
                // isLoading={isLoading}
                // aleObject={aleObject}
                // zone={zone}
                // navigationState={navigationState}
                // decorate={decorate}
                // isImport={isImport}
                // isIfBlock={isIfBlock}
                // ifBlockKey={ifBlockKey}

            />
        </Portal>
    );
};

export default VALE;
