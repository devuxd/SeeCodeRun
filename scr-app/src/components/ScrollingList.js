import React from 'react';
import PropTypes from 'prop-types';

class ScrollingList extends React.Component {
    getSnapshotBeforeUpdate(prevProps/*, prevState*/) {
        // Are we adding new items to the list?
        // Capture the current height of the list so we can adjust scroll later.
        const {ScrollingListRef, listLength} = this.props;
        if (prevProps.listLength < listLength) {
            const list =ScrollingListRef.current
            return list.scrollHeight - list.scrollTop;
        }
        return null;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // If we have a snapshot value, we've just added new items.
        // Adjust scroll so these new items don't push the old ones out of view.
        const {ScrollingListRef} = this.props;
        if (snapshot !== null) {
            const list = ScrollingListRef.current;
            list.scrollTop = list.scrollHeight - snapshot;
        }
    }

    render() {
        const {ScrollingListRef, classes, children} = this.props;
        return (
            <div ref={ScrollingListRef} className={classes}>{children}</div>
        );
    }

    componentDidMountOFF() {
        const {ScrollingListRef, onScrollEnd, onScrollChange} = this.props;
        if (ScrollingListRef.current && (onScrollEnd || onScrollChange)) {
            this.scrollListener = (e) => {
                if (ScrollingListRef.current.offsetHeight + ScrollingListRef.current.scrollTop >= ScrollingListRef.current.scrollHeight) {
                    onScrollChange && onScrollEnd(e, true);
                } else {
                    if (ScrollingListRef.current.scrollTop === 0) {
                        onScrollEnd && onScrollEnd(e, false);
                    } else {
                        onScrollChange && onScrollChange(e, {
                            scrollHeight: ScrollingListRef.current.scrollHeight,
                            scrollTop: ScrollingListRef.current.scrollTop,
                            offsetHeight: ScrollingListRef.current.offsetHeight,
                        });
                    }
                }
            };
            ScrollingListRef.current.addEventListener('scroll', this.scrollListener);
        }
    };

    componentWillUnmountFF() {
        const {ScrollingListRef, onScrollEnd} = this.props;
        if (ScrollingListRef.current && onScrollEnd) {
            ScrollingListRef.current.removeEventListener('scroll', this.scrollListener);
        }
    };
}

ScrollingList.propTypes = {
    ScrollingListRef: PropTypes.object.isRequired,
    listLength: PropTypes.number.isRequired,
    onScrollEnd: PropTypes.func,
    onScrollChange: PropTypes.func,
    classes: PropTypes.string,
    isRememberScrollingDisabled: PropTypes.bool,
};

ScrollingList.defaultProps = {
    listLength: 0,
    isRememberScrollingDisabled: false
};


export default ScrollingList;