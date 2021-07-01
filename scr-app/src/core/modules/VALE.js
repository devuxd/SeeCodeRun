import React, {useCallback, useMemo, useRef, useState,} from 'react';
/** @jsxImportSource @emotion/react */
import {jsx, css} from '@emotion/react';
import Slider from '@material-ui/core/Slider';
import Tooltip, {tooltipClasses} from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';
import {
   darken,
   styled,
} from '@material-ui/core/styles';
import {withStyles} from '@material-ui/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';

import Portal from '@material-ui/core/Portal';
import Inspector from "react-inspector";
import {FocusBox} from "../../common/UI";
import {ScopeTypes} from "./ALE";
import {StickyAction} from "../../components/StickyAction";
// import ObjectExplorer, {
//    ExplorerTooltip,
//    ExplorerTooltipContainer,
//    ObjectRootLabel
// } from "./ObjectExplorer";
//
// import GraphicalQuery from "./GraphicalQuery";

export const formatBlockValue = (aValue = '-', max = '-') => {
   const value = `${
      '0'.repeat(max.toString().length - aValue.toString().length)
   }${aValue}`;
   return `${value}/${max}`;
};

const SecondarySlider = styled(Slider)(
   ({theme}) => ({
         color: theme.palette.secondary.main,
         ':hover': {
            color: darken(theme.palette.secondary.main, 0.2)
         }
      }
   )
);

const SliderContainer = styled(Paper)(({theme}) => ({
   width: theme.spacing(50), //todo: make size relative to editor width
   maxWidth: theme.spacing(50),
   height: '100%',
   paddingLeft: theme.spacing(),
   paddingRight: theme.spacing(),
}));

const BlockNavigator = (
   {
      min, max, value,
      showLabel, color = 'primary',
      handleSliderChange,
      SliderProps = {},
      PaperProps = {elevation: 0, square: true, variant: "outlined"},
      ...rest
   }
) => {
   const [isSticky, setIsSticky] = useState(false);
   const handleChangeIsSticky = useCallback(
      () => setIsSticky(isSticky => !isSticky),
      []
   );
   const CustomSlider = color === 'primary' ? Slider : SecondarySlider;
   
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
               <CustomSlider
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
                  inputProps={{
                     step: 1,
                     min,
                     max,
                     type: 'number',
                     'aria-labelledby': "branch-slider",
                  }}
                  endAdornment={
                     <InputAdornment position="end">
                        / {max}
                     </InputAdornment>
                  }
               />
               {/*{showLabel &&*/}
               {/*<Typography>*/}
               {/*   {formatBlockValue(value, max)}*/}
               {/*</Typography>*/}
               {/*}*/}
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

// function VALELE(
//    {
//       visible,
//       container,
//       isOmitLabel,
//       showTooltip,
//       objectNodeRenderer,
//       isOutput,
//       value,
//       isIcon,
//       expressionType,
//       expressionId,
//       selected,
//       outputRefs,
//       getVisualIdsFromRefs,
//       cacheId,
//       onChange
//    }
// ) {
//
//
//    return <Portal container={container}>
//       {visible && (isOmitLabel ? null :
//          <ExplorerTooltip
//             key={showTooltip}
//             placement="bottom-start"
//             {...(showTooltip ? {} : {open: false})}
//             title={
//                <ExplorerTooltipContainer>
//                   <ObjectExplorer
//                      cacheId={cacheId}
//                      expressionId={expressionId}
//                      objectNodeRenderer={objectNodeRenderer}
//                      data={value}
//                      handleChange={onChange}
//                      outputRefs={outputRefs}
//                   />
//                </ExplorerTooltipContainer>
//             }
//          >
//             {isOutput ?
//                <GraphicalQuery
//                   outputRefs={outputRefs}
//                   visualIds={
//                      getVisualIdsFromRefs(
//                         outputRefs
//                      )
//                   }
//                   selected={selected}
//                />
//                :
//                <ObjectRootLabel
//                   data={value}
//                   compact={true}
//                   expressionType={expressionType}
//                   iconify={isIcon}
//                />
//             }
//          </ExplorerTooltip>)
//       }
//    </Portal>
// }

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

// {/*<Typography*/}
// {/*   variant="navigatorIndex"*/}
// {/*>*/}
// {/*   {value}*/}
// {/*</Typography>*/}
// {/*<Typography*/}
// {/*   variant="navigatorMax"*/}
// {/*>*/}
// {/*   /{max}*/}
// {/*</Typography>*/}

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
      scopeType,
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
         return branchNavigator?.getScopeType() === 'function' ? 'primary' : 'secondary';
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
   
   const isControlBlock = ScopeTypes.C === scopeType;
   // const isLoop
   //todo: exit scopes
   return (
      // <span>
      <NavigatorTooltip
         key={`nt0_${showNavigatorTooltip}`}
         title={
            <BlockNavigator
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
                 {isRelative ? currentRelativeNavigationIndex : value}
                     {/*{value} ({currentRelativeNavigationIndex})*/}
               </span>
                  <span
                     style={{padding: 1, fontSize: 12}}
                  >
                   |
                </span>
                  <span
                     style={{fontSize: 9, paddingTop: 3}}
                  >
                  {isRelative ? relativeMaxNavigationIndex : absoluteMaxNavigationIndex}
                     {/*{absoluteMaxNavigationIndex}({relativeMaxNavigationIndex})*/}
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
      // {/*{recursiveMaxNavigationIndex > 1 ?*/}
      // {/*   <NavigatorTooltip*/}
      // {/*      key={`nt1_${showNavigatorTooltip}`}*/}
      // {/*      title={*/}
      // {/*         <BlockNavigator*/}
      // {/*            min={1}*/}
      // {/*            // value={recursiveMaxNavigationIndex}*/}
      // {/*            max={recursiveMaxNavigationIndex}*/}
      // {/*            handleSliderChange={handleSliderChange}*/}
      // {/*            color="secondary"*/}
      // {/*         />*/}
      // {/*      }*/}
      // {/*      */}
      // {/*      {...(showNavigatorTooltip ? {arrow: false} : {open: false})}*/}
      // {/*      {...tooltipProps}*/}
      // {/*   >*/}
      // {/*      <NavigatorContainedButton*/}
      // {/*         variant="contained"*/}
      // {/*         color="secondary"*/}
      // {/*      >*/}
      // {/*   <span*/}
      // {/*      style={{fontSize: 11}}*/}
      // {/*   >*/}
      // {/*       {recursiveMaxNavigationIndex}*/}
      // {/*   </span>*/}
      // {/*         <span*/}
      // {/*            style={{padding: 1, fontSize: 13}}*/}
      // {/*         >*/}
      // {/*       &#166;*/}
      // {/*    </span>*/}
      // {/*         <span*/}
      // {/*            style={{fontSize: 9, paddingTop: 3}}*/}
      // {/*         >*/}
      // {/*         {recursiveMaxNavigationIndex}*/}
      // {/*   </span>*/}
      // {/*      </NavigatorContainedButton>*/}
      // {/*   </NavigatorTooltip>*/}
      // {/*   : null*/}
      // {/*   */}
      // {/*}*/}
      // </span>
   );
};

const LiveExpression = ({data, ...rest}) => {
   return (<Inspector
         data={data}
         // compact={true}
         // expressionType={expressionType}
         // iconify={isIcon}
         {...rest} />
   );
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
