//Adapted from https://github.com/Flow11/zelda-botw-starter
import React, {useMemo} from 'react';
import classnames from 'classnames';
import {motion} from 'framer-motion';
import {withStyles} from '@material-ui/styles';

export const pulseOutlineAnimationId = `scr-a-graphicalHighlight-${Date.now()}`;
export const outlineWidth = 1;
export const contrastColor = '#FFBF47';
export const backgroundColorAnimationId =
   `scr-a-buttonGraphicalHighLight-${Date.now()}`;
export const pulseOutlineAnimation =
   `${pulseOutlineAnimationId} 0.75s 0.75s infinite`;
export const pulseStartOutline = {
   outlineWidth,
   outlineColor: contrastColor,
   outlineStyle: 'solid',
   outlineOffset: -1
};
export const backgroundColorAnimation =
   `${backgroundColorAnimationId} 0.75s 0.75s infinite`;
const triangleStyles = (theme) => ({'@global': {
      [`@keyframes ${backgroundColorAnimationId}`]: {
         '0%': {
            backgroundColor: theme.palette.background.default,
            color: theme.palette.secondary.main
         },
         '100%': {
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.text.primary
         },
      },
      [`@keyframes ${pulseOutlineAnimationId}`]: {
         '0%': pulseStartOutline,
         '100%': {
            ...pulseStartOutline,
            outlineWidth: 2,
            outlineColor: theme.palette.secondary.main,
         },
      },
   },
   triangleUp: {
      zIndex: theme.zIndex.tooltip - 1,
      position: 'absolute',
      width: 0,
      height: 0,
      borderLeft: '3px solid transparent',
      borderRight: '3px solid transparent',
      borderBottom: `3px solid ${theme.palette.secondary.main}`,
   },
   triangleDown: {
      zIndex: theme.zIndex.tooltip - 1,
      position: 'absolute',
      width: 0,
      height: 0,
      borderLeft: '3px solid transparent',
      borderRight: '3px solid transparent',
      borderTop: `3px solid ${theme.palette.secondary.main}`,
   },
   topLeft: {
      top: 0,
      left: 0,
      marginTop: -2,
      marginLeft: -3,
   },
   topRight: {
      top: 0,
      right: 0,
      marginTop: -2,
      marginRight: -3,
   },
   bottomLeft: {
      bottom: 0,
      left: 0,
      marginBottom: -2,
      marginLeft: -3,
   },
   bottomRight: {
      bottom: 0,
      right: 0,
      marginBottom: -2,
      marginRight: -3,
   }
});

const lineStyles = (theme) => ({
   cornerLine: {
      zIndex: theme.zIndex.tooltip - 1,
      position: 'absolute',
      width: 3,
      height: 3,
      backgroundColor: 'transparent',
      borderLeft: `1px solid ${theme.palette.secondary.main}`,
      borderTop: `1px solid ${theme.palette.secondary.main}`,
   },
   topLeft: {
      top: 0,
      left: 0,
      marginTop: -1,
      marginLeft: -1,
   },
   topRight: {
      top: 0,
      right: 0,
      marginTop: -1,
      marginRight: -1,
   },
   bottomLeft: {
      bottom: 0,
      left: 0,
      marginBottom: -1,
      marginLeft: -1,
   },
   bottomRight: {
      bottom: 0,
      right: 0,
      marginBottom: -1,
      marginRight: -1,
   }
});

