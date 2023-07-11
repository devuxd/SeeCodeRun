import React, {memo, useCallback, useMemo} from 'react';
import PropTypes from 'prop-types';

import {withStyles} from '@mui/styles';
import Fab from '@mui/material/Fab';

import {VisualQueryManager} from '../core/modules/VisualQueryManager';
import {backgroundColorAnimation as animation} from '../common/UI';

const styles = theme => ({
    buttonRoot: {
        boxShadow: 'unset',
        minHeight: 'unset',
        minWidth: 'unset',
        margin: 0,
        marginTop: -1,
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
        marginTop: -1,
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
        marginTop: -1,
        paddingLeft: theme.spacing(0.5),
        paddingRight: theme.spacing(0.5),
        height: theme.typography.pxToRem(14),
        fontSize: theme.typography.pxToRem(10),
        lineHeight: 1,
        border: `1px solid ${theme.palette.secondary.main}`,
        zIndex: theme.zIndex.tooltip,
        animation,
    }
});

// deprecated: todo switch to *base in RALE
const GraphicalQuery = ({
                            classes,
                            outputRefs,
                            visualIds,
                            visualQuery,
                            selected,
                            color = 'secondary',
                            ...rest
                        }) => {
    const handleClick = useCallback((event) => {
            // console.log("click", {Q: true, VisualQueryManager, outputRefs, visualIds});
            event.stopPropagation();
            VisualQueryManager.onChange(outputRefs, visualIds, 'select');
        },
        [outputRefs, visualIds]);

    // const fabClasses = useMemo(
    //    () => ({root: selected ? classes.buttonRootSelected : classes.buttonRoot}),
    //    [selected, classes]
    // );

    const fabClasses = useMemo(
        () => {
            const selected = !!outputRefs.find((domEl) => {
                return VisualQueryManager?.isGraphicalElementSelected(
                    domEl, visualQuery ?? visualIds
                );
            });

            return {
                root: selected ? classes.buttonRootSelected : classes.buttonRoot
            };
        },
        [VisualQueryManager, visualQuery, visualIds, outputRefs, classes]
    );

    return (
        <Fab color={color}
             variant="extended"
             aria-label={`visual element number ${visualIds}`}
             elevation={0}
             classes={fabClasses}
             onClick={handleClick}
             {...rest}
        >
            {`${visualIds}`}
        </Fab>
    );

};

GraphicalQuery.propTypes = {
    classes: PropTypes.object.isRequired,
    outputRefs: PropTypes.array.isRequired,
    visualIds: PropTypes.array.isRequired,
    selected: PropTypes.bool,
    color: PropTypes.string,
};

export default memo(withStyles(styles)(GraphicalQuery));
