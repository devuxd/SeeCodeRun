import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Popover from 'material-ui/Popover';
import JSAN from 'jsan';
import ObjectExplorer from './ObjectExplorer';
import RangeSlider from "./RangeSlider";

const defaultCloseDelay = 1000;

const toClosedState = () => ({
  timeout: null,
  anchorEl: null,
  wasHovered: false, // at least once
  isHovered: false,
});

const handleOpen = (anchorEl, prevState) => {
  const {timeout} = prevState;
  clearTimeout(timeout);
  if (anchorEl) {
    return {
      anchorEl: anchorEl,
      timeout: null,
    };
  } else {
    return {timeout: null};
  }
};

const handleClose = (nextProps, prevState) => {
  const {isOpen} = nextProps;
  let {timeout, wasHovered, isHovered} = prevState;
  clearTimeout(timeout);

  if (isHovered) {
    return null;
  }

  if (!wasHovered && isOpen) {
    return null;
  }

  return toClosedState();
};

class LiveExpression extends Component {

  state = {
    timeout: null,
    anchorEl: null,
    wasHovered: false, // at least once
    isHovered: false,
    sliderRange: [1],
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    const {widget, isOpen} = nextProps;
    const anchorEl = widget && widget.contentWidget.getDomNode();
    if (anchorEl && isOpen) {
      return handleOpen(anchorEl, prevState);
    } else {
      return handleClose(nextProps, prevState);
    }
  }

  handleChange = isHovered => {
    return event => {
      let {timeout} = this.state;
      clearTimeout(timeout);
      this.setState({
        isHovered: isHovered,
        wasHovered: true,
      });
      (!isHovered) && setTimeout(() => this.handleClose(event), 0);
    };
  };

  handleClose = event => {
    const {closeDelay, isOpen} = this.props;
    let {timeout, wasHovered, isHovered} = this.state;
    clearTimeout(timeout);

    if (isHovered) {
      return null;
    }

    if (!wasHovered && isOpen) {
      return null;
    }

    if (!event) {
      return toClosedState();
    }

    timeout = setTimeout(() => {
        this.setState(toClosedState());
      },
      isNaN(closeDelay) ? defaultCloseDelay : closeDelay
    );
    this.setState({timeout: timeout});
  };

  handleSliderChange = (change) => { // slider
    this.setState({sliderRange: [change]});
  };

  render() {
    const {classes, style, data, objectNodeRenderer, expressionId, handleChange} = this.props;
    const {anchorEl, sliderRange} = this.state;
    const isActive = !!anchorEl;
    let datum;
    let sliderMin = 0, sliderMax = 0, rangeStart = sliderRange[0];//, rangeEnd = sliderRange[1];

    if (data) {
      if (data.length) {
        sliderMin = 1;
        sliderMax = data.length;
        // rangeStart=sliderMax-1;
        rangeStart = Math.min(rangeStart, sliderMax);
        // rangeStart = Math.min(rangeStart, sliderMax);
        //   rangeEnd = Math.min(rangeEnd, sliderMax);
        datum = data[rangeStart - 1].data ? JSAN.parse(data[rangeStart - 1].data) : datum;
      }
    } else {
      datum = data;
    }

    const defaultValue = rangeStart;//[rangeStart, rangeEnd,];
    const showSlider = sliderMin > 1 || sliderMax > 1;
    return (
      <Popover
        className={classes.popover}
        classes={{
          paper: classes.popoverPaper,
        }}
        style={style}
        modal={null}
        hideBackdrop={true}
        disableBackdropClick={true}
        disableAutoFocus={true}
        disableEnforceFocus={true}
        open={isActive}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={this.handleClose}
      >
        <div onMouseEnter={this.handleChange(true)}
             onMouseLeave={this.handleChange(false)}
             style={{...style, overflow: 'auto',}}
        >
          {showSlider &&
          <RangeSlider
            min={sliderMin}
            max={sliderMax}
            defaultValue={defaultValue}
            handleSliderChange={this.handleSliderChange}
          />
          }
          <div className={classes.objectExplorer}>
            <ObjectExplorer
              expressionId={expressionId}
              objectNodeRenderer={objectNodeRenderer}
              data={datum}
              handleChange={handleChange}
            />
          </div>
        </div>
      </Popover>
    );
  }
}

LiveExpression.propTypes = {
  classes: PropTypes.object.isRequired,
  widget: PropTypes.object.isRequired,
};

export default LiveExpression;
