/* eslint-disable react/prop-types */
import 'rc-slider/assets/index.css';
import React, {Component} from 'react';
import Range from 'rc-slider';
// import Range from 'rc-slider/lib/Range';
import PropTypes from "prop-types";
import {withStyles} from 'material-ui/styles';
import Typography from 'material-ui/Typography';
import {ListItem, ListItemText} from 'material-ui/List';

export const formatBranchValue = (aValue = '-', max = '-') => {
  const value = `${'0'.repeat(max.toString().length - aValue.toString().length)}${aValue}`;
  return `${value}/${max}`;
};

let sliderStyle = {};
const styles = theme => {
  sliderStyle.handleStyle = {
    backgroundColor: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
  };
  sliderStyle.trackStyle = {
    backgroundColor: theme.palette.primary.main,
  };
  sliderStyle.railStyle = {
    backgroundColor: theme.palette.action.active,
  };

  return {
    text: {
      marginLeft: theme.spacing.unit,
    },
  }
};

class RangeSlider extends Component {
  render() {
    const {classes, min, max, defaultValue, handleSliderChange} = this.props;
    return (
      <ListItem
        role={undefined}
        dense
        disableGutters
        divider
       // key={max}
      >
        <Typography className={classes.text}>{formatBranchValue(defaultValue, max)}</Typography>
        <ListItemText>
          <Range
            min={min}
            max={max}
            defaultValue={defaultValue}
            onChange={handleSliderChange}
            handleStyle={sliderStyle.handleStyle}
            trackStyle={sliderStyle.trackStyle}
            railStyle={sliderStyle.railStyle}
          />
        </ListItemText>
      </ListItem>
    );
  }
}

RangeSlider.propTypes = {
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  defaultValue: PropTypes.number.isRequired,
  //defaultValue: PropTypes.array.isRequired,
  handleSliderChange: PropTypes.func.isRequired,
};

export default withStyles(styles)(RangeSlider);

