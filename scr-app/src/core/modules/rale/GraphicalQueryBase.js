import React, {
    useMemo, useCallback, useContext,
} from 'react';
import PropTypes from 'prop-types';
import {CSSStyleDeclaration} from 'cssstyle';
import {withStyles} from '@mui/styles';
import Fab from '@mui/material/Fab';
import {backgroundColorAnimation as animation} from "../../../common/UI";
// import {ALEContext} from "../ALE";
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import PastebinContext from "../../../contexts/PastebinContext";
import HtmlIcon from '@mui/icons-material/Html';
// import {VisualQueryManager} from "../VisualQueryManager";

const graphicalQueryStyles = theme => ({
    buttonRoot: {
        boxShadow: 'unset',
        minHeight: 'unset',
        minWidth: 'unset',
        margin: 0,
        // marginTop: -1,
        paddingLeft: theme.spacing(0.5),
        paddingRight: theme.spacing(0.5),
        height: theme.typography.pxToRem(14),
        fontSize: theme.typography.pxToRem(10),
        lineHeight: 1,
        border: `1px solid ${theme.palette.secondary.main}`,
        color: theme.palette.secondary.main,
        backgroundColor: theme.palette.background.default,
        '&:hover': {
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.background.default,
        }
    },
    buttonRootPreview: {
        boxShadow: 'unset',
        minHeight: 'unset',
        minWidth: 'unset',
        margin: 0,
        // marginTop: -1,
        paddingLeft: theme.spacing(0.5),
        paddingRight: theme.spacing(0.5),
        height: theme.typography.pxToRem(14),
        fontSize: theme.typography.pxToRem(10),
        lineHeight: 1,
        border: `1px solid ${theme.palette.secondary.main}`,
        zIndex: theme.zIndex.tooltip,
        animation,
    },
    buttonRootSelected: {
        boxShadow: 'unset',
        minHeight: 'unset',
        minWidth: 'unset',
        margin: 0,
        // marginTop: -1,
        paddingLeft: theme.spacing(0.5),
        paddingRight: theme.spacing(0.5),
        height: theme.typography.pxToRem(14),
        fontSize: theme.typography.pxToRem(10),
        lineHeight: 1,
        border: `1px solid ${theme.palette.secondary.main}`,
        zIndex: theme.zIndex.tooltip,
        animation,
    },
    buttonRootWarn: {
        boxShadow: 'unset',
        minHeight: 'unset',
        minWidth: 'unset',
        margin: 0,
        // marginTop: -1,
        paddingLeft: theme.spacing(0.5),
        paddingRight: theme.spacing(0.5),
        height: theme.typography.pxToRem(14),
        fontSize: theme.typography.pxToRem(10),
        lineHeight: 1,
        color: "white",
        backgroundColor: "red",
        border: `1px dashed red`,
        // border: `1px solid ${theme.palette.secondary.main}`,
        zIndex: theme.zIndex.tooltip,
        // animation,
    }
});

// Function to check if a property is a valid CSS property
const isValidCssProperty = (property, value) => {
    const style = new CSSStyleDeclaration();
    style[property] = value;
    console.log("", {style, property, value});
    return style[0] !== undefined;
};

export const useComputablePropsLoose = (data) => {
    return useMemo(() => {
        const {style} = data ?? {};
        const {length = 0, cssText, ...props} = style ?? {};

        const propValues = {};
        const nonComputableProps = [];
        const validProps = [];

        for (let prop in props) {
            propValues[prop] = props[prop];
            if (!isNaN(prop) || !isValidCssProperty(prop, props[prop])) {
                nonComputableProps.push(prop);
                continue;
            }
            validProps.push(prop);
        }

        return [cssText, nonComputableProps, propValues, validProps];
    }, [data]);
};


// const CSSComputedStyles = global?.document?.body ? global?.getComputedStyle(global.document.body) : {};
// const CSSComputableStyles = Object.values(CSSComputedStyles ?? {});


