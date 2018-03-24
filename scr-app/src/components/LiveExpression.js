import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Popover from 'material-ui/Popover';
import JSAN from 'jsan';
import ObjectExplorer from './ObjectExplorer';
import RangeSlider from "./RangeSlider";

const defaultCloseDelay = 1000;


class LiveExpression extends Component {

  state = {
    timeout: null,
    anchorEl: null,
    wasHovered: false, // at least once
    isHovered: false,
    sliderRange: [1],
  };

  toClosedState = () => ({
    timeout: null,
    anchorEl: null,
    wasHovered: false, // at least once
    isHovered: false,
    sliderRange: this.state.sliderRange || [1],
  });


  handleOpen = (anchorEl) => {
    const {timeout} = this.state;
    clearTimeout(timeout);
    if (anchorEl) {
      this.setState({
        anchorEl: anchorEl,
        timeout: null,
      });
    } else {
      this.setState({timeout: null});
    }
  };

  handleClose = event => {
    const {closeDelay, isOpen} = this.props;
    let {timeout, wasHovered, isHovered} = this.state;
    clearTimeout(timeout);

    if (isHovered) {
      return;
    }

    if (!wasHovered && isOpen) {
      return;
    }

    if (!event) {
      this.setState(this.toClosedState());
      return;
    }

    timeout = setTimeout(() => {
        this.setState(this.toClosedState());
      },
      isNaN(closeDelay) ? defaultCloseDelay : closeDelay
    );
    this.setState({timeout: timeout});
  };

  componentWillReceiveProps(nextProps/*, nextContext*/) {
    const {widget, isOpen} = nextProps;
    const anchorEl = widget.contentWidget.getDomNode();
    if (anchorEl && isOpen) {
      this.handleOpen(anchorEl);
    } else {
      this.handleClose();
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

  handleSliderChange = (change) => { // slider
    this.setState({sliderRange: [change]});
  };

  render() {
    const {classes, /*container,*/ style, theme, data, objectNodeRenderer} = this.props;
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
        datum = data[rangeStart-1].data ? JSAN.parse(data[rangeStart-1].data) : datum;
      }
    } else {
      datum = data;
    }

    const defaultValue = rangeStart;//[rangeStart, rangeEnd,];
    const showSlider = sliderMin > 1 || sliderMax > 1;
    return (
      <Popover
        // container={container}
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
              objectNodeRenderer={objectNodeRenderer}
              theme={theme}
              data={datum}
            />
          </div>
        </div>
      </Popover>
    );
  }
}

LiveExpression.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  widget: PropTypes.object.isRequired,
};

export default LiveExpression;
