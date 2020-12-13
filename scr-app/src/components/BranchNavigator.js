import React, {memo, useState, useEffect} from 'react';
import Slider from '@material-ui/core/Slider';
import PropTypes from "prop-types";
import {withStyles} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import {alpha} from '@material-ui/core/styles/colorManipulator';

export const formatBranchValue = (aValue = '-', max = '-') => {
    const value = `${
        '0'.repeat(max.toString().length - aValue.toString().length)
    }${aValue}`;
    return `${value}/${max}`;
};

const PrimarySlider = withStyles(theme => ({
    root: {
        color: theme.palette.primary.main,
    },
    thumb: {
        height: 8,
        width: 8,
        marginTop: -3,
        marginLeft: -4,
        '&:hover, &$focusVisible': {
            boxShadow: `0px 0px 0px 6px ${
                alpha(theme.palette.primary.main, 0.16)
            }`,
            '@media (hover: none)': {
                boxShadow: 'none',
            },
        },
        '&$active': {
            boxShadow: `0px 0px 0px 9px ${
                alpha(theme.palette.primary.main, 0.16)
            }`,
        },
    },
    active: {},
    focusVisible: {},
}))(Slider);

const SecondarySlider = withStyles(theme => ({
    root: {
        color: theme.palette.secondary.main,
    },
    thumb: {
        height: 8,
        width: 8,
        marginTop: -3,
        marginLeft: -4,
        '&:hover, &$focusVisible': {
            boxShadow: `0px 0px 0px 6px ${
                alpha(theme.palette.secondary.main, 0.16)
            }`,
            '@media (hover: none)': {
                boxShadow: 'none',
            },
        },
        '&$active': {
            boxShadow: `0px 0px 0px 9px ${
                alpha(theme.palette.secondary.main, 0.16)
            }`,
        },
    },
    active: {},
    focusVisible: {},
}))(Slider);


const styles = theme => ({
    root: {
        width: theme.spacing(50), //todo: make size relative to editor width
        maxWidth: theme.spacing(50),
        height: '100%',
        paddingLeft: 14,
        paddingRight: 14,
    },
    text: {
        fontWeight: 'bold',
    },
});

const BranchNavigator = ({
                             classes, min, max, value,
                             handleSliderChange, handleSliderChangeCommitted,
                             color, hideLabel, onMouseEnter, onMouseLeave
                         }) => {
    const CustomSlider = color === 'primary' ? PrimarySlider : SecondarySlider;
    const [v, sv] = useState(0);

    useEffect(() => {
            v && handleSliderChange(null, v);
        },
        [v, handleSliderChange]);

    return (
        <Paper className={classes.root}
               elevation={2}
               onMouseEnter={onMouseEnter}
               onMouseLeave={onMouseLeave}
        >
            {hideLabel ?
                null
                : <Typography
                    className={classes.text}>
                    {formatBranchValue(value, max)}
                </Typography>
            }
            <CustomSlider
                aria-label="branch navigator slider"
                valueLabelDisplay="auto"
                step={1}
                min={min}
                max={max}
                // value={value}
                // onChange={handleSliderChange}
                // onChangeCommitted={handleSliderChange}

                // min={1}
                // max={10}
                // defaultValue={1}

                // defaultValue={value}

                value={v}
                onChange={(e, v) => sv(v)}
            />
        </Paper>
    );

};

BranchNavigator.propTypes = {
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    handleSliderChange: PropTypes.func.isRequired,
    handleSliderChangeCommitted: PropTypes.func,
    hideLabel: PropTypes.bool
};

export default memo(withStyles(styles)(BranchNavigator));



