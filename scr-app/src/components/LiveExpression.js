import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Popover from 'material-ui/Popover';
import JSAN from 'jsan';
import isString from 'lodash/isString';
import debounce from 'lodash.debounce';

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

const popoverOrigin = {
    anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'left',
    },
    transformOrigin: {
        vertical: 'top',
        horizontal: 'left',
    }
};

const branchPopoverOrigin = {
    anchorOrigin: {
        vertical: 'top',
        horizontal: 'left',
    },
    transformOrigin: {
        vertical: 'bottom',
        horizontal: 'left',
    }
};

class LiveExpression extends Component {

    state = {
        timeout: null,
        anchorEl: null,
        wasHovered: false, // at least once
        isHovered: false,
        sliderRange: [1],
        navigated: false,
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
        this.setState({sliderRange: [change], navigated: true,});
    };

    getDatum = (data) => {
        const {sliderRange} = this.state;
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
                datum = isString(data[rangeStart - 1].data) ? JSAN.parse(data[rangeStart - 1].data) : data[rangeStart - 1].data;
            }
        } else {
            datum = data;
        }
        return {datum, sliderMin, sliderMax, rangeStart}
    };

    getBranchDatum = (data) => {
        const {sliderRange} = this.state;
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
                datum = data[rangeStart - 1];
            }
        } else {
            datum = data;
        }
        return {datum, sliderMin, sliderMax, rangeStart}
    };

    updateSliderMax = debounce((sliderMax) => {
        if (this.state.navigated && this.state.data && sliderMax <= this.state.data.length) {
            return;
        }
        this.setState({sliderRange: [sliderMax+1]});
    }, 250);

    configureHandleSliderChange = (branchNavigatorChange) => {
        const {data} = this.props;
        return (change) => {
            if (data && data.length) {
                // console.log(data, change);
                branchNavigatorChange(data[change], change, change-1 > -1?data[change-1]: 0);
                this.handleSliderChange(change);
            }
        };
    };

    render() {
        const {classes, style, data, objectNodeRenderer, expressionId, handleChange, branchNavigatorChange, color} = this.props;
        const {anchorEl} = this.state;
        const isActive = !!anchorEl;
        const {datum, sliderMin, sliderMax, rangeStart} = branchNavigatorChange ?
            this.getBranchDatum(data) : this.getDatum(data);
        const handleSliderChange = branchNavigatorChange ?
            this.configureHandleSliderChange(branchNavigatorChange) : this.handleSliderChange;
        const origin = branchNavigatorChange ? branchPopoverOrigin : popoverOrigin;
        const explorer = branchNavigatorChange ? null // todo function params vs arguments + return explorer
            : (<div className={classes.objectExplorer}>
                <ObjectExplorer
                    expressionId={expressionId}
                    objectNodeRenderer={objectNodeRenderer}
                    data={datum}
                    handleChange={handleChange}
                />
            </div>);
        let navigatorStyle = {...style, overflow: 'auto', minWidth: branchNavigatorChange ? 200 : 50};
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
                {...origin}
                onClose={this.handleClose}
            >
                <div onMouseEnter={this.handleChange(true)}
                     onMouseLeave={this.handleChange(false)}
                     style={navigatorStyle}
                >
                    {showSlider &&
                    <RangeSlider
                        min={sliderMin}
                        max={sliderMax}
                        defaultValue={defaultValue}
                        handleSliderChange={handleSliderChange}
                        color={color}
                    />
                    }
                    {explorer}
                </div>
            </Popover>
        );
    }

    componentDidUpdate() {
        const {data} = this.props;
        if (data && data.length !== this.sliderMax) {
            this.sliderMax = data.length;
            this.updateSliderMax(this.sliderMax);
        }
    }
}

LiveExpression.propTypes = {
    classes: PropTypes.object.isRequired,
    widget: PropTypes.object.isRequired,
    data: PropTypes.any,
};

export default LiveExpression;
