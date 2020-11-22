//Adapted from https://github.com/Flow11/zelda-botw-starter
import React from "react";
import classnames from 'classnames';
import {motion} from "framer-motion";
import {withStyles} from '@material-ui/core/styles';

export const pulseOutlineAnimationId = `scr-a-graphicalHighlight-${Date.now()}`;
export const outlineWidth = 1;
export const contrastColor = '#FFBF47';
export const backgroundColorAnimationId = `scr-a-buttonGraphicalHighLight-${Date.now()}`;
export const pulseOutlineAnimation = `${pulseOutlineAnimationId} 0.75s 0.75s infinite`;
export const pulseStartOutline = `${outlineWidth}px solid ${contrastColor}`;
export const backgroundColorAnimation = `${backgroundColorAnimationId} 0.75s 0.75s infinite`;
const triangleStyles = (theme) => ({
    '@global': {
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
            '0%': {
                outline: pulseStartOutline,
            },
            '100%': {
                outline: `2px solid ${theme.palette.secondary.main}`
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


const Unit = ({animateParams, className}) => (
    <motion.div
        initial={false}
        animate={animateParams}
        transition={{
            loop: Infinity,
            ease: "easeIn",
            duration: 1,
        }}
        className={className}
    />
);

const TrianglesBox = withStyles(triangleStyles)
(({
      classes,
      travelValue = 1,
  }) => (
    <>
        <Unit
            animateParams={{
                rotate: "-45deg",
                x: [0, -travelValue, 0],
                y: [0, -travelValue, 0],
            }}
            className={classnames(classes.triangleUp, classes.topLeft)}
        />
        <Unit
            animateParams={{
                rotate: "45deg",
                x: [0, travelValue, 0],
                y: [0, -travelValue, 0],
            }}
            className={classnames(classes.triangleUp, classes.topRight)}
        />
        <Unit
            animateParams={{
                rotate: "45deg",
                x: [0, -travelValue, 0],
                y: [0, travelValue, 0],
            }}
            className={classnames(classes.triangleDown, classes.bottomLeft)}
        />
        <Unit
            animateParams={{
                rotate: "-45deg",
                x: [0, travelValue, 0],
                y: [0, travelValue, 0]
            }}
            className={classnames(classes.triangleDown, classes.bottomRight)}
        />
    </>
));

export const LinesBox = withStyles(lineStyles)
(({
      classes,
      travelValue = 0,
      scale = [0.8, 1.10, 0.8],
  }) => (
    <>
        <Unit
            animateParams={{
                rotate: "0deg",
                scale,
                x: [0, -travelValue, 0],
                y: [0, -travelValue, 0],
            }}
            className={classnames(classes.cornerLine, classes.topLeft)}
        />
        <Unit
            animateParams={{
                rotate: "90deg",
                scale,
                x: [0, travelValue, 0],
                y: [0, -travelValue, 0],
            }}
            className={classnames(classes.cornerLine, classes.topRight)}
        />
        <Unit
            animateParams={{
                rotate: "-90deg",
                scale,
                x: [0, -travelValue, 0],
                y: [0, travelValue, 0],
            }}
            className={classnames(classes.cornerLine, classes.bottomLeft)}
        />
        <Unit
            animateParams={{
                rotate: "-180deg",
                scale,
                x: [0, travelValue, 0],
                y: [0, travelValue, 0]
            }}
            className={classnames(classes.cornerLine, classes.bottomRight)}
        />
    </>
));

export const FocusBox =
    (({
          variant = 'Triangle',
          ...rest
      }) => (variant === 'Triangle' ? <TrianglesBox {...rest}/>
            : variant === 'Line' ? <LinesBox {...rest} />
                : null

    ));