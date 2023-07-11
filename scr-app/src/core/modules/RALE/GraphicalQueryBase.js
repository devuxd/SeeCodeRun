import React, {
    useMemo, useCallback, useContext,
} from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@mui/styles';
import Fab from '@mui/material/Fab';
import {backgroundColorAnimation as animation} from "../../../common/UI";
import {ALEContext} from "../ALE";
import {VisualQueryManager} from "../VisualQueryManager";

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
    }
});

export const UnStyledGraphicalQuery = ({
                                           classes,
                                           outputRefs,
                                           visualIds,
                                           visualQuery,
                                           // VisualQueryManager,
                                           FabProps = {}
                                       }) => {
    const {VisualQueryManager,} = useContext(ALEContext);
    const fabClasses = useMemo(
        () => {
            const selected = !!outputRefs.find((domEl) => {
                return VisualQueryManager?.isGraphicalElementSelected(
                    domEl, visualQuery
                );
            });

            return {
                root: selected ? classes.buttonRootSelected : classes.buttonRoot
            };
        },
        [VisualQueryManager, visualQuery, outputRefs, classes]
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

    return (
        <Fab color="secondary"
             variant="extended"
             aria-label={`visual element number ${visualIds}`}
             elevation={0}
             classes={fabClasses}
             onClick={onClick}
             {...FabProps}
        >
            {`${visualIds}`}
        </Fab>
    );

};

UnStyledGraphicalQuery.propTypes = {
    classes: PropTypes.object.isRequired,
    outputRefs: PropTypes.array.isRequired,
    visualIds: PropTypes.array.isRequired,
    visualQuery: PropTypes.array,
    VisualQueryManager: PropTypes.object,
    FabProps: PropTypes.object,
};

const GraphicalQueryBase =
    withStyles(graphicalQueryStyles)(UnStyledGraphicalQuery);

export default GraphicalQueryBase;
