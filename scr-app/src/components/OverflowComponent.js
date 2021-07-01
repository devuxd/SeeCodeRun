import React, {createRef, PureComponent} from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/styles';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import MoreVertIcon from '@material-ui/icons/MoreVert';

//source:
// https://raw.githubusercontent.com/
// nickuraltsev/react-overflow/master/src/OverflowDetector.jsx
export class OverflowAndScrollDetector extends PureComponent {

    static getDerivedStateFromProps(nextProps, prevState) {
        let derivedState = null;
        if (nextProps.disableOverflowDetection) {
            derivedState = {
                disableOverflowDetectionX: true,
                disableOverflowDetectionY: true
            };
        } else {
            if (prevState.disableOverflowDetection
                && !nextProps.disableOverflowDetection) {
                derivedState = {
                    disableOverflowDetectionX: false,
                    disableOverflowDetectionY: false
                };
            }
        }

        if (nextProps.isRememberScrollDisabled) {
            derivedState = derivedState || {};
            derivedState = {
                ...derivedState,
                isRememberScrollDisabledX: true,
                isRememberScrollDisabledY: true
            };
        } else {
            if (prevState.isRememberScrollDisabled
                && !nextProps.isRememberScrollDisabled) {
                derivedState = derivedState || {};
                derivedState = {
                    ...derivedState,
                    isRememberScrollDisabledX: false,
                    isRememberScrollDisabledY: false
                };
            }
        }

        return derivedState;
    }

