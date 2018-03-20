/* eslint-disable react/prop-types */
import 'rc-slider/assets/index.css';
import React, {Component} from 'react';
import Range from 'rc-slider/lib/Range';
import PropTypes from "prop-types";
import {Button, FormControlLabel, FormGroup, MenuItem} from "material-ui";
class RangeSlider extends Component {
  render() {
    const {min, max, defaultValue, handleSliderChange} = this.props;
    return (
      <MenuItem >
        <FormGroup row>
          <FormControlLabel
            control={
              <Button>
              <Range
                min={min}
                max={max}
                defaultValue={[defaultValue[0]]}
                onChange={handleSliderChange}
                handleStyle={[{backgroundColor:'red', borderColor:'orange'}]}
                trackStyle={[{backgroundColor:'red', borderColor:'orange'}]}
                railStyle={{backgroundColor:'blue', borderColor:'pink'}}
                // tipFormatter={()=>''}
              />
              </Button>
            }
            label={`${defaultValue[0]}/${max}`}
          />
        </FormGroup>
      </MenuItem>
    );
  }
}

RangeSlider.propTypes = {
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  defaultValue: PropTypes.array.isRequired,
  handleSliderChange: PropTypes.func.isRequired,
};

export default RangeSlider;

