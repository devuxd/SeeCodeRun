import React from 'react';
import PropTypes from 'prop-types';

import {withStyles} from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
// import Checkbox from '@material-ui/core/Checkbox';
// import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
// import CheckBoxIcon from '@material-ui/icons/CheckBox';

import {VisualQueryManager} from '../containers/Pastebin';
import {getVisualIdsFromRefs} from "../containers/GraphicalMapper";

export const buttonAnimationId = `scr-a-buttonGraphicalHighLight-${Date.now()}`;
const styles = theme => ({
    '@global': {
        [`@keyframes ${buttonAnimationId}`]: {
            '0%': {backgroundColor: theme.palette.background.default, color: theme.palette.secondary.main},
            '100%': {backgroundColor: theme.palette.secondary.main, color: theme.palette.background.default},
        },
    },

    buttonRoot: {
        border: `1px solid ${theme.palette.background.default}`,
        boxShadow: 'unset',
        minHeight: 'unset',
        minWidth: 'unset',
        margin: '0',
        paddingLeft: theme.spacing(0.5),
        paddingRight: theme.spacing(0.5),
        height: 14,
        fontSize: 10,
        lineHeight: 1,
    },
    buttonRootSelected: {
        border: `1px solid ${theme.palette.secondary.main}`,
        backgroundColor: theme.palette.background.default,
        zIndex: theme.zIndex.tooltip,
        color: theme.palette.secondary.main,
        boxShadow: 'unset',
        minHeight: 'unset',
        minWidth: 'unset',
        margin: '0',
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
        height: 14,
        fontSize: 10,
        lineHeight: 1,

    },
    buttonRootHovered: {
        border: `1px solid ${theme.palette.secondary.main}`,
        zIndex: theme.zIndex.tooltip,
        animation: `${buttonAnimationId} 0.75s 0.75s infinite`,
        boxShadow: 'unset',
        minHeight: 'unset',
        minWidth: 'unset',
        margin: '0',
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
        height: 14,
        fontSize: 10,
        lineHeight: 1,
    },
    size: {
        marginLeft: theme.spacing(0.5),
        width: 12,
        height: 12,
    },
    checkbox: {
        fontSize: 12,
    },
    checkboxSelected: {
        animation: `${buttonAnimationId} 0.75s 0.75s infinite`,
        fontSize: 12,
    },
});

class GraphicalQuery extends React.Component {
    state = {
        isHovered: false,
    };

    render() {
        const {classes, outputRefs, visualIds, selected, color, ...rest} = this.props;
        const {isHovered} = this.state;
        return <div
            onMouseEnter={() => this.setState({isHovered: true})}
            onMouseLeave={() => this.setState({isHovered: false})}
        >
            <Fab color={color || 'secondary'}
                 variant="extended"
                 aria-label={`visual element number ${visualIds}`}
                 elevation={0}
                 className={isHovered ? classes.buttonRootHovered : selected ? classes.buttonRootSelected : classes.buttonRoot}
                 onClick={() => {
                     VisualQueryManager.onChange(outputRefs, visualIds, 'click');
                 }}
                 onMouseEnter={() => {
                     VisualQueryManager.onChange(outputRefs, visualIds, 'mouseenter');
                 }}
                 onMouseLeave={() => {
                     VisualQueryManager.onChange(outputRefs, visualIds, 'mouseleave');
                 }}
                 {...rest}
            >
                {`${visualIds}`}
                {/*{(isHovered || selected) && <Checkbox*/}
                {/*className={classes.size}*/}
                {/*icon={<CheckBoxOutlineBlankIcon*/}
                {/*className={selected ? classes.checkboxSelected : classes.checkbox}/>}*/}
                {/*checkedIcon={<CheckBoxIcon className={selected ? classes.checkboxSelected : classes.checkbox}/>}*/}
                {/*value={`${visualIds}`}*/}
                {/*checked={selected}*/}
                {/*/>}*/}
            </Fab>
        </div>;
    }
}

GraphicalQuery.propTypes = {
    classes: PropTypes.object.isRequired,
    outputRefs: PropTypes.array.isRequired,
    visualIds: PropTypes.array.isRequired,
    selected: PropTypes.bool,
    color: PropTypes.string,
};

export default withStyles(styles)(GraphicalQuery);