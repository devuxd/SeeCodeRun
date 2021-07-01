import React, {useCallback,} from 'react';
import Slider from '@material-ui/core/Slider';
import PropTypes from 'prop-types';
import {
    darken,
    styled,
} from '@material-ui/core/styles';
import { withStyles } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';

export const formatBranchValue = (aValue = '-', max = '-') => {
    const value = `${
        '0'.repeat(max.toString().length - aValue.toString().length)
    }${aValue}`;
    return `${value}/${max}`;
};

const styles = theme => ({
    root: {
        width: theme.spacing(50), //todo: make size relative to editor width
        maxWidth: theme.spacing(50),
        height: '100%',
        paddingLeft: 14,
        paddingRight: 14,
    },
});

const SecondarySlider = styled(Slider)(
    ({theme}) => ({
            color: theme.palette.secondary.main,
            ':hover': {
                color: darken(theme.palette.secondary.main, 0.2)
            }
        }
    )
);

const SliderContainer = withStyles(styles)(
    ({classes, ...rest}) => (
        <Paper
            className={classes.root}
            elevation={2}
            {...rest}
        />
    )
);

const BranchNavigator = (
    {
        min, max, value,
        showLabel, color = 'primary',
        handleSliderChange,
        SliderProps = {},
        ...rest
    }
) => {

    const CustomSlider = color === 'primary' ? Slider : SecondarySlider;

    const onChange = useCallback(
        (event, newValue) => (
            newValue !== value && handleSliderChange(event, newValue)
        ),
        [value, handleSliderChange]
    );

    return (
        <SliderContainer
            {...rest}
        >
            {showLabel &&
            <Typography>
                {formatBranchValue(value, max)}
            </Typography>
            }
            <CustomSlider
                aria-label="branch navigator slider"
                valueLabelDisplay="auto"
                step={1}
                min={min}
                max={max}
                value={value}
                onChange={onChange}
                {...SliderProps}
            />
        </SliderContainer>
    );

};

BranchNavigator.propTypes = {
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    color: PropTypes.string,
    handleSliderChange: PropTypes.func.isRequired,
    handleSliderChangeCommitted: PropTypes.func,
    showLabel: PropTypes.bool
};

export default BranchNavigator;
