import React, {
   useCallback,
   useState,
} from 'react';

import { withStyles} from '@material-ui/core/styles';
import Pin from 'mdi-material-ui/Pin';
import PinOutline from 'mdi-material-ui/PinOutline';
import MoreIcon from '@material-ui/icons/More';
import IconButton from '@material-ui/core/IconButton';

const actionStyles = () => ({
   stickyButton: {
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      flexFlow: 'row',
   },
   defaultButton: {
      zIndex: 0,
      display: 'flex',
      alignItems: 'center',
      flexFlow: 'row',
   },
});

const getStyledComponent = (
   Component = Pin,
   styles = {className: {fontSize: '.8rem'}}
) => withStyles(styles)(
   ({classes}) => (<Component className={classes.className}/>)
);

const StickyPin = getStyledComponent();
const StickyPinHover = getStyledComponent(PinOutline);
const DefaultPin = getStyledComponent(
   PinOutline,
   {
      className: {
         fontSize: '.8rem',
         color: 'grey',
         opacity: 0.1,
      }
   });

const FloatyMoreIcon = getStyledComponent(
   MoreIcon,
   {
      className: {
         fontSize: '.8rem',
         position: 'absolute',
         zIndex: 2,
         top: 2,
         right: 16,
      }
   });

const stickyPin = <StickyPin/>;
const stickyPinHover = <StickyPinHover/>;
const defaultPin = <DefaultPin/>;
export const defaultFloatyMoreIcon = <FloatyMoreIcon/>;

export const StickyAction = withStyles(actionStyles)(
   ({classes, isSticky, onStickyChange}
   ) => {
      const [isHovered, setIsHovered] = useState(false);
      const hoverIn = useCallback(
         () => setIsHovered(true)
         , [setIsHovered]
      );
      const hoverOut = useCallback(
         () => setIsHovered(false)
         , [setIsHovered]
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
      )
   });