    constructor(props) {
        super(props);
        this.isOverflowedX = false;
        this.isOverflowedY = false;
        this.scrollerRef = createRef();
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
            this.scrollerRef.current.scrollWidth >
            this.scrollerRef.current.clientWidth;
        const isOverflowedY =
            this.scrollerRef.current.scrollHeight >
            this.scrollerRef.current.clientHeight;

        const isOverflowed = isOverflowedX || isOverflowedY;

        if ((!this.props.disableOverflowDetectionX
            && isOverflowedX !== this.isOverflowedX)
            || (!this.props.disableOverflowDetectionY
                && isOverflowedY !== this.isOverflowedY)) {
            this.isOverflowedX = isOverflowedX;
            this.isOverflowedY = isOverflowedY;
            this.props.onOverflowChange && this.props.onOverflowChange({
                isOverflowed,
                isOverflowedX,
                isOverflowedY
            });
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
        this.scrollListener = (event) => {
            const payload = {
                currentOffsetWidth: this.scrollerRef.current.offsetWidth,
                currentScrollLeft: this.scrollerRef.current.scrollLeft,
                currentScrollWidth: this.scrollerRef.current.scrollWidth,
                currentOffsetHeight: this.scrollerRef.current.offsetHeight,
                currentScrollTop: this.scrollerRef.current.scrollTop,
                currentScrollHeight: this.scrollerRef.current.scrollHeight,
                isScrollEnd: false,
                isScrollEndX: false,
                isScrollEndY: false,
                event,
            };

            const ySen = payload.currentScrollTop ? 1.01 : 0;
            const xSen = payload.currentScrollLeft ? 1.01 : 0;

            if (ySen &&
                payload.currentScrollHeight - payload.currentOffsetHeight - ySen
                <= payload.currentScrollTop
            ) {
                payload.isScrollEnd = true;
                payload.isScrollEndY = true;
            }
            if (xSen &&
                payload.currentScrollWidth - payload.currentOffsetWidth - xSen
                <= payload.currentScrollLeft
            ) {
                payload.isScrollEnd = true;
                payload.isScrollEndX = true;
            }

            this.props.onScrollChange && this.props.onScrollChange(payload);
        };
        this.scrollerRef.current.addEventListener(
            'scroll', this.scrollListener
        );
        this.checkOverflow();
    };

    getSnapshotBeforeUpdate(prevProps, prevState) {
        // Are we adding new items to the list?
        // Capture the current height of the list so we can adjust scroll later.
        let snapshot = null;
        const {
            isRememberScrollDisabledX,
            isRememberScrollDisabledY
        } = prevState;

        if (!isRememberScrollDisabledX) {
            snapshot = {scrollWidth: this.scrollerRef.current.scrollWidth};
        }

        if (!isRememberScrollDisabledY) {
            snapshot = snapshot || {};
            snapshot = {
                ...snapshot,
                scrollHeight: this.scrollerRef.current.scrollHeight
            };
        }

        return snapshot;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (snapshot !== null) {
            if (snapshot.scrollHeight) {
                this.scrollerRef.current.scrollTop +=
                    this.scrollerRef.current.scrollHeight -
                    snapshot.scrollHeight;
            }

            if (snapshot.scrollWidth) {
                this.scrollerRef.current.scrollLeft +=
                    this.scrollerRef.current.scrollWidth -
                    snapshot.scrollWidth;
            }
        }
        this.checkOverflow();
    }

    componentWillUnmount() {
        this.scrollerRef.current.removeEventListener(
            'scroll', this.scrollListener
        );
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
            paddingBottom: 0,
        },
        rootY: {
            position: 'relative',
            overflow: 'hidden',
            paddingRight: 0,
        },
        rootBoth: {
            position: 'relative',
            overflow: 'hidden',
            paddingBottom: 0,
            paddingRight: 0,
        },
        rootXScrolled: {
            position: 'relative',
            overflow: 'hidden',
            paddingBottom: 0,
            borderLeft: `1px dotted ${theme.palette.text.secondary}`,
            borderRight: `1px dotted ${theme.palette.text.secondary}`,
        },
        rootYScrolled: {
            position: 'relative',
            overflow: 'hidden',
            paddingRight: 0,
            borderTop: `1px dotted ${theme.palette.text.secondary}`,
            borderBottom: `1px dotted ${theme.palette.text.secondary}`,
        },
        rootBothScrolled: {
            position: 'relative',
            overflow: 'hidden',
            paddingBottom: 0,
            paddingRight: 0,
            border: `1px dotted ${theme.palette.text.secondary}`,
        },
        rootXScrollEnd: {
            position: 'relative',
            overflow: 'hidden',
            paddingBottom: 0,
        },
        rootYScrollEnd: {
            position: 'relative',
            overflow: 'hidden',
            paddingRight: 0,
            marginRight: theme.spacing(-1),
        },
        rootBothScrollEnd: {
            position: 'relative',
            overflow: 'hidden',
            paddingBottom: 0,
            marginBottom: theme.spacing(-2),
            paddingRight: 0,
            marginRight: theme.spacing(-1),
        },
        overflowXIcon: {
            zIndex: 2,
            color: theme.palette.text.secondary,
            backgroundColor: 'inherit',
            position: 'absolute',
            top: theme.spacing(2.5),
            marginTop: theme.spacing(-2),
            right: theme.spacing(0.5),
            marginRight: theme.spacing(-0.5),
            padding: theme.spacing(0.25),
            fontSize: theme.spacing(2),
        },
        overflowYIcon: {
            zIndex: 2,
            color: theme.palette.text.secondary,
            backgroundColor: 'inherit',
            position: 'absolute',
            left: '50%',
            marginLeft: theme.spacing(-1.5),
            bottom: theme.spacing(0.5),
            marginBottom: theme.spacing(-0.5),
            padding: theme.spacing(0.25),
            fontSize: theme.spacing(2),
        },
        overflowXIconFab: {
            zIndex: 1,
            backgroundColor: theme.palette.background.paper,
            position: 'absolute',
            top: theme.spacing(2.5),
            marginTop: theme.spacing(-2),
            right: theme.spacing(0.5),
            marginRight: theme.spacing(-0.5),
            borderRadius: '50%',
            height: theme.spacing(2),
            width: theme.spacing(2),
            padding: 0,
            fontSize: theme.spacing(2),
        },
        overflowYIconFab: {
            zIndex: 1,
            backgroundColor: theme.palette.background.paper,
            position: 'absolute',
            left: '50%',
            marginLeft: theme.spacing(-1.5),
            bottom: theme.spacing(0.5),
            marginBottom: theme.spacing(-0.5),
            borderRadius: '50%',
            height: theme.spacing(2),
            width: theme.spacing(2),
            padding: 0,
            fontSize: theme.spacing(2),
        },
        overflowXEndIcon: {
            zIndex: 1,
            color: theme.palette.text.secondary,
            backgroundColor: 'inherit',
            position: 'absolute',
            top: theme.spacing(2.5),
            marginTop: theme.spacing(-2),
            left: theme.spacing(0.5),
            marginLeft: theme.spacing(-0.5),
            padding: theme.spacing(0.25),
            fontSize: theme.spacing(2),
        },
        overflowYEndIcon: {
            zIndex: 1,
            color: theme.palette.text.secondary,
            backgroundColor: 'inherit',
            position: 'absolute',
            left: '50%',
            marginLeft: theme.spacing(-1.5),
            top: theme.spacing(0.5),
            marginTop: theme.spacing(-0.5),
            padding: theme.spacing(0.25),
            fontSize: theme.spacing(2),
        },
        overflowXEndIconFab: {
            zIndex: 1,
            backgroundColor: theme.palette.background.paper,
            position: 'absolute',
            top: theme.spacing(2.5),
            marginTop: theme.spacing(-2),
            left: theme.spacing(0.5),
            marginLeft: theme.spacing(-0.5),
            borderRadius: '50%',
            height: theme.spacing(2),
            width: theme.spacing(2),
            padding: 0,
            fontSize: theme.spacing(2),
        },
        overflowYEndIconFab: {
            zIndex: 1,
            backgroundColor: theme.palette.background.paper,
            position: 'absolute',
            left: '50%',
            marginLeft: theme.spacing(-1.5),
            top: theme.spacing(0.5),
            marginTop: theme.spacing(-0.5),
            borderRadius: '50%',
            height: theme.spacing(2),
            width: theme.spacing(2),
            padding: 0,
            fontSize: theme.spacing(2),
        },
    })
