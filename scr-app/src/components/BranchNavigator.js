/* eslint-disable react/prop-types */
// import 'rc-slider/assets/index.css';
import React, {Component} from 'react';
// import Range from 'rc-slider';
// import Slider from 'rc-slider/lib/Slider';
import Slider from '@material-ui/core/Slider';
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

const makeCustomSlider = (rootColor, railColor='currentColor', trackColor='currentColor')=>withStyles({
    /* Styles applied to the root element. */
    // root: {
    //     // height: 2,
    //     // width: '100%',
    //     // boxSizing: 'content-box',
    //     // padding: '11px 0',
    //     // display: 'inline-block',
    //     // position: 'relative',
    //     // cursor: 'pointer',
    //     // touchAction: 'none',
    //     color: rootColor,//theme.palette.primary.main,
    //     // /* Remove grey highlight*/
    //     // WebkitTapHighlightColor: 'transparent',
    //     // '&$disabled': {
    //     //     cursor: 'default',
    //     //     color: disabledColor,//theme.palette.grey[400],
    //     // },
    //     // '&$vertical': {
    //     //     width: 2,
    //     //     height: '100%',
    //     //     padding: '0 11px',
    //     // },
    // },
    /* Styles applied to the root element if `marks` is provided with at least one label. */
    // marked: {
    //     marginBottom: 20,
    //     '&$vertical': {
    //         marginBottom: 'auto',
    //         marginRight: 20,
    //     },
    // },
    /* Pseudo-class applied to the root element if `orientation="vertical"`. */
    vertical: {},
    /* Pseudo-class applied to the root element if `disabled={true}`. */
    disabled: {},
    /* Styles applied to the rail element. */
    rail: {
        // display: 'block',
        // position: 'absolute',
        // width: '100%',
        // height: 2,
        // borderRadius: 1,
        backgroundColor: railColor,//'currentColor',
        opacity: 0.38,
        '$vertical &': {
            height: '100%',
            width: 2,
        },
    },
    /* Styles applied to the track element. */
    track: {
        // display: 'block',
        // position: 'absolute',
        // height: 2,
        // borderRadius: 1,
        backgroundColor: trackColor,//'currentColor',
        // '$vertical &': {
        //     width: 2,
        // },
    },
    /* Styles applied to the thumb element. */
    // thumb: {
    //     position: 'absolute',
    //     width: 12,
    //     height: 12,
    //     marginLeft: -6,
    //     marginTop: -5,
    //     boxSizing: 'border-box',
    //     borderRadius: '50%',
    //     outline: 0,
    //     backgroundColor: 'currentColor',
    //     display: 'flex',
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //     transition: theme.transitions.create(['box-shadow'], {
    //         duration: theme.transitions.duration.shortest,
    //     }),
    //     '&$focusVisible,&:hover': {
    //         boxShadow: `0px 0px 0px 8px ${fade(theme.palette.primary.main, 0.16)}`,
    //         '@media (hover: none)': {
    //             boxShadow: 'none',
    //         },
    //     },
    //     '&$active': {
    //         boxShadow: `0px 0px 0px 14px ${fade(theme.palette.primary.main, 0.16)}`,
    //     },
    //     '$disabled &': {
    //         pointerEvents: 'none',
    //         width: 8,
    //         height: 8,
    //         marginLeft: -4,
    //         marginTop: -3,
    //         '&:hover': {
    //             boxShadow: 'none',
    //         },
    //     },
    //     '$vertical &': {
    //         marginLeft: -5,
    //         marginBottom: -6,
    //     },
    //     '$vertical$disabled &': {
    //         marginLeft: -3,
    //         marginBottom: -4,
    //     },
    // },
    /* Pseudo-class applied to the thumb element if it's active. */
    // active: {},
    /* Pseudo-class applied to the thumb element if keyboard focused. */
    // focusVisible: {},
    /* Styles applied to the thumb label element. */
    valueLabel: {},
    /* Styles applied to the mark element. */
    // mark: {
    //     position: 'absolute',
    //     width: 2,
    //     height: 2,
    //     borderRadius: 1,
    //     backgroundColor: 'currentColor',
    // },
    /* Styles applied to the mark element if active (depending on the value). */
    // markActive: {
    //     backgroundColor: lighten(theme.palette.primary.main, 0.76),
    // },
    /* Styles applied to the mark label element. */
    // markLabel: {
    //     ...theme.typography.body2,
    //     color: theme.palette.text.secondary,
    //     position: 'absolute',
    //     top: 22,
    //     transform: 'translateX(-50%)',
    //     whiteSpace: 'nowrap',
    //     '$vertical &': {
    //         top: 'auto',
    //         left: 22,
    //         transform: 'translateY(50%)',
    //     },
    // },
    /* Styles applied to the mark label element if active (depending on the value). */
    // markLabelActive: {
    //     color: theme.palette.text.primary,
    // },
})(Slider);

const CustomSlider = makeCustomSlider();

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
                {/*<ListItemText className={hideLabel ? classes.slider : classes.sliderWithLabel}>*/}
                    <CustomSlider
                        aria-label="branch navigator slider"
                        valueLabelDisplay="off"
                        min={min}
                        max={max}
                        step={1}
                        value={value}
                        onChange={handleSliderChange}
                    />
                {/*</ListItemText>*/}
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

