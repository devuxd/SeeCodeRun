/* eslint-disable react/prop-types */
// import 'rc-slider/assets/index.css';
import React, {Component} from 'react';
// import Range from 'rc-slider';
// import Slider from 'rc-slider/lib/Slider';
import Slider from '@material-ui/lab/Slider';
import PropTypes from "prop-types";
import {withStyles} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import {fade, darken} from '@material-ui/core/styles/colorManipulator';
// import Slider from "./@material/Slider";

export const formatBranchValue = (aValue = '-', max = '-') => {
    const value = `${'0'.repeat(max.toString().length - aValue.toString().length)}${aValue}`;
    return `${value}/${max}`;
};


let sliderStyles = {primary: {}, secondary: {}, default: {}};
const styles = theme => {
    sliderStyles['primary'].handleStyle = {
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.primary.main,
    };
    sliderStyles['secondary'].handleStyle = {
        backgroundColor: theme.palette.secondary.main,
        borderColor: theme.palette.secondary.main,
    };
    sliderStyles['default'].handleStyle = {
        backgroundColor: fade(theme.palette.action.active, 1),
        borderColor: theme.palette.action.active,
    };

    sliderStyles['primary'].trackStyle = {
        backgroundColor: darken(theme.palette.primary.main, 0.05),
    };
    sliderStyles['secondary'].trackStyle = {
        backgroundColor: darken(theme.palette.secondary.main, 0.05),
    };
    sliderStyles['default'].trackStyle = {
        backgroundColor: darken(theme.palette.action.active, 0.05),
    };

    sliderStyles['primary'].railStyle = {
        backgroundColor: darken(theme.palette.background.default, 0.25),
    };
    sliderStyles['secondary'].railStyle = {
        backgroundColor: darken(theme.palette.background.default, 0.25),
    };
    sliderStyles['default'].railStyle = {
        backgroundColor: darken(theme.palette.background.default, 0.25),
    };

    return {
        '@global': {
            '.rc-slider': {
                padding: '6px 0',
            },
            '.rc-slider-step': {
                height: '2px',
            },
            '.rc-slider-track': {
                height: '2px',
            },
            '.rc-slider-rail': {
                height: '2px',
            },
        },
        text: {
            marginLeft: theme.spacing(1),
        },
        slider: {
            marginLeft: theme.spacing(2),
            // padding: 0,
        },
        sliderWithLabel: {
            marginLeft: theme.spacing(2),
        }
    }
};

const getSliderStyle = (color) => {
    switch (color) {
        case 'primary':
            return sliderStyles['primary'];
        case 'secondary':
            return sliderStyles['secondary'];
        default:
            return sliderStyles['default'];
    }
};

class BranchNavigator extends Component {
    render() {
        const {classes, min, max, value, handleSliderChange, color, hideLabel} = this.props;
        const sliderStyle = getSliderStyle(color);
        return (
            <ListItem>
                {hideLabel ?
                    null
                    : <Typography className={classes.text}>{formatBranchValue(value, max)}</Typography>
                }
                <ListItemText className={hideLabel ? classes.slider : classes.sliderWithLabel}>
                    <Slider
                        min={min}
                        max={max}
                        step={1}
                        color={'secondary'}
                        // defaultValue={defaultValue}
                        value={value}
                        onChange={handleSliderChange}
                        // handleStyle={sliderStyle.handleStyle}
                        // trackStyle={sliderStyle.trackStyle}
                        // railStyle={sliderStyle.railStyle}
                    />
                </ListItemText>
            </ListItem>
        );
    }
}

BranchNavigator.propTypes = {
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    //defaultValue: PropTypes.array.isRequired,
    handleSliderChange: PropTypes.func.isRequired,
    hideLabel: PropTypes.bool
};

export default withStyles(styles)(BranchNavigator);

