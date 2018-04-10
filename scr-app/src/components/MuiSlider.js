/* eslint-disable react/prop-types */
import 'rc-slider/assets/index.css';
// import 'rc-tooltip/assets/bootstrap.css';
import React, {Component} from 'react';
import Slider, {Range} from 'rc-slider';
import PropTypes from 'prop-types';
//import {Button, Tooltip} from 'material-ui';
import Button from 'material-ui/Button';
import Tooltip from 'material-ui/Tooltip';

const createSliderWithTooltip = Slider.createSliderWithTooltip;
// const Range = createSliderWithTooltip(Slider.Range);
const Handle = Slider.Handle;

const handle = (tipFormatter) => ((props) => {
 const {index, ...restProps} = props;
  return (
    <SliderTooltip
      key={index}
      // {...restProps}
      {...props}
      tipFormatter={tipFormatter}/>
  );
});
const tipFormatter = max => (value => `${value}/${max}`);

class SliderTooltip extends Component {
  state = {isHovered: false};
  handleChange = (isHovered) => (() => this.setState({isHovered: isHovered}));

  render() {
    const {value, index, dragging, tipFormatter, ...restProps} = this.props;
    const {isHovered} = this.state;
    return (<Tooltip
      title={tipFormatter(value)}
      open={true||dragging || isHovered}
      placement="bottom-start"
      id={`${index}`}
      key={index}
    >
      <div onMouseEnter={this.handleChange(true)} onMouseLeave={this.handleChange(false)}>
        <Handle value={value} {...restProps} />
      </div>
    </Tooltip>);
  }
}

class RangeSlider extends Component {
  render() {
    const {min, max, defaultValue, handleSliderChange} = this.props;

    return (
      <Range
        min={min}
        max={max}
        defaultValue={[defaultValue[0]]}
        handle={handle(tipFormatter(max))}
        onChange={handleSliderChange}
      />
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

