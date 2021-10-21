import React, {
   useRef, useMemo, useCallback, useEffect, useState, useContext,
} from 'react';
/** @jsxImportSource @emotion/react */
import {jsx, css} from '@emotion/react';
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
import {ScopeTypes} from "../ALE";
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

const LiveBlock = (
   {
      autoHideAbsoluteIndex,
      tooltipProps = {
         placement: "top-start",
         enterDelay: 250,
         leaveDelay: 200,
         // open: true,
      },
      navigationState = {}
   }
) => {
   
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
   
   const color = useMemo(() => {
         return branchNavigator?.getScopeType() === ScopeTypes.F ? 'primary' : 'secondary';
      },
      [branchNavigator]
   );
   
   const isRelative = useMemo(
      () => {
         // console.log(currentBranches, );
         return !!currentBranches.find(b => b.parentBranch);
         
      },
      [currentBranches]
   );
   
   const variant = isRelative ? 'outlined' : 'contained';
   
   //  console.log('F', branchNavigator?.paths()?.length, absoluteMaxNavigationIndex, currentNavigationIndex, resetNavigation);
   const [, _setValue] = useState(absoluteMaxNavigationIndex);
   const value =
      isRelative ? currentRelativeNavigationIndex ?? relativeMaxNavigationIndex
         : currentAbsoluteNavigationIndex ?? absoluteMaxNavigationIndex
   const max =
      isRelative ? relativeMaxNavigationIndex
         : absoluteMaxNavigationIndex;
   
   const setValueRef = useRef();
   setValueRef.current =
      (isRelative ?
         handleChangeRelativeSelectedBranchEntry
         : handleChangeAbsoluteSelectedBranchEntry) ?? _setValue;
   const handleSliderChange = useCallback((event, newValue) => {
      setValueRef.current(newValue);
   }, []);
   
   const showNavigatorTooltip = !!absoluteMaxNavigationIndex;
   const NavigatorButton = isRelative ?
      NavigatorOutlinedButton : NavigatorContainedButton;
   
   // const isLoop
   //todo: exit scopes
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
         <div>
            <NavigatorButton
               variant={variant}
               color={color}
               //disabled={!showNavigatorTooltip}
            >
               <>
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
               </>
            
            </NavigatorButton>
         </div>
      </NavigatorTooltip>
   );
};

const LiveExpression = (props) => {
   return <ALEInspector variant="inline" {...props} />;
};

const VALE = ({visible, container, variant, ...rest}) => {
   return (<Portal container={container}>
         {
            visible && (variant === 'block' ? <LiveBlock {...rest} /> :
               <LiveExpression {...rest} />)
         }
      </Portal>
   );
};

export default VALE;
