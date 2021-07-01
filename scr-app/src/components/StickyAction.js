import React, {
   useCallback, useMemo,
   useState,
} from 'react';

import { withStyles} from '@material-ui/styles';
import PushPinIcon from '@material-ui/icons/PushPin';
import PushPinOutlinedIcon from '@material-ui/icons/PushPinOutlined';
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
   Component = PushPinIcon,
   styles = {className: {fontSize: '.8rem'}}
) => withStyles(styles)(
   ({classes}) => (<Component className={classes.className}/>)
);

const StickyPin = getStyledComponent();
const StickyPinHover = getStyledComponent(PushPinOutlinedIcon);
const DefaultPin = getStyledComponent(
   PushPinOutlinedIcon,
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
      
      // const iconButtonClasses= useMemo(
      //    () => {
      //    return{  label: isSticky? classes.stickyButton : classes.defaultButton};
      //    },
      //    [classes, isSticky]
      // );
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
            // classes={iconButtonClasses}
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
