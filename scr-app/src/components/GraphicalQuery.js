import React, {memo, useCallback} from 'react';
import PropTypes from 'prop-types';

import {withStyles} from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';

import {VisualQueryManager} from '../containers/Pastebin';
import {backgroundColorAnimation as animation} from "./UI";

const styles = theme => ({
    buttonRoot: {
        boxShadow: 'unset',
        minHeight: 'unset',
        minWidth: 'unset',
        margin: '0',
        paddingLeft: theme.spacing(0.5),
        paddingRight: theme.spacing(0.5),
        height: 14,
        fontSize: 10,
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
        margin: '0',
        paddingLeft: theme.spacing(0.5),
        paddingRight: theme.spacing(0.5),
        height: 14,
        fontSize: 10,
        lineHeight: 1,
        border: `1px solid ${theme.palette.secondary.main}`,
        zIndex: theme.zIndex.tooltip,
        animation,
    },
    buttonRootSelected: {
        boxShadow: 'unset',
        minHeight: 'unset',
        minWidth: 'unset',
        margin: '0',
        paddingLeft: theme.spacing(0.5),
        paddingRight: theme.spacing(0.5),
        height: 14,
        fontSize: 10,
        lineHeight: 1,
        border: `1px solid ${theme.palette.secondary.main}`,
        zIndex: theme.zIndex.tooltip,
        animation,
    }
});

const GraphicalQuery = ({
                            classes,
                            outputRefs,
                            visualIds,
                            selected,
                            color= 'secondary',
                            ...rest
                        }) => {
    const handleClick = useCallback((event) => {
            event.stopPropagation();
            VisualQueryManager
                .onChange(outputRefs, visualIds, 'select')
        },
        [outputRefs, visualIds]);

    return (
        <Fab color={color}
             variant="extended"
             aria-label={`visual element number ${visualIds}`}
             elevation={0}
             className={
                 selected ? classes.buttonRootSelected : classes.buttonRoot
             }
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