export const useComputableProps = (data, isStrict = false, forcePrefix = false) => {//Strict
    return useMemo(() => {
        const nonComputableProps = [];

        // console.log("_graphical", {object, visualIds, CSSComputableStyles});
        const {style} = data ?? {};

        const {length = 0, cssText, ...props} = style ?? {};
        // console.log("PPP", style, props, length);

        const computedProps = [];
        if (length) {
            for (let i = 0; i < length; i++) {
                computedProps.push(props[i]);
            }
        }

        const propValues = {};
        for (let prop in props) {
            if (!isNaN(prop)) {
                continue;
            }

            const incs = forcePrefix ? computedProps.includes(prop) : !!computedProps.find(_prop => _prop.endsWith(prop));

            if (incs || (isStrict && isValidCssProperty(prop, props[prop]))) {
                propValues[prop] = props[prop];
            } else {
                nonComputableProps.push(prop);
            }
        }


        // if (nonComputableProps.length) {
        //     // csErrorBadge = true;
        //     // console.log("_graphical", {object, visualIds, CSSComputableStyles, nonComputableProps});
        // }

        return [cssText, nonComputableProps, propValues];
    }, [data]);

};

export const UnStyledGraphicalQuery = ({
                                           classes,
                                           outputRefs,
                                           visualIds,
                                           visualQuery,
                                           // VisualQueryManager,
                                           FabProps = {},
                                           data,
                                       }) => {
    const {aleContext, searchState, isGraphicalLocatorActive, ...plop} = useContext(PastebinContext);
    const {VisualQueryManager, ...rest} = aleContext;
    // console.log("rest", rest, searchState, plop, visualQuery);
    const tagName = data?.tagName ?? "DOM";
    // const queryText =visualIds;
    let queryContent = isGraphicalLocatorActive || visualQuery?.length ? visualIds : `${tagName}`
    // <HtmlIcon/>;
    const [cssText, nonComputableProps, propValues] = useComputableProps(data);
    const cssWarning = nonComputableProps.length > 0;
    if (cssWarning) {
        queryContent = `!${tagName}`;
        // queryContent = <Badge badgeContent={"X"}><Box>{tagName}</Box></Badge>;
    }

    const color = nonComputableProps.length ? "error" : isGraphicalLocatorActive ? "info" : "success";
    const fabClasses = useMemo(
        () => {
            const selected = !!outputRefs.find((domEl) => {
                return VisualQueryManager?.isGraphicalElementSelected(
                    domEl, visualQuery
                );
            });

            return {
                root: cssWarning ? classes.buttonRootWarn : selected ? classes.buttonRootSelected : classes.buttonRoot
            };
        },
        [VisualQueryManager, visualQuery, outputRefs, classes, cssWarning]
    );

    const onClick = useCallback(
        (event) => {
            // console.log("click", {outputRefs, visualIds, VisualQueryManager});
            if (!VisualQueryManager) {
                return;
            }

            event.stopPropagation();
            VisualQueryManager.onChange(outputRefs, visualIds, 'select');
        },
        [VisualQueryManager, outputRefs, visualIds]
    );

    let out = (
        <Fab color={color}
             variant="extended"
            // aria-label={`visual element number ${visualIds}`}
             elevation={0}
             classes={fabClasses}
             onClick={onClick}
             {...FabProps}
        >
            {queryContent}
        </Fab>
    );

    // if (nonComputableProps?.length) {
    //     out = <Badge badgeContent={"CSS!"}>{out}</Badge>
    // }

    return (out);

};

UnStyledGraphicalQuery.propTypes = {
    classes: PropTypes.object.isRequired,
    outputRefs: PropTypes.array.isRequired,
    visualIds: PropTypes.array.isRequired,
    visualQuery: PropTypes.array,
    VisualQueryManager: PropTypes.object,
    FabProps: PropTypes.object,
    data: PropTypes.any,
};

const GraphicalQueryBase =
    withStyles(graphicalQueryStyles)(UnStyledGraphicalQuery);

export default GraphicalQueryBase;
