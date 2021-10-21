import React, {
   useCallback,
   useState,
} from 'react';

import {withStyles} from '@mui/styles';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import MoreIcon from '@mui/icons-material/More';
import IconButton from '@mui/material/IconButton';

const baseIconStyle = {
   fontSize: '.875rem',
};

const defaultPinStyles = ({palette}) => ({
   className: {
      ...baseIconStyle,
      color: palette.text.secondary,
      opacity: 0.15,
   }
});

const stickyPinStyles = ({palette}) => ({
   className: {
      ...baseIconStyle,
      color: palette.text.secondary,
   }
});

const floatyMoreIconStyles = ({palette}) => ({
   className: {
      ...baseIconStyle,
      color: palette.text.secondary,
      position: 'absolute',
      zIndex: 2,
      top: 2,
      right: 16,
   }
});

const getStyledComponent = (
   Component = PushPinOutlinedIcon,
   styles = defaultPinStyles
) => withStyles(styles)(
   ({classes}) => (<Component className={classes.className}/>)
);

const DefaultPin = getStyledComponent();
const StickyPin = getStyledComponent(PushPinIcon, stickyPinStyles);
const StickyPinHover = getStyledComponent(PushPinOutlinedIcon, stickyPinStyles);
const FloatyMoreIcon = getStyledComponent(MoreIcon, floatyMoreIconStyles);

const stickyPin = <StickyPin/>;
const stickyPinHover = <StickyPinHover/>;
const defaultPin = <DefaultPin/>;
export const defaultFloatyMoreIcon = <FloatyMoreIcon/>;


const baseButtonStyle = {
   display: 'flex',
   alignItems: 'center',
   flexFlow: 'row',
   zIndex: 0,
};

const actionStyles = ({spacing}) => ({
   defaultButton: {
      ...baseButtonStyle,
      padding: spacing(0.5),
   },
   stickyButton: {
      ...baseButtonStyle,
      padding: spacing(0.5),
      zIndex: 1,
   },
});

export const StickyAction =
   withStyles(
      actionStyles
   )(
      ({
          classes, isSticky, onStickyChange
       }) => {
         const [isHovered, setIsHovered] = useState(false);
         const hoverIn = useCallback(
            () => setIsHovered(true),
            []
         );
         const hoverOut = useCallback(
            () => setIsHovered(false),
            []
         );
         return (
            <IconButton
               onClick={onStickyChange}
               onMouseEnter={hoverIn}
               onMouseLeave={hoverOut}
               size="small"
               className={
                  isSticky ? classes.stickyButton
                     : classes.defaultButton
               }
            >
               {
                  isSticky ? stickyPin
                     : isHovered ? stickyPinHover
                        : defaultPin
               }
            </IconButton>
         );
      }
   );
