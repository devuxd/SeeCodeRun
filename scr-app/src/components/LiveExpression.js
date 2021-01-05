import React, {Component, memo} from 'react';
import PropTypes from 'prop-types';
import JSAN from 'jsan';
import isString from 'lodash/isString';

import ObjectExplorer from './ObjectExplorer';
import BranchNavigator from './BranchNavigator';

class LiveExpression extends Component {

    state = {
        sliderRange: [1],
        navigated: false,
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

    configureHandleSliderChange = (branchNavigatorChange) => {
        return (event, change) => {
            const {data} = this.props;
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

    render() {
        const {
            isDatum,
            datum: _data,
            data,
            objectNodeRenderer,
            expressionId,
            handleChange,
            branchNavigatorChange,
            color,
            sliderRange
        } = this.props;

        if (!!branchNavigatorChange) {
            const {
                sliderMin,
                sliderMax,
            } = this.getBranchDatum(data);

            const handleSliderChange =
                this.configureHandleSliderChange(branchNavigatorChange);

            const defaultValue = sliderRange[0];
            //console
            // .log(
            // 'bn',datum, sliderMin, sliderMax,
            // defaultValue, rangeStart, outputRefs
            // );
            return (
                <BranchNavigator
                    min={sliderMin}
                    max={sliderMax}
                    value={defaultValue}
                    handleSliderChange={handleSliderChange}
                    color={color}
                />
            );
        } else {
            const {
                datum,
                outputRefs
            } = isDatum ? {datum: _data, outputRefs: []} : this.getDatum(data);
            // todo function params vs arguments + return explorer
            return (
                <ObjectExplorer
                    expressionId={expressionId}
                    objectNodeRenderer={objectNodeRenderer}
                    data={datum}
                    handleChange={handleChange}
                    outputRefs={outputRefs}
                />
            );
        }
    }
}

LiveExpression.propTypes = {
    classes: PropTypes.object.isRequired,
    data: PropTypes.any,
};

export default memo(LiveExpression);