;

class OverflowComponent extends PureComponent {

    state = {
        currentScrollLeft: 0,
        currentScrollTop: 0,
        isScrollEndX: false,
        isScrollEndY: false,
        isOverflowed: false,
        isOverflowedX: false,
        isOverflowedY: false,
    };

    handleOverflowChange = ({isOverflowed, isOverflowedX, isOverflowedY}) => {
        this.setState({isOverflowed, isOverflowedX, isOverflowedY});
    };

    handleScrollChange = ({
                              currentScrollLeft,
                              currentScrollTop,
                              isScrollEndX,
                              isScrollEndY
                          }) => {
        this.setState({
            currentScrollLeft, currentScrollTop, isScrollEndX, isScrollEndY
        });
    };

    render() {
        const {
            classes,
            overflowXClassName,
            overflowYClassName,
            contentClassName,
            children,
            placeholder,
            placeholderClassName,
            placeholderDisableGutters,
            overflowXAdornment,
            overflowYAdornment,
            contentAlign,
            ...rest
        } = this.props;

        const {
            currentScrollLeft,
            currentScrollTop,
            isOverflowed,
            isOverflowedX,
            isOverflowedY,
            isScrollEndX,
            isScrollEndY,
        } = this.state;

        const showOverflowX = !currentScrollLeft && isOverflowedX;
        const showOverflowY = !currentScrollTop && isOverflowedY;

        const rClassName = placeholderDisableGutters ?
            classes.root
            : showOverflowX && showOverflowY ?
                classes.rootBoth
                : showOverflowX ?
                    (overflowXClassName || classes.rootX)
                    : showOverflowY ?
                        (overflowYClassName || classes.rootY)
                        : isOverflowedX && isOverflowedY ?
                            isScrollEndX && isScrollEndY ?
                                classes.rootBothScrollEnd
                                : classes.rootBothScrolled
                            : isOverflowedX ?
                                isScrollEndX ?
                                    classes.rootXScrollEnd
                                    : classes.rootXScrolled
                                : isOverflowedY ?
                                    isScrollEndY ?
                                        classes.rootYScrollEnd
                                        : classes.rootYScrolled
                                    : classes.root;
        const content =
            (!!this.isPlaceHolder || (isOverflowed && !!placeholder)) ?
                placeholder
                : children;
        this.isPlaceHolder = content === placeholder;
        const className = this.isPlaceHolder ?
            placeholderClassName
            : contentClassName;
        const overflowXIcon = overflowXAdornment ||
            <>
                <div className={classes.overflowXIconFab}/>
                <MoreHorizIcon className={classes.overflowXIcon}/>
            </>;
        const overflowXEndIcon = overflowXAdornment ||
            <>
                <div className={classes.overflowXEndIconFab}/>
                <MoreHorizIcon className={classes.overflowXEndIcon}/>
            </>;

        const overflowYIcon = overflowYAdornment ||
            <>
                <div className={classes.overflowYIconFab}/>
                <MoreVertIcon className={classes.overflowYIcon}/>
            </>;
        const overflowYEndIcon = overflowYAdornment ||
            <>
                <div className={classes.overflowYEndIconFab}/>
                <MoreVertIcon className={classes.overflowYEndIcon}/>
            </>;

        return (
            <div className={rClassName}>
                {(!placeholderDisableGutters && showOverflowX) &&
                overflowXIcon
                }
                {(!placeholderDisableGutters && isScrollEndX) &&
                overflowXEndIcon
                }
                {(!placeholderDisableGutters && showOverflowY) &&
                overflowYIcon
                }
                {(!placeholderDisableGutters && isScrollEndY) &&
                overflowYEndIcon
                }
                <OverflowAndScrollDetector
                    className={className}
                    onOverflowChange={this.handleOverflowChange}
                    onScrollChange={this.handleScrollChange}
                    {...rest}
                >
                    {content}
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
