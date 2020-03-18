import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import MoreVertIcon from '@material-ui/icons/MoreVert';

//source: https://raw.githubusercontent.com/nickuraltsev/react-overflow/master/src/OverflowDetector.jsx
export class OverflowAndScrollDetector extends React.Component {

    static getDerivedStateFromProps(nextProps, prevState) {
        let derivedState = null;
        if (nextProps.disableOverflowDetection) {
            derivedState = {disableOverflowDetectionX: true, disableOverflowDetectionY: true};
        } else {
            if (prevState.disableOverflowDetection && !nextProps.disableOverflowDetection) {
                derivedState = {disableOverflowDetectionX: false, disableOverflowDetectionY: false};
            }
        }

        if (nextProps.isRememberScrollDisabled) {
            derivedState = derivedState || {};
            derivedState = {...derivedState, isRememberScrollDisabledX: true, isRememberScrollDisabledY: true};
        } else {
            if (prevState.isRememberScrollDisabled && !nextProps.isRememberScrollDisabled) {
                derivedState = derivedState || {};
                derivedState = {...derivedState, isRememberScrollDisabledX: false, isRememberScrollDisabledY: false};
            }
        }

        return derivedState;
    }

    constructor(props) {
        super(props);
        this.isOverflowedX = false;
        this.isOverflowedY = false;
        this.scrollerRef = React.createRef();
        this.state = {
            disableOverflowDetection: false,
            disableOverflowDetectionX: false,
            disableOverflowDetectionY: false,
            isRememberScrollDisabled: false,
            isRememberScrollDisabledX: false,
            isRememberScrollDisabledY: false,
        };
    }

    checkOverflow = () => {
        const isOverflowedX =
            this.scrollerRef.current.scrollWidth > this.scrollerRef.current.clientWidth;
        const isOverflowedY =
            this.scrollerRef.current.scrollHeight > this.scrollerRef.current.clientHeight;

        const isOverflowed = isOverflowedX || isOverflowedY;

        if ((!this.props.disableOverflowDetectionX && isOverflowedX !== this.isOverflowedX)
            || (!this.props.disableOverflowDetectionY && isOverflowedY !== this.isOverflowedY)) {
            this.isOverflowedX = isOverflowedX;
            this.isOverflowedY = isOverflowedY;

            this.props.onOverflowChange && this.props.onOverflowChange({isOverflowed, isOverflowedX, isOverflowedY});
        }
    };

    render() {
        const {className, children} = this.props;
        return (
            <div ref={this.scrollerRef} className={className}>
                {children}
            </div>
        );
    }

    componentDidMount() {
        this.scrollListener = (e) => {
            const payload = {
                currentScrollTop: this.scrollerRef.current.scrollTop,
                currentScrollLeft: this.scrollerRef.current.scrollLeft,
                isScrollEnd: false,
                isScrollEndX: false,
                isScrollEndY: false,
                event: e,
            };

            if (this.scrollerRef.current.offsetHeight + this.scrollerRef.current.scrollTop >= this.scrollerRef.current.scrollHeight) {
                payload.isScrollEnd = true;
                payload.isScrollEndY = true;
            } else {
                if (this.scrollerRef.current.offsetWidth + this.scrollerRef.current.scrollLeft >= this.scrollerRef.current.scrollWidth) {
                    payload.isScrollEnd = true;
                    payload.isScrollEndX = true;
                }
            }
            this.props.onScrollChange && this.props.onScrollChange(payload);
        };
        this.scrollerRef.current.addEventListener('scroll', this.scrollListener);
        this.checkOverflow();
    };

    getSnapshotBeforeUpdate(prevProps, prevState) {
        // Are we adding new items to the list?
        // Capture the current height of the list so we can adjust scroll later.
        let snapshot = null;
        const {isRememberScrollDisabledX, isRememberScrollDisabledY} = prevState;

        if (!isRememberScrollDisabledX) {
            snapshot = {scrollWidth: this.scrollerRef.current.scrollWidth};
        }

        if (!isRememberScrollDisabledY) {
            snapshot = snapshot || {};
            snapshot = {...snapshot, scrollHeight: this.scrollerRef.current.scrollHeight};
        }

        return snapshot;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (snapshot !== null) {
            if (snapshot.scrollHeight) {
                this.scrollerRef.current.scrollTop +=
                    this.scrollerRef.current.scrollHeight - snapshot.scrollHeight;
            }

            if (snapshot.scrollWidth) {
                this.scrollerRef.current.scrollLeft +=
                    this.scrollerRef.current.scrollWidth - snapshot.scrollWidth;
            }
        }
        this.checkOverflow();
    }

    componentWillUnmount() {
        this.scrollerRef.current.removeEventListener('scroll', this.scrollListener);
    }
}

