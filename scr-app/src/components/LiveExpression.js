import React, {Component, memo} from 'react';
import PropTypes from 'prop-types';
import Popover from '@material-ui/core/Popover';
import JSAN from 'jsan';
import isString from 'lodash/isString';
import debounce from 'lodash.debounce';

import ObjectExplorer, {hasOwnTooltip} from './ObjectExplorer';
import BranchNavigator from "./BranchNavigator";

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
            anchorEl,
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
            if (!isHovered) {
                timeout = setTimeout(
                    () => this.handleClose(event), 1000
                );
            }
            this.setState({
                isHovered: isHovered,
                wasHovered: true,
                timeout
            });
        };
    };

    handleClose = (event, reason) => {
        if (reason === 'backdropClick') {
            return;
        }
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
        let datum, outputRefs = [];
        let sliderMin = 0, sliderMax = 0, rangeStart = sliderRange[0];
        //, rangeEnd = sliderRange[1];

        if (data) {
            if (data.length) {
                sliderMin = 1;
                sliderMax = data.length;
                // rangeStart=sliderMax-1;
                rangeStart = Math.min(rangeStart, sliderMax);
                // rangeStart = Math.min(rangeStart, sliderMax);
                //   rangeEnd = Math.min(rangeEnd, sliderMax);
                datum = isString(data[rangeStart - 1].data) ?
                    JSAN.parse(data[rangeStart - 1].data)
                    : data[rangeStart - 1].data;
                if (data[rangeStart - 1].outputRefs) {
                    outputRefs = data[rangeStart - 1].outputRefs;
                }
            }
        } else {
            datum = data;
        }
        return {datum, sliderMin, sliderMax, rangeStart, outputRefs}
    };

    getBranchDatum = (data) => {
        const {sliderRange} = this.state;
        let datum;
        let sliderMin = 0, sliderMax = 0, rangeStart = sliderRange[0];
        //, rangeEnd = sliderRange[1];

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
        if (this.state.navigated && sliderMax <= this.state.data?.length) {
            return;
        }
        this.setState({sliderRange: [sliderMax + 1]});
    }, 250);
    tm = null;
    configureHandleSliderChange = (branchNavigatorChange) => {
        const {data} = this.props;
        return (event, change) => {
            if (data && data.length) {
                // console.log('SC', data, change);
                // this.handleSliderChange(change);
                // clearTimeout(this.tm);
                // this.tm =setTimeout(
                //     ()=>
                branchNavigatorChange(
                    data[change],
                    change,
                    change - 1 > -1 ? data[change - 1] : 0
                )
                // ,1500);
            }
        };
    };

    onMouseEnter = this.handleChange(true);

    onMouseLeave = this.handleChange(false);

    render() {
        const {
            classes,
            style,
            data,
            objectNodeRenderer,
            expressionId,
            handleChange,
            branchNavigatorChange,
            color,
            sliderRange
        } = this.props;
        const {anchorEl} = this.state;
        const isBranchNavigator = !!branchNavigatorChange;
        // const {anchorEl: currentAnchorEl} = this.state;
        // this.anchorEl = currentAnchorEl ||this.anchorEl;
        // const {anchorEl} = this;
        const shouldBeActive = !!anchorEl &&
            (!!isBranchNavigator &&
                !(isBranchNavigator && data && data.length > 1));
        const isActive = this.open || shouldBeActive;
        // this.open = isActive; // debug
        const {
            datum,
            sliderMin,
            sliderMax,
            rangeStart,
            outputRefs
        } = isBranchNavigator ?
            this.getBranchDatum(data) : this.getDatum(data);
        const handleSliderChange = isBranchNavigator ?
            this.configureHandleSliderChange(branchNavigatorChange)
            : this.handleSliderChange;
        const origin = isBranchNavigator ? branchPopoverOrigin : popoverOrigin;
        // if (outputRefs && outputRefs.length) {
        //     console.log('or', data, outputRefs);
        // }
        const isPop = hasOwnTooltip(datum);
        // todo function params vs arguments + return explorer
        const explorer = isBranchNavigator ? null
            : <div className={classes.objectExplorer}>
                <ObjectExplorer
                    expressionId={expressionId}
                    objectNodeRenderer={objectNodeRenderer}
                    data={datum}
                    handleChange={handleChange}
                    outputRefs={outputRefs}
                />
            </div>;
        let navigatorStyle = {
            ...style,
            overflow: 'auto',
            minWidth: branchNavigatorChange ? 200 : 50
        };
        const defaultValue = isBranchNavigator ? sliderRange[0] : rangeStart;
        //[rangeStart, rangeEnd,];

        // console
        // .log('bn',datum, sliderMin, sliderMax, rangeStart, outputRefs);

        return (
            isBranchNavigator && (sliderMin > 1 || sliderMax > 1) ?
                <BranchNavigator
                    min={sliderMin}
                    max={sliderMax}
                    value={defaultValue}
                    handleSliderChange={handleSliderChange}
                    color={color}
                    hideLabel={isBranchNavigator}
                    // onMouseEnter={this.onMouseEnter}
                    // onMouseLeave={this.onMouseLeave}
                />
                : <Popover
                    className={classes.popover}
                    classes={{
                        paper: classes.popoverPaper,
                    }}
                    style={style}
                    modal={null}
                    hideBackdrop={true}
                    disableAutoFocus={true}
                    disableEnforceFocus={true}
                    open={isPop && isActive}
                    anchorEl={anchorEl}
                    {...origin}
                    onClose={this.handleClose}
                    elevation={2}
                >
                    <div
                        onMouseEnter={this.onMouseEnter}
                        onMouseLeave={this.onMouseLeave}
                        style={navigatorStyle}
                    >
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

    componentWillUnmount() {
        this.updateSliderMax.cancel();
        clearTimeout(this.state.timeout);
    }
}

LiveExpression.propTypes = {
    classes: PropTypes.object.isRequired,
    widget: PropTypes.object.isRequired,
    data: PropTypes.any,
};

export default memo(LiveExpression);