const TrianglesBox = withStyles(triangleStyles)(
   ({
       classes,
       travelValue = 1.25,
       transition = {
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeIn",
          duration: 0.25,
       },
       transitions,
    }) => {
      const animateParams = useMemo(() => ({
            topLeft: {
               rotate: [-45, -45],
               x: [0, -travelValue],
               y: [0, -travelValue],
            },
            topRight: {
               rotate: [45, 45],
               x: [0, travelValue],
               y: [0, -travelValue],
            },
            bottomLeft: {
               rotate: [45, 45],
               x: [0, -travelValue],
               y: [0, travelValue],
            },
            bottomRight: {
               rotate: [-45, -45],
               x: [0, travelValue],
               y: [0, travelValue]
            },
         }),
         [travelValue]
      );
      
      const classNames = useMemo(() => ({
            topLeft: classnames(classes.triangleUp, classes.topLeft),
            topRight: classnames(classes.triangleUp, classes.topRight),
            bottomLeft:
               classnames(classes.triangleDown, classes.bottomLeft),
            bottomRight:
               classnames(classes.triangleDown, classes.bottomRight),
         }),
         [classes]
      );
      
      return (
         <>
            <motion.div
               animate={animateParams.topLeft}
               className={classNames.topLeft}
               transition={transitions?.topLeft || transition}
            />
            <motion.div
               animate={animateParams.topRight}
               className={classNames.topRight}
               transition={transitions?.topRight || transition}
            />
            <motion.div
               animate={animateParams.bottomLeft}
               className={classNames.bottomLeft}
               transition={transitions?.bottomLeft || transition}
            />
            <motion.div
               animate={animateParams.bottomRight}
               className={classNames.bottomRight}
               transition={transitions?.bottomRight || transition}
            />
         </>
      );
   }
);

export const LinesBox = withStyles(lineStyles)(
   ({
       classes,
       travelValue = 0,
       scale = [1, 1.25, 1],
       transition = {
          repeat: Infinity,
          repeatType: "mirror",
          duration: 1
       }
    }) => {
      const animateParams = useMemo(
         () => ({
            topLeft: {
               scale,
               rotate: [0, 0, 0],
               x: [0, -travelValue, 0],
               y: [0, -travelValue, 0]
            },
            topRight: {
               scale,
               rotate: [90, 90, 90],
               x: [0, travelValue, 0],
               y: [0, -travelValue, 0]
            },
            bottomLeft: {
               scale,
               rotate: [270, 270, 270],
               x: [0, -travelValue, 0],
               y: [0, travelValue, 0]
            },
            bottomRight: {
               scale,
               rotate: [180, 180, 180],
               x: [0, travelValue, 0],
               y: [0, travelValue, 0]
            }
         }),
         [travelValue, scale]
      );
      
      const classNames = useMemo(
         () => ({
            topLeft: classnames(classes.cornerLine, classes.topLeft),
            topRight: classnames(classes.cornerLine, classes.topRight),
            bottomLeft: classnames(classes.cornerLine, classes.bottomLeft),
            bottomRight: classnames(classes.cornerLine, classes.bottomRight)
         }),
         [classes]
      );
      
      return (
         <>
            <motion.div
               layout
               animate={animateParams.topLeft}
               className={classNames.topLeft}
               transition={transition}
            />
            <motion.div
               animate={animateParams.topRight}
               className={classNames.topRight}
               transition={transition}
            />
            <motion.div
               animate={animateParams.bottomLeft}
               className={classNames.bottomLeft}
               transition={transition}
            />
            <motion.div
               animate={animateParams.bottomRight}
               className={classNames.bottomRight}
               transition={transition}
            />
         </>
      );
   }
);

export const FocusBox =
   (({
        variant = 'Triangle',
        ...rest
     }) => (variant === 'Triangle' ? <TrianglesBox {...rest}/>
         : variant === 'Line' ? <LinesBox {...rest} />
            : null
   
   ));


//Adapted from:
//https://github.com/mock-end/random-color/blob/master/index.js
let ratio = 0.618033988749895;
let hue = Math.random();

const color = ({h, s, v, a}) => {
   return `hsla(${h},${s}%,${v}%,${a}%)`;
};

export function randomColor(saturation, value, alpha) {
   hue += ratio;
   hue %= 1;
   
   if (isNaN(saturation)) {
      saturation = 0.5;
   }
   
   if (isNaN(value)) {
      value = 0.95;
   }
   
   if (isNaN(alpha)) {
      alpha = 1;
   }
   
   return color({
      h: hue * 360,
      s: saturation * 100,
      v: value * 100,
      a: alpha * 100
   });
}
