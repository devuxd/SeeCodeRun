import React from 'react';
import InfiniteStickyList from "./InfiniteStickyList";
import {withStyles} from '@material-ui/core/styles';
import Inspector from "react-inspector";

const styles = theme => ({
    row: {},
    sticky: {
        backgroundColor: theme.palette.background.default,
        position: 'sticky !important',
        zIndex: 1,
    },
});

const defaultItems = new Array(200)
    .fill(true)
    .map((rowHeight, i) => ({
        label: `(${i})`,
        i,
        isActive: false
    }));

const defaultIsItemLoaded = index => !!defaultItems[index];
const defaultLoadMoreItems = (startIndex, stopIndex) => {
    for (let index = startIndex; index <= stopIndex; index++) {
        defaultItems[index] = {loading: true};
    }
    return new Promise(resolve =>
        setTimeout(() => {
            for (let index = startIndex; index <= stopIndex; index++) {
                defaultItems[index] = {
                    label: `(${index})`,
                    index,
                    isActive: false
                };
            }
            resolve();
        }, 0)
    );
};
const defaultRowContainer = forwardRef(({...props}, ref) => (
    <div ref={ref} {...props} />));
const defaultRow = ({index, style, data}) => <Inspector
    data={{height: data.itemSize(index), ...data.items[index], ...style}}/>;
const defaultStickyButton = ({isSticky, onStickyChange}) => (
    <button
        style={{position: "absolute", top: 0, left: 0, zIndex: 1}}
        onClick={onStickyChange}
    >
        {isSticky ? "*" : "-"}
    </button>
);

export const InfiniteStickyListDemo = withStyles(styles)(InfiniteStickyList);

InfiniteStickyListDemo.defaultProps = {
    items: defaultItems,
    defaultItemSize: 30,
    StickyComponent: defaultStickyButton,
    RowComponent: defaultRow,
    RowContainer: defaultRowContainer,
    isItemLoaded: defaultIsItemLoaded,
    loadMoreItems: defaultLoadMoreItems,
    stickyIndices: [],
    heightDelta: 0,
};