OverflowAndScrollDetector.propTypes = {
    onOverflowChange: PropTypes.func,
    onScrollChange: PropTypes.func,
    children: PropTypes.node,
    className: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),
};

OverflowAndScrollDetector.defaultProps = {
    className: {overflow: 'auto', position: 'relative', width: 300, height: 50}
};

const styles = theme => ({
    root: {
        position: 'relative',
        overflow: 'hidden',
    },
    rootX: {
        position: 'relative',
        overflow: 'hidden',
        paddingRight: theme.spacing(2),
        paddingBottom: 0,
    },
    rootY: {
        position: 'relative',
        overflow: 'hidden',
        paddingRight: 0,
        paddingBottom: theme.spacing(2),
    },
    rootBoth: {
        position: 'relative',
        overflow: 'hidden',
        paddingRight: theme.spacing(2),
        paddingBottom: theme.spacing(2),
    },
    overflowXIcon: {
        color: 'default',
        position: 'absolute',
        top: '50%',
        right: 0,
        marginTop: theme.spacing(-1),
        padding: theme.spacing(0.25),
        fontSize: theme.spacing(2),
    },
    overflowYIcon: {
        zIndex: theme.zIndex.snackbar,
        position: 'absolute',
        left: '50%',
        bottom: 0,
        marginLeft: theme.spacing(-1),
        padding: theme.spacing(0.25),
        fontSize: theme.spacing(2),
    }
});

class OverflowComponent extends React.Component {

    state = {
        currentScrollLeft: 0,
        currentScrollTop: 0,
        isOverflowed: false,
        isOverflowedX: false,
        isOverflowedY: false,
    };

    handleOverflowChange = ({isOverflowed, isOverflowedX, isOverflowedY}) => {
        this.setState({isOverflowed, isOverflowedX, isOverflowedY});
    };

    handleScrollChange = ({currentScrollLeft, currentScrollTop}) => {
        this.setState({currentScrollLeft, currentScrollTop});
    };

    render() {
        const {
            classes, overflowXClassName, contentClassName, children, placeholder, placeholderClassName, placeholderDisableGutters,
            overflowXAdornment, overflowYAdornment, contentAlign, ...rest
        } = this.props;

        const {
            currentScrollLeft, currentScrollTop, isOverflowed, isOverflowedX, isOverflowedY,
        } = this.state;

        const showOverflowX = !currentScrollLeft && isOverflowedX;
        const showOverflowY = !currentScrollTop && isOverflowedY;

        const rClassName = placeholderDisableGutters ? classes.root :
            showOverflowX && showOverflowY ?
                classes.rootBoth : showOverflowX ? (overflowXClassName||classes.rootX) : showOverflowY ? classes.rootY : classes.root;
        const content = (!!this.isPlaceHolder || (isOverflowed && !!placeholder)) ? placeholder : children;
        this.isPlaceHolder = content === placeholder;
        const className = this.isPlaceHolder ? placeholderClassName : contentClassName;
        const overflowXIcon = overflowXAdornment || <MoreHorizIcon className={classes.overflowXIcon}/>;
        const overflowYIcon = overflowYAdornment || <MoreVertIcon className={classes.overflowYIcon}/>;
        return (
            <div className={rClassName}>
                {(!placeholderDisableGutters && showOverflowX) &&
                overflowXIcon
                }
                {(!placeholderDisableGutters && showOverflowY) &&
                overflowYIcon
                }
                <OverflowAndScrollDetector
                    className={className}
                    onOverflowChange={this.handleOverflowChange}
                    onScrollChange={this.handleScrollChange}
                    {...rest}
                >
                    {/*<div style={{marginLeft:contentAlign==='center'? '50%': '0px'}}>*/}
                    {content}
                    {/*</div>*/}
                </OverflowAndScrollDetector>
            </div>
        );
    }


}

OverflowComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    disableOverflowDetection: PropTypes.bool,
    disableOverflowDetectionX: PropTypes.bool,
    disableOverflowDetectionY: PropTypes.bool,
    onHandleOverflowChange: PropTypes.func,
    onScrollChange: PropTypes.func,
    isRememberScrollDisabled: PropTypes.bool,
    isRememberScrollDisabledX: PropTypes.bool,
    isRememberScrollDisabledY: PropTypes.bool,
    placeholder: PropTypes.node,
    placeholderClassName: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),
    placeholderDisableGutters: PropTypes.bool,
    overflowXAdornment: PropTypes.node,
    overflowYAdornment: PropTypes.node,
    contentAlign: PropTypes.string,
};

OverflowComponent.defaultProps = {
    disableOverflowDetection: false,
    disableOverflowDetectionX: false,
    disableOverflowDetectionY: false,
    isRememberScrollDisabled: false,
    isRememberScrollDisabledX: false,
    isRememberScrollDisabledY: false,
    contentAlign: 'center'
};

export default withStyles(styles)(OverflowComponent);